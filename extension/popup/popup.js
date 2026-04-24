/**
 * Agentic Markup — Popup Script
 *
 * Queries the active tab to check whether the content script is running and
 * whether any widgets have been hydrated on the current page.
 */
document.addEventListener('DOMContentLoaded', () => {
  const subtitle = document.querySelector('.subtitle');
  if (!subtitle) return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab) return;

    const url = tab.url || '';
    const SUPPORTED = [
      'chatgpt.com',
      'chat.openai.com',
      'claude.ai',
      'gemini.google.com',
      'copilot.microsoft.com',
      'bing.com/chat',
    ];

    const isSupported = SUPPORTED.some(host => url.includes(host));
    subtitle.textContent = isSupported
      ? '✅ Active on this page'
      : '⏸ Not active on this page';
  });
});
