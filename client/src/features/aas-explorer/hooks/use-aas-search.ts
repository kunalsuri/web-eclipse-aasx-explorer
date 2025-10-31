/**
 * useAASSearch Hook
 * Custom hook for AAS search functionality
 */

import { useState, useCallback } from 'react';
import type { SearchResult, SearchOptions } from '../../../../../shared/aas-search-types';
import type { AdvancedFilterOptions } from '../../../../../shared/aas-search-filters';

interface UseAASSearchResult {
  search: (options: SearchOptions, filters?: AdvancedFilterOptions) => Promise<void>;
  results: SearchResult[];
  isSearching: boolean;
  error: string | null;
  statistics: {
    totalResults: number;
    searchTime: number;
    indexSize: number;
    query: string;
  } | null;
  clearResults: () => void;
}

export function useAASSearch(fileId: string): UseAASSearchResult {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<{
    totalResults: number;
    searchTime: number;
    indexSize: number;
    query: string;
  } | null>(null);

  const search = useCallback(
    async (options: SearchOptions, filters?: AdvancedFilterOptions) => {
      if (!options.query || !options.query.trim()) {
        setResults([]);
        setStatistics(null);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const response = await fetch(`/api/aasx/${fileId}/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...options,
            filters,
          }),
        });

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
          setResults(data.results || []);
          setStatistics(data.statistics || null);
        } else {
          throw new Error(data.error || 'Search failed');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        setResults([]);
        setStatistics(null);
      } finally {
        setIsSearching(false);
      }
    },
    [fileId]
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setStatistics(null);
    setError(null);
  }, []);

  return {
    search,
    results,
    isSearching,
    error,
    statistics,
    clearResults,
  };
}
