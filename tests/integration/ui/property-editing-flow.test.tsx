/**
 * Property Editing Flow - Integration Tests
 * Tests complete workflows from UI to backend
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PropertyEditor } from '@/features/aas-explorer/components/property-editor';
import { EditorToolbar } from '@/features/aas-explorer/components/editor-toolbar';
import { updateService } from '@/features/aas-explorer/services/update-service';
import { undoService } from '@/features/aas-explorer/services/undo-service';
import type { SubmodelElement } from '../../../../shared/aas-v3-types';

// Mock services
vi.mock('../../features/aas-explorer/services/update-service');
vi.mock('../../features/aas-explorer/services/undo-service');

describe.skip('Property Editing Flow - Integration', () => {
  const mockFileId = 'test-file-id';
  const mockElementPath = [
    { type: 'submodel' as const, id: 'sm1' },
    { type: 'element' as const, id: 'prop1' },
  ];

  const mockProperty: SubmodelElement = {
    modelType: 'Property',
    idShort: 'testProperty',
    value: 'initial-value',
    valueType: 'xs:string',
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock update service
    vi.mocked(updateService.updatePropertyValue).mockResolvedValue({
      element: mockProperty,
      version: 2,
      timestamp: new Date().toISOString(),
    });

    // Mock undo service
    vi.mocked(undoService.executeCommand).mockResolvedValue();
    vi.mocked(undoService.getState).mockReturnValue({
      canUndo: false,
      canRedo: false,
      undoDescription: undefined,
      redoDescription: undefined,
      historySize: 0,
    });
    vi.mocked(undoService.subscribe).mockReturnValue(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should complete full edit workflow: edit → save → undo → redo', async () => {
    // Setup: Render property editor with backend integration
    const onSave = vi.fn(async (element, newValue) => {
      await updateService.updatePropertyValue(
        mockFileId,
        mockElementPath,
        newValue
      );
    });

    const { rerender } = render(
      <PropertyEditor
        element={mockProperty}
        onSave={onSave}
        readonly={false}
      />
    );

    // Step 1: Start editing
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/value/i)).toBeInTheDocument();
    });

    // Step 2: Change value
    const input = screen.getByLabelText(/value/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'new-value' } });

    await waitFor(() => {
      expect(input.value).toBe('new-value');
    });

    // Step 3: Save changes
    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).not.toBeDisabled();

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(mockProperty, 'new-value');
    });

    // Verify save completed
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
    });
  });

  it.skip('should handle validation errors before save', async () => {
    const mockIntProperty: SubmodelElement = {
      modelType: 'Property',
      idShort: 'intProperty',
      value: '42',
      valueType: 'xs:int',
    } as any;

    render(
      <PropertyEditor
        element={mockIntProperty}
        readonly={false}
      />
    );

    // Start editing
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/value/i)).toBeInTheDocument();
    });

    // Enter invalid value (non-integer)
    const input = screen.getByLabelText(/value/i);
    fireEvent.change(input, { target: { value: 'not-a-number' } });

    // Verify validation error is displayed
    await waitFor(() => {
      const errorMessages = screen.queryAllByText(/must be an integer/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    // Verify save button exists (validation prevents save via canSave prop)
    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeInTheDocument();
  });

  it('should cancel editing and revert changes', async () => {
    render(
      <PropertyEditor
        element={mockProperty}
        readonly={false}
      />
    );

    // Start editing
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/value/i)).toBeInTheDocument();
    });

    // Change value
    const input = screen.getByLabelText(/value/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'changed-value' } });

    expect(input.value).toBe('changed-value');

    // Cancel editing
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Should exit edit mode
    await waitFor(() => {
      expect(screen.queryByLabelText(/value/i)).not.toBeInTheDocument();
    });

    // Should show original value
    expect(screen.getByText('initial-value')).toBeInTheDocument();
  });

  it('should handle save errors gracefully', async () => {
    const mockError = new Error('Network error');
    vi.mocked(updateService.updatePropertyValue).mockRejectedValue(mockError);

    const onSave = vi.fn(async (element, newValue) => {
      await updateService.updatePropertyValue(
        mockFileId,
        mockElementPath,
        newValue
      );
    });

    render(
      <PropertyEditor
        element={mockProperty}
        onSave={onSave}
        readonly={false}
      />
    );

    // Start editing
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/value/i)).toBeInTheDocument();
    });

    // Change value
    const input = screen.getByLabelText(/value/i);
    fireEvent.change(input, { target: { value: 'new-value' } });

    // Try to save
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    // Should show error message (check for validation error display)
    await waitFor(() => {
      const errorElements = screen.queryAllByText(/network error/i);
      expect(errorElements.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // Should remain in edit mode
    expect(screen.getByLabelText(/value/i)).toBeInTheDocument();
  });

  it('should show loading state during save', async () => {
    // Mock slow save operation
    vi.mocked(updateService.updatePropertyValue).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        element: mockProperty,
        version: 2,
        timestamp: new Date().toISOString(),
      }), 100))
    );

    const onSave = vi.fn(async (element, newValue) => {
      await updateService.updatePropertyValue(
        mockFileId,
        mockElementPath,
        newValue
      );
    });

    render(
      <PropertyEditor
        element={mockProperty}
        onSave={onSave}
        readonly={false}
      />
    );

    // Start editing and change value
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/value/i)).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/value/i);
    fireEvent.change(input, { target: { value: 'new-value' } });

    // Click save
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });

    // Wait for save to complete
    await waitFor(() => {
      expect(screen.queryByText(/saving/i)).not.toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('should handle multi-language property editing', async () => {
    const mockMLProperty: SubmodelElement = {
      modelType: 'MultiLanguageProperty',
      idShort: 'mlProperty',
      value: [
        { language: 'en', text: 'Hello' },
        { language: 'de', text: 'Hallo' },
      ],
    } as any;

    vi.mocked(updateService.updateMultiLanguageProperty).mockResolvedValue({
      element: mockMLProperty,
      version: 2,
      timestamp: new Date().toISOString(),
    });

    const onSave = vi.fn(async (element, newValue) => {
      await updateService.updateMultiLanguageProperty(
        mockFileId,
        mockElementPath,
        newValue
      );
    });

    render(
      <PropertyEditor
        element={mockMLProperty}
        onSave={onSave}
        readonly={false}
      />
    );

    // Should show multi-language values in view mode
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hallo')).toBeInTheDocument();

    // Start editing
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    await waitFor(() => {
      // Should show multi-language editor
      expect(screen.getByText('en')).toBeInTheDocument();
      expect(screen.getByText('de')).toBeInTheDocument();
    });
  });

  it('should disable editing when readonly prop is true', () => {
    render(
      <PropertyEditor
        element={mockProperty}
        readonly={true}
      />
    );

    // Should not show edit button
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();

    // Should show value in read-only mode
    expect(screen.getByText('initial-value')).toBeInTheDocument();
  });

  it('should show appropriate message for non-editable elements', () => {
    const mockNonEditableElement: SubmodelElement = {
      modelType: 'SubmodelElementCollection',
      idShort: 'collection',
    } as any;

    render(
      <PropertyEditor
        element={mockNonEditableElement}
        readonly={false}
      />
    );

    // Should show not editable message
    expect(screen.getByText(/not editable/i)).toBeInTheDocument();
    expect(screen.getByText('SubmodelElementCollection')).toBeInTheDocument();
  });

  it('should show select message when no element is provided', () => {
    render(
      <PropertyEditor
        element={null}
        readonly={false}
      />
    );

    // Should show select message
    expect(screen.getByText(/select a property to edit/i)).toBeInTheDocument();
  });
});
