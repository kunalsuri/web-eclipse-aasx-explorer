/**
 * Editable Tree Node
 * 
 * Tree node component with inline editing capability.
 * Supports click-to-edit, keyboard shortcuts, and validation feedback.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { ContextMenu } from '../context-menu/ContextMenu';
import { DraggableTreeNode } from './DraggableTreeNode';
import { PropertyEditorFactory } from '../property-editors/PropertyEditorFactory';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useIsSelected } from '../../stores/selectionStore';
import { useClipboard } from '../../stores/clipboardStore';
import { useActiveEditor, useValidation } from '../../stores/editorStore';
import { cn } from '@/lib/utils';
import '../context-menu/context-menu.css';

interface TreeNodeProps {
  node: {
    id: string;
    idShort?: string;
    modelType: string;
    value?: any;
    valueType?: string;
    children?: any[];
    parent?: any;
    index?: number;
  };
  level?: number;
  onEdit?: (node: any) => void;
  onToggle?: (node: any) => void;
  onValueChange?: (nodeId: string, value: any) => void;
  expanded?: boolean;
  allowInlineEdit?: boolean;
}

export function EditableTreeNode({
  node,
  level = 0,
  onEdit,
  onToggle,
  onValueChange,
  expanded = false,
  allowInlineEdit = true,
}: TreeNodeProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editValue, setEditValue] = useState(node.value);
  const nodeRef = useRef<HTMLDivElement>(null);
  
  const isSelected = useIsSelected(node.id);
  const { isCut } = useClipboard();
  const { openEditor, closeEditor, updateValue, saveEditor } = useActiveEditor();
  const { validation } = useValidation(node.id);
  const contextMenuItems = useContextMenu(node, () => onEdit?.(node));

  const hasChildren = node.children && node.children.length > 0;
  const isCutItem = isCut(node.id);
  const canEdit = allowInlineEdit && node.modelType === 'Property' && node.value !== undefined;

  // Validation icon
  const getValidationIcon = () => {
    if (!validation) return null;
    
    if (validation.severity === 'error') {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    } else if (validation.severity === 'warning') {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    } else if (validation.severity === 'info') {
      return <Info className="h-4 w-4 text-blue-600" />;
    }
    return null;
  };

  // Enter edit mode
  const enterEditMode = useCallback(() => {
    if (!canEdit) return;
    
    setIsEditMode(true);
    setEditValue(node.value);
    openEditor(node);
  }, [canEdit, node, openEditor]);

  // Exit edit mode
  const exitEditMode = useCallback(async (save: boolean) => {
    if (!isEditMode) return;
    
    if (save && editValue !== node.value) {
      await saveEditor();
      onValueChange?.(node.id, editValue);
    }
    
    setIsEditMode(false);
    closeEditor();
  }, [isEditMode, editValue, node.value, node.id, saveEditor, closeEditor, onValueChange]);

  // Handle value change
  const handleValueChange = useCallback((newValue: any) => {
    setEditValue(newValue);
    updateValue('value', newValue);
  }, [updateValue]);

  // Handle click
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      
      // Double-click to edit
      if (e.detail === 2 && canEdit) {
        enterEditMode();
      }
    },
    [canEdit, enterEditMode]
  );

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'F2' && canEdit && !isEditMode) {
        e.preventDefault();
        enterEditMode();
      } else if (e.key === 'Enter' && isEditMode) {
        e.preventDefault();
        exitEditMode(true);
      } else if (e.key === 'Escape' && isEditMode) {
        e.preventDefault();
        exitEditMode(false);
      }
    },
    [canEdit, isEditMode, enterEditMode, exitEditMode]
  );

  // Click outside to save
  useEffect(() => {
    if (!isEditMode) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (nodeRef.current && !nodeRef.current.contains(e.target as Node)) {
        exitEditMode(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditMode, exitEditMode]);

  return (
    <ContextMenu
      trigger={
        <DraggableTreeNode id={node.id}>
          <div
            ref={nodeRef}
            className={cn(
              'tree-node',
              isSelected && 'selected',
              isCutItem && 'cut',
              isEditMode && 'editing'
            )}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <div 
              className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              style={{ paddingLeft: `${level * 20}px` }}
            >
              {/* Expand/Collapse Button */}
              {hasChildren && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle?.(node);
                  }}
                  className="expand-button"
                  aria-label={expanded ? 'Collapse' : 'Expand'}
                >
                  {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              )}
              {!hasChildren && <div className="w-4" />}

              {/* Validation Icon */}
              {validation && (
                <div
                  className="validation-icon"
                  title={validation.messages.map((m) => m.message).join('\n')}
                >
                  {getValidationIcon()}
                </div>
              )}

              {/* Node Label */}
              <span className="flex-1 text-sm font-medium">
                {node.idShort || node.id}
              </span>

              {/* Inline Editor or Value Display */}
              {isEditMode ? (
                <div 
                  className="inline-editor" 
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <PropertyEditorFactory
                    value={editValue}
                    onChange={handleValueChange}
                    onBlur={() => exitEditMode(true)}
                    valueType={node.valueType || 'xs:string'}
                    autoFocus
                    className="w-48"
                  />
                </div>
              ) : (
                <>
                  {/* Value Display */}
                  {canEdit && node.value !== undefined && (
                    <span className="text-sm text-muted-foreground truncate max-w-xs">
                      {String(node.value)}
                    </span>
                  )}

                  {/* Model Type */}
                  <span className="text-xs text-gray-500">{node.modelType}</span>
                </>
              )}
            </div>
          </div>
        </DraggableTreeNode>
      }
      items={contextMenuItems}
    />
  );
}

/**
 * Additional styles for editable tree nodes
 */
export const editableTreeNodeStyles = `
.tree-node.editing {
  background-color: #f0f9ff;
  border: 1px solid #3b82f6;
  border-radius: 4px;
}

.inline-editor {
  min-width: 200px;
  max-width: 400px;
}

.validation-icon {
  display: flex;
  align-items: center;
  cursor: help;
}

.tree-node:focus {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
}

.tree-node:focus:not(:focus-visible) {
  outline: none;
}
`;
