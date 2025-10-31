/**
 * AAS V3.0 Reference Constraints (AASd-098 to AASd-129)
 *
 * Reference validation rules that ensure proper reference structure,
 * reference type consistency, and reference integrity.
 *
 * Reference: Details of the Asset Administration Shell - Part 1 V3.0
 */

import type {
  ValidationRule,
  ValidationContext,
  ValidationError,
} from "../validation-types";
import type {
  Environment,
  Reference,
} from "../aas-v3-types";
import {
  ReferenceTypes,
  KeyTypes,
} from "../aas-v3-types";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Traverse all references in the environment
 */
function traverseReferences(
  env: Environment,
  callback: (ref: Reference, path: string, element?: any) => void
): void {
  // Traverse AAS
  if (env.assetAdministrationShells) {
    env.assetAdministrationShells.forEach((aas, idx) => {
      const basePath = `assetAdministrationShells[${idx}]`;
      
      // Check submodel references
      if (aas.submodels) {
        aas.submodels.forEach((ref, refIdx) => {
          callback(ref, `${basePath}.submodels[${refIdx}]`, aas);
        });
      }

      // Check derivedFrom
      if (aas.derivedFrom) {
        callback(aas.derivedFrom, `${basePath}.derivedFrom`, aas);
      }
    });
  }

  // Traverse Submodels
  if (env.submodels) {
    env.submodels.forEach((sm, idx) => {
      const basePath = `submodels[${idx}]`;
      
      // Check semanticId
      if (sm.semanticId) {
        callback(sm.semanticId, `${basePath}.semanticId`, sm);
      }
      
      // Check supplementalSemanticIds
      if (sm.supplementalSemanticIds) {
        sm.supplementalSemanticIds.forEach((ref, refIdx) => {
          callback(ref, `${basePath}.supplementalSemanticIds[${refIdx}]`, sm);
        });
      }
      
      // Traverse submodel elements
      if (sm.submodelElements) {
        traverseSubmodelElementReferences(
          sm.submodelElements,
          `${basePath}.submodelElements`,
          callback
        );
      }
    });
  }

  // Traverse ConceptDescriptions
  if (env.conceptDescriptions) {
    env.conceptDescriptions.forEach((cd, idx) => {
      const basePath = `conceptDescriptions[${idx}]`;
      
      // Check isCaseOf
      if (cd.isCaseOf) {
        cd.isCaseOf.forEach((ref, refIdx) => {
          callback(ref, `${basePath}.isCaseOf[${refIdx}]`, cd);
        });
      }
    });
  }
}

/**
 * Traverse references in submodel elements recursively
 */
function traverseSubmodelElementReferences(
  elements: any[],
  basePath: string,
  callback: (ref: Reference, path: string, element?: any) => void
): void {
  elements.forEach((element, idx) => {
    const path = `${basePath}[${idx}]`;

    // Check semanticId
    if (element.semanticId) {
      callback(element.semanticId, `${path}.semanticId`, element);
    }
    
    // Check supplementalSemanticIds
    if (element.supplementalSemanticIds) {
      element.supplementalSemanticIds.forEach((ref: Reference, refIdx: number) => {
        callback(ref, `${path}.supplementalSemanticIds[${refIdx}]`, element);
      });
    }
    
    // Check ReferenceElement value
    if (element.modelType === "ReferenceElement" && element.value) {
      callback(element.value, `${path}.value`, element);
    }
    
    // Check RelationshipElement endpoints
    if (
      element.modelType === "RelationshipElement" ||
      element.modelType === "AnnotatedRelationshipElement"
    ) {
      if (element.first) {
        callback(element.first, `${path}.first`, element);
      }
      if (element.second) {
        callback(element.second, `${path}.second`, element);
      }
    }
    
    // Check Entity globalAssetId
    if (element.modelType === "Entity" && element.globalAssetId) {
      callback(element.globalAssetId, `${path}.globalAssetId`, element);
    }
    
    // Recursively traverse nested elements
    if (element.modelType === "SubmodelElementCollection" && element.value) {
      traverseSubmodelElementReferences(element.value, `${path}.value`, callback);
    }
    if (element.modelType === "SubmodelElementList" && element.value) {
      traverseSubmodelElementReferences(element.value, `${path}.value`, callback);
    }
    if (element.modelType === "Entity" && element.statements) {
      traverseSubmodelElementReferences(element.statements, `${path}.statements`, callback);
    }
    if (element.modelType === "AnnotatedRelationshipElement" && element.annotations) {
      traverseSubmodelElementReferences(element.annotations, `${path}.annotations`, callback);
    }
  });
}

