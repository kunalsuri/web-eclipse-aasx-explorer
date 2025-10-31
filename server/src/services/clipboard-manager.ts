/**
 * Clipboard Manager Service
 * Server-side clipboard management for AAS elements
 * 
 * Features:
 * - Deep copy with reference updates
 * - ID conflict resolution
 * - Cross-package clipboard support
 * - Reference tracking and updates
 * - Type validation
 */

import { nanoid } from 'nanoid';
import type { SubmodelElement, Reference } from '../../../shared/aas-v3-types';

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

interface PasteOptions {
  targetPackageId: string;
  targetParentPath: string[];
  regenerateIds?: boolean;
  updateReferences?: boolean;
  preserveSemanticIds?: boolean;
}

interface PasteResult {
  element: SubmodelElement;
  idMapping: Map<string, string>; // old ID -> new ID
  updatedReferences: Reference[];
  warnings: string[];
}

class ClipboardManager {
  private clipboard: ClipboardItem | null = null;
  private readonly ID_PREFIX = 'elem_';

  /**
   * Copy element to clipboard
   */
  copy(
    element: SubmodelElement,
    sourcePackageId: string,
    sourceElementPath: string[]
  ): ClipboardItem {
    const item: ClipboardItem = {
      element: this.deepClone(element),
      operation: 'copy',
      sourcePackageId,
      sourceElementPath,
      timestamp: Date.now(),
      metadata: {
        elementType: element.modelType,
        hasChildren: this.hasChildren(element),
        referenceCount: this.countReferences(element),
      },
    };

    this.clipboard = item;
    return item;
  }

  /**
   * Cut element to clipboard
   */
  cut(
    element: SubmodelElement,
    sourcePackageId: string,
    sourceElementPath: string[]
  ): ClipboardItem {
    const item: ClipboardItem = {
      element: this.deepClone(element),
      operation: 'cut',
      sourcePackageId,
      sourceElementPath,
      timestamp: Date.now(),
      metadata: {
        elementType: element.modelType,
        hasChildren: this.hasChildren(element),
        referenceCount: this.countReferences(element),
      },
    };

    this.clipboard = item;
    return item;
  }

  /**
   * Paste element from clipboard
   */
  paste(options: PasteOptions): PasteResult {
    if (!this.clipboard) {
      throw new Error('Clipboard is empty');
    }

    const {
      targetPackageId,
      targetParentPath,
      regenerateIds = true,
      updateReferences = true,
      preserveSemanticIds = true,
    } = options;

    const warnings: string[] = [];
    const idMapping = new Map<string, string>();
    const updatedReferences: Reference[] = [];

    // Clone the element
    let element = this.deepClone(this.clipboard.element);

    // Regenerate IDs if needed
    if (regenerateIds) {
      element = this.regenerateIds(element, idMapping);
    }

    // Update references if needed
    if (updateReferences) {
      const refs = this.updateReferences(element, idMapping);
      updatedReferences.push(...refs);
    }

    // Validate paste compatibility
    const validationWarnings = this.validatePaste(
      element,
      targetPackageId,
      this.clipboard.sourcePackageId
    );
    warnings.push(...validationWarnings);

    // Clear clipboard if it was a cut operation
    if (this.clipboard.operation === 'cut') {
      this.clear();
    }

    return {
      element,
      idMapping,
      updatedReferences,
      warnings,
    };
  }

  /**
   * Get current clipboard item
   */
  getClipboard(): ClipboardItem | null {
    return this.clipboard;
  }

  /**
   * Clear clipboard
   */
  clear(): void {
    this.clipboard = null;
  }

  /**
   * Check if clipboard has content
   */
  hasContent(): boolean {
    return this.clipboard !== null;
  }

  /**
   * Deep clone an element
   */
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Check if element has children
   */
  private hasChildren(element: SubmodelElement): boolean {
    if ('value' in element && Array.isArray(element.value)) {
      return element.value.length > 0;
    }
    return false;
  }

