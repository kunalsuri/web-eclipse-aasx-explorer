/**
 * Plugin Component Registry
 * 
 * Manages React component registration for plugins.
 * Enables plugins to register UI components that can be rendered dynamically.
 * 
 * Based on C# AnyUI visual extension pattern.
 */

import type { ComponentType } from 'react';

// ============================================================================
// Plugin Component Types
// ============================================================================

/**
 * Plugin component metadata
 */
export interface PluginComponentMetadata {
  pluginId: string;
  componentId: string;
  tag: string;              // e.g., "DOC" for Document Shelf
  caption: string;          // e.g., "Document Shelf"
  description?: string;
  icon?: string;
  priority?: number;        // Higher priority = shown first
}

/**
 * Registered plugin component
 */
export interface RegisteredPluginComponent {
  metadata: PluginComponentMetadata;
  component: ComponentType<any>;
  registeredAt: Date;
}

/**
 * Component lookup result
 */
export interface ComponentLookupResult {
  found: boolean;
  component?: ComponentType<any>;
  metadata?: PluginComponentMetadata;
}

// ============================================================================
// Plugin Component Registry Service
// ============================================================================

/**
 * Registry for plugin React components
 * 
 * Singleton service that manages component registration and lookup.
 */
export class PluginComponentRegistryService {
  private static instance: PluginComponentRegistryService | null = null;
  
