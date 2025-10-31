/**
 * Dictionary Concept Validation
 * Validates dictionary concepts against AAS V3 requirements
 */

import type {
  DictionaryConcept,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '../../../shared/dictionary-types';
import { DataTypeDefXsd } from '../../../shared/aas-v3-types';

/**
 * Validates a dictionary concept against AAS V3 requirements
 */
export function validateConcept(concept: DictionaryConcept): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate required fields
  validateRequiredFields(concept, errors);

  // Validate semantic ID format
  validateSemanticIdFormat(concept, errors);

  // Validate data type compatibility
  validateDataType(concept, errors, warnings);

  // Validate multi-language fields
  validateMultiLanguageFields(concept, warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate required fields
 */
function validateRequiredFields(concept: DictionaryConcept, errors: ValidationError[]): void {
  if (!concept.id || concept.id.trim().length === 0) {
    errors.push({
      code: 'MISSING_ID',
      message: 'Concept ID is required',
      field: 'id',
    });
  }

  if (!concept.preferredName || concept.preferredName.length === 0) {
    errors.push({
      code: 'MISSING_PREFERRED_NAME',
      message: 'Preferred name is required',
      field: 'preferredName',
    });
  }

  if (concept.preferredName && concept.preferredName.length > 0) {
    const hasNonEmptyName = concept.preferredName.some(name => name.text && name.text.trim().length > 0);
    if (!hasNonEmptyName) {
      errors.push({
        code: 'EMPTY_PREFERRED_NAME',
        message: 'Preferred name must have at least one non-empty value',
        field: 'preferredName',
      });
    }
  }
}

/**
 * Validate semantic ID format (IRDI or IRI)
 */
function validateSemanticIdFormat(concept: DictionaryConcept, errors: ValidationError[]): void {
  const id = concept.id;

  // IRDI pattern: 0112/2///{domain}#{id}#{version} or similar
  const irdiPattern = /^\d{4}\/\d+\/\/\/\d+#[A-Z0-9]+#\d+$/;
  
  // IRI pattern: http:// or https://
  const iriPattern = /^https?:\/\/.+/;

  if (!irdiPattern.test(id) && !iriPattern.test(id)) {
    errors.push({
      code: 'INVALID_SEMANTIC_ID_FORMAT',
      message: 'Semantic ID must be a valid IRDI or IRI format',
      field: 'id',
    });
  }
}

/**
 * Validate data type compatibility with AAS V3
 */
function validateDataType(
  concept: DictionaryConcept,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (!concept.dataType) {
    // Data type is optional for classes
    return;
  }

  // Check if data type is a valid AAS data type
  const validDataTypes = Object.values(DataTypeDefXsd);
  if (!validDataTypes.includes(concept.dataType)) {
    errors.push({
      code: 'INVALID_DATA_TYPE',
      message: `Data type '${concept.dataType}' is not a valid AAS V3 data type`,
      field: 'dataType',
    });
  }

  // Warn if unit is specified without a numeric data type
  if (concept.unit && !isNumericDataType(concept.dataType)) {
    warnings.push({
      code: 'UNIT_WITHOUT_NUMERIC_TYPE',
      message: `Unit '${concept.unit}' is specified but data type '${concept.dataType}' is not numeric`,
      field: 'unit',
    });
  }
}

/**
 * Validate multi-language fields
 */
function validateMultiLanguageFields(concept: DictionaryConcept, warnings: ValidationWarning[]): void {
  // Check if English translation is available
  const hasEnglish = concept.preferredName.some(name => name.language === 'en' || name.language === 'EN');
  if (!hasEnglish) {
    warnings.push({
      code: 'MISSING_ENGLISH_TRANSLATION',
      message: 'Preferred name does not have an English translation',
      field: 'preferredName',
    });
  }

  // Check for duplicate languages
  const languages = concept.preferredName.map(name => name.language.toLowerCase());
  const duplicates = languages.filter((lang, index) => languages.indexOf(lang) !== index);
  if (duplicates.length > 0) {
    warnings.push({
      code: 'DUPLICATE_LANGUAGES',
      message: `Duplicate language codes found: ${duplicates.join(', ')}`,
      field: 'preferredName',
    });
  }
}

/**
 * Check if data type is numeric
 */
function isNumericDataType(dataType: DataTypeDefXsd): boolean {
  const numericTypes = [
    DataTypeDefXsd.Int,
    DataTypeDefXsd.Integer,
    DataTypeDefXsd.Long,
    DataTypeDefXsd.Short,
    DataTypeDefXsd.Byte,
    DataTypeDefXsd.UnsignedInt,
    DataTypeDefXsd.UnsignedLong,
    DataTypeDefXsd.UnsignedShort,
    DataTypeDefXsd.UnsignedByte,
    DataTypeDefXsd.Float,
    DataTypeDefXsd.Double,
    DataTypeDefXsd.Decimal,
    DataTypeDefXsd.PositiveInteger,
    DataTypeDefXsd.NegativeInteger,
    DataTypeDefXsd.NonPositiveInteger,
    DataTypeDefXsd.NonNegativeInteger,
  ];

  return numericTypes.includes(dataType);
}

/**
 * Validate data type compatibility between dictionary and AAS
 */
export function validateDataTypeCompatibility(
  dictionaryType: string,
  aasType: DataTypeDefXsd
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const compatibilityMap: Record<string, DataTypeDefXsd[]> = {
    'INTEGER': [DataTypeDefXsd.Int, DataTypeDefXsd.Integer, DataTypeDefXsd.Long],
    'REAL': [DataTypeDefXsd.Float, DataTypeDefXsd.Double, DataTypeDefXsd.Decimal],
    'STRING': [DataTypeDefXsd.String],
    'BOOLEAN': [DataTypeDefXsd.Boolean],
    'DATE': [DataTypeDefXsd.Date, DataTypeDefXsd.DateTime],
    'TIME': [DataTypeDefXsd.Time, DataTypeDefXsd.DateTime],
    'URI': [DataTypeDefXsd.AnyUri],
    'BINARY': [DataTypeDefXsd.Base64Binary, DataTypeDefXsd.HexBinary],
  };

  const compatibleTypes = compatibilityMap[dictionaryType.toUpperCase()] || [];
  const isCompatible = compatibleTypes.includes(aasType);

  if (!isCompatible) {
    errors.push({
      code: 'INCOMPATIBLE_DATA_TYPE',
      message: `Data type '${dictionaryType}' is not compatible with AAS type '${aasType}'`,
      field: 'dataType',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
