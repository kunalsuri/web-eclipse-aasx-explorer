/**
 * Plugin Panel Container Component
 * 
 * Manages plugin panels with show/hide, resize, and state persistence.
 * Provides a container for plugin visual extensions.
 * 
 * Based on C# panel management pattern.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PluginVisualExtension } from './PluginVisualExtension';
import type { Referable } from '../../../shared/aas-v3-types';

// ============================================================================
// Panel Types
// ============================================================================

export interface PluginPanel {
  id: string;
  pluginId: string;
  title: string;
  icon?: string;
  referable: Referable;
  sessionId?: string;
  data?: any;
  visible: boolean;
  width?: number;
  height?: number;
  position?: 'sidebar' | 'bottom' | 'modal';
}

export interface PluginPanelState {
  panels: Map<string, PluginPanel>;
  activePanel: string | null;
}

// ============================================================================
// Panel Container Props
// ============================================================================

export interface PluginPanelContainerProps {
  // Initial panels
  initialPanels?: PluginPanel[];
  
  // Position of the container
  position?: 'sidebar' | 'bottom' | 'modal';
  
  // Default panel size
  defaultWidth?: number;
  defaultHeight?: number;
  
  // Callbacks
  onPanelAdd?: (panel: PluginPanel) => void;
  onPanelRemove?: (panelId: string) => void;
  onPanelActivate?: (panelId: string) => void;
  onPanelResize?: (panelId: string, width: number, height: number) => void;
}

// ============================================================================
// Plugin Panel Container Component
// ============================================================================

/**
 * Container for plugin panels
 * 
 * Features:
 * - Multiple panels with tabs
 * - Show/hide panels
 * - Resize panels
 * - Persist panel state
 * - Activate/deactivate panels
 */
