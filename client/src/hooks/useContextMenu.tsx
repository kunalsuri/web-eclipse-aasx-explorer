/**
 * Context Menu Hook
 * 
 * Generates context menu items based on node type and state.
 */

import {
  Edit2,
  Plus,
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  Files,
  ArrowUp,
  ArrowDown,
  FolderPlus,
} from 'lucide-react';
import type { ContextMenuItem } from '../components/context-menu/ContextMenu';
import { useClipboard, useCanPaste } from '../stores/clipboardStore';
import { useCommandStore } from '../stores/commandStore';
import { useSelectionStore } from '../stores/selectionStore';
import {
  DeleteElementCommand,
  DuplicateElementCommand,
  MoveElementCommand,
} from '../commands/ElementCommands';
import { AasSubmodelElements } from '../../../shared/aas-v3-types';
import { formatPlatformShortcut } from './useKeyboardShortcut';

interface TreeNode {
  id: string;
  modelType: string;
  idShort?: string;
  parent?: TreeNode;
  index?: number;
  [key: string]: any;
}

/**
 * Get context menu items for a tree node
 */
export function useContextMenu(node: TreeNode, onEdit?: () => void) {
  const { copy, cut, paste } = useClipboard();
  const canPasteHere = useCanPaste(node);
  const execute = useCommandStore((state) => state.execute);
  const selectedIdsSet = useSelectionStore((state) => state.selectedIds);
  const clearSelection = useSelectionStore((state) => state.deselectAll);

  const selectedIds = Array.from(selectedIdsSet);
  const isMultiSelect = selectedIds.length > 1;

  const items: ContextMenuItem[] = [];

  // Edit action
  if (onEdit) {
    items.push({
      id: 'edit',
      label: 'Edit',
      icon: <Edit2 className="h-4 w-4" />,
      shortcut: 'F2',
      onClick: onEdit,
    });
  }

  // Add Element submenu (for containers)
  if (canHaveChildren(node.modelType)) {
    items.push({
      id: 'add-element',
      label: 'Add Element',
      icon: <Plus className="h-4 w-4" />,
      submenu: getAddElementSubmenu(node),
    });
  }

  items.push({ id: 'sep-add-element', label: '', separator: true });

  // Copy
  items.push({
    id: 'copy',
    label: isMultiSelect ? `Copy ${selectedIds.length} items` : 'Copy',
    icon: <Copy className="h-4 w-4" />,
    shortcut: formatPlatformShortcut('c'),
    onClick: () => {
      if (isMultiSelect) {
        const nodes = getSelectedNodes(selectedIds);
        copy(nodes);
      } else {
        copy([node]);
      }
    },
  });

  // Cut
  items.push({
    id: 'cut',
    label: isMultiSelect ? `Cut ${selectedIds.length} items` : 'Cut',
    icon: <Scissors className="h-4 w-4" />,
    shortcut: formatPlatformShortcut('x'),
    onClick: () => {
      if (isMultiSelect) {
        const nodes = getSelectedNodes(selectedIds);
        cut(nodes);
      } else {
        cut([node]);
      }
    },
  });

  // Paste
  items.push({
    id: 'paste',
    label: 'Paste',
    icon: <Clipboard className="h-4 w-4" />,
    shortcut: formatPlatformShortcut('v'),
    disabled: !canPasteHere,
    onClick: async () => {
      await paste(node);
      clearSelection();
    },
  });

  // Duplicate
  if (!isMultiSelect) {
    items.push({
      id: 'duplicate',
      label: 'Duplicate',
      icon: <Files className="h-4 w-4" />,
      shortcut: formatPlatformShortcut('d'),
      onClick: () => {
        if (node.parent) {
          const command = new DuplicateElementCommand(node.parent, node);
          execute(command);
        }
      },
    });
  }

  items.push({ id: 'sep-duplicate', label: '', separator: true });

  // Move Up/Down (if has siblings)
  if (node.parent && node.index !== undefined) {
    const siblings = getChildArray(node.parent);

    items.push({
      id: 'move-up',
      label: 'Move Up',
      icon: <ArrowUp className="h-4 w-4" />,
      disabled: node.index === 0,
      onClick: () => {
        if (node.parent && node.index !== undefined && node.index > 0) {
          const command = new MoveElementCommand(
            node,
            node.parent,
            node.index,
            node.parent,
            node.index - 1
          );
          execute(command);
        }
      },
    });

    items.push({
      id: 'move-down',
      label: 'Move Down',
      icon: <ArrowDown className="h-4 w-4" />,
      disabled: node.index === siblings.length - 1,
      onClick: () => {
        if (node.parent && node.index !== undefined && node.index < siblings.length - 1) {
          const command = new MoveElementCommand(
            node,
            node.parent,
            node.index,
            node.parent,
            node.index + 1
          );
          execute(command);
        }
      },
    });

    items.push({ id: 'sep-move', label: '', separator: true });
  }

  // Delete
  items.push({
    id: 'delete',
    label: isMultiSelect ? `Delete ${selectedIds.length} items` : 'Delete',
    icon: <Trash2 className="h-4 w-4" />,
    shortcut: 'Del',
    danger: true,
    onClick: () => {
      if (isMultiSelect) {
        // TODO: Implement bulk delete
        console.log('Bulk delete not yet implemented');
      } else if (node.parent) {
        const command = new DeleteElementCommand(node.parent, node);
        execute(command);
      }
    },
  });

  return items;
}

