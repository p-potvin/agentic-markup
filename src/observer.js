'use strict';

const { parse, hasIncompleteWidget } = require('./parser');
const { renderCollapse } = require('./widgets/collapse');
const { renderCallout }  = require('./widgets/callout');
const { renderTabs }     = require('./widgets/tabs');
const { renderBadge }    = require('./widgets/badge');

/**
 * Map a parsed segment to a DOM element.
 *
 * @param {Object} segment - A segment returned by parse().
 * @returns {HTMLElement|null}
 */
function buildWidget(segment) {
  switch (segment.type) {
    case 'collapse': return renderCollapse(segment);
    case 'callout':  return renderCallout(segment);
    case 'tabs':     return renderTabs(segment);
    case 'badge':    return renderBadge(segment);
    default:         return null;
  }
}

/**
 * Hydrate a single text node that contains one or more widget markers.
 *
 * Strategy (VDOM-safe):
 *  1. Parse the full textContent into segments.
 *  2. Wrap the original text node in a hidden <span> so the host framework
 *     still sees the original node in the DOM.
 *  3. For each segment, insert an adjacent sibling:
 *     - plain text segments → a new text node
 *     - widget segments     → a Shadow-DOM host element
 *  4. Mark the wrapper so we never process the same node twice.
 *
 * @param {Text} textNode - A DOM Text node to hydrate.
 */
function hydrateTextNode(textNode) {
  const text = textNode.textContent;

  // Skip empty or already-processed nodes.
  if (!text || !text.includes(':::')) return;

  const segments = parse(text);

  // If nothing changed (no widgets parsed), bail out.
  const hasWidgets = segments.some(s => s.type !== 'text');
  if (!hasWidgets) return;

  const parent = textNode.parentNode;
  if (!parent) return;

  // 1. Wrap original text node in a hidden span (keeps framework VDOM happy).
  const hiddenWrapper = document.createElement('span');
  hiddenWrapper.style.display = 'none';
  hiddenWrapper.setAttribute('data-am-original', 'true');
  parent.insertBefore(hiddenWrapper, textNode);
  hiddenWrapper.appendChild(textNode);

  // 2. Insert the hydrated segments as siblings after the hidden wrapper.
  const fragment = document.createDocumentFragment();

  for (const segment of segments) {
    if (segment.type === 'text') {
      if (segment.content) {
        fragment.appendChild(document.createTextNode(segment.content));
      }
    } else {
      const widget = buildWidget(segment);
      if (widget) {
        widget.setAttribute('data-am-widget', segment.type);
        fragment.appendChild(widget);
      }
    }
  }

  // Insert all new nodes after the hidden wrapper.
  hiddenWrapper.insertAdjacentElement
    ? hiddenWrapper.after(fragment)
    : parent.insertBefore(fragment, hiddenWrapper.nextSibling);
}

/**
 * Scan an element for text nodes that contain widget markers and hydrate them.
 *
 * Uses a TreeWalker for efficiency — only visits Text nodes and skips nodes
 * that are already inside `data-am-original` wrappers or `data-am-widget` hosts.
 *
 * @param {Element} root - Root element to scan.
 */
function scanAndHydrate(root) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        // Skip text that lives inside a widget or hidden wrapper we already made.
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.hasAttribute('data-am-original')) return NodeFilter.FILTER_REJECT;
        if (parent.closest('[data-am-widget]'))       return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.textContent.includes(':::')) {
      textNodes.push(node);
    }
  }

  // Hydrate outside the walker loop to avoid invalidating its internal cursor.
  for (const tn of textNodes) {
    // Skip nodes that are already streaming (incomplete widget).
    if (hasIncompleteWidget(tn.textContent)) continue;
    hydrateTextNode(tn);
  }
}

/**
 * Attach a MutationObserver to the given root element and hydrate widgets as
 * new content arrives (including real-time LLM token streaming).
 *
 * @param {Element} targetNode - Element to observe.
 * @returns {MutationObserver} The active observer (call .disconnect() to stop).
 */
function attachObserver(targetNode) {
  const observer = new MutationObserver((mutations) => {
    const rootsToScan = new Set();

    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            // Text node added directly — try to hydrate if complete.
            if (!hasIncompleteWidget(node.textContent)) {
              hydrateTextNode(node);
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Element added — queue its subtree for scanning.
            rootsToScan.add(node);
          }
        });
      } else if (mutation.type === 'characterData') {
        // An existing text node was modified (streaming append).
        const node = mutation.target;
        if (
          node.nodeType === Node.TEXT_NODE &&
          node.textContent.includes(':::') &&
          !hasIncompleteWidget(node.textContent)
        ) {
          hydrateTextNode(node);
        }
      }
    }

    for (const root of rootsToScan) {
      scanAndHydrate(root);
    }
  });

  observer.observe(targetNode, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  // Also scan existing content on the page right away.
  scanAndHydrate(targetNode);

  return observer;
}

module.exports = { attachObserver, hydrateTextNode, scanAndHydrate, buildWidget };
