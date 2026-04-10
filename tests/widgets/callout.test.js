'use strict';

const { renderCallout } = require('../../src/widgets/callout');

describe('renderCallout()', () => {
  test('returns an HTMLElement', () => {
    const el = renderCallout({ variant: 'info', content: 'Hello' });
    expect(el).toBeInstanceOf(HTMLElement);
  });

  test('has the am-callout-host class', () => {
    const el = renderCallout({ variant: 'info', content: 'Hello' });
    expect(el.classList.contains('am-callout-host')).toBe(true);
  });

  test('attaches a shadow root', () => {
    const el = renderCallout({ variant: 'warning', content: 'Watch out' });
    expect(el.shadowRoot).not.toBeNull();
  });

  test('shadow root contains a .callout element', () => {
    const el = renderCallout({ variant: 'info', content: 'Msg' });
    expect(el.shadowRoot.querySelector('.callout')).not.toBeNull();
  });

  test('renders the correct icon for each variant', () => {
    const expected = { info: 'ℹ️', warning: '⚠️', error: '❌', success: '✅' };
    for (const [variant, icon] of Object.entries(expected)) {
      const el = renderCallout({ variant, content: 'x' });
      const iconEl = el.shadowRoot.querySelector('.icon');
      expect(iconEl.textContent).toBe(icon);
    }
  });

  test('renders body content correctly', () => {
    const el = renderCallout({ variant: 'success', content: 'Done!' });
    const body = el.shadowRoot.querySelector('.body');
    expect(body.textContent).toBe('Done!');
  });

  test('defaults to "info" variant for unrecognised variant value', () => {
    const el = renderCallout({ variant: 'unknown', content: 'msg' });
    // Defaults to info icon
    const iconEl = el.shadowRoot.querySelector('.icon');
    expect(iconEl.textContent).toBe('ℹ️');
  });

  test('handles empty content gracefully', () => {
    const el = renderCallout({ variant: 'error', content: '' });
    const body = el.shadowRoot.querySelector('.body');
    expect(body.textContent).toBe('');
  });
});
