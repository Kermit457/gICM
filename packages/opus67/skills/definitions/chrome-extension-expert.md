# Chrome Extension Expert

> **ID:** `chrome-extension-expert`
> **Tier:** 2
> **Token Cost:** 6000
> **MCP Connections:** None

## What This Skill Does

Build modern Chrome extensions with Manifest V3. Master service workers, content scripts, messaging patterns, and Chrome APIs for building powerful browser extensions.

- Manifest V3 configuration and migration
- Service workers for background tasks
- Content scripts for page manipulation
- Chrome Storage API for persistence
- Message passing between components
- Popup and options page development
- Context menus and keyboard shortcuts
- Extension packaging and publishing
- Security best practices
- Cross-browser compatibility

## When to Use

This skill is automatically loaded when:

- **Keywords:** chrome extension, manifest.json, content script, chrome.runtime, browser extension
- **File Types:** manifest.json, background.js, content.js
- **Directories:** /extension, /chrome-extension

## Core Capabilities

### 1. Manifest V3 Configuration

Set up a modern Chrome extension with Manifest V3.

**Complete Manifest V3 Setup:**

```json
// manifest.json
{
  "manifest_version": 3,
  "name": "My Extension",
  "version": "1.0.0",
  "description": "A powerful Chrome extension",
  
  "permissions": [
    "storage",
    "activeTab",
    "scripting",
    "contextMenus",
    "alarms"
  ],
  
  "optional_permissions": [
    "tabs",
    "history",
    "bookmarks"
  ],
  
  "host_permissions": [
    "https://*.example.com/*",
    "<all_urls>"
  ],
  
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  
  "content_scripts": [
    {
      "matches": ["https://*.example.com/*"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_idle"
    }
  ],
  
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    "default_title": "My Extension"
  },
  
  "options_page": "options.html",
  
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  
  "web_accessible_resources": [
    {
      "resources": ["injected.js", "styles.css"],
      "matches": ["https://*.example.com/*"]
    }
  ],
  
  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Ctrl+Shift+E",
        "mac": "Command+Shift+E"
      },
      "description": "Open extension popup"
    },
    "toggle-feature": {
      "suggested_key": {
        "default": "Ctrl+Shift+F"
      },
      "description": "Toggle main feature"
    }
  },
  
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

**TypeScript Project Structure:**

```
extension/
  src/
    background/
      index.ts           # Service worker entry
      handlers.ts        # Message handlers
      alarms.ts         # Alarm management
    content/
      index.ts          # Content script entry
      dom.ts            # DOM manipulation
      observer.ts       # Mutation observers
    popup/
      App.tsx           # React popup app
      components/
      hooks/
    options/
      App.tsx           # Options page app
    shared/
      storage.ts        # Storage utilities
      messaging.ts      # Message utilities
      types.ts          # Shared types
  public/
    manifest.json
    icons/
    popup.html
    options.html
  vite.config.ts
  tsconfig.json
```

**Best Practices:**
- Use module type for service workers with ES modules
- Request minimal permissions, use optional_permissions for extras
- Specify host_permissions explicitly for security
- Use content_security_policy to prevent XSS
- Version bump for every Chrome Web Store update

**Gotchas:**
- Manifest V3 removes remote code execution (no eval, no remote scripts)
- Service workers are ephemeral, can terminate any time
- Background pages are gone, use service workers only
- Some APIs have changed between V2 and V3

### 2. Service Workers

Implement background logic with service workers.

**Service Worker Setup:**

```typescript
// src/background/index.ts
import { handleMessage } from "./handlers";
import { setupAlarms } from "./alarms";

// Extension installed/updated
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // First time installation
    chrome.storage.local.set({
      settings: {
        enabled: true,
        theme: "light",
        notifications: true,
      },
    });
    
    // Open onboarding page
    chrome.tabs.create({ url: "onboarding.html" });
  } else if (details.reason === "update") {
    // Extension updated
    console.log("Updated from", details.previousVersion);
  }
  
  // Setup context menus
  setupContextMenus();
  
  // Setup alarms
  setupAlarms();
});

