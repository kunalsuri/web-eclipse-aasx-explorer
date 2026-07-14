/**
 * XML Deserialization Service
 * 
 * Parses XML files and converts them to AAS V3 data structures.
 */

import { parseStringPromise } from 'xml2js';
import type { Environment } from '../../../shared/aas-v3-types';

export interface ParseResult<T> {
  data: T;
  warnings: ParseWarning[];
  errors: ParseError[];
}

export interface ParseError {
  line: number;
  column: number;
  message: string;
  path: string;
  severity: 'error' | 'fatal';
}

export interface ParseWarning {
  line: number;
  column: number;
  message: string;
  path: string;
}

export interface XMLFormat {
  version: string;
  type: 'AAS';
}

export class XMLDeserializationService {
  private strictMode: boolean = false;

  constructor(strictMode: boolean = false) {
    this.strictMode = strictMode;
  }

  /**
   * Parse environment from XML
   */
  async parseEnvironment(xmlContent: string): Promise<ParseResult<Environment>> {
    const warnings: ParseWarning[] = [];
    const errors: ParseError[] = [];

    try {
      // 1. Detect format and version
      const format = await this.detectFormat(xmlContent);

      // 2. Parse XML to object
      const parsed = await parseStringPromise(xmlContent, {
        explicitArray: false,
        mergeAttrs: true,
        trim: true,
        tagNameProcessors: [(name: string) => name.replace(/^.*:/, '')],
      });

      // 3. Convert to AAS types
      const environment = await this.deserializeEnvironment(parsed);

      return {
        data: environment,
        warnings,
        errors,
      };
    } catch (error: any) {
      errors.push({
        line: 0,
        column: 0,
        message: error.message,
        path: '',
        severity: 'fatal',
      });

      return {
        data: {} as Environment,
        warnings,
        errors,
      };
    }
  }

  /**
   * Detect XML format and version
   */
  private async detectFormat(xml: string): Promise<XMLFormat> {
    const namespaceMatch = xml.match(/xmlns(?::[A-Za-z_][\w.-]*)?="([^"]+)"/);
    if (!namespaceMatch) {
      throw new Error('No namespace found in XML');
    }

    const namespace = namespaceMatch[1];
    if (namespace.includes('/aas/3/0')) {
      return { version: '3.0', type: 'AAS' };
    } else if (namespace.includes('/aas/2/0')) {
      throw new Error('AAS V2 format not supported. Please convert to V3.');
    }

