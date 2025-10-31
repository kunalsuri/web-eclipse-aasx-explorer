/**
 * Undo/Redo Buttons Component
 * 
 * Toolbar buttons for undo and redo operations with keyboard shortcuts.
 */

import { Undo2, Redo2 } from 'lucide-react';
import { useUndo, useRedo } from '../../stores/commandStore';
import { usePlatformShortcut, formatPlatformShortcut } from '../../hooks/useKeyboardShortcut';

export function UndoRedoButtons() {
  const { undo, canUndo, undoHistory } = useUndo();
  const { redo, canRedo, redoHistory } = useRedo();

  // Register keyboard shortcuts
  usePlatformShortcut('z', undo);
  usePlatformShortcut('y', redo);
  usePlatformShortcut('z', redo, { shift: true });

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={undo}
        disabled={!canUndo}
        className="toolbar-button"
        title={`Undo${canUndo ? `: ${undoHistory[0]?.description}` : ''} (${formatPlatformShortcut('z')})`}
        aria-label="Undo last action"
        aria-disabled={!canUndo}
        aria-keyshortcuts={formatPlatformShortcut('z')}
      >
        <Undo2 size={18} />
      </button>

      <button
        onClick={redo}
        disabled={!canRedo}
        className="toolbar-button"
        title={`Redo${canRedo ? `: ${redoHistory[0]?.description}` : ''} (${formatPlatformShortcut('y')})`}
        aria-label="Redo last undone action"
        aria-disabled={!canRedo}
        aria-keyshortcuts={formatPlatformShortcut('y')}
      >
        <Redo2 size={18} />
      </button>
    </div>
  );
}

/**
 * Undo/Redo History Dropdown
 * Shows list of recent commands
 */
export function UndoRedoHistory() {
  const { undoHistory } = useUndo();
  const { redoHistory } = useRedo();

  if (undoHistory.length === 0 && redoHistory.length === 0) {
    return null;
  }

  return (
    <div className="undo-redo-history">
      {undoHistory.length > 0 && (
        <div className="history-section">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">Undo History</h4>
          <ul className="space-y-1">
            {undoHistory.slice(0, 10).map((command, index) => (
              <li
                key={command.timestamp}
                className="text-sm text-gray-700 truncate"
                title={command.description}
              >
                {index + 1}. {command.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      {redoHistory.length > 0 && (
        <div className="history-section mt-4">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">Redo History</h4>
          <ul className="space-y-1">
            {redoHistory.slice(0, 10).map((command, index) => (
              <li
                key={command.timestamp}
                className="text-sm text-gray-700 truncate"
                title={command.description}
              >
                {index + 1}. {command.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
