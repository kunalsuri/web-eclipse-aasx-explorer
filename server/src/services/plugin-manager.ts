/**
 * Plugin Manager Service
 * 
 * Manages plugin instances, initialization, activation, and deactivation
 * Coordinates between plugin loader, registry, and runtime
 */

import type { IAasxPlugin, PluginContext, PluginLogger } from "../../../shared/plugin-types";
import { PluginEventStack, PluginSessionCollection } from "../../../shared/plugin-types";
import type { PluginManifest } from "../../../shared/plugin-manifest";
import { getPluginRegistry, PluginStatus } from "./plugin-registry";
import { getPluginLoader } from "./plugin-loader";
import { getPluginOptionsManager } from "./plugin-options-manager";

// ============================================================================
// Plugin Manager Types
// ============================================================================

export interface PluginInstance {
  plugin: IAasxPlugin;
  manifest: PluginManifest;
  context: PluginContext;
  status: PluginStatus;
  initTime?: number;
  activationTime?: number;
}

export interface PluginInitResult {
  pluginId: string;
  success: boolean;
  initTime: number;
  error?: string;
}

export interface PluginActivationResult {
  pluginId: string;
  success: boolean;
  activationTime: number;
  error?: string;
}

// ============================================================================
// Plugin Logger Implementation
// ============================================================================

class PluginLoggerImpl implements PluginLogger {
  private readonly messages: string[] = [];
  private readonly maxMessages = 100;

  constructor(private readonly pluginName: string) {}

  info(message: string, ...args: any[]): void {
    const formatted = this.formatMessage("INFO", message, args);
    console.log(`[${this.pluginName}] ${formatted}`);
    this.addMessage(formatted);
  }

  warn(message: string, ...args: any[]): void {
    const formatted = this.formatMessage("WARN", message, args);
    console.warn(`[${this.pluginName}] ${formatted}`);
    this.addMessage(formatted);
  }

  error(message: string, error?: Error, ...args: any[]): void {
    const formatted = this.formatMessage("ERROR", message, args);
    const errorMsg = error ? `${formatted}: ${error.message}` : formatted;
    console.error(`[${this.pluginName}] ${errorMsg}`);
    this.addMessage(errorMsg);
  }

  debug(message: string, ...args: any[]): void {
    const formatted = this.formatMessage("DEBUG", message, args);
    console.debug(`[${this.pluginName}] ${formatted}`);
    this.addMessage(formatted);
  }

  popMessage(): string | null {
    return this.messages.shift() || null;
  }

  private formatMessage(level: string, message: string, args: any[]): string {
    let formatted = message;
    if (args.length > 0) {
      formatted = message.replaceAll(/{(\d+)}/g, (match, index) => {
        const idx = Number.parseInt(index, 10);
        return idx < args.length ? String(args[idx]) : match;
      });
    }
    return `[${level}] ${formatted}`;
  }

  private addMessage(message: string): void {
    this.messages.push(message);
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
  }
}

// ============================================================================
// Plugin Manager Service
// ============================================================================

export class PluginManagerService {
  private readonly instances: Map<string, PluginInstance> = new Map();
  private readonly pluginsDir: string;

  constructor(pluginsDir: string = "./data/plugins") {
    this.pluginsDir = pluginsDir;
  }

