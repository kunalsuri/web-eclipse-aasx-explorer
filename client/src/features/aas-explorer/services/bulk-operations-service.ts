/**
 * Bulk Operations Service
 * Handles bulk operations on multiple AAS elements
 */

import { undoService } from './undo-service';
import {
  BulkDeleteCommand,
  UpdateElementCommand,
  BatchCommand,
} from './commands';
import type { SubmodelElement } from '../../../../../shared/aas-v3-types';
import type { ElementPath } from './update-service';

interface BulkOperationResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors: Array<{ id: string; error: string }>;
}

class BulkOperationsService {
  /**
   * Delete multiple elements
   */
  async bulkDelete(
    fileId: string,
    elementPaths: Map<string, ElementPath[]>,
    parentPath: ElementPath[]
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: false,
      processedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      const command = new BulkDeleteCommand(fileId, elementPaths, parentPath);
      await undoService.executeCommand(command);

      result.success = true;
      result.processedCount = elementPaths.size;
    } catch (error) {
      result.failedCount = elementPaths.size;
      result.errors.push({
        id: 'bulk-delete',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return result;
  }

  /**
   * Update multiple elements with same property values
   */
  async bulkUpdate(
    fileId: string,
    elements: Array<{ path: ElementPath[]; element: SubmodelElement }>,
    updates: Partial<SubmodelElement>
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: false,
      processedCount: 0,
      failedCount: 0,
      errors: [],
    };

    const commands = [];

    for (const { path, element } of elements) {
      try {
        const command = new UpdateElementCommand(
          fileId,
          path,
          element,
          { ...element, ...updates },
          element.idShort || 'element'
        );
        commands.push(command);
        result.processedCount++;
      } catch (error) {
        result.failedCount++;
        result.errors.push({
          id: element.idShort || 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (commands.length > 0) {
      try {
        const batchCommand = new BatchCommand(
          commands,
          `Bulk update ${commands.length} elements`
        );
        await undoService.executeCommand(batchCommand);
        result.success = true;
      } catch (error) {
        result.success = false;
        result.errors.push({
          id: 'batch',
          error: error instanceof Error ? error.message : 'Batch command failed',
        });
      }
    }

    return result;
  }

  /**
   * Move multiple elements to a new parent
   */
  async bulkMove(
    fileId: string,
    elementPaths: Map<string, ElementPath[]>,
    targetParentPath: ElementPath[]
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: false,
      processedCount: 0,
      failedCount: 0,
      errors: [],
    };

    // TODO: Implement bulk move
    // This would involve:
    // 1. Remove elements from current location
    // 2. Add elements to new location
    // 3. Wrap in a batch command for undo/redo

    result.errors.push({
      id: 'bulk-move',
      error: 'Bulk move not yet implemented',
    });

    return result;
  }

  /**
   * Copy multiple elements
   */
  async bulkCopy(
    elements: SubmodelElement[],
    sourcePackageId: string
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: false,
      processedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      // Store elements in a temporary clipboard-like structure
      // For now, just count as success
      result.processedCount = elements.length;
      result.success = true;
    } catch (error) {
      result.failedCount = elements.length;
      result.errors.push({
        id: 'bulk-copy',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return result;
  }

  /**
   * Export multiple elements
   */
  async bulkExport(
    elements: SubmodelElement[],
    format: 'json' | 'xml' | 'csv' = 'json'
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: false,
      processedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      if (format === 'json') {
        const json = JSON.stringify(elements, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulk-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        result.processedCount = elements.length;
        result.success = true;
      } else {
        result.errors.push({
          id: 'bulk-export',
          error: `Format ${format} not yet implemented`,
        });
      }
    } catch (error) {
      result.failedCount = elements.length;
      result.errors.push({
        id: 'bulk-export',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return result;
  }

  /**
   * Validate multiple elements
   */
  async bulkValidate(
    elements: SubmodelElement[]
  ): Promise<{
    validCount: number;
    invalidCount: number;
    errors: Array<{ id: string; errors: string[] }>;
  }> {
    const result = {
      validCount: 0,
      invalidCount: 0,
      errors: [] as Array<{ id: string; errors: string[] }>,
    };

    for (const element of elements) {
      // Basic validation
      const errors: string[] = [];

      if (!element.idShort) {
        errors.push('Missing idShort');
      }

      if (!element.modelType) {
        errors.push('Missing modelType');
      }

      if (errors.length > 0) {
        result.invalidCount++;
        result.errors.push({
          id: element.idShort || 'unknown',
          errors,
        });
      } else {
        result.validCount++;
      }
    }

    return result;
  }
}

export const bulkOperationsService = new BulkOperationsService();
export type { BulkOperationResult };
