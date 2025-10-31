import { useState, useEffect, useCallback, useRef } from 'react';
import { getAutocomplete } from '../api/dictionary-api';
import type { AutocompleteSuggestion } from '@shared/dictionary-types';

const DEBOUNCE_DELAY = 300; // milliseconds
const MAX_SUGGESTIONS = 10;
const MIN_QUERY_LENGTH = 2;

interface UseAutocompleteOptions {
  debounceDelay?: number;
  maxSuggestions?: number;
  minQueryLength?: number;
  enabled?: boolean;
}

/**
 * Custom hook for dictionary autocomplete with debouncing
 * Provides autocomplete suggestions with 300ms debounce and relevance ranking
 */
export function useAutocomplete(
  query: string,
  options: UseAutocompleteOptions = {}
) {
  const {
    debounceDelay = DEBOUNCE_DELAY,
    maxSuggestions = MAX_SUGGESTIONS,
    minQueryLength = MIN_QUERY_LENGTH,
    enabled = true,
  } = options;

  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track the current request to cancel outdated ones
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch autocomplete suggestions
   */
  const fetchSuggestions = useCallback(
    async (searchQuery: string) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsLoading(true);
      setError(null);

      try {
        const results = await getAutocomplete(searchQuery, maxSuggestions);

        // Only update if this request wasn't aborted
        if (!abortController.signal.aborted) {
          // Rank suggestions by relevance
          const rankedResults = rankSuggestions(results, searchQuery);
          setSuggestions(rankedResults.slice(0, maxSuggestions));
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          const error = err instanceof Error ? err : new Error('Autocomplete failed');
          setError(error);
          setSuggestions([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [maxSuggestions]
  );

  /**
   * Debounced autocomplete effect
   */
  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Reset state if query is too short or disabled
    if (!enabled || !query || query.length < minQueryLength) {
      setSuggestions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Set up debounced fetch
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, debounceDelay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, enabled, minQueryLength, debounceDelay, fetchSuggestions]);

  /**
   * Clear suggestions
   */
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  /**
   * Retry last query
   */
  const retry = useCallback(() => {
    if (query && query.length >= minQueryLength) {
      fetchSuggestions(query);
    }
  }, [query, minQueryLength, fetchSuggestions]);

  return {
    suggestions,
    isLoading,
    error,
    clearSuggestions,
    retry,
  };
}

/**
 * Rank suggestions by relevance to the query
 */
function rankSuggestions(
  suggestions: AutocompleteSuggestion[],
  query: string
): AutocompleteSuggestion[] {
  const lowerQuery = query.toLowerCase();

  return suggestions
    .map((suggestion) => ({
      ...suggestion,
      matchScore: calculateMatchScore(suggestion, lowerQuery),
    }))
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Calculate match score for ranking
 * Higher score = better match
 */
function calculateMatchScore(
  suggestion: AutocompleteSuggestion,
  lowerQuery: string
): number {
  const label = suggestion.label.toLowerCase();
  const id = suggestion.id.toLowerCase();

  // Exact match (highest priority)
  if (label === lowerQuery || id === lowerQuery) {
    return 100;
  }

  // Starts with query (high priority)
  if (label.startsWith(lowerQuery)) {
    return 90;
  }
  if (id.startsWith(lowerQuery)) {
    return 85;
  }

  // Contains query at word boundary (medium-high priority)
  const wordBoundaryRegex = new RegExp(`\\b${escapeRegex(lowerQuery)}`, 'i');
  if (wordBoundaryRegex.test(label)) {
    return 75;
  }

  // Contains query anywhere (medium priority)
  if (label.includes(lowerQuery)) {
    return 60;
  }
  if (id.includes(lowerQuery)) {
    return 55;
  }

  // Fuzzy match (low priority)
  const fuzzyScore = fuzzyMatch(label, lowerQuery);
  if (fuzzyScore > 0.5) {
    return 40 + fuzzyScore * 10;
  }

  // Use existing matchScore if available
  return suggestion.matchScore || 0;
}

/**
 * Simple fuzzy matching algorithm
 * Returns a score between 0 and 1
 */
function fuzzyMatch(text: string, pattern: string): number {
  let patternIdx = 0;
  let textIdx = 0;
  let matches = 0;

  while (textIdx < text.length && patternIdx < pattern.length) {
    if (text[textIdx] === pattern[patternIdx]) {
      matches++;
      patternIdx++;
    }
    textIdx++;
  }

  // All pattern characters must be found
  if (patternIdx !== pattern.length) {
    return 0;
  }

  // Score based on match density
  return matches / text.length;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}
