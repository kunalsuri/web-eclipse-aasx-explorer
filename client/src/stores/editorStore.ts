/**
 * Editor Store
 * 
 * Zustand store for managing element editing state.
 * Handles active editors, dirty tracking, validation results, and edit history.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Deep clone an object
 */
function cloneDeep<T>(obj: T): T {
  return structuredClone(obj);
}

/**
 * Set a value at a path in an object
 */
function setPath(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys.at(-1)!] = value;
}

// ============================================================================
// Types
// ============================================================================

export interface ValidationError {
  constraintId: string;
  message: string;
  path: string;
  suggestion?: string;
}

export interface ValidationWarning {
  constraintId: string;
  message: string;
  path: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationFeedback {
  elementId: string;
  severity: 'error' | 'warning' | 'info';
  messages: ValidationMessage[];
  timestamp: number;
}

export interface ValidationMessage {
  constraintId: string;
  message: string;
  path: string;
  suggestion?: string;
}

export interface EditorInstance {
  elementId: string;
  elementType: string;
  originalValue: any;
  currentValue: any;
  isDirty: boolean;
  validation: ValidationResult;
  lastModified: number;
}

export interface EditOperation {
  type: 'create' | 'update' | 'delete' | 'move';
  elementId: string;
  before: any;
  after: any;
  timestamp: number;
  userId?: string;
}

interface EditorState {
  // Active editor
  activeEditor: EditorInstance | null;
  
  // Dirty tracking
  dirtyElements: Set<string>;
  
  // Validation results
  validationResults: Map<string, ValidationFeedback>;
  
  // Edit history
  editHistory: EditOperation[];
  historyIndex: number;
  maxHistorySize: number;
  
  // Auto-save
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // milliseconds
  lastSaveTime: number;
  
  // Actions
  openEditor: (element: any) => void;
  closeEditor: () => void;
  updateValue: (path: string, value: any) => void;
  saveEditor: () => Promise<void>;
  discardChanges: () => void;
  validateEditor: () => Promise<void>;
  
  // Validation management
  setValidation: (elementId: string, validation: ValidationFeedback) => void;
  getValidation: (elementId: string) => ValidationFeedback | undefined;
  clearValidation: (elementId: string) => void;
  clearAllValidations: () => void;
  
  // Dirty tracking
  markDirty: (elementId: string) => void;
  markClean: (elementId: string) => void;
  isDirty: (elementId: string) => boolean;
  getDirtyElements: () => string[];
  