  /**
   * Initialize a plugin
   */
  async initializePlugin(pluginId: string, args: string[] = []): Promise<PluginInitResult> {
    const startTime = Date.now();

    try {
      // Get plugin from loader
      const loader = getPluginLoader(this.pluginsDir);
      const plugin = loader.getLoadedPlugin(pluginId);

      if (!plugin) {
        throw new Error(`Plugin ${pluginId} not loaded`);
      }

      // Get manifest from discovered plugins
      const discovered = loader.getDiscoveredPlugins();
      const discovery = discovered.get(pluginId);

      if (!discovery) {
        throw new Error(`Plugin ${pluginId} not discovered`);
      }

      // Load plugin options
      const optionsManager = getPluginOptionsManager();
      const options = optionsManager.getParsedOptions(pluginId, {});

      // Create plugin context
      const context: PluginContext = {
        pluginName: pluginId,
        pluginDir: discovery.pluginDir,
        logger: new PluginLoggerImpl(pluginId),
        eventStack: new PluginEventStack(),
        sessions: new PluginSessionCollection(),
        options
      };

      // Initialize plugin
      plugin.initPlugin(args);

      // Store instance
      const instance: PluginInstance = {
        plugin,
        manifest: discovery.manifest,
        context,
        status: PluginStatus.INSTALLED,
        initTime: Date.now() - startTime
      };

      this.instances.set(pluginId, instance);

      // Update registry
      const registry = getPluginRegistry();
      if (instance.initTime) {
        await registry.updatePluginMetrics(pluginId, {
          initTime: instance.initTime
        });
      }

      return {
        pluginId,
        success: true,
        initTime: instance.initTime || 0
      };
    } catch (error) {
      const initTime = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);

      // Update registry with error
      const registry = getPluginRegistry();
      await registry.updatePluginStatus(pluginId, PluginStatus.ERROR, errorMsg);

      return {
        pluginId,
        success: false,
        initTime,
        error: errorMsg
      };
    }
  }

  /**
   * Activate a plugin
   */
  async activatePlugin(pluginId: string): Promise<PluginActivationResult> {
    const startTime = Date.now();

    try {
      const instance = this.instances.get(pluginId);
      if (!instance) {
        throw new Error(`Plugin ${pluginId} not initialized`);
      }

      if (instance.status === PluginStatus.ACTIVE) {
        return {
          pluginId,
          success: true,
          activationTime: 0
        };
      }

      // Update status
      instance.status = PluginStatus.ACTIVE;
      instance.activationTime = Date.now() - startTime;

      // Update registry
      const registry = getPluginRegistry();
      await registry.updatePluginStatus(pluginId, PluginStatus.ACTIVE);
      if (instance.activationTime) {
        await registry.updatePluginMetrics(pluginId, {
          activationTime: instance.activationTime
        });
      }

      return {
        pluginId,
        success: true,
        activationTime: instance.activationTime
      };
    } catch (error) {
      const activationTime = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);

      // Update registry with error
      const registry = getPluginRegistry();
      await registry.updatePluginStatus(pluginId, PluginStatus.ERROR, errorMsg);

      return {
        pluginId,
        success: false,
        activationTime,
        error: errorMsg
      };
    }
  }

  /**
   * Deactivate a plugin
   */
  async deactivatePlugin(pluginId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const instance = this.instances.get(pluginId);
      if (!instance) {
        throw new Error(`Plugin ${pluginId} not initialized`);
      }

      if (instance.status === PluginStatus.INACTIVE) {
        return { success: true };
      }

      // Clear sessions
      instance.context.sessions.clearAll();

      // Clear events
      instance.context.eventStack.clearEvents();

      // Update status
      instance.status = PluginStatus.INACTIVE;

      // Update registry
      const registry = getPluginRegistry();
      await registry.updatePluginStatus(pluginId, PluginStatus.INACTIVE);

      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Deactivate first
      await this.deactivatePlugin(pluginId);

      // Remove instance
      this.instances.delete(pluginId);

      // Remove from loader
      const loader = getPluginLoader(this.pluginsDir);
      loader.unloadPlugin(pluginId);

      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Initialize all loaded plugins
   */
  async initializeAllPlugins(args: string[] = []): Promise<{
    initialized: PluginInitResult[];
    errors: PluginInitResult[];
  }> {
    const initialized: PluginInitResult[] = [];
    const errors: PluginInitResult[] = [];

    const loader = getPluginLoader(this.pluginsDir);
    const loadedPlugins = loader.getAllLoadedPlugins();

    for (const pluginId of Array.from(loadedPlugins.keys())) {
      const result = await this.initializePlugin(pluginId, args);
      if (result.success) {
        initialized.push(result);
      } else {
        errors.push(result);
      }
    }

    return { initialized, errors };
  }

  /**
   * Activate all initialized plugins
   */
  async activateAllPlugins(): Promise<{
    activated: PluginActivationResult[];
    errors: PluginActivationResult[];
  }> {
    const activated: PluginActivationResult[] = [];
    const errors: PluginActivationResult[] = [];

    for (const pluginId of Array.from(this.instances.keys())) {
      const result = await this.activatePlugin(pluginId);
      if (result.success) {
        activated.push(result);
      } else {
        errors.push(result);
      }
    }

    return { activated, errors };
  }

  /**
   * Deactivate all active plugins
   */
  async deactivateAllPlugins(): Promise<{
    deactivated: string[];
    errors: Array<{ pluginId: string; error: string }>;
  }> {
    const deactivated: string[] = [];
    const errors: Array<{ pluginId: string; error: string }> = [];

    for (const [pluginId, instance] of Array.from(this.instances.entries())) {
      if (instance.status === PluginStatus.ACTIVE) {
        const result = await this.deactivatePlugin(pluginId);
        if (result.success) {
          deactivated.push(pluginId);
        } else if (result.error) {
          errors.push({ pluginId, error: result.error });
        }
      }
    }

    return { deactivated, errors };
  }

  /**
   * Get a plugin instance
   */
  getPluginInstance(pluginId: string): PluginInstance | undefined {
    return this.instances.get(pluginId);
  }

  /**
   * Get all plugin instances
   */
  getAllPluginInstances(): Map<string, PluginInstance> {
    return new Map(this.instances);
  }

  /**
   * Get active plugins
   */
  getActivePlugins(): PluginInstance[] {
    return Array.from(this.instances.values()).filter(
      i => i.status === PluginStatus.ACTIVE
    );
  }

  /**
   * Get inactive plugins
   */
  getInactivePlugins(): PluginInstance[] {
    return Array.from(this.instances.values()).filter(
      i => i.status === PluginStatus.INACTIVE
    );
  }

  /**
   * Check if a plugin is initialized
   */
  isPluginInitialized(pluginId: string): boolean {
    return this.instances.has(pluginId);
  }

  /**
   * Check if a plugin is active
   */
  isPluginActive(pluginId: string): boolean {
    const instance = this.instances.get(pluginId);
    return instance?.status === PluginStatus.ACTIVE;
  }

  /**
   * Get plugin context
   */
  getPluginContext(pluginId: string): PluginContext | undefined {
    return this.instances.get(pluginId)?.context;
  }

  /**
   * Update plugin options
   */
  async updatePluginOptions(pluginId: string, options: any): Promise<void> {
    const instance = this.instances.get(pluginId);
    if (!instance) {
      throw new Error(`Plugin ${pluginId} not initialized`);
    }

    instance.context.options = { ...instance.context.options, ...options };

    // Update registry
    const registry = getPluginRegistry();
    await registry.updatePluginSettings(pluginId, options);
  }

  /**
   * Get plugin statistics
   */
  getStatistics(): {
    totalInstances: number;
    activeInstances: number;
    inactiveInstances: number;
    averageInitTime: number;
    averageActivationTime: number;
  } {
    const instances = Array.from(this.instances.values());
    const activeCount = instances.filter(i => i.status === PluginStatus.ACTIVE).length;
    const inactiveCount = instances.filter(i => i.status === PluginStatus.INACTIVE).length;

    const initTimes = instances.map(i => i.initTime || 0).filter(t => t > 0);
    const activationTimes = instances.map(i => i.activationTime || 0).filter(t => t > 0);

    const avgInitTime = initTimes.length > 0
      ? initTimes.reduce((a, b) => a + b, 0) / initTimes.length
      : 0;

    const avgActivationTime = activationTimes.length > 0
      ? activationTimes.reduce((a, b) => a + b, 0) / activationTimes.length
      : 0;

    return {
      totalInstances: instances.length,
      activeInstances: activeCount,
      inactiveInstances: inactiveCount,
      averageInitTime: avgInitTime,
      averageActivationTime: avgActivationTime
    };
  }

  /**
   * Clear all plugin instances
   */
  clearAllInstances(): void {
    this.instances.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let managerInstance: PluginManagerService | null = null;

/**
 * Get the singleton plugin manager instance
 */
export function getPluginManager(pluginsDir?: string): PluginManagerService {
  managerInstance ??= new PluginManagerService(pluginsDir);
  return managerInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetPluginManager(): void {
  managerInstance = null;
}
