# agentic-markup

A browser extension (Chrome & Firefox) using a proprietary markup language to further customize in-browser agent responses.


## Features

- **Custom Plain-Text Markup Language:** Bypasses sanitizers by rendering plain text as UI components.
- **Widgets:**
  - **Collapse:** Collapsible `<details>` section for hiding verbose content.
  - **Callout:** Styled alert boxes (info, warning, error, success).
  - **Tabs:** Interactive tabbed panels for organizing content.
  - **Badge:** Inline pill for status or versions.
- **Copy to Clipboard:** Native copy buttons embedded in block widgets (`collapse` and `tabs`) to easily extract AI-generated raw content.
- **VDOM-Safe Injection:** Preserves the host page's Virtual DOM by using hidden wrappers instead of replacing nodes.
- **Shadow DOM Isolation:** Ensures widget styles are completely isolated from the host page.
- **Streaming Support:** MutationObserver handles real-time token streaming and hydrates widgets as they complete.
- **Cross-Platform:** Works on ChatGPT, Claude, Gemini, Copilot, and Bing Chat.

## How it works

AI chat interfaces (ChatGPT, Claude, Gemini, Copilot, etc.) sanitise HTML before rendering it. This extension takes a completely different approach: it defines a **custom plain-text markup language** that slips through every sanitiser undetected, because it looks like ordinary prose to the platform.

A **MutationObserver** content script watches the chat's response container for new text nodes as they stream in. When a recognised marker is found, the script:

