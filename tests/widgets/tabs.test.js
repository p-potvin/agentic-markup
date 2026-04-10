'use strict';

const { renderTabs } = require('../../src/widgets/tabs');

describe('renderTabs()', () => {
  test('returns an HTMLElement', () => {
    const el = renderTabs({ titles: ['A', 'B'], tabs: ['Content A', 'Content B'] });
    expect(el).toBeInstanceOf(HTMLElement);
  });

  test('has the am-tabs-host class', () => {
    const el = renderTabs({ titles: ['A'], tabs: ['body'] });
    expect(el.classList.contains('am-tabs-host')).toBe(true);
  });

  test('attaches a shadow root', () => {
    const el = renderTabs({ titles: ['A'], tabs: ['body'] });
    expect(el.shadowRoot).not.toBeNull();
  });

  test('renders one button per title', () => {
    const el = renderTabs({ titles: ['Tab 1', 'Tab 2', 'Tab 3'], tabs: ['a', 'b', 'c'] });
    const buttons = el.shadowRoot.querySelectorAll('.tab-btn');
    expect(buttons).toHaveLength(3);
    expect(buttons[0].textContent).toBe('Tab 1');
    expect(buttons[2].textContent).toBe('Tab 3');
  });

  test('first tab button is active by default', () => {
    const el = renderTabs({ titles: ['First', 'Second'], tabs: ['body1', 'body2'] });
    const buttons = el.shadowRoot.querySelectorAll('.tab-btn');
    expect(buttons[0].classList.contains('active')).toBe(true);
    expect(buttons[1].classList.contains('active')).toBe(false);
  });

  test('first panel is visible by default', () => {
    const el = renderTabs({ titles: ['A', 'B'], tabs: ['first', 'second'] });
    const panels = el.shadowRoot.querySelectorAll('.tab-panel');
    expect(panels[0].classList.contains('active')).toBe(true);
    expect(panels[1].classList.contains('active')).toBe(false);
  });

  test('clicking a tab button makes its panel active', () => {
    const el = renderTabs({ titles: ['X', 'Y'], tabs: ['body X', 'body Y'] });
    document.body.appendChild(el); // must be in DOM for click events
    const buttons = el.shadowRoot.querySelectorAll('.tab-btn');
    buttons[1].click();
    const panels = el.shadowRoot.querySelectorAll('.tab-panel');
    expect(buttons[1].classList.contains('active')).toBe(true);
    expect(panels[1].classList.contains('active')).toBe(true);
    expect(buttons[0].classList.contains('active')).toBe(false);
    expect(panels[0].classList.contains('active')).toBe(false);
    document.body.removeChild(el);
  });

  test('renders tab panel content correctly', () => {
    const el = renderTabs({ titles: ['A'], tabs: ['Hello World'] });
    const panel = el.shadowRoot.querySelector('.tab-panel');
    expect(panel.textContent).toBe('Hello World');
  });

  test('handles more titles than tab content arrays (gracefully)', () => {
    const el = renderTabs({ titles: ['A', 'B'], tabs: ['only one'] });
    const panels = el.shadowRoot.querySelectorAll('.tab-panel');
    expect(panels).toHaveLength(2);
    expect(panels[1].textContent).toBe('');
  });

  test('handles empty titles/tabs arrays', () => {
    const el = renderTabs({ titles: [], tabs: [] });
    const buttons = el.shadowRoot.querySelectorAll('.tab-btn');
    expect(buttons).toHaveLength(0);
  });
});
