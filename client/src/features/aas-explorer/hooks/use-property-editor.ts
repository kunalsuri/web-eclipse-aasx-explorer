/**
 * Property Editor Hook
 * Manages edit state, validation, and save/cancel operations
 * Integrated with backend update service and undo/redo
 */

import { useState, useCallback, useEffect } from 'react';
import type { SubmodelElement } from '../../../../../shared';
import { usePropertyUpdate, type ElementPath } from './use-property-update';

export interface PropertyEditorState {
  isEditing: boolean;
  isDirty: boolean;
  editedValue: any;
  originalValue: any;
  validationErrors: string[];
  isSaving: boolean;
}

export interface UsePropertyEditorOptions {
  element: SubmodelElement | null;
  fileId?: string;
  elementPath?: ElementPath[];
  onSave?: (element: SubmodelElement, newValue: any) => Promise<void>;
  onCancel?: () => void;
  validateOnChange?: boolean;
  useBackend?: boolean;
}

export function usePropertyEditor({
  element,
  fileId,
  elementPath,
  onSave,
  onCancel,
  validateOnChange = true,
  useBackend = false,
}: UsePropertyEditorOptions) {
  const [state, setState] = useState<PropertyEditorState>({
    isEditing: false,
    isDirty: false,
    editedValue: null,
    originalValue: null,
    validationErrors: [],
    isSaving: false,
  });

  // Initialize backend integration if configured
  const backendUpdate = useBackend && fileId && elementPath
    ? usePropertyUpdate({
        fileId,
        elementPath,
        useUndoRedo: true,
      })
    : null;

  // Initialize edited value when element changes
  useEffect(() => {
    if (element && 'value' in element) {
      setState((prev) => ({
        ...prev,
        editedValue: element.value,
        originalValue: element.value,
        isDirty: false,
      }));
    }
  }, [element]);

  // Enter edit mode
  const startEditing = useCallback(() => {
    if (!element) {
      return;
    }

    setState((prev) => ({
      ...prev,
      isEditing: true,
      editedValue: prev.originalValue,
      isDirty: false,
      validationErrors: [],
    }));
  }, [element]);

  // Update edited value
  const updateValue = useCallback(
    (newValue: any) => {
      setState((prev) => {
        const isDirty = JSON.stringify(newValue) !== JSON.stringify(prev.originalValue);
        const validationErrors = validateOnChange ? validateValue(element, newValue) : [];

        return {
          ...prev,
          editedValue: newValue,
          isDirty,
          validationErrors,
        };
      });
    },
    [element, validateOnChange]
  );

  // Save changes
  const save = useCallback(async () => {
    if (!element || !state.isDirty) {
      return;
    }

    // Validate before saving
    const errors = validateValue(element, state.editedValue);
    if (errors.length > 0) {
      setState((prev) => ({ ...prev, validationErrors: errors }));
      return;
    }

    setState((prev) => ({ ...prev, isSaving: true }));

    try {
      // Use backend integration if available
      if (backendUpdate) {
        await backendUpdate.update(element, state.editedValue);
      } else if (onSave) {
        // Fall back to custom onSave handler
        await onSave(element, state.editedValue);
      }

      setState((prev) => ({
        ...prev,
        isEditing: false,
        isDirty: false,
        originalValue: prev.editedValue,
        isSaving: false,
        validationErrors: [],
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSaving: false,
        validationErrors: [error instanceof Error ? error.message : 'Save failed'],
      }));
    }
  }, [element, state.isDirty, state.editedValue, backendUpdate, onSave]);

  // Cancel editing
  const cancel = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isEditing: false,
      isDirty: false,
      editedValue: prev.originalValue,
      validationErrors: [],
    }));

    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  // Validate value based on element type
  function validateValue(element: SubmodelElement | null, value: any): string[] {
    if (!element) {
      return [];
    }

    const errors: string[] = [];

    // Type-specific validation
    if (element.modelType === 'Property' && 'valueType' in element) {
      const property = element as any;
      
      // Required field validation
      if (value === null || value === undefined || value === '') {
        // Value can be empty for optional properties
        return errors;
      }

      // Type validation
      switch (property.valueType) {
        case 'xs:boolean':
          if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
            errors.push('Value must be a boolean');
          }
          break;
        case 'xs:int':
        case 'xs:integer':
        case 'xs:long':
        case 'xs:short':
          // Check if value is empty string or NaN
          if (value === '' || isNaN(Number(value)) || !Number.isInteger(Number(value))) {
            errors.push('Value must be an integer');
          }
          break;
        case 'xs:double':
        case 'xs:float':
        case 'xs:decimal':
          if (value === '' || isNaN(Number(value))) {
            errors.push('Value must be a number');
          }
          break;
        case 'xs:date':
          if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            errors.push('Value must be a valid date (YYYY-MM-DD)');
          }
          break;
        case 'xs:dateTime':
          if (isNaN(Date.parse(value))) {
            errors.push('Value must be a valid date-time');
          }
          break;
      }
    }

    // Range validation
    if (element.modelType === 'Range' && 'valueType' in element) {
      const range = element as any;
      if (range.min !== undefined && range.max !== undefined) {
        const min = Number(range.min);
        const max = Number(range.max);
        if (min > max) {
          errors.push('Minimum value cannot be greater than maximum value');
        }
      }
    }

    return errors;
  }

  return {
    state,
    startEditing,
    updateValue,
    save,
    cancel,
    canSave: state.isDirty && state.validationErrors.length === 0 && !state.isSaving,
  };
}
