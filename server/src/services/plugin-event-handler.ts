/**
 * Plugin Event Handler Service
 * 
 * Handles event return routing, validation, and timeout management
 * Coordinates event-return action between plugins and host
 */

import type { 
  AasxPluginEventReturnBase,
  AasxPluginResultEventBase 
} from "../../../shared/plugin-types";
import { StandardPluginActions } from "../../../shared/plugin-types";
import { getPluginManager } from "./plugin-manager";
import { getPluginActionInvoker } from "./plugin-action-invoker";

// ============================================================================
// Event Handler Types
// ============================================================================

export interface EventReturnOptions {
  timeout?: number;              // Timeout in milliseconds (default: 30000)
  validateEvent?: boolean;       // Validate event structure (default: true)
}

export interface EventReturnResult {
  success: boolean;
  error?: string;
  processingTime: number;        // ms
}

export interface PendingEventReturn {
  event: AasxPluginResultEventBase;
  pluginId: string;
  sessionId: any;
  timestamp: number;
  timeoutHandle?: NodeJS.Timeout;
}

// ============================================================================
// Plugin Event Handler Service
// ============================================================================

export class PluginEventHandlerService {
  private readonly defaultTimeout = 30000; // 30 seconds
  private readonly pendingReturns: Map<string, PendingEventReturn> = new Map();

  /**
   * Handle event return from host to plugin
   */
  async handleEventReturn(
    pluginId: string,
    sessionId: any,
    eventReturn: AasxPluginEventReturnBase,
    options: EventReturnOptions = {}
  ): Promise<EventReturnResult> {
    const startTime = Date.now();

    try {
      // Validate plugin and session
      const manager = getPluginManager();
      const instance = manager.getPluginInstance(pluginId);

      if (!instance) {
        throw new Error(`Plugin ${pluginId} not initialized`);
      }

      // Validate event return structure
      if (options.validateEvent ?? true) {
        if (!eventReturn) {
          throw new Error("Event return is required");
        }
      }

      // Invoke event-return action
      const invoker = getPluginActionInvoker();
      const result = await invoker.invokeAction(
        pluginId,
        StandardPluginActions.EVENT_RETURN,
        [eventReturn, sessionId],
        {
          timeout: options.timeout ?? this.defaultTimeout,
          validateParams: false, // Already validated
          trackMetrics: true
        }
      );

      if (!result.success) {
        throw new Error(result.error || "Event return failed");
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        processingTime
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);

      return {
        success: false,
        error: errorMsg,
        processingTime
      };
    }
  }

  /**
   * Register a pending event return (for timeout tracking)
   */
  registerPendingReturn(
    eventId: string,
    event: AasxPluginResultEventBase,
    pluginId: string,
    sessionId: any,
    timeout?: number
  ): void {
    const pending: PendingEventReturn = {
      event,
      pluginId,
      sessionId,
      timestamp: Date.now()
    };

    // Set timeout if specified
    if (timeout) {
      pending.timeoutHandle = setTimeout(() => {
        this.handleTimeout(eventId);
      }, timeout);
    }

    this.pendingReturns.set(eventId, pending);
  }

  /**
   * Complete a pending event return
   */
  completePendingReturn(eventId: string): boolean {
    const pending = this.pendingReturns.get(eventId);
    if (!pending) {
      return false;
    }

    // Clear timeout
    if (pending.timeoutHandle) {
      clearTimeout(pending.timeoutHandle);
    }

    this.pendingReturns.delete(eventId);
    return true;
  }

  /**
   * Handle event return timeout
   */
  private handleTimeout(eventId: string): void {
    const pending = this.pendingReturns.get(eventId);
    if (!pending) {
      return;
    }

    console.warn(`Event return timeout for event ${eventId} in plugin ${pending.pluginId}`);
    this.pendingReturns.delete(eventId);
  }

  /**
   * Get pending event return
   */
  getPendingReturn(eventId: string): PendingEventReturn | undefined {
    return this.pendingReturns.get(eventId);
  }

  /**
   * Get all pending returns for a plugin
   */
  getPluginPendingReturns(pluginId: string): PendingEventReturn[] {
    const returns: PendingEventReturn[] = [];
    for (const pending of Array.from(this.pendingReturns.values())) {
      if (pending.pluginId === pluginId) {
        returns.push(pending);
      }
    }
    return returns;
  }

  /**
   * Clear all pending returns for a plugin
   */
  clearPluginPendingReturns(pluginId: string): number {
    let cleared = 0;
    for (const [eventId, pending] of Array.from(this.pendingReturns.entries())) {
      if (pending.pluginId === pluginId) {
        if (pending.timeoutHandle) {
          clearTimeout(pending.timeoutHandle);
        }
        this.pendingReturns.delete(eventId);
        cleared++;
      }
    }
    return cleared;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalPending: number;
    oldestPendingAge: number;
    averagePendingAge: number;
  } {
    const now = Date.now();
    const pending = Array.from(this.pendingReturns.values());
    
    if (pending.length === 0) {
      return {
        totalPending: 0,
        oldestPendingAge: 0,
        averagePendingAge: 0
      };
    }

    const ages = pending.map(p => now - p.timestamp);
    const oldestAge = Math.max(...ages);
    const avgAge = ages.reduce((a, b) => a + b, 0) / ages.length;

    return {
      totalPending: pending.length,
      oldestPendingAge: oldestAge,
      averagePendingAge: avgAge
    };
  }

  /**
   * Clear all pending returns
   */
  clearAllPendingReturns(): void {
    for (const pending of Array.from(this.pendingReturns.values())) {
      if (pending.timeoutHandle) {
        clearTimeout(pending.timeoutHandle);
      }
    }
    this.pendingReturns.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let handlerInstance: PluginEventHandlerService | null = null;

/**
 * Get the singleton plugin event handler instance
 */
export function getPluginEventHandler(): PluginEventHandlerService {
  handlerInstance ??= new PluginEventHandlerService();
  return handlerInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetPluginEventHandler(): void {
  handlerInstance = null;
}
