'use strict';

const { parse, getNodeText, bodyToParagraphs, hasIncompleteWidget } = require('../src/parser');

// ── parse() ───────────────────────────────────────────────────────────────────

describe('parse()', () => {
  test('returns a root node for any input', () => {
    const ast = parse('hello');
    expect(ast).toMatchObject({ type: 'root' });
    expect(Array.isArray(ast.children)).toBe(true);
  });

  test('returns empty children for empty string', () => {
    expect(parse('').children).toHaveLength(0);
  });

  test('returns a text node for plain text', () => {
    const ast = parse('Hello world');
    expect(ast.children).toHaveLength(1);
    expect(ast.children[0]).toMatchObject({ type: 'text', value: 'Hello world' });
  });

  test('parses a collapse block directive', () => {
    const ast = parse(':::collapse{summary="My Title"}\nSome content\n:::');
    expect(ast.children).toHaveLength(1);
    const node = ast.children[0];
    expect(node).toMatchObject({
      type:       'containerDirective',
      name:       'collapse',
      attributes: { summary: 'My Title' },
    });
    expect(node.rawBody).toBe('Some content');
  });

  test('parses a callout block directive with all variants', () => {
    const variants = ['info', 'warning', 'error', 'success'];
    for (const variant of variants) {
      const ast = parse(`:::callout{variant="${variant}"}\nA message\n:::`);
      const node = ast.children[0];
      expect(node).toMatchObject({
        type:       'containerDirective',
        name:       'callout',
        attributes: { variant },
      });
    }
  });

  test('parses a tabs block directive', () => {
    const ast = parse(':::tabs{titles="Tab A|Tab B"}\ncontent A\n---\ncontent B\n:::');
    const node = ast.children[0];
    expect(node).toMatchObject({
      type:       'containerDirective',
      name:       'tabs',
      attributes: { titles: 'Tab A|Tab B' },
    });
    expect(node.rawBody).toBe('content A\n---\ncontent B');
  });

  test('parses a badge leaf directive', () => {
    const ast = parse(':::badge{text="New" variant="success"}:::');
    expect(ast.children[0]).toMatchObject({
      type:       'leafDirective',
      name:       'badge',
      attributes: { text: 'New', variant: 'success' },
    });
  });

  test('parses a badge leaf directive with no variant attribute', () => {
    const ast = parse(':::badge{text="Beta"}:::');
    expect(ast.children[0]).toMatchObject({
      type:       'leafDirective',
      name:       'badge',
      attributes: { text: 'Beta' },
    });
  });

  test('preserves text before and after a leaf directive', () => {
    const ast = parse('Before :::badge{text="X"}::: After');
    const types = ast.children.map(n => n.type);
    expect(types).toContain('text');
    expect(types).toContain('leafDirective');
    expect(ast.children.find(n => n.type === 'text' && n.value.includes('Before'))).toBeTruthy();
    expect(ast.children.find(n => n.type === 'text' && n.value.includes('After'))).toBeTruthy();
  });

  test('parses multiple directives in one string', () => {
    const text = [
      ':::callout{variant="info"}',
      'Note',
      ':::',
      'Inline :::badge{text="v1"}::: here',
    ].join('\n');
    const ast = parse(text);
    const types = ast.children.map(n => n.type);
    expect(types).toContain('containerDirective');
    expect(types).toContain('text');
    // badge is inline within the last text line
    const leafInChild = ast.children.some(n => n.type === 'leafDirective');
    expect(leafInChild).toBe(true);
  });

  test('stores rawBody on containerDirective', () => {
    const ast = parse(':::collapse{summary="T"}\nbody line\n:::');
    expect(ast.children[0].rawBody).toBe('body line');
  });

  test('generates paragraph children from body text', () => {
    const ast = parse(':::callout{variant="info"}\nPara one\n\nPara two\n:::');
    const node = ast.children[0];
    const paragraphs = node.children.filter(c => c.type === 'paragraph');
    expect(paragraphs).toHaveLength(2);
  });

  test('handles nested directives', () => {
    const input = [
      ':::tabs{titles="A|B"}',
      'first',
      ':::collapse{summary="Nested"}',
      'inner body',
      ':::',
      ':::',
    ].join('\n');
    const ast = parse(input);
    const tabs = ast.children[0];
    expect(tabs.name).toBe('tabs');
    // The nested collapse should be a child of tabs
    const nested = tabs.children.find(c => c.type === 'containerDirective');
    expect(nested).toBeTruthy();
    expect(nested.name).toBe('collapse');
  });
});

// ── getNodeText() ──────────────────────────────────────────────────────────────

describe('getNodeText()', () => {
  test('returns empty string for null', () => {
    expect(getNodeText(null)).toBe('');
  });

  test('returns value for a text node', () => {
    expect(getNodeText({ type: 'text', value: 'hello' })).toBe('hello');
  });

  test('returns rawBody for a containerDirective', () => {
    const ast = parse(':::collapse{summary="T"}\nbody\n:::');
    expect(getNodeText(ast.children[0])).toBe('body');
  });

  test('returns joined children text when no rawBody', () => {
    const node = {
      type: 'root',
      children: [
        { type: 'text', value: 'a' },
        { type: 'text', value: 'b' },
      ],
    };
    expect(getNodeText(node)).toBe('a\nb');
  });
});

// ── bodyToParagraphs() ────────────────────────────────────────────────────────

describe('bodyToParagraphs()', () => {
  test('returns empty array for empty/blank string', () => {
    expect(bodyToParagraphs('')).toEqual([]);
    expect(bodyToParagraphs('   ')).toEqual([]);
  });

  test('returns a single paragraph for non-blank input', () => {
    const result = bodyToParagraphs('hello');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ type: 'paragraph' });
    expect(result[0].children[0]).toMatchObject({ type: 'text', value: 'hello' });
  });

  test('splits on double newlines', () => {
    const result = bodyToParagraphs('para one\n\npara two');
    expect(result).toHaveLength(2);
    expect(result[0].children[0].value).toBe('para one');
    expect(result[1].children[0].value).toBe('para two');
  });

  test('trims each paragraph', () => {
    const result = bodyToParagraphs('  trimmed  \n\n  also  ');
    expect(result[0].children[0].value).toBe('trimmed');
    expect(result[1].children[0].value).toBe('also');
  });
});

// ── hasIncompleteWidget() ─────────────────────────────────────────────────────

describe('hasIncompleteWidget()', () => {
  test('returns false for plain text', () => {
    expect(hasIncompleteWidget('hello world')).toBe(false);
  });

  test('returns false when block directive is complete', () => {
    expect(hasIncompleteWidget(':::collapse{summary="T"}\nbody\n:::')).toBe(false);
  });

  test('returns true when block directive opener has no closer', () => {
    expect(hasIncompleteWidget(':::collapse{summary="T"}\npartial body')).toBe(true);
  });

  test('returns false for a complete leaf directive', () => {
    expect(hasIncompleteWidget(':::badge{text="X"}:::')).toBe(false);
  });

  test('returns false for plain text that happens to contain :::', () => {
    expect(hasIncompleteWidget('use::: as separator')).toBe(false);
  });
});

