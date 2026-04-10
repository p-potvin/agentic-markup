'use strict';

/**
 * Tabs Widget
 *
 * Renders a :::tabs[Tab 1|Tab 2] content1\n---\ncontent2 ::: marker as an
 * interactive tabbed panel.
 *
 * @param {{ titles: string[], tabs: string[] }} data
 * @returns {HTMLElement} The widget host element.
 */
function renderTabs(data) {
  const titles = Array.isArray(data.titles) ? data.titles : [];
  const tabs   = Array.isArray(data.tabs)   ? data.tabs   : [];

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

  container.appendChild(tabBar);
  container.appendChild(panelContainer);
  shadow.appendChild(style);
  shadow.appendChild(container);

  return host;
}

module.exports = { renderTabs };
