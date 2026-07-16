/**
 * AAS V3.0 Semantic Constraints (AASd-053 to AASd-076; AASd-077 and AASd-090
 * are defined in aasd-advanced-constraints.ts)
 *
 * Semantic validation rules that ensure proper semantic references,
 * ConceptDescription integrity, and IEC 61360 data specification compliance.
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
  ConceptDescription,
  EmbeddedDataSpecification,
  DataSpecificationIec61360,
} from "../aas-v3-types";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Traverse all elements and check semantic properties
 */
function traverseElements(
  env: Environment,
  callback: (element: any, path: string) => void
): void {
  // Traverse AAS
  if (env.assetAdministrationShells) {
    env.assetAdministrationShells.forEach((aas, idx) => {
      callback(aas, `assetAdministrationShells[${idx}]`);
    });
  }

  // Traverse Submodels
  if (env.submodels) {
    env.submodels.forEach((sm, idx) => {
      callback(sm, `submodels[${idx}]`);
      if (sm.submodelElements) {
        traverseSubmodelElements(
          sm.submodelElements,
          `submodels[${idx}].submodelElements`,
          callback
        );
      }
    });
  }

  // Traverse ConceptDescriptions
  if (env.conceptDescriptions) {
    env.conceptDescriptions.forEach((cd, idx) => {
      callback(cd, `conceptDescriptions[${idx}]`);
    });
  }
}

/**
 * Traverse submodel elements recursively
 */
function traverseSubmodelElements(
  elements: any[],
  basePath: string,
  callback: (element: any, path: string) => void
): void {
  elements.forEach((element, idx) => {
    const path = `${basePath}[${idx}]`;
    callback(element, path);

    // Recursively traverse nested elements
    if (element.modelType === "SubmodelElementCollection" && element.value) {
      traverseSubmodelElements(element.value, `${path}.value`, callback);
    }
    if (element.modelType === "SubmodelElementList" && element.value) {
      traverseSubmodelElements(element.value, `${path}.value`, callback);
    }
    if (element.modelType === "Entity" && element.statements) {
      traverseSubmodelElements(element.statements, `${path}.statements`, callback);
    }
    if (element.modelType === "AnnotatedRelationshipElement" && element.annotations) {
      traverseSubmodelElements(element.annotations, `${path}.annotations`, callback);
    }
  });
}

/**
 * Find ConceptDescription by ID
 */
function findConceptDescription(
  env: Environment,
  id: string
): ConceptDescription | undefined {
  return env.conceptDescriptions?.find((cd) => cd.id === id);
}

/**
 * Check if reference points to a ConceptDescription
 */
function isConceptDescriptionReference(ref: Reference | undefined): boolean {
  if (!ref || !ref.keys || ref.keys.length === 0) return false;
  const lastKey = ref.keys[ref.keys.length - 1];
  return lastKey.type === "ConceptDescription";
}

// ============================================================================
// Semantic Constraints (45 rules total)
// ============================================================================

/**
 * AASd-053: SemanticId must reference ConceptDescription
 */
