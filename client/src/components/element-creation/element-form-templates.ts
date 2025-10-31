/**
 * Element Creation Form Templates
 * 
 * Defines form templates for all 14 SubmodelElement types.
 * Each template includes fields, validation rules, and default values.
 */

export type SubmodelElementType =
  | 'Property'
  | 'MultiLanguageProperty'
  | 'Range'
  | 'ReferenceElement'
  | 'Blob'
  | 'File'
  | 'SubmodelElementCollection'
  | 'SubmodelElementList'
  | 'Entity'
  | 'RelationshipElement'
  | 'AnnotatedRelationshipElement'
  | 'Operation'
  | 'Capability'
  | 'BasicEventElement';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'reference' | 'multilang' | 'boolean';
  required: boolean;
  defaultValue?: any;
  options?: Array<{ value: string; label: string }>;
  validation?: FieldValidation;
  helpText?: string;
}

export interface FieldValidation {
  pattern?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  custom?: (value: any) => string | null;
}

export interface ElementFormTemplate {
  elementType: SubmodelElementType;
  displayName: string;
  description: string;
  icon?: string;
  fields: FormField[];
  defaults: Record<string, any>;
}

// ============================================================================
// Common Fields
// ============================================================================

const commonFields: FormField[] = [
  {
    name: 'idShort',
    label: 'ID Short',
    type: 'text',
    required: true,
    helpText: 'Short identifier for the element',
    validation: {
      pattern: '^[a-zA-Z][a-zA-Z0-9_]*$',
      minLength: 1,
      maxLength: 128,
    },
  },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    required: false,
    options: [
      { value: 'CONSTANT', label: 'Constant' },
      { value: 'PARAMETER', label: 'Parameter' },
      { value: 'VARIABLE', label: 'Variable' },
    ],
    helpText: 'Element category',
  },
  {
    name: 'description',
    label: 'Description',
    type: 'multilang',
    required: false,
    helpText: 'Detailed description in multiple languages',
  },
  {
    name: 'semanticId',
    label: 'Semantic ID',
    type: 'reference',
    required: false,
    helpText: 'Reference to semantic definition',
  },
];

// ============================================================================
// Form Templates
// ============================================================================

