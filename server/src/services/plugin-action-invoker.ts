/**
 * Plugin Action Invoker Service
 * 
 * Handles invocation of plugin actions with parameter validation,
 * error handling, timeout management, and result processing
 */

import type { AasxPluginResultBase, AasxPluginActionDescription } from "../../../shared/plugin-types";
import { getPluginManager } from "./plugin-manager";
import { getPluginRegistry, PluginStatus } from "./plugin-registry";

// ============================================================================
// Action Invoker Types
// ============================================================================

export interface ActionInvocationOptions {
  timeout?: number;              // Timeout in milliseconds (default: 5000)
  validateParams?: boolean;      // Validate parameters (default: true)
  trackMetrics?: boolean;        // Track invocation metrics (default: true)
}

export interface ActionInvocationResult {
  pluginId: string;
  action: string;
  success: boolean;
  result?: AasxPluginResultBase | null;
  error?: string;
  errorStack?: string;
  executionTime: number;         // ms
  timedOut: boolean;
}

export interface ActionMetrics {
  totalInvocations: number;
  successfulInvocations: number;
  failedInvocations: number;
  timeoutInvocations: number;
  averageExecutionTime: number;
  lastInvocation?: string;       // ISO timestamp
}

// ============================================================================
// Plugin Action Invoker Service
// ============================================================================

export class PluginActionInvokerService {
  private readonly defaultTimeout = 5000; // 5 seconds
  private readonly actionMetrics: Map<string, ActionMetrics> = new Map();