  // History management
  addToHistory: (operation: EditOperation) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  
  // Auto-save
  enableAutoSave: (enabled: boolean) => void;
  setAutoSaveInterval: (interval: number) => void;
  triggerAutoSave: () => Promise<void>;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useEditorStore = create<EditorState>()(
  devtools(
    (set, get) => ({
      // Initial state
      activeEditor: null,
      dirtyElements: new Set(),
      validationResults: new Map(),
      editHistory: [],
      historyIndex: -1,
      maxHistorySize: 50,
      autoSaveEnabled: false,
      autoSaveInterval: 5000,
      lastSaveTime: 0,

      // Open an editor for an element
      openEditor: (element) => {
        if (!element) {
          console.warn('Cannot open editor: element is null');
          return;
        }

        const elementId = element.id || element.idShort || '';
        
        set({
          activeEditor: {
            elementId,
            elementType: element.modelType || 'Unknown',
            originalValue: cloneDeep(element),
            currentValue: cloneDeep(element),
            isDirty: false,
            validation: { isValid: true, errors: [], warnings: [] },
            lastModified: Date.now(),
          },
        });
      },

      // Close the active editor
      closeEditor: () => {
        const { activeEditor, dirtyElements } = get();
        
        if (activeEditor?.isDirty) {
          console.warn('Closing editor with unsaved changes');
          dirtyElements.delete(activeEditor.elementId);
        }
        
        set({
          activeEditor: null,
        });
      },

      // Update a value in the active editor
      updateValue: (path, value) => {
        const { activeEditor } = get();
        
        if (!activeEditor) {
          console.warn('No active editor');
          return;
        }

        const newValue = cloneDeep(activeEditor.currentValue);
        setPath(newValue, path, value);

        set({
          activeEditor: {
            ...activeEditor,
            currentValue: newValue,
            isDirty: true,
            lastModified: Date.now(),
          },
        });

        // Mark element as dirty
        get().markDirty(activeEditor.elementId);

        // Trigger validation (debounced in practice)
        get().validateEditor();
      },

      // Save the active editor
      saveEditor: async () => {
        const { activeEditor, addToHistory, markClean } = get();
        
        if (!activeEditor?.isDirty) {
          return;
        }

        try {
          // Create edit operation for history
          const operation: EditOperation = {
            type: 'update',
            elementId: activeEditor.elementId,
            before: activeEditor.originalValue,
            after: activeEditor.currentValue,
            timestamp: Date.now(),
          };

          // API call will be implemented when integrating with backend
          // await api.updateElement(activeEditor.elementId, activeEditor.currentValue);

          // Add to history
          addToHistory(operation);

          // Update editor state
          set({
            activeEditor: {
              ...activeEditor,
              originalValue: cloneDeep(activeEditor.currentValue),
              isDirty: false,
            },
            lastSaveTime: Date.now(),
          });

          // Mark as clean
          markClean(activeEditor.elementId);

        } catch (error) {
          console.error('Failed to save editor:', error);
          throw error;
        }
      },

      // Discard changes in the active editor
      discardChanges: () => {
        const { activeEditor, markClean } = get();
        
        if (!activeEditor) {
          return;
        }

        set({
          activeEditor: {
            ...activeEditor,
            currentValue: cloneDeep(activeEditor.originalValue),
            isDirty: false,
          },
        });

        markClean(activeEditor.elementId);
      },

      // Validate the active editor
      validateEditor: async () => {
        const { activeEditor, setValidation } = get();
        
        if (!activeEditor) {
          return;
        }

        try {
          // Validation API will be integrated with backend
          // const result = await api.validateElement(activeEditor.currentValue);
          
          // Mock validation for now
          const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
          };

          set({
            activeEditor: {
              ...activeEditor,
              validation: result,
            },
          });

          // Update validation feedback
          if (!result.isValid) {
            setValidation(activeEditor.elementId, {
              elementId: activeEditor.elementId,
              severity: 'error',
              messages: result.errors.map(e => ({
                constraintId: e.constraintId,
                message: e.message,
                path: e.path,
                suggestion: e.suggestion,
              })),
              timestamp: Date.now(),
            });
          }

        } catch (error) {
          console.error('Validation failed:', error);
        }
      },

      // Set validation feedback for an element
      setValidation: (elementId, validation) => {
        set((state) => {
          const newMap = new Map(state.validationResults);
          newMap.set(elementId, validation);
          return { validationResults: newMap };
        });
      },

      // Get validation feedback for an element
      getValidation: (elementId) => {
        return get().validationResults.get(elementId);
      },

      // Clear validation for an element
      clearValidation: (elementId) => {
        set((state) => {
          const newMap = new Map(state.validationResults);
          newMap.delete(elementId);
          return { validationResults: newMap };
        });
      },

      // Clear all validations
      clearAllValidations: () => {
        set({ validationResults: new Map() });
      },

      // Mark element as dirty
      markDirty: (elementId) => {
        set((state) => {
          const newSet = new Set(state.dirtyElements);
          newSet.add(elementId);
          return { dirtyElements: newSet };
        });
      },

      // Mark element as clean
      markClean: (elementId) => {
        set((state) => {
          const newSet = new Set(state.dirtyElements);
          newSet.delete(elementId);
          return { dirtyElements: newSet };
        });
      },

      // Check if element is dirty
      isDirty: (elementId) => {
        return get().dirtyElements.has(elementId);
      },

      // Get all dirty elements
      getDirtyElements: () => {
        return Array.from(get().dirtyElements);
      },

      // Add operation to history
      addToHistory: (operation) => {
        set((state) => {
          const newHistory = [
            ...state.editHistory.slice(0, state.historyIndex + 1),
            operation,
          ];

          // Prune history if it exceeds max size
          if (newHistory.length > state.maxHistorySize) {
            newHistory.shift();
          }

          return {
            editHistory: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      // Undo last operation
      undo: async () => {
        const { historyIndex } = get();
        
        if (historyIndex < 0) {
          console.warn('Nothing to undo');
          return;
        }

        try {
          // API call will be implemented when integrating with backend
          // const { editHistory } = get();
          // const operation = editHistory[historyIndex];
          // await api.updateElement(operation.elementId, operation.before);

          set({
            historyIndex: historyIndex - 1,
          });

        } catch (error) {
          console.error('Undo failed:', error);
          throw error;
        }
      },

      // Redo last undone operation
      redo: async () => {
        const { editHistory, historyIndex } = get();
        
        if (historyIndex >= editHistory.length - 1) {
          console.warn('Nothing to redo');
          return;
        }

        try {
          // API call will be implemented when integrating with backend
          // const operation = editHistory[historyIndex + 1];
          // await api.updateElement(operation.elementId, operation.after);

          set({
            historyIndex: historyIndex + 1,
          });

        } catch (error) {
          console.error('Redo failed:', error);
          throw error;
        }
      },

      // Check if undo is available
      canUndo: () => {
        return get().historyIndex >= 0;
      },

      // Check if redo is available
      canRedo: () => {
        const { editHistory, historyIndex } = get();
        return historyIndex < editHistory.length - 1;
      },

      // Clear history
      clearHistory: () => {
        set({
          editHistory: [],
          historyIndex: -1,
        });
      },

      // Enable/disable auto-save
      enableAutoSave: (enabled) => {
        set({ autoSaveEnabled: enabled });
      },

      // Set auto-save interval
      setAutoSaveInterval: (interval) => {
        set({ autoSaveInterval: interval });
      },

      // Trigger auto-save
      triggerAutoSave: async () => {
        const { activeEditor, autoSaveEnabled, saveEditor } = get();
        
        if (!autoSaveEnabled || !activeEditor?.isDirty) {
          return;
        }

        try {
          await saveEditor();
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      },
    }),
    { name: 'EditorStore' }
  )
);

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access the active editor
 */
export function useActiveEditor() {
  const activeEditor = useEditorStore((state) => state.activeEditor);
  const openEditor = useEditorStore((state) => state.openEditor);
  const closeEditor = useEditorStore((state) => state.closeEditor);
  const updateValue = useEditorStore((state) => state.updateValue);
  const saveEditor = useEditorStore((state) => state.saveEditor);
  const discardChanges = useEditorStore((state) => state.discardChanges);

  return {
    activeEditor,
    openEditor,
    closeEditor,
    updateValue,
    saveEditor,
    discardChanges,
    isEditing: activeEditor !== null,
    isDirty: activeEditor?.isDirty || false,
  };
}

/**
 * Hook to access dirty state
 */
export function useDirtyState() {
  const dirtyElements = useEditorStore((state) => Array.from(state.dirtyElements));
  const isDirty = useEditorStore((state) => state.isDirty);
  const markDirty = useEditorStore((state) => state.markDirty);
  const markClean = useEditorStore((state) => state.markClean);

  return {
    dirtyElements,
    isDirty,
    markDirty,
    markClean,
    hasDirtyElements: dirtyElements.length > 0,
  };
}

/**
 * Hook to access validation state
 */
export function useValidation(elementId?: string) {
  const validationResults = useEditorStore((state) => state.validationResults);
  const setValidation = useEditorStore((state) => state.setValidation);
  const getValidation = useEditorStore((state) => state.getValidation);
  const clearValidation = useEditorStore((state) => state.clearValidation);
  const clearAllValidations = useEditorStore((state) => state.clearAllValidations);

  const validation = elementId ? getValidation(elementId) : undefined;

  return {
    validation,
    allValidations: Array.from(validationResults.values()),
    setValidation,
    clearValidation,
    clearAllValidations,
    hasErrors: validation?.severity === 'error',
    hasWarnings: validation?.severity === 'warning',
  };
}

/**
 * Hook to access edit history
 */
export function useEditHistory() {
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.canUndo());
  const canRedo = useEditorStore((state) => state.canRedo());
  const clearHistory = useEditorStore((state) => state.clearHistory);
  const editHistory = useEditorStore((state) => state.editHistory);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    historyLength: editHistory.length,
  };
}

/**
 * Hook to access auto-save functionality
 */
export function useAutoSave() {
  const autoSaveEnabled = useEditorStore((state) => state.autoSaveEnabled);
  const autoSaveInterval = useEditorStore((state) => state.autoSaveInterval);
  const enableAutoSave = useEditorStore((state) => state.enableAutoSave);
  const setAutoSaveInterval = useEditorStore((state) => state.setAutoSaveInterval);
  const triggerAutoSave = useEditorStore((state) => state.triggerAutoSave);
  const lastSaveTime = useEditorStore((state) => state.lastSaveTime);

  return {
    autoSaveEnabled,
    autoSaveInterval,
    enableAutoSave,
    setAutoSaveInterval,
    triggerAutoSave,
    lastSaveTime,
  };
}
