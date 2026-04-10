'use strict';

const { renderCollapse } = require('../../src/widgets/collapse');

describe('renderCollapse()', () => {
  test('returns an HTMLElement', () => {
    const el = renderCollapse({ title: 'Test', content: 'Body' });
    expect(el).toBeInstanceOf(HTMLElement);
  });

  test('has the am-collapse-host class', () => {
    const el = renderCollapse({ title: 'T', content: 'C' });
    expect(el.classList.contains('am-collapse-host')).toBe(true);
  });

  test('attaches a shadow root in open mode', () => {
    const el = renderCollapse({ title: 'T', content: 'C' });
    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot.mode).toBe('open');
  });

  test('shadow root contains a <details> element', () => {
    const el = renderCollapse({ title: 'Title', content: 'Content' });
    const details = el.shadowRoot.querySelector('details');
    expect(details).not.toBeNull();
  });

  test('summary text matches the provided title', () => {
    const el = renderCollapse({ title: 'My Section', content: 'body' });
    const summary = el.shadowRoot.querySelector('summary');
    expect(summary.textContent).toBe('My Section');
  });

  test('content div text matches the provided content', () => {
    const el = renderCollapse({ title: 'T', content: 'The body text' });
    const contentDiv = el.shadowRoot.querySelector('.content');
    expect(contentDiv.textContent).toBe('The body text');
  });

  test('uses a fallback title when none is provided', () => {
    const el = renderCollapse({ title: '', content: 'body' });
    const summary = el.shadowRoot.querySelector('summary');
    expect(summary.textContent).toBe('Details');
  });

  test('handles empty content gracefully', () => {
    const el = renderCollapse({ title: 'T', content: '' });
    const contentDiv = el.shadowRoot.querySelector('.content');
    expect(contentDiv.textContent).toBe('');
  });
});