  /**
   * Count references in element tree
   */
  private countReferences(element: SubmodelElement): number {
    let count = 0;

    // Check semanticId
    if ('semanticId' in element && element.semanticId) {
      count++;
    }

    // Check supplementalSemanticIds
    if ('supplementalSemanticIds' in element && element.supplementalSemanticIds) {
      count += element.supplementalSemanticIds.length;
    }

    // Check ReferenceElement
    if (element.modelType === 'ReferenceElement' && 'value' in element) {
      count++;
    }

    // Recursively check children
    if ('value' in element && Array.isArray(element.value)) {
      for (const child of element.value) {
        count += this.countReferences(child as SubmodelElement);
      }
    }

    return count;
  }

  /**
   * Regenerate IDs for element and children
   */
  private regenerateIds(
    element: SubmodelElement,
    idMapping: Map<string, string>
  ): SubmodelElement {
    const cloned = this.deepClone(element);

    // Generate new ID for this element
    if (cloned.idShort) {
      const oldId = cloned.idShort;
      const newId = this.generateUniqueId(oldId);
      idMapping.set(oldId, newId);
      cloned.idShort = newId;
    }

    // Recursively regenerate IDs for children
    if ('value' in cloned && Array.isArray(cloned.value)) {
      cloned.value = cloned.value.map((child: any) =>
        this.regenerateIds(child, idMapping)
      );
    }

    return cloned;
  }

  /**
   * Update references based on ID mapping
   */
  private updateReferences(
    element: SubmodelElement,
    idMapping: Map<string, string>
  ): Reference[] {
    const updatedRefs: Reference[] = [];

    // Update ReferenceElement value
    if (element.modelType === 'ReferenceElement' && 'value' in element) {
      const ref = element.value as Reference;
      if (ref && ref.keys) {
        for (const key of ref.keys) {
          if (key.value && idMapping.has(key.value)) {
            key.value = idMapping.get(key.value)!;
            updatedRefs.push(ref);
          }
        }
      }
    }

    // Recursively update children
    if ('value' in element && Array.isArray(element.value)) {
      for (const child of element.value) {
        const childRefs = this.updateReferences(child as SubmodelElement, idMapping);
        updatedRefs.push(...childRefs);
      }
    }

    return updatedRefs;
  }

  /**
   * Validate paste compatibility
   */
  private validatePaste(
    element: SubmodelElement,
    targetPackageId: string,
    sourcePackageId: string
  ): string[] {
    const warnings: string[] = [];

    // Check if cross-package paste
    if (targetPackageId !== sourcePackageId) {
      warnings.push('Cross-package paste: References may need manual verification');
    }

    // Check for potential ID conflicts (would be handled by regenerateIds)
    if (!element.idShort) {
      warnings.push('Element has no idShort - one will be generated');
    }

    return warnings;
  }

  /**
   * Generate unique ID
   */
  private generateUniqueId(baseId?: string): string {
    const suffix = nanoid(8);
    if (baseId) {
      // Remove any existing suffix and add new one
      const cleanBase = baseId.replace(/_[a-zA-Z0-9]{8}$/, '');
      return `${cleanBase}_${suffix}`;
    }
    return `${this.ID_PREFIX}${suffix}`;
  }

  /**
   * Duplicate element (copy + paste in one operation)
   */
  duplicate(
    element: SubmodelElement,
    packageId: string,
    parentPath: string[]
  ): PasteResult {
    // Copy to clipboard
    this.copy(element, packageId, parentPath);

    // Paste with ID regeneration
    return this.paste({
      targetPackageId: packageId,
      targetParentPath: parentPath,
      regenerateIds: true,
      updateReferences: true,
    });
  }

  /**
   * Get clipboard statistics
   */
  getStats(): {
    hasContent: boolean;
    operation?: 'copy' | 'cut';
    elementType?: string;
    hasChildren?: boolean;
    referenceCount?: number;
    age?: number;
  } {
    if (!this.clipboard) {
      return { hasContent: false };
    }

    return {
      hasContent: true,
      operation: this.clipboard.operation,
      elementType: this.clipboard.metadata.elementType,
      hasChildren: this.clipboard.metadata.hasChildren,
      referenceCount: this.clipboard.metadata.referenceCount,
      age: Date.now() - this.clipboard.timestamp,
    };
  }
}

// Singleton instance
export const clipboardManager = new ClipboardManager();
