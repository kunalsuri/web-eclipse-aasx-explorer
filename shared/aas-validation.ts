/**
 * AAS V3.0 Validation Utilities
 * Basic validation rules for AAS elements
 */

import type {
  Environment,
  AssetAdministrationShell,
  Submodel,
  SubmodelElement,
  Reference,
  Property,
  MultiLanguageProperty,
  Range,
} from "./aas-v3-types";

// ============================================================================
// Validation Result Types
// ============================================================================

export interface ValidationError {
  path: string;
  message: string;
  severity: "error" | "warning";
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ============================================================================
// Environment Validation
// ============================================================================

/**
 * Validate an entire AAS Environment
 */
export function validateEnvironment(env: Environment): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate AAS shells
  if (env.assetAdministrationShells) {
    env.assetAdministrationShells.forEach((aas, index) => {
      const result = validateAAS(aas);
      errors.push(
        ...result.errors.map((e) => ({
          ...e,
          path: `assetAdministrationShells[${index}].${e.path}`,
        }))
      );
      warnings.push(
        ...result.warnings.map((w) => ({
          ...w,
          path: `assetAdministrationShells[${index}].${w.path}`,
        }))
      );
    });

    // Check for duplicate IDs
    const ids = new Set<string>();
    env.assetAdministrationShells.forEach((aas, index) => {
      if (ids.has(aas.id)) {
        errors.push({
          path: `assetAdministrationShells[${index}].id`,
          message: `Duplicate AAS ID: ${aas.id}`,
          severity: "error",
          code: "DUPLICATE_ID",
        });
      }
      ids.add(aas.id);
    });
  }

  // Validate Submodels
  if (env.submodels) {
    env.submodels.forEach((submodel, index) => {
      const result = validateSubmodel(submodel);
      errors.push(
        ...result.errors.map((e) => ({
          ...e,
          path: `submodels[${index}].${e.path}`,
        }))
      );
      warnings.push(
        ...result.warnings.map((w) => ({
          ...w,
          path: `submodels[${index}].${w.path}`,
        }))
      );
    });

    // Check for duplicate IDs
    const ids = new Set<string>();
    env.submodels.forEach((submodel, index) => {
      if (ids.has(submodel.id)) {
        errors.push({
          path: `submodels[${index}].id`,
          message: `Duplicate Submodel ID: ${submodel.id}`,
          severity: "error",
          code: "DUPLICATE_ID",
        });
      }
      ids.add(submodel.id);
    });
  }

  // Validate reference integrity
  const refErrors = validateReferenceIntegrity(env);
  errors.push(...refErrors);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// AAS Validation
// ============================================================================

/**
 * Validate an Asset Administration Shell
 */
export function validateAAS(aas: AssetAdministrationShell): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Required: id
  if (!aas.id || aas.id.trim() === "") {
    errors.push({
      path: "id",
      message: "AAS must have a non-empty id",
      severity: "error",
      code: "MISSING_ID",
    });
  }

  // Required: assetInformation
  if (!aas.assetInformation) {
    errors.push({
      path: "assetInformation",
      message: "AAS must have assetInformation",
      severity: "error",
      code: "MISSING_ASSET_INFO",
    });
  } else {
    // Validate assetInformation
    if (!aas.assetInformation.assetKind) {
      errors.push({
        path: "assetInformation.assetKind",
        message: "assetInformation must have assetKind",
        severity: "error",
        code: "MISSING_ASSET_KIND",
      });
    }
  }

  // Optional but recommended: idShort
  if (!aas.idShort || aas.idShort.trim() === "") {
    warnings.push({
      path: "idShort",
      message: "AAS should have an idShort for better readability",
      severity: "warning",
      code: "MISSING_IDSHORT",
    });
  }

