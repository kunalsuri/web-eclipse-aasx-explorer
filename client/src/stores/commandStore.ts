/**
 * Command Store
 * 
 * Zustand store for managing undo/redo command history.
 * Implements the Command pattern for all undoable operations.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Command } from '../commands/Command';

interface CommandStore {
  // State
  undoStack: Command[];
  redoStack: Command[];
  maxStackSize: number;

  // Actions
  execute: (command: Command) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
  getUndoHistory: () => Command[];
  getRedoHistory: () => Command[];
  setMaxStackSize: (size: number) => void;
}

export const useCommandStore = create<CommandStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      undoStack: [],
      redoStack: [],
      maxStackSize: 50,

      // Execute a new command
      execute: (command: Command) => {
        try {
          command.execute();

          set((state) => {
            const newUndoStack = [...state.undoStack, command];

            // Prune stack if it exceeds max size
            if (newUndoStack.length > state.maxStackSize) {
              newUndoStack.shift();
            }

            return {
              undoStack: newUndoStack,
              redoStack: [], // Clear redo stack on new action
            };
          });
        } catch (error) {
          console.error('Command execution failed:', error);
          throw error;
        }
      },

      // Undo the last command
      undo: () => {
        const { undoStack, redoStack } = get();
        const command = undoStack[undoStack.length - 1];

        if (!command) {
          console.warn('Nothing to undo');
          return;
        }

        try {
          command.undo();

          set({
            undoStack: undoStack.slice(0, -1),
            redoStack: [...redoStack, command],
          });
        } catch (error) {
          console.error('Undo failed:', error);
          throw error;
        }
      },

      // Redo the last undone command
      redo: () => {
        const { undoStack, redoStack } = get();
        const command = redoStack[redoStack.length - 1];

        if (!command) {
          console.warn('Nothing to redo');
          return;
        }

        try {
          if (command.redo) {
            command.redo();
          } else {
            command.execute();
          }

          set({
            undoStack: [...undoStack, command],
            redoStack: redoStack.slice(0, -1),
          });
        } catch (error) {
          console.error('Redo failed:', error);
          throw error;
        }
      },

      // Check if undo is available
      canUndo: () => get().undoStack.length > 0,

      // Check if redo is available
      canRedo: () => get().redoStack.length > 0,

      // Clear all command history
      clear: () => {
        set({
          undoStack: [],
          redoStack: [],
        });
      },

      // Get undo history (for UI display)
      getUndoHistory: () => get().undoStack.slice().reverse(),

      // Get redo history (for UI display)
      getRedoHistory: () => get().redoStack.slice().reverse(),

      // Set maximum stack size
      setMaxStackSize: (size: number) => {
        set((state) => {
          const newUndoStack = state.undoStack.slice(-size);
          return {
            maxStackSize: size,
            undoStack: newUndoStack,
          };
        });
      },
    }),
    { name: 'CommandStore' }
  )
);

/**
 * Hook to get undo/redo state and actions
 */
export function useUndo() {
  const undo = useCommandStore((state) => state.undo);
  const canUndo = useCommandStore((state) => state.canUndo());
  const undoHistory = useCommandStore((state) => state.getUndoHistory());

  return { undo, canUndo, undoHistory };
}

export function useRedo() {
  const redo = useCommandStore((state) => state.redo);
  const canRedo = useCommandStore((state) => state.canRedo());
  const redoHistory = useCommandStore((state) => state.getRedoHistory());

  return { redo, canRedo, redoHistory };
}

export function useCommandHistory() {
  const execute = useCommandStore((state) => state.execute);
  const undo = useCommandStore((state) => state.undo);
  const redo = useCommandStore((state) => state.redo);
  const canUndo = useCommandStore((state) => state.canUndo());
  const canRedo = useCommandStore((state) => state.canRedo());
  const clear = useCommandStore((state) => state.clear);

  return {
    execute,
    undo,
    redo,
    canUndo,
    canRedo,
    clear,
  };
}
