/**
 * gICM React Grab - Main Entry Point
 *
 * Click any element in your React app, copy context for AI coding agents.
 * Works with Claude Code, Cursor, Copilot, Windsurf, and more.
 *
 * @example
 * // Auto-init via script tag
 * <script src="//unpkg.com/@gicm/react-grab" data-auto-init></script>
 *
 * @example
 * // Manual initialization
 * import { init } from '@gicm/react-grab';
 * const grab = init({ theme: { hue: 200 } });
 */

import type { GrabConfig, GrabAPI } from "./types.js";
import { Grabber } from "./core/grabber.js";

export type {
  GrabConfig,
  GrabAPI,
  GrabState,
  ElementContext,
  GICMSuggestion,
} from "./types.js";
export { Grabber } from "./core/grabber.js";
export * from "./core/index.js";

let instance: Grabber | null = null;

/**
 * Initialize gICM React Grab
 */
export function init(config: GrabConfig = {}): GrabAPI {
  // Cleanup existing instance
  if (instance) {
    instance.destroy();
  }

  instance = new Grabber(config);
  return instance;
}

/**
 * Get current instance
 */
export function getInstance(): GrabAPI | null {
  return instance;
}

/**
 * Destroy current instance
 */
export function destroy(): void {
  if (instance) {
    instance.destroy();
    instance = null;
  }
}

// --- Auto-init for browser ---

if (typeof window !== "undefined") {
  // Expose on window
  (window as any).GICMGrab = {
    init,
    getInstance,
    destroy,
    Grabber,
  };

  // Auto-init if script has data-auto-init attribute
  const currentScript = document.currentScript;
  if (currentScript?.hasAttribute("data-auto-init")) {
    // Parse config from data attributes
    const config: GrabConfig = {};

    const apiUrl = currentScript.getAttribute("data-gicm-api");
    if (apiUrl) {
      config.gicmApiUrl = apiUrl;
      config.showSuggestions = true;
    }

    const hue = currentScript.getAttribute("data-hue");
    if (hue) {
      config.theme = { hue: parseInt(hue, 10) };
    }

    // Init when DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => init(config));
    } else {
      init(config);
    }
  }
}

export default { init, getInstance, destroy };
