# Task Delegation: Implement "Copy to Clipboard" for Widgets

## Agent Assigned: kraftwerk

## Objective
Implement a "Copy to Clipboard" button for block widgets (`collapse` and `tabs`) to allow users to easily copy the AI-generated raw content (`rawBody`) contained within these widgets.

## Requirements
1. **Button UI:** Add a visual "Copy" button to the `collapse` and `tabs` widgets. It should be positioned intuitively (e.g., top right corner of the widget or next to the summary/tabs).
2. **Clipboard Action:** When clicked, the button should copy the `rawBody` text associated with the widget to the system clipboard using the standard `navigator.clipboard.writeText` API.
3. **Feedback Mechanism:** Provide immediate visual feedback (e.g., changing the button text to "Copied!" for a few seconds, or a checkmark icon) to indicate success.
4. **Error Handling:** Implement basic error handling in case the clipboard API fails (e.g., fallback to older execution commands if necessary, or simply console log the error securely without crashing the widget).
5. **Security Constraint:** Ensure that the text being copied exactly matches the `rawBody` node data to prevent cross-site scripting or unexpected execution. Keep security boundaries in mind.
6. **Tests:** Update or add new Jest unit tests (using jsdom) to verify that the button renders and functions as expected within the widget's shadow DOM.
7. **Modularity:** Adhere to the existing project structure, making updates primarily within `src/widgets/collapse.js` and `src/widgets/tabs.js`. Ensure styles inside the Shadow DOM are properly scoped.

## Context
Currently, AI chat platforms typically offer native "copy" buttons for standard code blocks. By wrapping content in our custom `agentic-markup` widgets, users lose this native functionality. Re-implementing a localized "copy" button within our shadow DOM widgets directly addresses this UX degradation.

Please review the widget rendering logic in `src/widgets/collapse.js` and `src/widgets/tabs.js` to begin.
