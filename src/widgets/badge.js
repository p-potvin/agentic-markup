'use strict';

/**
 * Badge Widget
 *
 * Renders a :::badge{text="New" variant="success"}::: leafDirective node as a
 * compact inline pill/badge.
 *
 * Expected AST node shape:
 *   {
 *     type: 'leafDirective',
 *     name: 'badge',
 *     attributes: { text: string, variant?: string },
 *   }
 *
 * Variants: default (fallback) | info | warning | error | success
 *
 * @param {Object} node  leafDirective AST node
 * @returns {HTMLElement} The widget host element.
 */
function renderBadge(node) {
  const text    = (node.attributes && node.attributes.text)    || '';
  const rawVar  = (node.attributes && node.attributes.variant) || 'default';
  const variant = ['default', 'info', 'warning', 'error', 'success'].includes(rawVar)
    ? rawVar
    : 'default';

  const COLORS = {
    default: { bg: '#f3f4f6', border: '#d1d5db', text: '#374151' },
    info:    { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af' },
    warning: { bg: '#fef9c3', border: '#fde047', text: '#854d0e' },
    error:   { bg: '#ffe4e6', border: '#fca5a5', text: '#9f1239' },
    success: { bg: '#dcfce7', border: '#86efac', text: '#166534' },
  };

  const host = document.createElement('span');
  host.classList.add('am-widget', 'am-badge-host');
  host.style.display = 'inline';

  const shadow = host.attachShadow({ mode: 'open' });
  const c = COLORS[variant];

  const style = document.createElement('style');
  style.textContent = `
    .badge {
      display: inline-block;
      padding: 1px 8px;
      border-radius: 999px;
      border: 1px solid ${c.border};
      background: ${c.bg};
      color: ${c.text};
      font-size: 0.75em;
      font-weight: 600;
      font-family: inherit;
      line-height: 1.5;
      vertical-align: middle;
      white-space: nowrap;
    }
  `;

  const badge = document.createElement('span');
  badge.classList.add('badge');
  badge.textContent = text;

  shadow.appendChild(style);
  shadow.appendChild(badge);

  return host;
}

module.exports = { renderBadge };

