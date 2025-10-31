/**
 * AAS V3.0 Cardinality Constraints (AASd-144 to AASd-150)
 * 
 * Validation rules for element cardinality and collection size requirements.
 * These constraints ensure that collections have appropriate numbers of elements.
 * 
 * Reference: Details of the Asset Administration Shell - Part 1 V3.0
 */

import type { ValidationRule, ValidationContext, ValidationError } from "../validation-types";
import type { Environment } from "../aas-v3-types";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Traverse all elements in the environment
 */
function traverseElements(
  env: Environment,
  callback: (element: any, path: string) => void
): void {
  // Traverse submodels
  if (env.submodels) {
    env.submodels.forEach((sm, smIdx) => {
      callback(sm, `submodels[${smIdx}]`);
      if (sm.submodelElements) {
        traverseSubmodelElements(sm.submodelElements, `submodels[${smIdx}].submodelElements`, callback);
      }
    });
  }
}

/**
 * Recursively traverse submodel elements
 */
function traverseSubmodelElements(
  elements: any[],
  basePath: string,
  callback: (element: any, path: string) => void
): void {
  elements.forEach((elem, idx) => {
    const path = `${basePath}[${idx}]`;
    callback(elem, path);

    // Recursively check nested elements
    if (elem.submodelElements && Array.isArray(elem.submodelElements)) {
      traverseSubmodelElements(elem.submodelElements, `${path}.submodelElements`, callback);
    }
    if (elem.value && Array.isArray(elem.value) && elem.modelType !== "MultiLanguageProperty") {
      traverseSubmodelElements(elem.value, `${path}.value`, callback);
    }
  });
}


// ============================================================================
// AASd-144 to AASd-150: Cardinality Constraints
// ============================================================================

/**
 * AASd-144: Submodel must have at least one submodelElement (if not empty)
 * 
 * A Submodel that is intended to contain data should have at least one submodelElement.
 * Empty submodels are allowed but should be flagged as informational.
 */
