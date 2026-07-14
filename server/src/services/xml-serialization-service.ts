/**
 * XML Serialization Service
 * 
 * Serializes AAS V3 data structures to XML format compliant with the official schema.
 */

import type {
  Environment,
  AssetAdministrationShell,
  Submodel,
  ConceptDescription,
  SubmodelElement,
  Reference,
  Key,
  LangStringNameType,
  LangStringTextType,
} from '../../../shared/aas-v3-types';
import { XMLElementSerializer } from './xml-element-serializer';
import { XMLDeserializationService } from './xml-deserialization-service';
import { SchemaValidator } from './xml-schema-validator';

export interface XMLSerializationConfig {
  schemaVersion: '3.0';
  namespace: string;
  schemaLocation: string;
  prettyPrint: boolean;
  includeComments: boolean;
}

const DEFAULT_CONFIG: XMLSerializationConfig = {
  schemaVersion: '3.0',
  namespace: 'https://admin-shell.io/aas/3/0',
  schemaLocation: 'https://admin-shell.io/aas/3/0/AAS.xsd',
  prettyPrint: true,
  includeComments: false,
};

const AAS_V3_NAMESPACES = {
  aas: 'https://admin-shell.io/aas/3/0',
  xsi: 'http://www.w3.org/2001/XMLSchema-instance',
  IEC61360: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0',
};

export class XMLSerializationService {
  private config: XMLSerializationConfig;
  private indent: number = 0;

