/**
 * Keyboard Shortcuts Hook
 * Centralized keyboard shortcut management for AAS Explorer
 * 
 * Features:
 * - Copy/Paste/Cut shortcuts (Ctrl+C, Ctrl+V, Ctrl+X)
 * - Delete shortcut (Delete/Backspace)
 * - Undo/Redo shortcuts (Ctrl+Z, Ctrl+Y)
 * - Select All shortcut (Ctrl+A)
 * - Context-aware shortcut handling
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcutHandlers {
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSelectAll?: () => void;
  onDuplicate?: () => void;
  onFind?: () => void;
  onSave?: () => void;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  handlers: KeyboardShortcutHandlers;
  scope?: 'global' | 'local';
}

export function useKeyboardShortcuts({
  enabled = true,
  handlers,
  scope = 'local',
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) {
        return;
      }

      // Don't handle shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Allow some shortcuts even in input fields
      const allowInInput = ['onSave', 'onUndo', 'onRedo', 'onFind'];

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? event.metaKey : event.ctrlKey;

      // Copy (Ctrl+C / Cmd+C)
      if (modifier && event.key === 'c' && !event.shiftKey) {
        if (!isInputField && handlers.onCopy) {
          event.preventDefault();
          handlers.onCopy();
          return;
        }
      }

      // Cut (Ctrl+X / Cmd+X)
      if (modifier && event.key === 'x' && !event.shiftKey) {
        if (!isInputField && handlers.onCut) {
          event.preventDefault();
          handlers.onCut();
          return;
        }
      }

      // Paste (Ctrl+V / Cmd+V)
      if (modifier && event.key === 'v' && !event.shiftKey) {
        if (!isInputField && handlers.onPaste) {
          event.preventDefault();
          handlers.onPaste();
          return;
        }
      }

      // Delete (Delete or Backspace)
      if ((event.key === 'Delete' || event.key === 'Backspace') && !modifier) {
        if (!isInputField && handlers.onDelete) {
          event.preventDefault();
          handlers.onDelete();
          return;
        }
      }

      // Undo (Ctrl+Z / Cmd+Z)
      if (modifier && event.key === 'z' && !event.shiftKey) {
        if (handlers.onUndo) {
          event.preventDefault();
          handlers.onUndo();
          return;
        }
      }

      // Redo (Ctrl+Y / Cmd+Shift+Z)
      if (
        (modifier && event.key === 'y') ||
        (modifier && event.shiftKey && event.key === 'z')
      ) {
        if (handlers.onRedo) {
          event.preventDefault();
          handlers.onRedo();
          return;
        }
      }

      // Select All (Ctrl+A / Cmd+A)
      if (modifier && event.key === 'a' && !event.shiftKey) {
        if (!isInputField && handlers.onSelectAll) {
          event.preventDefault();
          handlers.onSelectAll();
          return;
        }
      }

      // Duplicate (Ctrl+D / Cmd+D)
      if (modifier && event.key === 'd' && !event.shiftKey) {
        if (!isInputField && handlers.onDuplicate) {
          event.preventDefault();
          handlers.onDuplicate();
          return;
        }
      }

      // Find (Ctrl+F / Cmd+F)
      if (modifier && event.key === 'f' && !event.shiftKey) {
        if (handlers.onFind) {
          event.preventDefault();
          handlers.onFind();
          return;
        }
      }

      // Save (Ctrl+S / Cmd+S)
      if (modifier && event.key === 's' && !event.shiftKey) {
        if (handlers.onSave) {
          event.preventDefault();
          handlers.onSave();
          return;
        }
      }
    },
    [enabled, handlers]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (scope === 'global') {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }

    // For local scope, attach to document
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown, scope]);

  return {
    enabled,
  };
}

/**
 * Get platform-specific keyboard shortcut display text
 */
export function getShortcutText(shortcut: string): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifier = isMac ? '⌘' : 'Ctrl';

  const shortcuts: Record<string, string> = {
    copy: `${modifier}+C`,
    cut: `${modifier}+X`,
    paste: `${modifier}+V`,
    delete: 'Delete',
    undo: `${modifier}+Z`,
    redo: isMac ? `${modifier}+Shift+Z` : `${modifier}+Y`,
    selectAll: `${modifier}+A`,
    duplicate: `${modifier}+D`,
    find: `${modifier}+F`,
    save: `${modifier}+S`,
  };

  return shortcuts[shortcut] || '';
}
