// src/constants.ts
var DEFAULT_THEME = {
  enabled: true,
  hue: 280,
  // Purple
  borderColor: "",
  backgroundColor: "",
  label: {
    enabled: true,
    backgroundColor: "",
    textColor: "#ffffff"
  }
};
var DEFAULT_CONFIG = {
  enabled: true,
  shortcutKey: "c",
  theme: DEFAULT_THEME,
  gicmApiUrl: null,
  showSuggestions: false
};
var MAX_TEXT_LENGTH = 200;
var MAX_HTML_LENGTH = 500;
var MAX_STACK_DEPTH = 10;
var NOTIFICATION_DURATION = 2e3;
var SUGGESTION_PANEL_DURATION = 1e4;
var ELEMENT_ID = {
  OVERLAY: "gicm-grab-overlay",
  LABEL: "gicm-grab-label",
  NOTIFICATION: "gicm-grab-notification",
  SUGGESTION_PANEL: "gicm-grab-suggestions"
};

// src/core/keyboard.ts
var KeyboardHandler = class {
  config;
  isMetaPressed = false;
  isActive = false;
  boundHandleKeyDown;
  boundHandleKeyUp;
  constructor(config) {
    this.config = config;
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleKeyUp = this.handleKeyUp.bind(this);
  }
  start() {
    document.addEventListener("keydown", this.boundHandleKeyDown);
    document.addEventListener("keyup", this.boundHandleKeyUp);
    window.addEventListener("blur", () => this.reset());
  }
  stop() {
    document.removeEventListener("keydown", this.boundHandleKeyDown);
    document.removeEventListener("keyup", this.boundHandleKeyUp);
  }
  handleKeyDown(e) {
    if (e.key === "Meta" || e.key === "Control") {
      this.isMetaPressed = true;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === this.config.shortcutKey.toLowerCase() && !this.isActive) {
      this.isActive = true;
      this.config.onActivate();
    }
  }
  handleKeyUp(e) {
    if (e.key === "Meta" || e.key === "Control") {
      this.isMetaPressed = false;
      if (this.isActive) {
        this.isActive = false;
        this.config.onDeactivate();
      }
    }
  }
  reset() {
    this.isMetaPressed = false;
    if (this.isActive) {
      this.isActive = false;
      this.config.onDeactivate();
    }
  }
  isActivated() {
    return this.isActive;
  }
};

