/**
 * Plugin AAS Data Access API
 * 
 * Provides read-only access to AAS data for plugins.
 * Implements permission-based access control.
 * 
 * Based on C# plugin API pattern where plugins can access:
 * - Current Environment
 * - Submodels by ID
 * - SubmodelElements by path
 * - Reference resolution
 * - Validation API
 */

import type {
  Environment,
  AssetAdministrationShell,
  Submodel,
  SubmodelElement,
  Reference,
  Key,
  Referable
} from "../../../shared/aas-v3-types";

// ============================================================================
// Plugin AAS API Types
// ============================================================================

/**
 * Plugin permissions for AAS data access
 */
export interface PluginAasPermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
}

/**
 * AAS data access result
 */
export interface AasDataResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Submodel element lookup options
 */
export interface SubmodelElementLookupOptions {
  // Path separator (default: ".")
  separator?: string;
  
  // Case-sensitive matching (default: false)
  caseSensitive?: boolean;
  
  // Include inherited elements (default: true)
  includeInherited?: boolean;
}

// ============================================================================
// Plugin AAS API Service
// ============================================================================

/**
 * AAS Data Access API for plugins
 * 
 * Provides read-only access to AAS data with permission checking.
 */
export class PluginAasApiService {
  private currentEnvironment: Environment | null = null;
  
  constructor(
    private readonly pluginId: string,
    private readonly permissions: PluginAasPermissions = { read: true, write: false, delete: false }
  ) {}
  
  /**
   * Set the current environment
   * 
   * @param environment AAS Environment
   */
  setEnvironment(environment: Environment | null): void {
    this.currentEnvironment = environment;
  }
  
  /**
   * Get the current AAS Environment (read-only)
   * 
   * @returns Current environment or null
   */
  getEnvironment(): AasDataResult<Environment> {
    if (!this.checkPermission('read')) {
      return {
        success: false,
        error: 'Read permission denied'
      };
    }
    
    if (!this.currentEnvironment) {
      return {
        success: false,
        error: 'No environment loaded'
      };
    }
    
    // Return deep copy to prevent modifications
    return {
      success: true,
      data: JSON.parse(JSON.stringify(this.currentEnvironment))
    };
  }
  
  /**
   * Get all Asset Administration Shells
   * 
   * @returns Array of AAS
   */
  getAssetAdministrationShells(): AasDataResult<AssetAdministrationShell[]> {
    if (!this.checkPermission('read')) {
      return {
        success: false,
        error: 'Read permission denied'
      };
    }
    
    if (!this.currentEnvironment) {
      return {
        success: false,
        error: 'No environment loaded'
      };
    }
    
    return {
      success: true,
      data: JSON.parse(JSON.stringify(this.currentEnvironment.assetAdministrationShells || []))
    };
  }
  
  /**
   * Get AAS by ID
   * 
   * @param id AAS identifier
   * @returns AAS or null
   */
  getAssetAdministrationShellById(id: string): AasDataResult<AssetAdministrationShell> {
    if (!this.checkPermission('read')) {
      return {
        success: false,
        error: 'Read permission denied'
      };
    }
    
    if (!this.currentEnvironment) {
      return {
        success: false,
        error: 'No environment loaded'
      };
    }
    
    const aas = this.currentEnvironment.assetAdministrationShells?.find(
      shell => shell.id === id
    );
    
    if (!aas) {
      return {
        success: false,
        error: `AAS not found: ${id}`
      };
    }
    
    return {
      success: true,
      data: JSON.parse(JSON.stringify(aas))
    };
  }
  
  /**
   * Get all Submodels
   * 
   * @returns Array of Submodels
   */
  getSubmodels(): AasDataResult<Submodel[]> {
    if (!this.checkPermission('read')) {
      return {
        success: false,
        error: 'Read permission denied'
      };
    }
    
    if (!this.currentEnvironment) {
      return {
        success: false,
        error: 'No environment loaded'
      };
    }
    
    return {
      success: true,
      data: JSON.parse(JSON.stringify(this.currentEnvironment.submodels || []))
    };
  }
  
  /**
   * Get Submodel by ID
   * 
   * @param id Submodel identifier
   * @returns Submodel or null
   */
  getSubmodelById(id: string): AasDataResult<Submodel> {
    if (!this.checkPermission('read')) {
      return {
        success: false,
        error: 'Read permission denied'
      };
    }
    
    if (!this.currentEnvironment) {
      return {
        success: false,
        error: 'No environment loaded'
      };
    }
    
    const submodel = this.currentEnvironment.submodels?.find(
      sm => sm.id === id
    );
    
    if (!submodel) {
      return {
        success: false,
        error: `Submodel not found: ${id}`
      };
    }
    
    return {
      success: true,
      data: JSON.parse(JSON.stringify(submodel))
    };
  }
  
  /**
   * Get Submodel by semantic ID
   * 
   * @param semanticId Semantic ID reference
   * @returns Array of matching Submodels
   */
  getSubmodelsBySemanticId(semanticId: Reference): AasDataResult<Submodel[]> {
    if (!this.checkPermission('read')) {
      return {
        success: false,
        error: 'Read permission denied'
      };
    }
    
    if (!this.currentEnvironment) {
      return {
        success: false,
        error: 'No environment loaded'
      };
    }
    
    const submodels = this.currentEnvironment.submodels?.filter(sm => {
      if (!sm.semanticId) return false;
      return this.referencesMatch(sm.semanticId, semanticId);
    }) || [];
    
    return {
      success: true,
      data: JSON.parse(JSON.stringify(submodels))
    };
  }
  
