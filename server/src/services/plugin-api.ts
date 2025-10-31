/**
 * Plugin API Implementation
 * 
 * Provides plugins with controlled access to core application services
 * including element operations, validation, UI integration, and storage.
 * 
 * @module server/services/plugin-api
 */

import type {
  PluginAPI,
  PluginManifest,
  PluginComponent,
  MenuItem,
  ToolbarButton,
  DialogOptions,
} from "../../../shared/plugin-types";
import type { Referable, Environment } from "../../../shared/aas-v3-types";
import type { ValidationResult } from "../../../shared/validation-types";
import * as fs from "node:fs/promises";
import * as path from "node:path";

/**
 * Plugin API Factory - creates plugin API instances with permission checking
 */
export class PluginAPIFactory {
  private readonly dataDir: string;
  private readonly pluginStorageDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.pluginStorageDir = path.join(dataDir, "plugin-storage");
  }

  /**
   * Create a plugin API instance for a specific plugin
   */
  createAPI(
    manifest: PluginManifest,
    services: PluginAPIServices
  ): PluginAPI {
    const permissions = new Set(manifest.permissions);
    const pluginId = manifest.id;

    return {
      // ========== Element Operations ==========
      getElement: async (id: string) => {
        this.checkPermission(permissions, "read:environment");
        return services.elementService.getElement(id);
      },

      updateElement: async (id: string, data: Partial<Referable>) => {
        this.checkPermission(permissions, "write:environment");
        return services.elementService.updateElement(id, data);
      },

      deleteElement: async (id: string) => {
        this.checkPermission(permissions, "write:environment");
        return services.elementService.deleteElement(id);
      },

      createElement: async (
        parentId: string,
        element: Referable,
        position?: number
      ) => {
        this.checkPermission(permissions, "write:environment");
        return services.elementService.createElement(parentId, element, position);
      },

      // ========== Environment Operations ==========
      getEnvironment: async () => {
        this.checkPermission(permissions, "read:environment");
        return services.environmentService.getEnvironment();
      },

      updateEnvironment: async (environment: Environment) => {
        this.checkPermission(permissions, "write:environment");
        return services.environmentService.updateEnvironment(environment);
      },

      // ========== Validation Operations ==========
      validate: async (element: Referable) => {
        this.checkPermission(permissions, "read:environment");
        return services.validationService.validate(element);
      },

      validateEnvironment: async () => {
        this.checkPermission(permissions, "read:environment");
        return services.validationService.validateEnvironment();
      },

      // ========== UI Integration ==========
      registerComponent: (component: PluginComponent) => {
        this.checkPermission(permissions, "ui:register");
        services.uiService.registerComponent(pluginId, component);
      },

      registerMenuItem: (item: MenuItem) => {
        this.checkPermission(permissions, "ui:register");
        services.uiService.registerMenuItem(pluginId, item);
      },

      registerToolbarButton: (button: ToolbarButton) => {
        this.checkPermission(permissions, "ui:register");
        services.uiService.registerToolbarButton(pluginId, button);
      },

      showNotification: (message: string, type: "info" | "success" | "warning" | "error") => {
        this.checkPermission(permissions, "ui:register");
        services.uiService.showNotification(message, type);
      },

      showDialog: async (dialog: DialogOptions) => {
        this.checkPermission(permissions, "ui:register");
        return services.uiService.showDialog(dialog);
      },

      // ========== Storage Operations ==========
      getPluginData: async (key: string) => {
        this.checkPermission(permissions, "storage");
        return this.getStorageData(pluginId, key);
      },

      setPluginData: async (key: string, value: any) => {
        this.checkPermission(permissions, "storage");
        return this.setStorageData(pluginId, key, value);
      },

      deletePluginData: async (key: string) => {
        this.checkPermission(permissions, "storage");
        return this.deleteStorageData(pluginId, key);
      },

      // ========== File Operations ==========
      readFile: async (filePath: string) => {
        this.checkPermission(permissions, "read:files");
        return this.readFile(pluginId, filePath);
      },

      writeFile: async (filePath: string, data: Buffer) => {
        this.checkPermission(permissions, "write:files");
        return this.writeFile(pluginId, filePath, data);
      },

      deleteFile: async (filePath: string) => {
        this.checkPermission(permissions, "write:files");
        return this.deleteFile(pluginId, filePath);
      },

      // ========== Network Operations ==========
      fetch: async (url: string, options?: RequestInit) => {
        this.checkPermission(permissions, "network");
        return fetch(url, options);
      },

      // ========== Plugin Information ==========
      getManifest: () => manifest,

      getConfig: () => {
        return services.configService.getConfig(pluginId);
      },

      updateConfig: async (config: Record<string, any>) => {
        return services.configService.updateConfig(pluginId, config);
      },
    };
  }

  // ========== Private Methods ==========

  private checkPermission(permissions: Set<string>, required: string): void {
    if (!permissions.has(required)) {
      throw new Error(`Permission denied: ${required}`);
    }
  }

  private async getStorageData(pluginId: string, key: string): Promise<any> {
    const storagePath = path.join(this.pluginStorageDir, pluginId, `${key}.json`);
    
    try {
      const data = await fs.readFile(storagePath, "utf-8");
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  private async setStorageData(pluginId: string, key: string, value: any): Promise<void> {
    const storageDir = path.join(this.pluginStorageDir, pluginId);
    const storagePath = path.join(storageDir, `${key}.json`);

    // Ensure directory exists
    await fs.mkdir(storageDir, { recursive: true });

    // Write data
    await fs.writeFile(storagePath, JSON.stringify(value, null, 2), "utf-8");
  }

  private async deleteStorageData(pluginId: string, key: string): Promise<void> {
    const storagePath = path.join(this.pluginStorageDir, pluginId, `${key}.json`);
    
    try {
      await fs.unlink(storagePath);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  private async readFile(pluginId: string, filePath: string): Promise<Buffer> {
    // Validate path to prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes("..")) {
      throw new Error("Invalid file path: directory traversal not allowed");
    }

    const fullPath = path.join(this.dataDir, "plugin-files", pluginId, normalizedPath);
    return fs.readFile(fullPath);
  }

  private async writeFile(pluginId: string, filePath: string, data: Buffer): Promise<void> {
    // Validate path to prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes("..")) {
      throw new Error("Invalid file path: directory traversal not allowed");
    }

    const fullPath = path.join(this.dataDir, "plugin-files", pluginId, normalizedPath);
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(fullPath, data);
  }

  private async deleteFile(pluginId: string, filePath: string): Promise<void> {
    // Validate path to prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes("..")) {
      throw new Error("Invalid file path: directory traversal not allowed");
    }

    const fullPath = path.join(this.dataDir, "plugin-files", pluginId, normalizedPath);
    await fs.unlink(fullPath);
  }
}

