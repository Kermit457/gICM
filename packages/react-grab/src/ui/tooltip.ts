/**
 * Tooltip - Shows element info on hover
 */

import type { ThemeConfig, ElementContext } from "../types.js";
import { ELEMENT_ID } from "../constants.js";
import { buildSummary } from "../core/context-builder.js";

export class Tooltip {
  private element: HTMLDivElement;
  private theme: ThemeConfig;

  constructor(theme: ThemeConfig) {
    this.theme = theme;
    this.element = this.createElement();
  }

  private createElement(): HTMLDivElement {
    const el = document.createElement("div");
    el.id = ELEMENT_ID.LABEL;
    this.applyStyles(el);
    return el;
  }

  private applyStyles(el: HTMLDivElement): void {
    const hue = this.theme.hue ?? 280;
    const bgColor =
      this.theme.label?.backgroundColor || `hsl(${hue}, 70%, 35%)`;
    const textColor = this.theme.label?.textColor || "#ffffff";

    el.style.cssText = `
      position: fixed;
      background: ${bgColor};
      color: ${textColor};
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
      font-weight: 500;
      z-index: 2147483647;
      pointer-events: none;
      display: none;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
  }

  show(element: HTMLElement, context: ElementContext): void {
    if (!this.element.parentNode) {
      document.body.appendChild(this.element);
    }

    const summary = buildSummary(context);
    this.element.textContent = summary;

    const rect = context.rect;
    const tooltipRect = this.element.getBoundingClientRect();

    // Position above element, or below if no space
    let top = rect.top - 28;
    if (top < 4) {
      top = rect.bottom + 4;
    }

    // Keep within viewport horizontally
    let left = rect.left;
    if (left + tooltipRect.width > window.innerWidth - 4) {
      left = window.innerWidth - tooltipRect.width - 4;
    }

    this.element.style.display = "block";
    this.element.style.top = `${top}px`;
    this.element.style.left = `${left}px`;
  }

  hide(): void {
    this.element.style.display = "none";
  }

  updateTheme(theme: ThemeConfig): void {
    this.theme = theme;
    this.applyStyles(this.element);
  }

  destroy(): void {
    this.element.remove();
  }
}
