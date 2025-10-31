/**
 * Clipboard API Client
 * Client-side API for clipboard operations
 */

import type { SubmodelElement, Reference } from '../../../../../shared/aas-v3-types';

interface ClipboardItem {
  element: SubmodelElement;
  operation: 'copy' | 'cut';
  sourcePackageId: string;
  sourceElementPath: string[];
  timestamp: number;
  metadata: {
    elementType: string;
    hasChildren: boolean;
    referenceCount: number;
  };
}

interface PasteResult {
  element: SubmodelElement;
  idMapping: Record<string, string>;
  updatedReferences: Reference[];
  warnings: string[];
}

interface ClipboardStats {
  hasContent: boolean;
  operation?: 'copy' | 'cut';
  elementType?: string;
  hasChildren?: boolean;
  referenceCount?: number;
  age?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ClipboardApi {
  private baseUrl = '/api/clipboard';

  /**
   * Copy element to clipboard
   */
  async copy(
    element: SubmodelElement,
    sourcePackageId: string,
    sourceElementPath: string[]
  ): Promise<ClipboardItem> {
    const response = await fetch(`${this.baseUrl}/copy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        element,
        sourcePackageId,
        sourceElementPath,
      }),
    });

    const result: ApiResponse<Partial<ClipboardItem>> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to copy element');
    }

    return result.data as ClipboardItem;
  }

  /**
   * Cut element to clipboard
   */
  async cut(
    element: SubmodelElement,
    sourcePackageId: string,
    sourceElementPath: string[]
  ): Promise<ClipboardItem> {
    const response = await fetch(`${this.baseUrl}/cut`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        element,
        sourcePackageId,
        sourceElementPath,
      }),
    });

    const result: ApiResponse<Partial<ClipboardItem>> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to cut element');
    }

    return result.data as ClipboardItem;
  }

  /**
   * Paste element from clipboard
   */
  async paste(options: {
    targetPackageId: string;
    targetParentPath: string[];
    regenerateIds?: boolean;
    updateReferences?: boolean;
    preserveSemanticIds?: boolean;
  }): Promise<PasteResult> {
    const response = await fetch(`${this.baseUrl}/paste`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    const result: ApiResponse<PasteResult> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to paste element');
    }

    return result.data;
  }

  /**
   * Get current clipboard content
   */
  async getClipboard(): Promise<ClipboardItem | null> {
    const response = await fetch(this.baseUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result: ApiResponse<ClipboardItem | null> = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to get clipboard');
    }

    return result.data || null;
  }

  /**
   * Clear clipboard
   */
  async clear(): Promise<void> {
    const response = await fetch(this.baseUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result: ApiResponse<void> = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to clear clipboard');
    }
  }

  /**
   * Get clipboard statistics
   */
  async getStats(): Promise<ClipboardStats> {
    const response = await fetch(`${this.baseUrl}/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result: ApiResponse<ClipboardStats> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get clipboard stats');
    }

    return result.data;
  }

  /**
   * Duplicate element
   */
  async duplicate(
    element: SubmodelElement,
    packageId: string,
    parentPath: string[]
  ): Promise<PasteResult> {
    const response = await fetch(`${this.baseUrl}/duplicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        element,
        packageId,
        parentPath,
      }),
    });

    const result: ApiResponse<PasteResult> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to duplicate element');
    }

    return result.data;
  }
}

export const clipboardApi = new ClipboardApi();
export type { ClipboardItem, PasteResult, ClipboardStats };
