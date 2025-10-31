/**
 * Property Editor Factory
 * 
 * Factory component that routes to type-specific property editors.
 * Determines the appropriate editor based on value type and metadata.
 */

import * as React from 'react';
import type { PropertyEditorProps, PropertyEditorType } from './types';
import { StringEditor } from './StringEditor';
import { NumberEditor } from './NumberEditor';
import { BooleanEditor } from './BooleanEditor';
import { DateTimeEditor } from './DateTimeEditor';
import { PropertyEditorWrapper } from './PropertyEditorWrapper';

// ============================================================================
// Editor Registry
// ============================================================================

const EDITOR_MAP: Record<PropertyEditorType, React.ComponentType<PropertyEditorProps<any>>> = {
  string: StringEditor,
  number: NumberEditor,
  boolean: BooleanEditor,
  date: DateTimeEditor,
  datetime: DateTimeEditor,
  time: DateTimeEditor,
  multilang: StringEditor, // Will be replaced with MultiLanguageEditor
  reference: StringEditor, // Will be replaced with ReferenceEditor
  blob: StringEditor, // Will be replaced with BlobEditor
  file: StringEditor, // Will be replaced with FileEditor
  enum: StringEditor, // Will be replaced with EnumEditor
  textarea: StringEditor, // Will be replaced with TextAreaEditor
};

// ============================================================================
// Value Type to Editor Type Mapping
// ============================================================================

function getEditorType(valueType: string, metadata?: any): PropertyEditorType {
  // Handle XSD types
  if (valueType.startsWith('xs:')) {
    const xsdType = valueType.substring(3);
    
    switch (xsdType) {
      case 'boolean':
        return 'boolean';
      
      case 'int':
      case 'integer':
      case 'long':
      case 'short':
      case 'byte':
      case 'unsignedInt':
      case 'unsignedLong':
      case 'unsignedShort':
      case 'unsignedByte':
      case 'positiveInteger':
      case 'nonNegativeInteger':
      case 'negativeInteger':
      case 'nonPositiveInteger':
      case 'float':
      case 'double':
      case 'decimal':
        return 'number';
      
      case 'date':
        return 'date';
      
      case 'dateTime':
        return 'datetime';
      
      case 'time':
        return 'time';
      
      case 'string':
      default:
        return 'string';
    }
  }

  // Handle model types
  switch (valueType) {
    case 'MultiLanguageProperty':
      return 'multilang';
    
    case 'Reference':
    case 'ReferenceElement':
      return 'reference';
    
    case 'Blob':
      return 'blob';
    
    case 'File':
      return 'file';
    
    default:
      // Check for enum constraints
      if (metadata?.constraints?.some((c: any) => c.type === 'enum')) {
        return 'enum';
      }
      
      return 'string';
  }
}

// ============================================================================
// Factory Component
// ============================================================================

export interface PropertyEditorFactoryProps extends Omit<PropertyEditorProps, 'value' | 'onChange'> {
  value: any;
  onChange: (value: any) => void;
  valueType?: string;
  label?: string;
  helpText?: string;
  required?: boolean;
}

export function PropertyEditorFactory({
  value,
  onChange,
  valueType = 'xs:string',
  metadata,
  label,
  helpText,
  required,
  validation,
  disabled,
  placeholder,
  className,
  autoFocus,
  onBlur,
}: PropertyEditorFactoryProps) {
  // Determine editor type
  const editorType = getEditorType(valueType, metadata);
  
  // Get editor component
  const EditorComponent = EDITOR_MAP[editorType];
  
  if (!EditorComponent) {
    console.warn(`No editor found for type: ${editorType}`);
    return (
      <PropertyEditorWrapper
        label={label}
        helpText={helpText}
        validation={validation}
        required={required}
        className={className}
      >
        <div className="text-sm text-muted-foreground">
          No editor available for type: {valueType}
        </div>
      </PropertyEditorWrapper>
    );
  }

  return (
    <PropertyEditorWrapper
      label={label}
      helpText={helpText}
      validation={validation}
      required={required}
      className={className}
    >
      <EditorComponent
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        validation={validation}
        disabled={disabled}
        placeholder={placeholder}
        metadata={metadata}
        autoFocus={autoFocus}
      />
    </PropertyEditorWrapper>
  );
}
