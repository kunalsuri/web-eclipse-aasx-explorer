/**
 * Keyboard Shortcuts Hook
 * 
 * Global keyboard shortcut management for AASX editor operations
 * Implements P0-4: Keyboard Shortcuts requirement
 */

import { useEffect, useCallback, useRef } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  enabled?: boolean;
  preventDefault?: boolean;
}

export interface ShortcutCategory {
  name: string;
  shortcuts: KeyboardShortcut[];
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts: KeyboardShortcut[];
}

/**
 * Hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts({
  enabled = true,
  shortcuts,
}: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts);

  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) {
      return;
    }

    // Don't trigger shortcuts when typing in input fields (unless explicitly allowed)
    const target = event.target as HTMLElement;
    const isInputField = 
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable;

    for (const shortcut of shortcutsRef.current) {
      // Skip disabled shortcuts
      if (shortcut.enabled === false) {
        continue;
      }

      // Check if the key matches
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      if (!keyMatches) {
        continue;
      }

      // Check modifiers
      const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;

      if (ctrlMatch && shiftMatch && altMatch) {
        // Special handling for input fields
        // Some shortcuts like Ctrl+S, Ctrl+F should work even in inputs
        const allowedInInputs = ["s", "f", "z", "y"].includes(shortcut.key.toLowerCase()) && shortcut.ctrl;
        
        if (isInputField && !allowedInInputs) {
          continue;
        }

        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }

        shortcut.action();
        break;
      }
    }
  }, [enabled]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * Standard AASX Editor keyboard shortcuts
 */
export function createStandardShortcuts(actions: {
  onNew?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onRename?: () => void;
  onSearch?: () => void;
  onAdvancedSearch?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  onSelectAll?: () => void;
  onEscape?: () => void;
}): KeyboardShortcut[] {
  return [
    // File operations
    {
      key: "n",
      ctrl: true,
      description: "New element",
      action: actions.onNew || (() => {}),
      enabled: !!actions.onNew,
    },
    {
      key: "o",
      ctrl: true,
      description: "Open file",
      action: actions.onOpen || (() => {}),
      enabled: !!actions.onOpen,
    },
    {
      key: "s",
      ctrl: true,
      description: "Save",
      action: actions.onSave || (() => {}),
      enabled: !!actions.onSave,
    },
    {
      key: "s",
      ctrl: true,
      shift: true,
      description: "Save as",
      action: actions.onSaveAs || (() => {}),
      enabled: !!actions.onSaveAs,
    },
    {
      key: "w",
      ctrl: true,
      description: "Close",
      action: actions.onClose || (() => {}),
      enabled: !!actions.onClose,
    },

    // Edit operations
    {
      key: "c",
      ctrl: true,
      description: "Copy",
      action: actions.onCopy || (() => {}),
      enabled: !!actions.onCopy,
    },
    {
      key: "x",
      ctrl: true,
      description: "Cut",
      action: actions.onCut || (() => {}),
      enabled: !!actions.onCut,
    },
    {
      key: "v",
      ctrl: true,
      description: "Paste",
      action: actions.onPaste || (() => {}),
      enabled: !!actions.onPaste,
    },
    {
      key: "z",
      ctrl: true,
      description: "Undo",
      action: actions.onUndo || (() => {}),
      enabled: !!actions.onUndo,
    },
    {
      key: "y",
      ctrl: true,
      description: "Redo",
      action: actions.onRedo || (() => {}),
      enabled: !!actions.onRedo,
    },
    {
      key: "z",
      ctrl: true,
      shift: true,
      description: "Redo (alternative)",
      action: actions.onRedo || (() => {}),
      enabled: !!actions.onRedo,
    },
    {
      key: "d",
      ctrl: true,
      description: "Duplicate",
      action: actions.onDuplicate || (() => {}),
      enabled: !!actions.onDuplicate,
    },
    {
      key: "a",
      ctrl: true,
      description: "Select all",
      action: actions.onSelectAll || (() => {}),
      enabled: !!actions.onSelectAll,
    },

    // Element operations
    {
      key: "Delete",
      description: "Delete selected element",
      action: actions.onDelete || (() => {}),
      enabled: !!actions.onDelete,
    },
    {
      key: "F2",
      description: "Rename/edit element",
      action: actions.onRename || (() => {}),
      enabled: !!actions.onRename,
    },

    // Search operations
    {
      key: "f",
      ctrl: true,
      description: "Search",
      action: actions.onSearch || (() => {}),
      enabled: !!actions.onSearch,
    },
    {
      key: "f",
      ctrl: true,
      shift: true,
      description: "Advanced search",
      action: actions.onAdvancedSearch || (() => {}),
      enabled: !!actions.onAdvancedSearch,
    },

    // Navigation
    {
      key: "Escape",
      description: "Cancel/close",
      action: actions.onEscape || (() => {}),
      enabled: !!actions.onEscape,
    },
  ];
}

/**
 * Group shortcuts by category for display
 */
export function groupShortcuts(shortcuts: KeyboardShortcut[]): ShortcutCategory[] {
  return [
    {
      name: "File Operations",
      shortcuts: shortcuts.filter(s => 
        ["n", "o", "s", "w"].includes(s.key.toLowerCase()) && s.ctrl
      ),
    },
    {
      name: "Edit Operations",
      shortcuts: shortcuts.filter(s =>
        ["c", "x", "v", "z", "y", "d", "a"].includes(s.key.toLowerCase()) && s.ctrl
      ),
    },
    {
      name: "Element Operations",
      shortcuts: shortcuts.filter(s =>
        ["Delete", "F2"].includes(s.key)
      ),
    },
    {
      name: "Search & Navigation",
      shortcuts: shortcuts.filter(s =>
        (s.key.toLowerCase() === "f" && s.ctrl) || s.key === "Escape"
      ),
    },
  ];
}

/**
 * Format shortcut for display (e.g., "Ctrl+S", "Shift+Delete")
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push("Ctrl");
  if (shortcut.shift) parts.push("Shift");
  if (shortcut.alt) parts.push("Alt");
  if (shortcut.meta) parts.push("Meta");

  // Capitalize first letter of key if it's a single letter
  const keyDisplay = shortcut.key.length === 1
    ? shortcut.key.toUpperCase()
    : shortcut.key;

  parts.push(keyDisplay);

  return parts.join("+");
}
