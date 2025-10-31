/**
 * Editor Toolbar Component
 * Provides undo/redo buttons and other editing controls
 * 
 * Features:
 * - Undo/Redo buttons with keyboard shortcuts
 * - Disabled state when no actions available
 * - Tooltips showing command descriptions
 * - Visual feedback for actions
 */

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Undo2, Redo2, RotateCcw } from 'lucide-react';
import { useUndoRedo } from '../hooks/use-undo-redo';
import { useState } from 'react';

export interface EditorToolbarProps {
  readonly onClearHistory?: () => void;
  readonly showClearButton?: boolean;
}

/**
 * EditorToolbar - Toolbar with undo/redo controls
 */
export function EditorToolbar({
  onClearHistory,
  showClearButton = false,
}: EditorToolbarProps) {
  const { canUndo, canRedo, undoDescription, redoDescription, undo, redo, clear } = useUndoRedo();
  const [isUndoing, setIsUndoing] = useState(false);
  const [isRedoing, setIsRedoing] = useState(false);

  // Keyboard navigation hint
  const undoLabel = canUndo 
    ? `Undo: ${undoDescription} (Ctrl+Z)` 
    : 'Nothing to undo (Ctrl+Z)';
  
  const redoLabel = canRedo 
    ? `Redo: ${redoDescription} (Ctrl+Y)` 
    : 'Nothing to redo (Ctrl+Y)';

  const handleUndo = async () => {
    if (!canUndo || isUndoing) return;

    setIsUndoing(true);
    try {
      await undo();
    } catch (error) {
      console.error('Undo failed:', error);
    } finally {
      setIsUndoing(false);
    }
  };

  const handleRedo = async () => {
    if (!canRedo || isRedoing) return;

    setIsRedoing(true);
    try {
      await redo();
    } catch (error) {
      console.error('Redo failed:', error);
    } finally {
      setIsRedoing(false);
    }
  };

  const handleClear = () => {
    clear();
    if (onClearHistory) {
      onClearHistory();
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border-b bg-muted/30" role="toolbar" aria-label="Edit history controls">
      <TooltipProvider>
        {/* Undo Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleUndo}
              disabled={!canUndo || isUndoing}
              className="gap-2"
              aria-label={undoLabel}
            >
              <Undo2 className="h-4 w-4" />
              <span className="hidden sm:inline">Undo</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {canUndo && undoDescription
                ? `Undo: ${undoDescription}`
                : 'Nothing to undo'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Ctrl+Z</p>
          </TooltipContent>
        </Tooltip>

        {/* Redo Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRedo}
              disabled={!canRedo || isRedoing}
              className="gap-2"
              aria-label={redoLabel}
            >
              <Redo2 className="h-4 w-4" />
              <span className="hidden sm:inline">Redo</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {canRedo && redoDescription
                ? `Redo: ${redoDescription}`
                : 'Nothing to redo'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Ctrl+Y</p>
          </TooltipContent>
        </Tooltip>

        {/* Clear History Button (optional) */}
        {showClearButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClear}
                disabled={!canUndo && !canRedo}
                className="gap-2 ml-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Clear History</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear undo/redo history</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}
