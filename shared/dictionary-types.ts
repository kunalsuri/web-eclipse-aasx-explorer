/**
 * Dictionary Integration Type Definitions
 * Converted from C# AasxDictionaryImport namespace
 * 
 * Based on:
 * - x-external-proj/src/AasxDictionaryImport/Model.cs
 * - x-external-proj/src/AasxDictionaryImport/Iec61360Utils.cs
 */

import type {
  DataTypeDefXsd,
  LangStringDefinitionTypeIec61360,
  LangStringPreferredNameTypeIec61360,
  LangStringShortNameTypeIec61360,
  Reference,
} from './aas-v3-types';

// ============================================================================
// Enumerations
// ============================================================================

/**
 * Dictionary source enumeration
 */
export enum DictionarySource {
  ECLASS = 'eclass',
  IECCDD = 'ieccdd',
}

/**
 * The type of a data source
 */
export enum DataSourceType {
  /** A source in the default search path */
  Default = 'default',
  /** A custom data source, usually provided by the user */
  Custom = 'custom',
  /** An export performed directly using the network */
  Online = 'online',
}

// ============================================================================
// Core Dictionary Types
// ============================================================================

/**
 * Unified dictionary concept
 * Represents a concept from either ECLASS or IEC CDD
 */
export interface DictionaryConcept {
  // Identification
  id: string;
  source: DictionarySource;
  version?: string;
  revision?: string;

  
  // Names and descriptions (multi-language support)
  preferredName: LangStringPreferredNameTypeIec61360[];
  shortName?: LangStringShortNameTypeIec61360[];
  definition?: LangStringDefinitionTypeIec61360[];
  
  // Classification
  classificationPath?: string[];
  category?: string;
  hierarchicalPosition?: string;
  
  // Data specification (IEC 61360)
  dataType?: DataTypeDefXsd;
  unit?: string;
  unitId?: string;
  valueFormat?: string;
  valueList?: ValueList;
  
  // Metadata
  sourceOfDefinition?: string;
  symbol?: string;
  
  // Additional properties
  properties?: Record<string, unknown>;
  
  // UI helpers
  displayName?: string;
  detailsUrl?: string;
}

/**
 * Value list for concept descriptions
 */
export interface ValueList {
  valueReferencePairs: ValueReferencePair[];
}

/**
 * Pair of value and reference
 */
export interface ValueReferencePair {
  value: string;
  valueId: Reference;
}

/**
 * Autocomplete suggestion
 */
export interface AutocompleteSuggestion {
  id: string;
  label: string;
  source: DictionarySource;
  category?: string;
  matchScore: number;
  hierarchicalPosition?: string;
}

/**
 * Search options
 */
export interface SearchOptions {
  limit?: number;
  offset?: number;
  filters?: SearchFilters;
  sortBy?: 'relevance' | 'name' | 'id' | 'hierarchicalPosition';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Search filters
 */
export interface SearchFilters {
  dataType?: DataTypeDefXsd[];
  unit?: string[];
  category?: string[];
  hasValueList?: boolean;
  classificationPath?: string[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
}

/**
 * Search history entry
 */
export interface SearchHistoryEntry {
  id: string;
  query: string;
  source: DictionarySource;
  timestamp: number;
  resultCount: number;
}

/**
 * Cache statistics
 */
export interface CacheStatistics {
  totalEntries: number;
  sizeInBytes: number;
  hitRate: number;
  missRate: number;
  oldestEntry: number;
  newestEntry: number;
}

// ============================================================================
// IEC 61360 Data Types (from Iec61360Utils.cs)
// ============================================================================

/**
 * Multi-language string
 * Converted from C# MultiString class
 */
export class MultiString {
  private data: Map<string, string>;
  private static readonly DEFAULT_LANGUAGE_CODE = 'en';

  constructor(data?: Record<string, string>) {
    this.data = new Map(Object.entries(data || {}));
  }

  /**
   * All languages that are supported by the data model
   */
  get languages(): string[] {
    return Array.from(this.data.keys());
  }