  private components: Map<string, RegisteredPluginComponent> = new Map();
  private componentsByPlugin: Map<string, Set<string>> = new Map();
  private componentsByTag: Map<string, Set<string>> = new Map();
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): PluginComponentRegistryService {
    if (!PluginComponentRegistryService.instance) {
      PluginComponentRegistryService.instance = new PluginComponentRegistryService();
    }
    return PluginComponentRegistryService.instance;
  }
  
  /**
   * Register a plugin component
   * 
   * @param metadata Component metadata
   * @param component React component
   * @returns Component ID
   */
  registerComponent(
    metadata: PluginComponentMetadata,
    component: ComponentType<any>
  ): string {
    const componentKey = this.getComponentKey(metadata.pluginId, metadata.componentId);
    
    // Check if already registered
    if (this.components.has(componentKey)) {
      console.warn(`Component ${componentKey} already registered, replacing`);
      this.unregisterComponent(metadata.pluginId, metadata.componentId);
    }
    
    // Register component
    const registered: RegisteredPluginComponent = {
      metadata,
      component,
      registeredAt: new Date()
    };
    
    this.components.set(componentKey, registered);
    
    // Index by plugin
    if (!this.componentsByPlugin.has(metadata.pluginId)) {
      this.componentsByPlugin.set(metadata.pluginId, new Set());
    }
    this.componentsByPlugin.get(metadata.pluginId)!.add(componentKey);
    
    // Index by tag
    if (!this.componentsByTag.has(metadata.tag)) {
      this.componentsByTag.set(metadata.tag, new Set());
    }
    this.componentsByTag.get(metadata.tag)!.add(componentKey);
    
    console.log(`Registered component: ${componentKey} (tag: ${metadata.tag})`);
    
    return componentKey;
  }
  
  /**
   * Unregister a plugin component
   * 
   * @param pluginId Plugin identifier
   * @param componentId Component identifier
   * @returns True if component was unregistered
   */
  unregisterComponent(pluginId: string, componentId: string): boolean {
    const componentKey = this.getComponentKey(pluginId, componentId);
    const registered = this.components.get(componentKey);
    
    if (!registered) {
      return false;
    }
    
    // Remove from main registry
    this.components.delete(componentKey);
    
    // Remove from plugin index
    const pluginComponents = this.componentsByPlugin.get(pluginId);
    if (pluginComponents) {
      pluginComponents.delete(componentKey);
      if (pluginComponents.size === 0) {
        this.componentsByPlugin.delete(pluginId);
      }
    }
    
    // Remove from tag index
    const tagComponents = this.componentsByTag.get(registered.metadata.tag);
    if (tagComponents) {
      tagComponents.delete(componentKey);
      if (tagComponents.size === 0) {
        this.componentsByTag.delete(registered.metadata.tag);
      }
    }
    
    console.log(`Unregistered component: ${componentKey}`);
    
    return true;
  }
  
  /**
   * Unregister all components for a plugin
   * 
   * @param pluginId Plugin identifier
   * @returns Number of components unregistered
   */
  unregisterPluginComponents(pluginId: string): number {
    const componentKeys = this.componentsByPlugin.get(pluginId);
    
    if (!componentKeys) {
      return 0;
    }
    
    let count = 0;
    const keysArray = Array.from(componentKeys);
    for (const componentKey of keysArray) {
      const [pid, cid] = this.parseComponentKey(componentKey);
      if (this.unregisterComponent(pid, cid)) {
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Get a component by plugin and component ID
   * 
   * @param pluginId Plugin identifier
   * @param componentId Component identifier
   * @returns Component lookup result
   */
  getComponent(pluginId: string, componentId: string): ComponentLookupResult {
    const componentKey = this.getComponentKey(pluginId, componentId);
    const registered = this.components.get(componentKey);
    
    if (!registered) {
      return { found: false };
    }
    
    return {
      found: true,
      component: registered.component,
      metadata: registered.metadata
    };
  }
  
  /**
   * Get all components for a plugin
   * 
   * @param pluginId Plugin identifier
   * @returns Array of registered components
   */
  getPluginComponents(pluginId: string): RegisteredPluginComponent[] {
    const componentKeys = this.componentsByPlugin.get(pluginId);
    
    if (!componentKeys) {
      return [];
    }
    
    const components: RegisteredPluginComponent[] = [];
    const keysArray = Array.from(componentKeys);
    for (const componentKey of keysArray) {
      const registered = this.components.get(componentKey);
      if (registered) {
        components.push(registered);
      }
    }
    
    return components;
  }
  
  /**
   * Get all components with a specific tag
   * 
   * @param tag Component tag
   * @returns Array of registered components
   */
  getComponentsByTag(tag: string): RegisteredPluginComponent[] {
    const componentKeys = this.componentsByTag.get(tag);
    
    if (!componentKeys) {
      return [];
    }
    
    const components: RegisteredPluginComponent[] = [];
    const keysArray = Array.from(componentKeys);
    for (const componentKey of keysArray) {
      const registered = this.components.get(componentKey);
      if (registered) {
        components.push(registered);
      }
    }
    
    // Sort by priority (higher first)
    return components.sort((a, b) => {
      const priorityA = a.metadata.priority ?? 0;
      const priorityB = b.metadata.priority ?? 0;
      return priorityB - priorityA;
    });
  }
  
  /**
   * Check if a component is registered
   * 
   * @param pluginId Plugin identifier
   * @param componentId Component identifier
   * @returns True if component is registered
   */
  hasComponent(pluginId: string, componentId: string): boolean {
    const componentKey = this.getComponentKey(pluginId, componentId);
    return this.components.has(componentKey);
  }
  
  /**
   * Get all registered component tags
   * 
   * @returns Array of tags
   */
  getAllTags(): string[] {
    return Array.from(this.componentsByTag.keys());
  }
  
  /**
   * Get all registered plugin IDs
   * 
   * @returns Array of plugin IDs
   */
  getAllPluginIds(): string[] {
    return Array.from(this.componentsByPlugin.keys());
  }
  
  /**
   * Get total number of registered components
   * 
   * @returns Component count
   */
  getComponentCount(): number {
    return this.components.size;
  }
  
  /**
   * Clear all registered components (for testing)
   */
  clearAll(): void {
    this.components.clear();
    this.componentsByPlugin.clear();
    this.componentsByTag.clear();
  }
  
  /**
   * Get component key
   */
  private getComponentKey(pluginId: string, componentId: string): string {
    return `${pluginId}:${componentId}`;
  }
  
  /**
   * Parse component key
   */
  private parseComponentKey(componentKey: string): [string, string] {
    const parts = componentKey.split(':');
    return [parts[0], parts.slice(1).join(':')];
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get singleton instance of PluginComponentRegistry
 */
export function getPluginComponentRegistry(): PluginComponentRegistryService {
  return PluginComponentRegistryService.getInstance();
}

/**
 * Register a plugin component (convenience function)
 * 
 * @param metadata Component metadata
 * @param component React component
 * @returns Component ID
 */
export function registerPluginComponent(
  metadata: PluginComponentMetadata,
  component: ComponentType<any>
): string {
  return getPluginComponentRegistry().registerComponent(metadata, component);
}

/**
 * Unregister a plugin component (convenience function)
 * 
 * @param pluginId Plugin identifier
 * @param componentId Component identifier
 * @returns True if component was unregistered
 */
export function unregisterPluginComponent(pluginId: string, componentId: string): boolean {
  return getPluginComponentRegistry().unregisterComponent(pluginId, componentId);
}

/**
 * Get a plugin component (convenience function)
 * 
 * @param pluginId Plugin identifier
 * @param componentId Component identifier
 * @returns Component lookup result
 */
export function getPluginComponent(pluginId: string, componentId: string): ComponentLookupResult {
  return getPluginComponentRegistry().getComponent(pluginId, componentId);
}

/**
 * Get components by tag (convenience function)
 * 
 * @param tag Component tag
 * @returns Array of registered components
 */
export function getPluginComponentsByTag(tag: string): RegisteredPluginComponent[] {
  return getPluginComponentRegistry().getComponentsByTag(tag);
}
