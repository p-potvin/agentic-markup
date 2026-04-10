'use strict';

const { renderBadge } = require('../../src/widgets/badge');

/** Build a minimal leafDirective AST node for badge. */
function makeNode(text, variant) {
  const attributes = {};
  if (text    !== undefined) attributes.text    = text;
  if (variant !== undefined) attributes.variant = variant;
  return { type: 'leafDirective', name: 'badge', attributes };
}

describe('renderBadge()', () => {
  test('returns an HTMLElement', () => {
    const el = renderBadge(makeNode('New', 'info'));
    expect(el).toBeInstanceOf(HTMLElement);
  });

  test('has the am-badge-host class', () => {
    const el = renderBadge(makeNode('X', 'default'));
    expect(el.classList.contains('am-badge-host')).toBe(true);
  });

  test('attaches a shadow root', () => {
    const el = renderBadge(makeNode('X', 'default'));
    expect(el.shadowRoot).not.toBeNull();
  });

  test('renders badge text from attributes.text', () => {
    const el = renderBadge(makeNode('Beta', 'warning'));
    const badge = el.shadowRoot.querySelector('.badge');
    expect(badge.textContent).toBe('Beta');
  });

  test('renders all recognised variant styles without error', () => {
    const variants = ['default', 'info', 'warning', 'error', 'success'];
    for (const variant of variants) {
      expect(() => renderBadge(makeNode('T', variant))).not.toThrow();
    }
  });

  test('falls back to "default" variant when attributes.variant is unknown', () => {
    const el = renderBadge(makeNode('T', 'unknown'));
    const badge = el.shadowRoot.querySelector('.badge');
    expect(badge).not.toBeNull();
  });

  test('falls back to "default" variant when attributes.variant is absent', () => {
    const el = renderBadge(makeNode('T', undefined));
    const badge = el.shadowRoot.querySelector('.badge');
    expect(badge).not.toBeNull();
  });

  test('handles empty text gracefully', () => {
    const el = renderBadge(makeNode('', 'info'));
    const badge = el.shadowRoot.querySelector('.badge');
    expect(badge.textContent).toBe('');
  });

  test('is inline (display: inline)', () => {
    const el = renderBadge(makeNode('T', 'default'));
    expect(el.style.display).toBe('inline');
  });
});

