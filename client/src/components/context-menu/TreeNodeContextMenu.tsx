/**
 * Tree Node Context Menu
 * 
 * Context menu for AASX tree nodes with full CRUD operations
 * Implements P0-3: Context Menu System requirement
 */

import { useMemo } from "react";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";
import {
  Plus,
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  Edit,
  ArrowUp,
  ArrowDown,
  FileText,
  FolderPlus,
} from "lucide-react";
import { useElementActions } from "@/features/aasx-editor/hooks/useElementActions";
import { formatShortcut } from "@/hooks/useKeyboardShortcuts";

export interface TreeNode {
  id: string;
  idShort?: string;
  modelType: string;
  parent?: TreeNode;
  index?: number;
  element: any;
}

interface TreeNodeContextMenuProps {
  node: TreeNode;
  trigger: React.ReactNode;
  onElementUpdate?: (element: any) => void;
  onElementDelete?: (elementPath: string) => void;
  onElementCreate?: (parent: any, element: any) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  readOnly?: boolean;
}

export function TreeNodeContextMenu({
  node,
  trigger,
  onElementUpdate,
  onElementDelete,
  onElementCreate,
  onUndo,
  onRedo,
  canMoveUp = false,
  canMoveDown = false,
  readOnly = false,
}: TreeNodeContextMenuProps) {
  const actions = useElementActions({
    onElementUpdate,
    onElementDelete,
    onElementCreate,
    onUndo,
    onRedo,
  });

  const menuItems = useMemo((): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [];

    // Add Element submenu (for collections)
    if (!readOnly && isCollection(node.modelType)) {
      items.push({
        label: "Add Element",
        icon: Plus,
        submenu: [
          {
            label: "Property",
            onClick: () => actions.addElement(node.element, "Property"),
          },
          {
            label: "Multi-Language Property",
            onClick: () => actions.addElement(node.element, "MultiLanguageProperty"),
          },
          {
            label: "Range",
            onClick: () => actions.addElement(node.element, "Range"),
          },
          {
            label: "Reference Element",
            onClick: () => actions.addElement(node.element, "ReferenceElement"),
          },
          { separator: true },
          {
            label: "Collection",
            onClick: () => actions.addElement(node.element, "SubmodelElementCollection"),
          },
          {
            label: "List",
            onClick: () => actions.addElement(node.element, "SubmodelElementList"),
          },
          { separator: true },
          {
            label: "File",
            onClick: () => actions.addElement(node.element, "File"),
          },
          {
            label: "Blob",
            onClick: () => actions.addElement(node.element, "Blob"),
          },
        ],
      });
      items.push({ separator: true });
    }

    // Edit action
    if (!readOnly) {
      items.push({
        label: "Edit",
        icon: Edit,
        shortcut: "F2",
        onClick: () => actions.editElement(node.element),
      });
    }

    // View action (read-only)
    items.push({
      label: "View Details",
      icon: FileText,
      onClick: () => {
        // Open details panel
        console.log("View details:", node);
      },
    });

    if (!readOnly) {
      items.push({ separator: true });

      // Copy/Cut/Paste
      items.push({
        label: "Copy",
        icon: Copy,
        shortcut: "Ctrl+C",
        onClick: () => actions.copyElement(node.element),
      });

      items.push({
        label: "Cut",
        icon: Scissors,
        shortcut: "Ctrl+X",
        onClick: () => actions.cutElement(node.element, node.id),
      });

      if (actions.hasClipboardContent() && node.parent) {
        items.push({
          label: "Paste",
          icon: Clipboard,
          shortcut: "Ctrl+V",
          onClick: () => actions.pasteElement(node.parent),
        });
      }

      items.push({
        label: "Duplicate",
        icon: FolderPlus,
        shortcut: "Ctrl+D",
        onClick: () => actions.duplicateElement(node.element, node.parent),
        disabled: !node.parent,
      });

      items.push({ separator: true });

      // Move Up/Down (for elements in collections)
      if (node.parent && node.index !== undefined) {
        items.push({
          label: "Move Up",
          icon: ArrowUp,
          onClick: () => actions.moveElementUp(node.parent, node.index!),
          disabled: !canMoveUp,
        });

        items.push({
          label: "Move Down",
          icon: ArrowDown,
          onClick: () => actions.moveElementDown(node.parent, node.index!),
          disabled: !canMoveDown,
        });

        items.push({ separator: true });
      }

      // Delete action
      items.push({
        label: "Delete",
        icon: Trash2,
        shortcut: "Delete",
        danger: true,
        onClick: () => {
          if (confirm(`Delete "${node.idShort || node.modelType}"?`)) {
            actions.deleteElement(node.id);
          }
        },
      });
    }

    return items;
  }, [node, actions, readOnly, canMoveUp, canMoveDown]);

  return <ContextMenu trigger={trigger} items={menuItems} />;
}

/**
 * Check if element type is a collection that can contain children
 */
function isCollection(modelType: string): boolean {
  return [
    "Submodel",
    "SubmodelElementCollection",
    "SubmodelElementList",
    "Entity",
    "AnnotatedRelationshipElement",
  ].includes(modelType);
}
