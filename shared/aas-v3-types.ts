/**
 * AAS V3.0 Type Definitions
 * Based on AasCore.Aas3_0 from Eclipse AASX Package Explorer
 * 
 * This file contains TypeScript interfaces that mirror the AAS V3.0 specification
 * Reference: https://github.com/eclipse-aaspe/package-explorer
 */

// ============================================================================
// Enumerations
// ============================================================================

export enum ModelingKind {
  Template = "Template",
  Instance = "Instance",
}

export enum AssetKind {
  Type = "Type",
  Instance = "Instance",
  NotApplicable = "NotApplicable",
}

export enum AasSubmodelElements {
  AnnotatedRelationshipElement = "AnnotatedRelationshipElement",
  BasicEventElement = "BasicEventElement",
  Blob = "Blob",
  Capability = "Capability",
  DataElement = "DataElement",
  Entity = "Entity",
  EventElement = "EventElement",
  File = "File",
  MultiLanguageProperty = "MultiLanguageProperty",
  Operation = "Operation",
  Property = "Property",
  Range = "Range",
  ReferenceElement = "ReferenceElement",
  RelationshipElement = "RelationshipElement",
  SubmodelElement = "SubmodelElement",
  SubmodelElementList = "SubmodelElementList",
  SubmodelElementCollection = "SubmodelElementCollection",
}

export enum DataTypeDefXsd {
  AnyUri = "xs:anyURI",
  Base64Binary = "xs:base64Binary",
  Boolean = "xs:boolean",
  Byte = "xs:byte",
  Date = "xs:date",
  DateTime = "xs:dateTime",
  Decimal = "xs:decimal",
  Double = "xs:double",
  Duration = "xs:duration",
  Float = "xs:float",
  GDay = "xs:gDay",
  GMonth = "xs:gMonth",
  GMonthDay = "xs:gMonthDay",
  GYear = "xs:gYear",
  GYearMonth = "xs:gYearMonth",
  HexBinary = "xs:hexBinary",
  Int = "xs:int",
  Integer = "xs:integer",
  Long = "xs:long",
  NegativeInteger = "xs:negativeInteger",
  NonNegativeInteger = "xs:nonNegativeInteger",
  NonPositiveInteger = "xs:nonPositiveInteger",
  PositiveInteger = "xs:positiveInteger",
  Short = "xs:short",
  String = "xs:string",
  Time = "xs:time",
  UnsignedByte = "xs:unsignedByte",
  UnsignedInt = "xs:unsignedInt",
  UnsignedLong = "xs:unsignedLong",
  UnsignedShort = "xs:unsignedShort",
}

export enum KeyTypes {
  AnnotatedRelationshipElement = "AnnotatedRelationshipElement",
  AssetAdministrationShell = "AssetAdministrationShell",
  BasicEventElement = "BasicEventElement",
  Blob = "Blob",
  Capability = "Capability",
  ConceptDescription = "ConceptDescription",
  DataElement = "DataElement",
  Entity = "Entity",
  EventElement = "EventElement",
  File = "File",
  FragmentReference = "FragmentReference",
  GlobalReference = "GlobalReference",
  Identifiable = "Identifiable",
  MultiLanguageProperty = "MultiLanguageProperty",
  Operation = "Operation",
  Property = "Property",
  Range = "Range",
  Referable = "Referable",
  ReferenceElement = "ReferenceElement",
  RelationshipElement = "RelationshipElement",
  Submodel = "Submodel",
  SubmodelElement = "SubmodelElement",
  SubmodelElementCollection = "SubmodelElementCollection",
  SubmodelElementList = "SubmodelElementList",
}

export enum ReferenceTypes {
  ExternalReference = "ExternalReference",
  ModelReference = "ModelReference",
}

export enum Direction {
  Input = "input",
  Output = "output",
}

export enum StateOfEvent {
  On = "on",
  Off = "off",
}

export enum EntityType {
  CoManagedEntity = "CoManagedEntity",
  SelfManagedEntity = "SelfManagedEntity",
}

export enum QualifierKind {
  ConceptQualifier = "ConceptQualifier",
  TemplateQualifier = "TemplateQualifier",
  ValueQualifier = "ValueQualifier",
}

// ============================================================================
// Base Interfaces
// ============================================================================

