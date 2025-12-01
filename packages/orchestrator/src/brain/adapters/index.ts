/**
 * Engine Adapters
 *
 * Convert real engine instances to EngineConnections interface.
 */

export { createMoneyAdapter } from "./money-adapter.js";
export { createGrowthAdapter } from "./growth-adapter.js";
export { createProductAdapter } from "./product-adapter.js";
export { createHunterAdapter, HunterAdapter } from "./hunter-adapter.js";
export type { HunterEngineConnection, HunterAdapterConfig, HunterStatus } from "./hunter-adapter.js";
export { createAutonomyAdapter } from "./autonomy-adapter.js";
export type { AutonomyAdapter, AutonomyAdapterConfig } from "./autonomy-adapter.js";
