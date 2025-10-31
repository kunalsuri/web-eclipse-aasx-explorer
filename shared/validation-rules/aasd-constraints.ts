/**
 * AAS V3.0 Specification Constraints (AASd-001 to AASd-150)
 * 
 * Comprehensive validation rules based on Asset Administration Shell V3.0 specification.
 * These constraints ensure compliance with the official AAS metamodel.
 * 
 * Reference: Details of the Asset Administration Shell - Part 1 V3.0
 */

import type { ValidationRule, ValidationContext, ValidationError } from "../validation-types";
import type {
  Environment,
  Referable,
  Identifiable,
  Reference,
  Key,
  SubmodelElement,
  Property,
  MultiLanguageProperty,
  Range,
  ReferenceElement,
  SubmodelElementCollection,
  SubmodelElementList,
} from "../aas-v3-types";
import { ReferenceTypes, KeyTypes } from "../aas-v3-types";

// ============================================================================
// AASd-001 to AASd-050: Structural Constraints
// ============================================================================

/**
 * AASd-002: IdShort of Referables shall only feature letters, digits, underscore ("_");
 * starting mandatory with a letter. I.e. [a-zA-Z][a-zA-Z0-9_]*
 */
export const AASd_002: ValidationRule = {
  id: "AASd-002",
  name: "IdShort Pattern Validation",
  description: "IdShort must match pattern [a-zA-Z][a-zA-Z0-9_]*",
  severity: "error",
  category: "schema",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];
    const pattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;

    function validateReferable(element: any, path: string): void {
      if (element.idShort && !pattern.test(element.idShort)) {
        errors.push({
          path: `${path}.idShort`,
          message: `IdShort "${element.idShort}" must match pattern [a-zA-Z][a-zA-Z0-9_]*`,
          severity: "error",
          code: "AASd-002",
          suggestion: "IdShort must start with a letter and contain only letters, digits, and underscores",
        });
      }

      // Recursively check SubmodelElements
      if (element.submodelElements && Array.isArray(element.submodelElements)) {
        element.submodelElements.forEach((child: any, idx: number) => {
          validateReferable(child, `${path}.submodelElements[${idx}]`);
        });
      }

      // Check value in SubmodelElementList
      if (element.value && Array.isArray(element.value)) {
        element.value.forEach((child: any, idx: number) => {
          validateReferable(child, `${path}.value[${idx}]`);
        });
      }
    }

    // Validate AAS
    if (ctx.environment.assetAdministrationShells) {
      ctx.environment.assetAdministrationShells.forEach((aas, idx) => {
        validateReferable(aas, `assetAdministrationShells[${idx}]`);
      });
    }

    // Validate Submodels
    if (ctx.environment.submodels) {
      ctx.environment.submodels.forEach((sm, idx) => {
        validateReferable(sm, `submodels[${idx}]`);
        if (sm.submodelElements) {
          sm.submodelElements.forEach((elem, elemIdx) => {
            validateReferable(elem, `submodels[${idx}].submodelElements[${elemIdx}]`);
          });
        }
      });
    }

    // Validate ConceptDescriptions
    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        validateReferable(cd, `conceptDescriptions[${idx}]`);
      });
    }

    return errors;
  },
};

/**
 * AASd-021: Identifiable must have a globally unique identifier (id)
 */
export const AASd_021: ValidationRule = {
  id: "AASd-021",
  name: "Identifiable Must Have Valid ID",
  description: "Every Identifiable must have a globally unique identifier",
  severity: "error",
  category: "schema",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];
    const allIds = new Set<string>();

    function checkIdentifiable(element: any, path: string, type: string): void {
      if (!element.id || element.id.trim() === "") {
        errors.push({
          path: `${path}.id`,
          message: `${type} must have a non-empty id`,
          severity: "error",
          code: "AASd-021",
          suggestion: "Provide a globally unique identifier",
        });
      } else if (allIds.has(element.id)) {
        errors.push({
          path: `${path}.id`,
          message: `Duplicate identifier: ${element.id}`,
          severity: "error",
          code: "AASd-021",
          suggestion: "ID must be globally unique across all Identifiables",
        });
      } else {
        allIds.add(element.id);
      }
    }

    // Check AAS
    if (ctx.environment.assetAdministrationShells) {
      ctx.environment.assetAdministrationShells.forEach((aas, idx) => {
        checkIdentifiable(aas, `assetAdministrationShells[${idx}]`, "AssetAdministrationShell");
      });
    }

    // Check Submodels
    if (ctx.environment.submodels) {
      ctx.environment.submodels.forEach((sm, idx) => {
        checkIdentifiable(sm, `submodels[${idx}]`, "Submodel");
      });
    }

    // Check ConceptDescriptions
    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        checkIdentifiable(cd, `conceptDescriptions[${idx}]`, "ConceptDescription");
      });
    }

    return errors;
  },
};

