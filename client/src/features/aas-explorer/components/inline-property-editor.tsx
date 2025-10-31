/**
 * Inline Property Editor
 * Click-to-edit functionality for property panel
 */

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlinePropertyEditorProps {
  readonly value: string;
  readonly onSave: (value: string) => Promise<void>;
  readonly onCancel?: () => void;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly placeholder?: string;
  readonly type?: 'text' | 'number' | 'date';
}

/**
 * InlinePropertyEditor - Click-to-edit inline editor
 * Features:
 * - Click to activate edit mode
 * - Enter to save, Esc to cancel
 * - Tab navigation
 * - Visual feedback
 */
export function InlinePropertyEditor({
  value,
  onSave,
  onCancel,
  disabled = false,
  className,
  placeholder = 'Click to edit...',
  type = 'text',
}: InlinePropertyEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = () => {
    if (disabled) return;
    setEditValue(value);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      // Keep in edit mode on error
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="h-8 flex-1"
          placeholder={placeholder}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isSaving}
          className="h-8 w-8 p-0"
        >
          <Check className="h-4 w-4 text-success" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isSaving}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      onClick={handleEdit}
    >
      <span className="flex-1 text-sm break-words">
        {value || <span className="text-muted-foreground">{placeholder}</span>}
      </span>
      {!disabled && (
        <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
}

/**
 * Inline editor for multi-line text
 */
export function InlineTextAreaEditor({
  value,
  onSave,
  onCancel,
  disabled = false,
  className,
  placeholder = 'Click to edit...',
}: Omit<InlinePropertyEditorProps, 'type'>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = () => {
    if (disabled) return;
    setEditValue(value);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
    // Ctrl+Enter to save
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <div className={cn('space-y-2', className)}>
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="w-full min-h-[100px] p-2 text-sm border rounded-md resize-y"
          placeholder={placeholder}
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <span className="text-xs text-muted-foreground ml-auto">
            Ctrl+Enter to save, Esc to cancel
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group cursor-pointer hover:bg-muted/50 rounded p-2 transition-colors relative',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      onClick={handleEdit}
    >
      <p className="text-sm break-words whitespace-pre-wrap">
        {value || <span className="text-muted-foreground">{placeholder}</span>}
      </p>
      {!disabled && (
        <Edit2 className="absolute top-2 right-2 h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
}
