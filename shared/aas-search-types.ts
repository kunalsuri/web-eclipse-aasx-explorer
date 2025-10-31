/**
 * AAS Search Types
 * Type definitions for search functionality
 */

import type {
  AssetAdministrationShell,
  Submodel,
  SubmodelElement,
  Reference,
} from './aas-v3-types';

/**
 * Search result types
 */
export enum SearchResultType {
  AssetAdministrationShell = 'AssetAdministrationShell',
  Submodel = 'Submodel',
  Property = 'Property',
  MultiLanguageProperty = 'MultiLanguageProperty',
  Range = 'Range',
  ReferenceElement = 'ReferenceElement',
  File = 'File',
  Blob = 'Blob',
  SubmodelElementCollection = 'SubmodelElementCollection',
  SubmodelElementList = 'SubmodelElementList',
  Operation = 'Operation',
  Entity = 'Entity',
  RelationshipElement = 'RelationshipElement',
  AnnotatedRelationshipElement = 'AnnotatedRelationshipElement',
}

/**
 * Search field types
 */
export enum SearchField {
  IdShort = 'idShort',
  Id = 'id',
  Value = 'value',
  Description = 'description',
  DisplayName = 'displayName',
  SemanticId = 'semanticId',
  Category = 'category',
  All = 'all',
}

/**
 * Search match information
 */
export interface SearchMatch {
  field: SearchField;
  value: string;
  matchedText: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Search result item
 */
export interface SearchResult {
  id: string;
  type: SearchResultType;
  idShort: string;
  path: string[];
  matches: SearchMatch[];
  score: number;
  element: AssetAdministrationShell | Submodel | SubmodelElement;
  parentId?: string;
  parentIdShort?: string;
}

/**
 * Search options
 */
export interface SearchOptions {
  query: string;
  fields?: SearchField[];
  types?: SearchResultType[];
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
  maxResults?: number;
}

/**
 * Search index entry
 */
export interface SearchIndexEntry {
  id: string;
  type: SearchResultType;
  idShort: string;
  path: string[];
  searchableText: string;
  element: AssetAdministrationShell | Submodel | SubmodelElement;
  parentId?: string;
  parentIdShort?: string;
}

/**
 * Search statistics
 */
export interface SearchStatistics {
  totalResults: number;
  searchTime: number;
  indexSize: number;
  query: string;
}
