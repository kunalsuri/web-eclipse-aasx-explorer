/**
 * Plugin Visual Extension Component
 * 
 * Renders plugin-provided visual extensions for AAS elements.
 * Implements fill-anyui-visual-extension, update-anyui-visual-extension,
 * and dispose-anyui-visual-extension actions.
 * 
 * Based on C# AnyUI visual extension pattern.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import type { Submodel, Referable } from '../../../shared/aas-v3-types';
import { getPluginComponentsByTag } from '../services/plugin-component-registry';
import type { RegisteredPluginComponent } from '../services/plugin-component-registry';

// ============================================================================
// Component Props
// ============================================================================

export interface PluginVisualExtensionProps {
  // The referable element to display
  referable: Referable;
  
  // Optional: Specific plugin to use (if not provided, best match is selected)
  pluginId?: string;
  
  // Optional: Session ID for multi-user scenarios
  sessionId?: string;
  
  // Optional: Additional data to pass to plugin component
  data?: any;
  
  // Optional: Callback when plugin component is loaded
  onLoad?: (pluginId: string, tag: string) => void;
  
  // Optional: Callback when plugin component fails to load
  onError?: (error: string) => void;
  
  // Optional: Callback when plugin component is disposed
  onDispose?: (pluginId: string) => void;
}

// ============================================================================
// Component State
// ============================================================================

interface VisualExtensionState {
  loading: boolean;
  error: string | null;
  pluginComponent: RegisteredPluginComponent | null;
  componentProps: any;
}

// ============================================================================
// Plugin Visual Extension Component
// ============================================================================

/**
 * Renders a plugin visual extension for an AAS element
 * 
 * This component:
 * 1. Finds the best plugin to display the given referable
 * 2. Loads the plugin's React component
 * 3. Renders the component with appropriate props
 * 4. Handles updates and disposal
 */
