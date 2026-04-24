'use strict';

/**
 * Agentic Markup — Content Script Entry Point
 *
 * This file is bundled by esbuild into extension/content.js and injected into
 * every page matched by the manifest's content_scripts configuration.
 *
 * Execution flow:
 *  1. Wait for the DOM to be ready.
 *  2. Locate known AI-chat response containers (or fall back to document.body).
 *  3. Attach a MutationObserver via attachObserver() to detect and hydrate
 *     custom markup widgets as they stream in.
 */

const { attachObserver } = require('./observer');

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

function init() {
  const target = findTargetNode();
  attachObserver(target);

  // Re-scan if the single-page app navigates and replaces the container.
  const appObserver = new MutationObserver(() => {
    const newTarget = findTargetNode();
    if (newTarget !== target) {
      appObserver.disconnect();
      attachObserver(newTarget);
    }
  });

  appObserver.observe(document.body, { childList: true, subtree: false });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