  // Validate submodel references
  if (aas.submodels) {
    aas.submodels.forEach((ref, index) => {
      const refErrors = validateReference(ref);
      errors.push(
        ...refErrors.map((e) => ({
          ...e,
          path: `submodels[${index}].${e.path}`,
        }))
      );
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Submodel Validation
// ============================================================================

/**
 * Validate a Submodel
 */
export function validateSubmodel(submodel: Submodel): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Required: id
  if (!submodel.id || submodel.id.trim() === "") {
    errors.push({
      path: "id",
      message: "Submodel must have a non-empty id",
      severity: "error",
      code: "MISSING_ID",
    });
  }

  // Optional but recommended: idShort
  if (!submodel.idShort || submodel.idShort.trim() === "") {
    warnings.push({
      path: "idShort",
      message: "Submodel should have an idShort for better readability",
      severity: "warning",
      code: "MISSING_IDSHORT",
    });
  }

  // Optional but recommended: semanticId
  if (!submodel.semanticId) {
    warnings.push({
      path: "semanticId",
      message: "Submodel should have a semanticId for semantic interoperability",
      severity: "warning",
      code: "MISSING_SEMANTIC_ID",
    });
  }

  // Validate submodel elements
  if (submodel.submodelElements) {
    submodel.submodelElements.forEach((element, index) => {
      const result = validateSubmodelElement(element);
      errors.push(
        ...result.errors.map((e) => ({
          ...e,
          path: `submodelElements[${index}].${e.path}`,
        }))
      );
      warnings.push(
        ...result.warnings.map((w) => ({
          ...w,
          path: `submodelElements[${index}].${w.path}`,
        }))
      );
    });

    // Check for duplicate idShorts
    const idShorts = new Set<string>();
    submodel.submodelElements.forEach((element, index) => {
      if (element.idShort) {
        if (idShorts.has(element.idShort)) {
          errors.push({
            path: `submodelElements[${index}].idShort`,
            message: `Duplicate idShort in submodel: ${element.idShort}`,
            severity: "error",
            code: "DUPLICATE_IDSHORT",
          });
        }
        idShorts.add(element.idShort);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Submodel Element Validation
// ============================================================================

/**
 * Validate a Submodel Element
 */
export function validateSubmodelElement(
  element: SubmodelElement
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Required: modelType
  if (!element.modelType) {
    errors.push({
      path: "modelType",
      message: "SubmodelElement must have a modelType",
      severity: "error",
      code: "MISSING_MODEL_TYPE",
    });
  }

  // Optional but recommended: idShort
  if (!element.idShort || element.idShort.trim() === "") {
    warnings.push({
      path: "idShort",
      message: "SubmodelElement should have an idShort",
      severity: "warning",
      code: "MISSING_IDSHORT",
    });
  }

  // Type-specific validation
  switch (element.modelType) {
    case "Property":
      validateProperty(element as Property, errors, warnings);
      break;
    case "MultiLanguageProperty":
      validateMultiLanguageProperty(
        element as MultiLanguageProperty,
        errors,
        warnings
      );
      break;
    case "Range":
      validateRange(element as Range, errors, warnings);
      break;
    case "SubmodelElementCollection":
      if ("value" in element && Array.isArray(element.value)) {
        element.value.forEach((child, index) => {
          const result = validateSubmodelElement(child);
          errors.push(
            ...result.errors.map((e) => ({
              ...e,
              path: `value[${index}].${e.path}`,
            }))
          );
          warnings.push(
            ...result.warnings.map((w) => ({
              ...w,
              path: `value[${index}].${w.path}`,
            }))
          );
        });
      }
      break;
    case "SubmodelElementList":
      if ("value" in element && Array.isArray(element.value)) {
        element.value.forEach((child, index) => {
          const result = validateSubmodelElement(child);
          errors.push(
            ...result.errors.map((e) => ({
              ...e,
              path: `value[${index}].${e.path}`,
            }))
          );
          warnings.push(
            ...result.warnings.map((w) => ({
              ...w,
              path: `value[${index}].${w.path}`,
            }))
          );
        });
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a Property
 */
function validateProperty(
  property: Property,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  // Required: valueType
  if (!property.valueType) {
    errors.push({
      path: "valueType",
      message: "Property must have a valueType",
      severity: "error",
      code: "MISSING_VALUE_TYPE",
    });
  }

  // Optional but recommended: value
  if (property.value === undefined || property.value === null) {
    warnings.push({
      path: "value",
      message: "Property should have a value",
      severity: "warning",
      code: "MISSING_VALUE",
    });
  }
}

/**
 * Validate a MultiLanguageProperty
 */
function validateMultiLanguageProperty(
  property: MultiLanguageProperty,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  // Optional but recommended: value
  if (!property.value || property.value.length === 0) {
    warnings.push({
      path: "value",
      message: "MultiLanguageProperty should have at least one value",
      severity: "warning",
      code: "MISSING_VALUE",
    });
  }
}

/**
 * Validate a Range
 */
function validateRange(
  range: Range,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  // Required: valueType
  if (!range.valueType) {
    errors.push({
      path: "valueType",
      message: "Range must have a valueType",
      severity: "error",
      code: "MISSING_VALUE_TYPE",
    });
  }

  // At least one of min or max should be set
  if (range.min === undefined && range.max === undefined) {
    warnings.push({
      path: "min/max",
      message: "Range should have at least min or max value",
      severity: "warning",
      code: "MISSING_RANGE_VALUES",
    });
  }
}

// ============================================================================
// Reference Validation
// ============================================================================

/**
 * Validate a Reference
 */
function validateReference(ref: Reference): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required: type
  if (!ref.type) {
    errors.push({
      path: "type",
      message: "Reference must have a type",
      severity: "error",
      code: "MISSING_REFERENCE_TYPE",
    });
  }

  // Required: keys
  if (!ref.keys || ref.keys.length === 0) {
    errors.push({
      path: "keys",
      message: "Reference must have at least one key",
      severity: "error",
      code: "MISSING_KEYS",
    });
  } else {
    ref.keys.forEach((key, index) => {
      if (!key.type) {
        errors.push({
          path: `keys[${index}].type`,
          message: "Key must have a type",
          severity: "error",
          code: "MISSING_KEY_TYPE",
        });
      }
      if (!key.value || key.value.trim() === "") {
        errors.push({
          path: `keys[${index}].value`,
          message: "Key must have a non-empty value",
          severity: "error",
          code: "MISSING_KEY_VALUE",
        });
      }
    });
  }

  return errors;
}

/**
 * Validate reference integrity in an Environment
 * Check that all references point to existing elements
 */
function validateReferenceIntegrity(env: Environment): ValidationError[] {
  const errors: ValidationError[] = [];

  // Collect all IDs
  const aasIds = new Set<string>();
  const submodelIds = new Set<string>();
  const conceptDescriptionIds = new Set<string>();

  if (env.assetAdministrationShells) {
    env.assetAdministrationShells.forEach((aas) => aasIds.add(aas.id));
  }

  if (env.submodels) {
    env.submodels.forEach((sm) => submodelIds.add(sm.id));
  }

  if (env.conceptDescriptions) {
    env.conceptDescriptions.forEach((cd) => conceptDescriptionIds.add(cd.id));
  }

  // Check AAS submodel references
  if (env.assetAdministrationShells) {
    env.assetAdministrationShells.forEach((aas, aasIndex) => {
      if (aas.submodels) {
        aas.submodels.forEach((ref, refIndex) => {
          if (ref.keys && ref.keys.length > 0) {
            const targetId = ref.keys[ref.keys.length - 1].value;
            if (!submodelIds.has(targetId)) {
              errors.push({
                path: `assetAdministrationShells[${aasIndex}].submodels[${refIndex}]`,
                message: `Reference to non-existent Submodel: ${targetId}`,
                severity: "error",
                code: "BROKEN_REFERENCE",
              });
            }
          }
        });
      }
    });
  }

  return errors;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format validation results as a readable string
 */
export function formatValidationResults(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.isValid) {
    lines.push("✓ Validation passed");
  } else {
    lines.push("✗ Validation failed");
  }

  if (result.errors.length > 0) {
    lines.push(`\nErrors (${result.errors.length}):`);
    result.errors.forEach((error) => {
      lines.push(`  - ${error.path}: ${error.message}`);
    });
  }

  if (result.warnings.length > 0) {
    lines.push(`\nWarnings (${result.warnings.length}):`);
    result.warnings.forEach((warning) => {
      lines.push(`  - ${warning.path}: ${warning.message}`);
    });
  }

  return lines.join("\n");
}

/**
 * Get only errors from validation result
 */
export function getErrors(result: ValidationResult): ValidationError[] {
  return result.errors;
}

/**
 * Get only warnings from validation result
 */
export function getWarnings(result: ValidationResult): ValidationError[] {
  return result.warnings;
}

/**
 * Check if validation result has any errors
 */
export function hasErrors(result: ValidationResult): boolean {
  return result.errors.length > 0;
}

/**
 * Check if validation result has any warnings
 */
export function hasWarnings(result: ValidationResult): boolean {
  return result.warnings.length > 0;
}