export const PluginPanelContainer: React.FC<PluginPanelContainerProps> = ({
  initialPanels = [],
  position = 'sidebar',
  defaultWidth = 400,
  defaultHeight = 600,
  onPanelAdd,
  onPanelRemove,
  onPanelActivate,
  onPanelResize
}) => {
  const [state, setState] = useState<PluginPanelState>(() => {
    const panels = new Map<string, PluginPanel>();
    initialPanels.forEach(panel => {
      panels.set(panel.id, panel);
    });
    return {
      panels,
      activePanel: initialPanels.length > 0 ? initialPanels[0].id : null
    };
  });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [containerSize, setContainerSize] = useState({
    width: defaultWidth,
    height: defaultHeight
  });
  
  /**
   * Add a panel
   */
  const addPanel = useCallback((panel: PluginPanel) => {
    setState(prev => {
      const newPanels = new Map(prev.panels);
      newPanels.set(panel.id, panel);
      
      return {
        panels: newPanels,
        activePanel: panel.visible ? panel.id : prev.activePanel
      };
    });
    
    onPanelAdd?.(panel);
  }, [onPanelAdd]);
  
  /**
   * Remove a panel
   */
  const removePanel = useCallback((panelId: string) => {
    setState(prev => {
      const newPanels = new Map(prev.panels);
      newPanels.delete(panelId);
      
      let newActivePanel = prev.activePanel;
      if (prev.activePanel === panelId) {
        // Find next visible panel
        const visiblePanels = Array.from(newPanels.values()).filter(p => p.visible);
        newActivePanel = visiblePanels.length > 0 ? visiblePanels[0].id : null;
      }
      
      return {
        panels: newPanels,
        activePanel: newActivePanel
      };
    });
    
    onPanelRemove?.(panelId);
  }, [onPanelRemove]);
  
  /**
   * Show a panel
   */
  const showPanel = useCallback((panelId: string) => {
    setState(prev => {
      const panel = prev.panels.get(panelId);
      if (!panel) return prev;
      
      const newPanels = new Map(prev.panels);
      newPanels.set(panelId, { ...panel, visible: true });
      
      return {
        panels: newPanels,
        activePanel: panelId
      };
    });
  }, []);
  
  /**
   * Hide a panel
   */
  const hidePanel = useCallback((panelId: string) => {
    setState(prev => {
      const panel = prev.panels.get(panelId);
      if (!panel) return prev;
      
      const newPanels = new Map(prev.panels);
      newPanels.set(panelId, { ...panel, visible: false });
      
      let newActivePanel = prev.activePanel;
      if (prev.activePanel === panelId) {
        // Find next visible panel
        const visiblePanels = Array.from(newPanels.values()).filter(p => p.visible && p.id !== panelId);
        newActivePanel = visiblePanels.length > 0 ? visiblePanels[0].id : null;
      }
      
      return {
        panels: newPanels,
        activePanel: newActivePanel
      };
    });
  }, []);
  
  /**
   * Activate a panel
   */
  const activatePanel = useCallback((panelId: string) => {
    setState(prev => {
      const panel = prev.panels.get(panelId);
      if (!panel || !panel.visible) return prev;
      
      return {
        ...prev,
        activePanel: panelId
      };
    });
    
    onPanelActivate?.(panelId);
  }, [onPanelActivate]);
  
  /**
   * Handle resize start
   */
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);
  
  /**
   * Handle resize move
   */
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    if (position === 'sidebar') {
      const newWidth = e.clientX - rect.left;
      if (newWidth >= 200 && newWidth <= 800) {
        setContainerSize(prev => ({ ...prev, width: newWidth }));
      }
    } else if (position === 'bottom') {
      const newHeight = rect.bottom - e.clientY;
      if (newHeight >= 200 && newHeight <= 600) {
        setContainerSize(prev => ({ ...prev, height: newHeight }));
      }
    }
  }, [isResizing, position]);
  
  /**
   * Handle resize end
   */
  const handleResizeEnd = useCallback(() => {
    if (isResizing && state.activePanel) {
      onPanelResize?.(state.activePanel, containerSize.width, containerSize.height);
    }
    setIsResizing(false);
  }, [isResizing, state.activePanel, containerSize, onPanelResize]);
  
  // Setup resize listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);
  
  // Load panel state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('plugin-panel-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.containerSize) {
          setContainerSize(parsed.containerSize);
        }
      } catch (error) {
        console.error('Failed to load panel state:', error);
      }
    }
  }, []);
  
  // Save panel state to localStorage
  useEffect(() => {
    const stateToSave = {
      containerSize,
      activePanel: state.activePanel
    };
    localStorage.setItem('plugin-panel-state', JSON.stringify(stateToSave));
  }, [containerSize, state.activePanel]);
  
  // Get visible panels
  const visiblePanels = Array.from(state.panels.values()).filter(p => p.visible);
  
  if (visiblePanels.length === 0) {
    return null;
  }
  
  const activePanel = state.activePanel ? state.panels.get(state.activePanel) : null;
  
  const containerStyle: React.CSSProperties = {
    width: position === 'sidebar' ? `${containerSize.width}px` : '100%',
    height: position === 'bottom' ? `${containerSize.height}px` : '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    borderLeft: position === 'sidebar' ? '1px solid #e0e0e0' : 'none',
    borderTop: position === 'bottom' ? '1px solid #e0e0e0' : 'none'
  };
  
  return (
    <div
      ref={containerRef}
      className={`plugin-panel-container plugin-panel-${position}`}
      style={containerStyle}
    >
      {/* Resize handle */}
      {position !== 'modal' && (
        <div
          ref={resizeHandleRef}
          className={`resize-handle resize-handle-${position}`}
          onMouseDown={handleResizeStart}
          style={{
            position: 'absolute',
            [position === 'sidebar' ? 'left' : 'top']: 0,
            [position === 'sidebar' ? 'width' : 'height']: '4px',
            [position === 'sidebar' ? 'height' : 'width']: '100%',
            cursor: position === 'sidebar' ? 'ew-resize' : 'ns-resize',
            backgroundColor: isResizing ? '#007bff' : 'transparent',
            zIndex: 10
          }}
        />
      )}
      
      {/* Panel tabs */}
      <div className="plugin-panel-tabs" style={{
        display: 'flex',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#f5f5f5',
        padding: '4px'
      }}>
        {visiblePanels.map(panel => (
          <button
            key={panel.id}
            className={`plugin-panel-tab ${state.activePanel === panel.id ? 'active' : ''}`}
            onClick={() => activatePanel(panel.id)}
            style={{
              padding: '8px 16px',
              border: 'none',
              backgroundColor: state.activePanel === panel.id ? '#fff' : 'transparent',
              borderBottom: state.activePanel === panel.id ? '2px solid #007bff' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {panel.icon && <span className="panel-icon">{panel.icon}</span>}
            <span className="panel-title">{panel.title}</span>
            <button
              className="panel-close"
              onClick={(e) => {
                e.stopPropagation();
                hidePanel(panel.id);
              }}
              style={{
                marginLeft: '8px',
                padding: '2px 6px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ×
            </button>
          </button>
        ))}
      </div>
      
      {/* Active panel content */}
      <div className="plugin-panel-content" style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px'
      }}>
        {activePanel && (
          <PluginVisualExtension
            referable={activePanel.referable}
            pluginId={activePanel.pluginId}
            sessionId={activePanel.sessionId}
            data={activePanel.data}
            onLoad={(pluginId, tag) => {
              console.log(`Panel ${activePanel.id} loaded: ${pluginId} (${tag})`);
            }}
            onError={(error) => {
              console.error(`Panel ${activePanel.id} error:`, error);
            }}
            onDispose={(pluginId) => {
              console.log(`Panel ${activePanel.id} disposed: ${pluginId}`);
            }}
          />
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Hook for managing panels
// ============================================================================

/**
 * Hook for managing plugin panels
 * 
 * @returns Panel management functions
 */
export function usePluginPanels() {
  const [panels, setPanels] = useState<Map<string, PluginPanel>>(new Map());
  
  const addPanel = useCallback((panel: PluginPanel) => {
    setPanels(prev => {
      const newPanels = new Map(prev);
      newPanels.set(panel.id, panel);
      return newPanels;
    });
  }, []);
  
  const removePanel = useCallback((panelId: string) => {
    setPanels(prev => {
      const newPanels = new Map(prev);
      newPanels.delete(panelId);
      return newPanels;
    });
  }, []);
  
  const updatePanel = useCallback((panelId: string, updates: Partial<PluginPanel>) => {
    setPanels(prev => {
      const panel = prev.get(panelId);
      if (!panel) return prev;
      
      const newPanels = new Map(prev);
      newPanels.set(panelId, { ...panel, ...updates });
      return newPanels;
    });
  }, []);
  
  const getPanel = useCallback((panelId: string): PluginPanel | undefined => {
    return panels.get(panelId);
  }, [panels]);
  
  const getAllPanels = useCallback((): PluginPanel[] => {
    return Array.from(panels.values());
  }, [panels]);
  
  return {
    panels: getAllPanels(),
    addPanel,
    removePanel,
    updatePanel,
    getPanel
  };
}

export default PluginPanelContainer;
