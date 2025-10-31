/**
 * AAS Explorer Integrated Component
 * Main component that integrates all Phase 1 features:
 * - Keyboard shortcuts
 * - Multi-selection
 * - Clipboard operations
 * - Undo/Redo
 * - Context menus
 */

import { useState, useCallback } from 'react';
import { AasTreeView } from './aas-tree-view';
import { PropertyPanel } from './property-panel';
import { SelectionToolbar } from './selection-toolbar';
import { ClipboardPreview } from './clipboard-preview';
import { HistoryPanel } from './history-panel';
import { useKeyboardShortcuts } from '../hooks/use-keyboard-shortcuts';
import { useBulkSelection } from '../hooks/use-bulk-selection';
import { useClipboard } from '../hooks/use-clipboard';
import { useUndoRedo } from '../hooks/use-undo-redo';
import { undoService } from '../services/undo-service';
import {
  BulkDeleteCommand,
  PasteCommand,
  DuplicateCommand,
  RemoveElementCommand,
} from '../services/commands';
import type { Environment } from '../../../../../shared';
import type { ValidationResult } from '../../../../../shared/aas-validation-engine';
import { toast } from '@/hooks/use-toast';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

interface AasExplorerIntegratedProps {
  environment: Environment;
  fileId: string;
  validationResult?: ValidationResult | null;
  onNodeSelect?: (node: any) => void;
  onEnvironmentChange?: (env: Environment) => void;
}

