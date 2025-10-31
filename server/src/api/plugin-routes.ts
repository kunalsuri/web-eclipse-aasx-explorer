/**
 * Plugin API Routes
 * 
 * REST API endpoints for plugin management including listing,
 * enabling/disabling, and configuration.
 * 
 * @module server/api/plugin-routes
 */

import { Router, Request, Response } from "express";
import { pluginRegistry } from "../services/plugin-registry";
import { pluginLoader } from "../services/plugin-loader";
import type { PluginConfiguration } from "../../../shared/plugin-types";

const router = Router();

/**
 * GET /api/plugins
 * List all registered plugins
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const plugins = pluginRegistry.getAll();

    const pluginData = plugins.map((entry) => ({
      id: entry.manifest.id,
      name: entry.manifest.name,
      version: entry.manifest.version,
      description: entry.manifest.description,
      author: entry.manifest.author,
      enabled: pluginRegistry.isEnabled(entry.manifest.id),
      state: entry.state,
      error: entry.error?.message,
      config: pluginRegistry.getConfiguration(entry.manifest.id)?.config || {},
      configSchema: entry.manifest.configSchema,
      loadedAt: entry.loadedAt,
      activatedAt: entry.activatedAt,
    }));

    res.json({ plugins: pluginData });
  } catch (error) {
    console.error("Error listing plugins:", error);
    res.status(500).json({
      error: "Failed to list plugins",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/plugins/:id
 * Get details for a specific plugin
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const entry = pluginRegistry.get(id);

    if (!entry) {
      return res.status(404).json({ error: "Plugin not found" });
    }

    const pluginData = {
      id: entry.manifest.id,
      name: entry.manifest.name,
      version: entry.manifest.version,
      description: entry.manifest.description,
      author: entry.manifest.author,
      license: entry.manifest.license,
      homepage: entry.manifest.homepage,
      repository: entry.manifest.repository,
      enabled: pluginRegistry.isEnabled(entry.manifest.id),
      state: entry.state,
      error: entry.error?.message,
      config: pluginRegistry.getConfiguration(entry.manifest.id)?.config || {},
      configSchema: entry.manifest.configSchema,
      permissions: entry.manifest.permissions,
      dependencies: entry.manifest.dependencies,
      capabilities: entry.manifest.capabilities,
      loadedAt: entry.loadedAt,
      activatedAt: entry.activatedAt,
    };

    res.json(pluginData);
  } catch (error) {
    console.error("Error getting plugin:", error);
    res.status(500).json({
      error: "Failed to get plugin",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/plugins/:id/enable
 * Enable a plugin
 */
router.post("/:id/enable", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!pluginRegistry.has(id)) {
      return res.status(404).json({ error: "Plugin not found" });
    }

    // Enable plugin
    pluginRegistry.enable(id);

    // Activate if loaded and initialized
    const entry = pluginRegistry.get(id);
    if (entry && entry.instance && entry.instance.initialized) {
      await pluginLoader.activate(id);
    }

    res.json({ success: true, message: "Plugin enabled" });
  } catch (error) {
    console.error("Error enabling plugin:", error);
    res.status(500).json({
      error: "Failed to enable plugin",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/plugins/:id/disable
 * Disable a plugin
 */
router.post("/:id/disable", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!pluginRegistry.has(id)) {
      return res.status(404).json({ error: "Plugin not found" });
    }

    // Deactivate if active
    const entry = pluginRegistry.get(id);
    if (entry && entry.state === "active") {
      await pluginLoader.deactivate(id);
    }

    // Disable plugin
    pluginRegistry.disable(id);

    res.json({ success: true, message: "Plugin disabled" });
  } catch (error) {
    console.error("Error disabling plugin:", error);
    res.status(500).json({
      error: "Failed to disable plugin",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/plugins/:id/settings
 * Get plugin settings
 */
router.get("/:id/settings", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!pluginRegistry.has(id)) {
      return res.status(404).json({ error: "Plugin not found" });
    }

    const config = pluginRegistry.getConfiguration(id);
    const entry = pluginRegistry.get(id);

    res.json({
      config: config?.config || {},
      schema: entry?.manifest.configSchema,
    });
  } catch (error) {
    console.error("Error getting plugin settings:", error);
    res.status(500).json({
      error: "Failed to get plugin settings",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * PUT /api/plugins/:id/settings
 * Update plugin settings
 */
router.put("/:id/settings", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { config } = req.body;

    if (!pluginRegistry.has(id)) {
      return res.status(404).json({ error: "Plugin not found" });
    }

    if (!config || typeof config !== "object") {
      return res.status(400).json({ error: "Invalid config format" });
    }

    // Get existing configuration or create new one
    const existingConfig = pluginRegistry.getConfiguration(id) || {
      pluginId: id,
      enabled: pluginRegistry.isEnabled(id),
      config: {},
    };

    // Update configuration
    const updatedConfig: PluginConfiguration = {
      ...existingConfig,
      config,
    };

    pluginRegistry.setConfiguration(updatedConfig);

    res.json({ success: true, message: "Plugin settings updated" });
  } catch (error) {
    console.error("Error updating plugin settings:", error);
    res.status(500).json({
      error: "Failed to update plugin settings",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/plugins/:id/reload
 * Reload a plugin
 */
router.post("/:id/reload", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!pluginRegistry.has(id)) {
      return res.status(404).json({ error: "Plugin not found" });
    }

    // Note: This requires a PluginAPI instance which should be injected
    // For now, return not implemented
    res.status(501).json({
      error: "Plugin reload not yet implemented",
      message: "This feature requires plugin API integration",
    });
  } catch (error) {
    console.error("Error reloading plugin:", error);
    res.status(500).json({
      error: "Failed to reload plugin",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
