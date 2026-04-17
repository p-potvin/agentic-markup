'use strict';

const { parseAttributes } = require('../src/tokenizer');

describe('parseAttributes() security', () => {
  test('should not have a prototype', () => {
    const attrs = parseAttributes('{}');
    expect(Object.getPrototypeOf(attrs)).toBeNull();
    expect(attrs.constructor).toBeUndefined();
    expect(attrs.toString).toBeUndefined();
  });

  test('should treat __proto__ as a normal property', () => {
    const attrs = parseAttributes('{__proto__="polluted"}');
    expect(attrs.__proto__).toBe('polluted');
    expect(Object.getPrototypeOf(attrs)).toBeNull();
  });

  test('should treat constructor as a normal property', () => {
    const attrs = parseAttributes('{constructor="polluted"}');
    expect(attrs.constructor).toBe('polluted');
  });
});