// Context menu setup
function setupContextMenus() {
  chrome.contextMenus.create({
    id: "main-action",
    title: "Process with Extension",
    contexts: ["selection", "page"],
  });
  
  chrome.contextMenus.create({
    id: "save-page",
    title: "Save Page",
    contexts: ["page"],
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case "main-action":
      if (info.selectionText) {
        processSelection(info.selectionText, tab?.id);
      }
      break;
    case "save-page":
      savePage(tab);
      break;
  }
});

// Message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // Keep channel open for async response
});

// Tab events
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    // Page fully loaded
    injectContentScriptIfNeeded(tabId, tab.url);
  }
});

// Keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  switch (command) {
    case "toggle-feature":
      toggleFeature();
      break;
  }
});

async function processSelection(text: string, tabId?: number) {
  const result = await analyzeText(text);
  
  if (tabId) {
    chrome.tabs.sendMessage(tabId, {
      type: "SHOW_RESULT",
      payload: result,
    });
  }
}

async function injectContentScriptIfNeeded(tabId: number, url: string) {
  if (!shouldInject(url)) return;
  
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
  } catch (error) {
    console.error("Failed to inject content script:", error);
  }
}

async function toggleFeature() {
  const { settings } = await chrome.storage.local.get("settings");
  settings.enabled = !settings.enabled;
  await chrome.storage.local.set({ settings });
  
  // Notify all tabs
  const tabs = await chrome.tabs.query({});
  tabs.forEach((tab) => {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: "FEATURE_TOGGLED",
        payload: { enabled: settings.enabled },
      });
    }
  });
}
```

**Alarm Management:**

```typescript
// src/background/alarms.ts
export function setupAlarms() {
  // Clear existing alarms
  chrome.alarms.clearAll();
  
  // Create periodic alarm (minimum 1 minute)
  chrome.alarms.create("sync-data", {
    delayInMinutes: 1,
    periodInMinutes: 30,
  });
  
  // Create one-time alarm
  chrome.alarms.create("check-updates", {
    delayInMinutes: 5,
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  switch (alarm.name) {
    case "sync-data":
      syncDataWithServer();
      break;
    case "check-updates":
      checkForUpdates();
      break;
  }
});

async function syncDataWithServer() {
  const { data } = await chrome.storage.local.get("data");
  
  try {
    const response = await fetch("https://api.example.com/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    if (response.ok) {
      const serverData = await response.json();
      await chrome.storage.local.set({ data: serverData });
    }
  } catch (error) {
    console.error("Sync failed:", error);
  }
}
```

**Best Practices:**
- Use alarms for periodic tasks (minimum 1 minute interval)
- Store state in chrome.storage, service workers can terminate
- Use chrome.scripting.executeScript for dynamic injection
- Keep service worker code minimal for fast startup
- Handle onInstalled for setup and migration

**Gotchas:**
- Service workers terminate after ~30 seconds of inactivity
- No access to window or document in service workers
- Fetch API available, but follow same-origin policy
- Console logs disappear when service worker restarts

### 3. Content Scripts

Manipulate web pages with content scripts.

**Content Script Implementation:**

```typescript
// src/content/index.ts
import { injectStyles } from "./styles";
import { setupObserver } from "./observer";
import { createUI } from "./ui";

function initialize() {
  console.log("Content script loaded");
  
  injectStyles();
  setupObserver();
  createUI();
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sendResponse);
    return true;
  });
}

function handleMessage(message: any, sendResponse: (response: any) => void) {
  switch (message.type) {
    case "GET_PAGE_DATA":
      const data = extractPageData();
      sendResponse({ success: true, data });
      break;
      
    case "HIGHLIGHT_ELEMENTS":
      highlightElements(message.selector);
      sendResponse({ success: true });
      break;
      
    case "SHOW_RESULT":
      showResultOverlay(message.payload);
      sendResponse({ success: true });
      break;
      
    case "FEATURE_TOGGLED":
      toggleFeatureUI(message.payload.enabled);
      sendResponse({ success: true });
      break;
  }
}

