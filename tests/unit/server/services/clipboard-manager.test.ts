/**
 * Tests for Clipboard Manager Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { clipboardManager } from '../../../../server/src/services/clipboard-manager';
import type { SubmodelElement } from '../../../../shared/aas-v3-types';

describe('ClipboardManager', () => {
  const mockElement: SubmodelElement = {
    modelType: 'Property',
    idShort: 'testProperty',
    valueType: 'xs:string',
    value: 'test value',
  };

  beforeEach(() => {
    clipboardManager.clear();
  });

  describe('copy', () => {
    it('should copy element to clipboard', () => {
      const result = clipboardManager.copy(mockElement, 'package1', ['path1']);

      expect(result.element).toEqual(mockElement);
      expect(result.operation).toBe('copy');
      expect(result.sourcePackageId).toBe('package1');
      expect(clipboardManager.hasContent()).toBe(true);
    });

    it('should deep clone the element', () => {
      clipboardManager.copy(mockElement, 'package1', ['path1']);
      const clipboard = clipboardManager.getClipboard();

      expect(clipboard?.element).not.toBe(mockElement);
      expect(clipboard?.element).toEqual(mockElement);
    });
  });

  describe('cut', () => {
    it('should cut element to clipboard', () => {
      const result = clipboardManager.cut(mockElement, 'package1', ['path1']);

      expect(result.element).toEqual(mockElement);
      expect(result.operation).toBe('cut');
      expect(clipboardManager.hasContent()).toBe(true);
    });
  });

  describe('paste', () => {
    it('should paste copied element', () => {
      clipboardManager.copy(mockElement, 'package1', ['path1']);

      const result = clipboardManager.paste({
        targetPackageId: 'package1',
        targetParentPath: ['path2'],
        regenerateIds: true,
      });

      expect(result.element.modelType).toBe('Property');
      expect(result.element.idShort).not.toBe(mockElement.idShort);
      expect(result.idMapping.size).toBeGreaterThan(0);
    });

    it('should clear clipboard after pasting cut element', () => {
      clipboardManager.cut(mockElement, 'package1', ['path1']);

      clipboardManager.paste({
        targetPackageId: 'package1',
        targetParentPath: ['path2'],
      });

      expect(clipboardManager.hasContent()).toBe(false);
    });

    it('should not clear clipboard after pasting copied element', () => {
      clipboardManager.copy(mockElement, 'package1', ['path1']);

      clipboardManager.paste({
        targetPackageId: 'package1',
        targetParentPath: ['path2'],
      });

      expect(clipboardManager.hasContent()).toBe(true);
    });

    it('should throw error when clipboard is empty', () => {
      expect(() =>
        clipboardManager.paste({
          targetPackageId: 'package1',
          targetParentPath: ['path2'],
        })
      ).toThrow('Clipboard is empty');
    });

    it('should warn about cross-package paste', () => {
      clipboardManager.copy(mockElement, 'package1', ['path1']);

      const result = clipboardManager.paste({
        targetPackageId: 'package2',
        targetParentPath: ['path2'],
      });

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Cross-package');
    });
  });

  describe('duplicate', () => {
    it('should duplicate element', () => {
      const result = clipboardManager.duplicate(mockElement, 'package1', ['path1']);

      expect(result.element.modelType).toBe('Property');
      expect(result.element.idShort).not.toBe(mockElement.idShort);
    });
  });

  describe('clear', () => {
    it('should clear clipboard', () => {
      clipboardManager.copy(mockElement, 'package1', ['path1']);
      expect(clipboardManager.hasContent()).toBe(true);

      clipboardManager.clear();
      expect(clipboardManager.hasContent()).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return stats for empty clipboard', () => {
      const stats = clipboardManager.getStats();

      expect(stats.hasContent).toBe(false);
    });

    it('should return stats for clipboard with content', () => {
      clipboardManager.copy(mockElement, 'package1', ['path1']);
      const stats = clipboardManager.getStats();

      expect(stats.hasContent).toBe(true);
      expect(stats.operation).toBe('copy');
      expect(stats.elementType).toBe('Property');
    });
  });

  describe('ID regeneration', () => {
    it('should regenerate IDs when requested', () => {
      clipboardManager.copy(mockElement, 'package1', ['path1']);

      const result = clipboardManager.paste({
        targetPackageId: 'package1',
        targetParentPath: ['path2'],
        regenerateIds: true,
      });

      expect(result.element.idShort).not.toBe(mockElement.idShort);
      expect(result.idMapping.has(mockElement.idShort!)).toBe(true);
    });

    it('should not regenerate IDs when not requested', () => {
      clipboardManager.copy(mockElement, 'package1', ['path1']);

      const result = clipboardManager.paste({
        targetPackageId: 'package1',
        targetParentPath: ['path2'],
        regenerateIds: false,
      });

      expect(result.element.idShort).toBe(mockElement.idShort);
    });
  });

  describe('nested elements', () => {
    it('should handle elements with children', () => {
      const collectionElement: SubmodelElement = {
        modelType: 'SubmodelElementCollection',
        idShort: 'collection',
        value: [
          {
            modelType: 'Property',
            idShort: 'child1',
            valueType: 'xs:string',
            value: 'value1',
          },
          {
            modelType: 'Property',
            idShort: 'child2',
            valueType: 'xs:string',
            value: 'value2',
          },
        ],
      };

      clipboardManager.copy(collectionElement, 'package1', ['path1']);
      const clipboard = clipboardManager.getClipboard();

      expect(clipboard?.metadata.hasChildren).toBe(true);
    });

    it('should regenerate IDs for nested elements', () => {
      const collectionElement: SubmodelElement = {
        modelType: 'SubmodelElementCollection',
        idShort: 'collection',
        value: [
          {
            modelType: 'Property',
            idShort: 'child1',
            valueType: 'xs:string',
            value: 'value1',
          },
        ],
      };

      clipboardManager.copy(collectionElement, 'package1', ['path1']);

      const result = clipboardManager.paste({
        targetPackageId: 'package1',
        targetParentPath: ['path2'],
        regenerateIds: true,
      });

      expect(result.element.idShort).not.toBe('collection');
      const children = result.element.value as SubmodelElement[];
      expect(children[0].idShort).not.toBe('child1');
    });
  });
});
