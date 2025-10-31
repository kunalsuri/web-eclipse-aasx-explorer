/**
 * Reorder API
 * 
 * API client for element reordering operations.
 */

export interface ReorderRequest {
  elementId: string;
  targetParentId: string;
  position: number;
}

export interface ReorderResponse {
  success: boolean;
  newOrder: string[];
  version: number;
  timestamp: string;
}

/**
 * Reorder element within parent
 */
export async function reorderElement(
  fileId: string,
  request: ReorderRequest
): Promise<ReorderResponse> {
  const response = await fetch(`/api/v1/files/${fileId}/reorder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reorder element');
  }

  return response.json();
}

/**
 * Move element to different parent
 */
export async function moveElement(
  fileId: string,
  elementId: string,
  sourceParentId: string,
  targetParentId: string,
  position: number
): Promise<ReorderResponse> {
  const response = await fetch(`/api/v1/files/${fileId}/move`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      elementId,
      sourceParentId,
      targetParentId,
      position,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to move element');
  }

  return response.json();
}

/**
 * Swap two elements
 */
export async function swapElements(
  fileId: string,
  elementId1: string,
  elementId2: string
): Promise<ReorderResponse> {
  const response = await fetch(`/api/v1/files/${fileId}/swap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      elementId1,
      elementId2,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to swap elements');
  }

  return response.json();
}
