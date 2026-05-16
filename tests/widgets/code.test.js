'use strict';

const { renderCode } = require('../../src/widgets/code');

describe('renderCode()', () => {
  let node;

  beforeEach(() => {
    node = {
      type: 'containerDirective',
      name: 'code',
      attributes: { language: 'javascript' },
      rawBody: 'console.log("hello");',
      children: [
        { type: 'paragraph', children: [{ type: 'text', value: 'console.log("hello");' }] }
      ]
    };

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue()
      }
    });
  });

  test('returns an HTMLElement', () => {
    const el = renderCode(node);
    expect(el).toBeInstanceOf(HTMLElement);
  });

  test('has the am-code-host class', () => {
    const el = renderCode(node);
    expect(el.classList.contains('am-code-host')).toBe(true);
  });

  test('attaches a shadow root', () => {
    const el = renderCode(node);
    expect(el.shadowRoot).toBeTruthy();
  });

  test('renders the correct language label', () => {
    const el = renderCode(node);
    const label = el.shadowRoot.querySelector('.language-label');
    expect(label.textContent).toBe('javascript');
  });

  test('defaults to "plaintext" when no language attribute is present', () => {
    delete node.attributes;
    const el = renderCode(node);
    const label = el.shadowRoot.querySelector('.language-label');
    expect(label.textContent).toBe('plaintext');
  });

  test('renders the code content correctly', () => {
    const el = renderCode(node);
    const codeEl = el.shadowRoot.querySelector('code');
    expect(codeEl.textContent).toBe('console.log("hello");');
  });

  test('copies to clipboard on button click', async () => {
    const el = renderCode(node);
    const copyBtn = el.shadowRoot.querySelector('.copy-btn');

    copyBtn.click();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('console.log("hello");');

    // Wait for the promise to resolve
    await Promise.resolve();
    expect(copyBtn.textContent).toBe('Copied!');
  });
});
