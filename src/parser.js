'use strict';

/**
 * Agentic Markup Parser
 *
 * Converts the flat token stream produced by the tokenizer into an Abstract
 * Syntax Tree (AST).
 *
 * AST node types
 * ──────────────
 *   root              — top-level document container
 *   text              — plain text (value: string)
 *   paragraph         — block of text within a directive body (children: text[])
 *   containerDirective— block directive (name, attributes, rawBody, children)
 *   leafDirective     — self-closing / inline directive (name, attributes)
 *
 * Attribute syntax (new)
 * ──────────────────────
 *   :::collapse{summary="Title"}
 *   :::callout{variant="warning"}
 *   :::tabs{titles="Tab 1|Tab 2"}
 *   :::badge{text="New" variant="success"}:::
 */

const { tokenize, TOKEN } = require('./tokenizer');

// ── Body text helpers ─────────────────────────────────────────────────────────

/**
 * Convert a raw body string into an array of paragraph AST nodes.
 * Paragraphs are delimited by one or more consecutive blank lines.
 *
 * @param {string} bodyText
 * @returns {Array<{type:'paragraph', children: Array<{type:'text',value:string}>}>}
 */
function bodyToParagraphs(bodyText) {
  if (!bodyText || !bodyText.trim()) return [];
  // Normalise Windows (CRLF) and old Mac (CR) line endings before splitting.
  const normalised = bodyText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return normalised
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean)
    .map(block => ({
      type: 'paragraph',
      children: [{ type: 'text', value: block }],
    }));
}

/**
 * Recursively extract all text content from an AST node's children.
 * Joins paragraph content with a single newline.
 *
 * @param {Object} node  Any AST node (root, containerDirective, paragraph, text…)
 * @returns {string}
 */
function getNodeText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.value || '';
  if (node.rawBody !== undefined) return node.rawBody;
  if (Array.isArray(node.children)) {
    return node.children.map(getNodeText).filter(Boolean).join('\n');
  }
  return '';
}

// ── AST builder ───────────────────────────────────────────────────────────────

/**
 * Parse a text string into an AST.
 *
 * Algorithm:
 *   1. Tokenize the input with the FSM tokenizer.
 *   2. Maintain a node stack.  The top of the stack is the "current" parent
 *      where new children are appended.
 *   3. DIRECTIVE_OPEN pushes a new containerDirective node onto the stack.
 *   4. DIRECTIVE_BODY text is parsed into paragraph children and also stored
 *      verbatim in `rawBody` (needed by, e.g., the tabs widget for --- splitting).
 *   5. DIRECTIVE_CLOSE pops the stack.
 *   6. LEAF_DIRECTIVE appends a leafDirective node without changing the stack.
 *
 * @param {string} text
 * @returns {{ type: 'root', children: Array<Object> }}
 */
function parse(text) {
  const tokens = tokenize(text);
  const root   = { type: 'root', children: [] };
  const stack  = [root];

  /** The node currently receiving new children. */
  function current() { return stack[stack.length - 1]; }

  for (const token of tokens) {
    switch (token.type) {

      case TOKEN.TEXT: {
        current().children.push({ type: 'text', value: token.value });
        break;
      }

      case TOKEN.DIRECTIVE_OPEN: {
        const node = {
          type:       'containerDirective',
          name:       token.name,
          attributes: token.attributes,
          rawBody:    '',
          children:   [],
        };
        current().children.push(node);
        stack.push(node);
        break;
      }

      case TOKEN.DIRECTIVE_BODY: {
        // Store raw body text on the directive node for widgets that need it
        // (e.g. tabs splits on \n---\n).
        const node = current();
        if (node.rawBody !== undefined) {
          node.rawBody = node.rawBody
            ? node.rawBody + '\n' + token.value
            : token.value;
        }
        // Also parse into paragraph children so generic consumers get structure.
        const paragraphs = bodyToParagraphs(token.value);
        paragraphs.forEach(p => node.children.push(p));
        break;
      }

      case TOKEN.DIRECTIVE_CLOSE: {
        if (stack.length > 1) stack.pop();
        break;
      }

      case TOKEN.LEAF_DIRECTIVE: {
        current().children.push({
          type:       'leafDirective',
          name:       token.name,
          attributes: token.attributes,
        });
        break;
      }

      default:
        break;
    }
  }

  return root;
}

/**
 * Determine whether a text string contains an unclosed directive.
 *
 * Uses the tokenizer to count DIRECTIVE_OPEN vs DIRECTIVE_CLOSE tokens.
 * A positive difference means the stream is still being completed (e.g.
 * the LLM is still generating).
 *
 * @param {string} text
 * @returns {boolean}
 */
function hasIncompleteWidget(text) {
  const tokens = tokenize(text);
  let depth = 0;
  for (const t of tokens) {
    if (t.type === TOKEN.DIRECTIVE_OPEN)  depth++;
    if (t.type === TOKEN.DIRECTIVE_CLOSE) depth--;
  }
  return depth > 0;
}

module.exports = { parse, getNodeText, bodyToParagraphs, hasIncompleteWidget };

