/**
 * Plugin Standard Actions Helper
 * 
 * Provides helper functions for implementing standard plugin actions.
 * Based on C# AasxPluginBase.ActivateActionBasicHelper pattern.
 * 
 * Standard actions include:
 * - get-licenses: Return license information
 * - get-events: Pop event from event stack
 * - get-presets: Return plugin presets/options
 * - set-json-options: Set plugin options from JSON
 * - get-json-options: Get plugin options as JSON
 */

import type {
  AasxPluginResultBase,
  AasxPluginResultBaseObject,
  AasxPluginResultLicense,
  PluginContext
} from "../../../shared/plugin-types";
import { StandardPluginActions } from "../../../shared/plugin-types";
import { getPluginOptionsManager } from "./plugin-options-manager";

// ============================================================================
// Standard Action Handler Types
// ============================================================================

/**
 * License information for a plugin
 */
export interface PluginLicenseInfo {
  shortLicense: string;   // For splash screen
  longLicense: string;    // For About box
  isStandardLicense: boolean;
}

/**
 * Preset information for a plugin
 */
export interface PluginPresetInfo {
  name: string;
  description?: string;
  options: any;
}

/**
 * Standard action handler configuration
 */
export interface StandardActionConfig {
  // License information
  license?: PluginLicenseInfo;
  
  // Presets
  presets?: PluginPresetInfo[];
  
  // Default options
  defaultOptions?: any;
  
  // Options validator
  validateOptions?: (options: any) => { valid: boolean; errors: string[] };
}

// ============================================================================
// Standard Action Helper
// ============================================================================

/**
 * Helper class for implementing standard plugin actions
 * 
 * Usage:
 * ```typescript
 * const helper = new StandardActionHelper(pluginId, context, config);
 * const result = helper.handleStandardAction(action, args);
 * if (result) return result; // Standard action handled
 * // Handle custom actions...
 * ```
 */
export class StandardActionHelper {
  constructor(
    private readonly pluginId: string,
    private readonly context: PluginContext,
    private readonly config: StandardActionConfig = {}
  ) {}
  
  /**
   * Handle a standard action
   * 
   * @param action Action name
   * @param args Action arguments
   * @returns Result if action was handled, null otherwise
   */
  handleStandardAction(action: string, ...args: any[]): AasxPluginResultBase | null {
    switch (action) {
      case StandardPluginActions.GET_LICENSES:
        return this.handleGetLicenses();
      
      case StandardPluginActions.GET_EVENTS:
        return this.handleGetEvents();
      
      case StandardPluginActions.GET_PRESETS:
        return this.handleGetPresets();
      
      case StandardPluginActions.SET_JSON_OPTIONS:
        return this.handleSetJsonOptions(args);
      
      case StandardPluginActions.GET_JSON_OPTIONS:
        return this.handleGetJsonOptions();
      
      default:
        return null; // Not a standard action
    }
  }
  
  /**
   * Handle get-licenses action
   */
  private handleGetLicenses(): AasxPluginResultLicense | null {
    if (!this.config.license) {
      return null;
    }
    
    return {
      shortLicense: this.config.license.shortLicense,
      longLicense: this.config.license.longLicense,
      isStandardLicense: this.config.license.isStandardLicense
    };
  }
  
  /**
   * Handle get-events action
   */
  private handleGetEvents(): AasxPluginResultBase | null {
    return this.context.eventStack.popEvent();
  }
  
  /**
   * Handle get-presets action
   */
  private handleGetPresets(): AasxPluginResultBaseObject | null {
    if (!this.config.presets || this.config.presets.length === 0) {
      return null;
    }
    
    return {
      strType: "OK",
      obj: this.config.presets
    };
  }
  
