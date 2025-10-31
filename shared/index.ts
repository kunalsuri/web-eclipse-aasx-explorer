/**
 * AAS V3.0 Shared Module
 * Exports all AAS types, serialization, and validation utilities
 */

// Export all types
export * from "./aas-v3-types";

// Export serialization utilities
export * from "./aas-serialization";

// Export validation utilities (basic validation functions)
export {
  validateEnvironment,
  validateAAS,
  validateSubmodel,
  validateSubmodelElement,
  formatValidationResults as formatBasicValidationResults,
  getErrors,
  getWarnings,
  hasErrors,
  hasWarnings,
} from "./aas-validation";

// Export advanced validation engine (includes all validation types)
export * from "./aas-validation-engine";

// Export sample data
export * from "./aas-sample-data";

// Export parser
export * from "./aas-parser";

// Export search functionality
export * from "./aas-search-types";
export * from "./aas-search-engine";
export * from "./aas-search-filters";
