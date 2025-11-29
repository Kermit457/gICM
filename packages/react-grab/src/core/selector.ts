/**
 * Element Selector - Handle mouse interactions for element selection
 */

import type { ElementContext } from "../types.js";
import { buildElementContext } from "./context-builder.js";

export interface SelectorConfig {
  onHover: (
    element: HTMLElement | null,
    context: ElementContext | null
  ) => void;
  onClick: (element: HTMLElement, context: ElementContext) => void;
}

export class ElementSelector {
  private config: SelectorConfig;
  private isActive = false;
  private hoveredElement: HTMLElement | null = null;

  private boundHandleMouseMove: (e: MouseEvent) => void;
  private boundHandleClick: (e: MouseEvent) => void;
  private boundHandleScroll: () => void;

  constructor(config: SelectorConfig) {
    this.config = config;
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleClick = this.handleClick.bind(this);
    this.boundHandleScroll = this.handleScroll.bind(this);
  }

  activate(): void {
    if (this.isActive) return;

    this.isActive = true;
    document.addEventListener("mousemove", this.boundHandleMouseMove);
    document.addEventListener("click", this.boundHandleClick, true);
    document.addEventListener("scroll", this.boundHandleScroll, true);
    document.body.style.cursor = "crosshair";
  }

  deactivate(): void {
    if (!this.isActive) return;

    this.isActive = false;
    document.removeEventListener("mousemove", this.boundHandleMouseMove);
    document.removeEventListener("click", this.boundHandleClick, true);
    document.removeEventListener("scroll", this.boundHandleScroll, true);
    document.body.style.cursor = "";

    this.hoveredElement = null;
    this.config.onHover(null, null);
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isActive) return;

    const element = this.getElementAtPoint(e.clientX, e.clientY);

    if (element !== this.hoveredElement) {
      this.hoveredElement = element;

      if (element) {
        const context = buildElementContext(element);
        this.config.onHover(element, context);
      } else {
        this.config.onHover(null, null);
      }
    }
  }

  private handleClick(e: MouseEvent): void {
    if (!this.isActive) return;

    // Prevent default click behavior
    e.preventDefault();
    e.stopPropagation();

    const element = this.getElementAtPoint(e.clientX, e.clientY);

    if (element) {
      const context = buildElementContext(element);
      this.config.onClick(element, context);
    }
  }

  private handleScroll(): void {
    // Re-evaluate hovered element on scroll
    if (this.hoveredElement) {
      const context = buildElementContext(this.hoveredElement);
      this.config.onHover(this.hoveredElement, context);
    }
  }

  private getElementAtPoint(x: number, y: number): HTMLElement | null {
    const element = document.elementFromPoint(x, y);

    if (!element) return null;
    if (!(element instanceof HTMLElement)) return null;

    // Skip our own UI elements
    if (element.id?.startsWith("gicm-grab")) return null;
    if (element.closest("[id^='gicm-grab']")) return null;

    return element;
  }

  getHoveredElement(): HTMLElement | null {
    return this.hoveredElement;
  }
}