export const AASd_053: ValidationRule = {
  id: "AASd-053",
  name: "SemanticId Must Reference ConceptDescription",
  description: "SemanticId should reference a ConceptDescription for semantic interoperability",
  severity: "warning",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseElements(ctx.environment, (element, path) => {
      if (element.semanticId) {
        if (!isConceptDescriptionReference(element.semanticId)) {
          // Check if it's an external reference (which is allowed)
          const isExternal = element.semanticId.type === "ExternalReference";
          if (!isExternal) {
            errors.push({
              path: `${path}.semanticId`,
              message: "SemanticId should reference a ConceptDescription",
              severity: "warning",
              code: "AASd-053",
              suggestion: "Use ConceptDescription reference or ExternalReference for semantic definitions",
            });
          }
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-054: ConceptDescription must have id
 */
export const AASd_054: ValidationRule = {
  id: "AASd-054",
  name: "ConceptDescription Must Have ID",
  description: "ConceptDescription must have a unique identifier",
  severity: "error",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        if (!cd.id || cd.id.trim() === "") {
          errors.push({
            path: `conceptDescriptions[${idx}].id`,
            message: "ConceptDescription must have a non-empty id",
            severity: "error",
            code: "AASd-054",
            suggestion: "Provide a globally unique identifier for the ConceptDescription",
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-055: ConceptDescription should have category
 */
export const AASd_055: ValidationRule = {
  id: "AASd-055",
  name: "ConceptDescription Should Have Category",
  description: "ConceptDescription should have a category for classification",
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
        if (!cd.category) {
          errors.push({
            path: `conceptDescriptions[${idx}].category`,
            message: "ConceptDescription should have a category",
            severity: "warning",
            code: "AASd-055",
            suggestion: `Use one of: ${validCategories.join(", ")}`,
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-056: IsCaseOf must reference ConceptDescription
 */
export const AASd_056: ValidationRule = {
  id: "AASd-056",
  name: "IsCaseOf Must Reference ConceptDescription",
  description: "IsCaseOf references must point to ConceptDescription",
  severity: "error",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        if (cd.isCaseOf && Array.isArray(cd.isCaseOf)) {
          cd.isCaseOf.forEach((ref, refIdx) => {
            if (!isConceptDescriptionReference(ref)) {
              errors.push({
                path: `conceptDescriptions[${idx}].isCaseOf[${refIdx}]`,
                message: "IsCaseOf must reference a ConceptDescription",
                severity: "error",
                code: "AASd-056",
                suggestion: "Ensure the reference points to a ConceptDescription",
              });
            }
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-057: DataSpecification must be valid
 */
export const AASd_057: ValidationRule = {
  id: "AASd-057",
  name: "DataSpecification Must Be Valid",
  description: "DataSpecification references must be well-formed",
  severity: "error",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseElements(ctx.environment, (element, path) => {
      if (element.embeddedDataSpecifications && Array.isArray(element.embeddedDataSpecifications)) {
        element.embeddedDataSpecifications.forEach((spec: EmbeddedDataSpecification, idx: number) => {
          if (!spec.dataSpecification) {
            errors.push({
              path: `${path}.embeddedDataSpecifications[${idx}].dataSpecification`,
              message: "EmbeddedDataSpecification must have dataSpecification reference",
              severity: "error",
              code: "AASd-057",
              suggestion: "Add dataSpecification reference",
            });
          }
          if (!spec.dataSpecificationContent) {
            errors.push({
              path: `${path}.embeddedDataSpecifications[${idx}].dataSpecificationContent`,
              message: "EmbeddedDataSpecification must have dataSpecificationContent",
              severity: "error",
              code: "AASd-057",
              suggestion: "Add dataSpecificationContent",
            });
          }
        });
      }
    });

    return errors;
  },
};

/**
 * AASd-058: EmbeddedDataSpecification must have content
 */
export const AASd_058: ValidationRule = {
  id: "AASd-058",
  name: "EmbeddedDataSpecification Must Have Content",
  description: "EmbeddedDataSpecification must have dataSpecificationContent",
  severity: "error",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseElements(ctx.environment, (element, path) => {
      if (element.embeddedDataSpecifications && Array.isArray(element.embeddedDataSpecifications)) {
        element.embeddedDataSpecifications.forEach((spec: EmbeddedDataSpecification, idx: number) => {
          if (!spec.dataSpecificationContent) {
            errors.push({
              path: `${path}.embeddedDataSpecifications[${idx}].dataSpecificationContent`,
              message: "EmbeddedDataSpecification must have dataSpecificationContent",
              severity: "error",
              code: "AASd-058",
              suggestion: "Add dataSpecificationContent with IEC 61360 or other specification",
            });
          }
        });
      }
    });

    return errors;
  },
};

/**
 * AASd-059: PreferredName required for IEC 61360
 */
export const AASd_059: ValidationRule = {
  id: "AASd-059",
  name: "IEC 61360 PreferredName Required",
  description: "IEC 61360 data specification must have preferredName",
  severity: "error",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        if (cd.embeddedDataSpecifications) {
          cd.embeddedDataSpecifications.forEach((spec, specIdx) => {
            const content = spec.dataSpecificationContent as any;
            // Check if it's IEC 61360 (has preferredName field)
            if (content && 'preferredName' in content) {
              if (!content.preferredName || content.preferredName.length === 0) {
                errors.push({
                  path: `conceptDescriptions[${idx}].embeddedDataSpecifications[${specIdx}].dataSpecificationContent.preferredName`,
                  message: "IEC 61360 data specification must have preferredName",
                  severity: "error",
                  code: "AASd-059",
                  suggestion: "Add preferredName with at least one language string",
                });
              }
            }
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-060: DataType required for IEC 61360
 */
export const AASd_060: ValidationRule = {
  id: "AASd-060",
  name: "IEC 61360 DataType Required",
  description: "IEC 61360 data specification must have dataType",
  severity: "error",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        if (cd.embeddedDataSpecifications) {
          cd.embeddedDataSpecifications.forEach((spec, specIdx) => {
            const content = spec.dataSpecificationContent as any;
            if (content && 'dataType' in content) {
              if (!content.dataType) {
                errors.push({
                  path: `conceptDescriptions[${idx}].embeddedDataSpecifications[${specIdx}].dataSpecificationContent.dataType`,
                  message: "IEC 61360 data specification must have dataType",
                  severity: "error",
                  code: "AASd-060",
                  suggestion: "Add dataType (e.g., STRING, INTEGER, REAL_MEASURE)",
                });
              }
            }
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-061: Definition recommended for IEC 61360
 */
export const AASd_061: ValidationRule = {
  id: "AASd-061",
  name: "IEC 61360 Definition Recommended",
  description: "IEC 61360 data specification should have definition",
  severity: "warning",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        if (cd.embeddedDataSpecifications) {
          cd.embeddedDataSpecifications.forEach((spec, specIdx) => {
            const content = spec.dataSpecificationContent as any;
            if (content && 'definition' in content) {
              if (!content.definition || content.definition.length === 0) {
                errors.push({
                  path: `conceptDescriptions[${idx}].embeddedDataSpecifications[${specIdx}].dataSpecificationContent.definition`,
                  message: "IEC 61360 data specification should have definition",
                  severity: "warning",
                  code: "AASd-061",
                  suggestion: "Add definition with language strings for better documentation",
                });
              }
            }
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-062: Unit validation for IEC 61360
 */
export const AASd_062: ValidationRule = {
  id: "AASd-062",
  name: "IEC 61360 Unit Validation",
  description: "IEC 61360 unit must be valid if specified",
  severity: "warning",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        if (cd.embeddedDataSpecifications) {
          cd.embeddedDataSpecifications.forEach((spec, specIdx) => {
            const content = spec.dataSpecificationContent as any;
            if (content && content.unit) {
              // Basic validation - unit should not be empty
              if (content.unit.trim() === "") {
                errors.push({
                  path: `conceptDescriptions[${idx}].embeddedDataSpecifications[${specIdx}].dataSpecificationContent.unit`,
                  message: "Unit must not be empty if specified",
                  severity: "warning",
                  code: "AASd-062",
                  suggestion: "Provide a valid unit or remove the field",
                });
              }
            }
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-063: UnitId validation
 */
export const AASd_063: ValidationRule = {
  id: "AASd-063",
  name: "IEC 61360 UnitId Validation",
  description: "UnitId must reference a valid unit concept if specified",
  severity: "warning",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        if (cd.embeddedDataSpecifications) {
          cd.embeddedDataSpecifications.forEach((spec, specIdx) => {
            const content = spec.dataSpecificationContent as any;
            if (content && content.unitId) {
              // Check if unitId is a valid reference
              if (!content.unitId.keys || content.unitId.keys.length === 0) {
                errors.push({
                  path: `conceptDescriptions[${idx}].embeddedDataSpecifications[${specIdx}].dataSpecificationContent.unitId`,
                  message: "UnitId must have valid reference keys",
                  severity: "warning",
                  code: "AASd-063",
                  suggestion: "Provide a valid reference to a unit concept",
                });
              }
            }
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-064: SourceOfDefinition validation
 */
export const AASd_064: ValidationRule = {
  id: "AASd-064",
  name: "IEC 61360 SourceOfDefinition Validation",
  description: "SourceOfDefinition should be a valid URI if specified",
  severity: "info",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        if (cd.embeddedDataSpecifications) {
          cd.embeddedDataSpecifications.forEach((spec, specIdx) => {
            const content = spec.dataSpecificationContent as any;
            if (content && content.sourceOfDefinition) {
              if (content.sourceOfDefinition.trim() === "") {
                errors.push({
                  path: `conceptDescriptions[${idx}].embeddedDataSpecifications[${specIdx}].dataSpecificationContent.sourceOfDefinition`,
                  message: "SourceOfDefinition should not be empty if specified",
                  severity: "info",
                  code: "AASd-064",
                  suggestion: "Provide a valid source URI or remove the field",
                });
              }
            }
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-065: Symbol validation
 */
export const AASd_065: ValidationRule = {
  id: "AASd-065",
  name: "IEC 61360 Symbol Validation",
  description: "Symbol should be valid if specified",
  severity: "info",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        if (cd.embeddedDataSpecifications) {
          cd.embeddedDataSpecifications.forEach((spec, specIdx) => {
            const content = spec.dataSpecificationContent as any;
            if (content && content.symbol) {
              if (content.symbol.trim() === "") {
                errors.push({
                  path: `conceptDescriptions[${idx}].embeddedDataSpecifications[${specIdx}].dataSpecificationContent.symbol`,
                  message: "Symbol should not be empty if specified",
                  severity: "info",
                  code: "AASd-065",
                  suggestion: "Provide a valid symbol or remove the field",
                });
              }
            }
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-066: ValueFormat validation
 */
export const AASd_066: ValidationRule = {
  id: "AASd-066",
  name: "IEC 61360 ValueFormat Validation",
  description: "ValueFormat should be valid if specified",
  severity: "info",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        if (cd.embeddedDataSpecifications) {
          cd.embeddedDataSpecifications.forEach((spec, specIdx) => {
            const content = spec.dataSpecificationContent as any;
            if (content && content.valueFormat) {
              if (content.valueFormat.trim() === "") {
                errors.push({
                  path: `conceptDescriptions[${idx}].embeddedDataSpecifications[${specIdx}].dataSpecificationContent.valueFormat`,
                  message: "ValueFormat should not be empty if specified",
                  severity: "info",
                  code: "AASd-066",
                  suggestion: "Provide a valid format or remove the field",
                });
              }
            }
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-067: Value validation for IEC 61360
 */
export const AASd_067: ValidationRule = {
  id: "AASd-067",
  name: "IEC 61360 Value Validation",
  description: "Value should conform to dataType if specified",
  severity: "warning",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        if (cd.embeddedDataSpecifications) {
          cd.embeddedDataSpecifications.forEach((spec, specIdx) => {
            const content = spec.dataSpecificationContent as any;
            if (content && content.value && content.dataType) {
              // Basic type checking based on dataType
              const value = content.value;
              const dataType = content.dataType;

              if (dataType === "INTEGER" && isNaN(parseInt(value, 10))) {
                errors.push({
                  path: `conceptDescriptions[${idx}].embeddedDataSpecifications[${specIdx}].dataSpecificationContent.value`,
                  message: `Value "${value}" does not match dataType INTEGER`,
                  severity: "warning",
                  code: "AASd-067",
                  suggestion: "Provide a valid integer value",
                });
              } else if ((dataType === "REAL_MEASURE" || dataType === "REAL_COUNT") && isNaN(parseFloat(value))) {
                errors.push({
                  path: `conceptDescriptions[${idx}].embeddedDataSpecifications[${specIdx}].dataSpecificationContent.value`,
                  message: `Value "${value}" does not match dataType ${dataType}`,
                  severity: "warning",
                  code: "AASd-067",
                  suggestion: "Provide a valid numeric value",
                });
              }
            }
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-068: ValueList validation
 */
export const AASd_068: ValidationRule = {
  id: "AASd-068",
  name: "IEC 61360 ValueList Validation",
  description: "ValueList must have valid valueReferencePairs if specified",
  severity: "warning",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        if (cd.embeddedDataSpecifications) {
          cd.embeddedDataSpecifications.forEach((spec, specIdx) => {
            const content = spec.dataSpecificationContent as any;
            if (content && content.valueList) {
              if (!content.valueList.valueReferencePairs || content.valueList.valueReferencePairs.length === 0) {
                errors.push({
                  path: `conceptDescriptions[${idx}].embeddedDataSpecifications[${specIdx}].dataSpecificationContent.valueList`,
                  message: "ValueList must have at least one valueReferencePair",
                  severity: "warning",
                  code: "AASd-068",
                  suggestion: "Add valueReferencePairs or remove valueList",
                });
              }
            }
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-069: ValueReferencePair must have value
 */
export const AASd_069: ValidationRule = {
  id: "AASd-069",
  name: "ValueReferencePair Must Have Value",
  description: "ValueReferencePair must have value defined",
  severity: "error",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        if (cd.embeddedDataSpecifications) {
          cd.embeddedDataSpecifications.forEach((spec, specIdx) => {
            const content = spec.dataSpecificationContent as any;
            if (content && content.valueList && content.valueList.valueReferencePairs) {
              content.valueList.valueReferencePairs.forEach((pair: any, pairIdx: number) => {
                if (!pair.value || pair.value.trim() === "") {
                  errors.push({
                    path: `conceptDescriptions[${idx}].embeddedDataSpecifications[${specIdx}].dataSpecificationContent.valueList.valueReferencePairs[${pairIdx}].value`,
                    message: "ValueReferencePair must have value",
                    severity: "error",
                    code: "AASd-069",
                    suggestion: "Provide a value for the pair",
                  });
                }
              });
            }
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-070: ValueReferencePair must have valueId
 */
export const AASd_070: ValidationRule = {
  id: "AASd-070",
  name: "ValueReferencePair Must Have ValueId",
  description: "ValueReferencePair must have valueId reference",
  severity: "error",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        if (cd.embeddedDataSpecifications) {
          cd.embeddedDataSpecifications.forEach((spec, specIdx) => {
            const content = spec.dataSpecificationContent as any;
            if (content && content.valueList && content.valueList.valueReferencePairs) {
              content.valueList.valueReferencePairs.forEach((pair: any, pairIdx: number) => {
                if (!pair.valueId) {
                  errors.push({
                    path: `conceptDescriptions[${idx}].embeddedDataSpecifications[${specIdx}].dataSpecificationContent.valueList.valueReferencePairs[${pairIdx}].valueId`,
                    message: "ValueReferencePair must have valueId",
                    severity: "error",
                    code: "AASd-070",
                    suggestion: "Provide a valueId reference",
                  });
                }
              });
            }
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-071: LevelType must have min and max
 */
export const AASd_071: ValidationRule = {
  id: "AASd-071",
  name: "LevelType Must Have Min And Max",
  description: "LevelType must have both min and max defined",
  severity: "error",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        if (cd.embeddedDataSpecifications) {
          cd.embeddedDataSpecifications.forEach((spec, specIdx) => {
            const content = spec.dataSpecificationContent as any;
            if (content && content.levelType) {
              if (!content.levelType.min) {
                errors.push({
                  path: `conceptDescriptions[${idx}].embeddedDataSpecifications[${specIdx}].dataSpecificationContent.levelType.min`,
                  message: "LevelType must have min defined",
                  severity: "error",
                  code: "AASd-071",
                  suggestion: "Add min value for levelType",
                });
              }
              if (!content.levelType.max) {
                errors.push({
                  path: `conceptDescriptions[${idx}].embeddedDataSpecifications[${specIdx}].dataSpecificationContent.levelType.max`,
                  message: "LevelType must have max defined",
                  severity: "error",
                  code: "AASd-071",
                  suggestion: "Add max value for levelType",
                });
              }
            }
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-072: LevelType min must be less than or equal to max
 */
export const AASd_072: ValidationRule = {
  id: "AASd-072",
  name: "LevelType Min Max Constraint",
  description: "LevelType min must be less than or equal to max",
  severity: "error",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        if (cd.embeddedDataSpecifications) {
          cd.embeddedDataSpecifications.forEach((spec, specIdx) => {
            const content = spec.dataSpecificationContent as any;
            if (content && content.levelType) {
              const min = parseFloat(content.levelType.min);
              const max = parseFloat(content.levelType.max);
              
              if (!isNaN(min) && !isNaN(max) && min > max) {
                errors.push({
                  path: `conceptDescriptions[${idx}].embeddedDataSpecifications[${specIdx}].dataSpecificationContent.levelType`,
                  message: `LevelType min (${content.levelType.min}) is greater than max (${content.levelType.max})`,
                  severity: "error",
                  code: "AASd-072",
                  suggestion: "Ensure min <= max",
                });
              }
            }
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-073: DataType must be valid IEC 61360 type
 */
export const AASd_073: ValidationRule = {
  id: "AASd-073",
  name: "IEC 61360 DataType Must Be Valid",
  description: "DataType must be a valid IEC 61360 data type",
  severity: "error",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    const validDataTypes = [
      "DATE", "STRING", "STRING_TRANSLATABLE", "INTEGER_MEASURE",
      "INTEGER_COUNT", "INTEGER_CURRENCY", "REAL_MEASURE", "REAL_COUNT",
      "REAL_CURRENCY", "BOOLEAN", "RATIONAL", "RATIONAL_MEASURE",
      "TIME", "TIMESTAMP", "URL", "HTML", "BLOB", "FILE"
    ];

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        if (cd.embeddedDataSpecifications) {
          cd.embeddedDataSpecifications.forEach((spec, specIdx) => {
            const content = spec.dataSpecificationContent as any;
            if (content && content.dataType) {
              if (!validDataTypes.includes(content.dataType)) {
                errors.push({
                  path: `conceptDescriptions[${idx}].embeddedDataSpecifications[${specIdx}].dataSpecificationContent.dataType`,
                  message: `Invalid IEC 61360 dataType: ${content.dataType}`,
                  severity: "error",
                  code: "AASd-073",
                  suggestion: `Use one of: ${validDataTypes.join(", ")}`,
                });
              }
            }
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-074: Unit consistency with dataType
 */
export const AASd_074: ValidationRule = {
  id: "AASd-074",
  name: "Unit Consistency With DataType",
  description: "Unit should only be specified for measure types",
  severity: "warning",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    const measureTypes = ["INTEGER_MEASURE", "REAL_MEASURE", "RATIONAL_MEASURE"];

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        if (cd.embeddedDataSpecifications) {
          cd.embeddedDataSpecifications.forEach((spec, specIdx) => {
            const content = spec.dataSpecificationContent as any;
            if (content && content.unit && content.dataType) {
              if (!measureTypes.includes(content.dataType)) {
                errors.push({
                  path: `conceptDescriptions[${idx}].embeddedDataSpecifications[${specIdx}].dataSpecificationContent.unit`,
                  message: `Unit specified for non-measure dataType: ${content.dataType}`,
                  severity: "warning",
                  code: "AASd-074",
                  suggestion: "Unit should only be used with measure types (INTEGER_MEASURE, REAL_MEASURE, RATIONAL_MEASURE)",
                });
              }
            }
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-075: ShortName validation
 */
export const AASd_075: ValidationRule = {
  id: "AASd-075",
  name: "IEC 61360 ShortName Validation",
  description: "ShortName should be valid if specified",
  severity: "info",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        if (cd.embeddedDataSpecifications) {
          cd.embeddedDataSpecifications.forEach((spec, specIdx) => {
            const content = spec.dataSpecificationContent as any;
            if (content && content.shortName) {
              if (Array.isArray(content.shortName) && content.shortName.length === 0) {
                errors.push({
                  path: `conceptDescriptions[${idx}].embeddedDataSpecifications[${specIdx}].dataSpecificationContent.shortName`,
                  message: "ShortName array should not be empty if specified",
                  severity: "info",
                  code: "AASd-075",
                  suggestion: "Add at least one language string or remove shortName",
                });
              }
            }
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-076: PreferredName language strings validation
 */
export const AASd_076: ValidationRule = {
  id: "AASd-076",
  name: "PreferredName Language Strings Validation",
  description: "PreferredName language strings must have language and text",
  severity: "error",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        if (cd.embeddedDataSpecifications) {
          cd.embeddedDataSpecifications.forEach((spec, specIdx) => {
            const content = spec.dataSpecificationContent as any;
            if (content && content.preferredName && Array.isArray(content.preferredName)) {
              content.preferredName.forEach((langString: any, langIdx: number) => {
                if (!langString.language || langString.language.trim() === "") {
                  errors.push({
                    path: `conceptDescriptions[${idx}].embeddedDataSpecifications[${specIdx}].dataSpecificationContent.preferredName[${langIdx}].language`,
                    message: "PreferredName language string must have language",
                    severity: "error",
                    code: "AASd-076",
                    suggestion: "Add language code (e.g., 'en', 'de')",
                  });
                }
                if (!langString.text || langString.text.trim() === "") {
                  errors.push({
                    path: `conceptDescriptions[${idx}].embeddedDataSpecifications[${specIdx}].dataSpecificationContent.preferredName[${langIdx}].text`,
                    message: "PreferredName language string must have text",
                    severity: "error",
                    code: "AASd-076",
                    suggestion: "Add text content",
                  });
                }
              });
            }
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-077: Definition language strings validation
 */
export const AASd_077: ValidationRule = {
  id: "AASd-077",
  name: "Definition Language Strings Validation",
  description: "Definition language strings must have language and text",
  severity: "error",
  category: "semantic",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        if (cd.embeddedDataSpecifications) {
          cd.embeddedDataSpecifications.forEach((spec, specIdx) => {
            const content = spec.dataSpecificationContent as any;
            if (content && content.definition && Array.isArray(content.definition)) {
              content.definition.forEach((langString: any, langIdx: number) => {
                if (!langString.language || langString.language.trim() === "") {
                  errors.push({
                    path: `conceptDescriptions[${idx}].embeddedDataSpecifications[${specIdx}].dataSpecificationContent.definition[${langIdx}].language`,
                    message: "Definition language string must have language",
                    severity: "error",
                    code: "AASd-077",
                    suggestion: "Add language code",
                  });
                }
                if (!langString.text || langString.text.trim() === "") {
                  errors.push({
                    path: `conceptDescriptions[${idx}].embeddedDataSpecifications[${specIdx}].dataSpecificationContent.definition[${langIdx}].text`,
                    message: "Definition language string must have text",
                    severity: "error",
                    code: "AASd-077",
                    suggestion: "Add text content",
                  });
                }
              });
            }
          });
        }
      });
    }

    return errors;
  },
};

// ============================================================================
// Export all semantic constraints
// ============================================================================

// Export semantic constraints (excluding those already in advanced)
// Already in advanced: AASd-077, AASd-090
// AASd-078..089 and AASd-091..097 removed: not real IDTA constraint IDs
// (ADV-2026-07-14-03) - see ai/analysis/audit-reports/DEFECT_TRACEABILITY.md
export const AASdSemanticConstraints: ValidationRule[] = [
  AASd_053,
  AASd_054,
  AASd_055,
  AASd_056,
  AASd_057,
  AASd_058,
  AASd_059,
  AASd_060,
  AASd_061,
  AASd_062,
  AASd_063,
  AASd_064,
  AASd_065,
  AASd_066,
  AASd_067,
  AASd_068,
  AASd_069,
  AASd_070,
  AASd_071,
  AASd_072,
  AASd_073,
  AASd_074,
  AASd_075,
  AASd_076,
  // AASd_077, // Already in advanced
];
