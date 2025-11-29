/**
 * Default configuration and constants
 */

import type { GrabConfig, ThemeConfig } from "./types.js";

export const DEFAULT_THEME: Required<ThemeConfig> = {
  enabled: true,
  hue: 280, // Purple
  borderColor: "",
  backgroundColor: "",
  label: {
    enabled: true,
    backgroundColor: "",
    textColor: "#ffffff",
  },
};

export const DEFAULT_CONFIG: Required<
  Omit<GrabConfig, "onSelect" | "onCopy" | "onStateChange">
> = {
  enabled: true,
  shortcutKey: "c",
  theme: DEFAULT_THEME,
  gicmApiUrl: null,
  showSuggestions: false,
};

export const MAX_TEXT_LENGTH = 200;
export const MAX_HTML_LENGTH = 500;
export const MAX_STACK_DEPTH = 10;
export const NOTIFICATION_DURATION = 2000;
export const SUGGESTION_PANEL_DURATION = 10000;

export const ELEMENT_ID = {
  OVERLAY: "gicm-grab-overlay",
  LABEL: "gicm-grab-label",
  NOTIFICATION: "gicm-grab-notification",
  SUGGESTION_PANEL: "gicm-grab-suggestions",
} as const;
