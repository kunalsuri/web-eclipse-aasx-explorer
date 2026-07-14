/**
 * Property Update Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { usePropertyUpdate } from '../use-property-update';
import { updateService } from '../../services/update-service';
import { undoService } from '../../services/undo-service';

// Mock services
vi.mock('../../services/update-service', () => ({
  updateService: {
    updatePropertyValue: vi.fn(),
    updateMultiLanguageProperty: vi.fn(),
  },
}));

vi.mock('../../services/undo-service', () => ({
  undoService: {
    executeCommand: vi.fn(),
  },
}));

describe('usePropertyUpdate', () => {
  const mockFileId = 'test-file-id';
  const mockElementPath = [
    { type: 'submodel' as const, id: 'sm1' },
    { type: 'element' as const, id: 'prop1' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() =>
      usePropertyUpdate({
        fileId: mockFileId,
        elementPath: mockElementPath,
      })
    );

    expect(result.current.state.isUpdating).toBe(false);
    expect(result.current.state.error).toBeNull();
    expect(result.current.state.lastUpdate).toBeNull();
  });

  it('should update property with undo/redo support', async () => {
    const mockElement = {
      modelType: 'Property',
      idShort: 'testProp',
      value: 'old-value',
    };

    vi.mocked(undoService.executeCommand).mockResolvedValue();

    const { result } = renderHook(() =>
      usePropertyUpdate({
        fileId: mockFileId,
        elementPath: mockElementPath,
        useUndoRedo: true,
      })
    );

    await act(async () => {
      await result.current.updateProperty(mockElement as any, 'new-value');
    });

    await waitFor(() => {
      expect(undoService.executeCommand).toHaveBeenCalled();
      expect(result.current.state.isUpdating).toBe(false);
      expect(result.current.state.error).toBeNull();
    });
  });

  it('should update property without undo/redo', async () => {
    const mockElement = {
      modelType: 'Property',
      idShort: 'testProp',
      value: 'old-value',
    };

    vi.mocked(updateService.updatePropertyValue).mockResolvedValue({
      element: mockElement as any,
      version: 2,
      timestamp: new Date().toISOString(),
    });

    const { result } = renderHook(() =>
      usePropertyUpdate({
        fileId: mockFileId,
        elementPath: mockElementPath,
        useUndoRedo: false,
      })
    );

    await act(async () => {
      await result.current.updateProperty(mockElement as any, 'new-value');
    });

    await waitFor(() => {
      expect(updateService.updatePropertyValue).toHaveBeenCalledWith(
        mockFileId,
        mockElementPath,
        'new-value'
      );
      expect(result.current.state.isUpdating).toBe(false);
    });
  });

  it('should handle update errors', async () => {
    const mockElement = {
      modelType: 'Property',
      idShort: 'testProp',
      value: 'old-value',
    };

    const mockError = new Error('Update failed');
    vi.mocked(undoService.executeCommand).mockRejectedValue(mockError);

    const { result } = renderHook(() =>
      usePropertyUpdate({
        fileId: mockFileId,
        elementPath: mockElementPath,
      })
    );

    await act(async () => {
      await expect(
        result.current.updateProperty(mockElement as any, 'new-value')
      ).rejects.toThrow('Update failed');
    });

    await waitFor(() => {
      expect(result.current.state.error).toEqual(mockError);
      expect(result.current.state.isUpdating).toBe(false);
    });
  });

  it('should call onSuccess callback', async () => {
    const mockElement = {
      modelType: 'Property',
      idShort: 'testProp',
      value: 'old-value',
    };

    const onSuccess = vi.fn();
    vi.mocked(undoService.executeCommand).mockResolvedValue();

    const { result } = renderHook(() =>
      usePropertyUpdate({
        fileId: mockFileId,
        elementPath: mockElementPath,
        onSuccess,
      })
    );

    await act(async () => {
      await result.current.updateProperty(mockElement as any, 'new-value');
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should call onError callback', async () => {
    const mockElement = {
      modelType: 'Property',
      idShort: 'testProp',
      value: 'old-value',
    };

    const mockError = new Error('Update failed');
    const onError = vi.fn();
    vi.mocked(undoService.executeCommand).mockRejectedValue(mockError);

    const { result } = renderHook(() =>
      usePropertyUpdate({
        fileId: mockFileId,
        elementPath: mockElementPath,
        onError,
      })
    );

    await act(async () => {
      await expect(
        result.current.updateProperty(mockElement as any, 'new-value')
      ).rejects.toThrow();
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(mockError);
    });
  });

  it('should update multi-language property', async () => {
    const mockElement = {
      modelType: 'MultiLanguageProperty',
      idShort: 'testProp',
      value: [{ language: 'en', text: 'old' }],
    };

    const newValue = [
      { language: 'en', text: 'new' },
      { language: 'de', text: 'neu' },
    ];

    vi.mocked(undoService.executeCommand).mockResolvedValue();

    const { result } = renderHook(() =>
      usePropertyUpdate({
        fileId: mockFileId,
        elementPath: mockElementPath,
      })
    );

    await act(async () => {
      await result.current.updateMultiLanguageProperty(mockElement as any, newValue);
    });

    await waitFor(() => {
      expect(undoService.executeCommand).toHaveBeenCalled();
      expect(result.current.state.isUpdating).toBe(false);
    });
  });

  it('should auto-detect property type in update method', async () => {
    const mockElement = {
      modelType: 'MultiLanguageProperty',
      idShort: 'testProp',
      value: [{ language: 'en', text: 'old' }],
    };

    const newValue = [{ language: 'en', text: 'new' }];

    vi.mocked(undoService.executeCommand).mockResolvedValue();

    const { result } = renderHook(() =>
      usePropertyUpdate({
        fileId: mockFileId,
        elementPath: mockElementPath,
      })
    );

    await act(async () => {
      await result.current.update(mockElement as any, newValue);
    });

    await waitFor(() => {
      expect(undoService.executeCommand).toHaveBeenCalled();
    });
  });
});
