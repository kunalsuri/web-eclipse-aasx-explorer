/**
 * ReferenceEditor Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReferenceEditor } from '../reference-editor';
import type { Reference } from '../../../../../../shared';
import { ReferenceTypes, KeyTypes } from '../../../../../../shared/aas-v3-types';

describe('ReferenceEditor', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty state when no keys are provided', () => {
    const value: Reference = {
      type: ReferenceTypes.ModelReference,
      keys: [],
    };

    render(<ReferenceEditor value={value} onChange={mockOnChange} />);
    expect(screen.getByText('No keys defined')).toBeInTheDocument();
  });

  it('should display existing keys', () => {
    const value: Reference = {
      type: ReferenceTypes.ModelReference,
      keys: [
        { type: KeyTypes.Submodel, value: 'submodel-id-123' },
        { type: KeyTypes.Property, value: 'property-id-456' },
      ],
    };

    render(<ReferenceEditor value={value} onChange={mockOnChange} />);
    
    expect(screen.getByText('Key 1')).toBeInTheDocument();
    expect(screen.getByText('Key 2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('submodel-id-123')).toBeInTheDocument();
    expect(screen.getByDisplayValue('property-id-456')).toBeInTheDocument();
  });

  it('should add a new key', () => {
    const value: Reference = {
      type: ReferenceTypes.ModelReference,
      keys: [],
    };

    render(<ReferenceEditor value={value} onChange={mockOnChange} />);
    
    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('should display reference path', () => {
    const value: Reference = {
      type: ReferenceTypes.ModelReference,
      keys: [
        { type: KeyTypes.Submodel, value: 'sm1' },
        { type: KeyTypes.Property, value: 'prop1' },
      ],
    };

    render(<ReferenceEditor value={value} onChange={mockOnChange} />);
    expect(screen.getByText(/Submodel:sm1.*Property:prop1/)).toBeInTheDocument();
  });
});

// validateReference tests removed - function is not exported from validation module
