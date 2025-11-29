/**
 * Main Grabber Class - Orchestrates all components
 */

import type {
  GrabConfig,
  GrabState,
  GrabAPI,
  ElementContext,
} from "../types.js";
import { DEFAULT_CONFIG, DEFAULT_THEME } from "../constants.js";
import { KeyboardHandler } from "./keyboard.js";
import { ElementSelector } from "./selector.js";
import { buildElementContext, buildClipboardText } from "./context-builder.js";
import { Overlay } from "../ui/overlay.js";
import { Tooltip } from "../ui/tooltip.js";
import { showNotification } from "../ui/notification.js";
import { SuggestionPanel } from "../ui/suggestion-panel.js";
import { fetchGICMSuggestions } from "../integrations/gicm-api.js";
import { copyToClipboard } from "../integrations/clipboard.js";

export class Grabber implements GrabAPI {
  private config: Required<GrabConfig>;
  private state: GrabState;

  private keyboard: KeyboardHandler;
  private selector: ElementSelector;
  private overlay: Overlay;
  private tooltip: Tooltip;
  private suggestionPanel: SuggestionPanel | null = null;

  constructor(userConfig: GrabConfig = {}) {
    // Merge config with defaults
    this.config = {
      ...DEFAULT_CONFIG,
      ...userConfig,
      theme: {
        ...DEFAULT_THEME,
        ...userConfig.theme,
        label: {
          ...DEFAULT_THEME.label,
          ...userConfig.theme?.label,
        },
      },
      onSelect: userConfig.onSelect ?? (() => {}),
      onCopy: userConfig.onCopy ?? (() => {}),
      onStateChange: userConfig.onStateChange ?? (() => {}),
    };

    // Initialize state
    this.state = {
      isActive: false,
      hoveredElement: null,
      selectedElement: null,
    };

    // Initialize components
    this.keyboard = new KeyboardHandler({
      shortcutKey: this.config.shortcutKey,
      onActivate: () => this.activate(),
      onDeactivate: () => this.handleKeyRelease(),
    });

    this.selector = new ElementSelector({
      onHover: (el, ctx) => this.handleHover(el, ctx),
      onClick: (el, ctx) => this.handleSelect(el, ctx),
    });

    this.overlay = new Overlay(this.config.theme);
    this.tooltip = new Tooltip(this.config.theme);

    if (this.config.gicmApiUrl && this.config.showSuggestions) {
      this.suggestionPanel = new SuggestionPanel();
    }

    // Start keyboard listener
    if (this.config.enabled) {
      this.keyboard.start();
    }

    this.log("Initialized. Hold ⌘/Ctrl+C and click any element.");
  }

  // --- Public API ---

  activate(): void {
    if (this.state.isActive) return;

    this.state.isActive = true;
    this.state.selectedElement = null;
    this.selector.activate();
    this.overlay.show();
    this.updateState();

    this.log("Grab mode activated");
  }

  deactivate(): void {
    if (!this.state.isActive) return;

    this.state.isActive = false;
    this.state.hoveredElement = null;
    this.selector.deactivate();
    this.overlay.hide();
    this.tooltip.hide();
    this.updateState();

    this.log("Grab mode deactivated");
  }

  grab(element: HTMLElement): ElementContext {
    return buildElementContext(element);
  }

  async copy(element: HTMLElement): Promise<void> {
    const context = buildElementContext(element);
    const clipboardText = buildClipboardText(context);

    await copyToClipboard(clipboardText);

    this.config.onCopy(context, clipboardText);
    showNotification("✓ Copied! Paste into Claude Code / Cursor");
  }

  getState(): GrabState {
    return { ...this.state };
  }

  configure(newConfig: Partial<GrabConfig>): void {
    Object.assign(this.config, newConfig);

    if (newConfig.theme) {
      this.overlay.updateTheme(this.config.theme);
      this.tooltip.updateTheme(this.config.theme);
    }

    if (newConfig.enabled === false) {
      this.deactivate();
      this.keyboard.stop();
    } else if (newConfig.enabled === true) {
      this.keyboard.start();
    }
  }

  destroy(): void {
    this.deactivate();
    this.keyboard.stop();
    this.overlay.destroy();
    this.tooltip.destroy();
    this.suggestionPanel?.destroy();

    this.log("Destroyed");
  }

  // --- Internal Handlers ---

  private handleHover(
    element: HTMLElement | null,
    context: ElementContext | null
  ): void {
    this.state.hoveredElement = element;

    if (element && context) {
      this.overlay.update(context.rect);
      this.tooltip.show(element, context);
    } else {
      this.overlay.clear();
      this.tooltip.hide();
    }
  }

  private async handleSelect(
    element: HTMLElement,
    context: ElementContext
  ): Promise<void> {
    this.state.selectedElement = element;
    this.updateState();

    // Copy to clipboard
    const clipboardText = buildClipboardText(context);
    await copyToClipboard(clipboardText);

    // Trigger callbacks
    this.config.onSelect(context);
    this.config.onCopy(context, clipboardText);

    // Show notification
    showNotification("✓ Copied! Paste into Claude Code / Cursor");

    // Fetch and show gICM suggestions
    if (this.config.gicmApiUrl && this.suggestionPanel) {
      try {
        const suggestions = await fetchGICMSuggestions(
          clipboardText,
          this.config.gicmApiUrl
        );
        if (suggestions.length > 0) {
          this.suggestionPanel.show(suggestions);
        }
      } catch (error) {
        this.log("Failed to fetch suggestions:", error);
      }
    }

    // Deactivate after selection
    this.deactivate();
  }

  private handleKeyRelease(): void {
    // Only deactivate if no element was selected
    if (!this.state.selectedElement) {
      this.deactivate();
    }
  }

  private updateState(): void {
    this.config.onStateChange(this.getState());
  }

  private log(...args: any[]): void {
    console.log("[gICM Grab]", ...args);
  }
}
