/**
 * Plugin Registry Service
 * 
 * Manages plugin registration, discovery, and lifecycle state.
 * Maintains a registry of all available plugins and their current state.
 * 
 * @module server/services/plugin-registry
 */

import type {
  PluginManifest,
  Plugin,
  PluginRegistryEntry,
  PluginState,
  PluginConfiguration,
  PluginEvent,
} from "../../../shared/plugin-types";
import { EventEmitter } from "node:events";
import * as semver from "semver";

/**
 * Plugin Registry - manages plugin registration and state
 */
export class PluginRegistry extends EventEmitter {
  private readonly plugins: Map<string, PluginRegistryEntry> = new Map();
  private readonly configurations: Map<string, PluginConfiguration> = new Map();

  constructor() {
    super();
  }

  /**
   * Register a plugin with the registry
   */
  async register(manifest: PluginManifest): Promise<void> {
    // Validate manifest
    this.validateManifest(manifest);

    // Check if plugin already registered
    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin ${manifest.id} is already registered`);
    }

    // Check dependencies
    await this.checkDependencies(manifest);

    // Create registry entry
    const entry: PluginRegistryEntry = {
      manifest,
      instance: null,
      state: "unloaded",
      loadedAt: undefined,
      activatedAt: undefined,
    };

    // Add to registry
    this.plugins.set(manifest.id, entry);

    // Emit event
    this.emitPluginEvent("plugin:loaded", manifest.id);
  }

  /**
   * Unregister a plugin from the registry
   */
  async unregister(pluginId: string): Promise<void> {
    const entry = this.plugins.get(pluginId);
    if (!entry) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // Ensure plugin is not active
    if (entry.state === "active") {
      throw new Error(
        `Cannot unregister active plugin ${pluginId}. Deactivate it first.`
      );
    }

    // Remove from registry
    this.plugins.delete(pluginId);
    this.configurations.delete(pluginId);
  }

  /**
   * Get a plugin entry by ID
   */
  get(pluginId: string): PluginRegistryEntry | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all registered plugins
   */
  getAll(): PluginRegistryEntry[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugins by state
   */
  getByState(state: PluginState): PluginRegistryEntry[] {
    return this.getAll().filter((entry) => entry.state === state);
  }

  /**
   * Get active plugins
   */
  getActive(): PluginRegistryEntry[] {
    return this.getByState("active");
  }

  /**
   * Check if a plugin is registered
   */
  has(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * Update plugin state
   */
  updateState(pluginId: string, state: PluginState): void {
    const entry = this.plugins.get(pluginId);
    if (!entry) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    entry.state = state;

    // Update timestamps
    if (state === "loaded") {
      entry.loadedAt = new Date();
    } else if (state === "active") {
      entry.activatedAt = new Date();
    }

    // Emit state change event
    this.emit("state:changed", { pluginId, state });
  }

  /**
   * Set plugin instance
   */
  setInstance(pluginId: string, instance: Plugin): void {
    const entry = this.plugins.get(pluginId);
    if (!entry) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    entry.instance = instance;
  }

  /**
   * Set plugin error
   */
  setError(pluginId: string, error: Error): void {
    const entry = this.plugins.get(pluginId);
    if (!entry) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    entry.error = error;
    entry.state = "error";

    // Emit error event
    this.emitPluginEvent("plugin:error", pluginId, { error: error.message });
  }

  /**
   * Get plugin configuration
   */
  getConfiguration(pluginId: string): PluginConfiguration | undefined {
    return this.configurations.get(pluginId);
  }

  /**
   * Set plugin configuration
   */
  setConfiguration(config: PluginConfiguration): void {
    this.configurations.set(config.pluginId, config);

    // Emit config changed event
    this.emitPluginEvent("plugin:config:changed", config.pluginId, {
      config: config.config,
    });
  }

  /**
   * Get all plugin configurations
   */
  getAllConfigurations(): PluginConfiguration[] {
    return Array.from(this.configurations.values());
  }

  /**
   * Check if plugin is enabled
   */
  isEnabled(pluginId: string): boolean {
    const config = this.configurations.get(pluginId);
    return config ? config.enabled : true; // Default to enabled if no config
  }

  /**
   * Enable a plugin
   */
  enable(pluginId: string): void {
    const config = this.configurations.get(pluginId) || {
      pluginId,
      enabled: true,
      config: {},
    };

    config.enabled = true;
    this.setConfiguration(config);
  }

  /**
   * Disable a plugin
   */
  disable(pluginId: string): void {
    const config = this.configurations.get(pluginId) || {
      pluginId,
      enabled: false,
      config: {},
    };

    config.enabled = false;
    this.setConfiguration(config);
  }

  /**
   * Resolve plugin dependencies
   */
  resolveDependencies(pluginId: string): string[] {
    const entry = this.plugins.get(pluginId);
    if (!entry || !entry.manifest.dependencies) {
      return [];
    }

    const resolved: string[] = [];
    const visited = new Set<string>();

    const resolve = (id: string) => {
      if (visited.has(id)) {
        throw new Error(`Circular dependency detected: ${id}`);
      }

      visited.add(id);

      const plugin = this.plugins.get(id);
      if (!plugin) {
        throw new Error(`Dependency ${id} not found`);
      }

      if (plugin.manifest.dependencies) {
        for (const depId of Object.keys(plugin.manifest.dependencies)) {
          resolve(depId);
        }
      }

      if (!resolved.includes(id)) {
        resolved.push(id);
      }
    };

    for (const depId of Object.keys(entry.manifest.dependencies)) {
      resolve(depId);
    }

    return resolved;
  }

  /**
   * Get plugin load order (respecting dependencies)
   */
  getLoadOrder(): string[] {
    const order: string[] = [];
    const visited = new Set<string>();

    const visit = (pluginId: string) => {
      if (visited.has(pluginId)) {
        return;
      }

      visited.add(pluginId);

      const entry = this.plugins.get(pluginId);
      if (!entry) {
        return;
      }

      // Visit dependencies first
      if (entry.manifest.dependencies) {
        for (const depId of Object.keys(entry.manifest.dependencies)) {
          visit(depId);
        }
      }

      order.push(pluginId);
    };

    // Visit all plugins
    for (const pluginId of Array.from(this.plugins.keys())) {
      visit(pluginId);
    }

    return order;
  }

  /**
   * Clear the registry
   */
  clear(): void {
    this.plugins.clear();
    this.configurations.clear();
  }

  // ========== Private Methods ==========

  /**
   * Validate plugin manifest
   */
  private validateManifest(manifest: PluginManifest): void {
    // Required fields
    if (!manifest.id) {
      throw new Error("Plugin manifest must have an id");
    }

    if (!manifest.name) {
      throw new Error("Plugin manifest must have a name");
    }

    if (!manifest.version) {
      throw new Error("Plugin manifest must have a version");
    }

    // Validate version format
    if (!semver.valid(manifest.version)) {
      throw new Error(`Invalid version format: ${manifest.version}`);
    }

    // Validate ID format (lowercase, alphanumeric, hyphens)
    if (!/^[a-z0-9-]+$/.test(manifest.id)) {
      throw new Error(
        `Invalid plugin ID format: ${manifest.id}. Must be lowercase alphanumeric with hyphens.`
      );
    }

    // Validate permissions
    if (manifest.permissions) {
      const validPermissions = new Set([
        "read:environment",
        "write:environment",
        "read:files",
        "write:files",
        "network",
        "storage",
        "ui:register",
        "api:register",
      ]);

      for (const permission of manifest.permissions) {
        if (!validPermissions.has(permission)) {
          throw new Error(`Invalid permission: ${permission}`);
        }
      }
    }
  }

  /**
   * Check plugin dependencies
   */
  private async checkDependencies(manifest: PluginManifest): Promise<void> {
    if (!manifest.dependencies) {
      return;
    }

    for (const [depId, versionRange] of Object.entries(
      manifest.dependencies
    )) {
      const depEntry = this.plugins.get(depId);

      if (!depEntry) {
        throw new Error(
          `Dependency ${depId} not found for plugin ${manifest.id}`
        );
      }

      // Check version compatibility
      if (!semver.satisfies(depEntry.manifest.version, versionRange)) {
        throw new Error(
          `Dependency ${depId} version ${depEntry.manifest.version} does not satisfy ${versionRange}`
        );
      }
    }
  }

  /**
   * Emit plugin event
   */
  private emitPluginEvent(
    type: PluginEvent["type"],
    pluginId: string,
    data?: any
  ): void {
    const event: PluginEvent = {
      type,
      pluginId,
      timestamp: new Date(),
      data,
    };

    this.emit("plugin:event", event);
    this.emit(type, event);
  }
}

// Export singleton instance
export const pluginRegistry = new PluginRegistry();
