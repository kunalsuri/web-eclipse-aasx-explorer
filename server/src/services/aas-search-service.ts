/**
 * AAS Search Service
 * Backend service for managing search operations
 */

import { AASSearchEngine } from '../../../shared/aas-search-engine';
import type { Environment } from '../../../shared/aas-v3-types';
import type {
  SearchResult,
  SearchOptions,
  SearchStatistics,
} from '../../../shared/aas-search-types';
import type { AdvancedFilterOptions } from '../../../shared/aas-search-filters';

/**
 * Search service for managing AAS search operations
 */
export class AASSearchService {
  private searchEngines: Map<string, AASSearchEngine> = new Map();

  /**
   * Index an environment for a specific file
   */
  public indexEnvironment(fileId: string, environment: Environment): void {
    let engine = this.searchEngines.get(fileId);

    if (!engine) {
      engine = new AASSearchEngine();
      this.searchEngines.set(fileId, engine);
    }

    engine.indexEnvironment(environment);
  }

  /**
   * Search within a specific file
   */
  public search(fileId: string, options: SearchOptions, filters?: AdvancedFilterOptions): SearchResult[] {
    const engine = this.searchEngines.get(fileId);

    if (!engine) {
      throw new Error(`No search index found for file: ${fileId}`);
    }

    const startTime = performance.now();
    const results = engine.search(options, filters);
    const endTime = performance.now();

    // Add search time to results metadata
    results.forEach((result) => {
      (result as any).searchTime = endTime - startTime;
    });

    return results;
  }

  /**
   * Get search statistics for a file
   */
  public getStatistics(fileId: string, query: string, results: SearchResult[]): SearchStatistics {
    const engine = this.searchEngines.get(fileId);

    if (!engine) {
      throw new Error(`No search index found for file: ${fileId}`);
    }

    return engine.getStatistics(query, results);
  }

  /**
   * Clear search index for a specific file
   */
  public clearIndex(fileId: string): void {
    const engine = this.searchEngines.get(fileId);

    if (engine) {
      engine.clearIndex();
      this.searchEngines.delete(fileId);
    }
  }

  /**
   * Clear all search indices
   */
  public clearAllIndices(): void {
    for (const engine of this.searchEngines.values()) {
      engine.clearIndex();
    }
    this.searchEngines.clear();
  }

  /**
   * Check if a file has been indexed
   */
  public isIndexed(fileId: string): boolean {
    return this.searchEngines.has(fileId);
  }

  /**
   * Get index size for a file
   */
  public getIndexSize(fileId: string): number {
    const engine = this.searchEngines.get(fileId);
    return engine ? engine.getIndexSize() : 0;
  }

  /**
   * Get total number of indexed files
   */
  public getIndexedFileCount(): number {
    return this.searchEngines.size;
  }

  /**
   * Search by property value
   */
  public searchByPropertyValue(
    fileId: string,
    value: string,
    options?: Partial<SearchOptions>
  ): SearchResult[] {
    const engine = this.searchEngines.get(fileId);

    if (!engine) {
      throw new Error(`No search index found for file: ${fileId}`);
    }

    return engine.searchByPropertyValue(value, options);
  }

  /**
   * Search by ID or idShort
   */
  public searchById(fileId: string, id: string, options?: Partial<SearchOptions>): SearchResult[] {
    const engine = this.searchEngines.get(fileId);

    if (!engine) {
      throw new Error(`No search index found for file: ${fileId}`);
    }

    return engine.searchById(id, options);
  }

  /**
   * Search by semantic ID
   */
  public searchBySemanticId(
    fileId: string,
    semanticId: string,
    options?: Partial<SearchOptions>
  ): SearchResult[] {
    const engine = this.searchEngines.get(fileId);

    if (!engine) {
      throw new Error(`No search index found for file: ${fileId}`);
    }

    return engine.searchBySemanticId(semanticId, options);
  }

  /**
   * Search by description
   */
  public searchByDescription(
    fileId: string,
    description: string,
    options?: Partial<SearchOptions>
  ): SearchResult[] {
    const engine = this.searchEngines.get(fileId);

    if (!engine) {
      throw new Error(`No search index found for file: ${fileId}`);
    }

    return engine.searchByDescription(description, options);
  }

  /**
   * Search by display name
   */
  public searchByDisplayName(
    fileId: string,
    displayName: string,
    options?: Partial<SearchOptions>
  ): SearchResult[] {
    const engine = this.searchEngines.get(fileId);

    if (!engine) {
      throw new Error(`No search index found for file: ${fileId}`);
    }

    return engine.searchByDisplayName(displayName, options);
  }

  /**
   * Search by category
   */
  public searchByCategory(
    fileId: string,
    category: string,
    options?: Partial<SearchOptions>
  ): SearchResult[] {
    const engine = this.searchEngines.get(fileId);

    if (!engine) {
      throw new Error(`No search index found for file: ${fileId}`);
    }

    return engine.searchByCategory(category, options);
  }
}

// Singleton instance
export const aasSearchService = new AASSearchService();
