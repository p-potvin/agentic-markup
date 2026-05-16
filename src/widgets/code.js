'use strict';

const { getNodeText } = require('../parser');

/**
 * Code Widget
 *
 * Renders a :::code{language="..."} … ::: containerDirective node as a
 * native <pre><code> block wrapped in a Shadow DOM host. Includes a
 * "Copy to Clipboard" button.
 *
 * @param {Object} node containerDirective AST node
 * @returns {HTMLElement} The widget host element.
 */
function renderCode(node) {
  const language = (node.attributes && node.attributes.language) || 'plaintext';
  const content = getNodeText(node);

  const host = document.createElement('span');
  host.classList.add('am-widget', 'am-code-host');

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    .code-container {
      position: relative;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      margin: 8px 0;
      background: #282c34; /* Dark theme */
      color: #abb2bf;
      font-family: 'Inter', sans-serif;
      overflow: hidden;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #21252b;
      padding: 6px 12px;
      font-size: 0.85em;
      border-bottom: 1px solid #181a1f;
    }
    .language-label {
      color: #5c6370;
      font-weight: 600;
      text-transform: uppercase;
    }
    .copy-btn {
      background: transparent;
      border: 1px solid #3e4451;
      color: #abb2bf;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 0.9em;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }
    .copy-btn:hover {
      background: #3e4451;
      color: #ffffff;
    }
    .copy-btn.copied {
      background: #98c379;
      color: #282c34;
      border-color: #98c379;
    }
    pre {
      margin: 0;
      padding: 12px;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 0.9em;
      line-height: 1.5;
    }
    code {
      font-family: inherit;
    }
  `;

  const container = document.createElement('div');
  container.classList.add('code-container');

  const header = document.createElement('div');
  header.classList.add('header');

  const langLabel = document.createElement('span');
  langLabel.classList.add('language-label');
  langLabel.textContent = language;

  const copyBtn = document.createElement('button');
  copyBtn.classList.add('copy-btn');
  copyBtn.textContent = 'Copy';
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(content).then(() => {
      copyBtn.textContent = 'Copied!';
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
        copyBtn.classList.remove('copied');
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      copyBtn.textContent = 'Error';
    });
  });

  header.appendChild(langLabel);
  header.appendChild(copyBtn);

  const pre = document.createElement('pre');
  const codeEl = document.createElement('code');
  codeEl.textContent = content; // Using textContent prevents XSS
  pre.appendChild(codeEl);

  container.appendChild(header);
  container.appendChild(pre);

  shadow.appendChild(style);
  shadow.appendChild(container);

  return host;
}

module.exports = { renderCode };
