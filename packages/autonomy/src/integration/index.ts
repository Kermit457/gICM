/**
 * Integration Module for Level 2 Autonomy
 *
 * Engine adapters for connecting autonomy to gICM engines
 */

export {
  EngineAdapter,
  type EngineAdapterConfig,
  type EngineAdapterEvents,
} from "./engine-adapter.js";
export {
  MoneyEngineAdapter,
  type DCATradeParams,
  type SwapParams,
  type ExpenseParams,
} from "./money-adapter.js";
export {
  GrowthEngineAdapter,
  type TweetParams,
  type BlogParams,
  type DiscordAnnouncementParams,
} from "./growth-adapter.js";
export {
  ProductEngineAdapter,
  type BuildParams,
  type CommitParams,
  type DeployParams,
} from "./product-adapter.js";
