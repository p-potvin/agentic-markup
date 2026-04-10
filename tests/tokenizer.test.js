'use strict';

const { tokenize, parseAttributes, TOKEN } = require('../src/tokenizer');

// ── parseAttributes() ─────────────────────────────────────────────────────────

describe('parseAttributes()', () => {
  test('returns empty object for undefined input', () => {
    expect(parseAttributes(undefined)).toEqual({});
  });

  test('returns empty object for empty braces', () => {
    expect(parseAttributes('{}')).toEqual({});
  });

  test('parses a single quoted attribute', () => {
    expect(parseAttributes('{summary="My Title"}')).toEqual({ summary: 'My Title' });
  });

  test('parses multiple quoted attributes', () => {
    expect(parseAttributes('{text="New" variant="success"}')).toEqual({
      text: 'New',
      variant: 'success',
    });
  });

  test('parses unquoted attribute values', () => {
    expect(parseAttributes('{variant=info}')).toEqual({ variant: 'info' });
  });

  test('parses attribute with pipe character in quoted value', () => {
    expect(parseAttributes('{titles="Tab A|Tab B"}')).toEqual({ titles: 'Tab A|Tab B' });
  });

  test('handles extra whitespace around = sign', () => {
    expect(parseAttributes('{key = "value"}')).toEqual({ key: 'value' });
  });
});

// ── tokenize() ────────────────────────────────────────────────────────────────

describe('tokenize()', () => {
  test('returns a TEXT token for plain text', () => {
    const tokens = tokenize('hello world');
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({ type: TOKEN.TEXT, value: 'hello world' });
  });

  test('returns empty array for empty string', () => {
    expect(tokenize('')).toHaveLength(0);
  });

  test('recognises a block directive open + body + close', () => {
    const input = ':::collapse{summary="T"}\nbody text\n:::';
    const tokens = tokenize(input);
    expect(tokens.map(t => t.type)).toEqual([
      TOKEN.DIRECTIVE_OPEN,
      TOKEN.DIRECTIVE_BODY,
      TOKEN.DIRECTIVE_CLOSE,
    ]);
    expect(tokens[0]).toMatchObject({ name: 'collapse', attributes: { summary: 'T' } });
    expect(tokens[1]).toMatchObject({ value: 'body text' });
  });

  test('recognises a self-closing leaf on its own line', () => {
    const tokens = tokenize(':::badge{text="New" variant="success"}:::');
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({
      type:       TOKEN.LEAF_DIRECTIVE,
      name:       'badge',
      attributes: { text: 'New', variant: 'success' },
    });
  });

  test('recognises an inline leaf within a text line', () => {
    const tokens = tokenize('Status: :::badge{text="Beta"}::: end');
    const types = tokens.map(t => t.type);
    expect(types).toContain(TOKEN.TEXT);
    expect(types).toContain(TOKEN.LEAF_DIRECTIVE);
    const leafIdx = types.indexOf(TOKEN.LEAF_DIRECTIVE);
    expect(tokens[leafIdx]).toMatchObject({ name: 'badge', attributes: { text: 'Beta' } });
  });

  test('preserves text before an inline leaf', () => {
    const tokens = tokenize('Before :::badge{text="X"}:::');
    expect(tokens[0]).toMatchObject({ type: TOKEN.TEXT, value: 'Before ' });
  });

  test('preserves text after an inline leaf', () => {
    const tokens = tokenize(':::badge{text="X"}::: After');
    const last = tokens[tokens.length - 1];
    expect(last).toMatchObject({ type: TOKEN.TEXT, value: ' After' });
  });

  test('handles multi-line body content', () => {
    const input = ':::callout{variant="info"}\nLine one\nLine two\n:::';
    const tokens = tokenize(input);
    const bodyToken = tokens.find(t => t.type === TOKEN.DIRECTIVE_BODY);
    expect(bodyToken.value).toBe('Line one\nLine two');
  });

  test('handles a block with no attributes', () => {
    const tokens = tokenize(':::collapse\nbody\n:::');
    expect(tokens[0]).toMatchObject({
      type:       TOKEN.DIRECTIVE_OPEN,
      name:       'collapse',
      attributes: {},
    });
  });

  test('emits TEXT before and after a block directive', () => {
    const input = 'before\n:::collapse{summary="T"}\nbody\n:::\nafter';
    const tokens = tokenize(input);
    const types = tokens.map(t => t.type);
    expect(types[0]).toBe(TOKEN.TEXT);
    expect(types[types.length - 1]).toBe(TOKEN.TEXT);
  });

  test('tracks nested block depth correctly', () => {
    const input = [
      ':::tabs{titles="A|B"}',
      'first tab',
      '---',
      ':::collapse{summary="Inner"}',
      'nested body',
      ':::',
      ':::',
    ].join('\n');
    const tokens = tokenize(input);
    const opens  = tokens.filter(t => t.type === TOKEN.DIRECTIVE_OPEN);
    const closes = tokens.filter(t => t.type === TOKEN.DIRECTIVE_CLOSE);
    expect(opens).toHaveLength(2);
    expect(closes).toHaveLength(2);
  });

  test('handles an unclosed directive (streaming) without throwing', () => {
    expect(() => tokenize(':::collapse{summary="T"}\npartial')).not.toThrow();
  });

  test('emits DIRECTIVE_OPEN for an unclosed directive (streaming)', () => {
    const tokens = tokenize(':::collapse{summary="T"}\npartial');
    const types = tokens.map(t => t.type);
    expect(types).toContain(TOKEN.DIRECTIVE_OPEN);
    expect(types).not.toContain(TOKEN.DIRECTIVE_CLOSE);
  });

  test('handles a tabs block with --- separator in body', () => {
    const input = ':::tabs{titles="A|B"}\ncontent A\n---\ncontent B\n:::';
    const tokens = tokenize(input);
    const body = tokens.find(t => t.type === TOKEN.DIRECTIVE_BODY);
    expect(body.value).toContain('---');
  });

  test('does not treat ::: embedded inside a word as a fence token', () => {
    // A ::: only forms a fence when it is the entire line content (no surrounding chars).
    // Here ::: is glued to adjacent characters so it will never match RE_OPEN_LINE,
    // RE_LEAF_LINE, RE_CLOSE_LINE, or RE_INLINE_LEAF (which requires a word-char name).
    const tokens = tokenize('use::: as separator');
    expect(tokens.every(t => t.type === TOKEN.TEXT)).toBe(true);
  });
});
