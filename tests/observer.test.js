'use strict';

const { hydrateTextNode, scanAndHydrate, buildWidget, attachObserver } = require('../src/observer');

describe('buildWidget()', () => {
  test('returns an element for collapse segment', () => {
    const el = buildWidget({ type: 'collapse', title: 'T', content: 'C' });
    expect(el).toBeInstanceOf(HTMLElement);
  });

  test('returns an element for callout segment', () => {
    const el = buildWidget({ type: 'callout', variant: 'info', content: 'C' });
    expect(el).toBeInstanceOf(HTMLElement);
  });

  test('returns an element for tabs segment', () => {
    const el = buildWidget({ type: 'tabs', titles: ['A'], tabs: ['body'] });
    expect(el).toBeInstanceOf(HTMLElement);
  });

  test('returns an element for badge segment', () => {
    const el = buildWidget({ type: 'badge', text: 'New', variant: 'default' });
    expect(el).toBeInstanceOf(HTMLElement);
  });

  test('returns null for text segment', () => {
    expect(buildWidget({ type: 'text', content: 'hello' })).toBeNull();
  });

  test('returns null for unknown segment type', () => {
    expect(buildWidget({ type: 'unknown' })).toBeNull();
  });
});

describe('hydrateTextNode()', () => {
  function createTextNodeInDiv(text) {
    const div = document.createElement('div');
    const tn = document.createTextNode(text);
    div.appendChild(tn);
    document.body.appendChild(div);
    return { div, tn };
  }

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('does nothing for text with no ::: markers', () => {
    const { div, tn } = createTextNodeInDiv('plain text');
    hydrateTextNode(tn);
    expect(div.innerHTML).toBe('plain text');
  });

  test('wraps original text node in a hidden span', () => {
    const { div, tn } = createTextNodeInDiv(':::collapse[T] body :::');
    hydrateTextNode(tn);
    const hidden = div.querySelector('[data-am-original]');
    expect(hidden).not.toBeNull();
    expect(hidden.style.display).toBe('none');
  });

  test('original text node is moved inside the hidden span', () => {
    const { div, tn } = createTextNodeInDiv(':::collapse[T] body :::');
    hydrateTextNode(tn);
    const hidden = div.querySelector('[data-am-original]');
    expect(hidden.contains(tn)).toBe(true);
  });

  test('inserts widget element as sibling after hidden span', () => {
    const { div } = createTextNodeInDiv(':::callout[info] Note :::');
    const tn = div.firstChild;
    hydrateTextNode(tn);
    const widget = div.querySelector('[data-am-widget="callout"]');
    expect(widget).not.toBeNull();
  });

  test('preserves surrounding plain text as text nodes', () => {
    const { div } = createTextNodeInDiv('Before :::badge[X]::: After');
    hydrateTextNode(div.firstChild);
    // The div should now contain: hidden-span | "Before " text | badge widget | " After" text
    const textContent = Array.from(div.childNodes)
      .filter(n => n.nodeType === Node.TEXT_NODE)
      .map(n => n.textContent)
      .join('');
    expect(textContent).toContain('Before ');
    expect(textContent).toContain(' After');
  });

  test('does nothing when text node has no parent', () => {
    const tn = document.createTextNode(':::collapse[T] body :::');
    // No parent — should not throw
    expect(() => hydrateTextNode(tn)).not.toThrow();
  });
});

describe('scanAndHydrate()', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('hydrates a text node inside a container', () => {
    const div = document.createElement('div');
    div.textContent = ':::callout[success] Done :::';
    document.body.appendChild(div);

    scanAndHydrate(div);

    const widget = div.querySelector('[data-am-widget="callout"]');
    expect(widget).not.toBeNull();
  });

  test('skips text nodes inside already-processed wrappers', () => {
    const div = document.createElement('div');
    const wrapper = document.createElement('span');
    wrapper.setAttribute('data-am-original', 'true');
    wrapper.textContent = ':::collapse[T] body :::';
    div.appendChild(wrapper);
    document.body.appendChild(div);

    scanAndHydrate(div);

    // The inner text should NOT be re-processed
    const hidden = div.querySelectorAll('[data-am-original]');
    expect(hidden).toHaveLength(1);
  });

  test('skips text nodes inside existing widget hosts', () => {
    const div = document.createElement('div');
    const widgetHost = document.createElement('span');
    widgetHost.setAttribute('data-am-widget', 'callout');
    widgetHost.textContent = ':::collapse[T] body :::';
    div.appendChild(widgetHost);
    document.body.appendChild(div);

    scanAndHydrate(div);

    // Should not create another widget inside
    expect(div.querySelectorAll('[data-am-widget]')).toHaveLength(1);
  });
});

describe('attachObserver()', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('returns a MutationObserver', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const obs = attachObserver(container);
    expect(obs).toBeInstanceOf(MutationObserver);
    obs.disconnect();
  });

  test('immediately hydrates existing markup in the target', () => {
    const container = document.createElement('div');
    container.textContent = ':::callout[info] Immediate :::';
    document.body.appendChild(container);

    const obs = attachObserver(container);
    const widget = container.querySelector('[data-am-widget="callout"]');
    expect(widget).not.toBeNull();
    obs.disconnect();
  });

  test('hydrates a text node added dynamically', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const obs = attachObserver(container);

    const tn = document.createTextNode(':::badge[Dynamic]:::');
    container.appendChild(tn);

    // Flush pending microtasks so the MutationObserver callback fires.
    await Promise.resolve();

    const widget = container.querySelector('[data-am-widget="badge"]');
    expect(widget).not.toBeNull();
    obs.disconnect();
  });

  test('hydrates a child element added dynamically', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const obs = attachObserver(container);

    const child = document.createElement('p');
    child.textContent = ':::collapse[Dynamic] body :::';
    container.appendChild(child);

    await Promise.resolve();

    const widget = container.querySelector('[data-am-widget="collapse"]');
    expect(widget).not.toBeNull();
    obs.disconnect();
  });
});
