/**
 * Property Editor Types
 * 
 * Shared types and interfaces for property editors
 */

import type { Reference, LangStringSet } from '../../../../shared/aas-v3-types';

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationError {
  constraintId: string;
  message: string;
  path: string;
  suggestion?: string;
}

export interface ValidationWarning {
  constraintId: string;
  message: string;
  path: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// ============================================================================
// Property Metadata
// ============================================================================

export interface Constraint {
  type: 'min' | 'max' | 'pattern' | 'required' | 'enum';
  value: any;
  message?: string;
}

export interface PropertyMetadata {
  valueType: string;
  constraints?: Constraint[];
  semanticId?: Reference;
  description?: LangStringSet;
  category?: string;
  required?: boolean;
  readonly?: boolean;
}

// ============================================================================
// Editor Props
// ============================================================================

export interface PropertyEditorProps<T = any> {
  value: T;
  onChange: (value: T) => void;
  onBlur?: () => void;
  validation?: ValidationResult;
  disabled?: boolean;
  placeholder?: string;
  metadata?: PropertyMetadata;
  className?: string;
  autoFocus?: boolean;
}

// ============================================================================
// Editor Types
// ============================================================================

export type PropertyEditorType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'multilang'
  | 'reference'
  | 'blob'
  | 'file'
  | 'enum'
  | 'textarea';

// ============================================================================
// Editor Registry
// ============================================================================

export interface EditorDescriptor {
  type: PropertyEditorType;
  component: React.ComponentType<PropertyEditorProps<any>>;
  supportedValueTypes: string[];
}
