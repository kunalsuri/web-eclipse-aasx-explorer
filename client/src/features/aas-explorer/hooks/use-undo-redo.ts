/**
 * Undo/Redo Hook
 * React hook for undo/redo functionality
 * 
 * Features:
 * - Subscribe to undo service state changes
 * - Provide undo/redo actions
 * - Expose state for UI (can undo/redo, descriptions)
 */

import { useEffect, useState, useCallback } from 'react';
import { undoService, type UndoServiceState } from '../services/undo-service';

export function useUndoRedo() {
  const [state, setState] = useState<UndoServiceState>(undoService.getState());

  useEffect(() => {
    // Subscribe to state changes
    const unsubscribe = undoService.subscribe((newState) => {
      setState(newState);
    });

    // Cleanup on unmount
    return unsubscribe;
  }, []);

  const undo = useCallback(async () => {
    try {
      await undoService.undo();
    } catch (error) {
      console.error('Undo failed:', error);
      throw error;
    }
  }, []);

  const redo = useCallback(async () => {
    try {
      await undoService.redo();
    } catch (error) {
      console.error('Redo failed:', error);
      throw error;
    }
  }, []);

  const clear = useCallback(() => {
    undoService.clear();
  }, []);

  return {
    ...state,
    undo,
    redo,
    clear,
  };
}