  constructor(config: Partial<XMLSerializationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Serialize environment to XML
   */
  async serializeEnvironment(env: Environment): Promise<string> {
    this.indent = 0;
    const lines: string[] = [];

    // XML declaration
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');

    // Root element with namespaces
    lines.push(
      `<environment xmlns="${AAS_V3_NAMESPACES.aas}" ` +
      `xmlns:xsi="${AAS_V3_NAMESPACES.xsi}" ` +
      `xsi:schemaLocation="${AAS_V3_NAMESPACES.aas} ${this.config.schemaLocation}">`
    );

    this.indent++;

    // Serialize shells
    if (env.assetAdministrationShells && env.assetAdministrationShells.length > 0) {
      lines.push(this.indentLine('<assetAdministrationShells>'));
      this.indent++;
      for (const shell of env.assetAdministrationShells) {
        lines.push(...this.serializeShell(shell));
      }
      this.indent--;
      lines.push(this.indentLine('</assetAdministrationShells>'));
    }

    if (env.submodels && env.submodels.length > 0) {
      lines.push(this.indentLine('<submodels>'));
      this.indent++;
      for (const submodel of env.submodels) {
        lines.push(...this.serializeSubmodel(submodel));
      }
      this.indent--;
      lines.push(this.indentLine('</submodels>'));
    }

    if (env.conceptDescriptions && env.conceptDescriptions.length > 0) {
      lines.push(this.indentLine('<conceptDescriptions>'));
      this.indent++;
      for (const conceptDescription of env.conceptDescriptions) {
        lines.push(...this.serializeConceptDescription(conceptDescription));
      }
      this.indent--;
      lines.push(this.indentLine('</conceptDescriptions>'));
    }

    this.indent--;
    lines.push('</environment>');

    return lines.join('\n');
  }

  /** Parse an AAS V3 XML environment through the matching deserializer. */
  async deserializeEnvironment(xmlContent: string): Promise<Environment> {
    const result = await new XMLDeserializationService().parseEnvironment(xmlContent);
    if (result.errors.length > 0) {
      throw new Error(result.errors.map(error => error.message).join('; '));
    }
    return result.data;
  }

  /**
   * Validate XML well-formedness and the local AAS V3 envelope contract.
   * This is intentionally not presented as full official-XSD validation.
   */
  async validateXml(xmlContent: string): Promise<{
    valid: boolean;
    errors: Array<{ line: number; column: number; message: string; path: string }>;
    warnings: Array<{ line: number; column: number; message: string; path: string }>;
  }> {
    const result = await new SchemaValidator().validate(xmlContent, {
      version: '3.0',
      type: 'AAS',
    });
    return { valid: result.isValid, errors: result.errors, warnings: result.warnings };
  }

  /**
   * Serialize shell to XML
   */
  private serializeShell(shell: AssetAdministrationShell): string[] {
    const lines: string[] = [];

    lines.push(this.indentLine('<assetAdministrationShell>'));
    this.indent++;

    // ID
    if (shell.id) {
      lines.push(this.indentLine(`<id>${this.escapeXml(shell.id)}</id>`));
    }

    // idShort
    if (shell.idShort) {
      lines.push(this.indentLine(`<idShort>${this.escapeXml(shell.idShort)}</idShort>`));
    }

    if (shell.extensions && shell.extensions.length > 0) {
      lines.push(...this.serializeExtensions(shell.extensions));
    }

    // displayName
    if (shell.displayName) {
      lines.push(...this.serializeLangStringSet('displayName', shell.displayName));
    }

    // description
    if (shell.description) {
      lines.push(...this.serializeLangStringSet('description', shell.description));
    }

    // assetInformation
    if (shell.assetInformation) {
      lines.push(this.indentLine('<assetInformation>'));
      this.indent++;
      lines.push(this.indentLine(`<assetKind>${shell.assetInformation.assetKind}</assetKind>`));
      if (shell.assetInformation.globalAssetId) {
        lines.push(this.indentLine(`<globalAssetId>${this.escapeXml(shell.assetInformation.globalAssetId)}</globalAssetId>`));
      }
      this.indent--;
      lines.push(this.indentLine('</assetInformation>'));
    }

    // submodels
    if (shell.submodels && shell.submodels.length > 0) {
      lines.push(this.indentLine('<submodels>'));
      this.indent++;
      for (const ref of shell.submodels) {
        lines.push(...this.serializeReference(ref));
      }
      this.indent--;
      lines.push(this.indentLine('</submodels>'));
    }

    this.indent--;
    lines.push(this.indentLine('</assetAdministrationShell>'));

    return lines;
  }

  private serializeSubmodel(submodel: Submodel): string[] {
    const lines: string[] = [this.indentLine('<submodel>')];
    this.indent++;

    lines.push(this.indentLine(`<id>${this.escapeXml(submodel.id)}</id>`));
    if (submodel.idShort) {
      lines.push(this.indentLine(`<idShort>${this.escapeXml(submodel.idShort)}</idShort>`));
    }
    if (submodel.displayName) {
      lines.push(...this.serializeLangStringSet('displayName', submodel.displayName));
    }
    if (submodel.description) {
      lines.push(...this.serializeLangStringSet('description', submodel.description));
    }
    if (submodel.semanticId) {
      lines.push(this.indentLine('<semanticId>'));
      this.indent++;
      lines.push(...this.serializeReferenceContents(submodel.semanticId));
      this.indent--;
      lines.push(this.indentLine('</semanticId>'));
    }
    if (submodel.submodelElements && submodel.submodelElements.length > 0) {
      lines.push(this.indentLine('<submodelElements>'));
      this.indent++;
      const serializer = new XMLElementSerializer(this.config.prettyPrint);
      serializer.setIndent(this.indent);
      for (const element of submodel.submodelElements) {
        lines.push(...serializer.serializeElement(element));
      }
      this.indent--;
      lines.push(this.indentLine('</submodelElements>'));
    }

    this.indent--;
    lines.push(this.indentLine('</submodel>'));
    return lines;
  }

  private serializeConceptDescription(conceptDescription: ConceptDescription): string[] {
    const lines: string[] = [this.indentLine('<conceptDescription>')];
    this.indent++;
    lines.push(this.indentLine(`<id>${this.escapeXml(conceptDescription.id)}</id>`));
    if (conceptDescription.idShort) {
      lines.push(this.indentLine(`<idShort>${this.escapeXml(conceptDescription.idShort)}</idShort>`));
    }
    if (conceptDescription.displayName) {
      lines.push(...this.serializeLangStringSet('displayName', conceptDescription.displayName));
    }
    if (conceptDescription.description) {
      lines.push(...this.serializeLangStringSet('description', conceptDescription.description));
    }
    this.indent--;
    lines.push(this.indentLine('</conceptDescription>'));
    return lines;
  }

  private serializeExtensions(extensions: NonNullable<AssetAdministrationShell['extensions']>): string[] {
    const lines: string[] = [this.indentLine('<extensions>')];
    this.indent++;
    for (const extension of extensions) {
      lines.push(this.indentLine('<extension>'));
      this.indent++;
      lines.push(this.indentLine(`<name>${this.escapeXml(extension.name)}</name>`));
      if (extension.valueType) {
        lines.push(this.indentLine(`<valueType>${extension.valueType}</valueType>`));
      }
      if (extension.value !== undefined) {
        lines.push(this.indentLine(`<value>${this.escapeXml(extension.value)}</value>`));
      }
      this.indent--;
      lines.push(this.indentLine('</extension>'));
    }
    this.indent--;
    lines.push(this.indentLine('</extensions>'));
    return lines;
  }

  /**
   * Serialize reference to XML
   */
  private serializeReference(ref: Reference): string[] {
    const lines: string[] = [];

    lines.push(this.indentLine('<reference>'));
    this.indent++;

    lines.push(...this.serializeReferenceContents(ref));

    this.indent--;
    lines.push(this.indentLine('</reference>'));

    return lines;
  }

  private serializeReferenceContents(ref: Reference): string[] {
    const lines: string[] = [this.indentLine(`<type>${ref.type}</type>`)];
    if (ref.keys && ref.keys.length > 0) {
      lines.push(this.indentLine('<keys>'));
      this.indent++;
      for (const key of ref.keys) {
        lines.push(this.indentLine('<key>'));
        this.indent++;
        lines.push(this.indentLine(`<type>${key.type}</type>`));
        lines.push(this.indentLine(`<value>${this.escapeXml(key.value)}</value>`));
        this.indent--;
        lines.push(this.indentLine('</key>'));
      }
      this.indent--;
      lines.push(this.indentLine('</keys>'));
    }
    return lines;
  }

  /**
   * Serialize lang string set to XML
   */
  private serializeLangStringSet(
    tagName: string,
    langStrings: (LangStringNameType | LangStringTextType)[]
  ): string[] {
    const lines: string[] = [];

    lines.push(this.indentLine(`<${tagName}>`));
    this.indent++;

    for (const langString of langStrings) {
      lines.push(this.indentLine('<langString>'));
      this.indent++;
      lines.push(this.indentLine(`<language>${this.escapeXml(langString.language)}</language>`));
      lines.push(this.indentLine(`<text>${this.escapeXml(langString.text)}</text>`));
      this.indent--;
      lines.push(this.indentLine('</langString>'));
    }

    this.indent--;
    lines.push(this.indentLine(`</${tagName}>`));

    return lines;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Add indentation to line
   */
  private indentLine(line: string): string {
    if (!this.config.prettyPrint) return line;
    return '  '.repeat(this.indent) + line;
  }
}

// Singleton instance
export const xmlSerializationService = new XMLSerializationService();
