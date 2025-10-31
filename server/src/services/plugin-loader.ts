/**
 * Plugin Loader Service
 * 
 * Loads plugins from the file system, validates manifests,
 * initializes plugins, and manages their lifecycle.
 * 
 * @module server/services/plugin-loader
 */

import type {
  PluginManifest,
  Plugin,
  PluginAPI,
} from "../../../shared/plugin-types";
import { pluginRegistry } from "./plugin-registry";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Plugin Loader - loads and initializes plugins
 */
export class PluginLoader {
  private readonly pluginsDir: string;
  private readonly loadedModules: Map<string, any> = new Map();

  constructor(pluginsDir: string) {
    this.pluginsDir = pluginsDir;
  }

  /**
   * Discover all plugins in the plugins directory
   */
  async discover(): Promise<PluginManifest[]> {
    const manifests: PluginManifest[] = [];

    try {
      // Check if plugins directory exists
      await fs.access(this.pluginsDir);
    } catch {
      // Create plugins directory if it doesn't exist
      await fs.mkdir(this.pluginsDir, { recursive: true });
      return manifests;
    }

    // Read all subdirectories
    const entries = await fs.readdir(this.pluginsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const pluginDir = path.join(this.pluginsDir, entry.name);
      const manifestPath = path.join(pluginDir, "plugin.json");

      try {
        // Check if manifest exists
        await fs.access(manifestPath);

        // Read and parse manifest
        const manifestContent = await fs.readFile(manifestPath, "utf-8");
        const manifest: PluginManifest = JSON.parse(manifestContent);

        manifests.push(manifest);
      } catch (error) {
        console.warn(
          `Failed to load plugin manifest from ${pluginDir}:`,
          error
        );
      }
    }

    return manifests;
  }