export const ELEMENT_FORM_TEMPLATES: Record<SubmodelElementType, ElementFormTemplate> = {
  Property: {
    elementType: 'Property',
    displayName: 'Property',
    description: 'A single data property with a value and type',
    fields: [
      ...commonFields,
      {
        name: 'valueType',
        label: 'Value Type',
        type: 'select',
        required: true,
        options: [
          { value: 'xs:string', label: 'String' },
          { value: 'xs:int', label: 'Integer' },
          { value: 'xs:double', label: 'Double' },
          { value: 'xs:boolean', label: 'Boolean' },
          { value: 'xs:date', label: 'Date' },
          { value: 'xs:dateTime', label: 'DateTime' },
        ],
        defaultValue: 'xs:string',
        helpText: 'Data type of the property value',
      },
      {
        name: 'value',
        label: 'Value',
        type: 'text',
        required: false,
        helpText: 'Initial value for the property',
      },
    ],
    defaults: {
      modelType: 'Property',
      valueType: 'xs:string',
      value: '',
    },
  },

  MultiLanguageProperty: {
    elementType: 'MultiLanguageProperty',
    displayName: 'Multi-Language Property',
    description: 'A property with values in multiple languages',
    fields: [
      ...commonFields,
      {
        name: 'value',
        label: 'Values',
        type: 'multilang',
        required: false,
        helpText: 'Property values in different languages',
      },
    ],
    defaults: {
      modelType: 'MultiLanguageProperty',
      value: {},
    },
  },

  Range: {
    elementType: 'Range',
    displayName: 'Range',
    description: 'A range with minimum and maximum values',
    fields: [
      ...commonFields,
      {
        name: 'valueType',
        label: 'Value Type',
        type: 'select',
        required: true,
        options: [
          { value: 'xs:int', label: 'Integer' },
          { value: 'xs:double', label: 'Double' },
          { value: 'xs:float', label: 'Float' },
        ],
        defaultValue: 'xs:double',
        helpText: 'Data type for min/max values',
      },
      {
        name: 'min',
        label: 'Minimum',
        type: 'number',
        required: false,
        helpText: 'Minimum value of the range',
      },
      {
        name: 'max',
        label: 'Maximum',
        type: 'number',
        required: false,
        helpText: 'Maximum value of the range',
      },
    ],
    defaults: {
      modelType: 'Range',
      valueType: 'xs:double',
    },
  },

  ReferenceElement: {
    elementType: 'ReferenceElement',
    displayName: 'Reference Element',
    description: 'A reference to another element',
    fields: [
      ...commonFields,
      {
        name: 'value',
        label: 'Reference',
        type: 'reference',
        required: false,
        helpText: 'Reference to target element',
      },
    ],
    defaults: {
      modelType: 'ReferenceElement',
      value: null,
    },
  },

  Blob: {
    elementType: 'Blob',
    displayName: 'Blob',
    description: 'Binary data stored inline (Base64 encoded)',
    fields: [
      ...commonFields,
      {
        name: 'contentType',
        label: 'Content Type',
        type: 'text',
        required: true,
        defaultValue: 'application/octet-stream',
        helpText: 'MIME type of the content',
      },
    ],
    defaults: {
      modelType: 'Blob',
      contentType: 'application/octet-stream',
      value: '',
    },
  },

  File: {
    elementType: 'File',
    displayName: 'File',
    description: 'Reference to an external file',
    fields: [
      ...commonFields,
      {
        name: 'contentType',
        label: 'Content Type',
        type: 'text',
        required: true,
        defaultValue: 'application/octet-stream',
        helpText: 'MIME type of the file',
      },
      {
        name: 'value',
        label: 'File Path',
        type: 'text',
        required: false,
        helpText: 'Path to the file',
      },
    ],
    defaults: {
      modelType: 'File',
      contentType: 'application/octet-stream',
      value: '',
    },
  },

  SubmodelElementCollection: {
    elementType: 'SubmodelElementCollection',
    displayName: 'Collection',
    description: 'A collection of submodel elements',
    fields: [
      ...commonFields,
    ],
    defaults: {
      modelType: 'SubmodelElementCollection',
      value: [],
    },
  },

  SubmodelElementList: {
    elementType: 'SubmodelElementList',
    displayName: 'List',
    description: 'An ordered list of elements of the same type',
    fields: [
      ...commonFields,
      {
        name: 'typeValueListElement',
        label: 'Element Type',
        type: 'select',
        required: true,
        options: [
          { value: 'Property', label: 'Property' },
          { value: 'MultiLanguageProperty', label: 'Multi-Language Property' },
          { value: 'Range', label: 'Range' },
          { value: 'ReferenceElement', label: 'Reference Element' },
          { value: 'Blob', label: 'Blob' },
          { value: 'File', label: 'File' },
        ],
        defaultValue: 'Property',
        helpText: 'Type of elements in the list',
      },
      {
        name: 'orderRelevant',
        label: 'Order Relevant',
        type: 'boolean',
        required: false,
        defaultValue: true,
        helpText: 'Whether the order of elements matters',
      },
    ],
    defaults: {
      modelType: 'SubmodelElementList',
      typeValueListElement: 'Property',
      orderRelevant: true,
      value: [],
    },
  },

  Entity: {
    elementType: 'Entity',
    displayName: 'Entity',
    description: 'An entity with statements',
    fields: [
      ...commonFields,
      {
        name: 'entityType',
        label: 'Entity Type',
        type: 'select',
        required: true,
        options: [
          { value: 'CoManagedEntity', label: 'Co-Managed Entity' },
          { value: 'SelfManagedEntity', label: 'Self-Managed Entity' },
        ],
        defaultValue: 'CoManagedEntity',
        helpText: 'Type of entity',
      },
      {
        name: 'globalAssetId',
        label: 'Global Asset ID',
        type: 'text',
        required: false,
        helpText: 'Global identifier for the asset',
      },
    ],
    defaults: {
      modelType: 'Entity',
      entityType: 'CoManagedEntity',
      statements: [],
    },
  },

  RelationshipElement: {
    elementType: 'RelationshipElement',
    displayName: 'Relationship',
    description: 'A relationship between two elements',
    fields: [
      ...commonFields,
      {
        name: 'first',
        label: 'First Element',
        type: 'reference',
        required: true,
        helpText: 'Reference to the first element',
      },
      {
        name: 'second',
        label: 'Second Element',
        type: 'reference',
        required: true,
        helpText: 'Reference to the second element',
      },
    ],
    defaults: {
      modelType: 'RelationshipElement',
      first: null,
      second: null,
    },
  },

  AnnotatedRelationshipElement: {
    elementType: 'AnnotatedRelationshipElement',
    displayName: 'Annotated Relationship',
    description: 'A relationship with additional annotations',
    fields: [
      ...commonFields,
      {
        name: 'first',
        label: 'First Element',
        type: 'reference',
        required: true,
        helpText: 'Reference to the first element',
      },
      {
        name: 'second',
        label: 'Second Element',
        type: 'reference',
        required: true,
        helpText: 'Reference to the second element',
      },
    ],
    defaults: {
      modelType: 'AnnotatedRelationshipElement',
      first: null,
      second: null,
      annotations: [],
    },
  },

  Operation: {
    elementType: 'Operation',
    displayName: 'Operation',
    description: 'An operation with input and output variables',
    fields: [
      ...commonFields,
    ],
    defaults: {
      modelType: 'Operation',
      inputVariables: [],
      outputVariables: [],
      inoutputVariables: [],
    },
  },

  Capability: {
    elementType: 'Capability',
    displayName: 'Capability',
    description: 'A capability of an asset',
    fields: [
      ...commonFields,
    ],
    defaults: {
      modelType: 'Capability',
    },
  },

  BasicEventElement: {
    elementType: 'BasicEventElement',
    displayName: 'Basic Event',
    description: 'A basic event element',
    fields: [
      ...commonFields,
      {
        name: 'observed',
        label: 'Observed Element',
        type: 'reference',
        required: true,
        helpText: 'Reference to the observed element',
      },
      {
        name: 'direction',
        label: 'Direction',
        type: 'select',
        required: true,
        options: [
          { value: 'input', label: 'Input' },
          { value: 'output', label: 'Output' },
        ],
        defaultValue: 'output',
        helpText: 'Direction of the event',
      },
      {
        name: 'state',
        label: 'State',
        type: 'select',
        required: true,
        options: [
          { value: 'on', label: 'On' },
          { value: 'off', label: 'Off' },
        ],
        defaultValue: 'on',
        helpText: 'State of the event',
      },
    ],
    defaults: {
      modelType: 'BasicEventElement',
      observed: null,
      direction: 'output',
      state: 'on',
    },
  },
};

