var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../node_modules/eventemitter3/index.js
var require_eventemitter3 = __commonJS({
  "../../node_modules/eventemitter3/index.js"(exports, module) {
    "use strict";
    var has = Object.prototype.hasOwnProperty;
    var prefix = "~";
    function Events() {
    }
    if (Object.create) {
      Events.prototype = /* @__PURE__ */ Object.create(null);
      if (!new Events().__proto__) prefix = false;
    }
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }
    function addListener(emitter, event, fn, context, once) {
      if (typeof fn !== "function") {
        throw new TypeError("The listener must be a function");
      }
      var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
      if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
      else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
      else emitter._events[evt] = [emitter._events[evt], listener];
      return emitter;
    }
    function clearEvent(emitter, evt) {
      if (--emitter._eventsCount === 0) emitter._events = new Events();
      else delete emitter._events[evt];
    }
    function EventEmitter2() {
      this._events = new Events();
      this._eventsCount = 0;
    }
    EventEmitter2.prototype.eventNames = function eventNames() {
      var names = [], events, name;
      if (this._eventsCount === 0) return names;
      for (name in events = this._events) {
        if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
      }
      if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
      }
      return names;
    };
    EventEmitter2.prototype.listeners = function listeners(event) {
      var evt = prefix ? prefix + event : event, handlers = this._events[evt];
      if (!handlers) return [];
      if (handlers.fn) return [handlers.fn];
      for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
        ee[i] = handlers[i].fn;
      }
      return ee;
    };
    EventEmitter2.prototype.listenerCount = function listenerCount(event) {
      var evt = prefix ? prefix + event : event, listeners = this._events[evt];
      if (!listeners) return 0;
      if (listeners.fn) return 1;
      return listeners.length;
    };
    EventEmitter2.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt]) return false;
      var listeners = this._events[evt], len = arguments.length, args, i;
      if (listeners.fn) {
        if (listeners.once) this.removeListener(event, listeners.fn, void 0, true);
        switch (len) {
          case 1:
            return listeners.fn.call(listeners.context), true;
          case 2:
            return listeners.fn.call(listeners.context, a1), true;
          case 3:
            return listeners.fn.call(listeners.context, a1, a2), true;
          case 4:
            return listeners.fn.call(listeners.context, a1, a2, a3), true;
          case 5:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
          case 6:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }
        for (i = 1, args = new Array(len - 1); i < len; i++) {
          args[i - 1] = arguments[i];
        }
        listeners.fn.apply(listeners.context, args);
      } else {
        var length = listeners.length, j;
        for (i = 0; i < length; i++) {
          if (listeners[i].once) this.removeListener(event, listeners[i].fn, void 0, true);
          switch (len) {
            case 1:
              listeners[i].fn.call(listeners[i].context);
              break;
            case 2:
              listeners[i].fn.call(listeners[i].context, a1);
              break;
            case 3:
              listeners[i].fn.call(listeners[i].context, a1, a2);
              break;
            case 4:
              listeners[i].fn.call(listeners[i].context, a1, a2, a3);
              break;
            default:
              if (!args) for (j = 1, args = new Array(len - 1); j < len; j++) {
                args[j - 1] = arguments[j];
              }
              listeners[i].fn.apply(listeners[i].context, args);
          }
        }
      }
      return true;
    };
    EventEmitter2.prototype.on = function on(event, fn, context) {
      return addListener(this, event, fn, context, false);
    };
    EventEmitter2.prototype.once = function once(event, fn, context) {
      return addListener(this, event, fn, context, true);
    };
    EventEmitter2.prototype.removeListener = function removeListener(event, fn, context, once) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt]) return this;
      if (!fn) {
        clearEvent(this, evt);
        return this;
      }
      var listeners = this._events[evt];
      if (listeners.fn) {
        if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
          clearEvent(this, evt);
        }
      } else {
        for (var i = 0, events = [], length = listeners.length; i < length; i++) {
          if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
            events.push(listeners[i]);
          }
        }
        if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
        else clearEvent(this, evt);
      }
      return this;
    };
    EventEmitter2.prototype.removeAllListeners = function removeAllListeners(event) {
      var evt;
      if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt]) clearEvent(this, evt);
      } else {
        this._events = new Events();
        this._eventsCount = 0;
      }
      return this;
    };
    EventEmitter2.prototype.off = EventEmitter2.prototype.removeListener;
    EventEmitter2.prototype.addListener = EventEmitter2.prototype.on;
    EventEmitter2.prefixed = prefix;
    EventEmitter2.EventEmitter = EventEmitter2;
    if ("undefined" !== typeof module) {
      module.exports = EventEmitter2;
    }
  }
});

// ../../node_modules/eventemitter3/index.mjs
var import_index = __toESM(require_eventemitter3(), 1);

