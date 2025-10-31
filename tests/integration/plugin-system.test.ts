/**
 * Integration tests for Plugin System
 * 
 * Tests the complete plugin lifecycle including registration,
 * loading, initialization, activation, and deactivation.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PluginRegistry } from "../../server/src/services/plugin-registry";
import { PluginLoader } from "../../server/src/services/plugin-loader";
import { PluginAPIFactory } from "../../server/src/services/plugin-api";
import type { PluginManifest, PluginAPI } from "../../shared/plugin-types";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

describe("Plugin System Integration", () => {
  let registry: PluginRegistry;
  let loader: PluginLoader;
  let apiFactory: PluginAPIFactory;
  let testPluginsDir: string;
  let testDataDir: string;

  beforeEach(async () => {
    // Create temporary directories
    testPluginsDir = path.join(os.tmpdir(), `test-plugins-${Date.now()}`);
    testDataDir = path.join(os.tmpdir(), `test-data-${Date.now()}`);
    await fs.mkdir(testPluginsDir, { recursive: true });
    await fs.mkdir(testDataDir, { recursive: true });

    // Initialize services
    registry = new PluginRegistry();
    loader = new PluginLoader(testPluginsDir);
    apiFactory = new PluginAPIFactory(testDataDir);
  });

  afterEach(async () => {
    // Clean up
    registry.clear();
    try {
      await fs.rm(testPluginsDir, { recursive: true, force: true });
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("Plugin Registration", () => {
    it("should register and retrieve a plugin", async () => {
      const manifest: PluginManifest = {
        id: "test-plugin",
        name: "Test Plugin",
        version: "1.0.0",
        description: "A test plugin",
        author: { name: "Test Author", email: "test@example.com" },
        license: "MIT",
        main: "index.js",
        capabilities: {},
        permissions: [],
      };

      await registry.register(manifest);

      expect(registry.has("test-plugin")).toBe(true);
      const entry = registry.get("test-plugin");
      expect(entry?.manifest.id).toBe("test-plugin");
    });

    it("should handle multiple plugin registrations", async () => {
      const manifests: PluginManifest[] = [
        {
          id: "plugin-1",
          name: "Plugin 1",
          version: "1.0.0",
          description: "First plugin",
          author: { name: "Author", email: "author@example.com" },
          license: "MIT",
          main: "index.js",
          capabilities: {},
          permissions: [],
        },
        {
          id: "plugin-2",
          name: "Plugin 2",
          version: "1.0.0",
          description: "Second plugin",
          author: { name: "Author", email: "author@example.com" },
          license: "MIT",
          main: "index.js",
          capabilities: {},
          permissions: [],
        },
      ];

      for (const manifest of manifests) {
        await registry.register(manifest);
      }

      expect(registry.getAll()).toHaveLength(2);
    });
  });

  describe("Plugin API", () => {
    it("should create plugin API with permissions", () => {
      const manifest: PluginManifest = {
        id: "test-plugin",
        name: "Test Plugin",
        version: "1.0.0",
        description: "A test plugin",
        author: { name: "Test Author", email: "test@example.com" },
        license: "MIT",
        main: "index.js",
        capabilities: {},
        permissions: ["read:environment", "storage"],
      };

      const mockServices = {
        elementService: {
          getElement: async () => null,
          updateElement: async () => {},
          deleteElement: async () => {},
          createElement: async () => "new-id",
        },
        environmentService: {
          getEnvironment: async () => ({} as any),
          updateEnvironment: async () => {},
        },
        validationService: {
          validate: async () => [],
          validateEnvironment: async () => [],
        },
        uiService: {
          registerComponent: () => {},
          registerMenuItem: () => {},
          registerToolbarButton: () => {},
          showNotification: () => {},
          showDialog: async () => {},
        },
        configService: {
          getConfig: () => ({}),
          updateConfig: async () => {},
        },
      };

      const api = apiFactory.createAPI(manifest, mockServices);

      expect(api).toBeDefined();
      expect(api.getManifest()).toEqual(manifest);
    });

    it("should enforce permission checks", async () => {
      const manifest: PluginManifest = {
        id: "test-plugin",
        name: "Test Plugin",
        version: "1.0.0",
        description: "A test plugin",
        author: { name: "Test Author", email: "test@example.com" },
        license: "MIT",
        main: "index.js",
        capabilities: {},
        permissions: [], // No permissions
      };

      const mockServices = {
        elementService: {
          getElement: async () => null,
          updateElement: async () => {},
          deleteElement: async () => {},
          createElement: async () => "new-id",
        },
        environmentService: {
          getEnvironment: async () => ({} as any),
          updateEnvironment: async () => {},
        },
        validationService: {
          validate: async () => [],
          validateEnvironment: async () => [],
        },
        uiService: {
          registerComponent: () => {},
          registerMenuItem: () => {},
          registerToolbarButton: () => {},
          showNotification: () => {},
          showDialog: async () => {},
        },
        configService: {
          getConfig: () => ({}),
          updateConfig: async () => {},
        },
      };

      const api = apiFactory.createAPI(manifest, mockServices);

      // Should throw permission error
      await expect(api.getEnvironment()).rejects.toThrow("Permission denied");
    });
  });

  describe("Plugin Configuration", () => {
    it("should store and retrieve plugin configuration", async () => {
      const manifest: PluginManifest = {
        id: "test-plugin",
        name: "Test Plugin",
        version: "1.0.0",
        description: "A test plugin",
        author: { name: "Test Author", email: "test@example.com" },
        license: "MIT",
        main: "index.js",
        capabilities: {},
        permissions: [],
      };

      await registry.register(manifest);

      const config = {
        pluginId: "test-plugin",
        enabled: true,
        config: { setting1: "value1", setting2: 42 },
      };

      registry.setConfiguration(config);

      const retrieved = registry.getConfiguration("test-plugin");
      expect(retrieved).toEqual(config);
    });

    it("should enable and disable plugins", async () => {
      const manifest: PluginManifest = {
        id: "test-plugin",
        name: "Test Plugin",
        version: "1.0.0",
        description: "A test plugin",
        author: { name: "Test Author", email: "test@example.com" },
        license: "MIT",
        main: "index.js",
        capabilities: {},
        permissions: [],
      };

      await registry.register(manifest);

      registry.enable("test-plugin");
      expect(registry.isEnabled("test-plugin")).toBe(true);

      registry.disable("test-plugin");
      expect(registry.isEnabled("test-plugin")).toBe(false);
    });
  });

  describe("Plugin Dependencies", () => {
    it("should resolve plugin dependencies correctly", async () => {
      const dep1: PluginManifest = {
        id: "dep-1",
        name: "Dependency 1",
        version: "1.0.0",
        description: "First dependency",
        author: { name: "Author", email: "author@example.com" },
        license: "MIT",
        main: "index.js",
        capabilities: {},
        permissions: [],
      };

      const dep2: PluginManifest = {
        id: "dep-2",
        name: "Dependency 2",
        version: "1.0.0",
        description: "Second dependency",
        author: { name: "Author", email: "author@example.com" },
        license: "MIT",
        main: "index.js",
        capabilities: {},
        permissions: [],
        dependencies: {
          "dep-1": "^1.0.0",
        },
      };

      const main: PluginManifest = {
        id: "main-plugin",
        name: "Main Plugin",
        version: "1.0.0",
        description: "Main plugin",
        author: { name: "Author", email: "author@example.com" },
        license: "MIT",
        main: "index.js",
        capabilities: {},
        permissions: [],
        dependencies: {
          "dep-2": "^1.0.0",
        },
      };

      await registry.register(dep1);
      await registry.register(dep2);
      await registry.register(main);

      const loadOrder = registry.getLoadOrder();
      
      // Dependencies should come before dependents
      const dep1Index = loadOrder.indexOf("dep-1");
      const dep2Index = loadOrder.indexOf("dep-2");
      const mainIndex = loadOrder.indexOf("main-plugin");

      expect(dep1Index).toBeLessThan(dep2Index);
      expect(dep2Index).toBeLessThan(mainIndex);
    });
  });
});
