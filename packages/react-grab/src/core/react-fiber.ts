/**
 * React Fiber Traversal - Extract component stack from React internals
 */

import type { ComponentStackItem } from "../types.js";
import { MAX_STACK_DEPTH } from "../constants.js";

/**
 * Find React Fiber node from DOM element
 */
export function findFiberNode(element: HTMLElement): any | null {
  // React 18+ uses __reactFiber$
  // React 16-17 uses __reactInternalInstance$
  const fiberKey = Object.keys(element).find(
    (key) =>
      key.startsWith("__reactFiber$") ||
      key.startsWith("__reactInternalInstance$")
  );

  if (!fiberKey) return null;
  return (element as any)[fiberKey];
}

/**
 * Check if element is in a React app
 */
export function isReactElement(element: HTMLElement): boolean {
  return findFiberNode(element) !== null;
}

/**
 * Get React component stack from element
 */
export function getComponentStack(element: HTMLElement): ComponentStackItem[] {
  const stack: ComponentStackItem[] = [];
  let fiber = findFiberNode(element);
  let depth = 0;

  while (fiber && depth < MAX_STACK_DEPTH) {
    // Only include function/class components, not DOM elements
    if (fiber.type && typeof fiber.type === "function") {
      const name = getComponentName(fiber);
      const source = getSourceLocation(fiber);

      stack.push({
        name,
        file: source.file,
        line: source.line,
        column: source.column,
      });
    }

    fiber = fiber.return;
    depth++;
  }

  return stack;
}

/**
 * Get component display name
 */
function getComponentName(fiber: any): string {
  const type = fiber.type;

  if (!type) return "Unknown";

  // Check for displayName (common pattern)
  if (type.displayName) return type.displayName;

  // Check for function name
  if (type.name) return type.name;

  // Check for wrapped components (memo, forwardRef)
  if (type.$$typeof) {
    const innerType = type.type || type.render;
    if (innerType) {
      return innerType.displayName || innerType.name || "Anonymous";
    }
  }

  return "Anonymous";
}

/**
 * Get source file location from fiber
 */
function getSourceLocation(fiber: any): {
  file: string;
  line: number;
  column: number;
} {
  // React dev mode adds _debugSource
  const source = fiber._debugSource;

  if (source) {
    return {
      file: cleanFilePath(source.fileName || ""),
      line: source.lineNumber || 0,
      column: source.columnNumber || 0,
    };
  }

  // Fallback: try to extract from stack trace (less reliable)
  return {
    file: "unknown",
    line: 0,
    column: 0,
  };
}

/**
 * Clean file path - extract relative path
 */
function cleanFilePath(fullPath: string): string {
  if (!fullPath) return "unknown";

  // Remove webpack/vite prefixes
  let cleaned = fullPath
    .replace(/^webpack:\/\/[^/]+\//, "")
    .replace(/^\/@fs/, "")
    .replace(/^\//, "");

  // Extract from node_modules or src
  const srcMatch = cleaned.match(/(?:src|components|app|pages)\/.*$/);
  if (srcMatch) return srcMatch[0];

  // Just get filename if path is too long
  const parts = cleaned.split("/");
  if (parts.length > 3) {
    return parts.slice(-3).join("/");
  }

  return cleaned;
}

/**
 * Get component props (for debugging)
 */
export function getComponentProps(
  element: HTMLElement
): Record<string, any> | null {
  const fiber = findFiberNode(element);
  if (!fiber) return null;

  // Walk up to find nearest component with props
  let current = fiber;
  while (current) {
    if (current.memoizedProps && typeof current.type === "function") {
      // Filter out children and internal props
      const props = { ...current.memoizedProps };
      delete props.children;
      return props;
    }
    current = current.return;
  }

  return null;
}
