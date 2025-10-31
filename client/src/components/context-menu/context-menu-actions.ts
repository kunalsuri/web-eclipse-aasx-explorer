/**
 * Context Menu Actions
 * 
 * Defines all available context menu actions for AAS elements.
 */

import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Clipboard,
  Files,
  ArrowUp,
  ArrowDown,
  type LucideIcon,
} from 'lucide-react';

export interface ActionContext {
  selectedElements: any[];
  parentElement?: any;
  environment?: any;
  clipboard?: any;
}

export interface ContextMenuAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  shortcut?: string;
  enabled: (context: ActionContext) => boolean;
  visible: (context: ActionContext) => boolean;
  execute: (context: ActionContext) => Promise<void>;
  separator?: boolean;
}

// ============================================================================
// Action Definitions
// ============================================================================

export const CONTEXT_MENU_ACTIONS: ContextMenuAction[] = [
  // Add Element
  {
    id: 'add',
    label: 'Add Element',
    icon: Plus,
    shortcut: 'Ctrl+N',
    enabled: (ctx) => {
      if (ctx.selectedElements.length !== 1) return false;
      const element = ctx.selectedElements[0];
      // Can add to Submodel, Collection, List, Entity
      return ['Submodel', 'SubmodelElementCollection', 'SubmodelElementList', 'Entity'].includes(
        element.modelType
      );
    },
    visible: () => true,
    execute: async (ctx) => {
      // Will be implemented by parent component
      console.log('Add element', ctx);
    },
  },

  // Edit
  {
    id: 'edit',
    label: 'Edit',
    icon: Edit,
    shortcut: 'F2',
    enabled: (ctx) => ctx.selectedElements.length === 1,
    visible: () => true,
    execute: async (ctx) => {
      console.log('Edit element', ctx);
    },
  },

  // Separator
  {
    id: 'sep-1',
    label: '',
    separator: true,
    enabled: () => true,
    visible: () => true,
    execute: async () => {},
  },

  // Copy
  {
    id: 'copy',
    label: 'Copy',
    icon: Copy,
    shortcut: 'Ctrl+C',
    enabled: (ctx) => ctx.selectedElements.length > 0,
    visible: () => true,
    execute: async (ctx) => {
      console.log('Copy elements', ctx);
    },
  },

  // Paste
  {
    id: 'paste',
    label: 'Paste',
    icon: Clipboard,
    shortcut: 'Ctrl+V',
    enabled: (ctx) => {
      if (!ctx.clipboard || ctx.selectedElements.length !== 1) return false;
      const target = ctx.selectedElements[0];
      // Can paste into containers
      return ['Submodel', 'SubmodelElementCollection', 'SubmodelElementList', 'Entity'].includes(
        target.modelType
      );
    },
    visible: () => true,
    execute: async (ctx) => {
      console.log('Paste element', ctx);
    },
  },

  // Duplicate
  {
    id: 'duplicate',
    label: 'Duplicate',
    icon: Files,
    shortcut: 'Ctrl+D',
    enabled: (ctx) => ctx.selectedElements.length === 1,
    visible: () => true,
    execute: async (ctx) => {
      console.log('Duplicate element', ctx);
    },
  },

  // Separator
  {
    id: 'sep-2',
    label: '',
    separator: true,
    enabled: () => true,
    visible: () => true,
    execute: async () => {},
  },

  // Move Up
  {
    id: 'move-up',
    label: 'Move Up',
    icon: ArrowUp,
    shortcut: 'Ctrl+↑',
    enabled: (ctx) => {
      if (ctx.selectedElements.length !== 1) return false;
      // Check if element can be moved up (has previous sibling)
      return true; // Simplified - actual check would verify position
    },
    visible: () => true,
    execute: async (ctx) => {
      console.log('Move up', ctx);
    },
  },

  // Move Down
  {
    id: 'move-down',
    label: 'Move Down',
    icon: ArrowDown,
    shortcut: 'Ctrl+↓',
    enabled: (ctx) => {
      if (ctx.selectedElements.length !== 1) return false;
      // Check if element can be moved down (has next sibling)
      return true; // Simplified - actual check would verify position
    },
    visible: () => true,
    execute: async (ctx) => {
      console.log('Move down', ctx);
    },
  },

  // Separator
  {
    id: 'sep-3',
    label: '',
    separator: true,
    enabled: () => true,
    visible: () => true,
    execute: async () => {},
  },

  // Delete
  {
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    shortcut: 'Delete',
    enabled: (ctx) => ctx.selectedElements.length > 0,
    visible: () => true,
    execute: async (ctx) => {
      console.log('Delete elements', ctx);
    },
  },
];

/**
 * Get context menu items for given context
 */
export function getContextMenuItems(context: ActionContext): ContextMenuAction[] {
  return CONTEXT_MENU_ACTIONS.filter(action => action.visible(context));
}

/**
 * Execute context menu action
 */
export async function executeAction(
  actionId: string,
  context: ActionContext
): Promise<void> {
  const action = CONTEXT_MENU_ACTIONS.find(a => a.id === actionId);
  if (!action) {
    throw new Error(`Action ${actionId} not found`);
  }

  if (!action.enabled(context)) {
    throw new Error(`Action ${actionId} is not enabled`);
  }

  await action.execute(context);
}
