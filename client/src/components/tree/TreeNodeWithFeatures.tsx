/**
 * Tree Node with All Advanced Features
 * 
 * Example integration of all Phase 3 features:
 * - Context menu
 * - Drag & drop
 * - Multi-select
 * - Keyboard shortcuts
 */

import { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { ContextMenu } from '../context-menu/ContextMenu';
import { DraggableTreeNode } from './DraggableTreeNode';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useIsSelected } from '../../stores/selectionStore';
import { useClipboard } from '../../stores/clipboardStore';
import '../context-menu/context-menu.css';

interface TreeNodeProps {
  node: {
    id: string;
    idShort?: string;
    modelType: string;
    children?: any[];
    parent?: any;
    index?: number;
  };
  level?: number;
  onEdit?: (node: any) => void;
  onToggle?: (node: any) => void;
  expanded?: boolean;
}

export function TreeNodeWithFeatures({
  node,
  level = 0,
  onEdit,
  onToggle,
  expanded = false,
}: TreeNodeProps) {
  const isSelected = useIsSelected(node.id);
  const { isCut } = useClipboard();
  const contextMenuItems = useContextMenu(node, () => onEdit?.(node));

  const hasChildren = node.children && node.children.length > 0;
  const isCutItem = isCut(node.id);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Multi-select logic would go here
      // Check for Ctrl/Shift modifiers
      console.log('Node clicked:', node.id);
    },
    [node.id]
  );

  return (
    <ContextMenu trigger={
      <DraggableTreeNode id={node.id}>
        <div
          className={`tree-node ${isSelected ? 'selected' : ''} ${isCutItem ? 'cut' : ''}`}
          style={{ paddingLeft: `${level * 20}px` }}
          onClick={handleClick}
        >
          <div className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-100">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle?.(node);
                }}
                className="expand-button"
                aria-label={expanded ? 'Collapse' : 'Expand'}
              >
                {expanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-4" />}

            <span className="flex-1 text-sm">
              {node.idShort || node.id}
            </span>

            <span className="text-xs text-gray-500">
              {node.modelType}
            </span>
          </div>
        </div>
      </DraggableTreeNode>
    } items={contextMenuItems} />
  );
}

/**
 * Styles for tree node features
 */
export const treeNodeStyles = `
.tree-node {
  position: relative;
  user-select: none;
}

.tree-node.selected {
  background-color: #dbeafe;
}

.tree-node.cut {
  opacity: 0.5;
}

.tree-node:hover {
  background-color: #f3f4f6;
}

.tree-node.selected:hover {
  background-color: #bfdbfe;
}

.expand-button {
  padding: 2px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
}

.expand-button:hover {
  background-color: #e5e7eb;
}

.drag-handle {
  padding: 2px;
  border: none;
  background: none;
  cursor: grab;
  display: flex;
  align-items: center;
  opacity: 0;
  transition: opacity 0.15s;
}

.tree-node:hover .drag-handle {
  opacity: 1;
}

.drag-handle:active {
  cursor: grabbing;
}

.draggable-tree-node.dragging {
  z-index: 10;
}

.draggable-tree-node.drop-target {
  border-top: 2px solid #3b82f6;
}

.drag-overlay {
  background: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 8px;
  cursor: grabbing;
}
`;
