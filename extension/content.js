"use strict";
var AgenticMarkup = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // src/tokenizer.js
  var require_tokenizer = __commonJS({
    "src/tokenizer.js"(exports, module) {
      "use strict";
      var TOKEN = Object.freeze({
        /** Plain text outside any directive. */
        TEXT: "TEXT",
        /** Opening fence of a block directive: :::name{attrs} */
        DIRECTIVE_OPEN: "DIRECTIVE_OPEN",
        /** One or more body lines accumulated inside a block directive. */
        DIRECTIVE_BODY: "DIRECTIVE_BODY",
        /** Closing fence of a block directive: ::: */
        DIRECTIVE_CLOSE: "DIRECTIVE_CLOSE",
        /** Self-closing leaf directive: :::name{attrs}::: */
        LEAF_DIRECTIVE: "LEAF_DIRECTIVE"
      });
      var RE_LEAF_LINE = /^:::([\w-]+)(\{[^}]*\})?:::\s*$/;
      var RE_OPEN_LINE = /^:::([\w-]+)(\{[^}]*\})?\s*$/;
      var RE_CLOSE_LINE = /^:::\s*$/;
      var RE_INLINE_LEAF = /:::([\w-]+)(\{[^}]*\})?:::/g;
      function parseAttributes(raw) {
        const attrs = /* @__PURE__ */ Object.create(null);
        if (!raw)
          return attrs;
        const inner = raw.slice(1, -1);
        const re = /([\w-]+)\s*=\s*(?:"([^"]*)"|([^\s}"']*))/g;
        let m;
        while ((m = re.exec(inner)) !== null) {
          attrs[m[1]] = m[2] !== void 0 ? m[2] : m[3];
        }
        return attrs;
      }
      function tokenize(text) {
        const tokens = [];
        const lines = text.split("\n");
        let state = "OUTER";
        let depth = 0;
        const textBuf = [];
        const bodyBuf = [];
        function flushText() {
          if (textBuf.length === 0)
            return;
          const value = textBuf.join("\n");
          textBuf.length = 0;
          if (value === "")
            return;
          tokens.push({ type: TOKEN.TEXT, value });
        }
        function flushBody() {
          if (bodyBuf.length === 0)
            return;
          tokens.push({ type: TOKEN.DIRECTIVE_BODY, value: bodyBuf.join("\n") });
          bodyBuf.length = 0;
        }
        for (const line of lines) {
          if (state === "OUTER") {
            if (RE_LEAF_LINE.test(line)) {
              flushText();
              const m = RE_LEAF_LINE.exec(line);
              tokens.push({
                type: TOKEN.LEAF_DIRECTIVE,
                name: m[1],
                attributes: parseAttributes(m[2])
              });
            } else if (RE_OPEN_LINE.test(line)) {
              flushText();
              const m = RE_OPEN_LINE.exec(line);
              tokens.push({
                type: TOKEN.DIRECTIVE_OPEN,
                name: m[1],
                attributes: parseAttributes(m[2])
              });
              depth++;
              state = "IN_BLOCK";
            } else {
              RE_INLINE_LEAF.lastIndex = 0;
              if (RE_INLINE_LEAF.test(line)) {
                flushText();
                RE_INLINE_LEAF.lastIndex = 0;
                let last = 0;
                let m;
                while ((m = RE_INLINE_LEAF.exec(line)) !== null) {
                  if (m.index > last) {
                    tokens.push({ type: TOKEN.TEXT, value: line.slice(last, m.index) });
                  }
                  tokens.push({
                    type: TOKEN.LEAF_DIRECTIVE,
                    name: m[1],
                    attributes: parseAttributes(m[2])
                  });
                  last = m.index + m[0].length;
                }
                if (last < line.length) {
                  tokens.push({ type: TOKEN.TEXT, value: line.slice(last) });
                }
              } else {
                textBuf.push(line);
              }
            }
          } else {
            if (RE_CLOSE_LINE.test(line)) {
              flushBody();
              tokens.push({ type: TOKEN.DIRECTIVE_CLOSE });
              depth--;
              if (depth === 0) {
                state = "OUTER";
              }
            } else if (RE_OPEN_LINE.test(line)) {
              flushBody();
              const m = RE_OPEN_LINE.exec(line);
              tokens.push({
                type: TOKEN.DIRECTIVE_OPEN,
                name: m[1],
                attributes: parseAttributes(m[2])
              });
              depth++;
            } else {
              bodyBuf.push(line);
            }
          }
        }
        flushBody();
        flushText();
        return tokens;
      }
      module.exports = { tokenize, parseAttributes, TOKEN };
    }
  });

  // src/parser.js
  var require_parser = __commonJS({
    "src/parser.js"(exports, module) {
      "use strict";
      var { tokenize, TOKEN } = require_tokenizer();
      function bodyToParagraphs(bodyText) {
        if (!bodyText || !bodyText.trim())
          return [];
        const normalised = bodyText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        return normalised.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean).map((block) => ({
          type: "paragraph",
          children: [{ type: "text", value: block }]
        }));
      }
      function getNodeText(node) {
        if (!node)
          return "";
        if (node.type === "text")
          return node.value || "";
        if (node.rawBody !== void 0)
          return node.rawBody;
        if (Array.isArray(node.children)) {
          return node.children.map(getNodeText).filter(Boolean).join("\n");
        }
        return "";
      }
      function parse(text) {
        const tokens = tokenize(text);
        const root = { type: "root", children: [] };
        const stack = [root];
        function current() {
          return stack[stack.length - 1];
        }
        for (const token of tokens) {
          switch (token.type) {
            case TOKEN.TEXT: {
              current().children.push({ type: "text", value: token.value });
              break;
            }
            case TOKEN.DIRECTIVE_OPEN: {
              const node = {
                type: "containerDirective",
                name: token.name,
                attributes: token.attributes,
                rawBody: "",
                children: []
              };
              current().children.push(node);
              stack.push(node);
              break;
            }
            case TOKEN.DIRECTIVE_BODY: {
              const node = current();
              if (node.rawBody !== void 0) {
                node.rawBody = node.rawBody ? node.rawBody + "\n" + token.value : token.value;
              }
              const paragraphs = bodyToParagraphs(token.value);
              paragraphs.forEach((p) => node.children.push(p));
              break;
            }
            case TOKEN.DIRECTIVE_CLOSE: {
              if (stack.length > 1)
                stack.pop();
              break;
            }
            case TOKEN.LEAF_DIRECTIVE: {
              current().children.push({
                type: "leafDirective",
                name: token.name,
                attributes: token.attributes
              });
              break;
            }
            default:
              break;
          }
        }
        return root;
      }
      function hasIncompleteWidget(text) {
        const tokens = tokenize(text);
        let depth = 0;
        for (const t of tokens) {
          if (t.type === TOKEN.DIRECTIVE_OPEN)
            depth++;
          if (t.type === TOKEN.DIRECTIVE_CLOSE)
            depth--;
        }
        return depth > 0;
      }
      module.exports = { parse, getNodeText, bodyToParagraphs, hasIncompleteWidget };
    }
  });

  // src/widgets/collapse.js
  var require_collapse = __commonJS({
    "src/widgets/collapse.js"(exports, module) {
      "use strict";
      var { getNodeText } = require_parser();
      function renderCollapse(node) {
        const title = node.attributes && node.attributes.summary || "Details";
        const content = getNodeText(node);
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
        summary.textContent = title;
        const contentDiv = document.createElement("div");
        contentDiv.classList.add("content");
        contentDiv.textContent = content;
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
      var { getNodeText } = require_parser();
      function renderCallout(node) {
        const raw = node.attributes && node.attributes.variant || "info";
        const variant = ["info", "warning", "error", "success"].includes(raw) ? raw : "info";
        const content = getNodeText(node);
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
        body.textContent = content;
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
      var { getNodeText } = require_parser();
      function renderTabs(node) {
        const titlesAttr = node.attributes && node.attributes.titles || "";
        const titles = titlesAttr.split("|").map((t) => t.trim()).filter(Boolean);
        const raw = getNodeText(node);
        const tabs = raw ? raw.split(/\n---\n/).map((t) => t.trim()) : [];
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
      function renderBadge(node) {
        const text = node.attributes && node.attributes.text || "";
        const rawVar = node.attributes && node.attributes.variant || "default";
        const variant = ["default", "info", "warning", "error", "success"].includes(rawVar) ? rawVar : "default";
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
        badge.textContent = text;
        shadow.appendChild(style);
        shadow.appendChild(badge);
        return host;
      }
      module.exports = { renderBadge };
    }
  });

  // src/widgets/code.js
  var require_code = __commonJS({
    "src/widgets/code.js"(exports, module) {
      "use strict";
      var { getNodeText } = require_parser();
      function renderCode(node) {
        const language = node.attributes && node.attributes.language || "plaintext";
        const content = getNodeText(node);
        const host = document.createElement("span");
        host.classList.add("am-widget", "am-code-host");
        const shadow = host.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent = `
    .code-container {
      position: relative;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      margin: 8px 0;
      background: #282c34; /* Dark theme */
      color: #abb2bf;
      font-family: 'Inter', sans-serif;
      overflow: hidden;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #21252b;
      padding: 6px 12px;
      font-size: 0.85em;
      border-bottom: 1px solid #181a1f;
    }
    .language-label {
      color: #5c6370;
      font-weight: 600;
      text-transform: uppercase;
    }
    .copy-btn {
      background: transparent;
      border: 1px solid #3e4451;
      color: #abb2bf;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 0.9em;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }
    .copy-btn:hover {
      background: #3e4451;
      color: #ffffff;
    }
    .copy-btn.copied {
      background: #98c379;
      color: #282c34;
      border-color: #98c379;
    }
    pre {
      margin: 0;
      padding: 12px;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 0.9em;
      line-height: 1.5;
    }
    code {
      font-family: inherit;
    }
  `;
        const container = document.createElement("div");
        container.classList.add("code-container");
        const header = document.createElement("div");
        header.classList.add("header");
        const langLabel = document.createElement("span");
        langLabel.classList.add("language-label");
        langLabel.textContent = language;
        const copyBtn = document.createElement("button");
        copyBtn.classList.add("copy-btn");
        copyBtn.textContent = "Copy";
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(content).then(() => {
            copyBtn.textContent = "Copied!";
            copyBtn.classList.add("copied");
            setTimeout(() => {
              copyBtn.textContent = "Copy";
              copyBtn.classList.remove("copied");
            }, 2e3);
          }).catch((err) => {
            console.error("Failed to copy text: ", err);
            copyBtn.textContent = "Error";
          });
        });
        header.appendChild(langLabel);
        header.appendChild(copyBtn);
        const pre = document.createElement("pre");
        const codeEl = document.createElement("code");
        codeEl.textContent = content;
        pre.appendChild(codeEl);
        container.appendChild(header);
        container.appendChild(pre);
        shadow.appendChild(style);
        shadow.appendChild(container);
        return host;
      }
      module.exports = { renderCode };
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
      var { renderCode } = require_code();
      function buildWidget(node) {
        if (!node || !node.name)
          return null;
        switch (node.name) {
          case "collapse":
            return renderCollapse(node);
          case "callout":
            return renderCallout(node);
          case "tabs":
            return renderTabs(node);
          case "code":
            return renderCode(node);
          case "badge":
            return renderBadge(node);
          default:
            return null;
        }
      }
      function hydrateTextNode(textNode) {
        const text = textNode.textContent;
        if (!text || !text.includes(":::"))
          return;
        const ast = parse(text);
        const hasWidgets = ast.children.some(
          (n) => n.type === "containerDirective" || n.type === "leafDirective"
        );
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
        for (const node of ast.children) {
          if (node.type === "text") {
            if (node.value) {
              fragment.appendChild(document.createTextNode(node.value));
            }
          } else if (node.type === "containerDirective" || node.type === "leafDirective") {
            const widget = buildWidget(node);
            if (widget) {
              widget.setAttribute("data-am-widget", node.name);
              fragment.appendChild(widget);
            }
          }
        }
        parent.insertBefore(fragment, hiddenWrapper.nextSibling);
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