  /**
   * All languages that have a non-empty value
   */
  get availableLanguages(): string[] {
    return this.languages.filter(lang => this.data.get(lang)?.length ?? 0 > 0);
  }

  /**
   * All values for this attribute
   */
  get values(): string[] {
    return Array.from(this.data.values());
  }

  /**
   * The default language - English if available, otherwise the first available language
   */
  get defaultLanguage(): string {
    if (this.availableLanguages.includes(MultiString.DEFAULT_LANGUAGE_CODE)) {
      return MultiString.DEFAULT_LANGUAGE_CODE;
    }
    return this.availableLanguages[0] || '';
  }

  /**
   * Adds the given value for the given language
   */
  add(lang: string, value: string): void {
    if (!this.data.has(lang)) {
      this.data.set(lang, value);
    }
  }

  /**
   * Returns the value for the given language, or an empty string if no value is set
   */
  get(lang: string): string {
    return this.data.get(lang) || '';
  }

  /**
   * Returns the value in the default language
   */
  getDefault(): string {
    return this.get(this.defaultLanguage);
  }

  /**
   * Converts to LangStringDefinitionTypeIec61360 array
   */
  toLangStringDefinitionTypeIec61360(): LangStringDefinitionTypeIec61360[] {
    const result: LangStringDefinitionTypeIec61360[] = [];
    for (const lang of this.languages) {
      const value = this.get(lang);
      if (value.length > 0) {
        result.push({ language: lang, text: value });
      }
    }
    return result;
  }

  /**
   * Converts to LangStringPreferredNameTypeIec61360 array
   */
  toLangStringPreferredNameTypeIec61360(): LangStringPreferredNameTypeIec61360[] {
    const result: LangStringPreferredNameTypeIec61360[] = [];
    for (const lang of this.languages) {
      const value = this.get(lang);
      if (value.length > 0) {
        result.push({ language: lang, text: value });
      }
    }
    return result;
  }

  /**
   * Converts to LangStringShortNameTypeIec61360 array
   */
  toLangStringShortNameTypeIec61360(): LangStringShortNameTypeIec61360[] {
    const result: LangStringShortNameTypeIec61360[] = [];
    for (const lang of this.languages) {
      const value = this.get(lang);
      if (value.length > 0) {
        result.push({ language: lang, text: value });
      }
    }
    return result;
  }

  toString(): string {
    return this.getDefault();
  }
}

/**
 * IEC 61360 data for an element
 * Converted from C# Iec61360Data class
 */
export interface Iec61360Data {
  // Identification
  irdi: string;
  idShort?: string;
  
  // Names and descriptions
  preferredName: MultiString;
  shortName?: MultiString;
  definition?: MultiString;
  
  // Metadata
  definitionSource?: string;
  symbol?: string;
  
  // Unit information (for properties)
  unit?: string;
  unitIrdi?: string;
  
  // Data type information (for properties)
  dataType?: string;
  dataFormat?: string;
}

// ============================================================================
// Data Provider Interfaces (from Model.cs)
// ============================================================================

/**
 * Unknown reference to an element that could not be resolved
 */
export interface UnknownReference {
  id: string;
  type: string;
}

/**
 * Import exception
 */
export class ImportException extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'ImportException';
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates an idShort from the given string
 * Converted from C# Iec61360Utils.CreateIdShort
 */
export function createIdShort(s: string): string {
  const chars: string[] = [];
  let start = true;
  let newWord = true;

  for (const c of s) {
    if (start) {
      if (!/[a-zA-Z]/.test(c)) {
        continue;
      }
    }

    start = false;

    if (/[\s_]/.test(c)) {
      // Treat spaces and underscores as word boundaries
      newWord = true;
    } else if (/[a-zA-Z0-9]/.test(c)) {
      chars.push(newWord ? c.toUpperCase() : c);
      newWord = false;
    }
  }

  return chars.join('');
}

/**
 * Creates an UnknownReference object
 */
export function createUnknownReference(id: string, type: string): UnknownReference {
  return { id, type };
}
