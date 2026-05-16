'use strict';

const { renderTabs } = require('../../src/widgets/tabs');

/**
 * Build a minimal containerDirective AST node for tabs.
 * @param {string} titlesAttr  Pipe-separated titles string, e.g. "A|B"
 * @param {string} rawBody     Body with --- separators, e.g. "body A\n---\nbody B"
 */
function makeNode(titlesAttr, rawBody) {
  return {
    type:       'containerDirective',
    name:       'tabs',
    attributes: titlesAttr !== undefined ? { titles: titlesAttr } : {},
    rawBody:    rawBody || '',
    children:   [],
  };
}

describe('renderTabs()', () => {
  test('returns an HTMLElement', () => {
    const el = renderTabs(makeNode('A|B', 'Content A\n---\nContent B'));
    expect(el).toBeInstanceOf(HTMLElement);
  });

  test('has the am-tabs-host class', () => {
    const el = renderTabs(makeNode('A', 'body'));
    expect(el.classList.contains('am-tabs-host')).toBe(true);
  });

  test('attaches a shadow root', () => {
    const el = renderTabs(makeNode('A', 'body'));
    expect(el.shadowRoot).not.toBeNull();
  });

  test('renders one button per title', () => {
    const el = renderTabs(makeNode('Tab 1|Tab 2|Tab 3', 'a\n---\nb\n---\nc'));
    const buttons = el.shadowRoot.querySelectorAll('.tab-btn');
    expect(buttons).toHaveLength(3);
    expect(buttons[0].textContent).toBe('Tab 1');
    expect(buttons[2].textContent).toBe('Tab 3');
  });

  test('first tab button is active by default', () => {
    const el = renderTabs(makeNode('First|Second', 'body1\n---\nbody2'));
    const buttons = el.shadowRoot.querySelectorAll('.tab-btn');
    expect(buttons[0].classList.contains('active')).toBe(true);
    expect(buttons[1].classList.contains('active')).toBe(false);
  });

  test('first panel is visible by default', () => {
    const el = renderTabs(makeNode('A|B', 'first\n---\nsecond'));
    const panels = el.shadowRoot.querySelectorAll('.tab-panel');
    expect(panels[0].classList.contains('active')).toBe(true);
    expect(panels[1].classList.contains('active')).toBe(false);
  });

  test('clicking a tab button makes its panel active', () => {
    const el = renderTabs(makeNode('X|Y', 'body X\n---\nbody Y'));
    document.body.appendChild(el);
    const buttons = el.shadowRoot.querySelectorAll('.tab-btn');
    buttons[1].click();
    const panels = el.shadowRoot.querySelectorAll('.tab-panel');
    expect(buttons[1].classList.contains('active')).toBe(true);
    expect(panels[1].classList.contains('active')).toBe(true);
    expect(buttons[0].classList.contains('active')).toBe(false);
    expect(panels[0].classList.contains('active')).toBe(false);
    document.body.removeChild(el);
  });

  test('splits rawBody on \\n---\\n to produce tab panel content', () => {
    const el = renderTabs(makeNode('A|B', 'Hello World\n---\nSecond tab'));
    const panels = el.shadowRoot.querySelectorAll('.tab-panel');
    expect(panels[0].textContent).toBe('Hello World');
    expect(panels[1].textContent).toBe('Second tab');
  });

  test('handles more titles than body sections (extra panels are empty)', () => {
    const el = renderTabs(makeNode('A|B', 'only one'));
    const panels = el.shadowRoot.querySelectorAll('.tab-panel');
    expect(panels).toHaveLength(2);
    expect(panels[1].textContent).toBe('');
  });

  test('handles empty titles attribute (renders no tabs)', () => {
    const el = renderTabs(makeNode('', ''));
    const buttons = el.shadowRoot.querySelectorAll('.tab-btn');
    expect(buttons).toHaveLength(0);
  });

  test('handles missing titles attribute (renders no tabs)', () => {
    const el = renderTabs(makeNode(undefined, ''));
    const buttons = el.shadowRoot.querySelectorAll('.tab-btn');
    expect(buttons).toHaveLength(0);
  });

  test('renders a copy button', () => {
    const el = renderTabs(makeNode('A', 'body'));
    const btn = el.shadowRoot.querySelector('.copy-btn');
    expect(btn).not.toBeNull();
    expect(btn.textContent).toBe('Copy');
  });

  test('copy button uses document.execCommand fallback if clipboard API is undefined', () => {
    jest.useFakeTimers();

    // Save original clipboard and execCommand
    const originalClipboard = navigator.clipboard;
    const originalExecCommand = document.execCommand;

    // Mock navigator.clipboard to be undefined
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });

    let copiedText = '';
    document.execCommand = jest.fn((cmd) => {
      if (cmd === 'copy') {
        const textarea = document.activeElement;
        if (textarea && textarea.tagName === 'TEXTAREA') {
          copiedText = textarea.value;
        }
        return true;
      }
      return false;
    });

    const el = renderTabs(makeNode('A|B', 'body A\n---\nbody B'));
    const btn = el.shadowRoot.querySelector('.copy-btn');
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });

    btn.dispatchEvent(clickEvent);

    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(copiedText).toBe('body A\n---\nbody B');
    expect(btn.textContent).toBe('Copied!');

    jest.advanceTimersByTime(2000);
    expect(btn.textContent).toBe('Copy');

    // Restore
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
    });
    document.execCommand = originalExecCommand;
    jest.useRealTimers();
  });

  test('copy button calls clipboard API and updates text', async () => {
    jest.useFakeTimers();
    let clipboardText = '';
    const mockWriteText = jest.fn().mockImplementation((text) => {
      clipboardText = text;
      return Promise.resolve();
    });

    // Save original clipboard and execCommand
    const originalClipboard = navigator.clipboard;

    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      configurable: true,
    });

    const el = renderTabs(makeNode('A|B', 'body A\n---\nbody B'));
    const btn = el.shadowRoot.querySelector('.copy-btn');

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    jest.spyOn(clickEvent, 'stopPropagation');
    jest.spyOn(clickEvent, 'preventDefault');

    btn.dispatchEvent(clickEvent);

    expect(clickEvent.stopPropagation).toHaveBeenCalled();
    expect(clickEvent.preventDefault).toHaveBeenCalled();
    expect(mockWriteText).toHaveBeenCalledWith('body A\n---\nbody B');
    expect(clipboardText).toBe('body A\n---\nbody B');

    // Wait for the promise to resolve
    await Promise.resolve();

    expect(btn.textContent).toBe('Copied!');

    jest.advanceTimersByTime(2000);
    expect(btn.textContent).toBe('Copy');

    // Restore
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
    });

    jest.useRealTimers();
  });
});

