/**
 * Dictionary Concept Transformation
 * Converts DictionaryConcept to AAS ConceptDescription
 * 
 * Based on: x-external-proj/src/AasxDictionaryImport/Iec61360Utils.cs
 */

import type { DictionaryConcept } from '../../../shared/dictionary-types';
import { createIdShort, DictionarySource } from '../../../shared/dictionary-types';
import type {
  ConceptDescription,
  Reference,
  EmbeddedDataSpecification,
  DataSpecificationIec61360,
  Key,
} from '../../../shared/aas-v3-types';
import {
  ReferenceTypes,
  KeyTypes,
} from '../../../shared/aas-v3-types';

/**
 * Transform DictionaryConcept to AAS ConceptDescription
 */
export function transformToConceptDescription(concept: DictionaryConcept): ConceptDescription {
  // Generate idShort from preferred name
  const preferredNameText = concept.preferredName[0]?.text || concept.id;
  const idShort = createIdShort(preferredNameText);

  // Create concept description
  const conceptDescription: ConceptDescription = {
    id: concept.id,
    idShort,
  };

  // Add embedded data specification (IEC 61360)
  conceptDescription.embeddedDataSpecifications = [
    createEmbeddedDataSpecification(concept),
  ];

  // Add isCaseOf reference
  conceptDescription.isCaseOf = [
    createGlobalReference(concept.id),
  ];

  return conceptDescription;
}

/**
 * Create embedded data specification for IEC 61360
 */
function createEmbeddedDataSpecification(concept: DictionaryConcept): EmbeddedDataSpecification {
  const dataSpecification: EmbeddedDataSpecification = {
    dataSpecification: createIec61360SpecificationReference(),
    dataSpecificationContent: createDataSpecificationContent(concept),
  };

  return dataSpecification;
}

/**
 * Create reference to IEC 61360 data specification template
 */
function createIec61360SpecificationReference(): Reference {
  return {
    type: ReferenceTypes.ExternalReference,
    keys: [{
      type: KeyTypes.GlobalReference,
      value: 'https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIec61360/3/0',
    }],
  };
}

/**
 * Create data specification content (IEC 61360)
 */
function createDataSpecificationContent(concept: DictionaryConcept): DataSpecificationIec61360 {
  const content: DataSpecificationIec61360 = {
    preferredName: concept.preferredName,
  };

  // Add optional fields
  if (concept.shortName && concept.shortName.length > 0) {
    content.shortName = concept.shortName;
  }

  if (concept.definition && concept.definition.length > 0) {
    content.definition = concept.definition;
  }

  if (concept.sourceOfDefinition) {
    content.sourceOfDefinition = concept.sourceOfDefinition;
  }

  if (concept.symbol) {
    content.symbol = concept.symbol;
  }

  if (concept.unit) {
    content.unit = concept.unit;
  }

  if (concept.unitId) {
    content.unitId = createGlobalReference(concept.unitId);
  }

  if (concept.dataType) {
    content.dataType = concept.dataType;
  }

  if (concept.valueFormat) {
    content.valueFormat = concept.valueFormat;
  }

  if (concept.valueList) {
    content.valueList = concept.valueList;
  }

  return content;
}

/**
 * Create a global reference
 */
function createGlobalReference(value: string): Reference {
  return {
    type: ReferenceTypes.ExternalReference,
    keys: [{
      type: KeyTypes.GlobalReference,
      value,
    }],
  };
}

/**
 * Transform ECLASS concept to ConceptDescription
 */
export function transformECLASSToConceptDescription(concept: DictionaryConcept): ConceptDescription {
  if (concept.source !== DictionarySource.ECLASS) {
    throw new Error('Concept is not from ECLASS source');
  }

  return transformToConceptDescription(concept);
}

/**
 * Transform IEC CDD concept to ConceptDescription
 */
export function transformIECCDDToConceptDescription(concept: DictionaryConcept): ConceptDescription {
  if (concept.source !== DictionarySource.IECCDD) {
    throw new Error('Concept is not from IEC CDD source');
  }

  return transformToConceptDescription(concept);
}
