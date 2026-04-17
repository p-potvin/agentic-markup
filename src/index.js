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
const { findTargetNode } = require('./dom-utils');

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