  /**
   * Load a plugin by ID
   */
  async load(pluginId: string, api: PluginAPI): Promise<Plugin> {
    // Get plugin entry from registry
    const entry = pluginRegistry.get(pluginId);
    if (!entry) {
      throw new Error(`Plugin ${pluginId} not found in registry`);
    }

    // Check if already loaded
    if (entry.instance) {
      return entry.instance;
    }

    // Update state
    pluginRegistry.updateState(pluginId, "loading");

    try {
      // Load plugin module
      const pluginModule = await this.loadModule(entry.manifest);

      // Create plugin instance
      const plugin: Plugin = {
        manifest: entry.manifest,
        enabled: pluginRegistry.isEnabled(pluginId),
        initialized: false,
        config: pluginRegistry.getConfiguration(pluginId)?.config || {},
        initialize: pluginModule.initialize || (async () => {}),
        activate: pluginModule.activate || (async () => {}),
        deactivate: pluginModule.deactivate || (async () => {}),
        dispose: pluginModule.dispose,
        components: pluginModule.components,
        menuItems: pluginModule.menuItems,
        toolbarButtons: pluginModule.toolbarButtons,
        routes: pluginModule.routes,
      };

      // Set instance in registry
      pluginRegistry.setInstance(pluginId, plugin);
      pluginRegistry.updateState(pluginId, "loaded");

      return plugin;
    } catch (error) {
      pluginRegistry.setError(
        pluginId,
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Initialize a plugin
   */
  async initialize(pluginId: string, api: PluginAPI): Promise<void> {
    const entry = pluginRegistry.get(pluginId);
    if (!entry || !entry.instance) {
      throw new Error(`Plugin ${pluginId} not loaded`);
    }

    if (entry.instance.initialized) {
      return; // Already initialized
    }

    // Update state
    pluginRegistry.updateState(pluginId, "initializing");

    try {
      // Call initialize hook
      await entry.instance.initialize(api);

      // Mark as initialized
      entry.instance.initialized = true;
      pluginRegistry.updateState(pluginId, "initialized");
    } catch (error) {
      pluginRegistry.setError(
        pluginId,
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Activate a plugin
   */
  async activate(pluginId: string): Promise<void> {
    const entry = pluginRegistry.get(pluginId);
    if (!entry || !entry.instance) {
      throw new Error(`Plugin ${pluginId} not loaded`);
    }

    if (!entry.instance.initialized) {
      throw new Error(`Plugin ${pluginId} not initialized`);
    }

    if (entry.state === "active") {
      return; // Already active
    }

    // Update state
    pluginRegistry.updateState(pluginId, "activating");

    try {
      // Call activate hook
      await entry.instance.activate();

      // Mark as active
      pluginRegistry.updateState(pluginId, "active");
    } catch (error) {
      pluginRegistry.setError(
        pluginId,
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Deactivate a plugin
   */
  async deactivate(pluginId: string): Promise<void> {
    const entry = pluginRegistry.get(pluginId);
    if (!entry || !entry.instance) {
      throw new Error(`Plugin ${pluginId} not loaded`);
    }

    if (entry.state !== "active") {
      return; // Not active
    }

    // Update state
    pluginRegistry.updateState(pluginId, "deactivating");

    try {
      // Call deactivate hook
      await entry.instance.deactivate();

      // Mark as deactivated
      pluginRegistry.updateState(pluginId, "deactivated");
    } catch (error) {
      pluginRegistry.setError(
        pluginId,
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Unload a plugin
   */
  async unload(pluginId: string): Promise<void> {
    const entry = pluginRegistry.get(pluginId);
    if (!entry || !entry.instance) {
      return; // Not loaded
    }

    // Ensure plugin is deactivated
    if (entry.state === "active") {
      await this.deactivate(pluginId);
    }

    // Call dispose hook if available
    if (entry.instance.dispose) {
      await entry.instance.dispose();
    }

    // Remove from loaded modules
    this.loadedModules.delete(pluginId);

    // Clear instance
    pluginRegistry.setInstance(pluginId, null as any);
    pluginRegistry.updateState(pluginId, "unloaded");
  }

  /**
   * Load all discovered plugins
   */
  async loadAll(api: PluginAPI): Promise<void> {
    // Discover plugins
    const manifests = await this.discover();

    // Register all plugins
    for (const manifest of manifests) {
      try {
        await pluginRegistry.register(manifest);
      } catch (error) {
        console.error(`Failed to register plugin ${manifest.id}:`, error);
      }
    }

    // Get load order (respecting dependencies)
    const loadOrder = pluginRegistry.getLoadOrder();

    // Load plugins in order
    for (const pluginId of loadOrder) {
      try {
        await this.load(pluginId, api);
      } catch (error) {
        console.error(`Failed to load plugin ${pluginId}:`, error);
      }
    }
  }

  /**
   * Initialize all loaded plugins
   */
  async initializeAll(api: PluginAPI): Promise<void> {
    const loadOrder = pluginRegistry.getLoadOrder();

    for (const pluginId of loadOrder) {
      const entry = pluginRegistry.get(pluginId);
      if (entry && entry.instance && !entry.instance.initialized) {
        try {
          await this.initialize(pluginId, api);
        } catch (error) {
          console.error(`Failed to initialize plugin ${pluginId}:`, error);
        }
      }
    }
  }

  /**
   * Activate all initialized plugins
   */
  async activateAll(): Promise<void> {
    const loadOrder = pluginRegistry.getLoadOrder();

    for (const pluginId of loadOrder) {
      const entry = pluginRegistry.get(pluginId);
      if (
        entry &&
        entry.instance &&
        entry.instance.initialized &&
        entry.instance.enabled
      ) {
        try {
          await this.activate(pluginId);
        } catch (error) {
          console.error(`Failed to activate plugin ${pluginId}:`, error);
        }
      }
    }
  }

  /**
   * Reload a plugin
   */
  async reload(pluginId: string, api: PluginAPI): Promise<void> {
    // Unload plugin
    await this.unload(pluginId);

    // Load plugin
    await this.load(pluginId, api);

    // Initialize plugin
    await this.initialize(pluginId, api);

    // Activate if enabled
    const entry = pluginRegistry.get(pluginId);
    if (entry && entry.instance && entry.instance.enabled) {
      await this.activate(pluginId);
    }
  }

  // ========== Private Methods ==========

  /**
   * Load plugin module from file system
   */
  private async loadModule(manifest: PluginManifest): Promise<any> {
    // Check if already loaded
    if (this.loadedModules.has(manifest.id)) {
      return this.loadedModules.get(manifest.id);
    }

    // Construct plugin path
    const pluginDir = path.join(this.pluginsDir, manifest.id);
    const mainPath = path.join(pluginDir, manifest.main);

    // Check if main file exists
    try {
      await fs.access(mainPath);
    } catch {
      throw new Error(`Plugin main file not found: ${mainPath}`);
    }

    // Load module
    const moduleUrl = pathToFileURL(mainPath).href;
    const module = await import(moduleUrl);

    // Cache module
    this.loadedModules.set(manifest.id, module);

    return module;
  }
}

// Export singleton instance
const pluginsDir = path.join(process.cwd(), "plugins");
export const pluginLoader = new PluginLoader(pluginsDir);
