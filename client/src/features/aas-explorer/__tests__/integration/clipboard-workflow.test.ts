/**
 * Integration Tests for Clipboard Workflow
 * Tests the complete copy/paste workflow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useClipboard } from '../../hooks/use-clipboard';
import { clipboardApi } from '../../api/clipboard-api';

// Mock the API
vi.mock('../../api/clipboard-api', () => ({
  clipboardApi: {
    copy: vi.fn(),
    cut: vi.fn(),
    paste: vi.fn(),
    getClipboard: vi.fn(),
    clear: vi.fn(),
    getStats: vi.fn(),
    duplicate: vi.fn(),
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('Clipboard Workflow Integration', () => {
  const mockElement = {
    modelType: 'Property' as const,
    idShort: 'testProperty',
    valueType: 'xs:string' as const,
    value: 'test value',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (clipboardApi.getClipboard as any).mockResolvedValue(null);
  });

  describe('Copy-Paste Workflow', () => {
    it('should complete full copy-paste workflow', async () => {
      const { result } = renderHook(() =>
        useClipboard({ useServer: true, packageId: 'test-package' })
      );

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock copy response
      (clipboardApi.copy as any).mockResolvedValue({
        element: mockElement,
        operation: 'copy',
        sourcePackageId: 'test-package',
        sourceElementPath: ['path1'],
        timestamp: Date.now(),
        metadata: {
          elementType: 'Property',
          hasChildren: false,
          referenceCount: 0,
        },
      });

      // Copy element
      await act(async () => {
        await result.current.copy(mockElement, ['path1']);
      });

      expect(clipboardApi.copy).toHaveBeenCalledWith(
        mockElement,
        'test-package',
        ['path1']
      );
      expect(result.current.canPaste).toBe(true);

      // Mock paste response
      (clipboardApi.paste as any).mockResolvedValue({
        element: { ...mockElement, idShort: 'testProperty_copy' },
        idMapping: { testProperty: 'testProperty_copy' },
        updatedReferences: [],
        warnings: [],
      });

      // Paste element
      let pastedElement;
      await act(async () => {
        pastedElement = await result.current.paste(['path2']);
      });

      expect(clipboardApi.paste).toHaveBeenCalledWith({
        targetPackageId: 'test-package',
        targetParentPath: ['path2'],
        regenerateIds: true,
        updateReferences: true,
      });
      expect(pastedElement).toBeDefined();
      expect((pastedElement as any).idShort).toBe('testProperty_copy');
    });

    it('should handle cut-paste workflow', async () => {
      const { result } = renderHook(() =>
        useClipboard({ useServer: true, packageId: 'test-package' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock cut response
      (clipboardApi.cut as any).mockResolvedValue({
        element: mockElement,
        operation: 'cut',
        sourcePackageId: 'test-package',
        sourceElementPath: ['path1'],
        timestamp: Date.now(),
        metadata: {
          elementType: 'Property',
          hasChildren: false,
          referenceCount: 0,
        },
      });

      // Cut element
      await act(async () => {
        await result.current.cut(mockElement, ['path1']);
      });

      expect(result.current.canPaste).toBe(true);

      // Mock paste and clear
      (clipboardApi.paste as any).mockResolvedValue({
        element: mockElement,
        idMapping: {},
        updatedReferences: [],
        warnings: [],
      });
      (clipboardApi.clear as any).mockResolvedValue(undefined);

      // Paste element (should clear clipboard after cut)
      await act(async () => {
        await result.current.paste(['path2']);
      });

      expect(clipboardApi.clear).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle copy errors gracefully', async () => {
      const { result } = renderHook(() =>
        useClipboard({ useServer: true, packageId: 'test-package' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (clipboardApi.copy as any).mockRejectedValue(new Error('Copy failed'));

      await act(async () => {
        await result.current.copy(mockElement, ['path1']);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Copy failed');
    });

    it('should handle paste errors gracefully', async () => {
      const { result } = renderHook(() =>
        useClipboard({ useServer: true, packageId: 'test-package' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Set up clipboard with item
      (clipboardApi.copy as any).mockResolvedValue({
        element: mockElement,
        operation: 'copy',
        sourcePackageId: 'test-package',
        sourceElementPath: ['path1'],
        timestamp: Date.now(),
      });

      await act(async () => {
        await result.current.copy(mockElement, ['path1']);
      });

      // Mock paste error
      (clipboardApi.paste as any).mockRejectedValue(new Error('Paste failed'));

      let pastedElement;
      await act(async () => {
        pastedElement = await result.current.paste(['path2']);
      });

      expect(pastedElement).toBeNull();
      expect(result.current.error).toBeDefined();
    });
  });

  describe('Offline Mode', () => {
    it('should work in offline mode with localStorage', async () => {
      const { result } = renderHook(() =>
        useClipboard({ useServer: false, packageId: 'test-package' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Copy element (should use localStorage)
      await act(async () => {
        await result.current.copy(mockElement, ['path1']);
      });

      expect(clipboardApi.copy).not.toHaveBeenCalled();
      expect(result.current.canPaste).toBe(true);

      // Paste element (should use localStorage)
      let pastedElement;
      await act(async () => {
        pastedElement = await result.current.paste(['path2']);
      });

      expect(clipboardApi.paste).not.toHaveBeenCalled();
      expect(pastedElement).toEqual(mockElement);
    });
  });
});
