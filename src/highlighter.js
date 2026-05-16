'use strict';

/**
 * Lightweight syntax highlighter for code snippets in widgets.
 * Currently supports a basic JavaScript/TypeScript-like syntax.
 */

// Hoisted global regular expression.
// IMPORTANT: `lastIndex` must be reset to 0 before each use!
const TOKENS_RE = /((?:\/\*[\s\S]*?\*\/)|(?:\/\/.*))|(["'`].*?["'`])|(\b(?:const|let|var|function|return|if|else|for|while|import|export|class|extends|new|try|catch|switch|case|default|break|continue|async|await|true|false|null|undefined)\b)|(\b\d+(?:\.\d+)?\b)/g;

/**
 * Escapes HTML entities to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Applies syntax highlighting to the given text.
 * Returns an HTML string with `<span>` tags.
 *
 * @param {string} text The raw source code.
 * @param {string} lang The language identifier (e.g. 'javascript').
 * @returns {string} HTML string with syntax highlighting spans.
 */
function applyHighlight(text, lang) {
  if (typeof text !== 'string' || !text) return '';

  // Currently, we only have a generic JS/TS-like highlighter.
  // In a real scenario, `lang` could select different regexes.

  try {
    // Reset global regex state
    TOKENS_RE.lastIndex = 0;

    let result = '';
    let lastIndex = 0;
    let match;

    while ((match = TOKENS_RE.exec(text)) !== null) {
      // Append unescaped text before the match
      if (match.index > lastIndex) {
        result += escapeHtml(text.slice(lastIndex, match.index));
      }

      const token = match[0];
      const escapedToken = escapeHtml(token);

      if (match[1]) {
        // Comment
        result += `<span class="hl-comment">${escapedToken}</span>`;
      } else if (match[2]) {
        // String
        result += `<span class="hl-string">${escapedToken}</span>`;
      } else if (match[3]) {
        // Keyword
        result += `<span class="hl-keyword">${escapedToken}</span>`;
      } else if (match[4]) {
        // Number
        result += `<span class="hl-number">${escapedToken}</span>`;
      }

      lastIndex = TOKENS_RE.lastIndex;
    }

    // Append remaining text
    if (lastIndex < text.length) {
      result += escapeHtml(text.slice(lastIndex));
    }

    return result;
  } catch (error) {
    console.error('Syntax highlighting failed:', error);
    // Fallback: return escaped raw text
    return escapeHtml(text);
  }
}

module.exports = { applyHighlight, escapeHtml };
