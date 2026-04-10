'use strict';

const { hydrateTextNode, scanAndHydrate, buildWidget, attachObserver } = require('../src/observer');

// ── buildWidget() ──────────────────────────────────────────────────────────────

describe('buildWidget()', () => {
  function makeContainer(name, attributes, rawBody) {
    return {
      type: 'containerDirective', name,
      attributes: attributes || {},
      rawBody: rawBody || '',
      children: [],
    };
  }
  function makeLeaf(name, attributes) {
    return { type: 'leafDirective', name, attributes: attributes || {} };
  }

  test('returns an element for collapse containerDirective', () => {
    const el = buildWidget(makeContainer('collapse', { summary: 'T' }, 'body'));
    expect(el).toBeInstanceOf(HTMLElement);
  });

  test('returns an element for callout containerDirective', () => {
    const el = buildWidget(makeContainer('callout', { variant: 'info' }, 'C'));
    expect(el).toBeInstanceOf(HTMLElement);
  });

  test('returns an element for tabs containerDirective', () => {
    const el = buildWidget(makeContainer('tabs', { titles: 'A|B' }, 'body A\n---\nbody B'));
    expect(el).toBeInstanceOf(HTMLElement);
  });

  test('returns an element for badge leafDirective', () => {
    const el = buildWidget(makeLeaf('badge', { text: 'New', variant: 'default' }));
    expect(el).toBeInstanceOf(HTMLElement);
  });

  test('returns null for a node with no name', () => {
    expect(buildWidget({})).toBeNull();
    expect(buildWidget(null)).toBeNull();
  });

  test('returns null for an unrecognised directive name', () => {
    expect(buildWidget(makeContainer('unknown', {}, ''))).toBeNull();
  });
});

// ── hydrateTextNode() ──────────────────────────────────────────────────────────

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
    const { div, tn } = createTextNodeInDiv(
      ':::collapse{summary="T"}\nbody\n:::'
    );
    hydrateTextNode(tn);
    const hidden = div.querySelector('[data-am-original]');
    expect(hidden).not.toBeNull();
    expect(hidden.style.display).toBe('none');
  });

  test('original text node is moved inside the hidden span', () => {
    const { div, tn } = createTextNodeInDiv(
      ':::collapse{summary="T"}\nbody\n:::'
    );
    hydrateTextNode(tn);
    const hidden = div.querySelector('[data-am-original]');
    expect(hidden.contains(tn)).toBe(true);
  });

  test('inserts widget element as sibling after hidden span', () => {
    const { div } = createTextNodeInDiv(
      ':::callout{variant="info"}\nNote\n:::'
    );
    hydrateTextNode(div.firstChild);
    const widget = div.querySelector('[data-am-widget="callout"]');
    expect(widget).not.toBeNull();
  });

  test('preserves surrounding plain text as text nodes', () => {
    const { div } = createTextNodeInDiv('Before :::badge{text="X"}::: After');
    hydrateTextNode(div.firstChild);
    const textContent = Array.from(div.childNodes)
      .filter(n => n.nodeType === Node.TEXT_NODE)
      .map(n => n.textContent)
      .join('');
    expect(textContent).toContain('Before ');
    expect(textContent).toContain(' After');
  });

  test('does nothing when text node has no parent', () => {
    const tn = document.createTextNode(':::collapse{summary="T"}\nbody\n:::');
    expect(() => hydrateTextNode(tn)).not.toThrow();
  });
});

// ── scanAndHydrate() ───────────────────────────────────────────────────────────

describe('scanAndHydrate()', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('hydrates a text node inside a container', () => {
    const div = document.createElement('div');
    div.textContent = ':::callout{variant="success"}\nDone\n:::';
    document.body.appendChild(div);

    scanAndHydrate(div);

    const widget = div.querySelector('[data-am-widget="callout"]');
    expect(widget).not.toBeNull();
  });

  test('skips text nodes inside already-processed wrappers', () => {
    const div = document.createElement('div');
    const wrapper = document.createElement('span');
    wrapper.setAttribute('data-am-original', 'true');
    wrapper.textContent = ':::collapse{summary="T"}\nbody\n:::';
    div.appendChild(wrapper);
    document.body.appendChild(div);

    scanAndHydrate(div);

    const hidden = div.querySelectorAll('[data-am-original]');
    expect(hidden).toHaveLength(1);
  });

  test('skips text nodes inside existing widget hosts', () => {
    const div = document.createElement('div');
    const widgetHost = document.createElement('span');
    widgetHost.setAttribute('data-am-widget', 'callout');
    widgetHost.textContent = ':::collapse{summary="T"}\nbody\n:::';
    div.appendChild(widgetHost);
    document.body.appendChild(div);

    scanAndHydrate(div);

    expect(div.querySelectorAll('[data-am-widget]')).toHaveLength(1);
  });
});

// ── attachObserver() ───────────────────────────────────────────────────────────

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
    container.textContent = ':::callout{variant="info"}\nImmediate\n:::';
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

    const tn = document.createTextNode(':::badge{text="Dynamic"}:::');
    container.appendChild(tn);

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
    child.textContent = ':::collapse{summary="Dynamic"}\nbody\n:::';
    container.appendChild(child);

    await Promise.resolve();

    const widget = container.querySelector('[data-am-widget="collapse"]');
    expect(widget).not.toBeNull();
    obs.disconnect();
  });
});