/**
 * Check if a key type is valid
 */
function isValidKeyType(keyType: string): boolean {
  return Object.values(KeyTypes).includes(keyType as KeyTypes);
}

/**
 * Check if a reference type is valid
 */
function isValidReferenceType(refType: string): boolean {
  return Object.values(ReferenceTypes).includes(refType as ReferenceTypes);
}

/**
 * Check if a key type is a model element type
 */
function isModelElementType(keyType: string): boolean {
  const modelElementTypes = [
    "AssetAdministrationShell",
    "Submodel",
    "SubmodelElement",
    "Property",
    "MultiLanguageProperty",
    "Range",
    "ReferenceElement",
    "Blob",
    "File",
    "AnnotatedRelationshipElement",
    "RelationshipElement",
    "SubmodelElementCollection",
    "SubmodelElementList",
    "Entity",
    "BasicEventElement",
    "Operation",
    "Capability",
    "ConceptDescription",
  ];
  return modelElementTypes.includes(keyType);
}

/**
 * Check if a value looks like an external reference (URL or URN)
 */
function isExternalValue(value: string): boolean {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("urn:") ||
    value.startsWith("www.")
  );
}

// ============================================================================
// Reference Constraints (20 rules total)
// ============================================================================

/**
 * AASd-098: Reference type must be valid
 */
export const AASd_098: ValidationRule = {
  id: "AASd-098",
  name: "Reference Type Must Be Valid",
  description: "Reference type must be either ModelReference or ExternalReference",
  severity: "error",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseReferences(ctx.environment, (ref, path) => {
      if (!ref.type) {
        errors.push({
          path: `${path}.type`,
          message: "Reference must have type defined",
          severity: "error",
          code: "AASd-098",
          suggestion: "Set type to 'ModelReference' or 'ExternalReference'",
        });
      } else if (!isValidReferenceType(ref.type)) {
        errors.push({
          path: `${path}.type`,
          message: `Invalid reference type "${ref.type}"`,
          severity: "error",
          code: "AASd-098",
          suggestion: "Type must be 'ModelReference' or 'ExternalReference'",
        });
      }
    });

    return errors;
  },
};

/**
 * AASd-099: Key type must be valid
 */
export const AASd_099: ValidationRule = {
  id: "AASd-099",
  name: "Key Type Must Be Valid",
  description: "Key type must be a valid KeyType from the specification",
  severity: "error",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseReferences(ctx.environment, (ref, path) => {
      if (ref.keys) {
        ref.keys.forEach((key, keyIdx) => {
          if (!key.type) {
            errors.push({
              path: `${path}.keys[${keyIdx}].type`,
              message: "Key must have type defined",
              severity: "error",
              code: "AASd-099",
              suggestion: "Add a valid key type (e.g., 'Submodel', 'Property', 'GlobalReference')",
            });
          } else if (!isValidKeyType(key.type)) {
            errors.push({
              path: `${path}.keys[${keyIdx}].type`,
              message: `Invalid key type "${key.type}"`,
              severity: "error",
              code: "AASd-099",
              suggestion: `Must be a valid KeyType from the specification`,
            });
          }
        });
      }
    });

    return errors;
  },
};

/**
 * AASd-100: Key value must not be empty
 */
export const AASd_100: ValidationRule = {
  id: "AASd-100",
  name: "Key Value Must Not Be Empty",
  description: "Key value must be a non-empty string",
  severity: "error",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseReferences(ctx.environment, (ref, path) => {
      if (ref.keys) {
        ref.keys.forEach((key, keyIdx) => {
          if (!key.value || key.value.trim() === "") {
            errors.push({
              path: `${path}.keys[${keyIdx}].value`,
              message: "Key value must not be empty",
              severity: "error",
              code: "AASd-100",
              suggestion: "Provide a non-empty identifier value",
            });
          }
        });
      }
    });

    return errors;
  },
};

