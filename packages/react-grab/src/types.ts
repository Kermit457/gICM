/**
 * gICM React Grab - Type Definitions
 */

export interface GrabConfig {
  /** Enable/disable the tool (default: true) */
  enabled?: boolean;

  /** Keyboard shortcut key (default: 'c') - used with Meta/Ctrl */
  shortcutKey?: string;

  /** Theme configuration */
  theme?: ThemeConfig;

  /** gICM API URL for component suggestions (optional) */
  gicmApiUrl?: string | null;

  /** Show gICM suggestion panel (default: true if gicmApiUrl provided) */
  showSuggestions?: boolean;

  /** Callback when element is selected */
  onSelect?: (context: ElementContext) => void;

  /** Callback when context is copied */
  onCopy?: (context: ElementContext, clipboardText: string) => void;

  /** Callback on state change */
  onStateChange?: (state: GrabState) => void;
}

export interface ThemeConfig {
  /** Enable visual overlay (default: true) */
  enabled?: boolean;

  /** Primary hue for colors (default: 280 - purple) */
  hue?: number;

  /** Overlay border color (overrides hue) */
  borderColor?: string;

  /** Overlay background color (overrides hue) */
  backgroundColor?: string;

  /** Label configuration */
  label?: {
    enabled?: boolean;
    backgroundColor?: string;
    textColor?: string;
  };
}

export interface GrabState {
  /** Whether grab mode is active */
  isActive: boolean;

  /** Currently hovered element */
  hoveredElement: HTMLElement | null;

  /** Selected element (after click) */
  selectedElement: HTMLElement | null;
}

export interface ElementContext {
  /** HTML tag name (lowercase) */
  tagName: string;

  /** Element classes */
  classes: string[];

  /** Element attributes (excluding class) */
  attributes: Record<string, string>;

  /** Text content (truncated) */
  textContent: string | null;

  /** Inner HTML (truncated) */
  innerHTML: string;

  /** React component stack */
  componentStack: ComponentStackItem[];

  /** Bounding rect */
  rect: DOMRect;

  /** Original element reference */
  element: HTMLElement;
}

export interface ComponentStackItem {
  /** Component name */
  name: string;

  /** Source file path */
  file: string;

  /** Line number */
  line: number;

  /** Column number */
  column: number;
}

export interface GICMSuggestion {
  id: string;
  name: string;
  category: string;
  description: string;
  similarity_score: number;
  preview_url?: string;
  code?: string;
}

export interface GrabAPI {
  /** Activate grab mode */
  activate: () => void;

  /** Deactivate grab mode */
  deactivate: () => void;

  /** Programmatically grab an element */
  grab: (element: HTMLElement) => ElementContext;

  /** Copy element context to clipboard */
  copy: (element: HTMLElement) => Promise<void>;

  /** Get current state */
  getState: () => GrabState;

  /** Update configuration */
  configure: (config: Partial<GrabConfig>) => void;

  /** Destroy instance and cleanup */
  destroy: () => void;
}
