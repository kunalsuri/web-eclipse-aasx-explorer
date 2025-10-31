/**
 * Property Update Hook
 * Integrates property editor with backend update service and undo/redo
 * 
 * Features:
 * - Backend integration for property updates
 * - Undo/redo support via command pattern
 * - Optimistic UI updates with rollback
 * - Error handling and user feedback
 */

import { useCallback, useState } from 'react';
import { updateService, type ElementPath } from '../services/update-service';
import { undoService } from '../services/undo-service';
import { UpdatePropertyCommand, UpdateMultiLanguageCommand } from '../services/commands';
import type { SubmodelElement, LangStringTextType } from '../../../../../shared/aas-v3-types';
import { toast } from '@/hooks/use-toast';

// Re-export ElementPath for convenience
export type { ElementPath } from '../services/update-service';

export interface UsePropertyUpdateOptions {
  fileId: string;
  elementPath: ElementPath[];
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  useUndoRedo?: boolean;
  showToast?: boolean;
}

export interface PropertyUpdateState {
  isUpdating: boolean;
  error: Error | null;
  lastUpdate: Date | null;
}

export function usePropertyUpdate({
  fileId,
  elementPath,
  onSuccess,
  onError,
  useUndoRedo = true,
  showToast = true,
}: UsePropertyUpdateOptions) {
  const [state, setState] = useState<PropertyUpdateState>({
    isUpdating: false,
    error: null,
    lastUpdate: null,
  });

  /**
   * Update a property value with undo/redo support
   */
  const updateProperty = useCallback(
    async (element: SubmodelElement, newValue: any) => {
      setState((prev) => ({ ...prev, isUpdating: true, error: null }));

      try {
        const oldValue = 'value' in element ? element.value : null;

        if (useUndoRedo) {
          // Use command pattern for undo/redo
          const command = new UpdatePropertyCommand(
            fileId,
            elementPath,
            oldValue,
            newValue,
            element.idShort || 'property'
          );

          await undoService.executeCommand(command);
        } else {
          // Direct update without undo/redo
          await updateService.updatePropertyValue(fileId, elementPath, newValue);
        }

        setState({
          isUpdating: false,
          error: null,
          lastUpdate: new Date(),
        });

        if (showToast) {
          toast({
            title: 'Property updated',
            description: `Successfully updated ${element.idShort || 'property'}`,
          });
        }

        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Update failed');
        setState((prev) => ({
          ...prev,
          isUpdating: false,
          error: err,
        }));

        if (showToast) {
          toast({
            title: 'Update failed',
            description: err.message,
            variant: 'destructive',
          });
        }

        if (onError) {
          onError(err);
        }

        throw err;
      }
    },
    [fileId, elementPath, useUndoRedo, showToast, onSuccess, onError]
  );

  /**
   * Update a multi-language property with undo/redo support
   */
  const updateMultiLanguageProperty = useCallback(
    async (element: SubmodelElement, newValue: LangStringTextType[]) => {
      setState((prev) => ({ ...prev, isUpdating: true, error: null }));

      try {
        const oldValue = ('value' in element ? element.value : []) as LangStringTextType[];

        if (useUndoRedo) {
          // Use command pattern for undo/redo
          const command = new UpdateMultiLanguageCommand(
            fileId,
            elementPath,
            oldValue,
            newValue,
            element.idShort || 'multi-language property'
          );

          await undoService.executeCommand(command);
        } else {
          // Direct update without undo/redo
          await updateService.updateMultiLanguageProperty(fileId, elementPath, newValue);
        }

        setState({
          isUpdating: false,
          error: null,
          lastUpdate: new Date(),
        });

        if (showToast) {
          toast({
            title: 'Multi-language property updated',
            description: `Successfully updated ${element.idShort || 'multi-language property'}`,
          });
        }

        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Update failed');
        setState((prev) => ({
          ...prev,
          isUpdating: false,
          error: err,
        }));

        if (showToast) {
          toast({
            title: 'Update failed',
            description: err.message,
            variant: 'destructive',
          });
        }

        if (onError) {
          onError(err);
        }

        throw err;
      }
    },
    [fileId, elementPath, useUndoRedo, showToast, onSuccess, onError]
  );

  /**
   * Update any property (auto-detects type)
   */
  const update = useCallback(
    async (element: SubmodelElement, newValue: any) => {
      if (element.modelType === 'MultiLanguageProperty') {
        return updateMultiLanguageProperty(element, newValue);
      } else {
        return updateProperty(element, newValue);
      }
    },
    [updateProperty, updateMultiLanguageProperty]
  );

  return {
    update,
    updateProperty,
    updateMultiLanguageProperty,
    state,
  };
}
