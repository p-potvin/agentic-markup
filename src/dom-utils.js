'use strict';

/**
 * Known CSS selectors for popular AI-chat response containers.
 * The list is checked in order; the first match wins.
 * If none match, document.body is used as the fallback.
 */
const CONTAINER_SELECTORS = [
  // ChatGPT
  '[data-message-author-role="assistant"]',
  '.markdown.prose',
  // Claude
  '[data-is-streaming]',
  '.font-claude-message',
  // Gemini
  'model-response',
  '.model-response-text',
  // Copilot / Bing Chat
  '.content[role="main"]',
  // Generic fallback classes used by many chat interfaces
  '.response-container-content',
  '.chat-response',
  '.assistant-message',
];

/**
 * Find the best root element to observe.
 *
 * @returns {Element}
 */
function findTargetNode() {
  for (const selector of CONTAINER_SELECTORS) {
    const el = document.querySelector(selector);
    if (el) return el;
  }
  return document.body;
}

module.exports = {
  CONTAINER_SELECTORS,
  findTargetNode,
};
