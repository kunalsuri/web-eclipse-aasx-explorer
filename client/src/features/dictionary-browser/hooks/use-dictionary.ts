/**
 * useDictionary Hook
 * Main hook for dictionary search operations
 */

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  DictionaryConcept,
  SearchOptions,
  DictionarySource,
  SearchFilters,
  AutocompleteSuggestion,
} from '../../../../../shared/dictionary-types';
import * as dictionaryApi from '../api/dictionary-api';
import { getCached, setCached } from '../utils/dictionary-cache';

interface UseDictionaryReturn {
  // Search operations
  search: (query: string, source?: DictionarySource | 'all') => Promise<void>;
  autocomplete: (query: string) => Promise<AutocompleteSuggestion[]>;
  
  // State
  results: DictionaryConcept[];
  isLoading: boolean;
  error: Error | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  setPage: (page: number) => void;
  
  // Filters
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  
  // Selection
  selectedConcepts: DictionaryConcept[];
  toggleSelection: (concept: DictionaryConcept) => void;
  clearSelection: () => void;
}

const RESULTS_PER_PAGE = 20;

export function useDictionary(): UseDictionaryReturn {
  const [results, setResults] = useState<DictionaryConcept[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [selectedConcepts, setSelectedConcepts] = useState<DictionaryConcept[]>([]);

  /**
   * Search for concepts
   */
  const search = useCallback(async (
    query: string,
    source: DictionarySource | 'all' = 'all'
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const options: SearchOptions & { source?: 'eclass' | 'ieccdd' | 'all' } = {
        limit: RESULTS_PER_PAGE,
        offset: (currentPage - 1) * RESULTS_PER_PAGE,
        filters,
        source: source as 'eclass' | 'ieccdd' | 'all',
      };

      const searchResults = await dictionaryApi.searchDictionary(query, options);
      
      // Cache results
      for (const concept of searchResults) {
        await setCached(concept.source, concept.id, concept);
      }
      
      setResults(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Search failed'));
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters]);

  /**
   * Get autocomplete suggestions
   */
  const autocomplete = useCallback(async (query: string): Promise<AutocompleteSuggestion[]> => {
    try {
      return await dictionaryApi.getAutocomplete(query, 10);
    } catch (err) {
      console.error('Autocomplete error:', err);
      return [];
    }
  }, []);

  /**
   * Set current page
   */
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  /**
   * Toggle concept selection
   */
  const toggleSelection = useCallback((concept: DictionaryConcept) => {
    setSelectedConcepts(prev => {
      const isSelected = prev.some(c => c.id === concept.id);
      if (isSelected) {
        return prev.filter(c => c.id !== concept.id);
      } else {
        // Limit to 4 concepts for comparison
        if (prev.length >= 4) {
          return [...prev.slice(1), concept];
        }
        return [...prev, concept];
      }
    });
  }, []);

  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    setSelectedConcepts([]);
  }, []);

  // Calculate total pages
  const totalPages = Math.ceil(results.length / RESULTS_PER_PAGE);

  return {
    search,
    autocomplete,
    results,
    isLoading,
    error,
    currentPage,
    totalPages,
    setPage,
    filters,
    setFilters,
    selectedConcepts,
    toggleSelection,
    clearSelection,
  };
}
