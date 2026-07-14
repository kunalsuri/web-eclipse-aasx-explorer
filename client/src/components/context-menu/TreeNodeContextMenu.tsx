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
        id: "add-element",
        label: "Add Element",
        icon: <Plus className="h-4 w-4" />,
        submenu: [
          {
            id: "add-property",
            label: "Property",
            onClick: () => actions.addElement(node.element, "Property"),
          },
          {
            id: "add-multi-language-property",
            label: "Multi-Language Property",
            onClick: () => actions.addElement(node.element, "MultiLanguageProperty"),
          },
          {
            id: "add-range",
            label: "Range",
            onClick: () => actions.addElement(node.element, "Range"),
          },
          {
            id: "add-reference-element",
            label: "Reference Element",
            onClick: () => actions.addElement(node.element, "ReferenceElement"),
          },
          { id: "add-element-sep-1", label: "", separator: true },
          {
            id: "add-collection",
            label: "Collection",
            onClick: () => actions.addElement(node.element, "SubmodelElementCollection"),
          },
          {
            id: "add-list",
            label: "List",
            onClick: () => actions.addElement(node.element, "SubmodelElementList"),
          },
          { id: "add-element-sep-2", label: "", separator: true },
          {
            id: "add-file",
            label: "File",
            onClick: () => actions.addElement(node.element, "File"),
          },
          {
            id: "add-blob",
            label: "Blob",
            onClick: () => actions.addElement(node.element, "Blob"),
          },
        ],
      });
      items.push({ id: "sep-add-element", label: "", separator: true });
    }

    // Edit action
    if (!readOnly) {
      items.push({
        id: "edit",
        label: "Edit",
        icon: <Edit className="h-4 w-4" />,
        shortcut: "F2",
        onClick: () => actions.editElement(node.element),
      });
    }

    // View action (read-only)
    items.push({
      id: "view-details",
      label: "View Details",
      icon: <FileText className="h-4 w-4" />,
      onClick: () => {
        // Open details panel
        console.log("View details:", node);
      },
    });

    if (!readOnly) {
      items.push({ id: "sep-view-details", label: "", separator: true });

      // Copy/Cut/Paste
      items.push({
        id: "copy",
        label: "Copy",
        icon: <Copy className="h-4 w-4" />,
        shortcut: "Ctrl+C",
        onClick: () => actions.copyElement(node.element),
      });

      items.push({
        id: "cut",
        label: "Cut",
        icon: <Scissors className="h-4 w-4" />,
        shortcut: "Ctrl+X",
        onClick: () => actions.cutElement(node.element, node.id),
      });

      if (actions.hasClipboardContent() && node.parent) {
        items.push({
          id: "paste",
          label: "Paste",
          icon: <Clipboard className="h-4 w-4" />,
          shortcut: "Ctrl+V",
          onClick: () => actions.pasteElement(node.parent),
        });
      }

      items.push({
        id: "duplicate",
        label: "Duplicate",
        icon: <FolderPlus className="h-4 w-4" />,
        shortcut: "Ctrl+D",
        onClick: () => actions.duplicateElement(node.element, node.parent),
        disabled: !node.parent,
      });

      items.push({ id: "sep-duplicate", label: "", separator: true });

      // Move Up/Down (for elements in collections)
      if (node.parent && node.index !== undefined) {
        items.push({
          id: "move-up",
          label: "Move Up",
          icon: <ArrowUp className="h-4 w-4" />,
          onClick: () => actions.moveElementUp(node.parent, node.index!),
          disabled: !canMoveUp,
        });

        items.push({
          id: "move-down",
          label: "Move Down",
          icon: <ArrowDown className="h-4 w-4" />,
          onClick: () => actions.moveElementDown(node.parent, node.index!),
          disabled: !canMoveDown,
        });

        items.push({ id: "sep-move", label: "", separator: true });
      }

      // Delete action
      items.push({
        id: "delete",
        label: "Delete",
        icon: <Trash2 className="h-4 w-4" />,
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
