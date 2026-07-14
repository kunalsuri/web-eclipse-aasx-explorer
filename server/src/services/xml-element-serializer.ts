/**
 * XML Element Serializer
 * 
 * Handles serialization of all SubmodelElement types to XML.
 */

import type { SubmodelElement } from '../../../shared/aas-v3-types';

export class XMLElementSerializer {
  private indent: number = 0;
  private prettyPrint: boolean = true;

  constructor(prettyPrint: boolean = true) {
    this.prettyPrint = prettyPrint;
  }

  /**
   * Serialize any SubmodelElement to XML
   */
  serializeElement(element: SubmodelElement): string[] {
    const lines: string[] = [];

    switch (element.modelType) {
      case 'Property':
        lines.push(...this.serializeProperty(element as any));
        break;
      case 'MultiLanguageProperty':
        lines.push(...this.serializeMultiLanguageProperty(element as any));
        break;
      case 'Range':
        lines.push(...this.serializeRange(element as any));
        break;
      case 'ReferenceElement':
        lines.push(...this.serializeReferenceElement(element as any));
        break;
      case 'Blob':
        lines.push(...this.serializeBlob(element as any));
        break;
      case 'File':
        lines.push(...this.serializeFile(element as any));
        break;
      case 'SubmodelElementCollection':
        lines.push(...this.serializeCollection(element as any));
        break;
      case 'SubmodelElementList':
        lines.push(...this.serializeList(element as any));
        break;
      case 'Entity':
        lines.push(...this.serializeEntity(element as any));
        break;
      case 'Operation':
        lines.push(...this.serializeOperation(element as any));
        break;
      default:
        // Fallback for unsupported types
        lines.push(this.indentLine(`<!-- Unsupported element type: ${element.modelType} -->`));
    }

    return lines;
  }

  private serializeProperty(prop: any): string[] {
    const lines: string[] = [];
    lines.push(this.indentLine('<property>'));
    this.indent++;

    this.addCommonFields(lines, prop);

    if (prop.valueType) {
      lines.push(this.indentLine(`<valueType>${prop.valueType}</valueType>`));
    }

    if (prop.value !== undefined && prop.value !== null) {
      lines.push(this.indentLine(`<value>${this.escapeXml(String(prop.value))}</value>`));
    }

    this.indent--;
    lines.push(this.indentLine('</property>'));
    return lines;
  }

  private serializeMultiLanguageProperty(prop: any): string[] {
    const lines: string[] = [];
    lines.push(this.indentLine('<multiLanguageProperty>'));
    this.indent++;

    this.addCommonFields(lines, prop);

    if (prop.value) {
      lines.push(this.indentLine('<value>'));
      this.indent++;
      for (const langString of this.normalizeLangStrings(prop.value)) {
        lines.push(this.indentLine('<langString>'));
        this.indent++;
        lines.push(this.indentLine(`<language>${this.escapeXml(langString.language)}</language>`));
        lines.push(this.indentLine(`<text>${this.escapeXml(langString.text)}</text>`));
        this.indent--;
        lines.push(this.indentLine('</langString>'));
      }
      this.indent--;
      lines.push(this.indentLine('</value>'));
    }

    this.indent--;
    lines.push(this.indentLine('</multiLanguageProperty>'));
    return lines;
  }

  private serializeRange(range: any): string[] {
    const lines: string[] = [];
    lines.push(this.indentLine('<range>'));
    this.indent++;

    this.addCommonFields(lines, range);

    if (range.valueType) {
      lines.push(this.indentLine(`<valueType>${range.valueType}</valueType>`));
    }

    if (range.min !== undefined) {
      lines.push(this.indentLine(`<min>${this.escapeXml(String(range.min))}</min>`));
    }

    if (range.max !== undefined) {
      lines.push(this.indentLine(`<max>${this.escapeXml(String(range.max))}</max>`));
    }

    this.indent--;
    lines.push(this.indentLine('</range>'));
    return lines;
  }

