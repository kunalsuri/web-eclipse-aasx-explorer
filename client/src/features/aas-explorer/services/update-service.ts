/**
 * Update Service Client
 * Frontend service for property and element updates
 * 
 * Features:
 * - Property value updates
 * - Element updates (multiple properties)
 * - Multi-language property updates
 * - Element add/remove/reorder
 * - Version management
 * - Optimistic locking support
 */

import { apiClient, type ApiResponse } from './api-client';
import type { SubmodelElement, LangStringTextType } from '../../../../../shared/aas-v3-types';

export interface ElementPath {
  readonly type: 'aas' | 'submodel' | 'element' | 'conceptDescription';
  readonly id: string;
}

export interface UpdateResult {
  readonly element: SubmodelElement;
  readonly version: number;
  readonly timestamp: string;
}

export interface AddElementResult {
  readonly element: SubmodelElement;
  readonly index: number;
  readonly version: number;
  readonly timestamp: string;
}

export interface RemoveElementResult {
  readonly removedElement: SubmodelElement;
  readonly version: number;
  readonly timestamp: string;
}

export interface ReorderResult {
  readonly newOrder: string[];
  readonly version: number;
  readonly timestamp: string;
}

export interface VersionInfo {
  readonly version: number;
  readonly timestamp: string;
}

class UpdateService {
  /**
   * Update a property value
   */
  async updatePropertyValue(
    fileId: string,
    elementPath: ElementPath[],
    value: any,
    expectedVersion?: number
  ): Promise<UpdateResult> {
    const response = await apiClient.patch<UpdateResult>(
      `/api/aasx/${fileId}/property`,
      {
        elementPath,
        value,
        expectedVersion,
      }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update property');
    }

    return response.data;
  }

  /**
   * Update multiple properties of an element
   */
  async updateElement(
    fileId: string,
    elementPath: ElementPath[],
    updates: Partial<SubmodelElement>,
    expectedVersion?: number
  ): Promise<UpdateResult> {
    const response = await apiClient.patch<UpdateResult>(
      `/api/aasx/${fileId}/element`,
      {
        elementPath,
        updates,
        expectedVersion,
      }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update element');
    }

    return response.data;
  }

  /**
   * Update multi-language property
   */
  async updateMultiLanguageProperty(
    fileId: string,
    elementPath: ElementPath[],
    value: LangStringTextType[],
    expectedVersion?: number
  ): Promise<UpdateResult> {
    const response = await apiClient.patch<UpdateResult>(
      `/api/aasx/${fileId}/multi-language`,
      {
        elementPath,
        value,
        expectedVersion,
      }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update multi-language property');
    }

    return response.data;
  }

  /**
   * Add a new element to a container
   */
  async addElement(
    fileId: string,
    parentPath: ElementPath[],
    element: SubmodelElement,
    position?: number
  ): Promise<AddElementResult> {
    const response = await apiClient.post<AddElementResult>(
      `/api/aasx/${fileId}/element/add`,
      {
        parentPath,
        element,
        position,
      }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to add element');
    }

    return response.data;
  }

  /**
   * Remove an element from its container
   */
  async removeElement(
    fileId: string,
    elementPath: ElementPath[]
  ): Promise<RemoveElementResult> {
    const response = await apiClient.delete<RemoveElementResult>(
      `/api/aasx/${fileId}/element`,
      {
        elementPath,
      }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to remove element');
    }

    return response.data;
  }

  /**
   * Reorder elements within a container
   */
  async reorderElements(
    fileId: string,
    parentPath: ElementPath[],
    newOrder: string[]
  ): Promise<ReorderResult> {
    const response = await apiClient.patch<ReorderResult>(
      `/api/aasx/${fileId}/element/reorder`,
      {
        parentPath,
        newOrder,
      }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to reorder elements');
    }

    return response.data;
  }

  /**
   * Get current file version for optimistic locking
   */
  async getFileVersion(fileId: string): Promise<number> {
    const response = await apiClient.get<VersionInfo>(
      `/api/aasx/${fileId}/version`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get file version');
    }

    return response.data.version;
  }

  /**
   * Restore file from most recent backup
   */
  async restoreFromBackup(fileId: string): Promise<void> {
    const response = await apiClient.post(
      `/api/aasx/${fileId}/restore`
    );

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to restore from backup');
    }
  }
}

export const updateService = new UpdateService();