/**
 * AASd-022: IdShort of non-identifiable Referables within the same name space shall be unique
 */
export const AASd_022: ValidationRule = {
  id: "AASd-022",
  name: "IdShort Uniqueness Within Parent",
  description: "IdShort must be unique among siblings in the same container",
  severity: "error",
  category: "structure",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    function checkUniqueness(elements: any[], parentPath: string): void {
      const idShorts = new Map<string, number>();

      elements.forEach((elem, idx) => {
        if (elem.idShort) {
          if (idShorts.has(elem.idShort)) {
            errors.push({
              path: `${parentPath}[${idx}].idShort`,
              message: `Duplicate idShort "${elem.idShort}" within parent (also at index ${idShorts.get(elem.idShort)})`,
              severity: "error",
              code: "AASd-022",
              suggestion: "IdShort must be unique among siblings",
            });
          } else {
            idShorts.set(elem.idShort, idx);
          }
        }

        // Recursively check children
        if (elem.submodelElements && Array.isArray(elem.submodelElements)) {
          checkUniqueness(elem.submodelElements, `${parentPath}[${idx}].submodelElements`);
        }
        if (elem.value && Array.isArray(elem.value)) {
          checkUniqueness(elem.value, `${parentPath}[${idx}].value`);
        }
      });
    }

    // Check Submodel elements
    if (ctx.environment.submodels) {
      ctx.environment.submodels.forEach((sm, idx) => {
        if (sm.submodelElements) {
          checkUniqueness(sm.submodelElements, `submodels[${idx}].submodelElements`);
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-051: Constraint AASd-051: A ConceptDescription shall have one of the following
 * categories: VALUE, PROPERTY, REFERENCE, DOCUMENT, CAPABILITY, RELATIONSHIP, COLLECTION, 
 * FUNCTION, EVENT, ENTITY, APPLICATION_CLASS, QUALIFIER_TYPE, VIEW, CONCEPT, or a user-defined category.
 */
export const AASd_051: ValidationRule = {
  id: "AASd-051",
  name: "ConceptDescription Category",
  description: "ConceptDescription must have a valid category",
  severity: "warning",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];
    const validCategories = [
      "VALUE", "PROPERTY", "REFERENCE", "DOCUMENT", "CAPABILITY",
      "RELATIONSHIP", "COLLECTION", "FUNCTION", "EVENT", "ENTITY",
      "APPLICATION_CLASS", "QUALIFIER_TYPE", "VIEW", "CONCEPT"
    ];

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        if (cd.category && !validCategories.includes(cd.category)) {
          // User-defined categories are allowed, just warn
          errors.push({
            path: `conceptDescriptions[${idx}].category`,
            message: `ConceptDescription has user-defined category "${cd.category}"`,
            severity: "info",
            code: "AASd-051",
            suggestion: `Standard categories: ${validCategories.join(", ")}`,
          });
        }
      });
    }

    return errors;
  },
};

// ============================================================================
// AASd-100 to AASd-150: Reference and Semantic Constraints
// ============================================================================

/**
 * AASd-116: Reference keys shall not be empty
 */
