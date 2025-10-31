/**
 * IEC CDD Dictionary Adapter
 * Converted from C# Cdd namespace
 * 
 * Based on: x-external-proj/src/AasxDictionaryImport/Cdd/Model.cs
 */

import axios, { AxiosInstance } from 'axios';
import type {
  DictionaryConcept,
  SearchOptions,
  AutocompleteSuggestion,
} from '../../../../shared/dictionary-types';
import { DictionarySource } from '../../../../shared/dictionary-types';
import { BaseDictionaryAdapter } from './base-adapter';
import { loadDictionaryConfig } from '../../utils/dictionary-config';
import { MultiString, createIdShort } from '../../../../shared/dictionary-types';
import { DataTypeDefXsd } from '../../../../shared/aas-v3-types';

/**
 * IEC CDD adapter for accessing IEC Common Data Dictionary
 * Supports REST API access to IEC CDD
 */
export class IecCddAdapter extends BaseDictionaryAdapter {
  readonly name = 'IEC CDD';
  readonly source = DictionarySource.IECCDD;

  private client: AxiosInstance;
  private config = loadDictionaryConfig().ieccdd;

  constructor() {
    super();
    
    this.client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
      },
    });
  }

  /**
   * Search for IEC CDD concepts
   */
  async search(query: string, options?: SearchOptions): Promise<DictionaryConcept[]> {
    return this.retryWithBackoff(async () => {
      try {
        // IEC CDD REST API endpoint for search
        const response = await this.client.get('/search', {
          params: {
            q: query,
            limit: options?.limit || 20,
            offset: options?.offset || 0,
          },
        });

        return this.transformSearchResults(response.data);
      } catch (error) {
        this.handleError(error, 'search failed');
      }
    }, this.config.retryAttempts, this.config.retryDelay);
  }

  /**
   * Get IEC CDD concept by ID (IRDI)
   */
  async getById(conceptId: string): Promise<DictionaryConcept> {
    return this.retryWithBackoff(async () => {
      try {
        // IEC CDD REST API endpoint for single concept
        const response = await this.client.get(`/concepts/${encodeURIComponent(conceptId)}`);
        
        return this.transformConcept(response.data);
      } catch (error) {
        this.handleError(error, `getById(${conceptId}) failed`);
      }
    }, this.config.retryAttempts, this.config.retryDelay);
  }

  /**
   * Get autocomplete suggestions
   */
  async autocomplete(query: string, limit: number): Promise<AutocompleteSuggestion[]> {
    // Use search with small limit for autocomplete
    const results = await this.search(query, { limit });
    
    return results.map((concept, index) => ({
      id: concept.id,
      label: this.getPreferredName(concept),
      source: this.source,
      category: concept.category,
      matchScore: this.calculateMatchScore(concept, query, index),
    }));
  }

  /**
   * Transform IEC CDD API response to DictionaryConcept
   */
  private transformConcept(data: any): DictionaryConcept {
    const preferredName = this.extractMultiLanguageField(data, 'preferredName', 'MDC_P004_1');
    const definition = this.extractMultiLanguageField(data, 'definition', 'MDC_P005');
    const shortName = this.extractMultiLanguageField(data, 'shortName', 'MDC_P006');

    const code = data.code || data.id || data.irdi;
    const version = data.version || this.extractAttribute(data, 'MDC_P002_1');
    const revision = data.revision || this.extractAttribute(data, 'MDC_P002_2');

    const concept: DictionaryConcept = {
      id: this.formatIrdi(code, version),
      source: this.source,
      version,
      revision,
      preferredName: preferredName.toLangStringPreferredNameTypeIec61360(),
      shortName: shortName.toLangStringShortNameTypeIec61360(),
      definition: definition.toLangStringDefinitionTypeIec61360(),
      category: this.determineCategory(data),
      sourceOfDefinition: this.extractAttribute(data, 'MDC_P007') || data.definitionSource,
      detailsUrl: this.createDetailsUrl(code),
    };

    // Add property-specific fields
    if (this.isProperty(data)) {
      concept.symbol = this.extractAttribute(data, 'MDC_P008') || data.symbol;
      concept.unit = this.extractAttribute(data, 'MDC_P009') || data.unit || data.primaryUnit;
      concept.unitId = this.extractAttribute(data, 'MDC_P010') || data.unitCode;
      concept.dataType = this.mapDataType(data);
      concept.valueFormat = this.extractAttribute(data, 'MDC_P012') || data.format;
    }

    this.validateConcept(concept);
    return concept;
  }

  /**
   * Transform search results array
   */
  private transformSearchResults(data: any): DictionaryConcept[] {
    const items = Array.isArray(data) ? data : (data.items || data.results || []);
    return items.map((item: any) => this.transformConcept(item));
  }

  /**
   * Extract multi-language field from API response
   * IEC CDD uses attribute codes like "MDC_P004_1.en" for English preferred name
   */
  private extractMultiLanguageField(data: any, fieldName: string, attributeCode?: string): MultiString {
    const ms = new MultiString();
    
    // Try direct field first
    const field = data[fieldName];
    if (field) {
      if (Array.isArray(field)) {
        field.forEach((item: any) => {
          if (item.language && item.text) {
            ms.add(item.language, item.text);
          }
        });
      } else if (typeof field === 'object') {
        Object.entries(field).forEach(([lang, value]) => {
          if (typeof value === 'string') {
            ms.add(lang, value);
          }
        });
      } else if (typeof field === 'string') {
        ms.add('en', field);
      }
    }

    // Try attribute code format (MDC_P004_1.en, MDC_P004_1.de, etc.)
    if (attributeCode && data.attributes) {
      const prefix = `${attributeCode}.`;
      Object.entries(data.attributes).forEach(([key, value]) => {
        if (key.startsWith(prefix) && typeof value === 'string') {
          const lang = key.substring(prefix.length);
          ms.add(lang, value);
        }
      });
    }

    return ms;
  }

  /**
   * Extract attribute value from IEC CDD data
   */
  private extractAttribute(data: any, attributeCode: string): string | undefined {
    if (data.attributes && data.attributes[attributeCode]) {
      return data.attributes[attributeCode];
    }
    return undefined;
  }

  /**
   * Determine if data represents a property
   */
  private isProperty(data: any): boolean {
    return data.type === 'property' || 
           data.elementType === 'property' ||
           data.category === 'Property' ||
           !!data.dataType;
  }

  /**
   * Determine category from IEC CDD data
   */
  private determineCategory(data: any): string | undefined {
    if (data.category) {
      return data.category;
    }
    if (this.isProperty(data)) {
      return 'Property';
    }
    if (data.type === 'class' || data.elementType === 'class') {
      return 'Class';
    }
    return undefined;
  }

  /**
   * Map IEC CDD data type to AAS DataTypeDefXsd
   */
  private mapDataType(data: any): DataTypeDefXsd | undefined {
    const rawDataType = data.dataType || data.rawDataType || this.extractAttribute(data, 'MDC_P011');
    
    if (!rawDataType) {
      return undefined;
    }

    const lowerType = rawDataType.toLowerCase();

    // Simple types
    if (lowerType.includes('string') || lowerType.includes('translatable')) {
      return DataTypeDefXsd.String;
    }
    if (lowerType.includes('real') || lowerType.includes('measure') || lowerType.includes('currency')) {
      return DataTypeDefXsd.Double;
    }
    if (lowerType.includes('int') || lowerType.includes('count')) {
      return DataTypeDefXsd.Int;
    }
    if (lowerType.includes('boolean')) {
      return DataTypeDefXsd.Boolean;
    }
    if (lowerType.includes('datetime') || lowerType.includes('timestamp')) {
      return DataTypeDefXsd.DateTime;
    }
    if (lowerType.includes('date')) {
      return DataTypeDefXsd.Date;
    }
    if (lowerType.includes('time')) {
      return DataTypeDefXsd.Time;
    }
    if (lowerType.includes('uri') || lowerType.includes('url')) {
      return DataTypeDefXsd.AnyUri;
    }
    if (lowerType.includes('binary') || lowerType.includes('base64')) {
      return DataTypeDefXsd.Base64Binary;
    }

    return DataTypeDefXsd.String; // Default fallback
  }

  /**
   * Format IRDI with version
   * Format: {code}#{version}
   */
  private formatIrdi(code: string, version?: string): string {
    if (!version) {
      return code;
    }
    // Pad version to 3 digits
    const paddedVersion = version.padStart(3, '0');
    return `${code}#${paddedVersion}`;
  }

  /**
   * Create details URL for IEC CDD concept
   * Format: https://cdd.iec.ch/cdd/iec{domain}/iec{domain}.nsf/{endpoint}/{encoded-code}
   */
  private createDetailsUrl(code: string): string {
    // Extract domain from code (format: 0112/2///{domain}#{id})
    const match = code.match(/^0112\/2\/\/\/([0-9]+)(_[0-9]+)?#.*$/);
    
    if (!match) {
      return `https://cdd.iec.ch/cdd/`;
    }

    const domain = match[1];
    const encodedCode = code.replace(/\//g, '-').replace(/#/g, '%23');
    const endpoint = 'iec61360class'; // Default endpoint
    
    return `https://cdd.iec.ch/cdd/iec${domain}/iec${domain}.nsf/${endpoint}/${encodedCode}`;
  }

  /**
   * Get preferred name from concept
   */
  private getPreferredName(concept: DictionaryConcept): string {
    return concept.preferredName[0]?.text || concept.id;
  }

  /**
   * Calculate match score for autocomplete
   */
  private calculateMatchScore(concept: DictionaryConcept, query: string, index: number): number {
    const name = this.getPreferredName(concept).toLowerCase();
    const q = query.toLowerCase();
    const id = concept.id.toLowerCase();

    // Exact match
    if (name === q || id === q) {
      return 100;
    }

    // Starts with query
    if (name.startsWith(q) || id.startsWith(q)) {
      return 90;
    }

    // Contains query
    if (name.includes(q) || id.includes(q)) {
      return 70;
    }

    // Position-based score (earlier results score higher)
    return Math.max(50 - index, 10);
  }
}
