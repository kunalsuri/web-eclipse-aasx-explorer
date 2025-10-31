/**
 * AAS V3.0 Advanced Specification Constraints (Additional AASd rules)
 * 
 * Extended validation rules for complex scenarios and data integrity
 */

import type { ValidationRule, ValidationContext, ValidationError } from "../validation-types";
import type { Reference, Key } from "../aas-v3-types";

/**
 * AASd-005: For DataSpecifications, the data specification reference must be valid
 */
export const AASd_005: ValidationRule = {
  id: "AASd-005",
  name: "Valid Data Specification Reference",
  description: "Data specification references must be well-formed",
  severity: "error",
  category: "reference",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    function checkDataSpecs(element: any, path: string): void {
      if (element.embeddedDataSpecifications && Array.isArray(element.embeddedDataSpecifications)) {
        element.embeddedDataSpecifications.forEach((spec: any, idx: number) => {
          if (!spec.dataSpecification) {
            errors.push({
              path: `${path}.embeddedDataSpecifications[${idx}]`,
              message: "EmbeddedDataSpecification must have dataSpecification reference",
              severity: "error",
              code: "AASd-005",
            });
          }
        });
      }
    }

    // Check all elements
    if (ctx.environment.assetAdministrationShells) {
      ctx.environment.assetAdministrationShells.forEach((aas, idx) => {
        checkDataSpecs(aas, `assetAdministrationShells[${idx}]`);
      });
    }

    if (ctx.environment.submodels) {
      ctx.environment.submodels.forEach((sm, idx) => {
        checkDataSpecs(sm, `submodels[${idx}]`);
      });
    }

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        checkDataSpecs(cd, `conceptDescriptions[${idx}]`);
      });
    }

    return errors;
  },
};

/**
 * AASd-006: Global asset ID must be defined for asset information
 */