function extractPageData() {
  return {
    title: document.title,
    url: window.location.href,
    description: document.querySelector('meta[name="description"]')?.getAttribute("content"),
    headings: Array.from(document.querySelectorAll("h1, h2, h3")).map((h) => ({
      level: h.tagName,
      text: h.textContent?.trim(),
    })),
    links: Array.from(document.querySelectorAll("a[href]")).map((a) => ({
      href: (a as HTMLAnchorElement).href,
      text: a.textContent?.trim(),
    })),
    images: Array.from(document.querySelectorAll("img[src]")).map((img) => ({
      src: (img as HTMLImageElement).src,
      alt: (img as HTMLImageElement).alt,
    })),
  };
}

function highlightElements(selector: string) {
  document.querySelectorAll(".extension-highlight").forEach((el) => {
    el.classList.remove("extension-highlight");
  });
  
  document.querySelectorAll(selector).forEach((el) => {
    el.classList.add("extension-highlight");
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}
```

**Mutation Observer:**

```typescript
// src/content/observer.ts
export function setupObserver() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            processNewElement(node);
          }
        });
      }
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
  
  return observer;
}

function processNewElement(element: HTMLElement) {
  if (element.matches(".target-class")) {
    enhanceElement(element);
  }
  
  element.querySelectorAll(".target-class").forEach((el) => {
    enhanceElement(el as HTMLElement);
  });
}

function enhanceElement(element: HTMLElement) {
  if (element.dataset.enhanced) return;
  element.dataset.enhanced = "true";
  
  const button = document.createElement("button");
  button.className = "extension-enhance-btn";
  button.textContent = "Enhance";
  button.onclick = () => enhanceContent(element);
  
  element.appendChild(button);
}
```

**Creating Isolated UI with Shadow DOM:**

```typescript
// src/content/ui.ts
export function createUI() {
  const container = document.createElement("div");
  container.id = "extension-root";
  const shadow = container.attachShadow({ mode: "closed" });
  
  const style = document.createElement("style");
  style.textContent = `
    .extension-panel {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 300px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 999999;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .extension-header {
      padding: 12px 16px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .extension-body {
      padding: 16px;
      max-height: 400px;
      overflow-y: auto;
    }
    .extension-btn {
      padding: 8px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    .extension-btn:hover {
      background: #2563eb;
    }
  `;
  shadow.appendChild(style);
  
  const panel = document.createElement("div");
  panel.className = "extension-panel";
  panel.innerHTML = `
    <div class="extension-header">
      <span>Extension Panel</span>
      <button class="close-btn">x</button>
    </div>
    <div class="extension-body">
      <p>Content goes here</p>
      <button class="extension-btn">Action</button>
    </div>
  `;
  
  shadow.appendChild(panel);
  document.body.appendChild(container);
  
  shadow.querySelector(".close-btn")?.addEventListener("click", () => {
    container.style.display = "none";
  });
  
  shadow.querySelector(".extension-btn")?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "ACTION_CLICKED" });
  });
  
  return { container, shadow, panel };
}
```

**Best Practices:**
- Use Shadow DOM for style isolation
- Check if content script already injected before running
- Clean up observers and listeners when done
- Avoid global namespace pollution
- Use unique class/id prefixes

**Gotchas:**
- Content scripts run in isolated world, no direct page variable access
- Some sites have strict CSP that blocks inline scripts
- MutationObserver can impact performance on heavy pages
- Z-index battles with page styles

### 4. Chrome Storage API

Persist data across sessions.

**Type-Safe Storage Utility:**

```typescript
// src/shared/storage.ts
type StorageArea = "local" | "sync" | "session";

interface StorageSchema {
  settings: {
    enabled: boolean;
    theme: "light" | "dark";
    notifications: boolean;
  };
  userData: {
    id: string;
    name: string;
    email: string;
  };
  cache: Record<string, { data: any; timestamp: number }>;
}

class TypedStorage<T extends Record<string, any>> {
  constructor(private area: StorageArea = "local") {}
  
  private get storage() {
    return chrome.storage[this.area];
  }
  
  async get<K extends keyof T>(key: K): Promise<T[K] | undefined> {
    const result = await this.storage.get(key as string);
    return result[key as string] as T[K];
  }
  
