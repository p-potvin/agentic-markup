'use strict';

/**
 * Agentic Markup Tokenizer
 *
 * A Finite State Machine (FSM) that processes a character stream line by line
 * and emits a flat token array for downstream AST construction.
 *
 * Supported directive forms
 * ─────────────────────────
 *   Block (containerDirective):
 *     :::name{key="value"}
 *     body content (may span multiple lines, may be nested)
 *     :::
 *
 *   Leaf (leafDirective) — self-closing on one line:
 *     :::name{key="value"}:::
 *
 *   Inline leaf — embedded within a text line:
 *     Some text :::name{key="value"}::: more text
 *
 * Attribute syntax
 * ────────────────
 *   {key="value" key2="value2"}
 *   Values may be double-quoted (to allow spaces) or unquoted (word chars,
 *   hyphens, underscores, pipes, and dots only).
 *
 * FSM states
 * ──────────
 *   OUTER    — outside any directive block; accumulating plain text lines.
 *   IN_BLOCK — inside a block directive; accumulating body lines.
 *              Nesting is tracked with a depth counter so that inner directives
 *              (e.g. :::tabs inside :::callout) stay within their scope.
 */

// ── Token type constants ──────────────────────────────────────────────────────

/** @enum {string} */
const TOKEN = Object.freeze({
  /** Plain text outside any directive. */
  TEXT:            'TEXT',
  /** Opening fence of a block directive: :::name{attrs} */
  DIRECTIVE_OPEN:  'DIRECTIVE_OPEN',
  /** One or more body lines accumulated inside a block directive. */
  DIRECTIVE_BODY:  'DIRECTIVE_BODY',
  /** Closing fence of a block directive: ::: */
  DIRECTIVE_CLOSE: 'DIRECTIVE_CLOSE',
  /** Self-closing leaf directive: :::name{attrs}::: */
  LEAF_DIRECTIVE:  'LEAF_DIRECTIVE',
});

// ── Line-level regular expressions ───────────────────────────────────────────

// A line that is entirely a self-closing leaf:  :::name{...}:::
const RE_LEAF_LINE  = /^:::([\w-]+)(\{[^}]*\})?:::\s*$/;

// A line that opens a block directive:  :::name  or  :::name{...}
const RE_OPEN_LINE  = /^:::([\w-]+)(\{[^}]*\})?\s*$/;

// A line that closes a block directive:  :::  (nothing else on the line)
const RE_CLOSE_LINE = /^:::\s*$/;

// Inline leaf occurrences anywhere within an arbitrary text line.
// NOTE: this regex is used with exec() in a loop — always reset lastIndex.
const RE_INLINE_LEAF = /:::([\w-]+)(\{[^}]*\})?:::/g;

// ── Attribute parser ──────────────────────────────────────────────────────────

/**
 * Parse a `{key="value" …}` attribute string into a plain object.
 *
 * Supported value formats:
 *   key="quoted value"   — double-quoted; allows spaces and special chars
 *   key=unquoted         — word characters, hyphens, underscores, pipes, dots
 *
 * @param {string|undefined} raw  e.g. `{summary="My Title" variant="info"}`
 * @returns {Object} Parsed attribute map (empty object if raw is absent/empty).
 */
function parseAttributes(raw) {
  const attrs = Object.create(null);
  if (!raw) return attrs;
  const inner = raw.slice(1, -1); // strip surrounding { }
  // Matches:  key = "quoted value"   OR   key = unquoted
  // Unquoted values may contain any character that is not whitespace,
  // a closing brace, a double-quote, or a single-quote (e.g. word chars,
  // hyphens, underscores, pipes, and dots).
  const re = /([\w-]+)\s*=\s*(?:"([^"]*)"|([^\s}"']*))/g;
  let m;
  while ((m = re.exec(inner)) !== null) {
    // m[2] is the quoted value; m[3] is the unquoted value
    attrs[m[1]] = m[2] !== undefined ? m[2] : m[3];
  }
  return attrs;
}

// ── FSM Tokenizer ─────────────────────────────────────────────────────────────

