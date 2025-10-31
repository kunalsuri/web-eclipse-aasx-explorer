/**
 * Undo/Redo Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUndoRedo } from '../use-undo-redo';
import { undoService } from '../../services/undo-service';

// Mock undo service
vi.mock('../../services/undo-service', () => {
  const listeners = new Set<any>();
  return {
    undoService: {
      getState: vi.fn(() => ({
        canUndo: false,
        canRedo: false,
        undoDescription: undefined,
        redoDescription: undefined,
        historySize: 0,
      })),
      subscribe: vi.fn((listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      }),
      undo: vi.fn(),
      redo: vi.fn(),
      clear: vi.fn(),
      // Helper to trigger listeners
      _triggerListeners: (state: any) => {
        listeners.forEach((listener) => listener(state));
      },
    },
  };
});

describe('useUndoRedo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with undo service state', () => {
    const { result } = renderHook(() => useUndoRedo());

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.historySize).toBe(0);
  });

  it('should subscribe to state changes', () => {
    renderHook(() => useUndoRedo());

    expect(undoService.subscribe).toHaveBeenCalled();
  });

  it('should update state when service state changes', async () => {
    const { result } = renderHook(() => useUndoRedo());

    // Simulate state change
    act(() => {
      (undoService as any)._triggerListeners({
        canUndo: true,
        canRedo: false,
        undoDescription: 'Update property',
        redoDescription: undefined,
        historySize: 1,
      });
    });

    await waitFor(() => {
      expect(result.current.canUndo).toBe(true);
      expect(result.current.undoDescription).toBe('Update property');
      expect(result.current.historySize).toBe(1);
    });
  });

  it('should call undo service when undo is called', async () => {
    vi.mocked(undoService.undo).mockResolvedValue();

    const { result } = renderHook(() => useUndoRedo());

    await act(async () => {
      await result.current.undo();
    });

    expect(undoService.undo).toHaveBeenCalled();
  });

  it('should call redo service when redo is called', async () => {
    vi.mocked(undoService.redo).mockResolvedValue();

    const { result } = renderHook(() => useUndoRedo());

    await act(async () => {
      await result.current.redo();
    });

    expect(undoService.redo).toHaveBeenCalled();
  });

  it('should call clear service when clear is called', () => {
    const { result } = renderHook(() => useUndoRedo());

    act(() => {
      result.current.clear();
    });

    expect(undoService.clear).toHaveBeenCalled();
  });

  it('should handle undo errors', async () => {
    const mockError = new Error('Undo failed');
    vi.mocked(undoService.undo).mockRejectedValue(mockError);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useUndoRedo());

    await expect(result.current.undo()).rejects.toThrow('Undo failed');

    expect(consoleSpy).toHaveBeenCalledWith('Undo failed:', mockError);

    consoleSpy.mockRestore();
  });

  it('should handle redo errors', async () => {
    const mockError = new Error('Redo failed');
    vi.mocked(undoService.redo).mockRejectedValue(mockError);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useUndoRedo());

    await expect(result.current.redo()).rejects.toThrow('Redo failed');

    expect(consoleSpy).toHaveBeenCalledWith('Redo failed:', mockError);

    consoleSpy.mockRestore();
  });

  it('should unsubscribe on unmount', () => {
    const unsubscribe = vi.fn();
    vi.mocked(undoService.subscribe).mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useUndoRedo());

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
