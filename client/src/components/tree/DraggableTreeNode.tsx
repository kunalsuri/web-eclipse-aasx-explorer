/**
 * Draggable Tree Node
 * 
 * Tree node component with drag-and-drop support.
 * Handles drag preview, drop zones, and position indicators.
 */

import { useState, useRef, type ReactNode } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface DragData {
  nodeId: string;
  nodeType: string;
  node: any;
}

export interface DropPosition {
  targetId: string;
  position: 'before' | 'after' | 'inside';
}

interface DraggableTreeNodeProps {
  id: string;
  node: any;
  children: ReactNode;
  onDragStart?: (data: DragData) => void;
  onDragEnd?: () => void;
  onDrop?: (dragData: DragData, dropPosition: DropPosition) => void;
  canDrop?: (dragData: DragData, targetNode: any, position: string) => boolean;
  disabled?: boolean;
}

// ============================================================================
// Draggable Tree Node Component
// ============================================================================

export function DraggableTreeNode({
  id,
  node,
  children,
  onDragStart,
  onDragEnd,
  onDrop,
  canDrop,
  disabled = false,
}: DraggableTreeNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState<'before' | 'after' | 'inside' | null>(null);
  const [isValidDrop, setIsValidDrop] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent) => {
    if (disabled) return;

    const dragData: DragData = {
      nodeId: id,
      nodeType: node.modelType,
      node,
    };

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));

    setIsDragging(true);
    onDragStart?.(dragData);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd?.();
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || isDragging) return;

    // Get drag data
    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr) return;

    const dragData: DragData = JSON.parse(dataStr);

    // Don't allow dropping on self
    if (dragData.nodeId === id) {
      setDragOver(null);
      setIsValidDrop(false);
      return;
    }

    // Calculate drop position based on mouse position
    const rect = nodeRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseY = e.clientY - rect.top;
    const height = rect.height;
    const threshold = height / 3;

    let position: 'before' | 'after' | 'inside';
    if (mouseY < threshold) {
      position = 'before';
    } else if (mouseY > height - threshold) {
      position = 'after';
    } else {
      position = 'inside';
    }

    // Check if drop is valid
    const valid = canDrop ? canDrop(dragData, node, position) : true;

    setDragOver(position);
    setIsValidDrop(valid);

    e.dataTransfer.dropEffect = valid ? 'move' : 'none';
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only clear if leaving the node entirely
    const rect = nodeRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX;
    const y = e.clientY;

    if (
      x < rect.left ||
      x > rect.right ||
      y < rect.top ||
      y > rect.bottom
    ) {
      setDragOver(null);
      setIsValidDrop(false);
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || !isValidDrop || !dragOver) return;

    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr) return;

    const dragData: DragData = JSON.parse(dataStr);

    const dropPosition: DropPosition = {
      targetId: id,
      position: dragOver,
    };

    onDrop?.(dragData, dropPosition);

    setDragOver(null);
    setIsValidDrop(false);
  };

  return (
    <div
      ref={nodeRef}
      draggable={!disabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative',
        isDragging && 'opacity-50',
        dragOver && isValidDrop && 'bg-accent/50',
        dragOver && !isValidDrop && 'bg-destructive/10'
      )}
    >
      {/* Drag Handle */}
      {!disabled && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Drop Indicator - Before */}
      {dragOver === 'before' && (
        <div
          className={cn(
            'absolute top-0 left-0 right-0 h-0.5',
            isValidDrop ? 'bg-primary' : 'bg-destructive'
          )}
        />
      )}

      {/* Drop Indicator - After */}
      {dragOver === 'after' && (
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 h-0.5',
            isValidDrop ? 'bg-primary' : 'bg-destructive'
          )}
        />
      )}

      {/* Drop Indicator - Inside */}
      {dragOver === 'inside' && (
        <div
          className={cn(
            'absolute inset-0 border-2 rounded pointer-events-none',
            isValidDrop ? 'border-primary' : 'border-destructive'
          )}
        />
      )}

      {/* Content */}
      {children}
    </div>
  );
}
