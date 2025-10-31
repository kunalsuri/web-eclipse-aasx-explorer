/**
 * ECLASS Dictionary Adapter
 * Converted from C# Eclass namespace
 * 
 * Based on: x-external-proj/src/AasxDictionaryImport/Eclass/Model.cs
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
 * ECLASS adapter for accessing ECLASS dictionary data
 * Supports both XML file parsing and REST API access
 */
export class EclassAdapter extends BaseDictionaryAdapter {
  readonly name = 'ECLASS';
  readonly source = DictionarySource.ECLASS;

  private client: AxiosInstance;
  private config = loadDictionaryConfig().eclass;

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
   * Search for ECLASS concepts
   */
  async search(query: string, options?: SearchOptions): Promise<DictionaryConcept[]> {
    return this.retryWithBackoff(async () => {
      try {
        // ECLASS REST API endpoint for search
        const response = await this.client.get('/classes', {
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
   * Get ECLASS concept by ID (IRDI)
   */
  async getById(conceptId: string): Promise<DictionaryConcept> {
    return this.retryWithBackoff(async () => {
      try {
        // ECLASS REST API endpoint for single concept
        const response = await this.client.get(`/classes/${encodeURIComponent(conceptId)}`);
        
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
      hierarchicalPosition: concept.hierarchicalPosition,
    }));
  }

  /**
   * Transform ECLASS API response to DictionaryConcept
   */
  private transformConcept(data: any): DictionaryConcept {
    const preferredName = this.extractMultiLanguageField(data, 'preferredName');
    const definition = this.extractMultiLanguageField(data, 'definition');
    const shortName = this.extractMultiLanguageField(data, 'shortName');

    const concept: DictionaryConcept = {
      id: data.id || data.irdi,
      source: this.source,
      version: data.version,
      revision: data.revision,
      preferredName: preferredName.toLangStringPreferredNameTypeIec61360(),
      shortName: shortName.toLangStringShortNameTypeIec61360(),
      definition: definition.toLangStringDefinitionTypeIec61360(),
      hierarchicalPosition: data.hierarchicalPosition || data.hierarchical_position,
      category: this.determineCategory(data),
      classificationPath: this.extractClassificationPath(data),
      displayName: this.createDisplayName(preferredName.getDefault(), data.id),
      detailsUrl: this.createDetailsUrl(data.id),
    };

    // Add property-specific fields if this is a property
    if (data.dataType || data.data_type) {
      concept.dataType = this.mapDataType(data.dataType || data.data_type);
      concept.unit = data.unit;
      concept.unitId = data.unitIrdi || data.unit_irdi;
      concept.symbol = data.symbol;
      concept.valueFormat = data.valueFormat || data.value_format;
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
   */
  private extractMultiLanguageField(data: any, fieldName: string): MultiString {
    const ms = new MultiString();
    const field = data[fieldName];

    if (!field) {
      return ms;
    }

    // Handle array format: [{ language: 'en', text: 'value' }]
    if (Array.isArray(field)) {
      field.forEach((item: any) => {
        if (item.language && item.text) {
          ms.add(item.language, item.text);
        } else if (item.lang && item.value) {
          ms.add(item.lang, item.value);
        }
      });
    }
    // Handle object format: { en: 'value', de: 'Wert' }
    else if (typeof field === 'object') {
      Object.entries(field).forEach(([lang, value]) => {
        if (typeof value === 'string') {
          ms.add(lang, value);
        }
      });
    }
    // Handle simple string (assume English)
    else if (typeof field === 'string') {
      ms.add('en', field);
    }

    return ms;
  }

  /**
   * Extract classification path from hierarchical position
   */
  private extractClassificationPath(data: any): string[] | undefined {
    const hierarchicalPosition = data.hierarchicalPosition || data.hierarchical_position;
    
    if (!hierarchicalPosition) {
      return undefined;
    }

    // ECLASS hierarchical position format: "27-01-02-03"
    // Split into segments
    const segments = hierarchicalPosition.split('-').filter((s: string) => s.length > 0);
    
    // Build cumulative path
    const path: string[] = [];
    let current = '';
    for (const segment of segments) {
      current = current ? `${current}-${segment}` : segment;
      path.push(current);
    }
    
    return path;
  }

  /**
   * Determine category from ECLASS data
   */
  private determineCategory(data: any): string | undefined {
    // Check if it's a classification class or application class
    if (data.classificationClassIds || data.classification_class_ids) {
      return 'ApplicationClass';
    }
    if (data.applicationClasses || data.application_classes) {
      return 'ClassificationClass';
    }
    if (data.type === 'property' || data.modelType === 'Property') {
      return 'Property';
    }
    return data.category;
  }

  /**
   * Map ECLASS data type to AAS DataTypeDefXsd
   */
  private mapDataType(eclassType: string): DataTypeDefXsd | undefined {
    const lowerType = eclassType.toLowerCase();
    
    if (lowerType.includes('string') || lowerType.includes('translatable')) {
      return DataTypeDefXsd.String;
    }
    if (lowerType.includes('real') || lowerType.includes('measure') || lowerType.includes('currency')) {
      return DataTypeDefXsd.Double;
    }
    if (lowerType.includes('integer') || lowerType.includes('int') || lowerType.includes('count')) {
      return DataTypeDefXsd.Int;
    }
    if (lowerType.includes('boolean')) {
      return DataTypeDefXsd.Boolean;
    }
    if (lowerType.includes('date') && lowerType.includes('time')) {
      return DataTypeDefXsd.DateTime;
    }
    if (lowerType.includes('date')) {
      return DataTypeDefXsd.Date;
    }
    if (lowerType.includes('time')) {
      return DataTypeDefXsd.Time;
    }
    if (lowerType.includes('url') || lowerType.includes('uri')) {
      return DataTypeDefXsd.AnyUri;
    }
    
    return DataTypeDefXsd.String; // Default fallback
  }

  /**
   * Create display name for UI
   */
  private createDisplayName(name: string, id: string): string {
    if (id.includes('BASIC')) {
      return `${name} (ECLASS Basic)`;
    }
    if (id.includes('ADVANCED')) {
      return `${name} (ECLASS Advanced)`;
    }
    return name;
  }

  /**
   * Create details URL for ECLASS concept
   */
  private createDetailsUrl(id: string): string {
    return `https://eclass.eu/en/eclass-standard/content-suche/show/${encodeURIComponent(id)}`;
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
    const hierarchical = concept.hierarchicalPosition?.replace(/-/g, '') || '';

    // Exact match
    if (name === q || id === q) {
      return 100;
    }

    // Starts with query
    if (name.startsWith(q) || id.startsWith(q) || hierarchical.startsWith(q.replace(/-/g, ''))) {
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