/**
 * AASd-101: GlobalReference for external references
 */
export const AASd_101: ValidationRule = {
  id: "AASd-101",
  name: "GlobalReference For External References",
  description: "External references (URLs, URNs) must use ExternalReference type",
  severity: "error",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseReferences(ctx.environment, (ref, path) => {
      if (ref.keys && ref.keys.length > 0) {
        const firstKey = ref.keys[0];
        if (firstKey.value && isExternalValue(firstKey.value)) {
          if (ref.type !== ReferenceTypes.ExternalReference) {
            errors.push({
              path: `${path}.type`,
              message: `External reference (${firstKey.value}) must have type 'ExternalReference'`,
              severity: "error",
              code: "AASd-101",
              suggestion: "Change type to 'ExternalReference' for URLs and URNs",
            });
          }
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-102: ModelReference for internal references
 */
export const AASd_102: ValidationRule = {
  id: "AASd-102",
  name: "ModelReference For Internal References",
  description: "Internal model references must use ModelReference type",
  severity: "error",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseReferences(ctx.environment, (ref, path) => {
      if (ref.keys && ref.keys.length > 0) {
        const firstKey = ref.keys[0];
        if (firstKey.value && !isExternalValue(firstKey.value) && isModelElementType(firstKey.type)) {
          if (ref.type !== ReferenceTypes.ModelReference) {
            errors.push({
              path: `${path}.type`,
              message: `Internal model reference must have type 'ModelReference'`,
              severity: "error",
              code: "AASd-102",
              suggestion: "Change type to 'ModelReference' for internal model elements",
            });
          }
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-103: Key type must match reference type
 */
export const AASd_103: ValidationRule = {
  id: "AASd-103",
  name: "Key Type Must Match Reference Type",
  description: "Key types must be consistent with the reference type",
  severity: "error",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseReferences(ctx.environment, (ref, path) => {
      if (ref.keys && ref.keys.length > 0) {
        ref.keys.forEach((key, keyIdx) => {
          if (ref.type === ReferenceTypes.ModelReference) {
            // ModelReference keys should be model element types
            if (key.type === "GlobalReference" || key.type === "FragmentReference") {
              errors.push({
                path: `${path}.keys[${keyIdx}].type`,
                message: `Key type "${key.type}" not allowed in ModelReference`,
                severity: "error",
                code: "AASd-103",
                suggestion: "Use model element types (e.g., Submodel, Property) in ModelReference",
              });
            }
          } else if (ref.type === ReferenceTypes.ExternalReference) {
            // ExternalReference should use GlobalReference or FragmentReference
            if (isModelElementType(key.type) && key.type !== "GlobalReference") {
              errors.push({
                path: `${path}.keys[${keyIdx}].type`,
                message: `Model element type "${key.type}" not typical in ExternalReference`,
                severity: "warning",
                code: "AASd-103",
                suggestion: "Consider using 'GlobalReference' for external references",
              });
            }
          }
        });
      }
    });

    return errors;
  },
};

/**
 * AASd-104: First key must be appropriate for reference type
 */
export const AASd_104: ValidationRule = {
  id: "AASd-104",
  name: "First Key Must Be Appropriate",
  description: "First key in reference must be appropriate for the reference type",
  severity: "error",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseReferences(ctx.environment, (ref, path) => {
      if (ref.keys && ref.keys.length > 0) {
        const firstKey = ref.keys[0];
        
        if (ref.type === ReferenceTypes.ModelReference) {
          // First key should be an Identifiable type
          const identifiableTypes = [
            "AssetAdministrationShell",
            "Submodel",
            "ConceptDescription",
          ];
          
          if (!identifiableTypes.includes(firstKey.type)) {
            errors.push({
              path: `${path}.keys[0].type`,
              message: `First key in ModelReference should be an Identifiable type, found "${firstKey.type}"`,
              severity: "warning",
              code: "AASd-104",
              suggestion: "First key should typically be AssetAdministrationShell, Submodel, or ConceptDescription",
            });
          }
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-105: Key chain must be valid
 */
export const AASd_105: ValidationRule = {
  id: "AASd-105",
  name: "Key Chain Must Be Valid",
  description: "Key chain must form a valid navigation path",
  severity: "error",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseReferences(ctx.environment, (ref, path) => {
      if (ref.keys && ref.keys.length > 1 && ref.type === ReferenceTypes.ModelReference) {
        // Check that keys form a valid hierarchy
        for (let i = 0; i < ref.keys.length - 1; i++) {
          const currentKey = ref.keys[i];
          const nextKey = ref.keys[i + 1];
          
          // Submodel can contain SubmodelElements
          if (currentKey.type === "Submodel") {
            if (!isModelElementType(nextKey.type) && nextKey.type !== "SubmodelElement") {
              errors.push({
                path: `${path}.keys[${i + 1}].type`,
                message: `Invalid key type "${nextKey.type}" after Submodel`,
                severity: "error",
                code: "AASd-105",
                suggestion: "After Submodel, use SubmodelElement types",
              });
            }
          }
          
          // SubmodelElementCollection/List can contain SubmodelElements
          if (
            currentKey.type === "SubmodelElementCollection" ||
            currentKey.type === "SubmodelElementList"
          ) {
            if (!isModelElementType(nextKey.type)) {
              errors.push({
                path: `${path}.keys[${i + 1}].type`,
                message: `Invalid key type "${nextKey.type}" after ${currentKey.type}`,
                severity: "error",
                code: "AASd-105",
                suggestion: "After collection/list, use SubmodelElement types",
              });
            }
          }
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-106: FragmentReference validation
 */
export const AASd_106: ValidationRule = {
  id: "AASd-106",
  name: "FragmentReference Validation",
  description: "FragmentReference must be used appropriately",
  severity: "warning",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseReferences(ctx.environment, (ref, path) => {
      if (ref.keys) {
        ref.keys.forEach((key, keyIdx) => {
          if (key.type === "FragmentReference") {
            // FragmentReference should typically be the last key
            if (keyIdx < ref.keys.length - 1) {
              errors.push({
                path: `${path}.keys[${keyIdx}]`,
                message: "FragmentReference should typically be the last key in the chain",
                severity: "warning",
                code: "AASd-106",
                suggestion: "FragmentReference is used for fragments within documents",
              });
            }
          }
        });
      }
    });

    return errors;
  },
};

/**
 * AASd-108: Reference integrity
 */
export const AASd_108: ValidationRule = {
  id: "AASd-108",
  name: "Reference Integrity",
  description: "Reference must have at least one key",
  severity: "error",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseReferences(ctx.environment, (ref, path) => {
      if (!ref.keys || ref.keys.length === 0) {
        errors.push({
          path: `${path}.keys`,
          message: "Reference must have at least one key",
          severity: "error",
          code: "AASd-108",
          suggestion: "Add at least one key to the reference",
        });
      }
    });

    return errors;
  },
};

/**
 * AASd-109: Circular reference detection
 */
export const AASd_109: ValidationRule = {
  id: "AASd-109",
  name: "Circular Reference Detection",
  description: "Detect potential circular references",
  severity: "warning",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];
    const referenceMap = new Map<string, Set<string>>();

    // Build reference map
    traverseReferences(ctx.environment, (ref, path, element) => {
      if (element && element.id && ref.keys && ref.keys.length > 0) {
        const sourceId = element.id;
        const targetId = ref.keys[ref.keys.length - 1].value;
        
        if (!referenceMap.has(sourceId)) {
          referenceMap.set(sourceId, new Set());
        }
        referenceMap.get(sourceId)!.add(targetId);
      }
    });

    // Check for circular references
    function hasCircularReference(
      id: string,
      visited: Set<string> = new Set()
    ): boolean {
      if (visited.has(id)) return true;
      visited.add(id);
      
      const targets = referenceMap.get(id);
      if (targets) {
        const targetArray = Array.from(targets);
        for (const target of targetArray) {
          if (hasCircularReference(target, new Set(visited))) {
            return true;
          }
        }
      }
      return false;
    }

    const entries = Array.from(referenceMap.entries());
    for (const [sourceId, targets] of entries) {
      if (hasCircularReference(sourceId)) {
        errors.push({
          path: "",
          message: `Potential circular reference detected involving element "${sourceId}"`,
          severity: "warning",
          code: "AASd-109",
          suggestion: "Review reference chains to avoid circular dependencies",
        });
      }
    }

    return errors;
  },
};

/**
 * AASd-110: Reference target must exist (for ModelReferences)
 */
export const AASd_110: ValidationRule = {
  id: "AASd-110",
  name: "Reference Target Must Exist",
  description: "ModelReference targets should exist in the environment",
  severity: "warning",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Build index of all identifiable elements
    const identifiables = new Map<string, any>();
    
    if (ctx.environment.assetAdministrationShells) {
      ctx.environment.assetAdministrationShells.forEach((aas) => {
        if (aas.id) identifiables.set(aas.id, aas);
      });
    }
    
    if (ctx.environment.submodels) {
      ctx.environment.submodels.forEach((sm) => {
        if (sm.id) identifiables.set(sm.id, sm);
      });
    }
    
    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd) => {
        if (cd.id) identifiables.set(cd.id, cd);
      });
    }

    traverseReferences(ctx.environment, (ref, path) => {
      if (ref.type === ReferenceTypes.ModelReference && ref.keys && ref.keys.length > 0) {
        const firstKey = ref.keys[0];
        
        // Check if the first key (Identifiable) exists
        if (
          firstKey.type === "AssetAdministrationShell" ||
          firstKey.type === "Submodel" ||
          firstKey.type === "ConceptDescription"
        ) {
          if (!identifiables.has(firstKey.value)) {
            errors.push({
              path: `${path}.keys[0].value`,
              message: `Referenced ${firstKey.type} "${firstKey.value}" not found in environment`,
              severity: "warning",
              code: "AASd-110",
              suggestion: "Ensure the referenced element exists or use ExternalReference",
            });
          }
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-111: Reference path validation
 */
export const AASd_111: ValidationRule = {
  id: "AASd-111",
  name: "Reference Path Validation",
  description: "Reference path must be logically consistent",
  severity: "warning",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseReferences(ctx.environment, (ref, path) => {
      if (ref.keys && ref.keys.length > 0) {
        // Check for duplicate keys in path
        const keyValues = ref.keys.map((k) => `${k.type}:${k.value}`);
        const uniqueKeys = new Set(keyValues);
        
        if (keyValues.length !== uniqueKeys.size) {
          errors.push({
            path: `${path}.keys`,
            message: "Reference path contains duplicate keys",
            severity: "warning",
            code: "AASd-111",
            suggestion: "Remove duplicate keys from the reference path",
          });
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-112: Key ordering validation
 */
export const AASd_112: ValidationRule = {
  id: "AASd-112",
  name: "Key Ordering Validation",
  description: "Keys must be ordered from general to specific",
  severity: "warning",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseReferences(ctx.environment, (ref, path) => {
      if (ref.keys && ref.keys.length > 1 && ref.type === ReferenceTypes.ModelReference) {
        // Check ordering: Identifiable types should come before Referable types
        let foundReferable = false;
        
        ref.keys.forEach((key, idx) => {
          const isIdentifiable = [
            "AssetAdministrationShell",
            "Submodel",
            "ConceptDescription",
          ].includes(key.type);
          
          if (foundReferable && isIdentifiable) {
            errors.push({
              path: `${path}.keys[${idx}]`,
              message: `Identifiable type "${key.type}" should come before Referable types`,
              severity: "warning",
              code: "AASd-112",
              suggestion: "Order keys from general (Identifiable) to specific (Referable)",
            });
          }
          
          if (!isIdentifiable) {
            foundReferable = true;
          }
        });
      }
    });

    return errors;
  },
};

/**
 * AASd-113: Reference type consistency
 */
export const AASd_113: ValidationRule = {
  id: "AASd-113",
  name: "Reference Type Consistency",
  description: "All keys in a reference should be consistent with the reference type",
  severity: "error",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseReferences(ctx.environment, (ref, path) => {
      if (ref.keys && ref.keys.length > 0) {
        const hasExternalKey = ref.keys.some((key) => 
          key.type === "GlobalReference" || isExternalValue(key.value)
        );
        const hasModelKey = ref.keys.some((key) => isModelElementType(key.type));
        
        if (hasExternalKey && hasModelKey) {
          errors.push({
            path: `${path}.keys`,
            message: "Reference mixes external and model keys",
            severity: "error",
            code: "AASd-113",
            suggestion: "Use either all external keys or all model keys, not both",
          });
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-115: Reference completeness
 */
export const AASd_115: ValidationRule = {
  id: "AASd-115",
  name: "Reference Completeness",
  description: "Reference should have all necessary keys for navigation",
  severity: "info",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseReferences(ctx.environment, (ref, path) => {
      if (ref.type === ReferenceTypes.ModelReference && ref.keys && ref.keys.length === 1) {
        const key = ref.keys[0];
        
        // Single-key references to SubmodelElements might be incomplete
        if (isModelElementType(key.type) && key.type !== "AssetAdministrationShell" && 
            key.type !== "Submodel" && key.type !== "ConceptDescription") {
          errors.push({
            path: `${path}.keys`,
            message: `Single-key reference to ${key.type} may be incomplete`,
            severity: "info",
            code: "AASd-115",
            suggestion: "Consider adding parent keys (Submodel) for complete navigation path",
          });
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-117: SemanticId reference validation
 */
export const AASd_117: ValidationRule = {
  id: "AASd-117",
  name: "SemanticId Reference Validation",
  description: "SemanticId should reference a ConceptDescription",
  severity: "warning",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Build index of ConceptDescriptions
    const conceptDescriptions = new Set<string>();
    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd) => {
        if (cd.id) conceptDescriptions.add(cd.id);
      });
    }

    function checkSemanticId(element: any, path: string): void {
      if (element.semanticId && element.semanticId.keys && element.semanticId.keys.length > 0) {
        const lastKey = element.semanticId.keys[element.semanticId.keys.length - 1];
        
        // SemanticId should point to ConceptDescription
        if (element.semanticId.type === ReferenceTypes.ModelReference) {
          if (lastKey.type !== "ConceptDescription" && lastKey.type !== "GlobalReference") {
            errors.push({
              path: `${path}.semanticId.keys[${element.semanticId.keys.length - 1}].type`,
              message: `SemanticId should reference ConceptDescription, found "${lastKey.type}"`,
              severity: "warning",
              code: "AASd-117",
              suggestion: "SemanticId typically references a ConceptDescription",
            });
          }
          
          // Check if ConceptDescription exists
          if (lastKey.type === "ConceptDescription" && !conceptDescriptions.has(lastKey.value)) {
            errors.push({
              path: `${path}.semanticId.keys[${element.semanticId.keys.length - 1}].value`,
              message: `Referenced ConceptDescription "${lastKey.value}" not found`,
              severity: "info",
              code: "AASd-117",
              suggestion: "Ensure the ConceptDescription exists in the environment",
            });
          }
        }
      }
    }

    // Helper function to traverse elements
    const traverseElementsForSemanticId = (elements: any[], basePath: string): void => {
      elements.forEach((elem, elemIdx) => {
        const elemPath = `${basePath}[${elemIdx}]`;
        checkSemanticId(elem, elemPath);
        
        if (elem.value && Array.isArray(elem.value)) {
          traverseElementsForSemanticId(elem.value, `${elemPath}.value`);
        }
        if (elem.submodelElements && Array.isArray(elem.submodelElements)) {
          traverseElementsForSemanticId(elem.submodelElements, `${elemPath}.submodelElements`);
        }
      });
    };

    // Check all elements with semanticId
    if (ctx.environment.submodels) {
      ctx.environment.submodels.forEach((sm, idx) => {
        checkSemanticId(sm, `submodels[${idx}]`);
        
        if (sm.submodelElements) {
          traverseElementsForSemanticId(sm.submodelElements, `submodels[${idx}].submodelElements`);
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-122: Reference key must have valid identifier format
 */
export const AASd_122: ValidationRule = {
  id: "AASd-122",
  name: "Reference Key Valid Identifier Format",
  description: "Reference key values should follow valid identifier format",
  severity: "warning",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseReferences(ctx.environment, (ref, path) => {
      if (ref.keys) {
        ref.keys.forEach((key, keyIdx) => {
          if (key.value && !isExternalValue(key.value)) {
            // Check for common identifier issues
            if (key.value.includes(" ")) {
              errors.push({
                path: `${path}.keys[${keyIdx}].value`,
                message: `Key value "${key.value}" contains spaces`,
                severity: "warning",
                code: "AASd-122",
                suggestion: "Consider using identifiers without spaces",
              });
            }
            
            // Check for very short identifiers
            if (key.value.length < 3) {
              errors.push({
                path: `${path}.keys[${keyIdx}].value`,
                message: `Key value "${key.value}" is very short`,
                severity: "info",
                code: "AASd-122",
                suggestion: "Consider using more descriptive identifiers",
              });
            }
          }
        });
      }
    });

    return errors;
  },
};

/**
 * AASd-123: Reference must not be self-referential
 */
export const AASd_123: ValidationRule = {
  id: "AASd-123",
  name: "Reference Must Not Be Self-Referential",
  description: "Element should not reference itself",
  severity: "warning",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseReferences(ctx.environment, (ref, path, element) => {
      if (element && element.id && ref.keys && ref.keys.length > 0) {
        const lastKey = ref.keys[ref.keys.length - 1];
        
        if (lastKey.value === element.id) {
          errors.push({
            path,
            message: `Element "${element.id}" references itself`,
            severity: "warning",
            code: "AASd-123",
            suggestion: "Avoid self-referential references",
          });
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-124: Reference key chain depth validation
 */
export const AASd_124: ValidationRule = {
  id: "AASd-124",
  name: "Reference Key Chain Depth Validation",
  description: "Reference key chain should not be excessively deep",
  severity: "info",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];
    const MAX_DEPTH = 10;

    traverseReferences(ctx.environment, (ref, path) => {
      if (ref.keys && ref.keys.length > MAX_DEPTH) {
        errors.push({
          path: `${path}.keys`,
          message: `Reference has ${ref.keys.length} keys (max recommended: ${MAX_DEPTH})`,
          severity: "info",
          code: "AASd-124",
          suggestion: "Consider simplifying the reference path",
        });
      }
    });

    return errors;
  },
};

/**
 * AASd-125: External reference URL validation
 */
export const AASd_125: ValidationRule = {
  id: "AASd-125",
  name: "External Reference URL Validation",
  description: "External reference URLs should be well-formed",
  severity: "warning",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseReferences(ctx.environment, (ref, path) => {
      if (ref.type === ReferenceTypes.ExternalReference && ref.keys && ref.keys.length > 0) {
        const firstKey = ref.keys[0];
        
        if (firstKey.value) {
          // Basic URL validation
          if (firstKey.value.startsWith("http://") || firstKey.value.startsWith("https://")) {
            try {
              new URL(firstKey.value);
            } catch {
              errors.push({
                path: `${path}.keys[0].value`,
                message: `Invalid URL format: "${firstKey.value}"`,
                severity: "warning",
                code: "AASd-125",
                suggestion: "Ensure URL is well-formed",
              });
            }
          }
          
          // URN validation
          if (firstKey.value.startsWith("urn:")) {
            if (!firstKey.value.match(/^urn:[a-z0-9][a-z0-9-]{0,31}:[a-z0-9()+,\-.:=@;$_!*'%/?#]+$/i)) {
              errors.push({
                path: `${path}.keys[0].value`,
                message: `Invalid URN format: "${firstKey.value}"`,
                severity: "warning",
                code: "AASd-125",
                suggestion: "Ensure URN follows RFC 8141 format",
              });
            }
          }
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-126: Reference referred semantic ID validation
 */
export const AASd_126: ValidationRule = {
  id: "AASd-126",
  name: "Reference Referred Semantic ID Validation",
  description: "ReferredSemanticId should be used appropriately",
  severity: "info",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseReferences(ctx.environment, (ref, path) => {
      if (ref.referredSemanticId) {
        // ReferredSemanticId should also be a valid reference
        if (!ref.referredSemanticId.keys || ref.referredSemanticId.keys.length === 0) {
          errors.push({
            path: `${path}.referredSemanticId`,
            message: "ReferredSemanticId must have at least one key",
            severity: "error",
            code: "AASd-126",
            suggestion: "Add keys to the referredSemanticId",
          });
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-127: Model reference last key validation
 */
export const AASd_127: ValidationRule = {
  id: "AASd-127",
  name: "Model Reference Last Key Validation",
  description: "Last key in ModelReference should be the target element type",
  severity: "warning",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseReferences(ctx.environment, (ref, path) => {
      if (ref.type === ReferenceTypes.ModelReference && ref.keys && ref.keys.length > 0) {
        const lastKey = ref.keys[ref.keys.length - 1];
        
        // Last key should be a specific element type, not a generic type
        if (lastKey.type === "SubmodelElement" || lastKey.type === "Referable" || 
            lastKey.type === "Identifiable") {
          errors.push({
            path: `${path}.keys[${ref.keys.length - 1}].type`,
            message: `Last key uses generic type "${lastKey.type}"`,
            severity: "warning",
            code: "AASd-127",
            suggestion: "Use specific element type (e.g., Property, Range) instead of generic types",
          });
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-128: Reference key value format consistency
 */
export const AASd_128: ValidationRule = {
  id: "AASd-128",
  name: "Reference Key Value Format Consistency",
  description: "Reference key values should follow consistent format",
  severity: "info",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseReferences(ctx.environment, (ref, path) => {
      if (ref.keys && ref.keys.length > 1) {
        // Check if all keys use similar identifier format
        const formats = ref.keys.map((key) => {
          if (isExternalValue(key.value)) return "external";
          if (key.value.includes(":")) return "namespaced";
          if (key.value.match(/^[a-zA-Z][a-zA-Z0-9_]*$/)) return "camelCase";
          return "other";
        });
        
        const uniqueFormats = new Set(formats);
        if (uniqueFormats.size > 1 && !uniqueFormats.has("external")) {
          errors.push({
            path: `${path}.keys`,
            message: "Reference keys use inconsistent identifier formats",
            severity: "info",
            code: "AASd-128",
            suggestion: "Consider using consistent identifier format across all keys",
          });
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-129: Reference documentation completeness
 */
export const AASd_129: ValidationRule = {
  id: "AASd-129",
  name: "Reference Documentation Completeness",
  description: "Complex references should have documentation",
  severity: "info",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseReferences(ctx.environment, (ref, path, element) => {
      // If reference has more than 3 keys and element has no description
      if (ref.keys && ref.keys.length > 3) {
        if (element && (!element.description || element.description.length === 0)) {
          errors.push({
            path: path.replace(/\.(semanticId|supplementalSemanticIds.*|value|first|second|globalAssetId)$/, ""),
            message: "Complex reference without element description",
            severity: "info",
            code: "AASd-129",
            suggestion: "Add description to document the purpose of this complex reference",
          });
        }
      }
    });

    return errors;
  },
};

// ============================================================================
// Export all reference constraints
// ============================================================================

export const AASdReferenceConstraints: ValidationRule[] = [
  AASd_098,
  AASd_099,
  AASd_100,
  AASd_101,
  AASd_102,
  AASd_103,
  AASd_104,
  AASd_105,
  AASd_106,
  AASd_108,
  AASd_109,
  AASd_110,
  AASd_111,
  AASd_112,
  AASd_113,
  AASd_115,
  AASd_117,
  AASd_122,
  AASd_123,
  AASd_124,
  AASd_125,
  AASd_126,
  AASd_127,
  AASd_128,
  AASd_129,
];
