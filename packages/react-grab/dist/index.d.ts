import { G as GrabConfig, a as GrabAPI } from './index-CLGQJrPM.js';
export { E as ElementContext, k as ElementSelector, c as GICMSuggestion, b as GrabState, d as Grabber, K as KeyboardHandler, f as buildClipboardText, e as buildElementContext, g as buildSummary, j as findFiberNode, h as getComponentStack, i as isReactElement } from './index-CLGQJrPM.js';

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

/**
 * Initialize gICM React Grab
 */
declare function init(config?: GrabConfig): GrabAPI;
/**
 * Get current instance
 */
declare function getInstance(): GrabAPI | null;
/**
 * Destroy current instance
 */
declare function destroy(): void;
declare const _default: {
    init: typeof init;
    getInstance: typeof getInstance;
    destroy: typeof destroy;
};

export { GrabAPI, GrabConfig, _default as default, destroy, getInstance, init };
