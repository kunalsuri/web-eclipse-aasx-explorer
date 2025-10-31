/**
 * Virtual Tree View Component
 * 
 * High-performance tree view using @tanstack/react-virtual for large datasets.
 * Renders only visible nodes for optimal performance with 10,000+ items.
 */

import React, { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  isExpanded?: boolean;
  level?: number;
  modelType?: string;
}

interface VirtualTreeViewProps {
  items: TreeNode[];
  onSelect?: (node: TreeNode) => void;
  onToggle?: (node: TreeNode) => void;
  selectedId?: string;
  className?: string;
}

/**
 * Flatten tree structure for virtual rendering
 */
function flattenTree(nodes: TreeNode[], level = 0): TreeNode[] {
  const result: TreeNode[] = [];
  
  for (const node of nodes) {
    result.push({ ...node, level });
    
    if (node.isExpanded && node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, level + 1));
    }
  }
  
  return result;
}

/**
 * Virtual Tree View Component
 */
export function VirtualTreeView({
  items,
  onSelect,
  onToggle,
  selectedId,
  className,
}: VirtualTreeViewProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Flatten tree for virtual rendering
  const flatItems = useMemo(() => flattenTree(items), [items]);
  
  // Setup virtualizer
  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32, // Row height in pixels
    overscan: 10, // Render extra items for smooth scrolling
  });
  
  return (
    <div
      ref={parentRef}
      className={cn('h-full overflow-auto', className)}
      role="tree"
      aria-label="AAS Tree Structure"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const node = flatItems[virtualRow.index];
          const hasChildren = node.children && node.children.length > 0;
          const isSelected = node.id === selectedId;
          
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div
                role="treeitem"
                aria-expanded={hasChildren ? node.isExpanded : undefined}
                aria-selected={isSelected}
                aria-level={node.level ? node.level + 1 : 1}
                tabIndex={isSelected ? 0 : -1}
                className={cn(
                  'flex items-center h-8 px-2 cursor-pointer transition-colors',
                  'hover:bg-muted',
                  isSelected && 'bg-secondary',
                  'focus:outline-none focus:ring-2 focus:ring-ring'
                )}
                style={{
                  paddingLeft: `${(node.level || 0) * 20 + 8}px`,
                }}
                onClick={() => onSelect?.(node)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (hasChildren) {
                      onToggle?.(node);
                    } else {
                      onSelect?.(node);
                    }
                  } else if (e.key === 'ArrowRight' && hasChildren && !node.isExpanded) {
                    e.preventDefault();
                    onToggle?.(node);
                  } else if (e.key === 'ArrowLeft' && hasChildren && node.isExpanded) {
                    e.preventDefault();
                    onToggle?.(node);
                  }
                }}
              >
                {hasChildren && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle?.(node);
                    }}
                    className="mr-1 p-0.5 hover:bg-muted-foreground/10 rounded"
                    aria-label={node.isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {node.isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                )}
                
                {!hasChildren && <span className="w-5" />}
                
                <span className="truncate flex-1 text-sm">
                  {node.label}
                </span>
                
                {node.modelType && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {node.modelType}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