/**
 * LangStringNameType - Multi-language name
 */
export interface LangStringNameType {
  language: string;
  text: string;
}

/**
 * LangStringTextType - Multi-language text
 */
export interface LangStringTextType {
  language: string;
  text: string;
}

/**
 * LangStringDefinitionTypeIec61360 - Multi-language definition for IEC 61360
 */
export interface LangStringDefinitionTypeIec61360 {
  language: string;
  text: string;
}

/**
 * LangStringPreferredNameTypeIec61360 - Multi-language preferred name for IEC 61360
 */
export interface LangStringPreferredNameTypeIec61360 {
  language: string;
  text: string;
}

/**
 * LangStringShortNameTypeIec61360 - Multi-language short name for IEC 61360
 */
export interface LangStringShortNameTypeIec61360 {
  language: string;
  text: string;
}

/**
 * Extension - Additional information for an element
 */
export interface Extension {
  name: string;
  valueType?: DataTypeDefXsd;
  value?: string;
  refersTo?: Reference[];
  semanticId?: Reference;
  supplementalSemanticIds?: Reference[];
}

/**
 * AdministrativeInformation - Administrative meta-information
 */
export interface AdministrativeInformation {
  version?: string;
  revision?: string;
  creator?: Reference;
  templateId?: string;
  embeddedDataSpecifications?: EmbeddedDataSpecification[];
}

/**
 * Qualifier - Additional qualification of a qualifiable element
 */
export interface Qualifier {
  kind?: QualifierKind;
  type: string;
  valueType: DataTypeDefXsd;
  value?: string;
  valueId?: Reference;
  semanticId?: Reference;
  supplementalSemanticIds?: Reference[];
}

/**
 * Key - A key is a reference to an element by its ID
 */
export interface Key {
  type: KeyTypes;
  value: string;
}

/**
 * Reference - Reference to either a model element or an external entity
 */
export interface Reference {
  type: ReferenceTypes;
  referredSemanticId?: Reference;
  keys: Key[];
}

/**
 * EmbeddedDataSpecification - Embedded data specification
 */
export interface EmbeddedDataSpecification {
  dataSpecification: Reference;
  dataSpecificationContent: DataSpecificationContent;
}

/**
 * DataSpecificationContent - Content of a data specification
 */
export interface DataSpecificationContent {
  // This is a union type in practice, but we'll use a base interface
  // Specific implementations: DataSpecificationIec61360
  [key: string]: unknown;
}

/**
 * DataSpecificationIec61360 - Data specification according to IEC 61360
 */
export interface DataSpecificationIec61360 extends DataSpecificationContent {
  preferredName: LangStringPreferredNameTypeIec61360[];
  shortName?: LangStringShortNameTypeIec61360[];
  unit?: string;
  unitId?: Reference;
  sourceOfDefinition?: string;
  symbol?: string;
  dataType?: DataTypeDefXsd;
  definition?: LangStringDefinitionTypeIec61360[];
  valueFormat?: string;
  valueList?: ValueList;
  value?: string;
  levelType?: LevelType;
}

/**
 * ValueList - List of allowed values
 */
export interface ValueList {
  valueReferencePairs: ValueReferencePair[];
}

/**
 * ValueReferencePair - Pair of value and reference
 */
export interface ValueReferencePair {
  value: string;
  valueId: Reference;
}

/**
 * LevelType - Level type for data specification
 */
export interface LevelType {
  min: boolean;
  max: boolean;
  nom: boolean;
  typ: boolean;
}

// ============================================================================
// Core AAS Interfaces
// ============================================================================

/**
 * HasExtensions - Interface for elements that can have extensions
 */
export interface HasExtensions {
  extensions?: Extension[];
}

/**
 * Referable - An element that is referable by its idShort
 */
export interface Referable extends HasExtensions {
  idShort?: string;
  displayName?: LangStringNameType[];
  category?: string;
  description?: LangStringTextType[];
}

/**
 * Identifiable - An element that has a globally unique identifier
 */
export interface Identifiable extends Referable {
  id: string;
  administration?: AdministrativeInformation;
}

/**
 * HasSemantics - Interface for elements that have semantic information
 */
export interface HasSemantics {
  semanticId?: Reference;
  supplementalSemanticIds?: Reference[];
}