1. Wraps the original text node in a hidden `<span>` (preserving the host framework's Virtual DOM).
2. Builds the actual UI component with `document.createElement()` and event listeners.
3. Injects the component as a sibling using a **Shadow DOM** host, isolating widget styles from the page.

```
Plain text in DOM                Rendered output
─────────────────                ───────────────
:::collapse[Title]         →     ▶ Title  (clickable details block)
  body text
:::
```

## Markup Syntax

Tell the AI to wrap its output in one of these markers.

Attributes use the `{key="value"}` format — a pair of curly braces immediately
after the directive name, containing space-separated `key="value"` pairs.

### Collapse (collapsible section)

```
:::collapse{summary="Section Title"}
Content that is hidden until the user clicks.
:::
```

### Callout (info / warning / error / success)

```
:::callout{variant="info"}
This is an informational note.
:::

:::callout{variant="warning"}
Something to be careful about.
:::

:::callout{variant="error"}
An error occurred.
:::

:::callout{variant="success"}
Operation completed successfully.
:::
```

### Tabs (tabbed panel)

Tab titles are listed in the `titles` attribute, separated by `|`.  
Tab bodies are separated by a line containing only `---`.

```
:::tabs{titles="Overview|Details|Examples"}
High-level summary here.
---
More detailed information.
---
Some code examples.
:::
```

### Badge (inline pill)

Badges are **leaf directives** — they open and close on the same line:

```
Status: :::badge{text="Stable" variant="success"}:::
Version: :::badge{text="v0.1.0" variant="info"}:::
```

Variants: `default` · `info` · `warning` · `error` · `success`

---

## Repository structure

```
agentic-markup/
├── extension/          # The loadable browser extension
│   ├── manifest.json   # Chrome MV3 + Firefox (gecko) manifest
│   ├── content.js      # Bundled content script (built by esbuild)
│   ├── background.js   # MV3 service worker
│   ├── icons/          # Extension icons (16, 48, 128 px)
│   └── popup/          # Browser-action popup
│       ├── popup.html
│       ├── popup.css
│       └── popup.js
├── src/                # Unbundled source (CommonJS)
│   ├── index.js        # Content script entry point
│   ├── observer.js     # MutationObserver + DOM hydration
│   ├── parser.js       # Custom markup language parser
│   └── widgets/
│       ├── collapse.js
│       ├── callout.js
│       ├── tabs.js
│       └── badge.js
├── tests/              # Jest unit tests (jsdom)
│   ├── parser.test.js
│   ├── observer.test.js
│   └── widgets/
│       ├── collapse.test.js
│       ├── callout.test.js
│       ├── tabs.test.js
│       └── badge.test.js
└── package.json
```

## Development

### Prerequisites

- Node.js ≥ 18

### Install dependencies

```bash
npm install
```

### Build the content script

```bash
npm run build
```

This bundles `src/index.js` → `extension/content.js` using esbuild.

```bash
npm run build:watch   # rebuild on file changes
```

### Run tests

```bash
npm test              # run all tests with coverage
npm run test:watch    # watch mode
```

### Load the extension in your browser

**Chrome / Edge**

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `extension/` directory

**Firefox**

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on** → select `extension/manifest.json`

For a permanent Firefox install, the extension must be signed. Use [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) for development:

```bash
npx web-ext run --source-dir extension/
```

---

## Supported platforms

The extension is currently configured to activate on:

| Platform | URL |
|---|---|
| ChatGPT | `chatgpt.com`, `chat.openai.com` |
| Claude | `claude.ai` |
| Gemini | `gemini.google.com` |
| Microsoft Copilot | `copilot.microsoft.com` |
| Bing Chat | `bing.com/chat` |

To add another platform, append its URL pattern to both `host_permissions` and `content_scripts.matches` in `extension/manifest.json`, then add its response-container selector to `CONTAINER_SELECTORS` in `src/index.js`.

---

## Technical notes

### FSM tokenizer → AST pipeline

Text is processed in two stages:

1. **Tokenizer** (`src/tokenizer.js`) — a line-level Finite State Machine that
   scans the character stream and emits a flat token array:
   - `DIRECTIVE_OPEN`  — `:::name{attrs}` opening fence
   - `DIRECTIVE_BODY`  — body lines accumulated between fences
   - `DIRECTIVE_CLOSE` — `:::` closing fence
   - `LEAF_DIRECTIVE`  — `:::name{attrs}:::` self-closing form
   - `TEXT`            — plain text outside any directive

   The FSM tracks **nesting depth** so inner directives (e.g. a `:::collapse`
   nested inside `:::tabs`) do not prematurely close the outer scope.

2. **Parser** (`src/parser.js`) — converts the flat token stream into an
   **Abstract Syntax Tree** using a node stack:
   - `root` — top-level document node
   - `containerDirective` — block directive with `name`, `attributes`,
     `rawBody`, and `children` (paragraph/text nodes)
   - `leafDirective` — self-closing directive with `name` and `attributes`
   - `paragraph` — a block of text within a directive body
   - `text` — plain text value

   `attributes` is a plain object parsed from the `{key="value"}` syntax.
   `rawBody` stores the raw directive body verbatim for widgets (like `tabs`)
   that need custom body splitting (e.g. `---` tab separators).

### VDOM-safe injection

Reactive chat frontends (React, Angular, Vue) keep an in-memory Virtual DOM. Directly removing a text node causes reconciliation errors or silent overwrites on the next render tick. The content script avoids this by:

- **Never deleting** the original text node — it is moved into a `display:none` wrapper.
- **Inserting widget elements as siblings**, not as replacements.
- Marking processed nodes with `data-am-original` / `data-am-widget` attributes to prevent double-processing.

### Shadow DOM isolation

Every widget is mounted on a Shadow DOM host (`attachShadow({ mode: 'open' })`). This provides:

- Complete CSS isolation from the host page's stylesheet.
- Protection against the host page's JavaScript accidentally querying widget internals.

### Streaming support

The MutationObserver listens for both `childList` and `characterData` mutations. The `hasIncompleteWidget()` helper uses the FSM tokenizer to count unmatched `DIRECTIVE_OPEN` vs `DIRECTIVE_CLOSE` tokens and defers hydration until the closing `:::` arrives.
