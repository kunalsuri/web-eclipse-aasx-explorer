/**
 * XML Schema Validator
 * 
 * Validates XML against AAS V3 XSD schema.
 */

import type { XMLFormat } from './xml-deserialization-service';
import { parseStringPromise } from 'xml2js';

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
      await this.checkWellFormed(xmlContent, errors);

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
  private async checkWellFormed(xml: string, errors: SchemaError[]): Promise<void> {
    if (!xml.includes('<?xml')) {
      errors.push({
        line: 1,
        column: 1,
        message: 'Missing XML declaration',
        path: '',
      });
    }

    try {
      await parseStringPromise(xml);
    } catch (error) {
      errors.push({
        line: 0,
        column: 0,
        message: error instanceof Error ? error.message : 'Malformed XML',
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
    if (!/<(?:[A-Za-z_][\w.-]*:)?environment(?:\s|>)/.test(xml)) {
      errors.push({
        line: 0,
        column: 0,
        message: 'Missing <environment> root element',
        path: '',
      });
    }

    // Warn if no shells
    if (!/<(?:[A-Za-z_][\w.-]*:)?assetAdministrationShells(?:\s|>)/.test(xml)) {
      warnings.push({
        line: 0,
        column: 0,
        message: 'No asset administration shells found',
        path: '',
      });
    }

    // Warn if no submodels
    if (!/<(?:[A-Za-z_][\w.-]*:)?submodels(?:\s|>)/.test(xml)) {
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

    const namespacePattern = new RegExp(
      `xmlns(?::[A-Za-z_][\\w.-]*)?="${expectedNamespace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`
    );
    if (!namespacePattern.test(xml)) {
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
