'use strict';

const { getNodeText } = require('../parser');

/**
 * Collapse Widget
 *
 * Renders a :::collapse{summary="Title"} … ::: containerDirective node as a
 * native <details>/<summary> element wrapped in a Shadow DOM host, isolating
 * its styles from the host page.
 *
 * Expected AST node shape:
 *   {
 *     type: 'containerDirective',
 *     name: 'collapse',
 *     attributes: { summary: string },
 *     rawBody: string,
 *     children: [...],
 *   }
 *
 * @param {Object} node  containerDirective AST node
 * @returns {HTMLElement} The widget host element (not yet attached to the DOM).
 */
function renderCollapse(node) {
  const title   = (node.attributes && node.attributes.summary) || 'Details';
  const content = getNodeText(node);

  const host = document.createElement('span');
  host.classList.add('am-widget', 'am-collapse-host');

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    details {
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 0;
      margin: 8px 0;
      font-family: inherit;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
      overflow: hidden;
    }
    summary {
      cursor: pointer;
      padding: 10px 14px;
      font-weight: 600;
      user-select: none;
      list-style: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      background: #f9fafb;
      border-bottom: 1px solid transparent;
      transition: background 0.15s;
    }
    summary::-webkit-details-marker { display: none; }
    summary::before {
      content: '▶';
      font-size: 0.7em;
      transition: transform 0.2s;
    }
    details[open] summary {
      border-bottom-color: #d1d5db;
      background: #f3f4f6;
    }
    details[open] summary::before { transform: rotate(90deg); }
    .copy-btn {
      margin-left: auto;
      padding: 4px 8px;
      font-size: 0.75em;
      font-weight: normal;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: #ffffff;
      cursor: pointer;
      color: #374151;
      transition: background 0.15s;
    }
    .copy-btn:hover {
      background: #f3f4f6;
    }
    .content {
      padding: 12px 14px;
      white-space: pre-wrap;
      line-height: 1.6;
    }
  `;

  const details = document.createElement('details');
  const summary = document.createElement('summary');

  const titleSpan = document.createElement('span');
  titleSpan.textContent = title;

  const copyBtn = document.createElement('button');
  copyBtn.className = 'copy-btn';
  copyBtn.textContent = 'Copy';
  copyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const textToCopy = typeof node.rawBody === 'string' ? node.rawBody : '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    } else {
      console.error('Clipboard API not supported');
    }
  });

  summary.appendChild(titleSpan);
  summary.appendChild(copyBtn);

  const contentDiv = document.createElement('div');
  contentDiv.classList.add('content');
  contentDiv.textContent = content;

  details.appendChild(summary);
  details.appendChild(contentDiv);
  shadow.appendChild(style);
  shadow.appendChild(details);

  return host;
}

module.exports = { renderCollapse };

