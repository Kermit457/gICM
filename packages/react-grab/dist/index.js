import {
  ElementSelector,
  Grabber,
  KeyboardHandler,
  buildClipboardText,
  buildElementContext,
  buildSummary,
  findFiberNode,
  getComponentStack,
  isReactElement
} from "./chunk-GWCWAKQQ.js";

// src/index.ts
var instance = null;
function init(config = {}) {
  if (instance) {
    instance.destroy();
  }
  instance = new Grabber(config);
  return instance;
}
function getInstance() {
  return instance;
}
function destroy() {
  if (instance) {
    instance.destroy();
    instance = null;
  }
}
if (typeof window !== "undefined") {
  window.GICMGrab = {
    init,
    getInstance,
    destroy,
    Grabber
  };
  const currentScript = document.currentScript;
  if (currentScript?.hasAttribute("data-auto-init")) {
    const config = {};
    const apiUrl = currentScript.getAttribute("data-gicm-api");
    if (apiUrl) {
      config.gicmApiUrl = apiUrl;
      config.showSuggestions = true;
    }
    const hue = currentScript.getAttribute("data-hue");
    if (hue) {
      config.theme = { hue: parseInt(hue, 10) };
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => init(config));
    } else {
      init(config);
    }
  }
}
var index_default = { init, getInstance, destroy };
export {
  ElementSelector,
  Grabber,
  KeyboardHandler,
  buildClipboardText,
  buildElementContext,
  buildSummary,
  index_default as default,
  destroy,
  findFiberNode,
  getComponentStack,
  getInstance,
  init,
  isReactElement
};
//# sourceMappingURL=index.js.map