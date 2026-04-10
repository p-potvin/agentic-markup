/**
 * Agentic Markup — Service Worker (MV3 background script)
 *
 * Handles extension lifecycle events and context-menu registration.
 * Kept minimal; all heavy lifting is done in the content script.
 */

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    console.log('[Agentic Markup] Extension installed.');
  }
  if (reason === 'update') {
    console.log('[Agentic Markup] Extension updated.');
  }
});