  /**
   * Handle set-json-options action
   */
  private handleSetJsonOptions(args: any[]): AasxPluginResultBaseObject | null {
    if (args.length < 1 || typeof args[0] !== "string") {
      return {
        strType: "ERROR",
        obj: "Missing or invalid JSON options string"
      };
    }
    
    const optionsJson = args[0] as string;
    const optionsManager = getPluginOptionsManager();
    
    // Set options with optional validation (async)
    optionsManager.setOptions(
      this.pluginId,
      optionsJson,
      this.config.validateOptions
    ).then(result => {
      if (!result.success) {
        console.error(`Failed to set options for ${this.pluginId}:`, result.error);
      }
    }).catch(error => {
      console.error(`Error setting options for ${this.pluginId}:`, error);
    });
    
    // Update context options
    try {
      this.context.options = JSON.parse(optionsJson);
    } catch (error) {
      // Should not happen since optionsManager already validated
      console.error(`Failed to update context options for ${this.pluginId}:`, error);
    }
    
    return {
      strType: "OK",
      obj: "Options updated successfully"
    };
  }
  
  /**
   * Handle get-json-options action
   */
  private handleGetJsonOptions(): AasxPluginResultBaseObject {
    const optionsManager = getPluginOptionsManager();
    const optionsJson = optionsManager.getOptions(
      this.pluginId,
      this.config.defaultOptions
    );
    
    return {
      strType: "OK",
      obj: optionsJson
    };
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a standard action helper for a plugin
 * 
 * @param pluginId Plugin identifier
 * @param context Plugin context
 * @param config Standard action configuration
 * @returns StandardActionHelper instance
 */
export function createStandardActionHelper(
  pluginId: string,
  context: PluginContext,
  config: StandardActionConfig = {}
): StandardActionHelper {
  return new StandardActionHelper(pluginId, context, config);
}

/**
 * Helper function to implement activateAction with standard action support
 * 
 * This is the TypeScript equivalent of C# AasxPluginBase.ActivateActionBasicHelper
 * 
 * Usage:
 * ```typescript
 * activateAction(action: string, ...args: any[]): AasxPluginResultBase | null {
 *   // Try standard actions first
 *   const standardResult = activateActionBasicHelper(
 *     this.pluginId,
 *     this.context,
 *     this.config,
 *     action,
 *     args
 *   );
 *   if (standardResult) return standardResult;
 *   
 *   // Handle custom actions
 *   if (action === "my-custom-action") {
 *     return this.handleCustomAction(args);
 *   }
 *   
 *   return null;
 * }
 * ```
 * 
 * @param pluginId Plugin identifier
 * @param context Plugin context
 * @param config Standard action configuration
 * @param action Action name
 * @param args Action arguments
 * @returns Result if standard action was handled, null otherwise
 */
export function activateActionBasicHelper(
  pluginId: string,
  context: PluginContext,
  config: StandardActionConfig,
  action: string,
  args: any[]
): AasxPluginResultBase | null {
  const helper = new StandardActionHelper(pluginId, context, config);
  return helper.handleStandardAction(action, ...args);
}

// ============================================================================
// Default License Templates
// ============================================================================

/**
 * MIT License template
 */
export function createMITLicense(
  libraryName: string,
  copyrightHolder: string = "the authors"
): PluginLicenseInfo {
  return {
    shortLicense: `The ${libraryName} library is licensed under the MIT license (MIT).`,
    longLicense: `MIT License

Copyright (c) ${new Date().getFullYear()} ${copyrightHolder}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
    isStandardLicense: true
  };
}

/**
 * Apache 2.0 License template
 */
export function createApache2License(
  libraryName: string,
  copyrightHolder: string = "the authors"
): PluginLicenseInfo {
  return {
    shortLicense: `The ${libraryName} library is licensed under the Apache License 2.0.`,
    longLicense: `Apache License 2.0

Copyright (c) ${new Date().getFullYear()} ${copyrightHolder}

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,
    isStandardLicense: true
  };
}

/**
 * Custom license template
 */
export function createCustomLicense(
  shortText: string,
  longText: string
): PluginLicenseInfo {
  return {
    shortLicense: shortText,
    longLicense: longText,
    isStandardLicense: false
  };
}