// src/core/react-fiber.ts
function findFiberNode(element) {
  const fiberKey = Object.keys(element).find(
    (key) => key.startsWith("__reactFiber$") || key.startsWith("__reactInternalInstance$")
  );
  if (!fiberKey) return null;
  return element[fiberKey];
}
function isReactElement(element) {
  return findFiberNode(element) !== null;
}
function getComponentStack(element) {
  const stack = [];
  let fiber = findFiberNode(element);
  let depth = 0;
  while (fiber && depth < MAX_STACK_DEPTH) {
    if (fiber.type && typeof fiber.type === "function") {
      const name = getComponentName(fiber);
      const source = getSourceLocation(fiber);
      stack.push({
        name,
        file: source.file,
        line: source.line,
        column: source.column
      });
    }
    fiber = fiber.return;
    depth++;
  }
  return stack;
}
function getComponentName(fiber) {
  const type = fiber.type;
  if (!type) return "Unknown";
  if (type.displayName) return type.displayName;
  if (type.name) return type.name;
  if (type.$$typeof) {
    const innerType = type.type || type.render;
    if (innerType) {
      return innerType.displayName || innerType.name || "Anonymous";
    }
  }
  return "Anonymous";
}
function getSourceLocation(fiber) {
  const source = fiber._debugSource;
  if (source) {
    return {
      file: cleanFilePath(source.fileName || ""),
      line: source.lineNumber || 0,
      column: source.columnNumber || 0
    };
  }
  return {
    file: "unknown",
    line: 0,
    column: 0
  };
}
function cleanFilePath(fullPath) {
  if (!fullPath) return "unknown";
  let cleaned = fullPath.replace(/^webpack:\/\/[^/]+\//, "").replace(/^\/@fs/, "").replace(/^\//, "");
  const srcMatch = cleaned.match(/(?:src|components|app|pages)\/.*$/);
  if (srcMatch) return srcMatch[0];
  const parts = cleaned.split("/");
  if (parts.length > 3) {
    return parts.slice(-3).join("/");
  }
  return cleaned;
}

// src/core/context-builder.ts
function buildElementContext(element) {
  const tagName = element.tagName.toLowerCase();
  const classes = getClasses(element);
  const attributes = getAttributes(element);
  const textContent = getTextContent(element);
  const innerHTML = getInnerHTML(element);
  const componentStack = getComponentStack(element);
  const rect = element.getBoundingClientRect();
  return {
    tagName,
    classes,
    attributes,
    textContent,
    innerHTML,
    componentStack,
    rect,
    element
  };
}
function buildClipboardText(context) {
  const { tagName, classes, attributes, textContent, componentStack } = context;
  let text = "<selected_element>\n";
  let tag = `  <${tagName}`;
  if (classes.length > 0) {
    tag += ` class="${classes.join(" ")}"`;
  }
  for (const [key, value] of Object.entries(attributes)) {
    tag += ` ${key}="${escapeAttr(value)}"`;
  }
  tag += ">";
  text += tag + "\n";
  if (textContent) {
    text += `    ${textContent}
`;
  }
  text += `  </${tagName}>
`;
  for (const item of componentStack) {
    text += `  at ${item.name} in ${item.file}:${item.line}:${item.column}
`;
  }
  text += "</selected_element>";
  return text;
}
function buildSummary(context) {
  const { tagName, classes, componentStack } = context;
  let summary = `<${tagName}>`;
  if (classes.length > 0) {
    const displayClasses = classes.slice(0, 2).join(".");
    summary = `<${tagName}.${displayClasses}>`;
  }
  if (componentStack.length > 0) {
    const comp = componentStack[0];
    summary += ` in ${comp.name}`;
  }
  return summary;
}
function getClasses(element) {
  if (!element.className) return [];
  if (typeof element.className === "string") {
    return element.className.split(/\s+/).filter(Boolean);
  }
  if (element.className.baseVal) {
    return element.className.baseVal.split(/\s+/).filter(Boolean);
  }
  return [];
}
function getAttributes(element) {
  const attrs = {};
  const skipAttrs = /* @__PURE__ */ new Set(["class", "style"]);
  for (const attr of element.attributes) {
    if (!skipAttrs.has(attr.name) && !attr.name.startsWith("data-reactroot")) {
      attrs[attr.name] = attr.value;
    }
  }
  return attrs;
}
function getTextContent(element) {
  const text = element.textContent?.trim();
  if (!text) return null;
  if (text.length > MAX_TEXT_LENGTH) {
    return text.slice(0, MAX_TEXT_LENGTH) + "...";
  }
  return text;
}
function getInnerHTML(element) {
  const html = element.innerHTML.trim();
  if (html.length > MAX_HTML_LENGTH) {
    return html.slice(0, MAX_HTML_LENGTH) + "...";
  }
  return html;
}
function escapeAttr(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// src/core/selector.ts
var ElementSelector = class {
  config;
  isActive = false;
  hoveredElement = null;
  boundHandleMouseMove;
  boundHandleClick;
  boundHandleScroll;
  constructor(config) {
    this.config = config;
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleClick = this.handleClick.bind(this);
    this.boundHandleScroll = this.handleScroll.bind(this);
  }
  activate() {
    if (this.isActive) return;
    this.isActive = true;
    document.addEventListener("mousemove", this.boundHandleMouseMove);
    document.addEventListener("click", this.boundHandleClick, true);
    document.addEventListener("scroll", this.boundHandleScroll, true);
    document.body.style.cursor = "crosshair";
  }
  deactivate() {
    if (!this.isActive) return;
    this.isActive = false;
    document.removeEventListener("mousemove", this.boundHandleMouseMove);
    document.removeEventListener("click", this.boundHandleClick, true);
    document.removeEventListener("scroll", this.boundHandleScroll, true);
    document.body.style.cursor = "";
    this.hoveredElement = null;
    this.config.onHover(null, null);
  }
  handleMouseMove(e) {
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
  handleClick(e) {
    if (!this.isActive) return;
    e.preventDefault();
    e.stopPropagation();
    const element = this.getElementAtPoint(e.clientX, e.clientY);
    if (element) {
      const context = buildElementContext(element);
      this.config.onClick(element, context);
    }
  }
  handleScroll() {
    if (this.hoveredElement) {
      const context = buildElementContext(this.hoveredElement);
      this.config.onHover(this.hoveredElement, context);
    }
  }
  getElementAtPoint(x, y) {
    const element = document.elementFromPoint(x, y);
    if (!element) return null;
    if (!(element instanceof HTMLElement)) return null;
    if (element.id?.startsWith("gicm-grab")) return null;
    if (element.closest("[id^='gicm-grab']")) return null;
    return element;
  }
  getHoveredElement() {
    return this.hoveredElement;
  }
};

// src/ui/overlay.ts
var Overlay = class {
  element;
  theme;
  constructor(theme) {
    this.theme = theme;
    this.element = this.createElement();
  }
  createElement() {
    const el = document.createElement("div");
    el.id = ELEMENT_ID.OVERLAY;
    this.applyStyles(el);
    return el;
  }
  applyStyles(el) {
    const hue = this.theme.hue ?? 280;
    const borderColor = this.theme.borderColor || `hsl(${hue}, 70%, 60%)`;
    const bgColor = this.theme.backgroundColor || `hsla(${hue}, 70%, 60%, 0.1)`;
    el.style.cssText = `
      position: fixed;
      pointer-events: none;
      border: 2px solid ${borderColor};
      background: ${bgColor};
      border-radius: 4px;
      z-index: 2147483646;
      transition: all 0.05s ease-out;
      display: none;
    `;
  }
  show() {
    if (!this.element.parentNode) {
      document.body.appendChild(this.element);
    }
  }
  hide() {
    this.element.style.display = "none";
  }
  update(rect) {
    this.element.style.display = "block";
    this.element.style.top = `${rect.top}px`;
    this.element.style.left = `${rect.left}px`;
    this.element.style.width = `${rect.width}px`;
    this.element.style.height = `${rect.height}px`;
  }
  clear() {
    this.element.style.display = "none";
  }
  updateTheme(theme) {
    this.theme = theme;
    this.applyStyles(this.element);
  }
  destroy() {
    this.element.remove();
  }
};

// src/ui/tooltip.ts
var Tooltip = class {
  element;
  theme;
  constructor(theme) {
    this.theme = theme;
    this.element = this.createElement();
  }
  createElement() {
    const el = document.createElement("div");
    el.id = ELEMENT_ID.LABEL;
    this.applyStyles(el);
    return el;
  }
  applyStyles(el) {
    const hue = this.theme.hue ?? 280;
    const bgColor = this.theme.label?.backgroundColor || `hsl(${hue}, 70%, 35%)`;
    const textColor = this.theme.label?.textColor || "#ffffff";
    el.style.cssText = `
      position: fixed;
      background: ${bgColor};
      color: ${textColor};
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
      font-weight: 500;
      z-index: 2147483647;
      pointer-events: none;
      display: none;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
  }
  show(element, context) {
    if (!this.element.parentNode) {
      document.body.appendChild(this.element);
    }
    const summary = buildSummary(context);
    this.element.textContent = summary;
    const rect = context.rect;
    const tooltipRect = this.element.getBoundingClientRect();
    let top = rect.top - 28;
    if (top < 4) {
      top = rect.bottom + 4;
    }
    let left = rect.left;
    if (left + tooltipRect.width > window.innerWidth - 4) {
      left = window.innerWidth - tooltipRect.width - 4;
    }
    this.element.style.display = "block";
    this.element.style.top = `${top}px`;
    this.element.style.left = `${left}px`;
  }
  hide() {
    this.element.style.display = "none";
  }
  updateTheme(theme) {
    this.theme = theme;
    this.applyStyles(this.element);
  }
  destroy() {
    this.element.remove();
  }
};

// src/ui/notification.ts
function showNotification(message) {
  const existing = document.getElementById(ELEMENT_ID.NOTIFICATION);
  if (existing) existing.remove();
  const el = document.createElement("div");
  el.id = ELEMENT_ID.NOTIFICATION;
  el.textContent = message;
  el.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 2147483647;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    animation: gicm-slide-in 0.3s ease-out;
  `;
  if (!document.getElementById("gicm-grab-styles")) {
    const style = document.createElement("style");
    style.id = "gicm-grab-styles";
    style.textContent = `
      @keyframes gicm-slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes gicm-fade-out {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.animation = "gicm-fade-out 0.3s ease-out forwards";
    setTimeout(() => el.remove(), 300);
  }, NOTIFICATION_DURATION);
}

// src/ui/suggestion-panel.ts
var SuggestionPanel = class {
  element = null;
  hideTimeout = null;
  show(suggestions) {
    this.hide();
    if (suggestions.length === 0) return;
    this.element = this.createElement(suggestions);
    document.body.appendChild(this.element);
    this.hideTimeout = window.setTimeout(() => {
      this.hide();
    }, SUGGESTION_PANEL_DURATION);
  }
  hide() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
  destroy() {
    this.hide();
  }
  createElement(suggestions) {
    const el = document.createElement("div");
    el.id = ELEMENT_ID.SUGGESTION_PANEL;
    el.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 320px;
        max-height: 400px;
        background: #1a1a2e;
        border: 1px solid #7c3aed;
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        font-family: system-ui, -apple-system, sans-serif;
        z-index: 2147483647;
        overflow: hidden;
        animation: gicm-slide-in 0.3s ease-out;
      ">
        <div style="
          padding: 12px 16px;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          color: white;
          font-weight: 600;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span>gICM Components</span>
          <button
            onclick="this.closest('#${ELEMENT_ID.SUGGESTION_PANEL}').remove()"
            style="
              background: none;
              border: none;
              color: white;
              cursor: pointer;
              font-size: 18px;
              line-height: 1;
              padding: 0;
            "
          >\xD7</button>
        </div>
        <div style="padding: 12px; overflow-y: auto; max-height: 320px;">
          ${suggestions.map((s) => this.renderSuggestion(s)).join("")}
        </div>
        <div style="
          padding: 8px 16px;
          background: #2a2a3e;
          font-size: 11px;
          color: #888;
          text-align: center;
        ">
          Click to copy ID - Paste in Claude Code
        </div>
      </div>
    `;
    el.querySelectorAll("[data-gicm-id]").forEach((item) => {
      item.addEventListener("click", () => {
        const id = item.getAttribute("data-gicm-id");
        navigator.clipboard.writeText(`gicm:${id}`);
        const badge = item.querySelector(".copy-badge");
        if (badge) {
          badge.textContent = "Copied!";
          badge.style.background = "#10b981";
        }
      });
    });
    return el;
  }
  renderSuggestion(s) {
    const score = Math.round(s.similarity_score * 100);
    return `
      <div
        data-gicm-id="${s.id}"
        style="
          padding: 12px;
          margin-bottom: 8px;
          background: #2a2a3e;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
        "
        onmouseover="this.style.background='#3a3a4e'"
        onmouseout="this.style.background='#2a2a3e'"
      >
        <div style="
          font-weight: 600;
          color: #e0e0e0;
          margin-bottom: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span>${s.name}</span>
          <span class="copy-badge" style="
            font-size: 10px;
            padding: 2px 6px;
            background: #4a4a5e;
            border-radius: 4px;
            font-weight: normal;
          ">Copy ID</span>
        </div>
        <div style="
          font-size: 12px;
          color: #a0a0a0;
          margin-bottom: 8px;
          line-height: 1.4;
        ">${s.description.slice(0, 80)}${s.description.length > 80 ? "..." : ""}</div>
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span style="
            font-size: 11px;
            padding: 2px 8px;
            background: #7c3aed;
            color: white;
            border-radius: 4px;
          ">${s.category}</span>
          <span style="
            font-size: 11px;
            color: ${score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#6b7280"};
            font-weight: 500;
          ">${score}% match</span>
        </div>
      </div>
    `;
  }
};

// src/integrations/gicm-api.ts
async function fetchGICMSuggestions(elementContext, apiUrl) {
  try {
    const response = await fetch(`${apiUrl}/search/by-element`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        element_context: elementContext,
        include_similar: true,
        limit: 5
      })
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return data.matches || [];
  } catch (error) {
    console.error("[gICM Grab] API error:", error);
    return [];
  }
}

// src/integrations/clipboard.ts
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.cssText = "position:fixed;left:-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

// src/core/grabber.ts
var Grabber = class {
  config;
  state;
  keyboard;
  selector;
  overlay;
  tooltip;
  suggestionPanel = null;
  constructor(userConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...userConfig,
      theme: {
        ...DEFAULT_THEME,
        ...userConfig.theme,
        label: {
          ...DEFAULT_THEME.label,
          ...userConfig.theme?.label
        }
      },
      onSelect: userConfig.onSelect ?? (() => {
      }),
      onCopy: userConfig.onCopy ?? (() => {
      }),
      onStateChange: userConfig.onStateChange ?? (() => {
      })
    };
    this.state = {
      isActive: false,
      hoveredElement: null,
      selectedElement: null
    };
    this.keyboard = new KeyboardHandler({
      shortcutKey: this.config.shortcutKey,
      onActivate: () => this.activate(),
      onDeactivate: () => this.handleKeyRelease()
    });
    this.selector = new ElementSelector({
      onHover: (el, ctx) => this.handleHover(el, ctx),
      onClick: (el, ctx) => this.handleSelect(el, ctx)
    });
    this.overlay = new Overlay(this.config.theme);
    this.tooltip = new Tooltip(this.config.theme);
    if (this.config.gicmApiUrl && this.config.showSuggestions) {
      this.suggestionPanel = new SuggestionPanel();
    }
    if (this.config.enabled) {
      this.keyboard.start();
    }
    this.log("Initialized. Hold \u2318/Ctrl+C and click any element.");
  }
  // --- Public API ---
  activate() {
    if (this.state.isActive) return;
    this.state.isActive = true;
    this.state.selectedElement = null;
    this.selector.activate();
    this.overlay.show();
    this.updateState();
    this.log("Grab mode activated");
  }
  deactivate() {
    if (!this.state.isActive) return;
    this.state.isActive = false;
    this.state.hoveredElement = null;
    this.selector.deactivate();
    this.overlay.hide();
    this.tooltip.hide();
    this.updateState();
    this.log("Grab mode deactivated");
  }
  grab(element) {
    return buildElementContext(element);
  }
  async copy(element) {
    const context = buildElementContext(element);
    const clipboardText = buildClipboardText(context);
    await copyToClipboard(clipboardText);
    this.config.onCopy(context, clipboardText);
    showNotification("\u2713 Copied! Paste into Claude Code / Cursor");
  }
  getState() {
    return { ...this.state };
  }
  configure(newConfig) {
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
  destroy() {
    this.deactivate();
    this.keyboard.stop();
    this.overlay.destroy();
    this.tooltip.destroy();
    this.suggestionPanel?.destroy();
    this.log("Destroyed");
  }
  // --- Internal Handlers ---
  handleHover(element, context) {
    this.state.hoveredElement = element;
    if (element && context) {
      this.overlay.update(context.rect);
      this.tooltip.show(element, context);
    } else {
      this.overlay.clear();
      this.tooltip.hide();
    }
  }
  async handleSelect(element, context) {
    this.state.selectedElement = element;
    this.updateState();
    const clipboardText = buildClipboardText(context);
    await copyToClipboard(clipboardText);
    this.config.onSelect(context);
    this.config.onCopy(context, clipboardText);
    showNotification("\u2713 Copied! Paste into Claude Code / Cursor");
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
    this.deactivate();
  }
  handleKeyRelease() {
    if (!this.state.selectedElement) {
      this.deactivate();
    }
  }
  updateState() {
    this.config.onStateChange(this.getState());
  }
  log(...args) {
    console.log("[gICM Grab]", ...args);
  }
};

export {
  KeyboardHandler,
  findFiberNode,
  isReactElement,
  getComponentStack,
  buildElementContext,
  buildClipboardText,
  buildSummary,
  ElementSelector,
  Grabber
};
//# sourceMappingURL=chunk-GWCWAKQQ.js.map