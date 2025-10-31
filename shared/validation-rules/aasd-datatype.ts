/**
 * AAS V3.0 Data Type Constraints (AASd-132 to AASd-143)
 * 
 * Validation rules for data type conformance in AAS elements.
 * These constraints ensure that values conform to their declared data types.
 * 
 * Reference: Details of the Asset Administration Shell - Part 1 V3.0
 */

import type { ValidationRule, ValidationContext, ValidationError } from "../validation-types";
import type { Environment, DataTypeDefXsd } from "../aas-v3-types";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate if a value conforms to the specified XSD data type
 */
function validateValueType(value: string | undefined, valueType: DataTypeDefXsd): boolean {
  if (value === undefined || value === null || value === "") {
    return true; // Empty values are handled by structural constraints
  }

  const val = value.toString();

  switch (valueType) {
    // Boolean types
    case "xs:boolean":
      return val === "true" || val === "false" || val === "1" || val === "0";

    // Integer types
    case "xs:integer":
    case "xs:int":
    case "xs:long":
    case "xs:short":
    case "xs:byte":
      return /^-?\d+$/.test(val) && !isNaN(parseInt(val, 10));

    case "xs:nonNegativeInteger":
    case "xs:positiveInteger":
    case "xs:unsignedInt":
    case "xs:unsignedLong":
    case "xs:unsignedShort":
    case "xs:unsignedByte":
      const num = parseInt(val, 10);
      if (isNaN(num) || !/^\d+$/.test(val)) return false;
      return valueType === "xs:positiveInteger" ? num > 0 : num >= 0;

    case "xs:negativeInteger":
    case "xs:nonPositiveInteger":
      const negNum = parseInt(val, 10);
      if (isNaN(negNum) || !/^-?\d+$/.test(val)) return false;
      return valueType === "xs:negativeInteger" ? negNum < 0 : negNum <= 0;

    // Floating point types
    case "xs:float":
    case "xs:double":
    case "xs:decimal":
      return /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(val) && !isNaN(parseFloat(val));

    // String types
    case "xs:string":
      return true; // Any string is valid

    // Date/Time types
    case "xs:dateTime":
      // ISO 8601: YYYY-MM-DDTHH:mm:ss or with timezone
      return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(val);

    case "xs:date":
      // ISO 8601: YYYY-MM-DD
      return /^\d{4}-\d{2}-\d{2}(Z|[+-]\d{2}:\d{2})?$/.test(val);

    case "xs:time":
      // ISO 8601: HH:mm:ss
      return /^\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(val);

    case "xs:duration":
      // ISO 8601 duration: P[n]Y[n]M[n]DT[n]H[n]M[n]S
      // Must have at least one component after P
      if (!/^P/.test(val)) return false;
      if (val === "P" || val === "PT") return false;
      return /^P(?:\d+Y)?(?:\d+M)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+(?:\.\d+)?S)?)?$/.test(val);

    case "xs:gYear":
      // Must be at least 4 digits (YYYY format)
      return /^-?\d{4}$/.test(val) || /^-?\d{5,}$/.test(val);

    case "xs:gYearMonth":
      return /^\d{4}-\d{2}$/.test(val);

    case "xs:gMonth":
      return /^--\d{2}$/.test(val);

    case "xs:gMonthDay":
      return /^--\d{2}-\d{2}$/.test(val);

    case "xs:gDay":
      return /^---\d{2}$/.test(val);

    // Binary types
    case "xs:base64Binary":
      // Base64 must have valid length and padding
      if (val.length === 0) return true;
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(val)) return false;
      // Check length is multiple of 4
      return val.length % 4 === 0;

    case "xs:hexBinary":
      return /^[0-9A-Fa-f]*$/.test(val) && val.length % 2 === 0;

    // URI type
    case "xs:anyURI":
      try {
        new URL(val);
        return true;
      } catch {
        // Also allow relative URIs
        return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(val) || /^\//.test(val);
      }

    default:
      return true; // Unknown types pass validation
  }
}

/**
 * Get human-readable description of data type requirements
 */
