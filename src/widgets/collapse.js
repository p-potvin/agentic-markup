'use strict';

/**
 * Collapse Widget
 *
 * Renders a :::collapse[Title] content ::: marker as a native <details>/<summary>
 * element wrapped in a Shadow DOM host, isolating its styles from the host page.
 *
 * @param {{ title: string, content: string }} data
 * @returns {HTMLElement} The widget host element (not yet attached to the DOM).
 */
function renderCollapse(data) {
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
    .content {
      padding: 12px 14px;
      white-space: pre-wrap;
      line-height: 1.6;
    }
  `;

  const details = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = data.title || 'Details';

  const contentDiv = document.createElement('div');
  contentDiv.classList.add('content');
  contentDiv.textContent = data.content || '';

  details.appendChild(summary);
  details.appendChild(contentDiv);
  shadow.appendChild(style);
  shadow.appendChild(details);

  return host;
}

module.exports = { renderCollapse };
