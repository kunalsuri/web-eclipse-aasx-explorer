/**
 * Edit Confirmation Dialogs
 * Dialogs for confirming destructive edit operations
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Save, Trash2 } from 'lucide-react';

interface UnsavedChangesDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: () => void;
  readonly onDiscard: () => void;
  readonly changeCount?: number;
}

/**
 * Dialog to confirm discarding unsaved changes
 */
export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onSave,
  onDiscard,
  changeCount = 1,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            You have {changeCount} unsaved {changeCount === 1 ? 'change' : 'changes'}.
            Do you want to save before continuing?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard}>
            Discard Changes
          </AlertDialogCancel>
          <AlertDialogAction onClick={onSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface DeleteConfirmationDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
  readonly itemName?: string;
  readonly itemType?: string;
}

/**
 * Dialog to confirm deletion of an element
 */
export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  itemName = 'this item',
  itemType = 'element',
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{itemName}</strong>?
            This {itemType} will be permanently removed and cannot be recovered.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface ValidationErrorDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly errors: string[];
  readonly onFix?: () => void;
}

/**
 * Dialog to display validation errors
 */
export function ValidationErrorDialog({
  open,
  onOpenChange,
  errors,
  onFix,
}: ValidationErrorDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Validation Errors</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            The following validation errors must be fixed before saving:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4">
          <ul className="list-disc list-inside space-y-1 text-sm">
            {errors.map((error) => (
              <li key={error} className="text-destructive">
                {error}
              </li>
            ))}
          </ul>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          {onFix && (
            <AlertDialogAction onClick={onFix}>
              Fix Errors
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface SaveSuccessDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly message?: string;
}

/**
 * Dialog to confirm successful save
 */
export function SaveSuccessDialog({
  open,
  onOpenChange,
  message = 'Your changes have been saved successfully.',
}: SaveSuccessDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <Save className="h-5 w-5 text-success" />
            <AlertDialogTitle>Changes Saved</AlertDialogTitle>
          </div>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
