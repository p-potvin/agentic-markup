'use strict';

const { getNodeText } = require('../parser');

/**
 * Callout Widget
 *
 * Renders a :::callout{variant="info"} … ::: containerDirective node as a
 * styled alert box with a variant-specific icon and colour scheme.
 *
 * Expected AST node shape:
 *   {
 *     type: 'containerDirective',
 *     name: 'callout',
 *     attributes: { variant: 'info' | 'warning' | 'error' | 'success' },
 *     rawBody: string,
 *     children: [...],
 *   }
 *
 * @param {Object} node  containerDirective AST node
 * @returns {HTMLElement} The widget host element.
 */
function renderCallout(node) {
  const raw     = (node.attributes && node.attributes.variant) || 'info';
  const variant = ['info', 'warning', 'error', 'success'].includes(raw) ? raw : 'info';
  const content = getNodeText(node);

  const ICONS = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    success: '✅',
  };

  const COLORS = {
    info:    { bg: '#eff6ff', border: '#3b82f6', icon: '#2563eb', text: '#1e3a5f' },
    warning: { bg: '#fffbeb', border: '#f59e0b', icon: '#d97706', text: '#5c3d00' },
    error:   { bg: '#fff1f2', border: '#f43f5e', icon: '#e11d48', text: '#5c001c' },
    success: { bg: '#f0fdf4', border: '#22c55e', icon: '#16a34a', text: '#14532d' },
  };

  const host = document.createElement('span');
  host.classList.add('am-widget', 'am-callout-host');

  const shadow = host.attachShadow({ mode: 'open' });
  const c = COLORS[variant];

  const style = document.createElement('style');
  style.textContent = `
    .callout {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      border: 1px solid ${c.border};
      border-left: 4px solid ${c.border};
      border-radius: 6px;
      background: ${c.bg};
      padding: 12px 14px;
      margin: 8px 0;
      font-family: inherit;
      color: ${c.text};
      line-height: 1.6;
    }
    .icon { font-size: 1.1em; flex-shrink: 0; margin-top: 1px; }
    .body { white-space: pre-wrap; }
  `;

  const callout = document.createElement('div');
  callout.classList.add('callout');

  const icon = document.createElement('span');
  icon.classList.add('icon');
  icon.textContent = ICONS[variant];

  const body = document.createElement('div');
  body.classList.add('body');
  body.textContent = content;

  callout.appendChild(icon);
  callout.appendChild(body);
  shadow.appendChild(style);
  shadow.appendChild(callout);

  return host;
}

module.exports = { renderCallout };