export const AASd_006: ValidationRule = {
  id: "AASd-006",
  name: "Valid Global Asset ID",
  description: "GlobalAssetId should be defined for asset tracking",
  severity: "warning",
  category: "schema",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (ctx.environment.assetAdministrationShells) {
      ctx.environment.assetAdministrationShells.forEach((aas, idx) => {
        if (aas.assetInformation && !aas.assetInformation.globalAssetId) {
          errors.push({
            path: `assetAdministrationShells[${idx}].assetInformation.globalAssetId`,
            message: "GlobalAssetId is recommended for proper asset identification",
            severity: "warning",
            code: "AASd-006",
            suggestion: "Add a globally unique identifier for the asset",
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-007: SubmodelElementList - all elements must be of same type
 */
export const AASd_007: ValidationRule = {
  id: "AASd-007",
  name: "SubmodelElementList Type Uniformity",
  description: "All elements in SubmodelElementList must have the same modelType",
  severity: "error",
  category: "structure",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    function checkList(element: any, path: string): void {
      if (element.modelType === "SubmodelElementList" && element.value && Array.isArray(element.value)) {
        if (element.value.length > 0) {
          const firstType = element.value[0].modelType;
          element.value.forEach((item: any, idx: number) => {
            if (item.modelType !== firstType) {
              errors.push({
                path: `${path}.value[${idx}]`,
                message: `Element type "${item.modelType}" does not match list type "${firstType}"`,
                severity: "error",
                code: "AASd-007",
                suggestion: `All elements in SubmodelElementList must be of type "${firstType}"`,
              });
            }
          });
        }
      }

      // Recursively check
      if (element.submodelElements) {
        element.submodelElements.forEach((child: any, idx: number) => {
          checkList(child, `${path}.submodelElements[${idx}]`);
        });
      }
      if (element.value && Array.isArray(element.value) && element.modelType !== "SubmodelElementList") {
        element.value.forEach((child: any, idx: number) => {
          checkList(child, `${path}.value[${idx}]`);
        });
      }
    }

    if (ctx.environment.submodels) {
      ctx.environment.submodels.forEach((sm, idx) => {
        if (sm.submodelElements) {
          sm.submodelElements.forEach((elem, elemIdx) => {
            checkList(elem, `submodels[${idx}].submodelElements[${elemIdx}]`);
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-008: Entity type validation - globalAssetId required for SelfManagedEntity
 */
export const AASd_008: ValidationRule = {
  id: "AASd-008",
  name: "Entity GlobalAssetId Requirement",
  description: "SelfManagedEntity must have globalAssetId",
  severity: "error",
  category: "schema",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    function checkEntity(element: any, path: string): void {
      if (element.modelType === "Entity") {
        if (element.entityType === "SelfManagedEntity" && !element.globalAssetId) {
          errors.push({
            path: `${path}.globalAssetId`,
            message: "SelfManagedEntity must have globalAssetId",
            severity: "error",
            code: "AASd-008",
            suggestion: "Add globalAssetId reference for self-managed entities",
          });
        }
      }

      // Recursively check
      if (element.submodelElements) {
        element.submodelElements.forEach((child: any, idx: number) => {
          checkEntity(child, `${path}.submodelElements[${idx}]`);
        });
      }
      if (element.statements) {
        element.statements.forEach((child: any, idx: number) => {
          checkEntity(child, `${path}.statements[${idx}]`);
        });
      }
    }

    if (ctx.environment.submodels) {
      ctx.environment.submodels.forEach((sm, idx) => {
        if (sm.submodelElements) {
          sm.submodelElements.forEach((elem, elemIdx) => {
            checkEntity(elem, `submodels[${idx}].submodelElements[${elemIdx}]`);
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-014: Either min or max must be set in Range
 */
export const AASd_014: ValidationRule = {
  id: "AASd-014",
  name: "Range Requires Min or Max",
  description: "Range must have at least min or max defined",
  severity: "error",
  category: "schema",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    function checkRange(element: any, path: string): void {
      if (element.modelType === "Range") {
        if (element.min === undefined && element.max === undefined) {
          errors.push({
            path,
            message: "Range must have at least min or max defined",
            severity: "error",
            code: "AASd-014",
            suggestion: "Define min, max, or both for the Range element",
          });
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

/**
 * AASd-050: Blob MIME type validation
 */
export const AASd_050: ValidationRule = {
  id: "AASd-050",
  name: "Blob MIME Type Required",
  description: "Blob must have a contentType (MIME type)",
  severity: "error",
  category: "schema",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    function checkBlob(element: any, path: string): void {
      if (element.modelType === "Blob") {
        if (!element.contentType || element.contentType.trim() === "") {
          errors.push({
            path: `${path}.contentType`,
            message: "Blob must have a contentType (MIME type)",
            severity: "error",
            code: "AASd-050",
            suggestion: "Add contentType, e.g., 'application/pdf', 'image/png'",
          });
        }
      }

      // Recursively check
      if (element.submodelElements) {
        element.submodelElements.forEach((child: any, idx: number) => {
          checkBlob(child, `${path}.submodelElements[${idx}]`);
        });
      }
    }

    if (ctx.environment.submodels) {
      ctx.environment.submodels.forEach((sm, idx) => {
        if (sm.submodelElements) {
          sm.submodelElements.forEach((elem, elemIdx) => {
            checkBlob(elem, `submodels[${idx}].submodelElements[${elemIdx}]`);
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-052: File must have contentType
 */
export const AASd_052: ValidationRule = {
  id: "AASd-052",
  name: "File MIME Type Required",
  description: "File must have a contentType (MIME type)",
  severity: "error",
  category: "schema",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    function checkFile(element: any, path: string): void {
      if (element.modelType === "File") {
        if (!element.contentType || element.contentType.trim() === "") {
          errors.push({
            path: `${path}.contentType`,
            message: "File must have a contentType (MIME type)",
            severity: "error",
            code: "AASd-052",
            suggestion: "Add contentType, e.g., 'application/pdf', 'text/plain'",
          });
        }
      }

      // Recursively check
      if (element.submodelElements) {
        element.submodelElements.forEach((child: any, idx: number) => {
          checkFile(child, `${path}.submodelElements[${idx}]`);
        });
      }
    }

    if (ctx.environment.submodels) {
      ctx.environment.submodels.forEach((sm, idx) => {
        if (sm.submodelElements) {
          sm.submodelElements.forEach((elem, elemIdx) => {
            checkFile(elem, `submodels[${idx}].submodelElements[${elemIdx}]`);
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-077: For Operation, at least one of inputVariables, outputVariables, or inoutputVariables must be defined
 */
export const AASd_077: ValidationRule = {
  id: "AASd-077",
  name: "Operation Variables Required",
  description: "Operation must have at least one variable collection defined",
  severity: "warning",
  category: "schema",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    function checkOperation(element: any, path: string): void {
      if (element.modelType === "Operation") {
        const hasInput = element.inputVariables && element.inputVariables.length > 0;
        const hasOutput = element.outputVariables && element.outputVariables.length > 0;
        const hasInOut = element.inoutputVariables && element.inoutputVariables.length > 0;

        if (!hasInput && !hasOutput && !hasInOut) {
          errors.push({
            path,
            message: "Operation has no variables defined",
            severity: "warning",
            code: "AASd-077",
            suggestion: "Define at least one of: inputVariables, outputVariables, or inoutputVariables",
          });
        }
      }

      // Recursively check
      if (element.submodelElements) {
        element.submodelElements.forEach((child: any, idx: number) => {
          checkOperation(child, `${path}.submodelElements[${idx}]`);
        });
      }
    }

    if (ctx.environment.submodels) {
      ctx.environment.submodels.forEach((sm, idx) => {
        if (sm.submodelElements) {
          sm.submodelElements.forEach((elem, elemIdx) => {
            checkOperation(elem, `submodels[${idx}].submodelElements[${elemIdx}]`);
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-090: For AnnotatedRelationshipElement, first and second must be defined
 */
export const AASd_090: ValidationRule = {
  id: "AASd-090",
  name: "AnnotatedRelationshipElement Endpoints Required",
  description: "AnnotatedRelationshipElement must have first and second references",
  severity: "error",
  category: "schema",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    function checkRelationship(element: any, path: string): void {
      if (element.modelType === "AnnotatedRelationshipElement" || element.modelType === "RelationshipElement") {
        if (!element.first) {
          errors.push({
            path: `${path}.first`,
            message: `${element.modelType} must have 'first' reference defined`,
            severity: "error",
            code: "AASd-090",
            suggestion: "Define the first endpoint of the relationship",
          });
        }
        if (!element.second) {
          errors.push({
            path: `${path}.second`,
            message: `${element.modelType} must have 'second' reference defined`,
            severity: "error",
            code: "AASd-090",
            suggestion: "Define the second endpoint of the relationship",
          });
        }
      }

      // Recursively check
      if (element.submodelElements) {
        element.submodelElements.forEach((child: any, idx: number) => {
          checkRelationship(child, `${path}.submodelElements[${idx}]`);
        });
      }
    }

    if (ctx.environment.submodels) {
      ctx.environment.submodels.forEach((sm, idx) => {
        if (sm.submodelElements) {
          sm.submodelElements.forEach((elem, elemIdx) => {
            checkRelationship(elem, `submodels[${idx}].submodelElements[${elemIdx}]`);
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-107: Property valueType validation
 */
export const AASd_107: ValidationRule = {
  id: "AASd-107",
  name: "Property ValueType Valid",
  description: "Property must have a valid valueType from allowed data types",
  severity: "error",
  category: "datatype",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    const validValueTypes = [
      "xs:string", "xs:boolean", "xs:decimal", "xs:integer", "xs:double", "xs:float",
      "xs:date", "xs:time", "xs:dateTime", "xs:gYear", "xs:gMonth", "xs:gDay",
      "xs:gYearMonth", "xs:gMonthDay", "xs:duration", "xs:byte", "xs:short",
      "xs:int", "xs:long", "xs:unsignedByte", "xs:unsignedShort", "xs:unsignedInt",
      "xs:unsignedLong", "xs:positiveInteger", "xs:nonNegativeInteger",
      "xs:negativeInteger", "xs:nonPositiveInteger", "xs:hexBinary", "xs:base64Binary",
      "xs:anyURI"
    ];

    function checkProperty(element: any, path: string): void {
      if (element.modelType === "Property") {
        if (!element.valueType) {
          errors.push({
            path: `${path}.valueType`,
            message: "Property must have valueType defined",
            severity: "error",
            code: "AASd-107",
            suggestion: `Use one of: ${validValueTypes.slice(0, 5).join(", ")}, ...`,
          });
        } else if (!validValueTypes.includes(element.valueType)) {
          errors.push({
            path: `${path}.valueType`,
            message: `Invalid valueType: ${element.valueType}`,
            severity: "error",
            code: "AASd-107",
            suggestion: "Use a valid XSD data type (e.g., xs:string, xs:int, xs:boolean)",
          });
        }
      }

      // Also check Range
      if (element.modelType === "Range") {
        if (!element.valueType) {
          errors.push({
            path: `${path}.valueType`,
            message: "Range must have valueType defined",
            severity: "error",
            code: "AASd-107",
          });
        } else if (!validValueTypes.includes(element.valueType)) {
          errors.push({
            path: `${path}.valueType`,
            message: `Invalid valueType: ${element.valueType}`,
            severity: "error",
            code: "AASd-107",
          });
        }
      }

      // Recursively check
      if (element.submodelElements) {
        element.submodelElements.forEach((child: any, idx: number) => {
          checkProperty(child, `${path}.submodelElements[${idx}]`);
        });
      }
    }

    if (ctx.environment.submodels) {
      ctx.environment.submodels.forEach((sm, idx) => {
        if (sm.submodelElements) {
          sm.submodelElements.forEach((elem, elemIdx) => {
            checkProperty(elem, `submodels[${idx}].submodelElements[${elemIdx}]`);
          });
        }
      });
    }

    return errors;
  },
};

/**
 * AASd-114: If Qualifier/valueType is defined, value must conform to that type
 */
export const AASd_114: ValidationRule = {
  id: "AASd-114",
  name: "Qualifier Value Type Conformance",
  description: "Qualifier value must match its declared valueType",
  severity: "error",
  category: "datatype",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    function validateValueType(value: any, valueType: string, path: string): void {
      if (!value || !valueType) return;

      // Basic type checking
      if (valueType === "xs:boolean" && !["true", "false", "0", "1"].includes(String(value).toLowerCase())) {
        errors.push({
          path,
          message: `Value "${value}" does not match valueType "${valueType}"`,
          severity: "error",
          code: "AASd-114",
        });
      } else if ((valueType === "xs:int" || valueType === "xs:integer") && isNaN(parseInt(value, 10))) {
        errors.push({
          path,
          message: `Value "${value}" is not a valid integer`,
          severity: "error",
          code: "AASd-114",
        });
      } else if ((valueType === "xs:double" || valueType === "xs:float" || valueType === "xs:decimal") && isNaN(parseFloat(value))) {
        errors.push({
          path,
          message: `Value "${value}" is not a valid number`,
          severity: "error",
          code: "AASd-114",
        });
      }
    }

    function checkQualifiers(element: any, path: string): void {
      if (element.qualifiers && Array.isArray(element.qualifiers)) {
        element.qualifiers.forEach((qualifier: any, idx: number) => {
          if (qualifier.valueType && qualifier.value) {
            validateValueType(qualifier.value, qualifier.valueType, `${path}.qualifiers[${idx}].value`);
          }
        });
      }

      // Recursively check
      if (element.submodelElements) {
        element.submodelElements.forEach((child: any, idx: number) => {
          checkQualifiers(child, `${path}.submodelElements[${idx}]`);
        });
      }
    }

    if (ctx.environment.submodels) {
      ctx.environment.submodels.forEach((sm, idx) => {
        checkQualifiers(sm, `submodels[${idx}]`);
        if (sm.submodelElements) {
          sm.submodelElements.forEach((elem, elemIdx) => {
            checkQualifiers(elem, `submodels[${idx}].submodelElements[${elemIdx}]`);
          });
        }
      });
    }

    return errors;
  },
};

// ============================================================================
// Export all advanced constraints
// ============================================================================

export const AASdAdvancedConstraints: ValidationRule[] = [
  AASd_005,
  AASd_006,
  AASd_007,
  AASd_008,
  AASd_014,
  AASd_050,
  AASd_052,
  AASd_077,
  AASd_090,
  AASd_107,
  AASd_114,
];