/**
 * HasDataSpecification - Interface for elements that have data specifications
 */
export interface HasDataSpecification {
  embeddedDataSpecifications?: EmbeddedDataSpecification[];
}

/**
 * Qualifiable - Interface for elements that can be qualified
 */
export interface Qualifiable {
  qualifiers?: Qualifier[];
}

/**
 * HasKind - Interface for elements that have a modeling kind
 */
export interface HasKind {
  kind?: ModelingKind;
}

// ============================================================================
// Asset Administration Shell
// ============================================================================

/**
 * AssetInformation - Meta-information about the asset
 */
export interface AssetInformation {
  assetKind: AssetKind;
  globalAssetId?: string;
  specificAssetIds?: SpecificAssetId[];
  assetType?: string;
  defaultThumbnail?: Resource;
}

/**
 * SpecificAssetId - Specific identifier for an asset
 */
export interface SpecificAssetId extends HasSemantics {
  name: string;
  value: string;
  externalSubjectId?: Reference;
}

/**
 * Resource - Reference to a resource (file)
 */
export interface Resource {
  path: string;
  contentType?: string;
}

/**
 * AssetAdministrationShell - The Asset Administration Shell
 */
export interface AssetAdministrationShell
  extends Identifiable,
    HasDataSpecification {
  derivedFrom?: Reference;
  assetInformation: AssetInformation;
  submodels?: Reference[];
}

// ============================================================================
// Submodel
// ============================================================================

/**
 * Submodel - A submodel defines a specific aspect of the asset
 */
export interface Submodel
  extends Identifiable,
    HasKind,
    HasSemantics,
    Qualifiable,
    HasDataSpecification {
  submodelElements?: SubmodelElement[];
}

// ============================================================================
// Submodel Elements
// ============================================================================

/**
 * SubmodelElement - Base interface for all submodel elements
 */
export interface SubmodelElement
  extends Referable,
    HasSemantics,
    Qualifiable,
    HasDataSpecification {
  // This is a discriminated union in practice
  modelType: AasSubmodelElements;
}

/**
 * DataElement - Base interface for data elements
 */
export interface DataElement extends SubmodelElement {}

/**
 * Property - A property is a data element with a single value
 */
export interface Property extends DataElement {
  modelType: AasSubmodelElements.Property;
  valueType: DataTypeDefXsd;
  value?: string;
  valueId?: Reference;
}

/**
 * MultiLanguageProperty - A property with values in multiple languages
 */
export interface MultiLanguageProperty extends DataElement {
  modelType: AasSubmodelElements.MultiLanguageProperty;
  value?: LangStringTextType[];
  valueId?: Reference;
}

/**
 * Range - A data element defining a range with min and max
 */
export interface Range extends DataElement {
  modelType: AasSubmodelElements.Range;
  valueType: DataTypeDefXsd;
  min?: string;
  max?: string;
}

/**
 * ReferenceElement - A data element that is a reference
 */
export interface ReferenceElement extends DataElement {
  modelType: AasSubmodelElements.ReferenceElement;
  value?: Reference;
}

/**
 * Blob - A data element that is a binary large object
 */
export interface Blob extends DataElement {
  modelType: AasSubmodelElements.Blob;
  value?: string; // Base64 encoded
  contentType: string;
}

/**
 * File - A data element that is a file
 */
export interface File extends DataElement {
  modelType: AasSubmodelElements.File;
  value?: string; // Path to file
  contentType: string;
}

/**
 * SubmodelElementCollection - A collection of submodel elements
 */
export interface SubmodelElementCollection extends SubmodelElement {
  modelType: AasSubmodelElements.SubmodelElementCollection;
  value?: SubmodelElement[];
}

/**
 * SubmodelElementList - A list of submodel elements of the same type
 */
export interface SubmodelElementList extends SubmodelElement {
  modelType: AasSubmodelElements.SubmodelElementList;
  orderRelevant?: boolean;
  semanticIdListElement?: Reference;
  typeValueListElement: AasSubmodelElements;
  valueTypeListElement?: DataTypeDefXsd;
  value?: SubmodelElement[];
}

/**
 * RelationshipElement - A relationship between two elements
 */
export interface RelationshipElement extends SubmodelElement {
  modelType: AasSubmodelElements.RelationshipElement;
  first: Reference;
  second: Reference;
}

