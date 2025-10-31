/**
 * Validation Types
 * 
 * Shared types for validation system to avoid circular dependencies
 */

import type { Environment } from "./aas-v3-types";

export interface ValidationError {
  path: string;
  message: string;
  severity: "error" | "warning" | "info";
  code: string;
  element?: any;
  suggestion?: string;
}

export interface ValidationContext {
  environment: Environment;
  element: any;
  path: string;
  parent?: any;
  root: Environment;
}

export type ValidationCategory =
  | "structure"
  | "schema"
  | "reference"
  | "semantic"
  | "datatype"
  | "cardinality"
  | "custom";

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: "error" | "warning" | "info";
  category: ValidationCategory;
  validate: (context: ValidationContext) => ValidationError[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  infos: ValidationError[];
  timestamp: Date;
  duration: number;
}

export interface ValidationPreset {
  id: string;
  name: string;
  description: string;
  rules: string[]; // Rule IDs
  strict: boolean;
}
