'use strict';

const { renderCollapse } = require('../../src/widgets/collapse');

/** Build a minimal containerDirective AST node for collapse. */
function makeNode(summary, body) {
  return {
    type:       'containerDirective',
    name:       'collapse',
    attributes: summary !== undefined ? { summary } : {},
    rawBody:    body || '',
    children:   [],
  };
}

describe('renderCollapse()', () => {
  test('returns an HTMLElement', () => {
    const el = renderCollapse(makeNode('Test', 'Body'));
    expect(el).toBeInstanceOf(HTMLElement);
  });

  test('has the am-collapse-host class', () => {
    const el = renderCollapse(makeNode('T', 'C'));
    expect(el.classList.contains('am-collapse-host')).toBe(true);
  });

  test('attaches a shadow root in open mode', () => {
    const el = renderCollapse(makeNode('T', 'C'));
    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot.mode).toBe('open');
  });

  test('shadow root contains a <details> element', () => {
    const el = renderCollapse(makeNode('Title', 'Content'));
    const details = el.shadowRoot.querySelector('details');
    expect(details).not.toBeNull();
  });

  test('summary text matches the attributes.summary value', () => {
    const el = renderCollapse(makeNode('My Section', 'body'));
    const summary = el.shadowRoot.querySelector('summary');
    expect(summary.textContent).toBe('My Section');
  });

  test('content div text matches rawBody', () => {
    const el = renderCollapse(makeNode('T', 'The body text'));
    const contentDiv = el.shadowRoot.querySelector('.content');
    expect(contentDiv.textContent).toBe('The body text');
  });

  test('uses "Details" fallback when attributes.summary is absent', () => {
    const el = renderCollapse(makeNode(undefined, 'body'));
    const summary = el.shadowRoot.querySelector('summary');
    expect(summary.textContent).toBe('Details');
  });

  test('uses "Details" fallback when attributes.summary is empty string', () => {
    const el = renderCollapse(makeNode('', 'body'));
    const summary = el.shadowRoot.querySelector('summary');
    expect(summary.textContent).toBe('Details');
  });

  test('handles empty rawBody gracefully', () => {
    const el = renderCollapse(makeNode('T', ''));
    const contentDiv = el.shadowRoot.querySelector('.content');
    expect(contentDiv.textContent).toBe('');
  });
});