  private serializeReferenceElement(refElem: any): string[] {
    const lines: string[] = [];
    lines.push(this.indentLine('<referenceElement>'));
    this.indent++;

    this.addCommonFields(lines, refElem);

    if (refElem.value) {
      lines.push(this.indentLine('<value>'));
      this.indent++;
      lines.push(this.indentLine(`<type>${refElem.value.type}</type>`));
      if (refElem.value.keys) {
        lines.push(this.indentLine('<keys>'));
        this.indent++;
        for (const key of refElem.value.keys) {
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
      lines.push(this.indentLine('</value>'));
    }

    this.indent--;
    lines.push(this.indentLine('</referenceElement>'));
    return lines;
  }

  private serializeBlob(blob: any): string[] {
    const lines: string[] = [];
    lines.push(this.indentLine('<blob>'));
    this.indent++;

    this.addCommonFields(lines, blob);

    if (blob.contentType) {
      lines.push(this.indentLine(`<contentType>${this.escapeXml(blob.contentType)}</contentType>`));
    }

    if (blob.value) {
      lines.push(this.indentLine(`<value>${this.escapeXml(blob.value)}</value>`));
    }

    this.indent--;
    lines.push(this.indentLine('</blob>'));
    return lines;
  }

  private serializeFile(file: any): string[] {
    const lines: string[] = [];
    lines.push(this.indentLine('<file>'));
    this.indent++;

    this.addCommonFields(lines, file);

    if (file.contentType) {
      lines.push(this.indentLine(`<contentType>${this.escapeXml(file.contentType)}</contentType>`));
    }

    if (file.value) {
      lines.push(this.indentLine(`<value>${this.escapeXml(file.value)}</value>`));
    }

    this.indent--;
    lines.push(this.indentLine('</file>'));
    return lines;
  }

  private serializeCollection(collection: any): string[] {
    const lines: string[] = [];
    lines.push(this.indentLine('<submodelElementCollection>'));
    this.indent++;

    this.addCommonFields(lines, collection);

    if (collection.value && Array.isArray(collection.value)) {
      lines.push(this.indentLine('<value>'));
      this.indent++;
      for (const element of collection.value) {
        lines.push(...this.serializeElement(element));
      }
      this.indent--;
      lines.push(this.indentLine('</value>'));
    }

    this.indent--;
    lines.push(this.indentLine('</submodelElementCollection>'));
    return lines;
  }

  private serializeList(list: any): string[] {
    const lines: string[] = [];
    lines.push(this.indentLine('<submodelElementList>'));
    this.indent++;

    this.addCommonFields(lines, list);

    if (list.typeValueListElement) {
      lines.push(this.indentLine(`<typeValueListElement>${list.typeValueListElement}</typeValueListElement>`));
    }

    if (list.value && Array.isArray(list.value)) {
      lines.push(this.indentLine('<value>'));
      this.indent++;
      for (const element of list.value) {
        lines.push(...this.serializeElement(element));
      }
      this.indent--;
      lines.push(this.indentLine('</value>'));
    }

    this.indent--;
    lines.push(this.indentLine('</submodelElementList>'));
    return lines;
  }

  private serializeEntity(entity: any): string[] {
    const lines: string[] = [this.indentLine('<entity>')];
    this.indent++;
    this.addCommonFields(lines, entity);
    lines.push(this.indentLine(`<entityType>${entity.entityType}</entityType>`));
    if (entity.globalAssetId) {
      lines.push(this.indentLine(`<globalAssetId>${this.escapeXml(entity.globalAssetId)}</globalAssetId>`));
    }
    if (Array.isArray(entity.statements) && entity.statements.length > 0) {
      lines.push(this.indentLine('<statements>'));
      this.indent++;
      for (const statement of entity.statements) {
        lines.push(...this.serializeElement(statement));
      }
      this.indent--;
      lines.push(this.indentLine('</statements>'));
    }
    this.indent--;
    lines.push(this.indentLine('</entity>'));
    return lines;
  }

  private serializeOperation(operation: any): string[] {
    const lines: string[] = [this.indentLine('<operation>')];
    this.indent++;
    this.addCommonFields(lines, operation);
    this.serializeOperationVariables(lines, 'inputVariables', operation.inputVariables);
    this.serializeOperationVariables(lines, 'outputVariables', operation.outputVariables);
    this.serializeOperationVariables(lines, 'inoutputVariables', operation.inoutputVariables);
    this.indent--;
    lines.push(this.indentLine('</operation>'));
    return lines;
  }

  private serializeOperationVariables(lines: string[], tagName: string, variables: any): void {
    if (!Array.isArray(variables) || variables.length === 0) return;

    lines.push(this.indentLine(`<${tagName}>`));
    this.indent++;
    for (const variable of variables) {
      lines.push(this.indentLine('<operationVariable>'));
      this.indent++;
      lines.push(this.indentLine('<value>'));
      this.indent++;
      lines.push(...this.serializeElement(variable.value));
      this.indent--;
      lines.push(this.indentLine('</value>'));
      this.indent--;
      lines.push(this.indentLine('</operationVariable>'));
    }
    this.indent--;
    lines.push(this.indentLine(`</${tagName}>`));
  }

  private addCommonFields(lines: string[], element: any): void {
    if (element.idShort) {
      lines.push(this.indentLine(`<idShort>${this.escapeXml(element.idShort)}</idShort>`));
    }

    if (element.category) {
      lines.push(this.indentLine(`<category>${this.escapeXml(element.category)}</category>`));
    }

    if (element.description) {
      lines.push(this.indentLine('<description>'));
      this.indent++;
      for (const langString of this.normalizeLangStrings(element.description)) {
        lines.push(this.indentLine('<langString>'));
        this.indent++;
        lines.push(this.indentLine(`<language>${this.escapeXml(langString.language)}</language>`));
        lines.push(this.indentLine(`<text>${this.escapeXml(langString.text)}</text>`));
        this.indent--;
        lines.push(this.indentLine('</langString>'));
      }
      this.indent--;
      lines.push(this.indentLine('</description>'));
    }

    if (element.semanticId) {
      lines.push(this.indentLine('<semanticId>'));
      this.indent++;
      lines.push(this.indentLine(`<type>${element.semanticId.type}</type>`));
      if (element.semanticId.keys) {
        lines.push(this.indentLine('<keys>'));
        this.indent++;
        for (const key of element.semanticId.keys) {
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
      lines.push(this.indentLine('</semanticId>'));
    }
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private normalizeLangStrings(value: unknown): Array<{ language: string; text: string }> {
    if (Array.isArray(value)) {
      return value.filter(
        (item): item is { language: string; text: string } =>
          typeof item?.language === 'string' && typeof item?.text === 'string'
      );
    }
    if (value && typeof value === 'object') {
      return Object.entries(value).map(([language, text]) => ({
        language,
        text: String(text),
      }));
    }
    return [];
  }

  private indentLine(line: string): string {
    if (!this.prettyPrint) return line;
    return '  '.repeat(this.indent) + line;
  }

  setIndent(indent: number): void {
    this.indent = indent;
  }

  getIndent(): number {
    return this.indent;
  }
}
