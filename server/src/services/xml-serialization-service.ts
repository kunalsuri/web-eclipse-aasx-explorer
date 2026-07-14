/**
 * XML Serialization Service
 * 
 * Serializes AAS V3 data structures to XML format compliant with the official schema.
 */

import type {
  Environment,
  AssetAdministrationShell,
  Submodel,
  SubmodelElement,
  Reference,
  Key,
  LangStringNameType,
  LangStringTextType,
} from '../../../shared/aas-v3-types';

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

    this.indent--;
    lines.push('</environment>');

    return lines.join('\n');
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

  /**
   * Serialize reference to XML
   */
  private serializeReference(ref: Reference): string[] {
    const lines: string[] = [];

    lines.push(this.indentLine('<reference>'));
    this.indent++;

    lines.push(this.indentLine(`<type>${ref.type}</type>`));

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

    this.indent--;
    lines.push(this.indentLine('</reference>'));

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
