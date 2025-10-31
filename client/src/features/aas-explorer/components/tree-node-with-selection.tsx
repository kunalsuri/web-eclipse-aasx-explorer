/**
 * Tree Node with Selection Component
 * Enhanced tree node with visual selection indicators
 */

import { useState } from 'react';
import { ChevronRight, ChevronDown, CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ElementContextMenu } from './element-context-menu';

interface TreeNodeWithSelectionProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  isSelected?: boolean;
  isMultiSelected?: boolean;
  isExpanded?: boolean;
  level?: number;
  hasChildren?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  onToggle?: () => void;
  onSelect?: (event: React.MouseEvent) => void;
  onContextMenu?: () => void;
  // Context menu props
  elementType?: string;
  canAddChildren?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canCopy?: boolean;
  canPaste?: boolean;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export function TreeNodeWithSelection({
  id,
  label,
  icon,
  children,
  isSelected = false,
  isMultiSelected = false,
  isExpanded = false,
  level = 0,
  hasChildren = false,
  onClick,
  onToggle,
  onSelect,
  onContextMenu,
  elementType = 'element',
  canAddChildren = false,
  canEdit = true,
  canDelete = true,
  canCopy = true,
  canPaste = false,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onDuplicate,
}: TreeNodeWithSelectionProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (event: React.MouseEvent) => {
    // Handle Ctrl+Click for multi-select
    if (event.ctrlKey || event.metaKey) {
      event.stopPropagation();
      if (onSelect) {
        onSelect(event);
      }
      return;
    }

    // Handle Shift+Click for range select
    if (event.shiftKey) {
      event.stopPropagation();
      if (onSelect) {
        onSelect(event);
      }
      return;
    }

    // Normal click
    if (onClick) {
      onClick(event);
    }
  };

  const handleToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onToggle) {
      onToggle();
    }
  };

  const handleCheckboxClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onSelect) {
      onSelect(event);
    }
  };

  return (
    <ElementContextMenu
      elementType={elementType}
      elementId={id}
      isSelected={isMultiSelected}
      canAddChildren={canAddChildren}
      canEdit={canEdit}
      canDelete={canDelete}
      canCopy={canCopy}
      canPaste={canPaste}
      onCopy={onCopy}
      onCut={onCut}
      onPaste={onPaste}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
    >
      <div
        className={cn(
          'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
          'hover:bg-accent/50',
          isSelected && 'bg-primary/10 border-l-2 border-primary',
          isMultiSelected && 'bg-blue-500/20 border-l-2 border-blue-500',
          isHovered && 'bg-accent/70'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="treeitem"
        aria-selected={isSelected || isMultiSelected}
        aria-expanded={hasChildren ? isExpanded : undefined}
        tabIndex={0}
      >
        {/* Expand/Collapse Icon */}
        {hasChildren && (
          <button
            onClick={handleToggle}
            className="flex-shrink-0 p-0.5 hover:bg-accent rounded"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Spacer for nodes without children */}
        {!hasChildren && <div className="w-5" />}

        {/* Selection Checkbox */}
        <button
          onClick={handleCheckboxClick}
          className={cn(
            'flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
            isMultiSelected && 'opacity-100'
          )}
          aria-label={isMultiSelected ? 'Deselect' : 'Select'}
        >
          {isMultiSelected ? (
            <CheckSquare className="h-4 w-4 text-blue-500" />
          ) : (
            <Square className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Icon */}
        {icon && <div className="flex-shrink-0">{icon}</div>}

        {/* Label */}
        <span
          className={cn(
            'flex-1 truncate text-sm',
            isSelected && 'font-medium',
            isMultiSelected && 'font-medium text-blue-700 dark:text-blue-300'
          )}
          title={label}
        >
          {label}
        </span>

        {/* Selection Badge */}
        {isMultiSelected && (
          <div className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500" />
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && children && (
        <div role="group">{children}</div>
      )}
    </ElementContextMenu>
  );
}
