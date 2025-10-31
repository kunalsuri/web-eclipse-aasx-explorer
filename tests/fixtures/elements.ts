import type {
  Property,
  MultiLanguageProperty,
  Range,
  ReferenceElement,
  SubmodelElementCollection,
  SubmodelElementList,
  File,
  Blob,
  SubmodelElement,
  Reference,
  LangStringTextType,
  RelationshipElement,
  Entity,
} from '@shared/aas-v3-types';
import {
  AasSubmodelElements,
  DataTypeDefXsd,
  ReferenceTypes,
  KeyTypes,
  EntityType,
} from '@shared/aas-v3-types';

/**
 * Create a basic property
 */
export const createProperty = (
  idShort: string = 'TestProperty',
  value: string = 'test-value',
  valueType: DataTypeDefXsd = DataTypeDefXsd.String
): Property => ({
  modelType: AasSubmodelElements.Property,
  idShort,
  valueType,
  value,
});

/**
 * Create a property with semantic ID
 */
export const createPropertyWithSemanticId = (
  idShort: string,
  value: string,
  semanticId: string,
  valueType: DataTypeDefXsd = DataTypeDefXsd.String
): Property => ({
  modelType: AasSubmodelElements.Property,
  idShort,
  valueType,
  value,
  semanticId: {
    type: ReferenceTypes.ExternalReference,
    keys: [
      {
        type: KeyTypes.GlobalReference,
        value: semanticId,
      },
    ],
  },
});

/**
 * Create a multi-language property
 */
export const createMultiLanguageProperty = (
  idShort: string = 'TestMLProperty',
  values: LangStringTextType[] = [
    { language: 'en', text: 'English text' },
    { language: 'de', text: 'Deutscher Text' },
  ]
): MultiLanguageProperty => ({
  modelType: AasSubmodelElements.MultiLanguageProperty,
  idShort,
  value: values,
});

/**
 * Create a range element
 */
export const createRange = (
  idShort: string = 'TestRange',
  min: string = '0',
  max: string = '100',
  valueType: DataTypeDefXsd = DataTypeDefXsd.Int
): Range => ({
  modelType: AasSubmodelElements.Range,
  idShort,
  valueType,
  min,
  max,
});

/**
 * Create a reference element
 */
export const createReferenceElement = (
  idShort: string = 'TestReference',
  targetId?: string
): ReferenceElement => {
  const element: ReferenceElement = {
    modelType: AasSubmodelElements.ReferenceElement,
    idShort,
  };

  if (targetId) {
    element.value = {
      type: ReferenceTypes.ModelReference,
      keys: [
        {
          type: KeyTypes.Submodel,
          value: targetId,
        },
      ],
    };
  }

  return element;
};

/**
 * Create a file element
 */
export const createFile = (
  idShort: string = 'TestFile',
  contentType: string = 'application/pdf',
  value?: string
): File => ({
  modelType: AasSubmodelElements.File,
  idShort,
  contentType,
  value,
});

/**
 * Create a blob element
 */
export const createBlob = (
  idShort: string = 'TestBlob',
  contentType: string = 'application/octet-stream',
  value?: string
): Blob => ({
  modelType: AasSubmodelElements.Blob,
  idShort,
  contentType,
  value,
});

/**
 * Create a submodel element collection
 */
export const createCollection = (
  idShort: string = 'TestCollection',
  elements: SubmodelElement[] = []
): SubmodelElementCollection => ({
  modelType: AasSubmodelElements.SubmodelElementCollection,
  idShort,
  value: elements,
});

/**
 * Create a submodel element list
 */
export const createSubmodelElementList = (
  idShort: string = 'TestList',
  typeValueListElement: AasSubmodelElements = AasSubmodelElements.Property,
  elements: SubmodelElement[] = []
): SubmodelElementList => ({
  modelType: AasSubmodelElements.SubmodelElementList,
  idShort,
  typeValueListElement,
  value: elements,
  orderRelevant: true,
});

/**
 * Create a relationship element
 */
export const createRelationshipElement = (
  idShort: string = 'TestRelationship',
  firstId: string = 'https://example.com/first',
  secondId: string = 'https://example.com/second'
): RelationshipElement => ({
  modelType: AasSubmodelElements.RelationshipElement,
  idShort,
  first: {
    type: ReferenceTypes.ModelReference,
    keys: [
      {
        type: KeyTypes.Property,
        value: firstId,
      },
    ],
  },
  second: {
    type: ReferenceTypes.ModelReference,
    keys: [
      {
        type: KeyTypes.Property,
        value: secondId,
      },
    ],
  },
});

/**
 * Create an entity element
 */
export const createEntity = (
  idShort: string = 'TestEntity',
  entityType: EntityType = EntityType.CoManagedEntity,
  statements: SubmodelElement[] = []
): Entity => ({
  modelType: AasSubmodelElements.Entity,
  idShort,
  entityType,
  statements,
});

/**
 * Create a set of properties
 */
export const createPropertySet = (count: number = 3): Property[] => {
  return Array.from({ length: count }, (_, i) =>
    createProperty(`Property${i}`, `value${i}`)
  );
};

/**
 * Create a nested collection structure
 */
export const createNestedCollection = (depth: number = 2): SubmodelElementCollection => {
  if (depth === 0) {
    return createCollection('LeafCollection', createPropertySet(3));
  }

  const childCollection = createNestedCollection(depth - 1);
  return createCollection(`Collection_Depth${depth}`, [
    ...createPropertySet(2),
    childCollection,
  ]);
};

/**
 * Create a collection with mixed element types
 */
export const createMixedCollection = (): SubmodelElementCollection => {
  return createCollection('MixedCollection', [
    createProperty('StringProp', 'test', DataTypeDefXsd.String),
    createProperty('IntProp', '42', DataTypeDefXsd.Int),
    createMultiLanguageProperty('MLProp'),
    createRange('RangeProp', '0', '100'),
    createFile('FileProp', 'application/pdf', '/path/to/file.pdf'),
  ]);
};

/**
 * Create a property list
 */
export const createPropertyList = (count: number = 5): SubmodelElementList => {
  const properties = createPropertySet(count);
  return createSubmodelElementList('PropertyList', AasSubmodelElements.Property, properties);
};
