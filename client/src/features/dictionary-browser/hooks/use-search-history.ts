import { useState, useEffect, useCallback } from 'react';
import type { DictionarySource, SearchHistoryEntry } from '@shared/dictionary-types';

const STORAGE_KEY = 'dictionary-search-history';
const MAX_HISTORY_ENTRIES = 50;
const MAX_AGE_DAYS = 30;

/**
 * Custom hook for managing dictionary search history
 * Stores last 50 searches in localStorage with 30-day expiration
 */
export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    loadHistory();
  }, []);

  /**
   * Load history from localStorage and remove expired entries
   */
  const loadHistory = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setHistory([]);
        return;
      }

      const parsed: SearchHistoryEntry[] = JSON.parse(stored);
      const now = Date.now();
      const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

      // Filter out expired entries
      const validEntries = parsed.filter(
        (entry) => now - entry.timestamp < maxAge
      );

      setHistory(validEntries);

      // Update localStorage if entries were removed
      if (validEntries.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(validEntries));
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
      setHistory([]);
    }
  }, []);

  /**
   * Add a new search to history
   */
  const addToHistory = useCallback(
    (query: string, source: DictionarySource, resultCount: number = 0) => {
      if (!query.trim()) return;

      const newEntry: SearchHistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        query: query.trim(),
        source,
        timestamp: Date.now(),
        resultCount,
      };

      setHistory((prev) => {
        // Remove duplicate queries (same query and source)
        const filtered = prev.filter(
          (entry) => !(entry.query === newEntry.query && entry.source === newEntry.source)
        );

        // Add new entry at the beginning
        const updated = [newEntry, ...filtered];

        // Keep only the last MAX_HISTORY_ENTRIES
        const trimmed = updated.slice(0, MAX_HISTORY_ENTRIES);

        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        } catch (error) {
          console.error('Failed to save search history:', error);
        }

        return trimmed;
      });
    },
    []
  );

  /**
   * Get all history entries
   */
  const getHistory = useCallback(() => {
    return history;
  }, [history]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  }, []);

  /**
   * Remove a specific entry from history
   */
  const removeEntry = useCallback((entryId: string) => {
    setHistory((prev) => {
      const updated = prev.filter((entry) => entry.id !== entryId);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to update search history:', error);
      }

      return updated;
    });
  }, []);

  /**
   * Get recent searches (last N entries)
   */
  const getRecentSearches = useCallback(
    (limit: number = 10) => {
      return history.slice(0, limit);
    },
    [history]
  );

  return {
    history,
    addToHistory,
    getHistory,
    clearHistory,
    removeEntry,
    getRecentSearches,
  };
}
