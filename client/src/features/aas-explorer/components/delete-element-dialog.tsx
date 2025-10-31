/**
 * Delete Element Dialog Component
 * Confirmation dialog for deleting AAS elements with cascade options
 */

import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DeleteElementDialogProps {
  elementName: string;
  elementType: string;
  hasChildren?: boolean;
  hasReferences?: boolean;
  referenceCount?: number;
  onDelete: (options: DeleteOptions) => Promise<void>;
  trigger?: React.ReactNode;
}

export interface DeleteOptions {
  cascadeDelete: boolean;
  cleanupReferences: boolean;
}

export function DeleteElementDialog({
  elementName,
  elementType,
  hasChildren = false,
  hasReferences = false,
  referenceCount = 0,
  onDelete,
  trigger,
}: DeleteElementDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cascadeDelete, setCascadeDelete] = useState(false);
  const [cleanupReferences, setCleanupReferences] = useState(true);

  async function handleDelete() {
    setIsDeleting(true);

    try {
      await onDelete({
        cascadeDelete,
        cleanupReferences,
      });
      setOpen(false);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete {elementType}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{elementName}</strong>? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Cascade delete option */}
          {hasChildren && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cascade-delete"
                  checked={cascadeDelete}
                  onCheckedChange={(checked) => setCascadeDelete(checked as boolean)}
                />
                <Label htmlFor="cascade-delete" className="text-sm font-normal cursor-pointer">
                  Delete all child elements
                </Label>
              </div>
              <Alert>
                <AlertDescription className="text-xs">
                  This element contains child elements. If unchecked, the delete operation will fail
                  if children exist.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Reference cleanup option */}
          {hasReferences && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cleanup-references"
                  checked={cleanupReferences}
                  onCheckedChange={(checked) => setCleanupReferences(checked as boolean)}
                />
                <Label htmlFor="cleanup-references" className="text-sm font-normal cursor-pointer">
                  Clean up references ({referenceCount} found)
                </Label>
              </div>
              <Alert>
                <AlertDescription className="text-xs">
                  Other elements reference this element. If checked, these references will be
                  removed.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Warning */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This action is permanent and cannot be undone. Make sure you
              have a backup if needed.
            </AlertDescription>
          </Alert>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
