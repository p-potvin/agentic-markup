'use strict';

const { renderBadge } = require('../../src/widgets/badge');

describe('renderBadge()', () => {
  test('returns an HTMLElement', () => {
    const el = renderBadge({ text: 'New', variant: 'info' });
    expect(el).toBeInstanceOf(HTMLElement);
  });

  test('has the am-badge-host class', () => {
    const el = renderBadge({ text: 'X', variant: 'default' });
    expect(el.classList.contains('am-badge-host')).toBe(true);
  });

  test('attaches a shadow root', () => {
    const el = renderBadge({ text: 'X', variant: 'default' });
    expect(el.shadowRoot).not.toBeNull();
  });

  test('renders badge text correctly', () => {
    const el = renderBadge({ text: 'Beta', variant: 'warning' });
    const badge = el.shadowRoot.querySelector('.badge');
    expect(badge.textContent).toBe('Beta');
  });

  test('renders all recognised variant styles without error', () => {
    const variants = ['default', 'info', 'warning', 'error', 'success'];
    for (const variant of variants) {
      expect(() => renderBadge({ text: 'T', variant })).not.toThrow();
    }
  });

  test('falls back to "default" for unknown variant', () => {
    const el = renderBadge({ text: 'T', variant: 'unknown' });
    // Should still render a badge element
    const badge = el.shadowRoot.querySelector('.badge');
    expect(badge).not.toBeNull();
  });

  test('handles empty text gracefully', () => {
    const el = renderBadge({ text: '', variant: 'info' });
    const badge = el.shadowRoot.querySelector('.badge');
    expect(badge.textContent).toBe('');
  });

  test('is inline (display: inline)', () => {
    const el = renderBadge({ text: 'T', variant: 'default' });
    expect(el.style.display).toBe('inline');
  });
});
