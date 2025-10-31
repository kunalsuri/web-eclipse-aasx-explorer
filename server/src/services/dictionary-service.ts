/**
 * Dictionary Service
 * Orchestrates dictionary operations across multiple sources
 * 
 * Based on C# Import.cs and Model.cs patterns
 */

import type {
  DictionaryConcept,
  SearchOptions,
  AutocompleteSuggestion,
  ValidationResult,
  CacheStatistics,
} from '../../../shared/dictionary-types';
import { DictionarySource } from '../../../shared/dictionary-types';
import type { ConceptDescription } from '../../../shared/aas-v3-types';
import { EclassAdapter } from './dictionary-adapters/eclass-adapter';
import { IecCddAdapter } from './dictionary-adapters/ieccdd-adapter';
import type { DictionaryAdapter } from './dictionary-adapters/base-adapter';
import NodeCache from 'node-cache';
import { loadDictionaryConfig } from '../utils/dictionary-config';

/**
 * Main dictionary service for orchestrating dictionary operations
 */
export class DictionaryService {
  private adapters: Map<DictionarySource, DictionaryAdapter>;
  private cache: NodeCache;
  private config = loadDictionaryConfig();

  constructor() {
    // Initialize adapters
    this.adapters = new Map<DictionarySource, DictionaryAdapter>();
    this.adapters.set(DictionarySource.ECLASS, new EclassAdapter());
    this.adapters.set(DictionarySource.IECCDD, new IecCddAdapter());

    // Initialize cache with TTL from config
    this.cache = new NodeCache({
      stdTTL: this.config.cache.serverTTL,
      checkperiod: 600, // Check for expired keys every 10 minutes
      maxKeys: this.config.cache.maxEntries,
      useClones: false, // Don't clone objects for better performance
    });

    // Log cache statistics periodically
    this.cache.on('expired', (key, value) => {
      console.log(`Cache key expired: ${key}`);
    });
  }

  /**
   * Search ECLASS dictionary
   */
  async searchECLASS(query: string, options?: SearchOptions): Promise<DictionaryConcept[]> {
    return this.searchWithCache(DictionarySource.ECLASS, query, options);
  }

  /**
   * Search IEC CDD dictionary
   */
  async searchIECCDD(query: string, options?: SearchOptions): Promise<DictionaryConcept[]> {
    return this.searchWithCache(DictionarySource.IECCDD, query, options);
  }

  /**
   * Search all dictionaries
   */
  async searchAll(query: string, options?: SearchOptions): Promise<DictionaryConcept[]> {
    const [eclassResults, ieccddResults] = await Promise.allSettled([
      this.searchECLASS(query, options),
      this.searchIECCDD(query, options),
    ]);

    const results: DictionaryConcept[] = [];

    if (eclassResults.status === 'fulfilled') {
      results.push(...eclassResults.value);
    } else {
      console.error('ECLASS search failed:', eclassResults.reason);
    }

    if (ieccddResults.status === 'fulfilled') {
      results.push(...ieccddResults.value);
    } else {
      console.error('IEC CDD search failed:', ieccddResults.reason);
    }

    // Sort by relevance if needed
    if (options?.sortBy === 'relevance') {
      return this.sortByRelevance(results, query);
    }

    return results;
  }

  /**
   * Get concept by ID from specific source
   */
  async getConceptById(source: DictionarySource, conceptId: string): Promise<DictionaryConcept> {
    const cacheKey = this.getCacheKey(source, 'concept', conceptId);
    
    // Check cache first
    const cached = this.cache.get<DictionaryConcept>(cacheKey);
    if (cached) {
      console.log(`Cache hit: ${cacheKey}`);
      return cached;
    }

    // Fetch from adapter
    const adapter = this.getAdapter(source);
    const concept = await adapter.getById(conceptId);

    // Store in cache
    this.cache.set(cacheKey, concept);
    console.log(`Cache miss: ${cacheKey} - stored in cache`);

    return concept;
  }

