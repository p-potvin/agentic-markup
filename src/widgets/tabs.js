'use strict';

const { getNodeText } = require('../parser');

/**
 * Tabs Widget
 *
 * Renders a :::tabs{titles="Tab 1|Tab 2"} … ::: containerDirective node as an
 * interactive tabbed panel.
 *
 * Tab titles are declared in the `titles` attribute, separated by `|`.
 * Tab bodies are delimited by a line containing only `---` within the directive
 * body.  The rawBody string (stored verbatim on the AST node) is used for this
 * split so blank-line paragraph parsing does not interfere.
 *
 * Expected AST node shape:
 *   {
 *     type: 'containerDirective',
 *     name: 'tabs',
 *     attributes: { titles: 'Tab 1|Tab 2' },
 *     rawBody: 'Tab 1 content\n---\nTab 2 content',
 *     children: [...],
 *   }
 *
 * @param {Object} node  containerDirective AST node
 * @returns {HTMLElement} The widget host element.
 */
function renderTabs(node) {
  const titlesAttr = (node.attributes && node.attributes.titles) || '';
  const titles = titlesAttr.split('|').map(t => t.trim()).filter(Boolean);

  // Use rawBody for splitting on --- so blank-line paragraph parsing does not
  // interfere with the tab separator.
  const raw  = getNodeText(node);
  const tabs = raw ? raw.split(/\n---\n/).map(t => t.trim()) : [];

  const host = document.createElement('span');
  host.classList.add('am-widget', 'am-tabs-host');

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    .tabs-container {
      border: 1px solid #d1d5db;
      border-radius: 6px;
      overflow: hidden;
      margin: 8px 0;
      font-family: inherit;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
    }
    .tab-bar {
      display: flex;
      background: #f3f4f6;
      border-bottom: 1px solid #d1d5db;
      overflow-x: auto;
    }
    .tab-btn {
      padding: 8px 16px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      color: #6b7280;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      white-space: nowrap;
      transition: color 0.15s, border-color 0.15s;
    }
    .tab-btn:hover { color: #374151; }
    .tab-btn.active {
      color: #1d4ed8;
      border-bottom-color: #1d4ed8;
      background: #ffffff;
    }
    .copy-btn {
      margin-left: auto;
      margin-right: 8px;
      margin-top: 8px;
      margin-bottom: 8px;
      padding: 4px 8px;
      font-size: 0.75rem;
      font-family: inherit;
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
    .tab-panel {
      display: none;
      padding: 14px;
      white-space: pre-wrap;
      line-height: 1.6;
    }
    .tab-panel.active { display: block; }
  `;

  const container = document.createElement('div');
  container.classList.add('tabs-container');

  const tabBar = document.createElement('div');
  tabBar.classList.add('tab-bar');

  const copyBtn = document.createElement('button');
  copyBtn.className = 'copy-btn';
  copyBtn.textContent = 'Copy';
  copyBtn.type = 'button';
  copyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(raw).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    } else {
      console.error('Clipboard API not supported');
    }
  });

  const panels = [];
  const panelContainer = document.createElement('div');

  titles.forEach((title, i) => {
    // Tab button
    const btn = document.createElement('button');
    btn.classList.add('tab-btn');
    if (i === 0) btn.classList.add('active');
    btn.textContent = title;
    btn.setAttribute('type', 'button');

    // Tab panel
    const panel = document.createElement('div');
    panel.classList.add('tab-panel');
    if (i === 0) panel.classList.add('active');
    panel.textContent = tabs[i] !== undefined ? tabs[i] : '';
    panels.push(panel);
    panelContainer.appendChild(panel);

    btn.addEventListener('click', () => {
      tabBar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      panel.classList.add('active');
    });

    tabBar.appendChild(btn);
  });

  tabBar.appendChild(copyBtn);

  container.appendChild(tabBar);
  container.appendChild(panelContainer);
  shadow.appendChild(style);
  shadow.appendChild(container);

  return host;
}

module.exports = { renderTabs };

