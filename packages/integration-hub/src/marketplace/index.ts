/**
 * Marketplace Module - Pipeline template discovery and sharing
 */

export {
  MarketplaceManager,
  getMarketplaceManager,
  createMarketplaceManager,
  type MarketplaceManagerConfig,
} from "./marketplace-manager.js";

export {
  // Schemas
  TemplateCategorySchema,
  TemplateVisibilitySchema,
  TemplateStatusSchema,
  AuthorSchema,
  TemplateStepSchema,
  TemplateInputSchema,
  MarketplaceTemplateSchema,
  CreateTemplateSchema,
  ReviewSchema,
  InstallationSchema,
  SearchFiltersSchema,
  SearchResultsSchema,
  CollectionSchema,

  // Types
  type TemplateCategory,
  type TemplateVisibility,
  type TemplateStatus,
  type Author,
  type TemplateStep,
  type TemplateInput,
  type MarketplaceTemplate,
  type CreateTemplate,
  type Review,
  type Installation,
  type SearchFilters,
  type SearchResults,
  type Collection,
  type MarketplaceEvents,

  // Constants
  CATEGORY_INFO,
} from "./types.js";
