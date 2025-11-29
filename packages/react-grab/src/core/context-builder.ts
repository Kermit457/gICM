/**
 * Context Builder - Build clipboard-ready context from element
 */

import type { ElementContext } from "../types.js";
import { getComponentStack } from "./react-fiber.js";
import { MAX_TEXT_LENGTH, MAX_HTML_LENGTH } from "../constants.js";

/**
 * Build full element context
 */
export function buildElementContext(element: HTMLElement): ElementContext {
  const tagName = element.tagName.toLowerCase();
  const classes = getClasses(element);
  const attributes = getAttributes(element);
  const textContent = getTextContent(element);
  const innerHTML = getInnerHTML(element);
  const componentStack = getComponentStack(element);
  const rect = element.getBoundingClientRect();

  return {
    tagName,
    classes,
    attributes,
    textContent,
    innerHTML,
    componentStack,
    rect,
    element,
  };
}

/**
 * Build clipboard text in React Grab format
 */
export function buildClipboardText(context: ElementContext): string {
  const { tagName, classes, attributes, textContent, componentStack } = context;

  let text = "<selected_element>\n";

  // Build opening tag
  let tag = `  <${tagName}`;
  if (classes.length > 0) {
    tag += ` class="${classes.join(" ")}"`;
  }
  for (const [key, value] of Object.entries(attributes)) {
    tag += ` ${key}="${escapeAttr(value)}"`;
  }
  tag += ">";
  text += tag + "\n";

  // Text content
  if (textContent) {
    text += `    ${textContent}\n`;
  }

  // Closing tag
  text += `  </${tagName}>\n`;

  // Component stack
  for (const item of componentStack) {
    text += `  at ${item.name} in ${item.file}:${item.line}:${item.column}\n`;
  }

  text += "</selected_element>";

  return text;
}

/**
 * Build a shorter summary for display
 */
export function buildSummary(context: ElementContext): string {
  const { tagName, classes, componentStack } = context;

  let summary = `<${tagName}>`;

  if (classes.length > 0) {
    const displayClasses = classes.slice(0, 2).join(".");
    summary = `<${tagName}.${displayClasses}>`;
  }

  if (componentStack.length > 0) {
    const comp = componentStack[0];
    summary += ` in ${comp.name}`;
  }

  return summary;
}

// --- Helper Functions ---

function getClasses(element: HTMLElement): string[] {
  if (!element.className) return [];

  if (typeof element.className === "string") {
    return element.className.split(/\s+/).filter(Boolean);
  }

  // SVG elements have className as SVGAnimatedString
  if ((element.className as any).baseVal) {
    return (element.className as any).baseVal.split(/\s+/).filter(Boolean);
  }

  return [];
}

function getAttributes(element: HTMLElement): Record<string, string> {
  const attrs: Record<string, string> = {};
  const skipAttrs = new Set(["class", "style"]);

  for (const attr of element.attributes) {
    if (!skipAttrs.has(attr.name) && !attr.name.startsWith("data-reactroot")) {
      attrs[attr.name] = attr.value;
    }
  }

  return attrs;
}

function getTextContent(element: HTMLElement): string | null {
  const text = element.textContent?.trim();
  if (!text) return null;

  if (text.length > MAX_TEXT_LENGTH) {
    return text.slice(0, MAX_TEXT_LENGTH) + "...";
  }

  return text;
}

function getInnerHTML(element: HTMLElement): string {
  const html = element.innerHTML.trim();

  if (html.length > MAX_HTML_LENGTH) {
    return html.slice(0, MAX_HTML_LENGTH) + "...";
  }

  return html;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