  /**
   * Get SubmodelElement by path
   * 
   * @param submodelId Submodel identifier
   * @param path Element path (e.g., "TechnicalData.Weight")
   * @param options Lookup options
   * @returns SubmodelElement or null
   */
  getSubmodelElementByPath(
    submodelId: string,
    path: string,
    options: SubmodelElementLookupOptions = {}
  ): AasDataResult<SubmodelElement> {
    if (!this.checkPermission('read')) {
      return {
        success: false,
        error: 'Read permission denied'
      };
    }
    
    const submodelResult = this.getSubmodelById(submodelId);
    if (!submodelResult.success || !submodelResult.data) {
      return {
        success: false,
        error: submodelResult.error || 'Submodel not found'
      };
    }
    
    const separator = options.separator || '.';
    const caseSensitive = options.caseSensitive ?? false;
    const pathParts = path.split(separator);
    
    let current: any = submodelResult.data;
    
    for (const part of pathParts) {
      if (!current.submodelElements) {
        return {
          success: false,
          error: `Path not found: ${path}`
        };
      }
      
      const element = current.submodelElements.find((el: SubmodelElement) => {
        const idShort = el.idShort || '';
        return caseSensitive
          ? idShort === part
          : idShort.toLowerCase() === part.toLowerCase();
      });
      
      if (!element) {
        return {
          success: false,
          error: `Element not found at path: ${path}`
        };
      }
      
      current = element;
    }
    
    return {
      success: true,
      data: JSON.parse(JSON.stringify(current))
    };
  }
  
  /**
   * Resolve a reference to its target element
   * 
   * @param reference Reference to resolve
   * @returns Resolved Referable or null
   */
  resolveReference(reference: Reference): AasDataResult<Referable> {
    if (!this.checkPermission('read')) {
      return {
        success: false,
        error: 'Read permission denied'
      };
    }
    
    if (!this.currentEnvironment) {
      return {
        success: false,
        error: 'No environment loaded'
      };
    }
    
    if (!reference.keys || reference.keys.length === 0) {
      return {
        success: false,
        error: 'Invalid reference: no keys'
      };
    }
    
    // Simple resolution: try to find by ID in AAS or Submodels
    const firstKey = reference.keys[0];
    
    // Try AAS
    if (firstKey.type === 'AssetAdministrationShell') {
      const aasResult = this.getAssetAdministrationShellById(firstKey.value);
      if (aasResult.success && aasResult.data) {
        return {
          success: true,
          data: aasResult.data as Referable
        };
      }
    }
    
    // Try Submodel
    if (firstKey.type === 'Submodel') {
      const smResult = this.getSubmodelById(firstKey.value);
      if (smResult.success && smResult.data) {
        return {
          success: true,
          data: smResult.data as Referable
        };
      }
    }
    
    return {
      success: false,
      error: 'Reference could not be resolved'
    };
  }
  
  /**
   * Find all Submodels that match a predicate
   * 
   * @param predicate Filter function
   * @returns Array of matching Submodels
   */
  findSubmodels(predicate: (sm: Submodel) => boolean): AasDataResult<Submodel[]> {
    if (!this.checkPermission('read')) {
      return {
        success: false,
        error: 'Read permission denied'
      };
    }
    
    if (!this.currentEnvironment) {
      return {
        success: false,
        error: 'No environment loaded'
      };
    }
    
    const submodels = this.currentEnvironment.submodels?.filter(predicate) || [];
    
    return {
      success: true,
      data: JSON.parse(JSON.stringify(submodels))
    };
  }
  
  /**
   * Check if plugin has a specific permission
   * 
   * @param permission Permission to check
   * @returns True if permission granted
   */
  private checkPermission(permission: keyof PluginAasPermissions): boolean {
    const hasPermission = this.permissions[permission];
    
    if (!hasPermission) {
      console.warn(`Plugin ${this.pluginId} attempted ${permission} without permission`);
    }
    
    return hasPermission;
  }
  
  /**
   * Check if two references match
   * 
   * @param ref1 First reference
   * @param ref2 Second reference
   * @returns True if references match
   */
  private referencesMatch(ref1: Reference, ref2: Reference): boolean {
    if (!ref1.keys || !ref2.keys) return false;
    if (ref1.keys.length !== ref2.keys.length) return false;
    
    for (let i = 0; i < ref1.keys.length; i++) {
      if (!this.keysMatch(ref1.keys[i], ref2.keys[i])) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Check if two keys match
   * 
   * @param key1 First key
   * @param key2 Second key
   * @returns True if keys match
   */
  private keysMatch(key1: Key, key2: Key): boolean {
    return key1.type === key2.type && key1.value === key2.value;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new Plugin AAS API instance
 * 
 * @param pluginId Plugin identifier
 * @param permissions Plugin permissions
 * @returns PluginAasApiService instance
 */
export function createPluginAasApi(
  pluginId: string,
  permissions: PluginAasPermissions = { read: true, write: false, delete: false }
): PluginAasApiService {
  return new PluginAasApiService(pluginId, permissions);
}
