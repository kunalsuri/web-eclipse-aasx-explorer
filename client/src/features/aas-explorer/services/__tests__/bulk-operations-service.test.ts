/**
 * Tests for Bulk Operations Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { bulkOperationsService } from '../bulk-operations-service';
import { undoService } from '../undo-service';

// Mock undo service
vi.mock('../undo-service', () => ({
  undoService: {
    executeCommand: vi.fn(),
  },
}));

describe('BulkOperationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('bulkDelete', () => {
    it('should delete multiple elements', async () => {
      const elementPaths = new Map([
        ['elem1', [{ type: 'element', id: 'elem1' }]],
        ['elem2', [{ type: 'element', id: 'elem2' }]],
      ]);

      (undoService.executeCommand as any).mockResolvedValue(undefined);

      const result = await bulkOperationsService.bulkDelete(
        'file1',
        elementPaths,
        []
      );

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(2);
      expect(result.failedCount).toBe(0);
      expect(undoService.executeCommand).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during bulk delete', async () => {
      const elementPaths = new Map([
        ['elem1', [{ type: 'element', id: 'elem1' }]],
      ]);

      (undoService.executeCommand as any).mockRejectedValue(
        new Error('Delete failed')
      );

      const result = await bulkOperationsService.bulkDelete(
        'file1',
        elementPaths,
        []
      );

      expect(result.success).toBe(false);
      expect(result.failedCount).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('bulkUpdate', () => {
    it('should update multiple elements', async () => {
      const elements = [
        {
          path: [{ type: 'element', id: 'elem1' }],
          element: { modelType: 'Property', idShort: 'elem1', valueType: 'xs:string' } as any,
        },
        {
          path: [{ type: 'element', id: 'elem2' }],
          element: { modelType: 'Property', idShort: 'elem2', valueType: 'xs:string' } as any,
        },
      ];

      const updates = { description: [{ language: 'en', text: 'Updated' }] };

      (undoService.executeCommand as any).mockResolvedValue(undefined);

      const result = await bulkOperationsService.bulkUpdate(
        'file1',
        elements,
        updates
      );

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(2);
      expect(undoService.executeCommand).toHaveBeenCalledTimes(1);
    });
  });

  describe('bulkExport', () => {
    it('should export elements as JSON', async () => {
      const elements = [
        { modelType: 'Property', idShort: 'elem1', valueType: 'xs:string' } as any,
        { modelType: 'Property', idShort: 'elem2', valueType: 'xs:string' } as any,
      ];

      // Mock DOM APIs
      const mockClick = vi.fn();
      const mockCreateElement = vi.spyOn(document, 'createElement');
      mockCreateElement.mockReturnValue({
        click: mockClick,
        href: '',
        download: '',
      } as any);

      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      const result = await bulkOperationsService.bulkExport(elements, 'json');

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(2);
      expect(mockClick).toHaveBeenCalled();

      mockCreateElement.mockRestore();
    });
  });

  describe('bulkValidate', () => {
    it('should validate elements and report errors', async () => {
      const elements = [
        { modelType: 'Property', idShort: 'valid', valueType: 'xs:string' } as any,
        { modelType: 'Property', idShort: '', valueType: 'xs:string' } as any, // Invalid: no idShort
        { idShort: 'invalid' } as any, // Invalid: no modelType
      ];

      const result = await bulkOperationsService.bulkValidate(elements);

      expect(result.validCount).toBe(1);
      expect(result.invalidCount).toBe(2);
      expect(result.errors.length).toBe(2);
    });

    it('should handle all valid elements', async () => {
      const elements = [
        { modelType: 'Property', idShort: 'elem1', valueType: 'xs:string' } as any,
        { modelType: 'Property', idShort: 'elem2', valueType: 'xs:string' } as any,
      ];

      const result = await bulkOperationsService.bulkValidate(elements);

      expect(result.validCount).toBe(2);
      expect(result.invalidCount).toBe(0);
      expect(result.errors.length).toBe(0);
    });
  });
});
