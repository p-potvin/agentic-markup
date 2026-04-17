'use strict';

const { findTargetNode, CONTAINER_SELECTORS } = require('../src/dom-utils');

describe('findTargetNode()', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('returns the first matching element from CONTAINER_SELECTORS', () => {
    // Setup: add two matching elements
    const firstMatch = document.createElement('div');
    firstMatch.className = 'markdown prose'; // second in list
    document.body.appendChild(firstMatch);

    const secondMatch = document.createElement('div');
    secondMatch.className = 'chat-response'; // later in list
    document.body.appendChild(secondMatch);

    const result = findTargetNode();
    expect(result).toBe(firstMatch);
  });

  test('returns the element matching a higher priority selector even if added later', () => {
    const lowerPriority = document.createElement('div');
    lowerPriority.className = 'chat-response';
    document.body.appendChild(lowerPriority);

    const higherPriority = document.createElement('div');
    higherPriority.setAttribute('data-message-author-role', 'assistant');
    document.body.appendChild(higherPriority);

    const result = findTargetNode();
    expect(result).toBe(higherPriority);
  });

  test('returns document.body if no selectors match', () => {
    const result = findTargetNode();
    expect(result).toBe(document.body);
  });

  test('handles each selector in CONTAINER_SELECTORS', () => {
    // Test helper to create an element from a selector
    function createElementFromSelector(selector) {
      // Very simple parser for the specific CONTAINER_SELECTORS we have
      const el = document.createElement('div');

      // 1. Handle classes (e.g. .markdown.prose)
      const classMatches = selector.match(/\.([\w-]+)/g);
      if (classMatches) {
        classMatches.forEach(c => el.classList.add(c.slice(1)));
      }

      // 2. Handle attributes (e.g. [data-is-streaming] or [role="main"])
      const attrMatches = selector.match(/\[([\w-]+)(?:="([^"]+)")?\]/g);
      if (attrMatches) {
        attrMatches.forEach(m => {
          const parts = m.match(/\[([\w-]+)(?:="([^"]+)")?\]/);
          if (parts[2]) {
            el.setAttribute(parts[1], parts[2]);
          } else {
            el.setAttribute(parts[1], '');
          }
        });
      }

      // 3. Handle tag names (e.g. model-response) - if no class/attr/id markers
      if (!selector.includes('.') && !selector.includes('[') && !selector.includes('#')) {
        return document.createElement(selector);
      }

      return el;
    }

    CONTAINER_SELECTORS.forEach(selector => {
      document.body.innerHTML = '';
      const el = createElementFromSelector(selector);
      document.body.appendChild(el);

      const result = findTargetNode();
      expect(result).toBe(el);
    });
  });
});
