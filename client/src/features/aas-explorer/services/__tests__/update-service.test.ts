/**
 * Update Service Client - Test Suite
 * Tests frontend update service with mocked API calls
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateService } from '../update-service';
import { apiClient } from '../api-client';
import { AasSubmodelElements, DataTypeDefXsd } from '../../../../../../shared/aas-v3-types';

// Mock the API client
vi.mock('../api-client', () => ({
  apiClient: {
    patch: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
  },
}));

describe('UpdateService Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updatePropertyValue', () => {
    it('should update property value successfully', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          element: {
            modelType: AasSubmodelElements.Property,
            idShort: 'TestProp',
            valueType: DataTypeDefXsd.String,
            value: 'new value',
          },
          version: 12345,
          timestamp: '2025-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

      const elementPath = [
        { type: 'submodel' as const, id: 'sm1' },
        { type: 'element' as const, id: 'prop1' },
      ];

      // Act
      const result = await updateService.updatePropertyValue(
        'file-id',
        elementPath,
        'new value'
      );

      // Assert
      expect(apiClient.patch).toHaveBeenCalledWith('/api/aasx/file-id/property', {
        elementPath,
        value: 'new value',
        expectedVersion: undefined,
      });
      expect(result.element.idShort).toBe('TestProp');
      expect(result.version).toBe(12345);
    });

    it('should include expected version when provided', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          element: { idShort: 'Test' },
          version: 12346,
          timestamp: '2025-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

      // Act
      await updateService.updatePropertyValue(
        'file-id',
        [{ type: 'element' as const, id: 'e1' }],
        'value',
        12345
      );

      // Assert
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/api/aasx/file-id/property',
        expect.objectContaining({ expectedVersion: 12345 })
      );
    });

    it('should throw error on failure', async () => {
      // Arrange
      vi.mocked(apiClient.patch).mockResolvedValue({
        success: false,
        error: { code: 'UPDATE_FAILED', message: 'Update failed' },
      });

      // Act & Assert
      await expect(
        updateService.updatePropertyValue('file-id', [], 'value')
      ).rejects.toThrow('Update failed');
    });
  });

  describe('updateElement', () => {
    it('should update element successfully', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          element: {
            modelType: AasSubmodelElements.Property,
            idShort: 'UpdatedProp',
            description: [{ language: 'en', text: 'Updated' }],
          },
          version: 12346,
          timestamp: '2025-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

      const updates = {
        idShort: 'UpdatedProp',
        description: [{ language: 'en', text: 'Updated' }],
      };

      // Act
      const result = await updateService.updateElement(
        'file-id',
        [{ type: 'element' as const, id: 'e1' }],
        updates
      );

      // Assert
      expect(apiClient.patch).toHaveBeenCalledWith('/api/aasx/file-id/element', {
        elementPath: [{ type: 'element', id: 'e1' }],
        updates,
        expectedVersion: undefined,
      });
      expect(result.element.idShort).toBe('UpdatedProp');
    });
  });

  describe('updateMultiLanguageProperty', () => {
    it('should update multi-language property successfully', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          element: {
            modelType: AasSubmodelElements.MultiLanguageProperty,
            idShort: 'MLProp',
            value: [
              { language: 'en', text: 'English' },
              { language: 'de', text: 'Deutsch' },
            ],
          },
          version: 12347,
          timestamp: '2025-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

      const value = [
        { language: 'en', text: 'English' },
        { language: 'de', text: 'Deutsch' },
      ];

      // Act
      const result = await updateService.updateMultiLanguageProperty(
        'file-id',
        [{ type: 'element' as const, id: 'ml1' }],
        value
      );

      // Assert
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/api/aasx/file-id/multi-language',
        {
          elementPath: [{ type: 'element', id: 'ml1' }],
          value,
          expectedVersion: undefined,
        }
      );
      expect(result.element.idShort).toBe('MLProp');
    });
  });

  describe('addElement', () => {
    it('should add element successfully', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          element: {
            modelType: AasSubmodelElements.Property,
            idShort: 'NewProp',
            valueType: DataTypeDefXsd.String,
            value: 'test',
          },
          index: 2,
          version: 12348,
          timestamp: '2025-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const newElement = {
        modelType: AasSubmodelElements.Property,
        idShort: 'NewProp',
        valueType: DataTypeDefXsd.String,
        value: 'test',
      };

      // Act
      const result = await updateService.addElement(
        'file-id',
        [{ type: 'submodel' as const, id: 'sm1' }],
        newElement as any,
        1
      );

      // Assert
      expect(apiClient.post).toHaveBeenCalledWith('/api/aasx/file-id/element/add', {
        parentPath: [{ type: 'submodel', id: 'sm1' }],
        element: newElement,
        position: 1,
      });
      expect(result.element.idShort).toBe('NewProp');
      expect(result.index).toBe(2);
    });

    it('should add element without position', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          element: { idShort: 'NewProp' },
          index: 3,
          version: 12349,
          timestamp: '2025-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      // Act
      await updateService.addElement(
        'file-id',
        [{ type: 'submodel' as const, id: 'sm1' }],
        { idShort: 'NewProp' } as any
      );

      // Assert
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/aasx/file-id/element/add',
        expect.objectContaining({ position: undefined })
      );
    });
  });

  describe('removeElement', () => {
    it('should remove element successfully', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          removedElement: {
            modelType: AasSubmodelElements.Property,
            idShort: 'RemovedProp',
          },
          version: 12350,
          timestamp: '2025-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.delete).mockResolvedValue(mockResponse);

      const elementPath = [
        { type: 'submodel' as const, id: 'sm1' },
        { type: 'element' as const, id: 'prop1' },
      ];

      // Act
      const result = await updateService.removeElement('file-id', elementPath);

      // Assert
      expect(apiClient.delete).toHaveBeenCalledWith('/api/aasx/file-id/element', {
        elementPath,
      });
      expect(result.removedElement.idShort).toBe('RemovedProp');
      expect(result.version).toBe(12350);
    });
  });

  describe('reorderElements', () => {
    it('should reorder elements successfully', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          newOrder: ['prop3', 'prop1', 'prop2'],
          version: 12351,
          timestamp: '2025-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

      const newOrder = ['prop3', 'prop1', 'prop2'];

      // Act
      const result = await updateService.reorderElements(
        'file-id',
        [{ type: 'submodel' as const, id: 'sm1' }],
        newOrder
      );

      // Assert
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/api/aasx/file-id/element/reorder',
        {
          parentPath: [{ type: 'submodel', id: 'sm1' }],
          newOrder,
        }
      );
      expect(result.newOrder).toEqual(newOrder);
      expect(result.version).toBe(12351);
    });
  });

  describe('getFileVersion', () => {
    it('should get file version successfully', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          version: 12352,
          timestamp: '2025-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      // Act
      const version = await updateService.getFileVersion('file-id');

      // Assert
      expect(apiClient.get).toHaveBeenCalledWith('/api/aasx/file-id/version');
      expect(version).toBe(12352);
    });

    it('should throw error on failure', async () => {
      // Arrange
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        error: { code: 'VERSION_FAILED', message: 'Failed to get version' },
      });

      // Act & Assert
      await expect(
        updateService.getFileVersion('file-id')
      ).rejects.toThrow('Failed to get version');
    });
  });

  describe('restoreFromBackup', () => {
    it('should restore from backup successfully', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          timestamp: '2025-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      // Act
      await updateService.restoreFromBackup('file-id');

      // Assert
      expect(apiClient.post).toHaveBeenCalledWith('/api/aasx/file-id/restore');
    });

    it('should throw error on failure', async () => {
      // Arrange
      vi.mocked(apiClient.post).mockResolvedValue({
        success: false,
        error: { code: 'RESTORE_FAILED', message: 'Restore failed' },
      });

      // Act & Assert
      await expect(
        updateService.restoreFromBackup('file-id')
      ).rejects.toThrow('Restore failed');
    });
  });
});
