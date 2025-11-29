/**
 * gICM React Grab - Type Definitions
 */
interface GrabConfig {
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
interface ThemeConfig {
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
interface GrabState {
    /** Whether grab mode is active */
    isActive: boolean;
    /** Currently hovered element */
    hoveredElement: HTMLElement | null;
    /** Selected element (after click) */
    selectedElement: HTMLElement | null;
}
interface ElementContext {
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
interface ComponentStackItem {
    /** Component name */
    name: string;
    /** Source file path */
    file: string;
    /** Line number */
    line: number;
    /** Column number */
    column: number;
}
interface GICMSuggestion {
    id: string;
    name: string;
    category: string;
    description: string;
    similarity_score: number;
    preview_url?: string;
    code?: string;
}
interface GrabAPI {
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

/**
 * Main Grabber Class - Orchestrates all components
 */

declare class Grabber implements GrabAPI {
    private config;
    private state;
    private keyboard;
    private selector;
    private overlay;
    private tooltip;
    private suggestionPanel;
    constructor(userConfig?: GrabConfig);
    activate(): void;
    deactivate(): void;
    grab(element: HTMLElement): ElementContext;
    copy(element: HTMLElement): Promise<void>;
    getState(): GrabState;
    configure(newConfig: Partial<GrabConfig>): void;
    destroy(): void;
    private handleHover;
    private handleSelect;
    private handleKeyRelease;
    private updateState;
    private log;
}

/**
 * Context Builder - Build clipboard-ready context from element
 */

/**
 * Build full element context
 */
declare function buildElementContext(element: HTMLElement): ElementContext;
/**
 * Build clipboard text in React Grab format
 */
declare function buildClipboardText(context: ElementContext): string;
/**
 * Build a shorter summary for display
 */
declare function buildSummary(context: ElementContext): string;

/**
 * React Fiber Traversal - Extract component stack from React internals
 */

/**
 * Find React Fiber node from DOM element
 */
declare function findFiberNode(element: HTMLElement): any | null;
/**
 * Check if element is in a React app
 */
declare function isReactElement(element: HTMLElement): boolean;
/**
 * Get React component stack from element
 */
declare function getComponentStack(element: HTMLElement): ComponentStackItem[];

/**
 * Keyboard Handler - Manage keyboard shortcuts
 */
interface KeyboardConfig {
    shortcutKey: string;
    onActivate: () => void;
    onDeactivate: () => void;
}
declare class KeyboardHandler {
    private config;
    private isMetaPressed;
    private isActive;
    private boundHandleKeyDown;
    private boundHandleKeyUp;
    constructor(config: KeyboardConfig);
    start(): void;
    stop(): void;
    private handleKeyDown;
    private handleKeyUp;
    private reset;
    isActivated(): boolean;
}

/**
 * Element Selector - Handle mouse interactions for element selection
 */

interface SelectorConfig {
    onHover: (element: HTMLElement | null, context: ElementContext | null) => void;
    onClick: (element: HTMLElement, context: ElementContext) => void;
}
declare class ElementSelector {
    private config;
    private isActive;
    private hoveredElement;
    private boundHandleMouseMove;
    private boundHandleClick;
    private boundHandleScroll;
    constructor(config: SelectorConfig);
    activate(): void;
    deactivate(): void;
    private handleMouseMove;
    private handleClick;
    private handleScroll;
    private getElementAtPoint;
    getHoveredElement(): HTMLElement | null;
}

export { type ElementContext as E, type GrabConfig as G, KeyboardHandler as K, type GrabAPI as a, type GrabState as b, type GICMSuggestion as c, Grabber as d, buildElementContext as e, buildClipboardText as f, buildSummary as g, getComponentStack as h, isReactElement as i, findFiberNode as j, ElementSelector as k };
