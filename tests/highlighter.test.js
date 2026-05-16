'use strict';

const { applyHighlight, escapeHtml } = require('../src/highlighter');

describe('escapeHtml()', () => {
  test('escapes common HTML entities', () => {
    expect(escapeHtml('<script>alert("XSS & code \'injection\'")</script>'))
      .toBe('&lt;script&gt;alert(&quot;XSS &amp; code &#039;injection&#039;&quot;)&lt;/script&gt;');
  });

  test('returns empty string for non-string inputs', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(123)).toBe('');
  });
});

describe('applyHighlight()', () => {
  test('highlights keywords', () => {
    const code = 'const x = 42;';
    const result = applyHighlight(code, 'javascript');
    expect(result).toContain('<span class="hl-keyword">const</span>');
    expect(result).toContain('<span class="hl-number">42</span>');
  });

  test('highlights strings', () => {
    const code = 'let msg = "hello";';
    const result = applyHighlight(code, 'javascript');
    expect(result).toContain('<span class="hl-string">&quot;hello&quot;</span>');
  });

  test('highlights comments', () => {
    const code = '// comment\nlet x = 1;';
    const result = applyHighlight(code, 'javascript');
    expect(result).toContain('<span class="hl-comment">// comment</span>');
  });

  test('escapes HTML inside highlighted tokens', () => {
    const code = 'const tag = "<script>"; // <bad>';
    const result = applyHighlight(code, 'javascript');
    expect(result).toContain('<span class="hl-string">&quot;&lt;script&gt;&quot;</span>');
    expect(result).toContain('<span class="hl-comment">// &lt;bad&gt;</span>');
  });

  test('escapes unhighlighted text', () => {
    const code = 'a < b;';
    const result = applyHighlight(code, 'javascript');
    expect(result).toContain('a &lt; b;');
  });

  test('returns empty string for non-string inputs', () => {
    expect(applyHighlight(null, 'js')).toBe('');
    expect(applyHighlight(undefined, 'js')).toBe('');
  });

  test('resets lastIndex successfully between calls', () => {
    const code = 'const x = 1;';
    const r1 = applyHighlight(code, 'javascript');
    const r2 = applyHighlight(code, 'javascript');
    expect(r1).toBe(r2);
  });
});
