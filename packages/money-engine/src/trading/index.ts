/**
 * Trading module exports
 */

export { BaseBot, type BotEvents } from "./base-bot.js";
export { RiskManager } from "./risk-manager.js";
export { DCABot, createSOLDCABot } from "./bots/dca.js";
export { DualTradingEngine, type DualEngineConfig, type DualPerformance } from "./dual-engine.js";
