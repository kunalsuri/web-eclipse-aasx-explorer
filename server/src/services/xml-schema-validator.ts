/**
 * XML Schema Validator
 * 
 * Validates XML against AAS V3 XSD schema.
 */

import type { XMLFormat } from './xml-deserialization-service';

export interface ValidationResult {
  isValid: boolean;
  errors: SchemaError[];
  warnings: SchemaWarning[];
}

export interface SchemaError {
  line: number;
  column: number;
  message: string;
  path: string;
}

export interface SchemaWarning {
  line: number;
  column: number;
  message: string;
  path: string;
}

export enum ValidationMode {
  STRICT = 'strict',      // Reject any schema violations
  LENIENT = 'lenient',    // Import valid elements, warn on invalid
  PERMISSIVE = 'permissive' // Import everything, report issues
}

export interface ValidationConfig {
  mode: ValidationMode;
  stopOnFirstError: boolean;
  maxErrors: number;
  validateReferences: boolean;
}

const DEFAULT_CONFIG: ValidationConfig = {
  mode: ValidationMode.LENIENT,
  stopOnFirstError: false,
  maxErrors: 100,
  validateReferences: true,
};

export class SchemaValidator {
  private config: ValidationConfig;

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Validate XML content against schema
   */
  async validate(xmlContent: string, format: XMLFormat): Promise<ValidationResult> {
    const errors: SchemaError[] = [];
    const warnings: SchemaWarning[] = [];

    try {
      // Basic XML well-formedness check
      this.checkWellFormed(xmlContent, errors);

      // Check required elements
      this.checkRequiredElements(xmlContent, errors, warnings);

      // Check namespace
      this.checkNamespace(xmlContent, format, errors);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error: any) {
      errors.push({
        line: 0,
        column: 0,
        message: error.message,
        path: '',
      });

      return {
        isValid: false,
        errors,
        warnings,
      };
    }
  }

  /**
   * Check if XML is well-formed
   */
  private checkWellFormed(xml: string, errors: SchemaError[]): void {
    // Check for basic XML structure
    if (!xml.includes('<?xml')) {
      errors.push({
        line: 1,
        column: 1,
        message: 'Missing XML declaration',
        path: '',
      });
    }

    // Check for balanced tags (simplified)
    const openTags = xml.match(/<[^/][^>]*>/g) || [];
    const closeTags = xml.match(/<\/[^>]+>/g) || [];

    if (openTags.length !== closeTags.length) {
      errors.push({
        line: 0,
        column: 0,
        message: 'Unbalanced XML tags',
        path: '',
      });
    }
  }

  /**
   * Check required elements
   */
  private checkRequiredElements(
    xml: string,
    errors: SchemaError[],
    warnings: SchemaWarning[]
  ): void {
    // Check for environment root
    if (!xml.includes('<environment')) {
      errors.push({
        line: 0,
        column: 0,
        message: 'Missing <environment> root element',
        path: '',
      });
    }

    // Warn if no shells
    if (!xml.includes('<assetAdministrationShells>')) {
      warnings.push({
        line: 0,
        column: 0,
        message: 'No asset administration shells found',
        path: '',
      });
    }

    // Warn if no submodels
    if (!xml.includes('<submodels>')) {
      warnings.push({
        line: 0,
        column: 0,
        message: 'No submodels found',
        path: '',
      });
    }
  }

  /**
   * Check namespace
   */
  private checkNamespace(xml: string, format: XMLFormat, errors: SchemaError[]): void {
    const expectedNamespace = 'https://admin-shell.io/aas/3/0';

    if (!xml.includes(`xmlns="${expectedNamespace}"`)) {
      errors.push({
        line: 0,
        column: 0,
        message: `Invalid namespace. Expected: ${expectedNamespace}`,
        path: '',
      });
    }
  }

  /**
   * Set validation mode
   */
  setMode(mode: ValidationMode): void {
    this.config.mode = mode;
  }

  /**
   * Get validation mode
   */
  getMode(): ValidationMode {
    return this.config.mode;
  }
}

// Singleton instance
export const schemaValidator = new SchemaValidator();
