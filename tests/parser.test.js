'use strict';

const { parse, parseTabContent, hasIncompleteWidget } = require('../src/parser');

describe('parse()', () => {
  test('returns a single text segment for plain text', () => {
    const result = parse('Hello world');
    expect(result).toEqual([{ type: 'text', content: 'Hello world' }]);
  });

  test('returns empty array for empty string', () => {
    expect(parse('')).toEqual([]);
  });

  test('parses a collapse widget', () => {
    const text = ':::collapse[My Title] Some content :::';
    const result = parse(text);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: 'collapse',
      title: 'My Title',
      content: 'Some content',
    });
  });

  test('parses a callout widget with known variant', () => {
    const variants = ['info', 'warning', 'error', 'success'];
    for (const variant of variants) {
      const result = parse(`:::callout[${variant}] A message :::`);
      expect(result[0]).toMatchObject({ type: 'callout', variant, content: 'A message' });
    }
  });

  test('falls back to info variant for unknown callout variant', () => {
    const result = parse(':::callout[unknown] text :::');
    expect(result[0]).toMatchObject({ type: 'callout', variant: 'unknown', content: 'text' });
  });

  test('parses a badge widget with variant', () => {
    const result = parse(':::badge[New][success]:::');
    expect(result[0]).toMatchObject({ type: 'badge', text: 'New', variant: 'success' });
  });

  test('parses a badge widget without variant (defaults to "default")', () => {
    const result = parse(':::badge[Beta]:::');
    expect(result[0]).toMatchObject({ type: 'badge', text: 'Beta', variant: 'default' });
  });

  test('parses a tabs widget and splits titles', () => {
    const result = parse(':::tabs[Tab A|Tab B] content A\n---\ncontent B :::');
    expect(result[0]).toMatchObject({
      type: 'tabs',
      titles: ['Tab A', 'Tab B'],
      tabs: ['content A', 'content B'],
    });
  });

  test('preserves text before and after a widget', () => {
    const result = parse('Before :::badge[X]::: After');
    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ type: 'text', content: 'Before ' });
    expect(result[1]).toMatchObject({ type: 'badge', text: 'X' });
    expect(result[2]).toMatchObject({ type: 'text', content: ' After' });
  });

  test('parses multiple widgets in one string', () => {
    const text = ':::callout[info] Note ::: and :::badge[v1]:::';
    const result = parse(text);
    const types = result.map(s => s.type);
    expect(types).toContain('callout');
    expect(types).toContain('badge');
  });

  test('trims widget content', () => {
    const result = parse(':::collapse[T]   spaces   :::');
    expect(result[0].content).toBe('spaces');
  });

  test('handles multiline widget content', () => {
    const content = 'Line one\nLine two\nLine three';
    const result = parse(`:::collapse[Title] ${content} :::`);
    expect(result[0].content).toBe(content);
  });
});

describe('parseTabContent()', () => {
  test('splits on \\n---\\n separator', () => {
    const result = parseTabContent('first\n---\nsecond\n---\nthird');
    expect(result).toEqual(['first', 'second', 'third']);
  });

  test('returns a single entry when no separator present', () => {
    expect(parseTabContent('only one')).toEqual(['only one']);
  });

  test('trims each tab content', () => {
    const result = parseTabContent('  hello  \n---\n  world  ');
    expect(result).toEqual(['hello', 'world']);
  });
});

describe('hasIncompleteWidget()', () => {
  test('returns false for plain text', () => {
    expect(hasIncompleteWidget('hello world')).toBe(false);
  });

  test('returns false when widget is complete', () => {
    expect(hasIncompleteWidget(':::collapse[T] body :::')).toBe(false);
  });

  test('returns true when widget opener has no closer', () => {
    expect(hasIncompleteWidget('some text :::collapse[Title] partial')).toBe(true);
  });

  test('returns false for text with only ::: as punctuation but no widget type', () => {
    // ":::" followed by a non-alpha char should not be treated as an opener
    expect(hasIncompleteWidget('use::: as separator')).toBe(false);
  });
});
