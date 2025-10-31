/**
 * Unit tests for Plugin Registry Service
 */

import { describe, it, expect, beforeEach } from "vitest";
import { PluginRegistry } from "../../../../server/src/services/plugin-registry";
import type { PluginManifest } from "../../../../shared/plugin-types";

describe("PluginRegistry", () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  describe("register", () => {
    it("should register a valid plugin", async () => {
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
      expect(entry).toBeDefined();
      expect(entry?.manifest.id).toBe("test-plugin");
      expect(entry?.state).toBe("unloaded");
    });

    it("should reject plugin with invalid ID format", async () => {
      const manifest: PluginManifest = {
        id: "Test_Plugin", // Invalid: uppercase and underscore
        name: "Test Plugin",
        version: "1.0.0",
        description: "A test plugin",
        author: { name: "Test Author", email: "test@example.com" },
        license: "MIT",
        main: "index.js",
        capabilities: {},
        permissions: [],
      };

      await expect(registry.register(manifest)).rejects.toThrow("Invalid plugin ID format");
    });

    it("should reject plugin with invalid version", async () => {
      const manifest: PluginManifest = {
        id: "test-plugin",
        name: "Test Plugin",
        version: "invalid", // Invalid version
        description: "A test plugin",
        author: { name: "Test Author", email: "test@example.com" },
        license: "MIT",
        main: "index.js",
        capabilities: {},
        permissions: [],
      };

      await expect(registry.register(manifest)).rejects.toThrow("Invalid version format");
    });

    it("should reject duplicate plugin registration", async () => {
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
      await expect(registry.register(manifest)).rejects.toThrow("already registered");
    });
  });

  describe("getAll", () => {
    it("should return all registered plugins", async () => {
      const manifest1: PluginManifest = {
        id: "plugin-1",
        name: "Plugin 1",
        version: "1.0.0",
        description: "First plugin",
        author: { name: "Author", email: "author@example.com" },
        license: "MIT",
        main: "index.js",
        capabilities: {},
        permissions: [],
      };

      const manifest2: PluginManifest = {
        id: "plugin-2",
        name: "Plugin 2",
        version: "2.0.0",
        description: "Second plugin",
        author: { name: "Author", email: "author@example.com" },
        license: "MIT",
        main: "index.js",
        capabilities: {},
        permissions: [],
      };

      await registry.register(manifest1);
      await registry.register(manifest2);

      const all = registry.getAll();
      expect(all).toHaveLength(2);
      expect(all.map((e) => e.manifest.id)).toContain("plugin-1");
      expect(all.map((e) => e.manifest.id)).toContain("plugin-2");
    });
  });

  describe("enable/disable", () => {
    it("should enable a plugin", async () => {
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
    });

    it("should disable a plugin", async () => {
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
      registry.disable("test-plugin");

      expect(registry.isEnabled("test-plugin")).toBe(false);
    });
  });

  describe("dependencies", () => {
    it("should resolve plugin dependencies", async () => {
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

      const resolved = registry.resolveDependencies("main-plugin");
      expect(resolved).toContain("dep-1");
      expect(resolved).toContain("dep-2");
    });

    it("should reject plugin with missing dependency", async () => {
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
        dependencies: {
          "missing-dep": "^1.0.0",
        },
      };

      await expect(registry.register(manifest)).rejects.toThrow("Dependency missing-dep not found");
    });
  });

  describe("getLoadOrder", () => {
    it("should return plugins in dependency order", async () => {
      const dep: PluginManifest = {
        id: "dependency",
        name: "Dependency",
        version: "1.0.0",
        description: "A dependency",
        author: { name: "Author", email: "author@example.com" },
        license: "MIT",
        main: "index.js",
        capabilities: {},
        permissions: [],
      };

      const main: PluginManifest = {
        id: "main",
        name: "Main",
        version: "1.0.0",
        description: "Main plugin",
        author: { name: "Author", email: "author@example.com" },
        license: "MIT",
        main: "index.js",
        capabilities: {},
        permissions: [],
        dependencies: {
          dependency: "^1.0.0",
        },
      };

      await registry.register(dep);
      await registry.register(main);

      const order = registry.getLoadOrder();
      const depIndex = order.indexOf("dependency");
      const mainIndex = order.indexOf("main");

      expect(depIndex).toBeLessThan(mainIndex);
    });
  });
});
