/**
 * Tests for useKeyboardShortcuts hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../use-keyboard-shortcuts';

describe('useKeyboardShortcuts', () => {
  let handlers: any;

  beforeEach(() => {
    handlers = {
      onCopy: vi.fn(),
      onCut: vi.fn(),
      onPaste: vi.fn(),
      onDelete: vi.fn(),
      onUndo: vi.fn(),
      onRedo: vi.fn(),
      onSelectAll: vi.fn(),
      onDuplicate: vi.fn(),
      onFind: vi.fn(),
      onSave: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should handle Ctrl+C for copy', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        enabled: true,
        handlers,
      })
    );

    const event = new KeyboardEvent('keydown', {
      key: 'c',
      ctrlKey: true,
    });
    document.dispatchEvent(event);

    expect(handlers.onCopy).toHaveBeenCalledTimes(1);
  });

  it('should handle Ctrl+X for cut', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        enabled: true,
        handlers,
      })
    );

    const event = new KeyboardEvent('keydown', {
      key: 'x',
      ctrlKey: true,
    });
    document.dispatchEvent(event);

    expect(handlers.onCut).toHaveBeenCalledTimes(1);
  });

  it('should handle Ctrl+V for paste', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        enabled: true,
        handlers,
      })
    );

    const event = new KeyboardEvent('keydown', {
      key: 'v',
      ctrlKey: true,
    });
    document.dispatchEvent(event);

    expect(handlers.onPaste).toHaveBeenCalledTimes(1);
  });

  it('should handle Delete key', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        enabled: true,
        handlers,
      })
    );

    const event = new KeyboardEvent('keydown', {
      key: 'Delete',
    });
    document.dispatchEvent(event);

    expect(handlers.onDelete).toHaveBeenCalledTimes(1);
  });

  it('should handle Ctrl+Z for undo', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        enabled: true,
        handlers,
      })
    );

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
    });
    document.dispatchEvent(event);

    expect(handlers.onUndo).toHaveBeenCalledTimes(1);
  });

  it('should handle Ctrl+Y for redo', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        enabled: true,
        handlers,
      })
    );

    const event = new KeyboardEvent('keydown', {
      key: 'y',
      ctrlKey: true,
    });
    document.dispatchEvent(event);

    expect(handlers.onRedo).toHaveBeenCalledTimes(1);
  });

  it('should handle Ctrl+A for select all', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        enabled: true,
        handlers,
      })
    );

    const event = new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
    });
    document.dispatchEvent(event);

    expect(handlers.onSelectAll).toHaveBeenCalledTimes(1);
  });

  it('should not handle shortcuts when disabled', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        enabled: false,
        handlers,
      })
    );

    const event = new KeyboardEvent('keydown', {
      key: 'c',
      ctrlKey: true,
    });
    document.dispatchEvent(event);

    expect(handlers.onCopy).not.toHaveBeenCalled();
  });

  it('should not handle shortcuts in input fields', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        enabled: true,
        handlers,
      })
    );

    const input = document.createElement('input');
    document.body.appendChild(input);

    const event = new KeyboardEvent('keydown', {
      key: 'c',
      ctrlKey: true,
      bubbles: true,
    });
    Object.defineProperty(event, 'target', { value: input, enumerable: true });
    input.dispatchEvent(event);

    expect(handlers.onCopy).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });
});
