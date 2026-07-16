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
 * Recursively visit a list of submodel elements, descending into
 * SubmodelElementCollection/List values, Entity statements, and
 * AnnotatedRelationshipElement annotations. Mirrors the traversal used by
 * AASd-049 in aasd-structural.ts so that HasDataSpecification/Referable
 * checks reach every nested element, not just top-level ones.
 */
function traverseAllSubmodelElements(
  elements: any[] | undefined,
  basePath: string,
  callback: (element: any, path: string) => void
): void {
  if (!elements) return;
  elements.forEach((element: any, idx: number) => {
    const path = `${basePath}[${idx}]`;
    callback(element, path);

    if (element.modelType === "SubmodelElementCollection" && Array.isArray(element.value)) {
      traverseAllSubmodelElements(element.value, `${path}.value`, callback);
    }
    if (element.modelType === "SubmodelElementList" && Array.isArray(element.value)) {
      traverseAllSubmodelElements(element.value, `${path}.value`, callback);
    }
    if (element.modelType === "Entity" && Array.isArray(element.statements)) {
      traverseAllSubmodelElements(element.statements, `${path}.statements`, callback);
    }
    if (element.modelType === "AnnotatedRelationshipElement" && Array.isArray(element.annotations)) {
      traverseAllSubmodelElements(element.annotations, `${path}.annotations`, callback);
    }
  });
}

/**
 * The normative IRI of the DataSpecificationIec61360 template, per the IDTA
 * AAS V3.0 metamodel changelog (Constraint AASd-050).
 */
const IEC61360_DATA_SPECIFICATION_IRI =
  "https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0";

/**
 * Normalize an IRI for comparison: lower-case and treat http/https as
 * equivalent. Real-world AAS files (including this repo's own fixtures,
 * see aasd-structural.ts AASd-049 tests) use both "http://" and "https://"
 * and both "IEC61360" and "Iec61360" casing for this identifier, so a
 * strictly case- and scheme-sensitive comparison would flag well-formed
 * files as invalid.
 */
function normalizeDataSpecificationIri(iri: string): string {
  return iri.trim().toLowerCase().replace(/^http:/, "https:");
}

/**
 * AASd-050: If the DataSpecificationContent used for an element is
 * DataSpecificationIec61360, the value of
 * HasDataSpecification/embeddedDataSpecifications[].dataSpecification shall
 * contain the global reference to the IRI of the corresponding data
 * specification template
 * https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0.
 */
export const AASd_050: ValidationRule = {
  id: "AASd-050",
  name: "IEC 61360 Data Specification Template Reference",
  description:
    "If an EmbeddedDataSpecification's content is DataSpecificationIec61360, its dataSpecification reference must point to the IEC 61360 data specification template IRI",
  severity: "error",
  category: "schema",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];
    const canonicalIri = normalizeDataSpecificationIri(IEC61360_DATA_SPECIFICATION_IRI);

    function checkEmbeddedDataSpecs(element: any, path: string): void {
      if (!element.embeddedDataSpecifications || !Array.isArray(element.embeddedDataSpecifications)) {
        return;
      }

      element.embeddedDataSpecifications.forEach((spec: any, idx: number) => {
        const content = spec?.dataSpecificationContent;
        // Only DataSpecificationIec61360 content is constrained by AASd-050.
        if (!content || content.modelType !== "DataSpecificationIec61360") {
          return;
        }

        const keys: any[] | undefined = spec?.dataSpecification?.keys;
        const referenceValue =
          Array.isArray(keys) && keys.length > 0 ? keys[keys.length - 1]?.value : undefined;

        if (!referenceValue || normalizeDataSpecificationIri(String(referenceValue)) !== canonicalIri) {
          errors.push({
            path: `${path}.embeddedDataSpecifications[${idx}].dataSpecification`,
            message: referenceValue
              ? `EmbeddedDataSpecification with DataSpecificationIec61360 content must reference the IRI "${IEC61360_DATA_SPECIFICATION_IRI}", found "${referenceValue}"`
              : `EmbeddedDataSpecification with DataSpecificationIec61360 content must reference the IRI "${IEC61360_DATA_SPECIFICATION_IRI}", but dataSpecification has no reference key`,
            severity: "error",
            code: "AASd-050",
            suggestion: `Set dataSpecification to a global reference whose key value is "${IEC61360_DATA_SPECIFICATION_IRI}"`,
          });
        }
      });
    }

    if (ctx.environment.assetAdministrationShells) {
      ctx.environment.assetAdministrationShells.forEach((aas, idx) => {
        checkEmbeddedDataSpecs(aas, `assetAdministrationShells[${idx}]`);
      });
    }

    if (ctx.environment.submodels) {
      ctx.environment.submodels.forEach((sm, idx) => {
        checkEmbeddedDataSpecs(sm, `submodels[${idx}]`);
        traverseAllSubmodelElements(
          sm.submodelElements,
          `submodels[${idx}].submodelElements`,
          (element, path) => checkEmbeddedDataSpecs(element, path)
        );
      });
    }

    if (ctx.environment.conceptDescriptions) {
      ctx.environment.conceptDescriptions.forEach((cd, idx) => {
        checkEmbeddedDataSpecs(cd, `conceptDescriptions[${idx}]`);
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
 * DataElement subtypes per the AAS V3.0 metamodel (AasSubmodelElements enum
 * values that extend DataElement in shared/aas-v3-types.ts).
 */
const DATA_ELEMENT_MODEL_TYPES = new Set([
  "Property",
  "MultiLanguageProperty",
  "Range",
  "ReferenceElement",
  "Blob",
  "File",
]);

/**
 * Allowed values of Referable/category for data elements per AASd-090.
 */
const ALLOWED_DATA_ELEMENT_CATEGORIES = new Set(["CONSTANT", "PARAMETER", "VARIABLE"]);

/**
 * AASd-090: For data elements, category (inherited by Referable) shall be
 * one of the following values: CONSTANT, PARAMETER or VARIABLE.
 * Default: VARIABLE (an unset category is not a violation).
 */
export const AASd_090: ValidationRule = {
  id: "AASd-090",
  name: "DataElement Category Value",
  description:
    "For data elements, category (inherited from Referable) must be CONSTANT, PARAMETER, or VARIABLE; unset defaults to VARIABLE",
  severity: "error",
  category: "schema",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    function checkDataElementCategory(element: any, path: string): void {
      if (!DATA_ELEMENT_MODEL_TYPES.has(element.modelType)) {
        return;
      }

      // category is optional; an unset category defaults to VARIABLE and is valid.
      if (element.category === undefined || element.category === null || element.category === "") {
        return;
      }

      if (!ALLOWED_DATA_ELEMENT_CATEGORIES.has(element.category)) {
        errors.push({
          path: `${path}.category`,
          message: `${element.modelType} category "${element.category}" is invalid; data element category must be one of CONSTANT, PARAMETER, or VARIABLE (default VARIABLE)`,
          severity: "error",
          code: "AASd-090",
          suggestion: 'Set category to "CONSTANT", "PARAMETER", or "VARIABLE", or omit it to use the default "VARIABLE"',
        });
      }
    }

    if (ctx.environment.submodels) {
      ctx.environment.submodels.forEach((sm, idx) => {
        traverseAllSubmodelElements(
          sm.submodelElements,
          `submodels[${idx}].submodelElements`,
          checkDataElementCategory
        );
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
