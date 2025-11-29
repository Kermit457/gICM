/**
 * Selection Overlay - Visual highlight for hovered element
 */

import type { ThemeConfig } from "../types.js";
import { ELEMENT_ID } from "../constants.js";

export class Overlay {
  private element: HTMLDivElement;
  private theme: ThemeConfig;

  constructor(theme: ThemeConfig) {
    this.theme = theme;
    this.element = this.createElement();
  }

  private createElement(): HTMLDivElement {
    const el = document.createElement("div");
    el.id = ELEMENT_ID.OVERLAY;
    this.applyStyles(el);
    return el;
  }

  private applyStyles(el: HTMLDivElement): void {
    const hue = this.theme.hue ?? 280;
    const borderColor = this.theme.borderColor || `hsl(${hue}, 70%, 60%)`;
    const bgColor =
      this.theme.backgroundColor || `hsla(${hue}, 70%, 60%, 0.1)`;

    el.style.cssText = `
      position: fixed;
      pointer-events: none;
      border: 2px solid ${borderColor};
      background: ${bgColor};
      border-radius: 4px;
      z-index: 2147483646;
      transition: all 0.05s ease-out;
      display: none;
    `;
  }

  show(): void {
    if (!this.element.parentNode) {
      document.body.appendChild(this.element);
    }
  }

  hide(): void {
    this.element.style.display = "none";
  }

  update(rect: DOMRect): void {
    this.element.style.display = "block";
    this.element.style.top = `${rect.top}px`;
    this.element.style.left = `${rect.left}px`;
    this.element.style.width = `${rect.width}px`;
    this.element.style.height = `${rect.height}px`;
  }

  clear(): void {
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
