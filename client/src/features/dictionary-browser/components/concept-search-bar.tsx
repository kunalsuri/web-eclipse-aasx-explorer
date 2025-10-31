/**
 * Concept Search Bar Component
 * 
 * Search input with autocomplete dropdown and recent searches
 * Implements debounced search with 300ms delay
 */

import { useState, useCallback, useRef } from 'react';
import { Search, X, Clock, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAutocomplete } from '../hooks/use-autocomplete';
import { useSearchHistory } from '../hooks/use-search-history';
import type { DictionarySource, AutocompleteSuggestion } from '@shared/dictionary-types';

interface ConceptSearchBarProps {
  readonly source: DictionarySource;
  readonly onSearch: (query: string) => void;
  readonly onFilterClick?: () => void;
  readonly placeholder?: string;
}

export function ConceptSearchBar({
  source,
  onSearch,
  onFilterClick,
  placeholder = 'Search concepts...',
}: ConceptSearchBarProps) {
  const [query, setQuery] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { suggestions, isLoading } = useAutocomplete(query, { enabled: showAutocomplete });
  const { getRecentSearches, addToHistory } = useSearchHistory();

  // Get recent searches for this source
  const recentSearches = getRecentSearches(10).filter((entry) => entry.source === source);

  /**
   * Handle search submission
   */
  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      setShowAutocomplete(false);
      setShowHistory(false);
      onSearch(searchQuery);
      addToHistory(searchQuery, source);
    },
    [onSearch, addToHistory, source]
  );

  /**
   * Handle input change
   */
  const handleInputChange = useCallback((value: string) => {
    setQuery(value);
    setShowAutocomplete(value.length >= 2);
    setShowHistory(false);
  }, []);

  /**
   * Handle suggestion selection
   */
  const handleSuggestionSelect = useCallback(
    (suggestion: AutocompleteSuggestion) => {
      setQuery(suggestion.label);
      handleSearch(suggestion.label);
    },
    [handleSearch]
  );

  /**
   * Handle history entry selection
   */
  const handleHistorySelect = useCallback(
    (historyQuery: string) => {
      setQuery(historyQuery);
      handleSearch(historyQuery);
    },
    [handleSearch]
  );

  /**
   * Handle clear button
   */
  const handleClear = useCallback(() => {
    setQuery('');
    setShowAutocomplete(false);
    setShowHistory(false);
    inputRef.current?.focus();
  }, []);

  /**
   * Handle input focus
   */
  const handleFocus = useCallback(() => {
    if (!query && recentSearches.length > 0) {
      setShowHistory(true);
    } else if (query.length >= 2) {
      setShowAutocomplete(true);
    }
  }, [query, recentSearches.length]);

  /**
   * Handle input blur
   */
  const handleBlur = useCallback(() => {
    // Delay to allow click on suggestions
    setTimeout(() => {
      setShowAutocomplete(false);
      setShowHistory(false);
    }, 200);
  }, []);

  /**
   * Handle Enter key
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSearch(query);
      } else if (e.key === 'Escape') {
        setShowAutocomplete(false);
        setShowHistory(false);
        inputRef.current?.blur();
      }
    },
    [query, handleSearch]
  );

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Button */}
        {onFilterClick && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onFilterClick}
            aria-label="Open filters"
          >
            <Filter className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {showAutocomplete && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {isLoading && (
            <div className="p-4 text-center text-sm text-gray-600 dark:text-gray-400">
              Loading suggestions...
            </div>
          )}
          {!isLoading && suggestions.length > 0 && (
            <ul className="max-h-64 overflow-y-auto py-1">
              {suggestions.map((suggestion) => (
                <li key={suggestion.id}>
                  <button
                    type="button"
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {suggestion.label}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {suggestion.id}
                        </div>
                      </div>
                      {suggestion.category && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {suggestion.category}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!isLoading && suggestions.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-600 dark:text-gray-400">
              No suggestions found
            </div>
          )}
        </div>
      )}

      {/* Recent Searches Dropdown */}
      {showHistory && recentSearches.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              Recent Searches
            </div>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {recentSearches.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => handleHistorySelect(entry.query)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {entry.query}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {entry.resultCount} results
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
