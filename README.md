# agentic-markup

A browser extension (Chrome & Firefox) using a proprietary markup language to further customize in-browser agent responses.

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

Tell the AI to wrap its output in one of these markers:

### Collapse (collapsible section)

```
:::collapse[Section Title]
Content that is hidden until the user clicks.
:::
```

### Callout (info / warning / error / success)

```
:::callout[info]
This is an informational note.
:::

:::callout[warning]
Something to be careful about.
:::

:::callout[error]
An error occurred.
:::

:::callout[success]
Operation completed successfully.
:::
```

### Tabs (tabbed panel)

Tab titles are declared in the header separated by `|`.  
Tab bodies are separated by a line containing only `---`.

```
:::tabs[Overview|Details|Examples]
High-level summary here.
---
More detailed information.
---
Some code examples.
:::
```

### Badge (inline pill)

```
Status: :::badge[Stable][success]:::
Version: :::badge[v0.1.0][info]:::
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

The MutationObserver listens for both `childList` and `characterData` mutations. The `hasIncompleteWidget()` helper detects a partial marker (e.g. `:::collap` still being streamed) and skips processing until the closing `:::` arrives.
