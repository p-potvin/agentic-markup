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
    const titleSpan = el.shadowRoot.querySelector('summary span');
    expect(titleSpan.textContent).toBe('My Section');
  });

  test('content div text matches rawBody', () => {
    const el = renderCollapse(makeNode('T', 'The body text'));
    const contentDiv = el.shadowRoot.querySelector('.content');
    expect(contentDiv.textContent).toBe('The body text');
  });

  test('uses "Details" fallback when attributes.summary is absent', () => {
    const el = renderCollapse(makeNode(undefined, 'body'));
    const titleSpan = el.shadowRoot.querySelector('summary span');
    expect(titleSpan.textContent).toBe('Details');
  });

  test('uses "Details" fallback when attributes.summary is empty string', () => {
    const el = renderCollapse(makeNode('', 'body'));
    const titleSpan = el.shadowRoot.querySelector('summary span');
    expect(titleSpan.textContent).toBe('Details');
  });

  test('handles empty rawBody gracefully', () => {
    const el = renderCollapse(makeNode('T', ''));
    const contentDiv = el.shadowRoot.querySelector('.content');
    expect(contentDiv.textContent).toBe('');
  });

  test('applies syntax highlighting when highlight attribute is present', () => {
    const node = makeNode('Code', 'const x = 42;');
    node.attributes.highlight = 'javascript';
    const el = renderCollapse(node);
    const contentDiv = el.shadowRoot.querySelector('.content');
    expect(contentDiv.innerHTML).toContain('<span class="hl-keyword">const</span>');
    expect(contentDiv.innerHTML).toContain('<span class="hl-number">42</span>');
  });

  test('escapes HTML when highlight attribute is present', () => {
    const node = makeNode('Code', 'const x = "<script>";');
    node.attributes.highlight = 'javascript';
    const el = renderCollapse(node);
    const contentDiv = el.shadowRoot.querySelector('.content');
    expect(contentDiv.innerHTML).toContain('&lt;script&gt;');
  });

  test('renders a copy button', () => {
    const el = renderCollapse(makeNode('T', 'C'));
    const btn = el.shadowRoot.querySelector('.copy-btn');
    expect(btn).not.toBeNull();
    expect(btn.textContent).toBe('Copy');
  });

  test('copy button calls clipboard API and updates text using node.rawBody', async () => {
    jest.useFakeTimers();
    let clipboardText = '';
    const mockWriteText = jest.fn().mockImplementation((text) => {
      clipboardText = text;
      return Promise.resolve();
    });

    // Mock navigator.clipboard using Object.defineProperty
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText
      },
      configurable: true
    });

    const el = renderCollapse(makeNode('T', 'Content to copy'));
    const btn = el.shadowRoot.querySelector('.copy-btn');

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    jest.spyOn(clickEvent, 'stopPropagation');
    jest.spyOn(clickEvent, 'preventDefault');

    btn.dispatchEvent(clickEvent);

    expect(clickEvent.stopPropagation).toHaveBeenCalled();
    expect(clickEvent.preventDefault).toHaveBeenCalled();
    expect(mockWriteText).toHaveBeenCalledWith('Content to copy');
    expect(clipboardText).toBe('Content to copy');

    // Wait for the promise to resolve
    await Promise.resolve();

    expect(btn.textContent).toBe('Copied!');

    jest.advanceTimersByTime(2000);
    expect(btn.textContent).toBe('Copy');

    jest.useRealTimers();
  });

  test('copy button handles missing rawBody gracefully', async () => {
    jest.useFakeTimers();
    let clipboardText = '';
    const mockWriteText = jest.fn().mockImplementation((text) => {
      clipboardText = text;
      return Promise.resolve();
    });

    // Mock navigator.clipboard using Object.defineProperty
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText
      },
      configurable: true
    });

    // Create node explicitly without rawBody
    const node = {
      type: 'containerDirective',
      name: 'collapse',
      attributes: { summary: 'T' },
      children: [],
    };

    const el = renderCollapse(node);
    const btn = el.shadowRoot.querySelector('.copy-btn');

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    btn.dispatchEvent(clickEvent);

    expect(mockWriteText).toHaveBeenCalledWith('');
    expect(clipboardText).toBe('');

    jest.useRealTimers();
  });

  test('copy button uses execCommand fallback when navigator.clipboard is absent', () => {
    jest.useFakeTimers();

    // Ensure navigator.clipboard is undefined
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true
    });

    const mockExecCommand = jest.fn().mockReturnValue(true);
    document.execCommand = mockExecCommand;

    const el = renderCollapse(makeNode('T', 'Fallback text'));
    const btn = el.shadowRoot.querySelector('.copy-btn');

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    btn.dispatchEvent(clickEvent);

    expect(mockExecCommand).toHaveBeenCalledWith('copy');

    // Check if a textarea was created with the correct value
    // Since it's appended to document.body and then removed synchronously,
    // we can only verify the execCommand call in this simple test,
    // unless we mock document.createElement.
    // However, execCommand implies the fallback block executed.
    expect(btn.textContent).toBe('Copied!');

    jest.advanceTimersByTime(2000);
    expect(btn.textContent).toBe('Copy');

    jest.useRealTimers();
  });
});

