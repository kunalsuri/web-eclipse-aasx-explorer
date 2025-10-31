/**
 * Dictionary API Client
 * Functions for interacting with dictionary backend API
 * 
 * Based on C# Import.cs patterns
 */

import type {
  DictionaryConcept,
  SearchOptions,
  AutocompleteSuggestion,
  DictionarySource,
  ValidationResult,
  CacheStatistics,
} from '../../../../../shared/dictionary-types';
import type { ConceptDescription } from '../../../../../shared/aas-v3-types';

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Search response data
 */
interface SearchResponseData {
  results: DictionaryConcept[];
  query: string;
  source: string;
  total: number;
  limit: number;
  offset: number;
}

/**
 * Autocomplete response data
 */
interface AutocompleteResponseData {
  suggestions: AutocompleteSuggestion[];
  query: string;
}

/**
 * Search for concepts in dictionaries
 */
export async function searchDictionary(
  query: string,
  options?: SearchOptions & { source?: 'eclass' | 'ieccdd' | 'all' }
): Promise<DictionaryConcept[]> {
  const params = new URLSearchParams({
    q: query,
    source: options?.source || 'all',
  });

  if (options?.limit) {
    params.append('limit', options.limit.toString());
  }
  if (options?.offset) {
    params.append('offset', options.offset.toString());
  }
  if (options?.sortBy) {
    params.append('sortBy', options.sortBy);
  }
  if (options?.sortOrder) {
    params.append('sortOrder', options.sortOrder);
  }

  const response = await fetch(`/api/dictionary/search?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiResponse<never> = await response.json();
    throw new Error(error.error || 'Failed to search dictionary');
  }

  const result: ApiResponse<SearchResponseData> = await response.json();
  return result.data?.results || [];
}

/**
 * Get autocomplete suggestions
 */
export async function getAutocomplete(
  query: string,
  limit: number = 10
): Promise<AutocompleteSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
  });

  const response = await fetch(`/api/dictionary/autocomplete?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiResponse<never> = await response.json();
    throw new Error(error.error || 'Failed to get autocomplete suggestions');
  }

  const result: ApiResponse<AutocompleteResponseData> = await response.json();
  return result.data?.suggestions || [];
}

/**
 * Get a specific concept by ID
 */
export async function getConceptById(
  source: DictionarySource,
  conceptId: string
): Promise<DictionaryConcept> {
  const response = await fetch(
    `/api/dictionary/concept/${source}/${encodeURIComponent(conceptId)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error: ApiResponse<never> = await response.json();
    throw new Error(error.error || 'Failed to get concept');
  }

  const result: ApiResponse<DictionaryConcept> = await response.json();
  if (!result.data) {
    throw new Error('Concept not found');
  }

  return result.data;
}

/**
 * Import a concept as ConceptDescription
 */
export async function importConcept(
  concept: DictionaryConcept,
  fileId?: string
): Promise<ConceptDescription> {
  const response = await fetch('/api/dictionary/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      concept,
      fileId,
    }),
  });

  if (!response.ok) {
    const error: ApiResponse<never> = await response.json();
    throw new Error(error.error || 'Failed to import concept');
  }

  const result: ApiResponse<ConceptDescription> = await response.json();
  if (!result.data) {
    throw new Error('Import failed');
  }

  return result.data;
}

/**
 * Validate a concept against AAS V3 requirements
 */
export async function validateConcept(
  concept: DictionaryConcept
): Promise<ValidationResult> {
  const response = await fetch('/api/dictionary/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      concept,
    }),
  });

  if (!response.ok) {
    const error: ApiResponse<never> = await response.json();
    throw new Error(error.error || 'Failed to validate concept');
  }

  const result: ApiResponse<ValidationResult> = await response.json();
  if (!result.data) {
    throw new Error('Validation failed');
  }

  return result.data;
}

/**
 * Clear dictionary cache
 */
export async function clearCache(source?: DictionarySource): Promise<void> {
  const url = source
    ? `/api/dictionary/cache/${source}`
    : '/api/dictionary/cache';

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiResponse<never> = await response.json();
    throw new Error(error.error || 'Failed to clear cache');
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<CacheStatistics> {
  const response = await fetch('/api/dictionary/cache/stats', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiResponse<never> = await response.json();
    throw new Error(error.error || 'Failed to get cache stats');
  }

  const result: ApiResponse<CacheStatistics> = await response.json();
  if (!result.data) {
    throw new Error('Failed to get cache stats');
  }

  return result.data;
}

/**
 * Search ECLASS dictionary
 */
export async function searchECLASS(
  query: string,
  options?: SearchOptions
): Promise<DictionaryConcept[]> {
  return searchDictionary(query, { ...options, source: 'eclass' });
}

/**
 * Search IEC CDD dictionary
 */
export async function searchIECCDD(
  query: string,
  options?: SearchOptions
): Promise<DictionaryConcept[]> {
  return searchDictionary(query, { ...options, source: 'ieccdd' });
}

/**
 * Search all dictionaries
 */
export async function searchAll(
  query: string,
  options?: SearchOptions
): Promise<DictionaryConcept[]> {
  return searchDictionary(query, { ...options, source: 'all' });
}
