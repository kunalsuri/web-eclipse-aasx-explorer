/**
 * useBulkSelection Hook
 * Custom hook for managing multi-select operations on AAS elements
 * 
 * Features:
 * - Ctrl+Click for toggle selection
 * - Shift+Click for range selection
 * - Select all / Clear all
 * - Selection persistence
 * - Keyboard navigation support
 */

import { useState, useCallback, useEffect } from 'react';

interface UseBulkSelectionOptions {
  multiSelect?: boolean;
  persistSelection?: boolean;
  storageKey?: string;
  maxSelection?: number;
  onSelectionChange?: (selectedIds: Set<string>) => void;
}

interface UseBulkSelectionResult {
  selectedIds: Set<string>;
  isSelected: (id: string) => boolean;
  toggleSelection: (id: string, event?: React.MouseEvent) => void;
  selectSingle: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  selectRange: (startId: string, endId: string, allIds: string[]) => void;
  getSelectedItems: <T>(items: T[], getId: (item: T) => string) => T[];
  selectedCount: number;
  lastSelectedId: string | null;
}

export function useBulkSelection(options: UseBulkSelectionOptions = {}): UseBulkSelectionResult {
  const {
    multiSelect = true,
    persistSelection = false,
    storageKey = 'bulk-selection',
    maxSelection,
    onSelectionChange,
  } = options;

  // Load initial selection from storage if persistence is enabled
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    if (persistSelection && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          return new Set(JSON.parse(stored));
        }
      } catch (error) {
        console.warn('Failed to load selection from storage:', error);
      }
    }
    return new Set();
  });

  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const isSelected = useCallback(
    (id: string) => {
      return selectedIds.has(id);
    },
    [selectedIds]
  );

  // Persist selection to storage
  useEffect(() => {
    if (persistSelection && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(selectedIds)));
      } catch (error) {
        console.warn('Failed to save selection to storage:', error);
      }
    }
    
    // Notify selection change
    if (onSelectionChange) {
      onSelectionChange(selectedIds);
    }
  }, [selectedIds, persistSelection, storageKey, onSelectionChange]);

  const toggleSelection = useCallback(
    (id: string, event?: React.MouseEvent) => {
      if (!multiSelect && event && !event.ctrlKey && !event.metaKey) {
        // Single select mode
        setSelectedIds(new Set([id]));
        setLastSelectedId(id);
        return;
      }

      setSelectedIds((prev) => {
        const next = new Set(prev);
        
        // Check max selection limit
        if (maxSelection && !next.has(id) && next.size >= maxSelection) {
          console.warn(`Maximum selection limit (${maxSelection}) reached`);
          return prev;
        }
        
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
      setLastSelectedId(id);
    },
    [multiSelect, maxSelection]
  );

  const selectSingle = useCallback((id: string) => {
    setSelectedIds(new Set([id]));
    setLastSelectedId(id);
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectRange = useCallback(
    (startId: string, endId: string, allIds: string[]) => {
      const startIndex = allIds.indexOf(startId);
      const endIndex = allIds.indexOf(endId);

      if (startIndex === -1 || endIndex === -1) {
        return;
      }

      const [min, max] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
      const rangeIds = allIds.slice(min, max + 1);

      setSelectedIds((prev) => {
        const next = new Set(prev);
        
        // Check max selection limit
        if (maxSelection) {
          const potentialSize = next.size + rangeIds.filter(id => !next.has(id)).length;
          if (potentialSize > maxSelection) {
            console.warn(`Range selection would exceed maximum limit (${maxSelection})`);
            return prev;
          }
        }
        
        rangeIds.forEach((id) => next.add(id));
        return next;
      });
      setLastSelectedId(endId);
    },
    [maxSelection]
  );

  const getSelectedItems = useCallback(
    <T,>(items: T[], getId: (item: T) => string): T[] => {
      return items.filter((item) => selectedIds.has(getId(item)));
    },
    [selectedIds]
  );

  return {
    selectedIds,
    isSelected,
    toggleSelection,
    selectSingle,
    selectAll,
    clearSelection,
    selectRange,
    getSelectedItems,
    selectedCount: selectedIds.size,
    lastSelectedId,
  };
}
