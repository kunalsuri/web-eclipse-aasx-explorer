/**
 * Validation Rules Index
 * 
 * Central export for all AAS validation constraint rules
 */

import { AASdConstraints } from "./aasd-constraints";
import { AASdAdvancedConstraints } from "./aasd-advanced-constraints";
import { AASdStructuralConstraints } from "./aasd-structural";
import { AASdSemanticConstraints } from "./aasd-semantic";
import { AASdReferenceConstraints } from "./aasd-reference";
import { AASdDataTypeConstraints } from "./aasd-datatype";
import { AASdCardinalityConstraints } from "./aasd-cardinality";
import type { ValidationRule } from "../validation-types";

/**
 * All AASd specification constraints combined
 */
export const AllAASdConstraints: ValidationRule[] = [
  ...AASdConstraints,
  ...AASdAdvancedConstraints,
  ...AASdStructuralConstraints,
  ...AASdSemanticConstraints,
  ...AASdReferenceConstraints,
  ...AASdDataTypeConstraints,
  ...AASdCardinalityConstraints,
];

/**
 * Get total number of implemented constraints
 */
export function getConstraintCount(): number {
  return AllAASdConstraints.length;
}

/**
 * Get constraints by category
 */
export function getConstraintsByCategory(category: string): ValidationRule[] {
  return AllAASdConstraints.filter(rule => rule.category === category);
}

/**
 * Get constraint by ID
 */
export function getConstraintById(id: string): ValidationRule | undefined {
  return AllAASdConstraints.find(rule => rule.id === id);
}

/**
 * Re-export individual constraint collections
 */
export { 
  AASdConstraints, 
  AASdAdvancedConstraints, 
  AASdStructuralConstraints, 
  AASdSemanticConstraints,
  AASdReferenceConstraints,
  AASdDataTypeConstraints,
  AASdCardinalityConstraints,
};
