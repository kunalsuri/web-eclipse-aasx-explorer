/**
 * Edit State Context
 * Global state management for editing operations across the application
 */

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

interface EditAction {
  readonly type: 'update' | 'create' | 'delete';
  readonly elementId: string;
  readonly elementType: string;
  readonly oldValue: any;
  readonly newValue: any;
  readonly timestamp: number;
}

interface EditStateContextType {
  readonly isEditMode: boolean;
  readonly dirtyElements: Set<string>;
  readonly undoStack: EditAction[];
  readonly redoStack: EditAction[];
  readonly validationErrors: Map<string, string[]>;
  readonly enterEditMode: () => void;
  readonly exitEditMode: () => void;
  readonly markDirty: (elementId: string) => void;
  readonly markClean: (elementId: string) => void;
  readonly addAction: (action: EditAction) => void;
  readonly undo: () => void;
  readonly redo: () => void;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly setValidationErrors: (elementId: string, errors: string[]) => void;
  readonly clearValidationErrors: (elementId: string) => void;
  readonly hasUnsavedChanges: boolean;
  readonly clearAll: () => void;
}

const EditStateContext = createContext<EditStateContextType | undefined>(undefined);

const MAX_UNDO_STACK_SIZE = 50;

export function EditStateProvider({ children }: { readonly children: ReactNode }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [dirtyElements, setDirtyElements] = useState<Set<string>>(new Set());
  const [undoStack, setUndoStack] = useState<EditAction[]>([]);
  const [redoStack, setRedoStack] = useState<EditAction[]>([]);
  const [validationErrors, setValidationErrorsState] = useState<Map<string, string[]>>(new Map());

  const enterEditMode = useCallback(() => {
    setIsEditMode(true);
  }, []);

  const exitEditMode = useCallback(() => {
    setIsEditMode(false);
  }, []);

  const markDirty = useCallback((elementId: string) => {
    setDirtyElements((prev) => new Set(prev).add(elementId));
  }, []);

  const markClean = useCallback((elementId: string) => {
    setDirtyElements((prev) => {
      const next = new Set(prev);
      next.delete(elementId);
      return next;
    });
  }, []);

  const addAction = useCallback((action: EditAction) => {
    setUndoStack((prev) => {
      const next = [...prev, action];
      // Limit stack size
      if (next.length > MAX_UNDO_STACK_SIZE) {
        return next.slice(-MAX_UNDO_STACK_SIZE);
      }
      return next;
    });
    // Clear redo stack when new action is added
    setRedoStack([]);
    markDirty(action.elementId);
  }, [markDirty]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;

    const action = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, action]);
    
    // If no more actions for this element, mark it clean
    const hasMoreActions = undoStack.slice(0, -1).some((a) => a.elementId === action.elementId);
    if (!hasMoreActions) {
      markClean(action.elementId);
    }
  }, [undoStack, markClean]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    const action = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, action]);
    markDirty(action.elementId);
  }, [redoStack, markDirty]);

  const setValidationErrors = useCallback((elementId: string, errors: string[]) => {
    setValidationErrorsState((prev) => {
      const next = new Map(prev);
      if (errors.length > 0) {
        next.set(elementId, errors);
      } else {
        next.delete(elementId);
      }
      return next;
    });
  }, []);

  const clearValidationErrors = useCallback((elementId: string) => {
    setValidationErrorsState((prev) => {
      const next = new Map(prev);
      next.delete(elementId);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setDirtyElements(new Set());
    setUndoStack([]);
    setRedoStack([]);
    setValidationErrorsState(new Map());
  }, []);

  const value: EditStateContextType = useMemo(() => ({
    isEditMode,
    dirtyElements,
    undoStack,
    redoStack,
    validationErrors,
    enterEditMode,
    exitEditMode,
    markDirty,
    markClean,
    addAction,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    setValidationErrors,
    clearValidationErrors,
    hasUnsavedChanges: dirtyElements.size > 0,
    clearAll,
  }), [isEditMode, dirtyElements, undoStack, redoStack, validationErrors, enterEditMode, exitEditMode, markDirty, markClean, addAction, undo, redo, setValidationErrors, clearValidationErrors, clearAll]);

  return <EditStateContext.Provider value={value}>{children}</EditStateContext.Provider>;
}

export function useEditState() {
  const context = useContext(EditStateContext);
  if (context === undefined) {
    throw new Error('useEditState must be used within an EditStateProvider');
  }
  return context;
}
