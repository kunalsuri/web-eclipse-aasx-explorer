/**
 * Selection Toolbar Component
 * Displays when multiple elements are selected
 * Provides bulk operations
 */

import { X, Copy, Trash2, Move, Edit, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SelectionToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkCopy?: () => void;
  onBulkDelete?: () => void;
  onBulkMove?: () => void;
  onBulkEdit?: () => void;
  onBulkExport?: () => void;
  className?: string;
}

export function SelectionToolbar({
  selectedCount,
  onClearSelection,
  onBulkCopy,
  onBulkDelete,
  onBulkMove,
  onBulkEdit,
  onBulkExport,
  className,
}: SelectionToolbarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 bg-primary/10 border-b border-border',
        className
      )}
      role="toolbar"
      aria-label="Selection toolbar"
    >
      {/* Selection count */}
      <Badge variant="secondary" className="font-semibold">
        {selectedCount} selected
      </Badge>

      <Separator orientation="vertical" className="h-6" />

      {/* Bulk operations */}
      <div className="flex items-center gap-1">
        {onBulkCopy && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBulkCopy}
            title="Copy selected elements"
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
        )}

        {onBulkEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBulkEdit}
            title="Edit selected elements"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}

        {onBulkMove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBulkMove}
            title="Move selected elements"
          >
            <Move className="h-4 w-4 mr-1" />
            Move
          </Button>
        )}

        {onBulkExport && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBulkExport}
            title="Export selected elements"
          >
            <FileDown className="h-4 w-4 mr-1" />
            Export
          </Button>
        )}

        {onBulkDelete && (
          <>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onBulkDelete}
              title="Delete selected elements"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Clear selection */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        title="Clear selection"
      >
        <X className="h-4 w-4 mr-1" />
        Clear
      </Button>
    </div>
  );
}