  /**
   * Invoke a plugin action (synchronous)
   */
  async invokeAction(
    pluginId: string,
    action: string,
    args: any[] = [],
    options: ActionInvocationOptions = {}
  ): Promise<ActionInvocationResult> {
    const startTime = Date.now();
    const timeout = options.timeout ?? this.defaultTimeout;
    const validateParams = options.validateParams ?? true;
    const trackMetrics = options.trackMetrics ?? true;

    try {
      // Get plugin instance
      const manager = getPluginManager();
      const instance = manager.getPluginInstance(pluginId);

      if (!instance) {
        throw new Error(`Plugin ${pluginId} not initialized`);
      }

      if (instance.status !== PluginStatus.ACTIVE) {
        throw new Error(`Plugin ${pluginId} is not active (status: ${instance.status})`);
      }

      // Validate action exists
      if (validateParams) {
        const actions = instance.plugin.listActions();
        const actionDesc = actions.find(a => a.name === action);
        if (!actionDesc) {
          throw new Error(`Action ${action} not found in plugin ${pluginId}`);
        }
      }

      // Invoke action with timeout
      const result = await this.invokeWithTimeout(
        () => instance.plugin.activateAction(action, ...args),
        timeout
      );

      const executionTime = Date.now() - startTime;

      // Track metrics
      if (trackMetrics) {
        this.updateMetrics(pluginId, action, true, executionTime, false);
        
        // Update registry
        const registry = getPluginRegistry();
        registry.incrementApiCallCount(pluginId);
      }

      return {
        pluginId,
        action,
        success: true,
        result,
        executionTime,
        timedOut: false
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const isTimeout = error instanceof Error && error.message.includes("timeout");
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      // Track metrics
      if (options.trackMetrics ?? true) {
        this.updateMetrics(pluginId, action, false, executionTime, isTimeout);
      }

      return {
        pluginId,
        action,
        success: false,
        error: errorMsg,
        errorStack,
        executionTime,
        timedOut: isTimeout
      };
    }
  }

  /**
   * Invoke a plugin action (asynchronous)
   */
  async invokeActionAsync(
    pluginId: string,
    action: string,
    args: any[] = [],
    options: ActionInvocationOptions = {}
  ): Promise<ActionInvocationResult> {
    const startTime = Date.now();
    const timeout = options.timeout ?? this.defaultTimeout;
    const validateParams = options.validateParams ?? true;
    const trackMetrics = options.trackMetrics ?? true;

    try {
      // Get plugin instance
      const manager = getPluginManager();
      const instance = manager.getPluginInstance(pluginId);

      if (!instance) {
        throw new Error(`Plugin ${pluginId} not initialized`);
      }

      if (instance.status !== PluginStatus.ACTIVE) {
        throw new Error(`Plugin ${pluginId} is not active (status: ${instance.status})`);
      }

      // Check if plugin supports async
      if (!instance.plugin.activateActionAsync) {
        throw new Error(`Plugin ${pluginId} does not support async actions`);
      }

      // Validate action exists
      if (validateParams) {
        const actions = instance.plugin.listActions();
        const actionDesc = actions.find(a => a.name === action);
        if (!actionDesc) {
          throw new Error(`Action ${action} not found in plugin ${pluginId}`);
        }
      }

      // Invoke action with timeout
      const result = await this.invokeWithTimeout(
        () => instance.plugin.activateActionAsync!(action, ...args),
        timeout
      );

      const executionTime = Date.now() - startTime;

      // Track metrics
      if (trackMetrics) {
        this.updateMetrics(pluginId, action, true, executionTime, false);
        
        // Update registry
        const registry = getPluginRegistry();
        registry.incrementApiCallCount(pluginId);
      }

      return {
        pluginId,
        action,
        success: true,
        result,
        executionTime,
        timedOut: false
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const isTimeout = error instanceof Error && error.message.includes("timeout");
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      // Track metrics
      if (options.trackMetrics ?? true) {
        this.updateMetrics(pluginId, action, false, executionTime, isTimeout);
      }

      return {
        pluginId,
        action,
        success: false,
        error: errorMsg,
        errorStack,
        executionTime,
        timedOut: isTimeout
      };
    }
  }

  /**
   * List available actions for a plugin
   */
  listPluginActions(pluginId: string): AasxPluginActionDescription[] {
    const manager = getPluginManager();
    const instance = manager.getPluginInstance(pluginId);

    if (!instance) {
      throw new Error(`Plugin ${pluginId} not initialized`);
    }

    return instance.plugin.listActions();
  }

  /**
   * Check if a plugin has a specific action
   */
  hasAction(pluginId: string, action: string): boolean {
    try {
      const actions = this.listPluginActions(pluginId);
      return actions.some(a => a.name === action);
    } catch {
      return false;
    }
  }

  /**
   * Get action description
   */
  getActionDescription(pluginId: string, action: string): AasxPluginActionDescription | undefined {
    try {
      const actions = this.listPluginActions(pluginId);
      return actions.find(a => a.name === action);
    } catch {
      return undefined;
    }
  }

  /**
   * Invoke action with timeout
   */
  private async invokeWithTimeout<T>(
    fn: () => T | Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      Promise.resolve(fn()),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Action timeout after ${timeout}ms`)), timeout)
      )
    ]);
  }

  /**
   * Update action metrics
   */
  private updateMetrics(
    pluginId: string,
    action: string,
    success: boolean,
    executionTime: number,
    timedOut: boolean
  ): void {
    const key = `${pluginId}:${action}`;
    const metrics = this.actionMetrics.get(key) || {
      totalInvocations: 0,
      successfulInvocations: 0,
      failedInvocations: 0,
      timeoutInvocations: 0,
      averageExecutionTime: 0
    };

    metrics.totalInvocations++;
    if (success) {
      metrics.successfulInvocations++;
    } else {
      metrics.failedInvocations++;
    }
    if (timedOut) {
      metrics.timeoutInvocations++;
    }

    // Update average execution time
    const totalTime = metrics.averageExecutionTime * (metrics.totalInvocations - 1) + executionTime;
    metrics.averageExecutionTime = totalTime / metrics.totalInvocations;
    metrics.lastInvocation = new Date().toISOString();

    this.actionMetrics.set(key, metrics);
  }

  /**
   * Get action metrics
   */
  getActionMetrics(pluginId: string, action: string): ActionMetrics | undefined {
    const key = `${pluginId}:${action}`;
    return this.actionMetrics.get(key);
  }

  /**
   * Get all metrics for a plugin
   */
  getPluginMetrics(pluginId: string): Map<string, ActionMetrics> {
    const metrics = new Map<string, ActionMetrics>();
    for (const [key, value] of Array.from(this.actionMetrics.entries())) {
      if (key.startsWith(`${pluginId}:`)) {
        const action = key.slice(pluginId.length + 1);
        metrics.set(action, value);
      }
    }
    return metrics;
  }

  /**
   * Get all action metrics
   */
  getAllMetrics(): Map<string, ActionMetrics> {
    return new Map(this.actionMetrics);
  }

  /**
   * Clear metrics for a plugin
   */
  clearPluginMetrics(pluginId: string): void {
    for (const key of Array.from(this.actionMetrics.keys())) {
      if (key.startsWith(`${pluginId}:`)) {
        this.actionMetrics.delete(key);
      }
    }
  }

  /**
   * Clear all metrics
   */
  clearAllMetrics(): void {
    this.actionMetrics.clear();
  }

  /**
   * Get invocation statistics
   */
  getStatistics(): {
    totalActions: number;
    totalInvocations: number;
    successfulInvocations: number;
    failedInvocations: number;
    timeoutInvocations: number;
    averageExecutionTime: number;
  } {
    let totalInvocations = 0;
    let successfulInvocations = 0;
    let failedInvocations = 0;
    let timeoutInvocations = 0;
    let totalExecutionTime = 0;

    for (const metrics of Array.from(this.actionMetrics.values())) {
      totalInvocations += metrics.totalInvocations;
      successfulInvocations += metrics.successfulInvocations;
      failedInvocations += metrics.failedInvocations;
      timeoutInvocations += metrics.timeoutInvocations;
      totalExecutionTime += metrics.averageExecutionTime * metrics.totalInvocations;
    }

    return {
      totalActions: this.actionMetrics.size,
      totalInvocations,
      successfulInvocations,
      failedInvocations,
      timeoutInvocations,
      averageExecutionTime: totalInvocations > 0 ? totalExecutionTime / totalInvocations : 0
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let invokerInstance: PluginActionInvokerService | null = null;

/**
 * Get the singleton plugin action invoker instance
 */
export function getPluginActionInvoker(): PluginActionInvokerService {
  invokerInstance ??= new PluginActionInvokerService();
  return invokerInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetPluginActionInvoker(): void {
  invokerInstance = null;
}