    throw new Error(`Unsupported namespace: ${namespace}`);
  }

  /**
   * Deserialize environment from parsed XML
   */
  private async deserializeEnvironment(parsed: any): Promise<Environment> {
    const env: Environment = {};

    const root = parsed.environment || parsed;

    // Parse shells
    if (root.assetAdministrationShells) {
      const shells = Array.isArray(root.assetAdministrationShells.assetAdministrationShell)
        ? root.assetAdministrationShells.assetAdministrationShell
        : [root.assetAdministrationShells.assetAdministrationShell];

      env.assetAdministrationShells = shells.map((shell: any) => this.deserializeShell(shell));
    }

    // Parse submodels
    if (root.submodels) {
      const submodels = Array.isArray(root.submodels.submodel)
        ? root.submodels.submodel
        : [root.submodels.submodel];

      env.submodels = submodels.map((sm: any) => this.deserializeSubmodel(sm));
    }

    // Parse concept descriptions
    if (root.conceptDescriptions) {
      const cds = Array.isArray(root.conceptDescriptions.conceptDescription)
        ? root.conceptDescriptions.conceptDescription
        : [root.conceptDescriptions.conceptDescription];

      env.conceptDescriptions = cds.map((cd: any) => this.deserializeConceptDescription(cd));
    }

    return env;
  }

  /**
   * Deserialize shell from XML
   */
  private deserializeShell(shell: any): any {
    return {
      modelType: 'AssetAdministrationShell',
      id: shell.id,
      idShort: shell.idShort,
      displayName: this.deserializeLangStringSet(shell.displayName),
      description: this.deserializeLangStringSet(shell.description),
      extensions: shell.extensions ? this.deserializeExtensions(shell.extensions) : undefined,
      assetInformation: shell.assetInformation ? {
        assetKind: shell.assetInformation.assetKind,
        globalAssetId: shell.assetInformation.globalAssetId,
      } : undefined,
      submodels: shell.submodels ? this.deserializeReferences(shell.submodels) : [],
    };
  }

  /**
   * Deserialize submodel from XML
   */
  private deserializeSubmodel(submodel: any): any {
    return {
      modelType: 'Submodel',
      id: submodel.id,
      idShort: submodel.idShort,
      displayName: this.deserializeLangStringSet(submodel.displayName),
      description: this.deserializeLangStringSet(submodel.description),
      semanticId: submodel.semanticId ? this.deserializeReference(submodel.semanticId) : undefined,
      submodelElements: submodel.submodelElements
        ? this.deserializeSubmodelElements(submodel.submodelElements)
        : [],
    };
  }

  /**
   * Deserialize concept description from XML
   */
  private deserializeConceptDescription(cd: any): any {
    return {
      modelType: 'ConceptDescription',
      id: cd.id,
      idShort: cd.idShort,
      displayName: this.deserializeLangStringSet(cd.displayName),
      description: this.deserializeLangStringSet(cd.description),
    };
  }

  /**
   * Deserialize submodel elements from XML
   */
  private deserializeSubmodelElements(elements: any): any[] {
    if (!elements) return [];
    if (Array.isArray(elements)) {
      return elements.flatMap(element => this.deserializeSubmodelElements(element));
    }

    const result: any[] = [];
    for (const [tagName, rawValue] of Object.entries(elements)) {
      for (const value of this.asArray(rawValue)) {
        result.push(this.deserializeElement(value, tagName));
      }
    }
    return result;
  }

  /**
   * Deserialize a single element from XML
   */
  private deserializeElement(elem: any, tagName?: string): any {
    // Determine element type from XML tag
    const modelType = this.getModelTypeFromXml(elem, tagName);

    const base = {
      modelType,
      idShort: elem.idShort,
      category: elem.category,
      description: this.deserializeLangStringSet(elem.description),
      semanticId: elem.semanticId ? this.deserializeReference(elem.semanticId) : undefined,
    };

    // Type-specific deserialization
    switch (modelType) {
      case 'Property':
        return {
          ...base,
          valueType: elem.valueType,
          value: elem.value,
        };

      case 'MultiLanguageProperty':
        return {
          ...base,
          value: this.deserializeLangStringSet(elem.value),
        };

      case 'Range':
        return {
          ...base,
          valueType: elem.valueType,
          min: elem.min,
          max: elem.max,
        };

      case 'ReferenceElement':
        return {
          ...base,
          value: elem.value ? this.deserializeReference(elem.value) : undefined,
        };

      case 'Blob':
        return {
          ...base,
          contentType: elem.contentType,
          value: elem.value,
        };

      case 'File':
        return {
          ...base,
          contentType: elem.contentType,
          value: elem.value,
        };

      case 'SubmodelElementCollection':
        return {
          ...base,
          value: elem.value ? this.deserializeSubmodelElements(elem.value) : [],
        };

      case 'SubmodelElementList':
        return {
          ...base,
          typeValueListElement: elem.typeValueListElement,
          value: elem.value ? this.deserializeSubmodelElements(elem.value) : [],
        };

      case 'Entity':
        return {
          ...base,
          entityType: elem.entityType,
          globalAssetId: elem.globalAssetId,
          statements: elem.statements ? this.deserializeSubmodelElements(elem.statements) : [],
        };

      case 'Operation':
        return {
          ...base,
          inputVariables: this.deserializeOperationVariables(elem.inputVariables),
          outputVariables: this.deserializeOperationVariables(elem.outputVariables),
          inoutputVariables: this.deserializeOperationVariables(elem.inoutputVariables),
        };

      default:
        return base;
    }
  }

  /**
   * Get model type from XML element
   */
  private getModelTypeFromXml(elem: any, tagName?: string): string {
    const typesByTag: Record<string, string> = {
      property: 'Property',
      multiLanguageProperty: 'MultiLanguageProperty',
      range: 'Range',
      referenceElement: 'ReferenceElement',
      blob: 'Blob',
      file: 'File',
      submodelElementCollection: 'SubmodelElementCollection',
      submodelElementList: 'SubmodelElementList',
      entity: 'Entity',
      operation: 'Operation',
    };
    if (tagName && typesByTag[tagName]) return typesByTag[tagName];

    // Check for explicit modelType attribute
    if (elem.modelType) return elem.modelType;

    // Infer from XML tag name
    const keys = Object.keys(elem);
    if (keys.includes('property')) return 'Property';
    if (keys.includes('multiLanguageProperty')) return 'MultiLanguageProperty';
    if (keys.includes('range')) return 'Range';
    if (keys.includes('referenceElement')) return 'ReferenceElement';
    if (keys.includes('blob')) return 'Blob';
    if (keys.includes('file')) return 'File';
    if (keys.includes('submodelElementCollection')) return 'SubmodelElementCollection';
    if (keys.includes('submodelElementList')) return 'SubmodelElementList';
    if (keys.includes('entity')) return 'Entity';
    if (keys.includes('operation')) return 'Operation';

    return 'Property'; // Default fallback
  }

  /**
   * Deserialize reference from XML
   */
  private deserializeReference(ref: any): any {
    if (!ref) return undefined;

    return {
      type: ref.type || 'ModelReference',
      keys: ref.keys ? this.deserializeKeys(ref.keys) : [],
    };
  }

  /**
   * Deserialize references from XML
   */
  private deserializeReferences(refs: any): any[] {
    if (!refs) return [];

    const refArray = Array.isArray(refs.reference) ? refs.reference : [refs.reference];
    return refArray.map((ref: any) => this.deserializeReference(ref));
  }

  /**
   * Deserialize keys from XML
   */
  private deserializeKeys(keys: any): any[] {
    if (!keys) return [];

    const keyArray = Array.isArray(keys.key) ? keys.key : [keys.key];
    return keyArray.map((key: any) => ({
      type: key.type,
      value: key.value,
    }));
  }

  /**
   * Deserialize lang string set from XML
   */
  private deserializeLangStringSet(langStrings: any): any {
    if (!langStrings) return undefined;

    const langStringArray = Array.isArray(langStrings.langString)
      ? langStrings.langString
      : [langStrings.langString];

    const result = langStringArray
      .filter((langString: any) => langString?.language && langString?.text !== undefined)
      .map((langString: any) => ({
        language: langString.language,
        text: String(langString.text),
      }));
    return result.length > 0 ? result : undefined;
  }

  private deserializeExtensions(extensions: any): any[] {
    return this.asArray(extensions.extension).map(extension => ({
      name: extension.name,
      valueType: extension.valueType,
      value: extension.value,
    }));
  }

  private deserializeOperationVariables(variables: any): any[] | undefined {
    if (!variables) return undefined;
    const result = this.asArray(variables.operationVariable)
      .map(variable => {
        const value = this.deserializeSubmodelElements(variable?.value)[0];
        return value ? { value } : undefined;
      })
      .filter((variable): variable is { value: any } => variable !== undefined);
    return result.length > 0 ? result : undefined;
  }

  private asArray<T>(value: T | T[] | undefined): T[] {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
  }
}

// Singleton instance
export const xmlDeserializationService = new XMLDeserializationService();