/**
 * AnnotatedRelationshipElement - A relationship with annotations
 */
export interface AnnotatedRelationshipElement extends SubmodelElement {
  modelType: AasSubmodelElements.AnnotatedRelationshipElement;
  first: Reference;
  second: Reference;
  annotations?: DataElement[];
}

/**
 * Entity - An entity is a submodel element that has its own identity
 */
export interface Entity extends SubmodelElement {
  modelType: AasSubmodelElements.Entity;
  statements?: SubmodelElement[];
  entityType: EntityType;
  globalAssetId?: string;
  specificAssetIds?: SpecificAssetId[];
}

/**
 * Operation - An operation is a submodel element that can be invoked
 */
export interface Operation extends SubmodelElement {
  modelType: AasSubmodelElements.Operation;
  inputVariables?: OperationVariable[];
  outputVariables?: OperationVariable[];
  inoutputVariables?: OperationVariable[];
}

/**
 * OperationVariable - A variable of an operation
 */
export interface OperationVariable {
  value: SubmodelElement;
}

/**
 * Capability - A capability is a submodel element that describes a capability
 */
export interface Capability extends SubmodelElement {
  modelType: AasSubmodelElements.Capability;
}

/**
 * BasicEventElement - A basic event element
 */
export interface BasicEventElement extends SubmodelElement {
  modelType: AasSubmodelElements.BasicEventElement;
  observed: Reference;
  direction: Direction;
  state: StateOfEvent;
  messageTopic?: string;
  messageBroker?: Reference;
  lastUpdate?: string;
  minInterval?: string;
  maxInterval?: string;
}

// ============================================================================
// Concept Description
// ============================================================================

/**
 * ConceptDescription - A concept description defines a concept
 */
export interface ConceptDescription
  extends Identifiable,
    HasDataSpecification {
  isCaseOf?: Reference[];
}

// ============================================================================
// Environment
// ============================================================================

/**
 * Environment - The root element containing all AAS elements
 */
export interface Environment {
  assetAdministrationShells?: AssetAdministrationShell[];
  submodels?: Submodel[];
  conceptDescriptions?: ConceptDescription[];
}

// ============================================================================
// Type Guards
// ============================================================================

export function isProperty(element: SubmodelElement): element is Property {
  return element.modelType === AasSubmodelElements.Property;
}

export function isMultiLanguageProperty(
  element: SubmodelElement
): element is MultiLanguageProperty {
  return element.modelType === AasSubmodelElements.MultiLanguageProperty;
}

export function isRange(element: SubmodelElement): element is Range {
  return element.modelType === AasSubmodelElements.Range;
}

export function isReferenceElement(
  element: SubmodelElement
): element is ReferenceElement {
  return element.modelType === AasSubmodelElements.ReferenceElement;
}

export function isBlob(element: SubmodelElement): element is Blob {
  return element.modelType === AasSubmodelElements.Blob;
}

export function isFile(element: SubmodelElement): element is File {
  return element.modelType === AasSubmodelElements.File;
}

export function isSubmodelElementCollection(
  element: SubmodelElement
): element is SubmodelElementCollection {
  return element.modelType === AasSubmodelElements.SubmodelElementCollection;
}

export function isSubmodelElementList(
  element: SubmodelElement
): element is SubmodelElementList {
  return element.modelType === AasSubmodelElements.SubmodelElementList;
}

export function isRelationshipElement(
  element: SubmodelElement
): element is RelationshipElement {
  return element.modelType === AasSubmodelElements.RelationshipElement;
}

export function isAnnotatedRelationshipElement(
  element: SubmodelElement
): element is AnnotatedRelationshipElement {
  return (
    element.modelType === AasSubmodelElements.AnnotatedRelationshipElement
  );
}

export function isEntity(element: SubmodelElement): element is Entity {
  return element.modelType === AasSubmodelElements.Entity;
}

export function isOperation(element: SubmodelElement): element is Operation {
  return element.modelType === AasSubmodelElements.Operation;
}

export function isCapability(element: SubmodelElement): element is Capability {
  return element.modelType === AasSubmodelElements.Capability;
}

export function isBasicEventElement(
  element: SubmodelElement
): element is BasicEventElement {
  return element.modelType === AasSubmodelElements.BasicEventElement;
}