/**
 * Check if a node type can have children
 */
function canHaveChildren(modelType: string): boolean {
  return [
    'SubmodelElementCollection',
    'SubmodelElementList',
    'Submodel',
    'AssetAdministrationShell',
    'Entity',
    'AnnotatedRelationshipElement',
  ].includes(modelType);
}

/**
 * Get submenu for adding elements
 */
function getAddElementSubmenu(node: TreeNode): ContextMenuItem[] {
  const items: ContextMenuItem[] = [];

  // Simple data elements
  items.push({
    id: 'add-property',
    label: 'Property',
    icon: <FolderPlus className="h-4 w-4" />,
    onClick: () => addElement(node, AasSubmodelElements.Property),
  });

  items.push({
    id: 'add-multi-language-property',
    label: 'Multi Language Property',
    icon: <FolderPlus className="h-4 w-4" />,
    onClick: () => addElement(node, AasSubmodelElements.MultiLanguageProperty),
  });

  items.push({
    id: 'add-range',
    label: 'Range',
    icon: <FolderPlus className="h-4 w-4" />,
    onClick: () => addElement(node, AasSubmodelElements.Range),
  });

  items.push({ id: 'sep-1', label: '', separator: true });

  // Container elements
  items.push({
    id: 'add-collection',
    label: 'Collection',
    icon: <FolderPlus className="h-4 w-4" />,
    onClick: () => addElement(node, AasSubmodelElements.SubmodelElementCollection),
  });

  items.push({
    id: 'add-list',
    label: 'List',
    icon: <FolderPlus className="h-4 w-4" />,
    onClick: () => addElement(node, AasSubmodelElements.SubmodelElementList),
  });

  items.push({ id: 'sep-2', label: '', separator: true });

  // Other elements
  items.push({
    id: 'add-reference-element',
    label: 'Reference Element',
    icon: <FolderPlus className="h-4 w-4" />,
    onClick: () => addElement(node, AasSubmodelElements.ReferenceElement),
  });

  items.push({
    id: 'add-file',
    label: 'File',
    icon: <FolderPlus className="h-4 w-4" />,
    onClick: () => addElement(node, AasSubmodelElements.File),
  });

  items.push({
    id: 'add-blob',
    label: 'Blob',
    icon: <FolderPlus className="h-4 w-4" />,
    onClick: () => addElement(node, AasSubmodelElements.Blob),
  });

  return items;
}

/**
 * Add a new element to a node
 */
function addElement(parent: TreeNode, modelType: string): void {
  // TODO: Implement element creation with proper dialog
  console.log(`Add ${modelType} to`, parent);
}

/**
 * Get child array from parent node
 */
function getChildArray(parent: TreeNode): any[] {
  return (
    parent.value ||
    parent.submodelElements ||
    parent.children ||
    parent.statements ||
    []
  );
}

/**
 * Get selected nodes by IDs
 */
function getSelectedNodes(ids: string[]): TreeNode[] {
  // TODO: Implement proper node lookup
  return [];
}