export const PluginVisualExtension: React.FC<PluginVisualExtensionProps> = ({
  referable,
  pluginId,
  sessionId,
  data,
  onLoad,
  onError,
  onDispose
}) => {
  const [state, setState] = useState<VisualExtensionState>({
    loading: true,
    error: null,
    pluginComponent: null,
    componentProps: {}
  });
  
  const mountedRef = useRef(true);
  const currentPluginRef = useRef<string | null>(null);
  
  /**
   * Find the best plugin component for the referable
   */
  const findPluginComponent = useCallback(async (): Promise<RegisteredPluginComponent | null> => {
    try {
      // If specific plugin requested, try to find it
      if (pluginId) {
        // TODO: Call backend to check if plugin supports this referable
        // For now, just get all components and filter
        const allComponents = getPluginComponentsByTag('*');
        const component = allComponents.find(c => c.metadata.pluginId === pluginId);
        return component || null;
      }
      
      // Otherwise, call backend to find best match
      // TODO: Implement backend call to check-visual-extension
      // For now, return first available component
      const submodel = referable as Submodel;
      if (!submodel.semanticId) {
        return null;
      }
      
      // Get all registered components
      const allTags = ['DOC', 'TECH', 'EXPORT']; // Known tags
      for (const tag of allTags) {
        const components = getPluginComponentsByTag(tag);
        if (components.length > 0) {
          // Return highest priority component
          return components[0];
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding plugin component:', error);
      return null;
    }
  }, [pluginId, referable]);
  
  /**
   * Load the plugin component
   */
  const loadComponent = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const component = await findPluginComponent();
      
      if (!mountedRef.current) return;
      
      if (!component) {
        setState({
          loading: false,
          error: 'No plugin available for this element',
          pluginComponent: null,
          componentProps: {}
        });
        onError?.('No plugin available for this element');
        return;
      }
      
      // Prepare component props
      const componentProps = {
        referable,
        sessionId,
        data,
        // Callback for plugin to request updates
        onUpdate: (updateData: any) => {
          if (mountedRef.current) {
            setState(prev => ({
              ...prev,
              componentProps: { ...prev.componentProps, ...updateData }
            }));
          }
        }
      };
      
      setState({
        loading: false,
        error: null,
        pluginComponent: component,
        componentProps
      });
      
      currentPluginRef.current = component.metadata.pluginId;
      onLoad?.(component.metadata.pluginId, component.metadata.tag);
    } catch (error) {
      if (!mountedRef.current) return;
      
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setState({
        loading: false,
        error: errorMsg,
        pluginComponent: null,
        componentProps: {}
      });
      onError?.(errorMsg);
    }
  }, [findPluginComponent, referable, sessionId, data, onLoad, onError]);
  
  /**
   * Update the component with new data
   */
  const updateComponent = useCallback((updateData: any) => {
    if (!mountedRef.current) return;
    
    setState(prev => ({
      ...prev,
      componentProps: { ...prev.componentProps, ...updateData }
    }));
  }, []);
  
  /**
   * Dispose the component
   */
  const disposeComponent = useCallback(() => {
    if (currentPluginRef.current) {
      onDispose?.(currentPluginRef.current);
      currentPluginRef.current = null;
    }
    
    setState({
      loading: false,
      error: null,
      pluginComponent: null,
      componentProps: {}
    });
  }, [onDispose]);
  
  // Load component on mount or when referable changes
  useEffect(() => {
    loadComponent();
    
    return () => {
      mountedRef.current = false;
      disposeComponent();
    };
  }, [referable, pluginId]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Expose update and dispose methods via ref (if needed)
  // This would require forwardRef, but for now we handle it internally
  
  // Render
  if (state.loading) {
    return (
      <div className="plugin-visual-extension-loading">
        <div className="spinner" />
        <p>Loading plugin...</p>
      </div>
    );
  }
  
  if (state.error) {
    return (
      <div className="plugin-visual-extension-error">
        <p className="error-message">{state.error}</p>
      </div>
    );
  }
  
  if (!state.pluginComponent) {
    return (
      <div className="plugin-visual-extension-empty">
        <p>No plugin available for this element</p>
      </div>
    );
  }
  
  const PluginComponent = state.pluginComponent.component;
  
  return (
    <div className="plugin-visual-extension">
      <div className="plugin-visual-extension-header">
        <span className="plugin-tag">{state.pluginComponent.metadata.tag}</span>
        <span className="plugin-caption">{state.pluginComponent.metadata.caption}</span>
      </div>
      <div className="plugin-visual-extension-content">
        <PluginComponent {...state.componentProps} />
      </div>
    </div>
  );
};

// ============================================================================
// Hook for using visual extensions
// ============================================================================

/**
 * Hook for managing plugin visual extensions
 * 
 * @param referable The referable element
 * @param options Options
 * @returns Visual extension state and controls
 */
export function usePluginVisualExtension(
  referable: Referable | null,
  options: {
    pluginId?: string;
    sessionId?: string;
    data?: any;
  } = {}
) {
  const [state, setState] = useState<{
    available: boolean;
    loading: boolean;
    error: string | null;
    pluginId: string | null;
    tag: string | null;
  }>({
    available: false,
    loading: false,
    error: null,
    pluginId: null,
    tag: null
  });
  
  const checkAvailability = useCallback(async () => {
    if (!referable) {
      setState({
        available: false,
        loading: false,
        error: null,
        pluginId: null,
        tag: null
      });
      return;
    }
    
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      // TODO: Call backend to check if any plugin supports this referable
      // For now, assume available if it's a Submodel
      const submodel = referable as Submodel;
      const available = !!submodel.semanticId;
      
      setState({
        available,
        loading: false,
        error: null,
        pluginId: options.pluginId || null,
        tag: null
      });
    } catch (error) {
      setState({
        available: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        pluginId: null,
        tag: null
      });
    }
  }, [referable, options.pluginId]);
  
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);
  
  return {
    ...state,
    refresh: checkAvailability
  };
}

export default PluginVisualExtension;