export const AASd_144: ValidationRule = {
  id: "AASd-144",
  name: "Submodel Element Cardinality",
  description: "Submodel should have at least one submodelElement if not explicitly empty",
  severity: "info",
  category: "cardinality",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (ctx.environment.submodels) {
      ctx.environment.submodels.forEach((sm, idx) => {
        // Check if submodel has no elements
        if (!sm.submodelElements || sm.submodelElements.length === 0) {
          errors.push({
            path: `submodels[${idx}].submodelElements`,
            message: `Submodel "${sm.idShort || sm.id}" has no submodelElements`,
            severity: "info",
            code: "AASd-144",
            suggestion: "Add at least one submodelElement or mark as intentionally empty",
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-145: SubmodelElementCollection cardinality
 * 
 * A SubmodelElementCollection should contain at least one element to be meaningful.
 * Empty collections are allowed but flagged as informational.
 */
export const AASd_145: ValidationRule = {
  id: "AASd-145",
  name: "SubmodelElementCollection Cardinality",
  description: "SubmodelElementCollection should contain at least one element",
  severity: "info",
  category: "cardinality",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseElements(ctx.environment, (element, path) => {
      if (element.modelType === "SubmodelElementCollection") {
        if (!element.value || element.value.length === 0) {
          errors.push({
            path: `${path}.value`,
            message: `SubmodelElementCollection "${element.idShort}" is empty`,
            severity: "info",
            code: "AASd-145",
            suggestion: "Add at least one submodel element to the collection",
          });
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-146: SubmodelElementList cardinality
 * 
 * A SubmodelElementList should contain at least one element to be meaningful.
 * Empty lists are allowed but flagged as informational.
 */
export const AASd_146: ValidationRule = {
  id: "AASd-146",
  name: "SubmodelElementList Cardinality",
  description: "SubmodelElementList should contain at least one element",
  severity: "info",
  category: "cardinality",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseElements(ctx.environment, (element, path) => {
      if (element.modelType === "SubmodelElementList") {
        if (!element.value || element.value.length === 0) {
          errors.push({
            path: `${path}.value`,
            message: `SubmodelElementList "${element.idShort}" is empty`,
            severity: "info",
            code: "AASd-146",
            suggestion: "Add at least one element to the list",
          });
        }
      }
    });

    return errors;
  },
};


/**
 * AASd-147: Operation input/output cardinality
 * 
 * An Operation should have at least one of: inputVariables, outputVariables, or inoutputVariables.
 * Operations without any variables are unusual and flagged as informational.
 */
export const AASd_147: ValidationRule = {
  id: "AASd-147",
  name: "Operation Variables Cardinality",
  description: "Operation should have at least one variable (input, output, or inoutput)",
  severity: "info",
  category: "cardinality",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseElements(ctx.environment, (element, path) => {
      if (element.modelType === "Operation") {
        const hasInput = element.inputVariables && element.inputVariables.length > 0;
        const hasOutput = element.outputVariables && element.outputVariables.length > 0;
        const hasInoutput = element.inoutputVariables && element.inoutputVariables.length > 0;

        if (!hasInput && !hasOutput && !hasInoutput) {
          errors.push({
            path,
            message: `Operation "${element.idShort}" has no variables (input, output, or inoutput)`,
            severity: "info",
            code: "AASd-147",
            suggestion: "Add at least one input, output, or inoutput variable",
          });
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-148: Entity statements cardinality
 * 
 * An Entity should have at least one statement (submodel element) to describe it.
 * Entities without statements are allowed but flagged as informational.
 */
export const AASd_148: ValidationRule = {
  id: "AASd-148",
  name: "Entity Statements Cardinality",
  description: "Entity should have at least one statement",
  severity: "info",
  category: "cardinality",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseElements(ctx.environment, (element, path) => {
      if (element.modelType === "Entity") {
        if (!element.statements || element.statements.length === 0) {
          errors.push({
            path: `${path}.statements`,
            message: `Entity "${element.idShort}" has no statements`,
            severity: "info",
            code: "AASd-148",
            suggestion: "Add at least one statement (submodel element) to describe the entity",
          });
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-149: AnnotatedRelationshipElement annotations cardinality
 * 
 * An AnnotatedRelationshipElement should have at least one annotation to differentiate
 * it from a simple RelationshipElement. Empty annotations are flagged as informational.
 */
export const AASd_149: ValidationRule = {
  id: "AASd-149",
  name: "AnnotatedRelationshipElement Annotations Cardinality",
  description: "AnnotatedRelationshipElement should have at least one annotation",
  severity: "info",
  category: "cardinality",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseElements(ctx.environment, (element, path) => {
      if (element.modelType === "AnnotatedRelationshipElement") {
        if (!element.annotations || element.annotations.length === 0) {
          errors.push({
            path: `${path}.annotations`,
            message: `AnnotatedRelationshipElement "${element.idShort}" has no annotations`,
            severity: "info",
            code: "AASd-149",
            suggestion: "Add at least one annotation or use RelationshipElement instead",
          });
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-150: ConceptDescription isCaseOf cardinality
 * 
 * A ConceptDescription may reference other concept descriptions via isCaseOf.
 * This is optional but when present should have at least one reference.
 */
export const AASd_150: ValidationRule = {
  id: "AASd-150",
  name: "ConceptDescription IsCaseOf Cardinality",
  description: "ConceptDescription isCaseOf should have at least one reference if present",
  severity: "info",
  category: "cardinality",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        // Only check if isCaseOf is defined but empty
        if (cd.isCaseOf !== undefined && (!cd.isCaseOf || cd.isCaseOf.length === 0)) {
          errors.push({
            path: `conceptDescriptions[${idx}].isCaseOf`,
            message: `ConceptDescription "${cd.idShort || cd.id}" has empty isCaseOf array`,
            severity: "info",
            code: "AASd-150",
            suggestion: "Add at least one reference or remove the isCaseOf property",
          });
        }
      });
    }

    return errors;
  },
};

// ============================================================================
// Export all cardinality constraint rules
// ============================================================================

export const AASdCardinalityConstraints: ValidationRule[] = [
  AASd_144,
  AASd_145,
  AASd_146,
  AASd_147,
  AASd_148,
  AASd_149,
  AASd_150,
];
