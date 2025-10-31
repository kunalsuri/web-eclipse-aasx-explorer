/**
 * Keyboard Shortcut Hook
 * 
 * React hook for registering keyboard shortcuts.
 * Handles platform-specific modifiers (Cmd on Mac, Ctrl on Windows/Linux).
 */

import { useEffect, useCallback } from 'react';

export interface ShortcutOptions {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  global?: boolean; // Works even when input is focused
  preventDefault?: boolean;
  description?: string;
}

/**
 * Check if we're on macOS
 */
const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

/**
 * Normalize key name
 */
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/^key/, '');
}

/**
 * Check if an input element is focused
 */
function isInputFocused(): boolean {
  const active = document.activeElement;
  if (!active) return false;

  const tagName = active.tagName.toLowerCase();
  const isContentEditable = active.getAttribute('contenteditable') === 'true';

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    isContentEditable
  );
}

/**
 * Check if event matches shortcut
 */
function matchesShortcut(
  event: KeyboardEvent,
  key: string,
  options: ShortcutOptions
): boolean {
  const eventKey = normalizeKey(event.key);
  const targetKey = normalizeKey(key);

  if (eventKey !== targetKey) return false;

  // Check modifiers
  if (options.ctrl && !event.ctrlKey) return false;
  if (!options.ctrl && event.ctrlKey) return false;

  if (options.shift && !event.shiftKey) return false;
  if (!options.shift && event.shiftKey) return false;

  if (options.alt && !event.altKey) return false;
  if (!options.alt && event.altKey) return false;

  if (options.meta && !event.metaKey) return false;
  if (!options.meta && event.metaKey) return false;

  return true;
}

/**
 * Hook to register a keyboard shortcut
 */
export function useKeyboardShortcut(
  key: string,
  handler: (event: KeyboardEvent) => void,
  options: ShortcutOptions = {}
): void {
  const {
    global = false,
    preventDefault = true,
    ...modifiers
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if input is focused and shortcut is not global
      if (!global && isInputFocused()) {
        return;
      }

      // Check if event matches shortcut
      if (matchesShortcut(event, key, modifiers)) {
        if (preventDefault) {
          event.preventDefault();
        }
        handler(event);
      }
    },
    [key, handler, global, preventDefault, modifiers]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * Hook for platform-aware shortcuts (Cmd on Mac, Ctrl on Windows/Linux)
 */
export function usePlatformShortcut(
  key: string,
  handler: (event: KeyboardEvent) => void,
  options: Omit<ShortcutOptions, 'ctrl' | 'meta'> = {}
): void {
  useKeyboardShortcut(key, handler, {
    ...options,
    [isMac ? 'meta' : 'ctrl']: true,
  });
}

/**
 * Format shortcut for display
 */
export function formatShortcut(key: string, options: ShortcutOptions = {}): string {
  const parts: string[] = [];

  if (options.ctrl) parts.push(isMac ? '⌃' : 'Ctrl');
  if (options.shift) parts.push(isMac ? '⇧' : 'Shift');
  if (options.alt) parts.push(isMac ? '⌥' : 'Alt');
  if (options.meta) parts.push(isMac ? '⌘' : 'Win');

  // Capitalize first letter of key
  const displayKey = key.charAt(0).toUpperCase() + key.slice(1);
  parts.push(displayKey);

  return parts.join(isMac ? '' : '+');
}

/**
 * Format platform-aware shortcut for display
 */
export function formatPlatformShortcut(key: string, options: Omit<ShortcutOptions, 'ctrl' | 'meta'> = {}): string {
  return formatShortcut(key, {
    ...options,
    [isMac ? 'meta' : 'ctrl']: true,
  });
}

/**
 * Hook for multiple shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: Array<{
    key: string;
    handler: (event: KeyboardEvent) => void;
    options?: ShortcutOptions;
  }>
): void {
  shortcuts.forEach(({ key, handler, options }) => {
    useKeyboardShortcut(key, handler, options);
  });
}
