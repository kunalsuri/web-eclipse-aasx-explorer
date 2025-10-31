/**
 * Command Interface
 * 
 * Base interface for the Command pattern used in undo/redo system.
 * All undoable actions must implement this interface.
 */

export interface Command {
  /**
   * Execute the command (perform the action)
   */
  execute(): void;

  /**
   * Undo the command (reverse the action)
   */
  undo(): void;

  /**
   * Redo the command (re-apply the action)
   * Optional - defaults to calling execute()
   */
  redo?(): void;

  /**
   * Human-readable description of the command
   */
  description: string;

  /**
   * Timestamp when command was created
   */
  timestamp: number;

  /**
   * Optional metadata for debugging
   */
  metadata?: Record<string, any>;
}

/**
 * Abstract base class for commands with common functionality
 */
export abstract class BaseCommand implements Command {
  public readonly timestamp: number;
  public metadata?: Record<string, any>;

  constructor(public readonly description: string) {
    this.timestamp = Date.now();
  }

  abstract execute(): void;
  abstract undo(): void;

  /**
   * Default redo implementation calls execute
   */
  redo(): void {
    this.execute();
  }

  /**
   * Helper to create a deep clone of an object
   */
  protected deepClone<T>(obj: T): T {
    return structuredClone(obj);
  }
}
