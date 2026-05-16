'use strict';

const { parse, hasIncompleteWidget } = require('./parser');
const { renderCollapse } = require('./widgets/collapse');
const { renderCallout }  = require('./widgets/callout');
const { renderTabs }     = require('./widgets/tabs');
const { renderBadge }    = require('./widgets/badge');
const { renderCode }     = require('./widgets/code');

/**
 * Map an AST directive node to a DOM element.
 *
 * Dispatches on `node.name` (the directive type) for both containerDirective
 * and leafDirective nodes.  Returns null for plain text nodes and any
 * unrecognised directive names.
 *
 * @param {Object} node  AST node (containerDirective or leafDirective)
 * @returns {HTMLElement|null}
 */
function buildWidget(node) {
  if (!node || !node.name) return null;
  switch (node.name) {
    case 'collapse': return renderCollapse(node);
    case 'callout':  return renderCallout(node);
    case 'tabs':     return renderTabs(node);
    case 'code':     return renderCode(node);
    case 'badge':    return renderBadge(node);
    default:         return null;
  }
}

/**
 * Hydrate a single text node that contains one or more widget markers.
 *
 * Strategy (VDOM-safe):
 *  1. Parse the full textContent into an AST.
 *  2. Wrap the original text node in a hidden <span> so the host framework
 *     still sees the original node in the DOM.
 *  3. Walk the AST root's children and insert adjacent siblings:
 *     - text nodes        → plain DOM Text nodes
 *     - directive nodes   → Shadow-DOM widget host elements
 *  4. Mark the wrapper so we never process the same node twice.
 *
 * @param {Text} textNode - A DOM Text node to hydrate.
 */
function hydrateTextNode(textNode) {
  const text = textNode.textContent;

  // Skip empty or already-processed nodes.
  if (!text || !text.includes(':::')) return;

  const ast = parse(text);

  // Bail out if the AST has no directive nodes (nothing to hydrate).
  const hasWidgets = ast.children.some(
    n => n.type === 'containerDirective' || n.type === 'leafDirective'
  );
  if (!hasWidgets) return;

  const parent = textNode.parentNode;
  if (!parent) return;

  // 1. Wrap original text node in a hidden span (keeps framework VDOM happy).
  const hiddenWrapper = document.createElement('span');
  hiddenWrapper.style.display = 'none';
  hiddenWrapper.setAttribute('data-am-original', 'true');
  parent.insertBefore(hiddenWrapper, textNode);
  hiddenWrapper.appendChild(textNode);

  // 2. Build a fragment from the AST's top-level children.
  const fragment = document.createDocumentFragment();

  for (const node of ast.children) {
    if (node.type === 'text') {
      if (node.value) {
        fragment.appendChild(document.createTextNode(node.value));
      }
    } else if (
      node.type === 'containerDirective' ||
      node.type === 'leafDirective'
    ) {
      const widget = buildWidget(node);
      if (widget) {
        widget.setAttribute('data-am-widget', node.name);
        fragment.appendChild(widget);
      }
    }
  }

  // 3. Insert all new nodes after the hidden wrapper.
  parent.insertBefore(fragment, hiddenWrapper.nextSibling);
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
    // Skip nodes that are still streaming (incomplete widget).
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