/**
 * Plugin API Services - dependencies injected into the API
 */
export interface PluginAPIServices {
  elementService: {
    getElement: (id: string) => Promise<Referable | null>;
    updateElement: (id: string, data: Partial<Referable>) => Promise<void>;
    deleteElement: (id: string) => Promise<void>;
    createElement: (parentId: string, element: Referable, position?: number) => Promise<string>;
  };
  environmentService: {
    getEnvironment: () => Promise<Environment>;
    updateEnvironment: (environment: Environment) => Promise<void>;
  };
  validationService: {
    validate: (element: Referable) => Promise<ValidationResult[]>;
    validateEnvironment: () => Promise<ValidationResult[]>;
  };
  uiService: {
    registerComponent: (pluginId: string, component: PluginComponent) => void;
    registerMenuItem: (pluginId: string, item: MenuItem) => void;
    registerToolbarButton: (pluginId: string, button: ToolbarButton) => void;
    showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
    showDialog: (dialog: DialogOptions) => Promise<any>;
  };
  configService: {
    getConfig: (pluginId: string) => Record<string, any>;
    updateConfig: (pluginId: string, config: Record<string, any>) => Promise<void>;
  };
}

// Export singleton instance
const dataDir = path.join(process.cwd(), "data");
export const pluginAPIFactory = new PluginAPIFactory(dataDir);
