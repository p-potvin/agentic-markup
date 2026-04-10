"use strict";
var AgenticMarkup = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // src/parser.js
  var require_parser = __commonJS({
    "src/parser.js"(exports, module) {
      "use strict";
      var WIDGET_RE = /:::(collapse|callout|tabs|badge)\[([^\]]+)\](?:\[([^\]]*)\])?([\s\S]*?):::/g;
      function parse(text) {
        const segments = [];
        let lastIndex = 0;
        const re = new RegExp(WIDGET_RE.source, WIDGET_RE.flags);
        let match;
        while ((match = re.exec(text)) !== null) {
          if (match.index > lastIndex) {
            segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
          }
          const [fullMatch, widgetType, arg1, arg2, rawContent] = match;
          const content = rawContent ? rawContent.trim() : "";
          switch (widgetType) {
            case "collapse":
              segments.push({ type: "collapse", title: arg1, content });
              break;
            case "callout":
              segments.push({ type: "callout", variant: arg1 || "info", content });
              break;
            case "tabs": {
              const titles = arg1.split("|").map((t) => t.trim()).filter(Boolean);
              const tabs = parseTabContent(content);
              segments.push({ type: "tabs", titles, tabs });
              break;
            }
            case "badge":
              segments.push({ type: "badge", text: arg1, variant: arg2 || "default" });
              break;
            default:
              segments.push({ type: "text", content: fullMatch });
          }
          lastIndex = match.index + fullMatch.length;
        }
        if (lastIndex < text.length) {
          segments.push({ type: "text", content: text.slice(lastIndex) });
        }
        return segments;
      }
      function parseTabContent(content) {
        return content.split(/\n---\n/).map((c) => c.trim());
      }
      function hasIncompleteWidget(text) {
        const stripped = text.replace(new RegExp(WIDGET_RE.source, WIDGET_RE.flags), "");
        return /:::[a-z]/.test(stripped);
      }
      module.exports = { parse, parseTabContent, hasIncompleteWidget };
    }
  });

  // src/widgets/collapse.js
  var require_collapse = __commonJS({
    "src/widgets/collapse.js"(exports, module) {
      "use strict";
      function renderCollapse(data) {
        const host = document.createElement("span");
        host.classList.add("am-widget", "am-collapse-host");
        const shadow = host.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent = `
    details {
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 0;
      margin: 8px 0;
      font-family: inherit;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
      overflow: hidden;
    }
    summary {
      cursor: pointer;
      padding: 10px 14px;
      font-weight: 600;
      user-select: none;
      list-style: none;
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f9fafb;
      border-bottom: 1px solid transparent;
      transition: background 0.15s;
    }
    summary::-webkit-details-marker { display: none; }
    summary::before {
      content: '\u25B6';
      font-size: 0.7em;
      transition: transform 0.2s;
    }
    details[open] summary {
      border-bottom-color: #d1d5db;
      background: #f3f4f6;
    }
    details[open] summary::before { transform: rotate(90deg); }
    .content {
      padding: 12px 14px;
      white-space: pre-wrap;
      line-height: 1.6;
    }
  `;
        const details = document.createElement("details");
        const summary = document.createElement("summary");
        summary.textContent = data.title || "Details";
        const contentDiv = document.createElement("div");
        contentDiv.classList.add("content");
        contentDiv.textContent = data.content || "";
        details.appendChild(summary);
        details.appendChild(contentDiv);
        shadow.appendChild(style);
        shadow.appendChild(details);
        return host;
      }
      module.exports = { renderCollapse };
    }
  });

  // src/widgets/callout.js
  var require_callout = __commonJS({
    "src/widgets/callout.js"(exports, module) {
      "use strict";
      function renderCallout(data) {
        const variant = ["info", "warning", "error", "success"].includes(data.variant) ? data.variant : "info";
        const ICONS = {
          info: "\u2139\uFE0F",
          warning: "\u26A0\uFE0F",
          error: "\u274C",
          success: "\u2705"
        };
        const COLORS = {
          info: { bg: "#eff6ff", border: "#3b82f6", icon: "#2563eb", text: "#1e3a5f" },
          warning: { bg: "#fffbeb", border: "#f59e0b", icon: "#d97706", text: "#5c3d00" },
          error: { bg: "#fff1f2", border: "#f43f5e", icon: "#e11d48", text: "#5c001c" },
          success: { bg: "#f0fdf4", border: "#22c55e", icon: "#16a34a", text: "#14532d" }
        };
        const host = document.createElement("span");
        host.classList.add("am-widget", "am-callout-host");
        const shadow = host.attachShadow({ mode: "open" });
        const c = COLORS[variant];
        const style = document.createElement("style");
        style.textContent = `
    .callout {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      border: 1px solid ${c.border};
      border-left: 4px solid ${c.border};
      border-radius: 6px;
      background: ${c.bg};
      padding: 12px 14px;
      margin: 8px 0;
      font-family: inherit;
      color: ${c.text};
      line-height: 1.6;
    }
    .icon { font-size: 1.1em; flex-shrink: 0; margin-top: 1px; }
    .body { white-space: pre-wrap; }
  `;
        const callout = document.createElement("div");
        callout.classList.add("callout");
        const icon = document.createElement("span");
        icon.classList.add("icon");
        icon.textContent = ICONS[variant];
        const body = document.createElement("div");
        body.classList.add("body");
        body.textContent = data.content || "";
        callout.appendChild(icon);
        callout.appendChild(body);
        shadow.appendChild(style);
        shadow.appendChild(callout);
        return host;
      }
      module.exports = { renderCallout };
    }
  });

  // src/widgets/tabs.js
  var require_tabs = __commonJS({
    "src/widgets/tabs.js"(exports, module) {
      "use strict";
      function renderTabs(data) {
        const titles = Array.isArray(data.titles) ? data.titles : [];
        const tabs = Array.isArray(data.tabs) ? data.tabs : [];
        const host = document.createElement("span");
        host.classList.add("am-widget", "am-tabs-host");
        const shadow = host.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent = `
    .tabs-container {
      border: 1px solid #d1d5db;
      border-radius: 6px;
      overflow: hidden;
      margin: 8px 0;
      font-family: inherit;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
    }
    .tab-bar {
      display: flex;
      background: #f3f4f6;
      border-bottom: 1px solid #d1d5db;
      overflow-x: auto;
    }
    .tab-btn {
      padding: 8px 16px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      color: #6b7280;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      white-space: nowrap;
      transition: color 0.15s, border-color 0.15s;
    }
    .tab-btn:hover { color: #374151; }
    .tab-btn.active {
      color: #1d4ed8;
      border-bottom-color: #1d4ed8;
      background: #ffffff;
    }
    .tab-panel {
      display: none;
      padding: 14px;
      white-space: pre-wrap;
      line-height: 1.6;
    }
    .tab-panel.active { display: block; }
  `;
        const container = document.createElement("div");
        container.classList.add("tabs-container");
        const tabBar = document.createElement("div");
        tabBar.classList.add("tab-bar");
        const panels = [];
        const panelContainer = document.createElement("div");
        titles.forEach((title, i) => {
          const btn = document.createElement("button");
          btn.classList.add("tab-btn");
          if (i === 0)
            btn.classList.add("active");
          btn.textContent = title;
          btn.setAttribute("type", "button");
          const panel = document.createElement("div");
          panel.classList.add("tab-panel");
          if (i === 0)
            panel.classList.add("active");
          panel.textContent = tabs[i] !== void 0 ? tabs[i] : "";
          panels.push(panel);
          panelContainer.appendChild(panel);
          btn.addEventListener("click", () => {
            tabBar.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
            panels.forEach((p) => p.classList.remove("active"));
            btn.classList.add("active");
            panel.classList.add("active");
          });
          tabBar.appendChild(btn);
        });
        container.appendChild(tabBar);
        container.appendChild(panelContainer);
        shadow.appendChild(style);
        shadow.appendChild(container);
        return host;
      }
      module.exports = { renderTabs };
    }
  });

  // src/widgets/badge.js
  var require_badge = __commonJS({
    "src/widgets/badge.js"(exports, module) {
      "use strict";
      function renderBadge(data) {
        const variant = ["default", "info", "warning", "error", "success"].includes(data.variant) ? data.variant : "default";
        const COLORS = {
          default: { bg: "#f3f4f6", border: "#d1d5db", text: "#374151" },
          info: { bg: "#dbeafe", border: "#93c5fd", text: "#1e40af" },
          warning: { bg: "#fef9c3", border: "#fde047", text: "#854d0e" },
          error: { bg: "#ffe4e6", border: "#fca5a5", text: "#9f1239" },
          success: { bg: "#dcfce7", border: "#86efac", text: "#166534" }
        };
        const host = document.createElement("span");
        host.classList.add("am-widget", "am-badge-host");
        host.style.display = "inline";
        const shadow = host.attachShadow({ mode: "open" });
        const c = COLORS[variant];
        const style = document.createElement("style");
        style.textContent = `
    .badge {
      display: inline-block;
      padding: 1px 8px;
      border-radius: 999px;
      border: 1px solid ${c.border};
      background: ${c.bg};
      color: ${c.text};
      font-size: 0.75em;
      font-weight: 600;
      font-family: inherit;
      line-height: 1.5;
      vertical-align: middle;
      white-space: nowrap;
    }
  `;
        const badge = document.createElement("span");
        badge.classList.add("badge");
        badge.textContent = data.text || "";
        shadow.appendChild(style);
        shadow.appendChild(badge);
        return host;
      }
      module.exports = { renderBadge };
    }
  });

  // src/observer.js
  var require_observer = __commonJS({
    "src/observer.js"(exports, module) {
      "use strict";
      var { parse, hasIncompleteWidget } = require_parser();
      var { renderCollapse } = require_collapse();
      var { renderCallout } = require_callout();
      var { renderTabs } = require_tabs();
      var { renderBadge } = require_badge();
      function buildWidget(segment) {
        switch (segment.type) {
          case "collapse":
            return renderCollapse(segment);
          case "callout":
            return renderCallout(segment);
          case "tabs":
            return renderTabs(segment);
          case "badge":
            return renderBadge(segment);
          default:
            return null;
        }
      }
      function hydrateTextNode(textNode) {
        const text = textNode.textContent;
        if (!text || !text.includes(":::"))
          return;
        const segments = parse(text);
        const hasWidgets = segments.some((s) => s.type !== "text");
        if (!hasWidgets)
          return;
        const parent = textNode.parentNode;
        if (!parent)
          return;
        const hiddenWrapper = document.createElement("span");
        hiddenWrapper.style.display = "none";
        hiddenWrapper.setAttribute("data-am-original", "true");
        parent.insertBefore(hiddenWrapper, textNode);
        hiddenWrapper.appendChild(textNode);
        const fragment = document.createDocumentFragment();
        for (const segment of segments) {
          if (segment.type === "text") {
            if (segment.content) {
              fragment.appendChild(document.createTextNode(segment.content));
            }
          } else {
            const widget = buildWidget(segment);
            if (widget) {
              widget.setAttribute("data-am-widget", segment.type);
              fragment.appendChild(widget);
            }
          }
        }
        hiddenWrapper.insertAdjacentElement ? hiddenWrapper.after(fragment) : parent.insertBefore(fragment, hiddenWrapper.nextSibling);
      }
      function scanAndHydrate(root) {
        const walker = document.createTreeWalker(
          root,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode(node2) {
              const parent = node2.parentElement;
              if (!parent)
                return NodeFilter.FILTER_REJECT;
              if (parent.hasAttribute("data-am-original"))
                return NodeFilter.FILTER_REJECT;
              if (parent.closest("[data-am-widget]"))
                return NodeFilter.FILTER_REJECT;
              return NodeFilter.FILTER_ACCEPT;
            }
          }
        );
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent.includes(":::")) {
            textNodes.push(node);
          }
        }
        for (const tn of textNodes) {
          if (hasIncompleteWidget(tn.textContent))
            continue;
          hydrateTextNode(tn);
        }
      }
      function attachObserver2(targetNode) {
        const observer = new MutationObserver((mutations) => {
          const rootsToScan = /* @__PURE__ */ new Set();
          for (const mutation of mutations) {
            if (mutation.type === "childList") {
              mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                  if (!hasIncompleteWidget(node.textContent)) {
                    hydrateTextNode(node);
                  }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                  rootsToScan.add(node);
                }
              });
            } else if (mutation.type === "characterData") {
              const node = mutation.target;
              if (node.nodeType === Node.TEXT_NODE && node.textContent.includes(":::") && !hasIncompleteWidget(node.textContent)) {
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
          characterData: true
        });
        scanAndHydrate(targetNode);
        return observer;
      }
      module.exports = { attachObserver: attachObserver2, hydrateTextNode, scanAndHydrate, buildWidget };
    }
  });

  // src/index.js
  var { attachObserver } = require_observer();
  var CONTAINER_SELECTORS = [
    // ChatGPT
    '[data-message-author-role="assistant"]',
    ".markdown.prose",
    // Claude
    "[data-is-streaming]",
    ".font-claude-message",
    // Gemini
    "model-response",
    ".model-response-text",
    // Copilot / Bing Chat
    '.content[role="main"]',
    // Generic fallback classes used by many chat interfaces
    ".response-container-content",
    ".chat-response",
    ".assistant-message"
  ];
  function findTargetNode() {
    for (const selector of CONTAINER_SELECTORS) {
      const el = document.querySelector(selector);
      if (el)
        return el;
    }
    return document.body;
  }
  function init() {
    const target = findTargetNode();
    attachObserver(target);
    const appObserver = new MutationObserver(() => {
      const newTarget = findTargetNode();
      if (newTarget !== target) {
        appObserver.disconnect();
        attachObserver(newTarget);
      }
    });
    appObserver.observe(document.body, { childList: true, subtree: false });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