  async getAll<K extends keyof T>(keys: K[]): Promise<Pick<T, K>> {
    const result = await this.storage.get(keys as string[]);
    return result as Pick<T, K>;
  }
  
  async set<K extends keyof T>(key: K, value: T[K]): Promise<void> {
    await this.storage.set({ [key]: value });
  }
  
  async setMultiple(items: Partial<T>): Promise<void> {
    await this.storage.set(items);
  }
  
  async remove(key: keyof T): Promise<void> {
    await this.storage.remove(key as string);
  }
  
  async clear(): Promise<void> {
    await this.storage.clear();
  }
  
  onChange(callback: (changes: Partial<T>) => void): () => void {
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      const parsed: Partial<T> = {};
      for (const [key, change] of Object.entries(changes)) {
        parsed[key as keyof T] = change.newValue;
      }
      callback(parsed);
    };
    
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }
}

export const localStorage = new TypedStorage<StorageSchema>("local");
export const syncStorage = new TypedStorage<Pick<StorageSchema, "settings">>("sync");
```

**Best Practices:**
- Use chrome.storage.sync for settings (syncs across devices, 100KB limit)
- Use chrome.storage.local for large data (5MB limit)
- Use chrome.storage.session for temporary data (cleared on browser close)
- Batch storage operations when possible
- Listen for onChanged to sync UI

**Gotchas:**
- Storage operations are async, always await
- Sync storage has strict quotas (QUOTA_BYTES_PER_ITEM = 8192)
- Data must be JSON serializable
- Storage changes fire on all extension contexts

### 5. Message Passing

Communicate between extension components.

**Type-Safe Messaging:**

```typescript
// src/shared/messaging.ts
type MessageType =
  | { type: "GET_DATA"; payload?: undefined }
  | { type: "SET_DATA"; payload: { key: string; value: any } }
  | { type: "EXECUTE_ACTION"; payload: { action: string; params?: any } }
  | { type: "CONTENT_READY"; payload: { url: string } };

type ResponseType<T extends MessageType["type"]> = T extends "GET_DATA"
  ? { data: any }
  : T extends "SET_DATA"
  ? { success: boolean }
  : T extends "EXECUTE_ACTION"
  ? { result: any }
  : { acknowledged: boolean };

export async function sendToBackground<T extends MessageType>(
  message: T
): Promise<ResponseType<T["type"]>> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

export async function sendToTab<T extends MessageType>(
  tabId: number,
  message: T
): Promise<ResponseType<T["type"]>> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

export async function broadcastToTabs<T extends MessageType>(
  message: T
): Promise<void> {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) {
      try {
        await sendToTab(tab.id, message);
      } catch {
        // Tab might not have content script
      }
    }
  }
}

export function createMessageHandler(
  handlers: {
    [K in MessageType["type"]]?: (
      payload: Extract<MessageType, { type: K }>["payload"],
      sender: chrome.runtime.MessageSender
    ) => Promise<ResponseType<K>> | ResponseType<K>;
  }
) {
  return (
    message: MessageType,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ) => {
    const handler = handlers[message.type];
    if (!handler) {
      sendResponse({ error: "Unknown message type" });
      return false;
    }
    
    const result = handler(message.payload as any, sender);
    
    if (result instanceof Promise) {
      result.then(sendResponse).catch((error) => {
        sendResponse({ error: error.message });
      });
      return true;
    } else {
      sendResponse(result);
      return false;
    }
  };
}
```

**Best Practices:**
- Use type-safe message definitions
- Always handle chrome.runtime.lastError
- Return true from listener for async responses
- Use ports for long-lived connections
- Validate message origin in content scripts

**Gotchas:**
- sendResponse must be called synchronously or return true
- Messages to tabs fail if content script not injected
- Port connections close when service worker terminates
- No built-in message queue for offline tabs

## Real-World Examples

### Example 1: Web Page Highlighter Extension

```typescript
// popup/App.tsx
import { useState, useEffect } from "react";
import { sendToBackground } from "../shared/messaging";