  /**
   * Get autocomplete suggestions from all sources
   */
  async getAutocompleteSuggestions(query: string, limit: number = 10): Promise<AutocompleteSuggestion[]> {
    const cacheKey = this.getCacheKey('all', 'autocomplete', query, limit.toString());
    
    // Check cache first
    const cached = this.cache.get<AutocompleteSuggestion[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from all adapters
    const [eclassResults, ieccddResults] = await Promise.allSettled([
      this.adapters.get(DictionarySource.ECLASS)!.autocomplete(query, Math.ceil(limit / 2)),
      this.adapters.get(DictionarySource.IECCDD)!.autocomplete(query, Math.ceil(limit / 2)),
    ]);

    const suggestions: AutocompleteSuggestion[] = [];

    if (eclassResults.status === 'fulfilled') {
      suggestions.push(...eclassResults.value);
    }
    if (ieccddResults.status === 'fulfilled') {
      suggestions.push(...ieccddResults.value);
    }

    // Sort by match score and limit
    const sorted = suggestions
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    // Store in cache
    this.cache.set(cacheKey, sorted);

    return sorted;
  }

  /**
   * Import concept as ConceptDescription
   */
  async importConcept(concept: DictionaryConcept): Promise<ConceptDescription> {
    // Validate concept first
    const validation = await this.validateConcept(concept);
    if (!validation.isValid) {
      throw new Error(`Concept validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Transform to ConceptDescription
    const { transformToConceptDescription } = await import('./dictionary-transformation');
    return transformToConceptDescription(concept);
  }

  /**
   * Validate concept against AAS V3 requirements
   */
  async validateConcept(concept: DictionaryConcept): Promise<ValidationResult> {
    const { validateConcept } = await import('./dictionary-validation');
    return validateConcept(concept);
  }

  /**
   * Clear cache for specific source or all sources
   */
  async clearCache(source?: DictionarySource): Promise<void> {
    if (source) {
      // Clear cache for specific source
      const keys = this.cache.keys();
      const sourcePrefix = `${source}:`;
      const keysToDelete = keys.filter(key => key.startsWith(sourcePrefix));
      this.cache.del(keysToDelete);
      console.log(`Cleared ${keysToDelete.length} cache entries for ${source}`);
    } else {
      // Clear all cache
      this.cache.flushAll();
      console.log('Cleared all cache entries');
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStatistics> {
    const stats = this.cache.getStats();
    const keys = this.cache.keys();
    
    // Calculate cache size (approximate)
    let sizeInBytes = 0;
    keys.forEach(key => {
      const value = this.cache.get(key);
      if (value) {
        sizeInBytes += JSON.stringify(value).length;
      }
    });

    // Find oldest and newest entries
    let oldestEntry = Date.now();
    let newestEntry = 0;
    
    keys.forEach(key => {
      const ttl = this.cache.getTtl(key);
      if (ttl) {
        const createdAt = Date.now() - (this.config.cache.serverTTL * 1000 - (ttl - Date.now()));
        oldestEntry = Math.min(oldestEntry, createdAt);
        newestEntry = Math.max(newestEntry, createdAt);
      }
    });

    return {
      totalEntries: stats.keys,
      sizeInBytes,
      hitRate: stats.hits / (stats.hits + stats.misses) || 0,
      missRate: stats.misses / (stats.hits + stats.misses) || 0,
      oldestEntry: oldestEntry === Date.now() ? 0 : oldestEntry,
      newestEntry,
    };
  }

  /**
   * Search with caching
   */
  private async searchWithCache(
    source: DictionarySource,
    query: string,
    options?: SearchOptions
  ): Promise<DictionaryConcept[]> {
    const cacheKey = this.getCacheKey(source, 'search', query, JSON.stringify(options || {}));
    
    // Check cache first
    const cached = this.cache.get<DictionaryConcept[]>(cacheKey);
    if (cached) {
      console.log(`Cache hit: ${cacheKey}`);
      return cached;
    }

    // Fetch from adapter
    const adapter = this.getAdapter(source);
    const results = await adapter.search(query, options);

    // Store in cache
    this.cache.set(cacheKey, results);
    console.log(`Cache miss: ${cacheKey} - stored ${results.length} results in cache`);

    return results;
  }

  /**
   * Get adapter for source
   */
  private getAdapter(source: DictionarySource): DictionaryAdapter {
    const adapter = this.adapters.get(source);
    if (!adapter) {
      throw new Error(`No adapter found for source: ${source}`);
    }
    return adapter;
  }

  /**
   * Generate cache key
   */
  private getCacheKey(...parts: string[]): string {
    return parts.join(':');
  }

  /**
   * Sort results by relevance to query
   */
  private sortByRelevance(results: DictionaryConcept[], query: string): DictionaryConcept[] {
    const q = query.toLowerCase();
    
    return results.sort((a, b) => {
      const aName = a.preferredName[0]?.text.toLowerCase() || '';
      const bName = b.preferredName[0]?.text.toLowerCase() || '';
      const aId = a.id.toLowerCase();
      const bId = b.id.toLowerCase();

      // Exact match scores highest
      if (aName === q || aId === q) return -1;
      if (bName === q || bId === q) return 1;

      // Starts with query
      if (aName.startsWith(q) || aId.startsWith(q)) return -1;
      if (bName.startsWith(q) || bId.startsWith(q)) return 1;

      // Contains query
      if (aName.includes(q) || aId.includes(q)) return -1;
      if (bName.includes(q) || bId.includes(q)) return 1;

      return 0;
    });
  }
}

// Singleton instance
export const dictionaryService = new DictionaryService();