/**
 * Tokenize a text string into a flat array of tokens.
 *
 * The FSM processes the input one line at a time and tracks block nesting
 * depth so that inner container directives do not prematurely close an outer
 * scope.
 *
 * @param {string} text  The raw input string (may contain newlines).
 * @returns {Array<Object>} Flat, ordered token array.
 */
function tokenize(text) {
  const tokens = [];
  const lines  = text.split('\n');

  // FSM state
  let state = 'OUTER';
  let depth = 0;

  // Line accumulators
  const textBuf = []; // plain text lines (OUTER state)
  const bodyBuf = []; // body lines (IN_BLOCK state)

  /** Flush accumulated plain-text lines as a TEXT token. */
  function flushText() {
    if (textBuf.length === 0) return;
    const value = textBuf.join('\n');
    textBuf.length = 0;
    if (value === '') return; // skip empty-string-only flush
    tokens.push({ type: TOKEN.TEXT, value });
  }

  /** Flush accumulated body lines as a DIRECTIVE_BODY token. */
  function flushBody() {
    if (bodyBuf.length === 0) return;
    tokens.push({ type: TOKEN.DIRECTIVE_BODY, value: bodyBuf.join('\n') });
    bodyBuf.length = 0;
  }

  for (const line of lines) {
    // ── OUTER state ────────────────────────────────────────────────────────
    if (state === 'OUTER') {
      if (RE_LEAF_LINE.test(line)) {
        // Entire line is a self-closing leaf directive.
        flushText();
        const m = RE_LEAF_LINE.exec(line);
        tokens.push({
          type:       TOKEN.LEAF_DIRECTIVE,
          name:       m[1],
          attributes: parseAttributes(m[2]),
        });

      } else if (RE_OPEN_LINE.test(line)) {
        // Opening fence — enter IN_BLOCK state.
        flushText();
        const m = RE_OPEN_LINE.exec(line);
        tokens.push({
          type:       TOKEN.DIRECTIVE_OPEN,
          name:       m[1],
          attributes: parseAttributes(m[2]),
        });
        depth++;
        state = 'IN_BLOCK';

      } else {
        // Check for inline leaf directives embedded within this text line.
        RE_INLINE_LEAF.lastIndex = 0;
        if (RE_INLINE_LEAF.test(line)) {
          flushText();
          RE_INLINE_LEAF.lastIndex = 0;
          let last = 0;
          let m;
          while ((m = RE_INLINE_LEAF.exec(line)) !== null) {
            if (m.index > last) {
              tokens.push({ type: TOKEN.TEXT, value: line.slice(last, m.index) });
            }
            tokens.push({
              type:       TOKEN.LEAF_DIRECTIVE,
              name:       m[1],
              attributes: parseAttributes(m[2]),
            });
            last = m.index + m[0].length;
          }
          if (last < line.length) {
            tokens.push({ type: TOKEN.TEXT, value: line.slice(last) });
          }
        } else {
          // Ordinary text line — accumulate.
          textBuf.push(line);
        }
      }

    // ── IN_BLOCK state ──────────────────────────────────────────────────────
    } else {
      if (RE_CLOSE_LINE.test(line)) {
        // Closing fence — decrement depth.
        flushBody();
        tokens.push({ type: TOKEN.DIRECTIVE_CLOSE });
        depth--;
        if (depth === 0) {
          state = 'OUTER';
        }

      } else if (RE_OPEN_LINE.test(line)) {
        // Nested block directive opening — flush body and emit OPEN token.
        flushBody();
        const m = RE_OPEN_LINE.exec(line);
        tokens.push({
          type:       TOKEN.DIRECTIVE_OPEN,
          name:       m[1],
          attributes: parseAttributes(m[2]),
        });
        depth++;

      } else {
        // Regular body line — accumulate.
        bodyBuf.push(line);
      }
    }
  }

  // ── End of input ──────────────────────────────────────────────────────────
  // Flush anything remaining. If we are still IN_BLOCK the directive was never
  // closed (e.g. streaming not yet complete). Emit whatever we have so the
  // hasIncompleteWidget() check can detect the unclosed open token.
  flushBody();
  flushText();

  return tokens;
}

module.exports = { tokenize, parseAttributes, TOKEN };
