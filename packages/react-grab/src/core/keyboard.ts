/**
 * Keyboard Handler - Manage keyboard shortcuts
 */

export interface KeyboardConfig {
  shortcutKey: string;
  onActivate: () => void;
  onDeactivate: () => void;
}

export class KeyboardHandler {
  private config: KeyboardConfig;
  private isMetaPressed = false;
  private isActive = false;
  private boundHandleKeyDown: (e: KeyboardEvent) => void;
  private boundHandleKeyUp: (e: KeyboardEvent) => void;

  constructor(config: KeyboardConfig) {
    this.config = config;
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleKeyUp = this.handleKeyUp.bind(this);
  }

  start(): void {
    document.addEventListener("keydown", this.boundHandleKeyDown);
    document.addEventListener("keyup", this.boundHandleKeyUp);
    // Handle window blur (user switches tab while holding keys)
    window.addEventListener("blur", () => this.reset());
  }

  stop(): void {
    document.removeEventListener("keydown", this.boundHandleKeyDown);
    document.removeEventListener("keyup", this.boundHandleKeyUp);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Track meta/ctrl key
    if (e.key === "Meta" || e.key === "Control") {
      this.isMetaPressed = true;
    }

    // Check for activation: Meta/Ctrl + shortcutKey
    if (
      (e.metaKey || e.ctrlKey) &&
      e.key.toLowerCase() === this.config.shortcutKey.toLowerCase() &&
      !this.isActive
    ) {
      // Don't prevent default - let the copy happen too
      this.isActive = true;
      this.config.onActivate();
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    // Deactivate when meta/ctrl is released
    if (e.key === "Meta" || e.key === "Control") {
      this.isMetaPressed = false;
      if (this.isActive) {
        this.isActive = false;
        this.config.onDeactivate();
      }
    }
  }

  private reset(): void {
    this.isMetaPressed = false;
    if (this.isActive) {
      this.isActive = false;
      this.config.onDeactivate();
    }
  }

  isActivated(): boolean {
    return this.isActive;
  }
}
