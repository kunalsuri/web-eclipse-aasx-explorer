/**
 * Selection Store
 * 
 * Zustand store for managing element selection (single and multi-select).
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface SelectionState {
  selectedIds: Set<string>;
  lastSelectedId: string | null;
  anchorId: string | null; // For shift-click range selection
  
  // Actions
  select: (id: string, mode?: SelectionMode) => void;
  selectRange: (startId: string, endId: string, allIds: string[]) => void;
  selectAll: (ids: string[]) => void;
  deselect: (id: string) => void;
  deselectAll: () => void;
  toggle: (id: string) => void;
  
  // Queries
  isSelected: (id: string) => boolean;
  getSelectedIds: () => string[];
  getSelectedCount: () => number;
  hasSelection: () => boolean;
}

export type SelectionMode = 'single' | 'add' | 'range';

// ============================================================================
// Store Implementation
// ============================================================================

export const useSelectionStore = create<SelectionState>()(
  devtools(
    (set, get) => ({
      selectedIds: new Set(),
      lastSelectedId: null,
      anchorId: null,

      // Select element(s)
      select: (id, mode = 'single') => {
        set((state) => {
          const newSelectedIds = new Set(state.selectedIds);

          if (mode === 'single') {
            // Single select - replace selection
            newSelectedIds.clear();
            newSelectedIds.add(id);
            return {
              selectedIds: newSelectedIds,
              lastSelectedId: id,
              anchorId: id,
            };
          } else if (mode === 'add') {
            // Add to selection (Ctrl+Click)
            if (newSelectedIds.has(id)) {
              newSelectedIds.delete(id);
            } else {
              newSelectedIds.add(id);
            }
            return {
              selectedIds: newSelectedIds,
              lastSelectedId: id,
              anchorId: id,
            };
          }

          return state;
        });
      },

      // Select range (Shift+Click)
      selectRange: (startId, endId, allIds) => {
        const startIndex = allIds.indexOf(startId);
        const endIndex = allIds.indexOf(endId);

        if (startIndex === -1 || endIndex === -1) {
          return;
        }

        const minIndex = Math.min(startIndex, endIndex);
        const maxIndex = Math.max(startIndex, endIndex);

        const rangeIds = allIds.slice(minIndex, maxIndex + 1);

        set((state) => {
          const newSelectedIds = new Set(state.selectedIds);
          rangeIds.forEach(id => newSelectedIds.add(id));

          return {
            selectedIds: newSelectedIds,
            lastSelectedId: endId,
            // Keep anchor for next range selection
          };
        });
      },

      // Select all
      selectAll: (ids) => {
        set({
          selectedIds: new Set(ids),
          lastSelectedId: ids[ids.length - 1] || null,
          anchorId: ids[0] || null,
        });
      },

      // Deselect element
      deselect: (id) => {
        set((state) => {
          const newSelectedIds = new Set(state.selectedIds);
          newSelectedIds.delete(id);

          return {
            selectedIds: newSelectedIds,
            lastSelectedId: state.lastSelectedId === id ? null : state.lastSelectedId,
          };
        });
      },

      // Deselect all
      deselectAll: () => {
        set({
          selectedIds: new Set(),
          lastSelectedId: null,
          anchorId: null,
        });
      },

      // Toggle selection
      toggle: (id) => {
        set((state) => {
          const newSelectedIds = new Set(state.selectedIds);

          if (newSelectedIds.has(id)) {
            newSelectedIds.delete(id);
          } else {
            newSelectedIds.add(id);
          }

          return {
            selectedIds: newSelectedIds,
            lastSelectedId: id,
            anchorId: id,
          };
        });
      },

      // Check if element is selected
      isSelected: (id) => {
        return get().selectedIds.has(id);
      },

      // Get selected IDs as array
      getSelectedIds: () => {
        return Array.from(get().selectedIds);
      },

      // Get count of selected elements
      getSelectedCount: () => {
        return get().selectedIds.size;
      },

      // Check if any elements are selected
      hasSelection: () => {
        return get().selectedIds.size > 0;
      },
    }),
    { name: 'SelectionStore' }
  )
);

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access selection state
 */
export function useSelection() {
  const select = useSelectionStore((state) => state.select);
  const selectRange = useSelectionStore((state) => state.selectRange);
  const selectAll = useSelectionStore((state) => state.selectAll);
  const deselect = useSelectionStore((state) => state.deselect);
  const deselectAll = useSelectionStore((state) => state.deselectAll);
  const toggle = useSelectionStore((state) => state.toggle);
  const selectedIds = useSelectionStore((state) => Array.from(state.selectedIds));
  const selectedCount = useSelectionStore((state) => state.selectedIds.size);
  const hasSelection = useSelectionStore((state) => state.selectedIds.size > 0);
  const anchorId = useSelectionStore((state) => state.anchorId);

  return {
    select,
    selectRange,
    selectAll,
    deselect,
    deselectAll,
    toggle,
    selectedIds,
    selectedCount,
    hasSelection,
    anchorId,
  };
}

/**
 * Hook to check if element is selected
 */
export function useIsSelected(id: string) {
  return useSelectionStore((state) => state.selectedIds.has(id));
}

/**
 * Hook to handle click with modifiers
 */
export function useSelectionClick() {
  const { select, selectRange, anchorId } = useSelection();

  return (id: string, allIds: string[], event: React.MouseEvent) => {
    if (event.shiftKey && anchorId) {
      // Range selection
      selectRange(anchorId, id, allIds);
    } else if (event.ctrlKey || event.metaKey) {
      // Add to selection
      select(id, 'add');
    } else {
      // Single selection
      select(id, 'single');
    }
  };
}
