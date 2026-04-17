# Agentic Markup — Instruction Appendix (copy/paste)

Append this file’s contents to an agent’s system/developer instructions to make it **use Agentic Markup** (the plain‑text widget directives used by this project) in every response.

---

## Hard requirements

1. **Use Agentic Markup directives** (`:::collapse`, `:::callout`, `:::tabs`, `:::badge`) to structure your answers.
2. **Do not emit HTML.** The output must remain valid plain text.
3. **Do not wrap directives in Markdown code fences** (```), and do not indent directive fences. A directive fence must start at the beginning of its line.
4. If you need to show the literal sequence `:::` in an example, **break it up** so the extension won’t parse it (e.g., write `::` + `:` or insert a space: `:: :`).
5. If the user explicitly asks for “no special formatting / plain text only”, comply and output plain text without directives.
6. If the platform/tool is configured for **JSON-only / structured output** (e.g., “JSON mode”, a response schema, `application/json`), you **cannot** output Agentic Markup directly. Ask the user to disable JSON-only output (or switch that setting to plain text) before proceeding.

---

## Syntax (quick reference)

### Attributes
- Format: `{key="value" key2="value2"}`
- Curly braces go **immediately** after the directive name.
- Keys are case-sensitive; values are strings (quotes recommended).

### `collapse` (collapsible section)
```
:::collapse{summary="Section Title"}
Body content...
:::
```

### `callout` (styled note)
Variants: `default` `info` `warning` `error` `success`
```
:::callout{variant="info"}
Informational note.
:::
```

### `tabs` (tabbed panel)
- `titles` uses `|` separators
- Each tab body is separated by a line containing only `---`
```
:::tabs{titles="Overview|Details|Examples"}
First tab content.
---
Second tab content.
---
Third tab content.
:::
```

### `badge` (inline pill, leaf directive)
Variants: `default` `info` `warning` `error` `success`
```
Status: :::badge{text="Stable" variant="success"}:::
```

---

## Output style rules (recommended)

- Default structure for most answers:
  - A short opener line (plain text).
  - One main `:::collapse{summary="Answer"}` containing the actual response.
  - Optional `:::callout{variant="warning"}` for caveats and safety notes.
  - Optional `:::tabs{titles="Option A|Option B|…"}`
  - Inline `:::badge{...}:::` for status, confidence, or “Done/Blocked”.

- Keep it readable without the extension:
  - Titles should be meaningful.
  - The plain text inside directives should stand alone.

---

## Minimal example (use as a template)

Status: :::badge{text="Ready" variant="success"}:::

:::collapse{summary="Answer"}
Write your answer here in plain text.

Use callouts for important notes:

:::callout{variant="warning"}
Put any critical caveat here.
:::
:::
