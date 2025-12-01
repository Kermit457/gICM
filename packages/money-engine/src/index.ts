/**
 * gICM Money Engine
 *
 * Self-funding system for the gICM platform.
 * Manages treasury, trading, expenses, and revenue tracking.
 */

// Main Engine
export { MoneyEngine, type MoneyEngineEvents } from "./engine.js";

// Core Types
export * from "./core/types.js";

// Treasury
export { TreasuryManager, type TreasuryManagerConfig } from "./treasury/index.js";

// Expenses
export { ExpenseTracker } from "./expenses/index.js";

// Utils
export { Logger, type LogLevel } from "./utils/logger.js";