function getDataTypeDescription(valueType: DataTypeDefXsd): string {
  const descriptions: Record<string, string> = {
    "xs:boolean": "true, false, 1, or 0",
    "xs:integer": "integer number (e.g., -123, 0, 456)",
    "xs:int": "32-bit integer",
    "xs:long": "64-bit integer",
    "xs:short": "16-bit integer",
    "xs:byte": "8-bit integer",
    "xs:positiveInteger": "positive integer (> 0)",
    "xs:nonNegativeInteger": "non-negative integer (>= 0)",
    "xs:negativeInteger": "negative integer (< 0)",
    "xs:nonPositiveInteger": "non-positive integer (<= 0)",
    "xs:unsignedInt": "unsigned 32-bit integer",
    "xs:unsignedLong": "unsigned 64-bit integer",
    "xs:unsignedShort": "unsigned 16-bit integer",
    "xs:unsignedByte": "unsigned 8-bit integer",
    "xs:float": "floating point number",
    "xs:double": "double precision floating point",
    "xs:decimal": "decimal number",
    "xs:string": "any text string",
    "xs:dateTime": "ISO 8601 date-time (YYYY-MM-DDTHH:mm:ss)",
    "xs:date": "ISO 8601 date (YYYY-MM-DD)",
    "xs:time": "ISO 8601 time (HH:mm:ss)",
    "xs:duration": "ISO 8601 duration (P1Y2M3DT4H5M6S)",
    "xs:base64Binary": "Base64 encoded binary data",
    "xs:hexBinary": "Hexadecimal encoded binary data",
    "xs:anyURI": "valid URI",
  };
  return descriptions[valueType] || valueType;
}

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
// AASd-132 to AASd-143: Data Type Constraints
// ============================================================================

/**
 * AASd-132: Property value must conform to valueType
 */
