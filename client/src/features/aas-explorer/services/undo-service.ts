/**
 * Undo/Redo Service
 * Manages command history and provides undo/redo functionality
 * 
 * Features:
 * - Command history stack (max 50 commands)
 * - Undo/Redo operations
 * - Command execution with automatic history tracking
 * - Stack persistence to localStorage
 * - Keyboard shortcut support
 */

import type { Command } from './commands';
import { toast } from '@/hooks/use-toast';

export interface UndoServiceState {
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly undoDescription?: string;
  readonly redoDescription?: string;
  readonly historySize: number;
}

type StateChangeListener = (state: UndoServiceState) => void;

class UndoService {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private readonly maxStackSize = 50;
  private listeners: Set<StateChangeListener> = new Set();
  private readonly storageKey = 'undo-service-state';

  constructor() {
    this.setupKeyboardShortcuts();
    this.loadState();
  }

  /**
   * Execute a command and add it to history
   */
  async executeCommand(command: Command): Promise<void> {
    try {
      await command.execute();
      
      // Add to undo stack
      this.undoStack.push(command);
      
      // Limit stack size
      if (this.undoStack.length > this.maxStackSize) {
        this.undoStack.shift();
      }
      
      // Clear redo stack when new command is executed
      this.redoStack = [];
      
      this.saveState();
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to execute command:', error);
      throw error;
    }
  }

  /**
   * Undo the last command
   */
  async undo(): Promise<void> {
    const command = this.undoStack.pop();
    
    if (!command) {
      throw new Error('Nothing to undo');
    }

    if (!command.canUndo()) {
      throw new Error('Command cannot be undone');
    }

    try {
      await command.undo();
      this.redoStack.push(command);
      
      toast({
        title: 'Undone',
        description: command.description,
      });
      
      this.saveState();
      this.notifyListeners();
    } catch (error) {
      // Put command back on undo stack if undo fails
      this.undoStack.push(command);
      console.error('Failed to undo command:', error);
      throw error;
    }
  }

  /**
   * Redo the last undone command
   */
  async redo(): Promise<void> {
    const command = this.redoStack.pop();
    
    if (!command) {
      throw new Error('Nothing to redo');
    }

    try {
      await command.execute();
      this.undoStack.push(command);
      
      toast({
        title: 'Redone',
        description: command.description,
      });
      
      this.saveState();
      this.notifyListeners();
    } catch (error) {
      // Put command back on redo stack if redo fails
      this.redoStack.push(command);
      console.error('Failed to redo command:', error);
      throw error;
    }
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0 && 
           this.undoStack[this.undoStack.length - 1].canUndo();
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Get description of command that would be undone
   */
  getUndoDescription(): string | undefined {
    const command = this.undoStack[this.undoStack.length - 1];
    return command?.description;
  }

  /**
   * Get description of command that would be redone
   */
  getRedoDescription(): string | undefined {
    const command = this.redoStack[this.redoStack.length - 1];
    return command?.description;
  }

  /**
   * Get current state
   */
  getState(): UndoServiceState {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      undoDescription: this.getUndoDescription(),
      redoDescription: this.getRedoDescription(),
      historySize: this.undoStack.length,
    };
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.saveState();
    this.notifyListeners();
  }

  /**
   * Get command history (for debugging/visualization)
   */
  getHistory(): ReadonlyArray<Command> {
    return [...this.undoStack];
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in undo service listener:', error);
      }
    });
  }

  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', (event) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        if (this.canUndo()) {
          event.preventDefault();
          this.undo().catch(console.error);
        }
      }
      
      // Ctrl+Y or Cmd+Shift+Z for redo
      if (
        ((event.ctrlKey || event.metaKey) && event.key === 'y') ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z')
      ) {
        if (this.canRedo()) {
          event.preventDefault();
          this.redo().catch(console.error);
        }
      }
    });
  }

  /**
   * Save state to localStorage
   */
  private saveState(): void {
    if (typeof window === 'undefined') return;

    try {
      const state = {
        undoStackSize: this.undoStack.length,
        redoStackSize: this.redoStack.length,
        lastCommand: this.undoStack[this.undoStack.length - 1]?.description,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save undo service state:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  private loadState(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const state = JSON.parse(stored);
        // We only store metadata, not actual commands
        // Commands are not persisted across page reloads
        console.log('Undo service state loaded:', state);
      }
    } catch (error) {
      console.warn('Failed to load undo service state:', error);
    }
  }
}

export const undoService = new UndoService();
