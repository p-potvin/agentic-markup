'use strict';

/**
 * Agentic Markup Parser
 *
 * Parses a custom markup language embedded in AI response text and returns
 * an array of segments suitable for DOM hydration.
 *
 * Supported widget types:
 *   :::collapse[Title] content :::
 *   :::callout[info|warning|error|success] content :::
 *   :::tabs[Tab 1|Tab 2] content 1\n---\ncontent 2 :::
 *   :::badge[text][variant]:::
 */

// Matches complete widget blocks.
// Group 1: widget type
// Group 2: first bracket argument (title / variant / tab titles)
// Group 3: optional second bracket argument (badge variant)
// Group 4: body content between the brackets and the closing :::
const WIDGET_RE = /:::(collapse|callout|tabs|badge)\[([^\]]+)\](?:\[([^\]]*)\])?([\s\S]*?):::/g;

/**
 * Parse text and return an ordered array of segments.
 *
 * Each segment is one of:
 *   { type: 'text',     content: string }
 *   { type: 'collapse', title: string, content: string }
 *   { type: 'callout',  variant: string, content: string }
 *   { type: 'tabs',     titles: string[], tabs: string[] }
 *   { type: 'badge',    text: string, variant: string }
 *
 * @param {string} text - Raw text that may contain widget markers.
 * @returns {Array<Object>} Ordered list of segments.
 */
function parse(text) {
  const segments = [];
  let lastIndex = 0;
  const re = new RegExp(WIDGET_RE.source, WIDGET_RE.flags);
  let match;

  while ((match = re.exec(text)) !== null) {
    // Emit any plain text that precedes this widget.
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    const [fullMatch, widgetType, arg1, arg2, rawContent] = match;
    const content = rawContent ? rawContent.trim() : '';

    switch (widgetType) {
      case 'collapse':
        segments.push({ type: 'collapse', title: arg1, content });
        break;
      case 'callout':
        segments.push({ type: 'callout', variant: arg1 || 'info', content });
        break;
      case 'tabs': {
        const titles = arg1.split('|').map(t => t.trim()).filter(Boolean);
        const tabs = parseTabContent(content);
        segments.push({ type: 'tabs', titles, tabs });
        break;
      }
      case 'badge':
        segments.push({ type: 'badge', text: arg1, variant: arg2 || 'default' });
        break;
      default:
        // Unknown widget type — emit as plain text so nothing is silently lost.
        segments.push({ type: 'text', content: fullMatch });
    }

    lastIndex = match.index + fullMatch.length;
  }

  // Emit any trailing plain text.
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments;
}

/**
 * Split the body of a :::tabs block into individual tab contents.
 * Tabs are separated by a line containing only `---`.
 *
 * @param {string} content - Raw body text of a tabs widget.
 * @returns {string[]} Content string for each tab.
 */
function parseTabContent(content) {
  return content.split(/\n---\n/).map(c => c.trim());
}

/**
 * Determine whether a string contains an unclosed widget marker.
 * Useful for detecting a streaming-in-progress state where the LLM
 * has emitted an opening ::: but not yet the closing :::.
 *
 * @param {string} text
 * @returns {boolean}
 */
function hasIncompleteWidget(text) {
  // Strip all complete widgets first, then check for a dangling opener.
  const stripped = text.replace(new RegExp(WIDGET_RE.source, WIDGET_RE.flags), '');
  return /:::[a-z]/.test(stripped);
}

module.exports = { parse, parseTabContent, hasIncompleteWidget };