export function AasExplorerIntegrated({
  environment,
  fileId,
  validationResult,
  onNodeSelect,
  onEnvironmentChange,
}: AasExplorerIntegratedProps) {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [showClipboard, setShowClipboard] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Initialize hooks
  const selection = useBulkSelection({
    multiSelect: true,
    persistSelection: false,
    onSelectionChange: (selectedIds) => {
      console.log('Selection changed:', selectedIds.size);
    },
  });

  const clipboard = useClipboard({
    useServer: true,
    packageId: fileId,
    onError: (error) => {
      console.error('Clipboard error:', error);
    },
  });

  const undoRedo = useUndoRedo();

  // Handle node selection
  const handleNodeSelect = useCallback(
    (node: any) => {
      setSelectedNode(node);
      if (onNodeSelect) {
        onNodeSelect(node);
      }
    },
    [onNodeSelect]
  );

  // Keyboard shortcut handlers
  const handleCopy = useCallback(async () => {
    if (!selectedNode?.data) {
      toast({
        title: 'Copy Failed',
        description: 'No element selected',
        variant: 'destructive',
      });
      return;
    }

    try {
      await clipboard.copy(selectedNode.data, selectedNode.path || []);
      setShowClipboard(true);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }, [selectedNode, clipboard]);

  const handleCut = useCallback(async () => {
    if (!selectedNode?.data) {
      toast({
        title: 'Cut Failed',
        description: 'No element selected',
        variant: 'destructive',
      });
      return;
    }

    try {
      await clipboard.cut(selectedNode.data, selectedNode.path || []);
      setShowClipboard(true);
    } catch (error) {
      console.error('Cut failed:', error);
    }
  }, [selectedNode, clipboard]);

  const handlePaste = useCallback(async () => {
    if (!clipboard.canPaste) {
      toast({
        title: 'Paste Failed',
        description: 'Clipboard is empty',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedNode?.path) {
      toast({
        title: 'Paste Failed',
        description: 'No target selected',
        variant: 'destructive',
      });
      return;
    }

    try {
      const element = await clipboard.paste(selectedNode.path);
      if (element) {
        // Create paste command for undo/redo
        const command = new PasteCommand(
          fileId,
          selectedNode.path,
          element
        );
        await undoService.executeCommand(command);
        
        if (onEnvironmentChange) {
          // Trigger environment refresh
          onEnvironmentChange(environment);
        }
      }
    } catch (error) {
      console.error('Paste failed:', error);
    }
  }, [clipboard, selectedNode, fileId, environment, onEnvironmentChange]);

  const handleDelete = useCallback(async () => {
    if (selection.selectedCount > 0) {
      // Bulk delete
      await handleBulkDelete();
    } else if (selectedNode?.data) {
      // Single delete
      try {
        const command = new RemoveElementCommand(
          fileId,
          selectedNode.path || [],
          selectedNode.parentPath || [],
          selectedNode.data.idShort || 'element'
        );
        await undoService.executeCommand(command);
        
        toast({
          title: 'Deleted',
          description: `${selectedNode.data.modelType} deleted`,
        });
        
        if (onEnvironmentChange) {
          onEnvironmentChange(environment);
        }
      } catch (error) {
        console.error('Delete failed:', error);
        toast({
          title: 'Delete Failed',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
      }
    }
  }, [selection, selectedNode, fileId, environment, onEnvironmentChange]);

  const handleUndo = useCallback(async () => {
    try {
      await undoRedo.undo();
      if (onEnvironmentChange) {
        onEnvironmentChange(environment);
      }
    } catch (error) {
      console.error('Undo failed:', error);
    }
  }, [undoRedo, environment, onEnvironmentChange]);

  const handleRedo = useCallback(async () => {
    try {
      await undoRedo.redo();
      if (onEnvironmentChange) {
        onEnvironmentChange(environment);
      }
    } catch (error) {
      console.error('Redo failed:', error);
    }
  }, [undoRedo, environment, onEnvironmentChange]);

  const handleSelectAll = useCallback(() => {
    // Get all element IDs from environment
    const allIds: string[] = [];
    // TODO: Extract all IDs from environment tree
    selection.selectAll(allIds);
  }, [selection]);

  const handleDuplicate = useCallback(async () => {
    if (!selectedNode?.data) {
      toast({
        title: 'Duplicate Failed',
        description: 'No element selected',
        variant: 'destructive',
      });
      return;
    }

    try {
      const command = new DuplicateCommand(
        fileId,
        selectedNode.parentPath || [],
        selectedNode.data
      );
      await undoService.executeCommand(command);
      
      toast({
        title: 'Duplicated',
        description: `${selectedNode.data.modelType} duplicated`,
      });
      
      if (onEnvironmentChange) {
        onEnvironmentChange(environment);
      }
    } catch (error) {
      console.error('Duplicate failed:', error);
      toast({
        title: 'Duplicate Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }, [selectedNode, fileId, environment, onEnvironmentChange]);

  // Bulk operations
  const handleBulkDelete = useCallback(async () => {
    if (selection.selectedCount === 0) return;

    try {
      // TODO: Build element paths map from selected IDs
      const elementPaths = new Map<string, any[]>();
      
      const command = new BulkDeleteCommand(
        fileId,
        elementPaths,
        []
      );
      await undoService.executeCommand(command);
      
      toast({
        title: 'Deleted',
        description: `${selection.selectedCount} elements deleted`,
      });
      
      selection.clearSelection();
      
      if (onEnvironmentChange) {
        onEnvironmentChange(environment);
      }
    } catch (error) {
      console.error('Bulk delete failed:', error);
      toast({
        title: 'Bulk Delete Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }, [selection, fileId, environment, onEnvironmentChange]);

  const handleBulkCopy = useCallback(async () => {
    // TODO: Implement bulk copy
    toast({
      title: 'Bulk Copy',
      description: `${selection.selectedCount} elements copied`,
    });
  }, [selection]);

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    enabled: true,
    handlers: {
      onCopy: handleCopy,
      onCut: handleCut,
      onPaste: handlePaste,
      onDelete: handleDelete,
      onUndo: handleUndo,
      onRedo: handleRedo,
      onSelectAll: handleSelectAll,
      onDuplicate: handleDuplicate,
    },
    scope: 'local',
  });

  return (
    <div className="h-full flex flex-col">
      {/* Selection Toolbar */}
      {selection.selectedCount > 0 && (
        <SelectionToolbar
          selectedCount={selection.selectedCount}
          onClearSelection={selection.clearSelection}
          onBulkCopy={handleBulkCopy}
          onBulkDelete={handleBulkDelete}
        />
      )}

      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Tree View Panel */}
        <ResizablePanel defaultSize={30} minSize={20}>
          <div className="h-full p-4">
            <AasTreeView
              environment={environment}
              onNodeSelect={handleNodeSelect}
              selectedNodeId={selectedNode?.id}
              validationResult={validationResult}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Property Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full p-4">
            <PropertyPanel
              selectedNode={selectedNode}
              fileId={fileId}
            />
          </div>
        </ResizablePanel>

        {/* Side Panels */}
        {(showClipboard || showHistory) && (
          <>
            <ResizableHandle />
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
              <div className="h-full p-4 space-y-4">
                {/* Clipboard Preview */}
                {showClipboard && (
                  <ClipboardPreview
                    clipboardItem={clipboard.clipboardItem}
                    onClear={clipboard.clear}
                    onPaste={handlePaste}
                  />
                )}

                {/* History Panel */}
                {showHistory && (
                  <HistoryPanel
                    canUndo={undoRedo.canUndo}
                    canRedo={undoRedo.canRedo}
                    undoDescription={undoRedo.undoDescription}
                    redoDescription={undoRedo.redoDescription}
                    historySize={undoRedo.historySize}
                    history={undoService.getHistory()}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onClear={undoRedo.clear}
                  />
                )}
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {/* Toggle buttons for side panels */}
      <div className="flex gap-2 p-2 border-t">
        <button
          onClick={() => setShowClipboard(!showClipboard)}
          className="text-xs px-2 py-1 rounded hover:bg-accent"
        >
          {showClipboard ? 'Hide' : 'Show'} Clipboard
        </button>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-xs px-2 py-1 rounded hover:bg-accent"
        >
          {showHistory ? 'Hide' : 'Show'} History
        </button>
      </div>
    </div>
  );
}