export function App() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [highlightColor, setHighlightColor] = useState("#ffeb3b");
  
  useEffect(() => {
    loadSettings();
  }, []);
  
  async function loadSettings() {
    const response = await sendToBackground({ type: "GET_DATA" });
    setIsEnabled(response.data?.enabled ?? false);
    setHighlightColor(response.data?.color ?? "#ffeb3b");
  }
  
  async function toggleHighlighter() {
    const newState = !isEnabled;
    setIsEnabled(newState);
    
    await sendToBackground({
      type: "SET_DATA",
      payload: { key: "settings", value: { enabled: newState, color: highlightColor } },
    });
    
    await sendToBackground({
      type: "EXECUTE_ACTION",
      payload: { action: "toggleHighlighter", params: { enabled: newState } },
    });
  }
  
  async function changeColor(color: string) {
    setHighlightColor(color);
    await sendToBackground({
      type: "SET_DATA",
      payload: { key: "settings", value: { enabled: isEnabled, color } },
    });
  }
  
  return (
    <div className="w-64 p-4">
      <h1 className="text-lg font-bold mb-4">Highlighter</h1>
      
      <div className="flex items-center justify-between mb-4">
        <span>Enable Highlighter</span>
        <button
          onClick={toggleHighlighter}
          className={`w-12 h-6 rounded-full ${isEnabled ? "bg-blue-500" : "bg-gray-300"}`}
        >
          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${isEnabled ? "translate-x-6" : "translate-x-0.5"}`} />
        </button>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm mb-2">Highlight Color</label>
        <input
          type="color"
          value={highlightColor}
          onChange={(e) => changeColor(e.target.value)}
          className="w-full h-10 cursor-pointer"
        />
      </div>
      
      <p className="text-xs text-gray-500">
        Select text on any page to highlight it.
      </p>
    </div>
  );
}
```

### Example 2: Tab Manager Extension

```typescript
// background/tabManager.ts
interface TabGroup {
  id: string;
  name: string;
  tabs: chrome.tabs.Tab[];
  createdAt: number;
}

class TabManager {
  async saveCurrentTabs(groupName: string): Promise<TabGroup> {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    
    const group: TabGroup = {
      id: crypto.randomUUID(),
      name: groupName,
      tabs: tabs.map((t) => ({
        id: t.id,
        url: t.url,
        title: t.title,
        favIconUrl: t.favIconUrl,
      })) as chrome.tabs.Tab[],
      createdAt: Date.now(),
    };
    
    const { tabGroups = [] } = await chrome.storage.local.get("tabGroups");
    tabGroups.push(group);
    await chrome.storage.local.set({ tabGroups });
    
    return group;
  }
  
  async restoreGroup(groupId: string): Promise<void> {
    const { tabGroups = [] } = await chrome.storage.local.get("tabGroups");
    const group = tabGroups.find((g: TabGroup) => g.id === groupId);
    
    if (!group) throw new Error("Group not found");
    
    const window = await chrome.windows.create({ focused: true });
    
    for (const tab of group.tabs) {
      await chrome.tabs.create({
        windowId: window.id,
        url: tab.url,
      });
    }
    
    const emptyTabs = await chrome.tabs.query({
      windowId: window.id,
      url: "chrome://newtab/",
    });
    for (const tab of emptyTabs) {
      if (tab.id) await chrome.tabs.remove(tab.id);
    }
  }
  
  async deleteGroup(groupId: string): Promise<void> {
    const { tabGroups = [] } = await chrome.storage.local.get("tabGroups");
    const filtered = tabGroups.filter((g: TabGroup) => g.id !== groupId);
    await chrome.storage.local.set({ tabGroups: filtered });
  }
  
  async getGroups(): Promise<TabGroup[]> {
    const { tabGroups = [] } = await chrome.storage.local.get("tabGroups");
    return tabGroups;
  }
}

export const tabManager = new TabManager();
```

## Related Skills

- **react-advanced** - React patterns for popup/options pages
- **typescript-advanced** - Type-safe extension development
- **vite-config** - Build configuration for extensions
- **testing** - Testing Chrome extensions

## Further Reading

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/mv3-migration/)
- [Chrome Extension Samples](https://github.com/GoogleChrome/chrome-extensions-samples)
- [Extension Security Best Practices](https://developer.chrome.com/docs/extensions/mv3/security/)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
