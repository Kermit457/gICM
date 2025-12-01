/**
 * Debouncer
 * Debounce rapid file changes to avoid excessive re-indexing
 */

import type { FileChange } from "./types.js";

export class Debouncer {
  private pending: Map<string, FileChange> = new Map();
  private timer: NodeJS.Timeout | null = null;
  private debounceMs: number;
  private callback: (changes: FileChange[]) => void;

  constructor(debounceMs: number, callback: (changes: FileChange[]) => void) {
    this.debounceMs = debounceMs;
    this.callback = callback;
  }

  /**
   * Add a change to be debounced
   */
  add(change: FileChange): void {
    // Use path as key - latest change wins
    this.pending.set(change.path, change);

    // Reset timer
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.flush();
    }, this.debounceMs);
  }

  /**
   * Flush all pending changes
   */
  flush(): void {
    if (this.pending.size === 0) {
      return;
    }

    const changes = Array.from(this.pending.values());
    this.pending.clear();

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this.callback(changes);
  }

  /**
   * Get count of pending changes
   */
  getPendingCount(): number {
    return this.pending.size;
  }

  /**
   * Cancel all pending changes
   */
  cancel(): void {
    this.pending.clear();
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