// src/core/constants.ts
var RISK_THRESHOLDS = {
  // Lines changed
  linesLow: 50,
  // <50 lines = safe
  linesMedium: 150,
  // 50-150 = low risk
  linesHigh: 300,
  // 150-300 = medium risk
  linesCritical: 500,
  // >500 = high risk
  // Files changed
  filesLow: 3,
  // <3 files = safe
  filesMedium: 7,
  // 3-7 = low risk
  filesHigh: 15,
  // 7-15 = medium risk
  filesCritical: 25,
  // >25 = high risk
  // Decision score thresholds
  autoExecuteMax: 40,
  // 0-40 = auto execute
  queueApprovalMax: 60,
  // 41-60 = queue approval
  escalateMax: 80
  // 61-80 = escalate
  // >80 = reject (or escalate with urgency)
};
var DEFAULT_CO_AUTHOR = "Claude <noreply@anthropic.com>";
var COMMIT_FOOTER_TEMPLATE = `
\u{1F916} Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: ${DEFAULT_CO_AUTHOR}
`.trim();

// src/integration/commit-adapter.ts
var CommitEngineAdapter = class extends import_index.default {
  config;
  actionCount = 0;
  constructor(config = {}) {
    super();
    this.config = {
      engineName: config.engineName ?? "commit-agent",
      autoExecuteMaxScore: config.autoExecuteMaxScore ?? RISK_THRESHOLDS.autoExecuteMax,
      queueApprovalMaxScore: config.queueApprovalMaxScore ?? RISK_THRESHOLDS.queueApprovalMax,
      escalateMaxScore: config.escalateMaxScore ?? RISK_THRESHOLDS.escalateMax
    };
  }
  /**
   * Create an action for committing changes
   */
  createCommitAction(params) {
    const totalLines = params.diff.totalLinesAdded + params.diff.totalLinesRemoved;
    return this.createAction({
      type: params.amend ? "git_commit_amend" : "git_commit",
      description: `Commit: ${params.message.substring(0, 50)}${params.message.length > 50 ? "..." : ""}`,
      payload: {
        message: params.message,
        files: params.diff.files.map((f) => f.path),
        linesAdded: params.diff.totalLinesAdded,
        linesRemoved: params.diff.totalLinesRemoved,
        isBreaking: params.risk.isBreakingChange,
        criticalPaths: params.risk.criticalPaths
      },
      linesChanged: totalLines,
      filesChanged: params.diff.totalFilesChanged,
      reversible: !params.amend,
      // Regular commits can be reverted
      urgency: params.risk.isBreakingChange ? "high" : "normal"
    });
  }
  /**
   * Create an action for pushing changes
   */
  createPushAction(params) {
    return this.createAction({
      type: params.force ? "git_push_force" : "git_push",
      description: `Push to ${params.remote}/${params.branch}${params.force ? " (force)" : ""}`,
      payload: {
        remote: params.remote,
        branch: params.branch,
        force: params.force ?? false,
        commitCount: params.commitCount ?? 1
      },
      reversible: false,
      // Push cannot be easily undone
      urgency: params.force ? "critical" : "normal"
    });
  }
  /**
   * Create an action for creating a PR
   */
  createPRAction(params) {
    return this.createAction({
      type: params.draft ? "git_pr_draft" : "git_pr_create",
      description: `Create PR: ${params.title.substring(0, 50)}${params.title.length > 50 ? "..." : ""}`,
      payload: {
        title: params.title,
        body: params.body,
        base: params.base,
        draft: params.draft ?? false
      },
      reversible: true,
      // PRs can be closed
      urgency: "normal"
    });
  }
  /**
   * Determine decision outcome based on risk score
   */
  getDecisionOutcome(riskScore) {
    if (riskScore <= this.config.autoExecuteMaxScore) {
      return "auto_execute";
    }
    if (riskScore <= this.config.queueApprovalMaxScore) {
      return "queue_approval";
    }
    if (riskScore <= this.config.escalateMaxScore) {
      return "escalate";
    }
    return "reject";
  }
  /**
   * Check if an action should auto-execute
   */
  shouldAutoExecute(action) {
    if (action.type === "git_push_force") {
      return false;
    }
    const meta = action.metadata;
    if (meta.linesChanged && meta.linesChanged > 300) {
      return false;
    }
    if (meta.filesChanged && meta.filesChanged > 10) {
      return false;
    }
    return true;
  }
  /**
   * Create a generic action
   */
  createAction(params) {
    this.actionCount++;
    const action = {
      id: `commit_${Date.now()}_${this.actionCount}`,
      engine: "orchestrator",
      // Commit agent is orchestrator type
      category: this.getCategoryForType(params.type),
      type: params.type,
      description: params.description,
      params: params.payload,
      metadata: {
        estimatedValue: params.estimatedValue,
        reversible: params.reversible ?? true,
        urgency: params.urgency ?? "normal",
        linesChanged: params.linesChanged,
        filesChanged: params.filesChanged
      },
      timestamp: Date.now()
    };
    this.emit("action:submitted", action);
    return action;
  }
  /**
   * Map action type to category
   */
  getCategoryForType(actionType) {
    if (actionType === "git_push_force" || actionType.includes("pr")) {
      return "deployment";
    }
    if (actionType.includes("commit")) {
      return "build";
    }
    return "build";
  }
  /**
   * Get engine name
   */
  getEngineName() {
    return this.config.engineName;
  }
  /**
   * Get action count
   */
  getActionCount() {
    return this.actionCount;
  }
};
export {
  CommitEngineAdapter
};
//# sourceMappingURL=index.js.map