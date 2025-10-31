import type {
  Environment,
  AssetAdministrationShell,
  Submodel,
  Property,
  SubmodelElementCollection,
} from '@shared/aas-v3-types';
import {
  AssetKind,
  DataTypeDefXsd,
  AasSubmodelElements,
  ModelingKind,
} from '@shared/aas-v3-types';
import { createBasicAAS, createBasicSubmodel, createSubmodelReference } from './aas-environments';
import { createProperty, createCollection } from './elements';

/**
 * Valid environment with proper structure
 */
export const validEnvironment: Environment = {
  assetAdministrationShells: [
    {
      id: 'https://example.com/aas/valid',
      idShort: 'ValidAAS',
      assetInformation: {
        assetKind: AssetKind.Instance,
        globalAssetId: 'https://example.com/asset/1',
      },
    },
  ],
  submodels: [
    {
      id: 'https://example.com/sm/valid',
      idShort: 'ValidSubmodel',
      kind: ModelingKind.Instance,
      submodelElements: [],
    },
  ],
  conceptDescriptions: [],
};

/**
 * Environment with missing required ID
 */
export const environmentWithMissingId: Environment = {
  assetAdministrationShells: [
    {
      id: '', // Invalid: empty ID
      idShort: 'InvalidAAS',
      assetInformation: {
        assetKind: AssetKind.Instance,
      },
    },
  ],
  submodels: [],
  conceptDescriptions: [],
};

/**
 * Environment with duplicate idShort
 */
export const environmentWithDuplicateIdShort: Environment = {
  assetAdministrationShells: [],
  submodels: [
    {
      id: 'https://example.com/sm/1',
      idShort: 'DuplicateIdShort',
      kind: ModelingKind.Instance,
      submodelElements: [
        createProperty('Prop1', 'value1'),
        createProperty('Prop1', 'value2'), // Duplicate idShort
      ],
    },
  ],
  conceptDescriptions: [],
};

/**
 * Environment with invalid reference
 */
export const environmentWithInvalidReference: Environment = {
  assetAdministrationShells: [
    {
      id: 'https://example.com/aas/1',
      idShort: 'AASWithInvalidRef',
      assetInformation: {
        assetKind: AssetKind.Instance,
      },
      submodels: [
        createSubmodelReference('https://example.com/sm/nonexistent'), // Reference to non-existent submodel
      ],
    },
  ],
  submodels: [],
  conceptDescriptions: [],
};

/**
 * Property with invalid value type
 */
export const propertyWithInvalidValueType: Property = {
  modelType: AasSubmodelElements.Property,
  idShort: 'InvalidProperty',
  valueType: DataTypeDefXsd.Int,
  value: 'not-a-number', // Invalid: string value for int type
};

/**
 * Property with valid integer value
 */
export const propertyWithValidIntValue: Property = {
  modelType: AasSubmodelElements.Property,
  idShort: 'ValidIntProperty',
  valueType: DataTypeDefXsd.Int,
  value: '42',
};

/**
 * Property with valid boolean value
 */
export const propertyWithValidBooleanValue: Property = {
  modelType: AasSubmodelElements.Property,
  idShort: 'ValidBoolProperty',
  valueType: DataTypeDefXsd.Boolean,
  value: 'true',
};

/**
 * Property with invalid boolean value
 */
export const propertyWithInvalidBooleanValue: Property = {
  modelType: AasSubmodelElements.Property,
  idShort: 'InvalidBoolProperty',
  valueType: DataTypeDefXsd.Boolean,
  value: 'yes', // Invalid: not 'true' or 'false'
};

/**
 * Collection with missing idShort
 */
export const collectionWithMissingIdShort: SubmodelElementCollection = {
  modelType: AasSubmodelElements.SubmodelElementCollection,
  // Missing idShort
  value: [createProperty('Prop1', 'value1')],
};

/**
 * Valid collection with proper structure
 */
export const validCollection: SubmodelElementCollection = {
  modelType: AasSubmodelElements.SubmodelElementCollection,
  idShort: 'ValidCollection',
  value: [
    createProperty('Prop1', 'value1'),
    createProperty('Prop2', 'value2'),
  ],
};

/**
 * Submodel with cardinality violation (too many elements)
 */
export const createSubmodelWithCardinalityViolation = (): Submodel => {
  const submodel = createBasicSubmodel('https://example.com/sm/cardinality');
  // This would be used in tests that check specific cardinality constraints
  submodel.submodelElements = [
    createProperty('Prop1', 'value1'),
    createProperty('Prop2', 'value2'),
    createProperty('Prop3', 'value3'),
    // Add more elements than allowed by constraint
  ];
  return submodel;
};

/**
 * Environment for testing semantic validation
 */
export const environmentForSemanticValidation: Environment = {
  assetAdministrationShells: [
    {
      id: 'https://example.com/aas/semantic',
      idShort: 'SemanticAAS',
      assetInformation: {
        assetKind: AssetKind.Instance,
      },
    },
  ],
  submodels: [
    {
      id: 'https://example.com/sm/semantic',
      idShort: 'SemanticSubmodel',
      kind: ModelingKind.Instance,
      semanticId: {
        type: 1, // ReferenceTypes.ExternalReference
        keys: [
          {
            type: 8, // KeyTypes.GlobalReference
            value: 'https://example.com/semantic/id',
          },
        ],
      },
      submodelElements: [],
    },
  ],
  conceptDescriptions: [],
};

/**
 * Create test cases for datatype validation
 */
export const datatypeValidationCases = [
  {
    name: 'Valid integer',
    valueType: DataTypeDefXsd.Int,
    value: '42',
    valid: true,
  },
  {
    name: 'Invalid integer',
    valueType: DataTypeDefXsd.Int,
    value: 'abc',
    valid: false,
  },
  {
    name: 'Valid boolean true',
    valueType: DataTypeDefXsd.Boolean,
    value: 'true',
    valid: true,
  },
  {
    name: 'Valid boolean false',
    valueType: DataTypeDefXsd.Boolean,
    value: 'false',
    valid: true,
  },
  {
    name: 'Invalid boolean',
    valueType: DataTypeDefXsd.Boolean,
    value: 'yes',
    valid: false,
  },
  {
    name: 'Valid double',
    valueType: DataTypeDefXsd.Double,
    value: '3.14159',
    valid: true,
  },
  {
    name: 'Invalid double',
    valueType: DataTypeDefXsd.Double,
    value: 'not-a-number',
    valid: false,
  },
  {
    name: 'Valid string',
    valueType: DataTypeDefXsd.String,
    value: 'any text',
    valid: true,
  },
  {
    name: 'Valid date',
    valueType: DataTypeDefXsd.Date,
    value: '2024-01-15',
    valid: true,
  },
  {
    name: 'Invalid date',
    valueType: DataTypeDefXsd.Date,
    value: '2024-13-45',
    valid: false,
  },
];

/**
 * Create test cases for cardinality validation
 */
export const cardinalityValidationCases = {
  exactlyOne: {
    min: 1,
    max: 1,
    validCounts: [1],
    invalidCounts: [0, 2, 3],
  },
  zeroOrOne: {
    min: 0,
    max: 1,
    validCounts: [0, 1],
    invalidCounts: [2, 3],
  },
  oneOrMore: {
    min: 1,
    max: Infinity,
    validCounts: [1, 2, 5, 10],
    invalidCounts: [0],
  },
  zeroOrMore: {
    min: 0,
    max: Infinity,
    validCounts: [0, 1, 2, 5, 10],
    invalidCounts: [],
  },
};
