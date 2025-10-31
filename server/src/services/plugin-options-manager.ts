/**
 * Plugin Options Manager Service
 * 
 * Manages plugin options/settings with validation, persistence, and retrieval.
 * Implements set-json-options and get-json-options standard actions.
 * 
 * Based on C# AasxPluginOptionsBase pattern.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Base interface for plugin options
 */
export interface AasxPluginOptionsBase {
  // Marker interface - plugins extend this with their specific options
}

/**
 * Options validation result
 */
export interface OptionsValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Options storage entry
 */
interface OptionsStorageEntry {
  pluginId: string;
  options: any;
  lastUpdated: string;
  version: string;
}

/**
 * Options storage format
 */
interface OptionsStorage {
  version: string;
  options: {
    [pluginId: string]: OptionsStorageEntry;
  };
}

/**
 * Plugin Options Manager Service
 * 
 * Singleton service for managing plugin options across the application.
 */
export class PluginOptionsManagerService {
  private static instance: PluginOptionsManagerService | null = null;
  
  private optionsCache: Map<string, any> = new Map();
  private optionsDir: string;
  private optionsFile: string;
  private initialized: boolean = false;
  
  private constructor() {
    this.optionsDir = path.join(process.cwd(), 'data', 'plugins');
    this.optionsFile = path.join(this.optionsDir, 'options.json');
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): PluginOptionsManagerService {
    if (!PluginOptionsManagerService.instance) {
      PluginOptionsManagerService.instance = new PluginOptionsManagerService();
    }
    return PluginOptionsManagerService.instance;
  }
  
  /**
   * Initialize the options manager
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      // Ensure options directory exists
      await fs.mkdir(this.optionsDir, { recursive: true });
      
      // Load existing options
      await this.loadOptions();
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize PluginOptionsManager:', error);
      throw error;
    }
  }
  
  /**
   * Set options for a plugin (implements set-json-options action)
   * 
   * @param pluginId Plugin identifier
   * @param optionsJson JSON string containing plugin options
   * @param validate Optional validation function
   * @returns Success status
   */
  public async setOptions(
    pluginId: string,
    optionsJson: string,
    validate?: (options: any) => OptionsValidationResult
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Parse JSON
      let options: any;
      try {
        options = JSON.parse(optionsJson);
      } catch (parseError) {
        return {
          success: false,
          error: `Invalid JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
        };
      }
      
      // Validate if validator provided
      if (validate) {
        const validation = validate(options);
        if (!validation.valid) {
          return {
            success: false,
            error: `Validation failed: ${validation.errors.join(', ')}`
          };
        }
      }
      
      // Update cache
      this.optionsCache.set(pluginId, options);
      
      // Persist to disk
      await this.saveOptions();
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get options for a plugin (implements get-json-options action)
   * 
   * @param pluginId Plugin identifier
   * @param defaultOptions Default options if none exist
   * @returns JSON string of plugin options
   */
  public getOptions(pluginId: string, defaultOptions?: any): string {
    const options = this.optionsCache.get(pluginId) || defaultOptions || {};
    return JSON.stringify(options, null, 2);
  }
  
  /**
   * Get parsed options for a plugin
   * 
   * @param pluginId Plugin identifier
   * @param defaultOptions Default options if none exist
   * @returns Parsed options object
   */
  public getParsedOptions<T = any>(pluginId: string, defaultOptions?: T): T {
    return (this.optionsCache.get(pluginId) as T) || defaultOptions || ({} as T);
  }
  
  /**
   * Check if plugin has options set
   * 
   * @param pluginId Plugin identifier
   * @returns True if options exist
   */
  public hasOptions(pluginId: string): boolean {
    return this.optionsCache.has(pluginId);
  }
  
  /**
   * Delete options for a plugin
   * 
   * @param pluginId Plugin identifier
   */
  public async deleteOptions(pluginId: string): Promise<void> {
    this.optionsCache.delete(pluginId);
    await this.saveOptions();
  }
  
  /**
   * Get all plugin IDs with options
   * 
   * @returns Array of plugin IDs
   */
  public getPluginIds(): string[] {
    return Array.from(this.optionsCache.keys());
  }
  
  /**
   * Clear all options (for testing)
   */
  public async clearAll(): Promise<void> {
    this.optionsCache.clear();
    await this.saveOptions();
  }
  
  /**
   * Load options from disk
   */
  private async loadOptions(): Promise<void> {
    try {
      const data = await fs.readFile(this.optionsFile, 'utf-8');
      const storage: OptionsStorage = JSON.parse(data);
      
      // Load into cache
      for (const [pluginId, entry] of Object.entries(storage.options)) {
        this.optionsCache.set(pluginId, entry.options);
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist yet - that's okay
        return;
      }
      throw error;
    }
  }
  
  /**
   * Save options to disk (atomic write)
   */
  private async saveOptions(): Promise<void> {
    const storage: OptionsStorage = {
      version: '1.0.0',
      options: {}
    };
    
    // Build storage structure
    const entries = Array.from(this.optionsCache.entries());
    for (const [pluginId, options] of entries) {
      storage.options[pluginId] = {
        pluginId,
        options,
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      };
    }
    
    // Atomic write
    const tempFile = `${this.optionsFile}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(storage, null, 2), 'utf-8');
    await fs.rename(tempFile, this.optionsFile);
  }
}

/**
 * Get singleton instance of PluginOptionsManager
 */
export function getPluginOptionsManager(): PluginOptionsManagerService {
  return PluginOptionsManagerService.getInstance();
}

/**
 * Helper function to create options validator
 * 
 * @param schema JSON schema for validation
 * @returns Validation function
 */
export function createOptionsValidator(schema: any): (options: any) => OptionsValidationResult {
  return (options: any): OptionsValidationResult => {
    const errors: string[] = [];
    
    // Basic type checking based on schema
    if (schema.type === 'object' && schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties as any)) {
        const value = options[key];
        
        // Check required fields
        if (schema.required?.includes(key) && value === undefined) {
          errors.push(`Missing required field: ${key}`);
          continue;
        }
        
        // Check types
        if (value !== undefined) {
          const expectedType = (propSchema as any).type;
          const actualType = Array.isArray(value) ? 'array' : typeof value;
          
          if (expectedType && expectedType !== actualType) {
            errors.push(`Field ${key}: expected ${expectedType}, got ${actualType}`);
          }
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  };
}
