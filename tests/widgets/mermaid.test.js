'use strict';

const { renderMermaid } = require('../../src/widgets/mermaid');

// Mock mermaid module
jest.mock('mermaid', () => {
    return {
        default: {
            initialize: jest.fn(),
            render: jest.fn().mockResolvedValue({ svg: '<svg>mock</svg>' })
        }
    };
});

/** Build a minimal containerDirective AST node for mermaid. */
function makeNode(body) {
  return {
    type:       'containerDirective',
    name:       'mermaid',
    attributes: {},
    rawBody:    body || '',
    children:   [],
  };
}

describe('renderMermaid()', () => {
  test('returns an HTMLElement', () => {
    const el = renderMermaid(makeNode('graph TD; A-->B;'));
    expect(el).toBeInstanceOf(HTMLElement);
  });

  test('has the am-mermaid-host class', () => {
    const el = renderMermaid(makeNode('graph TD; A-->B;'));
    expect(el.classList.contains('am-mermaid-host')).toBe(true);
  });

  test('attaches a shadow root in open mode', () => {
    const el = renderMermaid(makeNode('graph TD; A-->B;'));
    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot.mode).toBe('open');
  });

  test('renders a copy button', () => {
    const el = renderMermaid(makeNode('graph TD; A-->B;'));
    const btn = el.shadowRoot.querySelector('.copy-btn');
    expect(btn).not.toBeNull();
    expect(btn.textContent).toBe('Copy Source');
  });

  test('copy button calls clipboard API and updates text', async () => {
    jest.useFakeTimers();
    let clipboardText = '';
    const mockWriteText = jest.fn().mockImplementation((text) => {
      clipboardText = text;
      return Promise.resolve();
    });

    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText
      }
    });

    const el = renderMermaid(makeNode('graph TD; A-->B;'));
    const btn = el.shadowRoot.querySelector('.copy-btn');

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    jest.spyOn(clickEvent, 'stopPropagation');
    jest.spyOn(clickEvent, 'preventDefault');

    btn.dispatchEvent(clickEvent);

    expect(clickEvent.stopPropagation).toHaveBeenCalled();
    expect(clickEvent.preventDefault).toHaveBeenCalled();
    expect(mockWriteText).toHaveBeenCalledWith('graph TD; A-->B;');
    expect(clipboardText).toBe('graph TD; A-->B;');

    await Promise.resolve();

    expect(btn.textContent).toBe('Copied!');

    jest.advanceTimersByTime(2000);
    expect(btn.textContent).toBe('Copy Source');

    jest.useRealTimers();
  });
});
