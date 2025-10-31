/**
 * MultiLanguageEditor Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MultiLanguageEditor, validateLanguageCodes } from '../multi-language-editor';
import type { LangStringTextType } from '../../../../../../shared';

describe('MultiLanguageEditor', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty state when no languages are provided', () => {
    render(<MultiLanguageEditor value={[]} onChange={mockOnChange} />);
    expect(screen.getByText('No language entries yet')).toBeInTheDocument();
  });

  it('should display existing language entries', () => {
    const value: LangStringTextType[] = [
      { language: 'en', text: 'Hello' },
      { language: 'de', text: 'Hallo' },
    ];

    render(<MultiLanguageEditor value={value} onChange={mockOnChange} />);
    
    expect(screen.getByText('en')).toBeInTheDocument();
    expect(screen.getByText('de')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Hallo')).toBeInTheDocument();
  });

  it('should add a new language entry', () => {
    render(<MultiLanguageEditor value={[]} onChange={mockOnChange} />);
    
    // Click add button (default language is 'en')
    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    expect(mockOnChange).toHaveBeenCalledWith([
      { language: 'en', text: '' },
    ]);
  });

  it('should remove a language entry', () => {
    const value: LangStringTextType[] = [
      { language: 'en', text: 'Hello' },
      { language: 'de', text: 'Hallo' },
    ];

    render(<MultiLanguageEditor value={value} onChange={mockOnChange} />);
    
    // Find and click the first delete button
    const deleteButtons = screen.getAllByRole('button');
    const firstDeleteButton = deleteButtons.find(btn => 
      btn.querySelector('svg')?.classList.contains('lucide-trash-2')
    );
    
    if (firstDeleteButton) {
      fireEvent.click(firstDeleteButton);
      expect(mockOnChange).toHaveBeenCalled();
    }
  });

  it('should update text for a language', () => {
    const value: LangStringTextType[] = [
      { language: 'en', text: 'Hello' },
    ];

    render(<MultiLanguageEditor value={value} onChange={mockOnChange} />);
    
    const input = screen.getByDisplayValue('Hello');
    fireEvent.change(input, { target: { value: 'Hello World' } });

    expect(mockOnChange).toHaveBeenCalledWith([
      { language: 'en', text: 'Hello World' },
    ]);
  });

  it('should show language count badge', () => {
    const value: LangStringTextType[] = [
      { language: 'en', text: 'Hello' },
      { language: 'de', text: 'Hallo' },
    ];

    render(<MultiLanguageEditor value={value} onChange={mockOnChange} />);
    expect(screen.getByText('2 languages')).toBeInTheDocument();
  });

  it('should disable controls when disabled prop is true', () => {
    const value: LangStringTextType[] = [
      { language: 'en', text: 'Hello' },
    ];

    render(<MultiLanguageEditor value={value} onChange={mockOnChange} disabled={true} />);
    
    const input = screen.getByDisplayValue('Hello');
    expect(input).toBeDisabled();
  });

  it('should display validation errors', () => {
    render(
      <MultiLanguageEditor
        value={[]}
        onChange={mockOnChange}
        errors={['At least one language entry is required']}
      />
    );
    
    expect(screen.getByText('At least one language entry is required')).toBeInTheDocument();
  });
});

describe('validateLanguageCodes', () => {
  it('should return error for empty array', () => {
    const errors = validateLanguageCodes([]);
    expect(errors).toContain('At least one language entry is required');
  });

  it('should return error for duplicate language codes', () => {
    const value: LangStringTextType[] = [
      { language: 'en', text: 'Hello' },
      { language: 'en', text: 'Hi' },
    ];
    
    const errors = validateLanguageCodes(value);
    expect(errors.some(e => e.includes('Duplicate'))).toBe(true);
  });

  it('should return error for empty text', () => {
    const value: LangStringTextType[] = [
      { language: 'en', text: '' },
    ];
    
    const errors = validateLanguageCodes(value);
    expect(errors.some(e => e.includes('Empty text'))).toBe(true);
  });

  it('should return error for invalid language code format', () => {
    const value: LangStringTextType[] = [
      { language: 'invalid', text: 'Hello' },
    ];
    
    const errors = validateLanguageCodes(value);
    expect(errors.some(e => e.includes('Invalid language codes'))).toBe(true);
  });

  it('should return no errors for valid entries', () => {
    const value: LangStringTextType[] = [
      { language: 'en', text: 'Hello' },
      { language: 'de', text: 'Hallo' },
    ];
    
    const errors = validateLanguageCodes(value);
    expect(errors.length).toBe(0);
  });

  it('should accept language codes with region (e.g., en-US)', () => {
    const value: LangStringTextType[] = [
      { language: 'en-US', text: 'Hello' },
    ];
    
    const errors = validateLanguageCodes(value);
    expect(errors.length).toBe(0);
  });
});