export const AASd_116: ValidationRule = {
  id: "AASd-116",
  name: "Reference Keys Not Empty",
  description: "References must have at least one key with non-empty value",
  severity: "error",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    function checkReference(ref: Reference | undefined, path: string): void {
      if (!ref) return;

      if (!ref.keys || ref.keys.length === 0) {
        errors.push({
          path,
          message: "Reference must have at least one key",
          severity: "error",
          code: "AASd-116",
          suggestion: "Add at least one key to the reference",
        });
        return;
      }

      ref.keys.forEach((key, keyIdx) => {
        if (!key.value || key.value.trim() === "") {
          errors.push({
            path: `${path}.keys[${keyIdx}].value`,
            message: "Key value must not be empty",
            severity: "error",
            code: "AASd-116",
            suggestion: "Provide a non-empty value for the key",
          });
        }
      });
    }

    function checkElement(element: any, path: string): void {
      // Check semanticId
      if (element.semanticId) {
        checkReference(element.semanticId, `${path}.semanticId`);
      }

      // Check supplementalSemanticIds
      if (element.supplementalSemanticIds && Array.isArray(element.supplementalSemanticIds)) {
        element.supplementalSemanticIds.forEach((ref: Reference, idx: number) => {
          checkReference(ref, `${path}.supplementalSemanticIds[${idx}]`);
        });
      }

      // Check ReferenceElement value
      if (element.modelType === "ReferenceElement" && element.value) {
        checkReference(element.value, `${path}.value`);
      }

      // Recursively check children
      if (element.submodelElements && Array.isArray(element.submodelElements)) {
        element.submodelElements.forEach((child: any, idx: number) => {
          checkElement(child, `${path}.submodelElements[${idx}]`);
        });
      }
      if (element.value && Array.isArray(element.value)) {
        element.value.forEach((child: any, idx: number) => {
          checkElement(child, `${path}.value[${idx}]`);
        });
      }
    }

    // Check AAS references
    if (ctx.environment.assetAdministrationShells) {
      ctx.environment.assetAdministrationShells.forEach((aas, idx) => {
        if (aas.submodels) {
          aas.submodels.forEach((ref, refIdx) => {
            checkReference(ref, `assetAdministrationShells[${idx}].submodels[${refIdx}]`);
          });
        }
        if (aas.derivedFrom) {
          checkReference(aas.derivedFrom, `assetAdministrationShells[${idx}].derivedFrom`);
        }
      });
    }

    // Check Submodels
    if (ctx.environment.submodels) {
      ctx.environment.submodels.forEach((sm, idx) => {
        checkElement(sm, `submodels[${idx}]`);
        if (sm.submodelElements) {
          sm.submodelElements.forEach((elem, elemIdx) => {
            checkElement(elem, `submodels[${idx}].submodelElements[${elemIdx}]`);
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-118: If a supplementalSemanticId is defined, semanticId must also be defined
 */
export const AASd_118: ValidationRule = {
  id: "AASd-118",
  name: "SupplementalSemanticId Requires SemanticId",
  description: "supplementalSemanticIds require a semanticId to be present",
  severity: "error",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    function checkElement(element: any, path: string): void {
      if (element.supplementalSemanticIds && element.supplementalSemanticIds.length > 0) {
        if (!element.semanticId) {
          errors.push({
            path: `${path}.supplementalSemanticIds`,
            message: "supplementalSemanticIds defined but semanticId is missing",
            severity: "error",
            code: "AASd-118",
            suggestion: "Define semanticId before using supplementalSemanticIds",
          });
        }
      }

      // Recursively check children
      if (element.submodelElements && Array.isArray(element.submodelElements)) {
        element.submodelElements.forEach((child: any, idx: number) => {
          checkElement(child, `${path}.submodelElements[${idx}]`);
        });
      }
      if (element.value && Array.isArray(element.value)) {
        element.value.forEach((child: any, idx: number) => {
          checkElement(child, `${path}.value[${idx}]`);
        });
      }
    }

    // Check Submodels
    if (ctx.environment.submodels) {
      ctx.environment.submodels.forEach((sm, idx) => {
        checkElement(sm, `submodels[${idx}]`);
        if (sm.submodelElements) {
          sm.submodelElements.forEach((elem, elemIdx) => {
            checkElement(elem, `submodels[${idx}].submodelElements[${elemIdx}]`);
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-119: If any Qualifier/kind is set to 'TemplateQualifier', the qualified element must be part of a template
 */
export const AASd_119: ValidationRule = {
  id: "AASd-119",
  name: "TemplateQualifier Context",
  description: "TemplateQualifiers must only appear in template contexts",
  severity: "error",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    function checkQualifiers(element: any, path: string, isTemplate: boolean): void {
      if (element.qualifiers && Array.isArray(element.qualifiers)) {
        element.qualifiers.forEach((qualifier: any, idx: number) => {
          if (qualifier.kind === "TemplateQualifier" && !isTemplate) {
            errors.push({
              path: `${path}.qualifiers[${idx}]`,
              message: "TemplateQualifier used outside of template context",
              severity: "error",
              code: "AASd-119",
              suggestion: "TemplateQualifier can only be used in template Submodels (kind='Template')",
            });
          }
        });
      }

      // Recursively check children
      if (element.submodelElements && Array.isArray(element.submodelElements)) {
        element.submodelElements.forEach((child: any, idx: number) => {
          checkQualifiers(child, `${path}.submodelElements[${idx}]`, isTemplate);
        });
      }
    }

    // Check Submodels
    if (ctx.environment.submodels) {
      ctx.environment.submodels.forEach((sm, idx) => {
        const isTemplate = sm.kind === "Template";
        checkQualifiers(sm, `submodels[${idx}]`, isTemplate);
        if (sm.submodelElements) {
          sm.submodelElements.forEach((elem, elemIdx) => {
            checkQualifiers(elem, `submodels[${idx}].submodelElements[${elemIdx}]`, isTemplate);
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-120: External references must have GlobalReference type
 */
export const AASd_120: ValidationRule = {
  id: "AASd-120",
  name: "External Reference Type",
  description: "External references must use GlobalReference type",
  severity: "error",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    function checkReference(ref: Reference | undefined, path: string): void {
      if (!ref || !ref.keys || ref.keys.length === 0) return;

      const firstKey = ref.keys[0];
      const isExternal = firstKey.value && (
        firstKey.value.startsWith("http://") ||
        firstKey.value.startsWith("https://") ||
        firstKey.value.startsWith("urn:")
      );

      if (isExternal && ref.type !== ReferenceTypes.ExternalReference) {
        errors.push({
          path: `${path}.type`,
          message: `External reference must have type 'ExternalReference', found '${ref.type}'`,
          severity: "error",
          code: "AASd-120",
          suggestion: "Set type to 'ExternalReference' for external references (URLs, URNs)",
        });
      }
    }

    function checkElement(element: any, path: string): void {
      if (element.semanticId) {
        checkReference(element.semanticId, `${path}.semanticId`);
      }
      if (element.supplementalSemanticIds) {
        element.supplementalSemanticIds.forEach((ref: Reference, idx: number) => {
          checkReference(ref, `${path}.supplementalSemanticIds[${idx}]`);
        });
      }

      // Recursively check
      if (element.submodelElements) {
        element.submodelElements.forEach((child: any, idx: number) => {
          checkElement(child, `${path}.submodelElements[${idx}]`);
        });
      }
    }

    if (ctx.environment.submodels) {
      ctx.environment.submodels.forEach((sm, idx) => {
        checkElement(sm, `submodels[${idx}]`);
        if (sm.submodelElements) {
          sm.submodelElements.forEach((elem, elemIdx) => {
            checkElement(elem, `submodels[${idx}].submodelElements[${elemIdx}]`);
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-121: For References with type ModelReference, the last key must refer to a model element
 */
export const AASd_121: ValidationRule = {
  id: "AASd-121",
  name: "ModelReference Last Key Type",
  description: "ModelReference must have last key pointing to a model element type",
  severity: "error",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    const modelElementTypes = [
      "AssetAdministrationShell", "Submodel", "SubmodelElement",
      "Property", "MultiLanguageProperty", "Range", "ReferenceElement",
      "Blob", "File", "AnnotatedRelationshipElement", "RelationshipElement",
      "SubmodelElementCollection", "SubmodelElementList", "Entity",
      "BasicEventElement", "Operation", "Capability"
    ];

    function checkReference(ref: Reference | undefined, path: string): void {
      if (!ref || ref.type !== "ModelReference") return;
      if (!ref.keys || ref.keys.length === 0) return;

      const lastKey = ref.keys[ref.keys.length - 1];
      if (lastKey.type && !modelElementTypes.includes(lastKey.type)) {
        errors.push({
          path: `${path}.keys[${ref.keys.length - 1}].type`,
          message: `ModelReference last key type "${lastKey.type}" is not a model element type`,
          severity: "error",
          code: "AASd-121",
          suggestion: `Must be one of: ${modelElementTypes.join(", ")}`,
        });
      }
    }

    function checkElement(element: any, path: string): void {
      if (element.semanticId) {
        checkReference(element.semanticId, `${path}.semanticId`);
      }

      // Recursively check
      if (element.submodelElements) {
        element.submodelElements.forEach((child: any, idx: number) => {
          checkElement(child, `${path}.submodelElements[${idx}]`);
        });
      }
    }

    if (ctx.environment.assetAdministrationShells) {
      ctx.environment.assetAdministrationShells.forEach((aas, idx) => {
        if (aas.submodels) {
          aas.submodels.forEach((ref, refIdx) => {
            checkReference(ref, `assetAdministrationShells[${idx}].submodels[${refIdx}]`);
          });
        }
      });
    }

    if (ctx.environment.submodels) {
      ctx.environment.submodels.forEach((sm, idx) => {
        checkElement(sm, `submodels[${idx}]`);
      });
    }

    return errors;
  },
};

/**
 * AASd-130: MultiLanguageProperty values must have unique language codes
 */
export const AASd_130: ValidationRule = {
  id: "AASd-130",
  name: "MultiLanguageProperty Unique Languages",
  description: "Each language code in MultiLanguageProperty must appear only once",
  severity: "error",
  category: "datatype",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    function checkMultiLangProperty(element: any, path: string): void {
      if (element.modelType === "MultiLanguageProperty" && element.value) {
        const langCodes = new Set<string>();
        
        element.value.forEach((langString: any, idx: number) => {
          if (langString.language) {
            if (langCodes.has(langString.language)) {
              errors.push({
                path: `${path}.value[${idx}]`,
                message: `Duplicate language code "${langString.language}"`,
                severity: "error",
                code: "AASd-130",
                suggestion: "Each language code must appear only once",
              });
            } else {
              langCodes.add(langString.language);
            }
          }
        });
      }

      // Recursively check
      if (element.submodelElements) {
        element.submodelElements.forEach((child: any, idx: number) => {
          checkMultiLangProperty(child, `${path}.submodelElements[${idx}]`);
        });
      }
      if (element.value && Array.isArray(element.value) && element.modelType !== "MultiLanguageProperty") {
        element.value.forEach((child: any, idx: number) => {
          checkMultiLangProperty(child, `${path}.value[${idx}]`);
        });
      }
    }

    if (ctx.environment.submodels) {
      ctx.environment.submodels.forEach((sm, idx) => {
        if (sm.submodelElements) {
          sm.submodelElements.forEach((elem, elemIdx) => {
            checkMultiLangProperty(elem, `submodels[${idx}].submodelElements[${elemIdx}]`);
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-131: For Range, min <= max
 */
export const AASd_131: ValidationRule = {
  id: "AASd-131",
  name: "Range Min Max Constraint",
  description: "Range min value must be less than or equal to max value",
  severity: "error",
  category: "datatype",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    function checkRange(element: any, path: string): void {
      if (element.modelType === "Range") {
        if (element.min !== undefined && element.max !== undefined) {
          const min = parseFloat(element.min);
          const max = parseFloat(element.max);
          
          if (!isNaN(min) && !isNaN(max) && min > max) {
            errors.push({
              path,
              message: `Range min (${element.min}) is greater than max (${element.max})`,
              severity: "error",
              code: "AASd-131",
              suggestion: "Ensure min <= max",
            });
          }
        }
      }

      // Recursively check
      if (element.submodelElements) {
        element.submodelElements.forEach((child: any, idx: number) => {
          checkRange(child, `${path}.submodelElements[${idx}]`);
        });
      }
    }

    if (ctx.environment.submodels) {
      ctx.environment.submodels.forEach((sm, idx) => {
        if (sm.submodelElements) {
          sm.submodelElements.forEach((elem, elemIdx) => {
            checkRange(elem, `submodels[${idx}].submodelElements[${elemIdx}]`);
          });
        }
      });
    }

    return errors;
  },
};

// ============================================================================
// Export all constraint rules
// ============================================================================

export const AASdConstraints: ValidationRule[] = [
  AASd_002,
  AASd_021,
  AASd_022,
  AASd_051,
  AASd_116,
  AASd_118,
  AASd_119,
  AASd_120,
  AASd_121,
  AASd_130,
  AASd_131,
];
