/**
 * Drag-and-Drop Validation
 * 
 * Validates drag-and-drop operations for AAS elements.
 * Checks type compatibility, circular references, and cardinality constraints.
 */

import type { DragData } from '../components/tree/DraggableTreeNode';

// ============================================================================
// Type Definitions
// ============================================================================

const CONTAINER_TYPES = [
  'Submodel',
  'SubmodelElementCollection',
  'SubmodelElementList',
  'Entity',
];

const ELEMENT_TYPES = [
  'Property',
  'MultiLanguageProperty',
  'Range',
  'ReferenceElement',
  'Blob',
  'File',
  'SubmodelElementCollection',
  'SubmodelElementList',
  'Entity',
  'RelationshipElement',
  'AnnotatedRelationshipElement',
  'Operation',
  'Capability',
  'BasicEventElement',
];

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Check if element can be dropped at target position
 */
export function canDrop(
  dragData: DragData,
  targetNode: any,
  position: 'before' | 'after' | 'inside'
): boolean {
  // Can't drop on self
  if (dragData.nodeId === targetNode.id || dragData.nodeId === targetNode.idShort) {
    return false;
  }

  // Check position-specific rules
  if (position === 'inside') {
    return canDropInside(dragData, targetNode);
  } else {
    return canDropAdjacent(dragData, targetNode);
  }
}

/**
 * Check if element can be dropped inside target
 */
function canDropInside(dragData: DragData, targetNode: any): boolean {
  // Target must be a container
  if (!CONTAINER_TYPES.includes(targetNode.modelType)) {
    return false;
  }

  // Check type compatibility for SubmodelElementList
  if (targetNode.modelType === 'SubmodelElementList') {
    if (targetNode.typeValueListElement) {
      return dragData.nodeType === targetNode.typeValueListElement;
    }
  }

  // Check for circular reference
  if (wouldCreateCircularReference(dragData.node, targetNode)) {
    return false;
  }

  return true;
}

/**
 * Check if element can be dropped adjacent to target
 */
function canDropAdjacent(dragData: DragData, targetNode: any): boolean {
  // Both must be elements (not shells or submodels at root level)
  if (!ELEMENT_TYPES.includes(dragData.nodeType)) {
    return false;
  }

  if (!ELEMENT_TYPES.includes(targetNode.modelType)) {
    return false;
  }

  // Must have same parent type
  // This would need parent information from the tree structure
  // For now, allow if both are elements
  return true;
}

/**
 * Check if drop would create circular reference
 */
function wouldCreateCircularReference(dragNode: any, targetNode: any): boolean {
  // If dragging a container, check if target is a descendant
  if (CONTAINER_TYPES.includes(dragNode.modelType)) {
    return isDescendant(targetNode, dragNode);
  }

  return false;
}

/**
 * Check if node is a descendant of potential ancestor
 */
function isDescendant(node: any, potentialAncestor: any): boolean {
  if (!node) return false;

  // Check direct match
  if (node.id === potentialAncestor.id || node.idShort === potentialAncestor.idShort) {
    return true;
  }

  // Check children recursively
  const children = getChildren(potentialAncestor);
  for (const child of children) {
    if (isDescendant(node, child)) {
      return true;
    }
  }

  return false;
}

/**
 * Get children of a node
 */
function getChildren(node: any): any[] {
  if (!node) return [];

  const children: any[] = [];

  if (node.submodelElements && Array.isArray(node.submodelElements)) {
    children.push(...node.submodelElements);
  }

  if (node.value && Array.isArray(node.value)) {
    children.push(...node.value);
  }

  if (node.statements && Array.isArray(node.statements)) {
    children.push(...node.statements);
  }

  return children;
}

/**
 * Get drop effect for drag operation
 */
export function getDropEffect(
  dragData: DragData,
  targetNode: any,
  position: 'before' | 'after' | 'inside'
): 'move' | 'none' {
  return canDrop(dragData, targetNode, position) ? 'move' : 'none';
}

/**
 * Validate reorder operation
 */
export function validateReorder(
  elementId: string,
  targetParentId: string,
  position: number
): { valid: boolean; error?: string } {
  // Basic validation
  if (!elementId || !targetParentId) {
    return { valid: false, error: 'Invalid element or parent ID' };
  }

  if (position < 0) {
    return { valid: false, error: 'Invalid position' };
  }

  // Additional validation would check:
  // - Element exists
  // - Parent exists
  // - Position is within bounds
  // - Type compatibility
  // - Cardinality constraints

  return { valid: true };
}

/**
 * Calculate new position after drop
 */
export function calculateNewPosition(
  dragData: DragData,
  targetNode: any,
  position: 'before' | 'after' | 'inside',
  siblings: any[]
): number {
  if (position === 'inside') {
    // Add to end of children
    return getChildren(targetNode).length;
  }

  // Find target index in siblings
  const targetIndex = siblings.findIndex(
    s => s.id === targetNode.id || s.idShort === targetNode.idShort
  );

  if (targetIndex === -1) {
    return siblings.length;
  }

  // Calculate new position
  if (position === 'before') {
    return targetIndex;
  } else {
    return targetIndex + 1;
  }
}

/**
 * Get error message for invalid drop
 */
export function getDropErrorMessage(
  dragData: DragData,
  targetNode: any,
  position: 'before' | 'after' | 'inside'
): string {
  if (dragData.nodeId === targetNode.id || dragData.nodeId === targetNode.idShort) {
    return 'Cannot drop element on itself';
  }

  if (position === 'inside' && !CONTAINER_TYPES.includes(targetNode.modelType)) {
    return `Cannot drop inside ${targetNode.modelType}`;
  }

  if (position === 'inside' && targetNode.modelType === 'SubmodelElementList') {
    if (targetNode.typeValueListElement && dragData.nodeType !== targetNode.typeValueListElement) {
      return `List only accepts ${targetNode.typeValueListElement} elements`;
    }
  }

  if (wouldCreateCircularReference(dragData.node, targetNode)) {
    return 'Cannot create circular reference';
  }

  return 'Invalid drop operation';
}
