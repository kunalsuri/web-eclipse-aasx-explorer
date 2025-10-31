/**
 * Plugin Visual Extension Service
 * 
 * Manages visual extension checking, caching, and routing
 * Coordinates call-check-visual-extension action across plugins
 */

import type { AasxPluginResultVisualExtension } from "../../../shared/plugin-types";
import { StandardPluginActions } from "../../../shared/plugin-types";
import type { Submodel } from "../../../shared/aas-v3-types";
import { getPluginManager } from "./plugin-manager";
import { getPluginActionInvoker } from "./plugin-action-invoker";
import { PluginStatus } from "./plugin-registry";

// ============================================================================
// Visual Extension Types
// ============================================================================

export interface VisualExtensionMatch {
  pluginId: string;
  extension: AasxPluginResultVisualExtension;
  priority: number;              // Lower = higher priority
}

export interface VisualExtensionCacheEntry {
  submodelId: string;
  semanticId: string;
  matches: VisualExtensionMatch[];
  timestamp: number;
}

// ============================================================================
// Plugin Visual Extension Service
// ============================================================================

export class PluginVisualExtensionService {
  private readonly cache: Map<string, VisualExtensionCacheEntry> = new Map();
  private readonly cacheTimeout = 60000; // 1 minute

  /**
   * Check which plugins provide visual extensions for a Submodel
   */
  async checkVisualExtensions(submodel: Submodel): Promise<VisualExtensionMatch[]> {
    // Check cache first
    const cacheKey = this.getCacheKey(submodel);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.matches;
    }

    // Query all active plugins
    const matches: VisualExtensionMatch[] = [];
    const manager = getPluginManager();
    const activePlugins = manager.getActivePlugins();
    const invoker = getPluginActionInvoker();

    for (const instance of activePlugins) {
      try {
        // Check if plugin supports visual extension checking
        const actions = instance.plugin.listActions();
        const hasCheckAction = actions.some(
          a => a.name === StandardPluginActions.CALL_CHECK_VISUAL_EXTENSION
        );

        if (!hasCheckAction) {
          continue;
        }

        // Invoke check action
        const result = await invoker.invokeAction(
          instance.manifest.id,
          StandardPluginActions.CALL_CHECK_VISUAL_EXTENSION,
          [submodel],
          {
            timeout: 1000,        // Fast check (1 second)
            validateParams: false,
            trackMetrics: false   // Don't track for checks
          }
        );

        if (result.success && result.result) {
          const extension = result.result as AasxPluginResultVisualExtension;
          
          // Validate extension structure
          if (extension.tag && extension.caption) {
            matches.push({
              pluginId: instance.manifest.id,
              extension,
              priority: matches.length // Simple priority by order
            });
          }
        }
      } catch (error) {
        // Silently skip plugins that fail
        console.debug(`Visual extension check failed for ${instance.manifest.id}:`, error);
      }
    }

    // Cache results
    const cacheEntry: VisualExtensionCacheEntry = {
      submodelId: submodel.id || "",
      semanticId: submodel.semanticId?.keys?.[0]?.value || "",
      matches,
      timestamp: Date.now()
    };
    this.cache.set(cacheKey, cacheEntry);

    return matches;
  }

  /**
   * Get the best visual extension match for a Submodel
   */
  async getBestMatch(submodel: Submodel): Promise<VisualExtensionMatch | null> {
    const matches = await this.checkVisualExtensions(submodel);
    
    if (matches.length === 0) {
      return null;
    }

    // Return highest priority (lowest priority number)
    return matches.reduce((best, current) => 
      current.priority < best.priority ? current : best,
      matches[0]
    );
  }

  /**
   * Check if any plugin provides visual extension for a Submodel
   */
  async hasVisualExtension(submodel: Submodel): Promise<boolean> {
    const matches = await this.checkVisualExtensions(submodel);
    return matches.length > 0;
  }

  /**
   * Get visual extension from specific plugin
   */
  async getPluginExtension(
    pluginId: string,
    submodel: Submodel
  ): Promise<AasxPluginResultVisualExtension | null> {
    const manager = getPluginManager();
    const instance = manager.getPluginInstance(pluginId);

    if (!instance || instance.status !== PluginStatus.ACTIVE) {
      return null;
    }

    const invoker = getPluginActionInvoker();
    const result = await invoker.invokeAction(
      pluginId,
      StandardPluginActions.CALL_CHECK_VISUAL_EXTENSION,
      [submodel],
      {
        timeout: 1000,
        validateParams: false,
        trackMetrics: false
      }
    );

    if (result.success && result.result) {
      return result.result as AasxPluginResultVisualExtension;
    }

    return null;
  }

  /**
   * Clear cache for a specific Submodel
   */
  clearSubmodelCache(submodel: Submodel): void {
    const cacheKey = this.getCacheKey(submodel);
    this.cache.delete(cacheKey);
  }

  /**
   * Clear cache for a specific plugin
   */
  clearPluginCache(pluginId: string): void {
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.matches.some(m => m.pluginId === pluginId)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics(): {
    totalEntries: number;
    oldestEntry: number;
    averageMatches: number;
  } {
    const entries = Array.from(this.cache.values());
    
    if (entries.length === 0) {
      return {
        totalEntries: 0,
        oldestEntry: 0,
        averageMatches: 0
      };
    }

    const now = Date.now();
    const ages = entries.map(e => now - e.timestamp);
    const oldestAge = Math.max(...ages);
    const totalMatches = entries.reduce((sum, e) => sum + e.matches.length, 0);
    const avgMatches = totalMatches / entries.length;

    return {
      totalEntries: entries.length,
      oldestEntry: oldestAge,
      averageMatches: avgMatches
    };
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupExpiredCache(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now - entry.timestamp >= this.cacheTimeout) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get cache key for a Submodel
   */
  private getCacheKey(submodel: Submodel): string {
    // Use semantic ID as primary key, fallback to submodel ID
    const semanticId = submodel.semanticId?.keys?.[0]?.value || "";
    const submodelId = submodel.id || "";
    return semanticId || submodelId || "unknown";
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let extensionInstance: PluginVisualExtensionService | null = null;

/**
 * Get the singleton plugin visual extension service instance
 */
export function getPluginVisualExtension(): PluginVisualExtensionService {
  extensionInstance ??= new PluginVisualExtensionService();
  return extensionInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetPluginVisualExtension(): void {
  extensionInstance = null;
}