/**
 * Get form template for element type
 */
export function getFormTemplate(elementType: SubmodelElementType): ElementFormTemplate {
  return ELEMENT_FORM_TEMPLATES[elementType];
}

/**
 * Get all available element types
 */
export function getAvailableElementTypes(): SubmodelElementType[] {
  return Object.keys(ELEMENT_FORM_TEMPLATES) as SubmodelElementType[];
}

/**
 * Validate form field value
 */
export function validateField(field: FormField, value: any): string | null {
  // Required check
  if (field.required && (value === null || value === undefined || value === '')) {
    return `${field.label} is required`;
  }

  // Skip validation if empty and not required
  if (!field.required && (value === null || value === undefined || value === '')) {
    return null;
  }

  // Type-specific validation
  if (field.type === 'text' && field.validation) {
    const validation = field.validation;

    // Pattern validation
    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return `${field.label} format is invalid`;
      }
    }

    // Length validation
    if (validation.minLength && typeof value === 'string' && value.length < validation.minLength) {
      return `${field.label} must be at least ${validation.minLength} characters`;
    }
    if (validation.maxLength && typeof value === 'string' && value.length > validation.maxLength) {
      return `${field.label} must be at most ${validation.maxLength} characters`;
    }
  }

  // Number validation
  if (field.type === 'number' && field.validation) {
    const validation = field.validation;
    const numValue = Number(value);

    if (validation.min !== undefined && numValue < validation.min) {
      return `${field.label} must be at least ${validation.min}`;
    }
    if (validation.max !== undefined && numValue > validation.max) {
      return `${field.label} must be at most ${validation.max}`;
    }
  }

  // Custom validation
  if (field.validation?.custom) {
    return field.validation.custom(value);
  }

  return null;
}
