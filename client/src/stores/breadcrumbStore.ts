/**
 * Breadcrumb Store
 * 
 * Manages breadcrumb navigation state for the AAS tree hierarchy.
 * Provides path tracking and navigation functionality.
 */

import { create } from 'zustand';

export interface BreadcrumbItem {
  id: string;
  label: string;
  type: 'environment' | 'shell' | 'submodel' | 'element' | 'collection';
  path: string[];
  level: number;
}

interface BreadcrumbState {
  items: BreadcrumbItem[];
  currentItem: BreadcrumbItem | null;
  
  // Actions
  setPath: (items: BreadcrumbItem[]) => void;
  navigateTo: (item: BreadcrumbItem) => void;
  clear: () => void;
  updateFromNode: (node: any) => void;
}

/**
 * Build breadcrumb path from a tree node
 */
function buildBreadcrumbPath(node: any): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];
  let current = node;
  let level = 0;
  
  // Traverse up the tree to build path
  while (current) {
    items.unshift({
      id: current.id || current.idShort || 'root',
      label: current.idShort || current.id || 'Environment',
      type: getNodeType(current),
      path: getNodePath(current),
      level: level++,
    });
    current = current.parent;
  }
  
  return items;
}

/**
 * Determine node type from modelType
 */
function getNodeType(node: any): BreadcrumbItem['type'] {
  if (!node.modelType) {
    return 'environment';
  }
  
  switch (node.modelType) {
    case 'AssetAdministrationShell':
      return 'shell';
    case 'Submodel':
      return 'submodel';
    case 'SubmodelElementCollection':
    case 'SubmodelElementList':
      return 'collection';
    default:
      return 'element';
  }
}

/**
 * Get full path array for a node
 */
function getNodePath(node: any): string[] {
  const path: string[] = [];
  let current = node;
  
  while (current) {
    if (current.idShort || current.id) {
      path.unshift(current.idShort || current.id);
    }
    current = current.parent;
  }
  
  return path;
}

/**
 * Breadcrumb store using Zustand
 */
export const useBreadcrumbStore = create<BreadcrumbState>((set, get) => ({
  items: [],
  currentItem: null,
  
  setPath: (items) => {
    set({
      items,
      currentItem: items.length > 0 ? items[items.length - 1] : null,
    });
  },
  
  navigateTo: (item) => {
    const { items } = get();
    const index = items.findIndex((i) => i.id === item.id);
    
    if (index !== -1) {
      // Truncate path to selected item
      const newItems = items.slice(0, index + 1);
      set({
        items: newItems,
        currentItem: item,
      });
    }
  },
  
  clear: () => {
    set({
      items: [],
      currentItem: null,
    });
  },
  
  updateFromNode: (node) => {
    if (!node) {
      get().clear();
      return;
    }
    
    const items = buildBreadcrumbPath(node);
    get().setPath(items);
  },
}));

/**
 * Hook for breadcrumb functionality
 */
export function useBreadcrumb() {
  const items = useBreadcrumbStore((state) => state.items);
  const currentItem = useBreadcrumbStore((state) => state.currentItem);
  const setPath = useBreadcrumbStore((state) => state.setPath);
  const navigateTo = useBreadcrumbStore((state) => state.navigateTo);
  const clear = useBreadcrumbStore((state) => state.clear);
  const updateFromNode = useBreadcrumbStore((state) => state.updateFromNode);
  
  return {
    items,
    currentItem,
    setPath,
    navigateTo,
    clear,
    updateFromNode,
  };
}
