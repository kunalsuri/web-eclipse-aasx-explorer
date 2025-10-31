/**
 * Element Context Menu Component
 * Right-click context menu for AAS elements
 */

import {
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  Plus,
  Edit,
  Eye,
  FileDown,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  FolderTree,
  Info,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface ElementContextMenuProps {
  children: React.ReactNode;
  elementType: string;
  elementId?: string;
  isSelected?: boolean;
  canAddChildren?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canCopy?: boolean;
  canPaste?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  canExpand?: boolean;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onView?: () => void;
  onAddChild?: (type: string) => void;
  onExport?: () => void;
  onDuplicate?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  onSelectAll?: () => void;
  onShowProperties?: () => void;
}

const ELEMENT_TYPES_FOR_CREATION = [
  { value: 'Property', label: 'Property' },
  { value: 'MultiLanguageProperty', label: 'Multi-Language Property' },
  { value: 'Range', label: 'Range' },
  { value: 'ReferenceElement', label: 'Reference' },
  { value: 'File', label: 'File' },
  { value: 'Blob', label: 'Blob' },
  { value: 'SubmodelElementCollection', label: 'Collection' },
  { value: 'SubmodelElementList', label: 'List' },
];

export function ElementContextMenu({
  children,
  elementType,
  elementId,
  isSelected = false,
  canAddChildren = false,
  canEdit = true,
  canDelete = true,
  canCopy = true,
  canPaste = false,
  canMoveUp = false,
  canMoveDown = false,
  canExpand = false,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onEdit,
  onView,
  onAddChild,
  onExport,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onExpandAll,
  onCollapseAll,
  onSelectAll,
  onShowProperties,
}: ElementContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {/* View */}
        {onView && (
          <>
            <ContextMenuItem onClick={onView}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {/* Edit */}
        {canEdit && onEdit && (
          <ContextMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
            <ContextMenuShortcut>⌘E</ContextMenuShortcut>
          </ContextMenuItem>
        )}

        {/* Add Child */}
        {canAddChildren && onAddChild && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Plus className="mr-2 h-4 w-4" />
              Add Child Element
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              {ELEMENT_TYPES_FOR_CREATION.map((type) => (
                <ContextMenuItem key={type.value} onClick={() => onAddChild(type.value)}>
                  {type.label}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}

        <ContextMenuSeparator />

        {/* Copy */}
        {canCopy && onCopy && (
          <ContextMenuItem onClick={onCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>
        )}

        {/* Cut */}
        {canCopy && onCut && (
          <ContextMenuItem onClick={onCut}>
            <Scissors className="mr-2 h-4 w-4" />
            Cut
            <ContextMenuShortcut>⌘X</ContextMenuShortcut>
          </ContextMenuItem>
        )}

        {/* Paste */}
        {canPaste && onPaste && (
          <ContextMenuItem onClick={onPaste}>
            <Clipboard className="mr-2 h-4 w-4" />
            Paste
            <ContextMenuShortcut>⌘V</ContextMenuShortcut>
          </ContextMenuItem>
        )}

        {/* Duplicate */}
        {onDuplicate && (
          <ContextMenuItem onClick={onDuplicate}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Duplicate
            <ContextMenuShortcut>⌘D</ContextMenuShortcut>
          </ContextMenuItem>
        )}

        {/* Move Up/Down */}
        {(canMoveUp || canMoveDown) && (
          <>
            <ContextMenuSeparator />
            {canMoveUp && onMoveUp && (
              <ContextMenuItem onClick={onMoveUp}>
                <ArrowUp className="mr-2 h-4 w-4" />
                Move Up
              </ContextMenuItem>
            )}
            {canMoveDown && onMoveDown && (
              <ContextMenuItem onClick={onMoveDown}>
                <ArrowDown className="mr-2 h-4 w-4" />
                Move Down
              </ContextMenuItem>
            )}
          </>
        )}

        {/* Expand/Collapse */}
        {canExpand && (onExpandAll || onCollapseAll) && (
          <>
            <ContextMenuSeparator />
            {onExpandAll && (
              <ContextMenuItem onClick={onExpandAll}>
                <FolderTree className="mr-2 h-4 w-4" />
                Expand All
              </ContextMenuItem>
            )}
            {onCollapseAll && (
              <ContextMenuItem onClick={onCollapseAll}>
                <FolderTree className="mr-2 h-4 w-4" />
                Collapse All
              </ContextMenuItem>
            )}
          </>
        )}

        {/* Selection */}
        {onSelectAll && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onSelectAll}>
              {isSelected ? (
                <Square className="mr-2 h-4 w-4" />
              ) : (
                <CheckSquare className="mr-2 h-4 w-4" />
              )}
              Select All
              <ContextMenuShortcut>⌘A</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}

        <ContextMenuSeparator />

        {/* Export */}
        {onExport && (
          <ContextMenuItem onClick={onExport}>
            <FileDown className="mr-2 h-4 w-4" />
            Export Element
          </ContextMenuItem>
        )}

        {/* Properties */}
        {onShowProperties && (
          <ContextMenuItem onClick={onShowProperties}>
            <Info className="mr-2 h-4 w-4" />
            Properties
          </ContextMenuItem>
        )}

        {/* Delete */}
        {canDelete && onDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
              <ContextMenuShortcut>⌫</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
