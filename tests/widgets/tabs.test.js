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
});

