/**
 * Delete Confirmation Dialog
 * 
 * Confirmation dialog for delete operations with dependency warnings.
 */

import { AlertTriangle, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (force: boolean) => Promise<void>;
  elements: any[];
  dependencies?: Dependency[];
}

interface Dependency {
  type: string;
  count: number;
  ids: string[];
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  elements,
  dependencies = [],
}: DeleteConfirmationDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [forceDelete, setForceDelete] = React.useState(false);

  const hasDependencies = dependencies.length > 0;
  const elementCount = elements.length;
  const isMultiple = elementCount > 1;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(forceDelete);
      onOpenChange(false);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Confirm Deletion
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. {isMultiple ? 'These elements' : 'This element'} will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Element List */}
          <div className="space-y-2">
            <div className="text-sm font-medium">
              {isMultiple ? `${elementCount} elements` : 'Element'} to delete:
            </div>
            <ScrollArea className="max-h-32 rounded-md border p-3">
              <div className="space-y-1">
                {elements.map((element, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{element.idShort || element.id}</span>
                    <span className="text-muted-foreground ml-2">({element.modelType})</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Dependencies Warning */}
          {hasDependencies && (
            <div className="rounded-md bg-destructive/10 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-destructive">
                    Warning: Dependencies Found
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {isMultiple ? 'These elements have' : 'This element has'} dependencies that may be affected by deletion.
                  </div>
                </div>
              </div>

              {/* Dependency Details */}
              <div className="space-y-2">
                {dependencies.map((dep, index) => (
                  <div key={index} className="text-sm">
                    <div className="font-medium">
                      {dep.type}: {dep.count} {dep.count === 1 ? 'reference' : 'references'}
                    </div>
                    {dep.ids.length > 0 && (
                      <ScrollArea className="max-h-20 mt-1">
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          {dep.ids.map((id, i) => (
                            <div key={i}>• {id}</div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                ))}
              </div>

              {/* Force Delete Option */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <input
                  type="checkbox"
                  id="force-delete"
                  checked={forceDelete}
                  onChange={(e) => setForceDelete(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="force-delete" className="text-sm cursor-pointer">
                  Force delete (remove all dependencies)
                </label>
              </div>
            </div>
          )}

          {/* Warning Message */}
          {!hasDependencies && (
            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              {isMultiple
                ? 'These elements will be permanently removed from the environment.'
                : 'This element will be permanently removed from the environment.'}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting || (hasDependencies && !forceDelete)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Add React import
import * as React from 'react';
