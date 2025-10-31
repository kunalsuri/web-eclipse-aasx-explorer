/**
 * PropertyEditor Component Tests
 * Tests for edit mode toggle, validation, and save/cancel operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PropertyEditor } from '../property-editor';
import type { Property } from '../../../../../../shared';

describe('PropertyEditor', () => {
  const mockProperty: Property = {
    modelType: 'Property',
    idShort: 'TestProperty',
    valueType: 'xs:string',
    value: 'Initial Value',
  };

  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty state when no element is provided', () => {
    render(<PropertyEditor element={null} />);
    expect(screen.getByText('Select a property to edit')).toBeInTheDocument();
  });

  it('should render property in view mode by default', () => {
    render(<PropertyEditor element={mockProperty} />);
    expect(screen.getByText('Edit Property')).toBeInTheDocument();
    expect(screen.getByText('TestProperty')).toBeInTheDocument();
    expect(screen.getByText('Initial Value')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('should enter edit mode when Edit button is clicked', () => {
    render(<PropertyEditor element={mockProperty} />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Value')).toBeInTheDocument();
  });

  it('should update value when input changes', () => {
    render(<PropertyEditor element={mockProperty} />);
    
    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    // Change value
    const input = screen.getByLabelText('Value') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'New Value' } });

    expect(input.value).toBe('New Value');
    expect(screen.getByText('Modified')).toBeInTheDocument();
  });

  it('should call onSave when Save button is clicked', async () => {
    mockOnSave.mockResolvedValue(undefined);
    render(<PropertyEditor element={mockProperty} onSave={mockOnSave} />);
    
    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    // Change value
    const input = screen.getByLabelText('Value');
    fireEvent.change(input, { target: { value: 'New Value' } });

    // Save
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(mockProperty, 'New Value');
    });
  });

  it('should call onCancel when Cancel button is clicked', () => {
    render(<PropertyEditor element={mockProperty} onCancel={mockOnCancel} />);
    
    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    // Change value
    const input = screen.getByLabelText('Value');
    fireEvent.change(input, { target: { value: 'New Value' } });

    // Cancel
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('should show validation errors for invalid input', () => {
    const numberProperty: Property = {
      modelType: 'Property',
      idShort: 'NumberProperty',
      valueType: 'xs:int',
      value: '42',
    };

    render(<PropertyEditor element={numberProperty} />);
    
    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    // Enter invalid value (decimal for integer type)
    const input = screen.getByLabelText('Value');
    fireEvent.change(input, { target: { value: '3.14' } });

    // Error message appears in multiple places (inline and alert)
    const errorMessages = screen.getAllByText('Value must be an integer');
    expect(errorMessages.length).toBeGreaterThan(0);
  });

  it('should disable Save button when there are validation errors', () => {
    const numberProperty: Property = {
      modelType: 'Property',
      idShort: 'NumberProperty',
      valueType: 'xs:int',
      value: '42',
    };

    render(<PropertyEditor element={numberProperty} />);
    
    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    // Enter invalid value (decimal for integer type)
    const input = screen.getByLabelText('Value');
    fireEvent.change(input, { target: { value: '3.14' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();
  });

  it('should not show Edit button in readonly mode', () => {
    render(<PropertyEditor element={mockProperty} readonly={true} />);
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
  });

  it('should show not editable message for non-Property elements', () => {
    const collection = {
      modelType: 'SubmodelElementCollection',
      idShort: 'TestCollection',
      value: [],
    };

    render(<PropertyEditor element={collection as any} />);
    expect(screen.getByText('This element type is not editable')).toBeInTheDocument();
  });
});
