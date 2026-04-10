'use strict';

const { renderCallout } = require('../../src/widgets/callout');

/** Build a minimal containerDirective AST node for callout. */
function makeNode(variant, body) {
  return {
    type:       'containerDirective',
    name:       'callout',
    attributes: variant !== undefined ? { variant } : {},
    rawBody:    body || '',
    children:   [],
  };
}

describe('renderCallout()', () => {
  test('returns an HTMLElement', () => {
    const el = renderCallout(makeNode('info', 'Hello'));
    expect(el).toBeInstanceOf(HTMLElement);
  });

  test('has the am-callout-host class', () => {
    const el = renderCallout(makeNode('info', 'Hello'));
    expect(el.classList.contains('am-callout-host')).toBe(true);
  });

  test('attaches a shadow root', () => {
    const el = renderCallout(makeNode('warning', 'Watch out'));
    expect(el.shadowRoot).not.toBeNull();
  });

  test('shadow root contains a .callout element', () => {
    const el = renderCallout(makeNode('info', 'Msg'));
    expect(el.shadowRoot.querySelector('.callout')).not.toBeNull();
  });

  test('renders the correct icon for each variant', () => {
    const expected = { info: 'ℹ️', warning: '⚠️', error: '❌', success: '✅' };
    for (const [variant, icon] of Object.entries(expected)) {
      const el = renderCallout(makeNode(variant, 'x'));
      const iconEl = el.shadowRoot.querySelector('.icon');
      expect(iconEl.textContent).toBe(icon);
    }
  });

  test('renders body content from rawBody correctly', () => {
    const el = renderCallout(makeNode('success', 'Done!'));
    const body = el.shadowRoot.querySelector('.body');
    expect(body.textContent).toBe('Done!');
  });

  test('defaults to "info" variant for unrecognised variant value', () => {
    const el = renderCallout(makeNode('unknown', 'msg'));
    const iconEl = el.shadowRoot.querySelector('.icon');
    expect(iconEl.textContent).toBe('ℹ️');
  });

  test('defaults to "info" variant when no variant attribute is present', () => {
    const el = renderCallout(makeNode(undefined, 'msg'));
    const iconEl = el.shadowRoot.querySelector('.icon');
    expect(iconEl.textContent).toBe('ℹ️');
  });

  test('handles empty rawBody gracefully', () => {
    const el = renderCallout(makeNode('error', ''));
    const body = el.shadowRoot.querySelector('.body');
    expect(body.textContent).toBe('');
  });
});