export const AASd_132: ValidationRule = {
  id: "AASd-132",
  name: "Property Value Type Conformance",
  description: "Property value must conform to its declared valueType",
  severity: "error",
  category: "datatype",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseElements(ctx.environment, (element, path) => {
      if (element.modelType === "Property" && element.valueType && element.value !== undefined) {
        if (!validateValueType(element.value, element.valueType)) {
          errors.push({
            path: `${path}.value`,
            message: `Property value "${element.value}" does not conform to valueType "${element.valueType}"`,
            severity: "error",
            code: "AASd-132",
            suggestion: `Value must be ${getDataTypeDescription(element.valueType)}`,
          });
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-133: Range min must conform to valueType
 */
export const AASd_133: ValidationRule = {
  id: "AASd-133",
  name: "Range Min Value Type Conformance",
  description: "Range min value must conform to its declared valueType",
  severity: "error",
  category: "datatype",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseElements(ctx.environment, (element, path) => {
      if (element.modelType === "Range" && element.valueType && element.min !== undefined) {
        if (!validateValueType(element.min, element.valueType)) {
          errors.push({
            path: `${path}.min`,
            message: `Range min value "${element.min}" does not conform to valueType "${element.valueType}"`,
            severity: "error",
            code: "AASd-133",
            suggestion: `Value must be ${getDataTypeDescription(element.valueType)}`,
          });
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-134: Range max must conform to valueType
 */
export const AASd_134: ValidationRule = {
  id: "AASd-134",
  name: "Range Max Value Type Conformance",
  description: "Range max value must conform to its declared valueType",
  severity: "error",
  category: "datatype",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseElements(ctx.environment, (element, path) => {
      if (element.modelType === "Range" && element.valueType && element.max !== undefined) {
        if (!validateValueType(element.max, element.valueType)) {
          errors.push({
            path: `${path}.max`,
            message: `Range max value "${element.max}" does not conform to valueType "${element.valueType}"`,
            severity: "error",
            code: "AASd-134",
            suggestion: `Value must be ${getDataTypeDescription(element.valueType)}`,
          });
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-135: Qualifier value must conform to valueType
 */
export const AASd_135: ValidationRule = {
  id: "AASd-135",
  name: "Qualifier Value Type Conformance",
  description: "Qualifier value must conform to its declared valueType",
  severity: "error",
  category: "datatype",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    function checkQualifiers(element: any, basePath: string): void {
      if (element.qualifiers && Array.isArray(element.qualifiers)) {
        element.qualifiers.forEach((qualifier: any, idx: number) => {
          if (qualifier.valueType && qualifier.value !== undefined) {
            if (!validateValueType(qualifier.value, qualifier.valueType)) {
              errors.push({
                path: `${basePath}.qualifiers[${idx}].value`,
                message: `Qualifier value "${qualifier.value}" does not conform to valueType "${qualifier.valueType}"`,
                severity: "error",
                code: "AASd-135",
                suggestion: `Value must be ${getDataTypeDescription(qualifier.valueType)}`,
              });
            }
          }
        });
      }
    }

    // Check qualifiers in submodels and all elements
    traverseElements(ctx.environment, (element, path) => {
      checkQualifiers(element, path);
    });

    return errors;
  },
};

/**
 * AASd-136: Extension value must conform to valueType
 */
export const AASd_136: ValidationRule = {
  id: "AASd-136",
  name: "Extension Value Type Conformance",
  description: "Extension value must conform to its declared valueType",
  severity: "error",
  category: "datatype",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    function checkExtensions(element: any, basePath: string): void {
      if (element.extensions && Array.isArray(element.extensions)) {
        element.extensions.forEach((extension: any, idx: number) => {
          if (extension.valueType && extension.value !== undefined) {
            if (!validateValueType(extension.value, extension.valueType)) {
              errors.push({
                path: `${basePath}.extensions[${idx}].value`,
                message: `Extension value "${extension.value}" does not conform to valueType "${extension.valueType}"`,
                severity: "error",
                code: "AASd-136",
                suggestion: `Value must be ${getDataTypeDescription(extension.valueType)}`,
              });
            }
          }
        });
      }
    }

    // Check extensions in AAS
    if (ctx.environment.assetAdministrationShells) {
      ctx.environment.assetAdministrationShells.forEach((aas, idx) => {
        checkExtensions(aas, `assetAdministrationShells[${idx}]`);
      });
    }

    // Check extensions in submodels and all elements
    traverseElements(ctx.environment, (element, path) => {
      checkExtensions(element, path);
    });

    return errors;
  },
};

/**
 * AASd-137: Boolean value validation
 */
export const AASd_137: ValidationRule = {
  id: "AASd-137",
  name: "Boolean Value Validation",
  description: "Boolean values must be 'true', 'false', '1', or '0'",
  severity: "error",
  category: "datatype",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseElements(ctx.environment, (element, path) => {
      if (element.valueType === "xs:boolean" && element.value !== undefined) {
        const val = element.value.toString();
        if (!["true", "false", "1", "0"].includes(val)) {
          errors.push({
            path: `${path}.value`,
            message: `Boolean value "${element.value}" is invalid`,
            severity: "error",
            code: "AASd-137",
            suggestion: "Boolean values must be 'true', 'false', '1', or '0'",
          });
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-138: Integer value validation
 */
export const AASd_138: ValidationRule = {
  id: "AASd-138",
  name: "Integer Value Validation",
  description: "Integer values must be valid integers according to their type",
  severity: "error",
  category: "datatype",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    const integerTypes = [
      "xs:integer", "xs:int", "xs:long", "xs:short", "xs:byte",
      "xs:positiveInteger", "xs:nonNegativeInteger", "xs:negativeInteger", "xs:nonPositiveInteger",
      "xs:unsignedInt", "xs:unsignedLong", "xs:unsignedShort", "xs:unsignedByte"
    ];

    traverseElements(ctx.environment, (element, path) => {
      if (element.valueType && integerTypes.includes(element.valueType) && element.value !== undefined) {
        if (!validateValueType(element.value, element.valueType)) {
          errors.push({
            path: `${path}.value`,
            message: `Integer value "${element.value}" is invalid for type "${element.valueType}"`,
            severity: "error",
            code: "AASd-138",
            suggestion: `Value must be ${getDataTypeDescription(element.valueType)}`,
          });
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-139: Float/Double value validation
 */
export const AASd_139: ValidationRule = {
  id: "AASd-139",
  name: "Float/Double Value Validation",
  description: "Float and double values must be valid floating point numbers",
  severity: "error",
  category: "datatype",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    const floatTypes = ["xs:float", "xs:double", "xs:decimal"];

    traverseElements(ctx.environment, (element, path) => {
      if (element.valueType && floatTypes.includes(element.valueType) && element.value !== undefined) {
        if (!validateValueType(element.value, element.valueType)) {
          errors.push({
            path: `${path}.value`,
            message: `Floating point value "${element.value}" is invalid for type "${element.valueType}"`,
            severity: "error",
            code: "AASd-139",
            suggestion: `Value must be a valid floating point number (e.g., 123.45, -0.5, 1.23e-4)`,
          });
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-140: String value validation
 */
export const AASd_140: ValidationRule = {
  id: "AASd-140",
  name: "String Value Validation",
  description: "String values are always valid (informational check)",
  severity: "info",
  category: "datatype",
  validate: (ctx: ValidationContext): ValidationError[] => {
    // String values are always valid, this is an informational rule
    return [];
  },
};

/**
 * AASd-141: DateTime value validation
 */
export const AASd_141: ValidationRule = {
  id: "AASd-141",
  name: "DateTime Value Validation",
  description: "DateTime values must conform to ISO 8601 format",
  severity: "error",
  category: "datatype",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    const dateTimeTypes = [
      "xs:dateTime", "xs:date", "xs:time",
      "xs:gYear", "xs:gYearMonth", "xs:gMonth", "xs:gMonthDay", "xs:gDay"
    ];

    traverseElements(ctx.environment, (element, path) => {
      if (element.valueType && dateTimeTypes.includes(element.valueType) && element.value !== undefined) {
        if (!validateValueType(element.value, element.valueType)) {
          errors.push({
            path: `${path}.value`,
            message: `DateTime value "${element.value}" is invalid for type "${element.valueType}"`,
            severity: "error",
            code: "AASd-141",
            suggestion: `Value must be ${getDataTypeDescription(element.valueType)}`,
          });
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-142: Duration value validation
 */
export const AASd_142: ValidationRule = {
  id: "AASd-142",
  name: "Duration Value Validation",
  description: "Duration values must conform to ISO 8601 duration format",
  severity: "error",
  category: "datatype",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseElements(ctx.environment, (element, path) => {
      if (element.valueType === "xs:duration" && element.value !== undefined) {
        if (!validateValueType(element.value, element.valueType)) {
          errors.push({
            path: `${path}.value`,
            message: `Duration value "${element.value}" is invalid`,
            severity: "error",
            code: "AASd-142",
            suggestion: "Duration must follow ISO 8601 format (e.g., P1Y2M3DT4H5M6S, PT1H30M, P7D)",
          });
        }
      }
    });

    return errors;
  },
};

/**
 * AASd-143: Base64 value validation (for Blob)
 */
export const AASd_143: ValidationRule = {
  id: "AASd-143",
  name: "Base64 Value Validation",
  description: "Base64 and hexBinary values must be properly encoded",
  severity: "error",
  category: "datatype",
  validate: (ctx: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    traverseElements(ctx.environment, (element, path) => {
      // Check base64Binary
      if (element.valueType === "xs:base64Binary" && element.value !== undefined) {
        if (!validateValueType(element.value, element.valueType)) {
          errors.push({
            path: `${path}.value`,
            message: `Base64 value "${element.value}" is invalid`,
            severity: "error",
            code: "AASd-143",
            suggestion: "Value must be valid Base64 encoded data (A-Z, a-z, 0-9, +, /, =)",
          });
        }
      }

      // Check hexBinary
      if (element.valueType === "xs:hexBinary" && element.value !== undefined) {
        if (!validateValueType(element.value, element.valueType)) {
          errors.push({
            path: `${path}.value`,
            message: `Hex binary value "${element.value}" is invalid`,
            severity: "error",
            code: "AASd-143",
            suggestion: "Value must be valid hexadecimal (0-9, A-F) with even length",
          });
        }
      }

      // Check Blob contentType and value
      if (element.modelType === "Blob" && element.value !== undefined) {
        // Blob value should be base64 encoded
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(element.value)) {
          errors.push({
            path: `${path}.value`,
            message: `Blob value must be Base64 encoded`,
            severity: "error",
            code: "AASd-143",
            suggestion: "Encode binary data as Base64 before storing in Blob",
          });
        }
      }
    });

    return errors;
  },
};

// ============================================================================
// Export all data type constraint rules
// ============================================================================

export const AASdDataTypeConstraints: ValidationRule[] = [
  AASd_132,
  AASd_133,
  AASd_134,
  AASd_135,
  AASd_136,
  AASd_137,
  AASd_138,
  AASd_139,
  AASd_140,
  AASd_141,
  AASd_142,
  AASd_143,
];
