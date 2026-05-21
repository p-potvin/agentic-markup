'use strict';

const mermaid = require('mermaid').default;
const { getNodeText } = require('../parser');

// Initialize mermaid
mermaid.initialize({ startOnLoad: false });

/**
 * Mermaid Widget
 *
 * Renders a :::mermaid … ::: containerDirective node as an SVG diagram
 * using mermaid.js, wrapped in a Shadow DOM host.
 *
 * @param {Object} node  containerDirective AST node
 * @returns {HTMLElement} The widget host element (not yet attached to the DOM).
 */
function renderMermaid(node) {
  const content = getNodeText(node);

  const host = document.createElement('span');
  host.classList.add('am-widget', 'am-mermaid-host');

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    .mermaid-container {
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 12px;
      margin: 8px 0;
      font-family: inherit;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
      position: relative;
    }
    .copy-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 4px 8px;
      font-size: 0.75em;
      font-weight: normal;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: #ffffff;
      cursor: pointer;
      color: #374151;
      transition: background 0.15s;
      z-index: 10;
    }
    .copy-btn:hover {
      background: #f3f4f6;
    }
    .mermaid-content {
      overflow-x: auto;
      text-align: center;
    }
    .error {
      color: #9f1239;
      white-space: pre-wrap;
      font-family: monospace;
      text-align: left;
    }
  `;

  const containerDiv = document.createElement('div');
  containerDiv.classList.add('mermaid-container');

  const copyBtn = document.createElement('button');
  copyBtn.className = 'copy-btn';
  copyBtn.textContent = 'Copy Source';
  copyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy Source'; }, 2000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    } else {
      console.error('Clipboard API not supported');
    }
  });

  const contentDiv = document.createElement('div');
  contentDiv.classList.add('mermaid-content');

  // Mermaid generates unique IDs for each diagram
  const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);

  try {
    // Render the SVG synchronously/asynchronously depending on Mermaid version.
    // Mermaid 10+ uses async render
    mermaid.render(id, content).then((result) => {
        contentDiv.innerHTML = result.svg;
    }).catch((err) => {
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('error');
        errorDiv.textContent = 'Mermaid syntax error:\n' + err.message;
        contentDiv.appendChild(errorDiv);
    });
  } catch (err) {
    const errorDiv = document.createElement('div');
    errorDiv.classList.add('error');
    errorDiv.textContent = 'Mermaid rendering error:\n' + err.message;
    contentDiv.appendChild(errorDiv);
  }

  containerDiv.appendChild(copyBtn);
  containerDiv.appendChild(contentDiv);
  shadow.appendChild(style);
  shadow.appendChild(containerDiv);

  return host;
}

module.exports = { renderMermaid };
