/**
 * Breadcrumb Hook
 * 
 * Connects breadcrumb navigation to tree selection and provides
 * navigation functionality.
 */

import { useEffect, useCallback } from 'react';
import { useBreadcrumbStore } from '@/stores/breadcrumbStore';
import type { BreadcrumbItem } from '@/stores/breadcrumbStore';

interface UseBreadcrumbOptions {
  onNavigate?: (item: BreadcrumbItem) => void;
  autoUpdate?: boolean;
}

/**
 * Hook for breadcrumb navigation
 */
export function useBreadcrumbNavigation(
  selectedNode: any,
  options: UseBreadcrumbOptions = {}
) {
  const { onNavigate, autoUpdate = true } = options;
  
  const {
    items,
    currentItem,
    updateFromNode,
    navigateTo,
    clear,
  } = useBreadcrumbStore();
  
  // Update breadcrumb when selected node changes
  useEffect(() => {
    if (autoUpdate) {
      updateFromNode(selectedNode);
    }
  }, [selectedNode, autoUpdate, updateFromNode]);
  
  // Handle navigation
  const handleNavigate = useCallback(
    (item: BreadcrumbItem) => {
      navigateTo(item);
      onNavigate?.(item);
    },
    [navigateTo, onNavigate]
  );
  
  return {
    items,
    currentItem,
    navigate: handleNavigate,
    clear,
    updateFromNode,
  };
}

/**
 * Hook for breadcrumb path building
 */
export function useBreadcrumbPath(node: any): BreadcrumbItem[] {
  const items = useBreadcrumbStore((state) => state.items);
  const updateFromNode = useBreadcrumbStore((state) => state.updateFromNode);
  
  useEffect(() => {
    updateFromNode(node);
  }, [node, updateFromNode]);
  
  return items;
}
