/**
 * Export Service
 * Service for exporting AAS data to various formats
 */

import type { Environment, Submodel, SubmodelElement } from '../../../shared/aas-v3-types';

export class ExportService {
  /**
   * Export environment to JSON
   */
  public exportToJSON(environment: Environment, pretty: boolean = true): string {
    return JSON.stringify(environment, null, pretty ? 2 : 0);
  }

  /**
   * Export environment to CSV
   */
  public exportToCSV(environment: Environment): string {
    const rows: string[][] = [];

    // Header row
    rows.push([
      'Type',
      'idShort',
      'ID',
      'Value',
      'ValueType',
      'Category',
      'Description',
      'SemanticID',
      'Path',
    ]);

    // Process submodels
    if (environment.submodels) {
      for (const submodel of environment.submodels) {
        this.processSubmodelForCSV(submodel, [submodel.idShort || submodel.id], rows);
      }
    }

    // Convert to CSV string
    return rows.map((row) => row.map((cell) => this.escapeCSV(cell)).join(',')).join('\n');
  }

  /**
   * Export submodel to CSV
   */
  public exportSubmodelToCSV(submodel: Submodel): string {
    const rows: string[][] = [];

    // Header row
    rows.push([
      'Type',
      'idShort',
      'Value',
      'ValueType',
      'Category',
      'Description',
      'SemanticID',
      'Path',
    ]);

    // Process elements
    this.processSubmodelForCSV(submodel, [submodel.idShort || submodel.id], rows);

    return rows.map((row) => row.map((cell) => this.escapeCSV(cell)).join(',')).join('\n');
  }

  /**
   * Export properties to CSV (flat structure)
   */
  public exportPropertiesToCSV(environment: Environment): string {
    const rows: string[][] = [];

    // Header row
    rows.push(['Path', 'idShort', 'Value', 'ValueType', 'Description']);

    // Extract all properties
    if (environment.submodels) {
      for (const submodel of environment.submodels) {
        this.extractProperties(submodel, [submodel.idShort || submodel.id], rows);
      }
    }

    return rows.map((row) => row.map((cell) => this.escapeCSV(cell)).join(',')).join('\n');
  }

  /**
   * Create export metadata
   */
  public createExportMetadata(environment: Environment) {
    return {
      exportDate: new Date().toISOString(),
      aasCount: environment.assetAdministrationShells?.length || 0,
      submodelCount: environment.submodels?.length || 0,
      conceptDescriptionCount: environment.conceptDescriptions?.length || 0,
      version: '3.0',
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private processSubmodelForCSV(submodel: Submodel, path: string[], rows: string[][]) {
    // Add submodel row
    rows.push([
      'Submodel',
      submodel.idShort || '',
      submodel.id || '',
      '',
      '',
      submodel.category || '',
      this.extractDescription(submodel.description),
      this.extractSemanticId(submodel.semanticId),
      path.join('/'),
    ]);

    // Process elements
    if (submodel.submodelElements) {
      for (const element of submodel.submodelElements) {
        this.processElementForCSV(element, [...path, element.idShort || ''], rows);
      }
    }
  }

  private processElementForCSV(element: SubmodelElement, path: string[], rows: string[][]) {
    const modelType = (element as any).modelType || 'SubmodelElement';

    rows.push([
      modelType,
      element.idShort || '',
      '',
      this.extractValue(element),
      this.extractValueType(element),
      element.category || '',
      this.extractDescription(element.description),
      this.extractSemanticId(element.semanticId),
      path.join('/'),
    ]);

    // Process nested elements
    if ('value' in element && Array.isArray(element.value)) {
      for (const child of element.value) {
        if (typeof child === 'object' && child !== null && 'idShort' in child) {
          this.processElementForCSV(
            child as SubmodelElement,
            [...path, (child as any).idShort || ''],
            rows
          );
        }
      }
    }
  }

  private extractProperties(submodel: Submodel, path: string[], rows: string[][]) {
    if (!submodel.submodelElements) return;

    for (const element of submodel.submodelElements) {
      const currentPath = [...path, element.idShort || ''];

      if ((element as any).modelType === 'Property') {
        rows.push([
          currentPath.join('/'),
          element.idShort || '',
          this.extractValue(element),
          this.extractValueType(element),
          this.extractDescription(element.description),
        ]);
      }

      // Recurse into collections
      if ('value' in element && Array.isArray(element.value)) {
        for (const child of element.value) {
          if (typeof child === 'object' && child !== null && 'submodelElements' in child) {
            this.extractProperties(child as any, currentPath, rows);
          }
        }
      }
    }
  }

  private extractValue(element: any): string {
    if (!('value' in element)) return '';

    const value = element.value;

    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value)) {
      // Multi-language property
      if (value.length > 0 && typeof value[0] === 'object' && 'text' in value[0]) {
        return value.map((v: any) => `[${v.language}] ${v.text}`).join('; ');
      }
      return JSON.stringify(value);
    }

    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }

    return String(value);
  }

  private extractValueType(element: any): string {
    return element.valueType || '';
  }

  private extractDescription(description: any): string {
    if (!description || !Array.isArray(description)) return '';
    if (description.length === 0) return '';

    // Return English description if available, otherwise first one
    const enDesc = description.find((d: any) => d.language === 'en');
    return enDesc ? enDesc.text : description[0].text;
  }

  private extractSemanticId(semanticId: any): string {
    if (!semanticId || !semanticId.keys || !Array.isArray(semanticId.keys)) return '';
    return semanticId.keys.map((key: any) => key.value).join('/');
  }

  private escapeCSV(value: string): string {
    if (!value) return '';

    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
  }
}

// Singleton instance
export const exportService = new ExportService();
