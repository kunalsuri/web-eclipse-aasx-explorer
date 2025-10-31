/**
 * Base Dictionary Adapter
 * Converted from C# IDataProvider and DataProviderBase
 * 
 * Based on: x-external-proj/src/AasxDictionaryImport/Model.cs
 */

import type {
  DictionaryConcept,
  SearchOptions,
  AutocompleteSuggestion,
  DictionarySource,
} from '../../../../shared/dictionary-types';

/**
 * Dictionary adapter interface
 * Provides access to a dictionary repository (ECLASS or IEC CDD)
 */
export interface DictionaryAdapter {
  /**
   * The name of the dictionary source
   */
  readonly name: string;

  /**
   * The dictionary source type
   */
  readonly source: DictionarySource;

  /**
   * Search for concepts matching the query
   */
  search(query: string, options?: SearchOptions): Promise<DictionaryConcept[]>;

  /**
   * Get a concept by its ID
   */
  getById(conceptId: string): Promise<DictionaryConcept>;

  /**
   * Get autocomplete suggestions for a query
   */
  autocomplete(query: string, limit: number): Promise<AutocompleteSuggestion[]>;

  /**
   * Validate connection to the dictionary service
   */
  validateConnection(): Promise<boolean>;
}

/**
 * Base implementation of DictionaryAdapter with common functionality
 */
export abstract class BaseDictionaryAdapter implements DictionaryAdapter {
  abstract readonly name: string;
  abstract readonly source: DictionarySource;

  /**
   * Search for concepts matching the query
   */
  abstract search(query: string, options?: SearchOptions): Promise<DictionaryConcept[]>;

  /**
   * Get a concept by its ID
   */
  abstract getById(conceptId: string): Promise<DictionaryConcept>;

  /**
   * Get autocomplete suggestions for a query
   */
  async autocomplete(query: string, limit: number): Promise<AutocompleteSuggestion[]> {
    // Default implementation: use search and convert to suggestions
    const results = await this.search(query, { limit });
    return results.map((concept, index) => ({
      id: concept.id,
      label: concept.preferredName[0]?.text || concept.id,
      source: this.source,
      category: concept.category,
      matchScore: 100 - index, // Simple scoring based on result order
      hierarchicalPosition: concept.hierarchicalPosition,
    }));
  }

  /**
   * Validate connection to the dictionary service
   */
  async validateConnection(): Promise<boolean> {
    try {
      // Try a simple search to validate connection
      await this.search('test', { limit: 1 });
      return true;
    } catch (error) {
      console.error(`Connection validation failed for ${this.name}:`, error);
      return false;
    }
  }

  /**
   * Helper method to handle API errors
   */
  protected handleError(error: unknown, context: string): never {
    if (error instanceof Error) {
      throw new Error(`${this.name} ${context}: ${error.message}`);
    }
    throw new Error(`${this.name} ${context}: Unknown error`);
  }

  /**
   * Helper method to implement retry logic with exponential backoff
   */
  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < maxAttempts) {
          const delay = initialDelay * Math.pow(2, attempt - 1);
          console.warn(`${this.name} attempt ${attempt} failed, retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }

  /**
   * Helper method to sleep for a specified duration
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Helper method to validate required fields in a concept
   */
  protected validateConcept(concept: Partial<DictionaryConcept>): concept is DictionaryConcept {
    if (!concept.id) {
      throw new Error('Concept must have an ID');
    }
    if (!concept.preferredName || concept.preferredName.length === 0) {
      throw new Error('Concept must have a preferred name');
    }
    return true;
  }
}
