/**
 * Bulk Operations API
 * 
 * API client for bulk edit operations.
 */

import type { BulkOperation, BulkOperationResult } from '../components/bulk-operations';

/**
 * Execute bulk operation
 */
export async function executeBulkOperation(
  fileId: string,
  operation: BulkOperation
): Promise<BulkOperationResult> {
  const response = await fetch(`/api/v1/files/${fileId}/bulk-edit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(operation),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Bulk operation failed');
  }

  return response.json();
}

/**
 * Bulk delete elements
 */
export async function bulkDelete(
  fileId: string,
  elementIds: string[]
): Promise<BulkOperationResult> {
  const response = await fetch(`/api/v1/files/${fileId}/bulk-delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ elementIds }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Bulk delete failed');
  }

  return response.json();
}

/**
 * Bulk update property
 */
export async function bulkUpdateProperty(
  fileId: string,
  elementIds: string[],
  propertyPath: string,
  value: any
): Promise<BulkOperationResult> {
  const response = await fetch(`/api/v1/files/${fileId}/bulk-update-property`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      elementIds,
      propertyPath,
      value,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Bulk update failed');
  }

  return response.json();
}
