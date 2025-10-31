/**
 * useDictionaryCache Hook
 * Hook for managing IndexedDB cache operations
 */

import { useState, useCallback, useEffect } from 'react';
import type { DictionaryConcept, DictionarySource } from '../../../../../shared/dictionary-types';
import * as cache from '../utils/dictionary-cache';

interface UseDictionaryCacheReturn {
  // Cache operations
  getCached: (source: DictionarySource, conceptId: string) => Promise<DictionaryConcept | null>;
  setCached: (source: DictionarySource, conceptId: string, concept: DictionaryConcept) => Promise<void>;
  clearCache: (source?: DictionarySource) => Promise<void>;
  
  // Cache stats
  cacheSize: number;
  cacheHitRate: number;
  entryCount: number;
  
  // Loading state
  isLoading: boolean;
}

export function useDictionaryCache(): UseDictionaryCacheReturn {
  const [cacheSize, setCacheSize] = useState(0);
  const [entryCount, setEntryCount] = useState(0);
  const [cacheHits, setCacheHits] = useState(0);
  const [cacheMisses, setCacheMisses] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get cached concept
   */
  const getCached = useCallback(async (
    source: DictionarySource,
    conceptId: string
  ): Promise<DictionaryConcept | null> => {
    try {
      const concept = await cache.getCached(source, conceptId);
      
      if (concept) {
        setCacheHits(prev => prev + 1);
      } else {
        setCacheMisses(prev => prev + 1);
      }
      
      return concept;
    } catch (error) {
      console.error('Error getting cached concept:', error);
      setCacheMisses(prev => prev + 1);
      return null;
    }
  }, []);

  /**
   * Set cached concept
   */
  const setCached = useCallback(async (
    source: DictionarySource,
    conceptId: string,
    concept: DictionaryConcept
  ): Promise<void> => {
    try {
      await cache.setCached(source, conceptId, concept);
      await updateStats();
    } catch (error) {
      console.error('Error setting cached concept:', error);
      throw error;
    }
  }, []);

  /**
   * Clear cache
   */
  const clearCache = useCallback(async (source?: DictionarySource): Promise<void> => {
    setIsLoading(true);
    try {
      if (source) {
        await cache.clearCacheBySource(source);
      } else {
        await cache.clearAllCache();
      }
      await updateStats();
      
      // Reset hit/miss counters
      setCacheHits(0);
      setCacheMisses(0);
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update cache statistics
   */
  const updateStats = useCallback(async () => {
    try {
      const size = await cache.getCacheSize();
      const count = await cache.getCacheEntryCount();
      
      setCacheSize(size);
      setEntryCount(count);
    } catch (error) {
      console.error('Error updating cache stats:', error);
    }
  }, []);

  /**
   * Calculate cache hit rate
   */
  const cacheHitRate = cacheHits + cacheMisses > 0
    ? cacheHits / (cacheHits + cacheMisses)
    : 0;

  /**
   * Load initial stats
   */
  useEffect(() => {
    updateStats();
  }, [updateStats]);

  return {
    getCached,
    setCached,
    clearCache,
    cacheSize,
    cacheHitRate,
    entryCount,
    isLoading,
  };
}
