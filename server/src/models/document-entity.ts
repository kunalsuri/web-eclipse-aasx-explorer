/**
 * Document Entity Model
 * 
 * TypeScript adaptation of C# DocumentEntity
 * Based on: /x-external-proj/idta-aasx-package-explorer/src/AasxPluginDocumentShelf/DocumentEntity.cs
 * 
 * Represents a VDI 2770 Document with metadata and file references
 * Supports V1.0, V1.1, and V1.2 of the documentation standard
 */

import type {
  Submodel,
  SubmodelElement,
  SubmodelElementCollection,
  Property,
  MultiLanguageProperty,
  File as AasFile,
  Reference
} from "../../../shared/aas-v3-types";

// ============================================================================
// Document Entity Types
// ============================================================================

export enum SubmodelVersion {
  Default = "default",
  V10 = "v10",
  V11 = "v11",
  V12 = "v12"
}

export enum DocRelationType {
  DocumentedEntity = "documentedEntity",
  RefersTo = "refersTo",
  BasedOn = "basedOn",
  Affecting = "affecting",
  TranslationOf = "translationOf"
}

export interface FileInfo {
  path: string;
  mimeType: string;
  aasId: string;
  smId: string;
  idShortPath: string;
}

export interface DocumentRelation {
  type: DocRelationType;
  reference: Reference;
}

// ============================================================================
// Document Entity Class
// ============================================================================

export class DocumentEntity {
  // Metadata
  smVersion: SubmodelVersion = SubmodelVersion.Default;
  title: string = "";
  organization: string = "";
  furtherInfo: string = "";
  countryCodes: string[] = [];

  // Files
  digitalFile: FileInfo | null = null;
  previewFile: FileInfo | null = null;

  // UI
  imgContainerAnyUi: any = null;
  referableHash: string | null = null;

  // Source elements for updates
  sourceElementsDocument: SubmodelElement[] | null = null;
  sourceElementsDocumentVersion: SubmodelElement[] | null = null;

  // Relations
  relations: DocumentRelation[] = [];

  // Image loading
  imageReadyToBeLoaded: string | null = null;
  deleteFilesAfterLoading: string[] | null = null;

  // Events
  onDoubleClick: ((entity: DocumentEntity) => Promise<void>) | null = null;
  onMenuClick: ((entity: DocumentEntity, menuItemHeader: string, tag: any) => Promise<void>) | null = null;
  onDragStart: ((entity: DocumentEntity) => void) | null = null;

  constructor(
    title: string = "",
    organization: string = "",
    furtherInfo: string = "",
    countryCodes: string[] = []
  ) {
    this.title = title;
    this.organization = organization;
    this.furtherInfo = furtherInfo;
    this.countryCodes = countryCodes;
  }

  /**
   * Raise double click event
   */
  async raiseDoubleClick(): Promise<void> {
    if (this.onDoubleClick) {
      await this.onDoubleClick(this);
    }
  }

  /**
   * Raise menu click event
   */
  async raiseMenuClick(menuItemHeader: string, tag: any): Promise<void> {
    if (this.onMenuClick) {
      await this.onMenuClick(this, menuItemHeader, tag);
    }
  }

  /**
   * Raise drag start event
   */
  raiseDragStart(): void {
    if (this.onDragStart) {
      this.onDragStart(this);
    }
  }

  /**
   * Create FileInfo from AAS File element
   */
  static createFileInfo(aasId: string, smId: string, file: AasFile | null): FileInfo | null {
    if (!file) {
      return null;
    }

    return {
      path: file.value || "",
      mimeType: file.contentType || "",
      aasId,
      smId,
      idShortPath: file.idShort || ""
    };
  }
}

// ============================================================================
// Document Entity List Parser
// ============================================================================

export class DocumentEntityList extends Array<DocumentEntity> {
  /**
   * Parse Submodel for V1.0 documents
   */
  static parseSubmodelForV10(
    packageHash: string,
    aasId: string,
    submodel: Submodel,
    defaultLang: string = "en",
    selectedDocClass: number = 0,
    selectedLanguage: string | null = null
  ): DocumentEntityList {
    const list = new DocumentEntityList();

    if (!submodel.submodelElements) {
      return list;
    }

    // Semantic IDs for V1.0
    const semIdDocument = "http://www.vdi.de/gma720/vdi2770/document";
    const semIdDocumentVersion = "http://www.vdi.de/gma720/vdi2770/documentversion";
    const semIdTitle = "http://www.vdi.de/gma720/vdi2770/title";
    const semIdOrganization = "http://www.vdi.de/gma720/vdi2770/organizationname";
    const semIdLanguage = "http://www.vdi.de/gma720/vdi2770/language";
    const semIdDigitalFile = "http://www.vdi.de/gma720/vdi2770/digitalfile";
    const semIdDocumentVersionId = "http://www.vdi.de/gma720/vdi2770/documentversionid";
    const semIdDate = "http://www.vdi.de/gma720/vdi2770/date";

    // Find all Document collections
    for (const smcDoc of this.findAllSemanticId(
      submodel.submodelElements,
      semIdDocument
    )) {
      if (smcDoc.modelType !== "SubmodelElementCollection") {
        continue;
      }

      const docCollection = smcDoc as SubmodelElementCollection;
      if (!docCollection.value) {
        continue;
      }

      // Find DocumentVersion collections
      for (const smcVer of this.findAllSemanticId(
        docCollection.value,
        semIdDocumentVersion
      )) {
        if (smcVer.modelType !== "SubmodelElementCollection") {
          continue;
        }

        const verCollection = smcVer as SubmodelElementCollection;
        if (!verCollection.value) {
          continue;
        }

        // Extract metadata
        const title = this.findFirstPropertyValue(verCollection.value, semIdTitle) ||
          this.findFirstMultiLangValue(verCollection.value, semIdTitle, defaultLang) ||
          "";

        const organization = this.findFirstPropertyValue(verCollection.value, semIdOrganization) || "";

        // Extract language codes
        const countryCodes = this.findAllPropertyValues(verCollection.value, semIdLanguage);

        // Language filter
        if (selectedLanguage && countryCodes.length > 0) {
          if (!countryCodes.some(cc => cc.toLowerCase() === selectedLanguage.toLowerCase())) {
            continue;
          }
        }

        // Further info
        const versionId = this.findFirstPropertyValue(verCollection.value, semIdDocumentVersionId);
        const date = this.findFirstPropertyValue(verCollection.value, semIdDate);
        let furtherInfo = "";
        if (versionId) furtherInfo += ` · version: ${versionId}`;
        if (date) furtherInfo += ` · date: ${date}`;
        if (furtherInfo.length > 0) furtherInfo = furtherInfo.substring(2);

        // Create entity
        const entity = new DocumentEntity(title, organization, furtherInfo, countryCodes);
        entity.smVersion = SubmodelVersion.V10;
        entity.referableHash = `${packageHash}_${this.hashCode(smcDoc)}`;

        // Source elements
        entity.sourceElementsDocument = docCollection.value;
        entity.sourceElementsDocumentVersion = verCollection.value;

        // Digital file
        const digitalFile = this.findFirstFile(verCollection.value, semIdDigitalFile);
        if (digitalFile) {
          entity.digitalFile = DocumentEntity.createFileInfo(aasId, submodel.id, digitalFile);
        }

        list.push(entity);
      }
    }

    return list;
  }

  /**
   * Parse Submodel for V1.1 documents
   */
  static parseSubmodelForV11(
    packageHash: string,
    aasId: string,
    submodel: Submodel,
    defaultLang: string = "en",
    selectedDocClass: number = 0,
    selectedLanguage: string | null = null
  ): DocumentEntityList {
    const list = new DocumentEntityList();

    if (!submodel.submodelElements) {
      return list;
    }

    // Semantic IDs for V1.1
    const semIdDocument = "https://admin-shell.io/vdi/2770/1/1/Document";
    const semIdDocumentVersion = "https://admin-shell.io/vdi/2770/1/1/DocumentVersion";
    const semIdTitle = "https://admin-shell.io/vdi/2770/1/1/Title";
    const semIdSubTitle = "https://admin-shell.io/vdi/2770/1/1/SubTitle";
    const semIdOrganization = "https://admin-shell.io/vdi/2770/1/1/OrganizationOfficialName";
    const semIdLanguage = "https://admin-shell.io/vdi/2770/1/1/Language";
    const semIdDigitalFile = "https://admin-shell.io/vdi/2770/1/1/DigitalFile";
    const semIdPreviewFile = "https://admin-shell.io/vdi/2770/1/1/PreviewFile";
    const semIdDocumentVersionId = "https://admin-shell.io/vdi/2770/1/1/DocumentVersionId";
    const semIdDocumentIdValue = "https://admin-shell.io/vdi/2770/1/1/DocumentIdValue";
    const semIdSetDate = "https://admin-shell.io/vdi/2770/1/1/SetDate";

    // Find all Document collections
    for (const smcDoc of this.findAllSemanticId(
      submodel.submodelElements,
      semIdDocument
    )) {
      if (smcDoc.modelType !== "SubmodelElementCollection") {
        continue;
      }

      const docCollection = smcDoc as SubmodelElementCollection;
      if (!docCollection.value) {
        continue;
      }

      // Find DocumentVersion collections
      for (const smcVer of this.findAllSemanticId(
        docCollection.value,
        semIdDocumentVersion
      )) {
        if (smcVer.modelType !== "SubmodelElementCollection") {
          continue;
        }

        const verCollection = smcVer as SubmodelElementCollection;
        if (!verCollection.value) {
          continue;
        }

        // Extract metadata
        let title = this.findFirstPropertyValue(verCollection.value, semIdTitle) ||
          this.findFirstMultiLangValue(verCollection.value, semIdTitle, defaultLang) ||
          "";

        const subTitle = this.findFirstPropertyValue(verCollection.value, semIdSubTitle) ||
          this.findFirstMultiLangValue(verCollection.value, semIdSubTitle, defaultLang);

        if (subTitle) {
          title += ` – ${subTitle}`;
        }

        const organization = this.findFirstPropertyValue(verCollection.value, semIdOrganization) || "";

        // Extract language codes
        const countryCodes = this.findAllPropertyValues(verCollection.value, semIdLanguage);

        // Language filter
        if (selectedLanguage && countryCodes.length > 0) {
          if (!countryCodes.some(cc => cc.toLowerCase() === selectedLanguage.toLowerCase())) {
            continue;
          }
        }

        // Further info
        const versionId = this.findFirstPropertyValue(verCollection.value, semIdDocumentVersionId);
        const docId = this.findFirstPropertyValue(verCollection.value, semIdDocumentIdValue);
        const date = this.findFirstPropertyValue(verCollection.value, semIdSetDate);
        let furtherInfo = "";
        if (versionId) furtherInfo += ` · version: ${versionId}`;
        if (docId) furtherInfo += ` · id: ${docId}`;
        if (date) furtherInfo += ` · date: ${date}`;
        if (furtherInfo.length > 0) furtherInfo = furtherInfo.substring(2);

        // Create entity
        const entity = new DocumentEntity(title, organization, furtherInfo, countryCodes);
        entity.smVersion = SubmodelVersion.V11;
        entity.referableHash = `${packageHash}_${this.hashCode(smcDoc)}`;

        // Source elements
        entity.sourceElementsDocument = docCollection.value;
        entity.sourceElementsDocumentVersion = verCollection.value;

        // Digital file
        const digitalFile = this.findFirstFile(verCollection.value, semIdDigitalFile);
        if (digitalFile) {
          entity.digitalFile = DocumentEntity.createFileInfo(aasId, submodel.id, digitalFile);
        }

        // Preview file
        const previewFile = this.findFirstFile(verCollection.value, semIdPreviewFile);
        if (previewFile) {
          entity.previewFile = DocumentEntity.createFileInfo(aasId, submodel.id, previewFile);
        }

        list.push(entity);
      }
    }

    return list;
  }

  /**
   * Parse Submodel for V1.2 documents
   */
  static parseSubmodelForV12(
    packageHash: string,
    aasId: string,
    submodel: Submodel,
    defaultLang: string = "en",
    selectedDocClass: number = 0,
    selectedLanguage: string | null = null
  ): DocumentEntityList {
    const list = new DocumentEntityList();

    if (!submodel.submodelElements) {
      return list;
    }

    // Semantic IDs for V1.2 (IDTA Handover Documentation)
    const semIdDocument = "https://admin-shell.io/idta/HandoverDocumentation/1/2/Document";
    const semIdDocumentVersion = "https://admin-shell.io/idta/HandoverDocumentation/1/2/DocumentVersion";
    const semIdTitle = "https://admin-shell.io/idta/HandoverDocumentation/1/2/Title";
    const semIdSubTitle = "https://admin-shell.io/idta/HandoverDocumentation/1/2/SubTitle";
    const semIdOrganization = "https://admin-shell.io/idta/HandoverDocumentation/1/2/OrganizationOfficialName";
    const semIdLanguage = "https://admin-shell.io/idta/HandoverDocumentation/1/2/Language";
    const semIdDigitalFile = "https://admin-shell.io/idta/HandoverDocumentation/1/2/DigitalFile";
    const semIdPreviewFile = "https://admin-shell.io/idta/HandoverDocumentation/1/2/PreviewFile";
    const semIdDocumentVersionId = "https://admin-shell.io/idta/HandoverDocumentation/1/2/DocumentVersionId";
    const semIdValueId = "https://admin-shell.io/idta/HandoverDocumentation/1/2/ValueId";
    const semIdStatusSetDate = "https://admin-shell.io/idta/HandoverDocumentation/1/2/StatusSetDate";

    // Find all Document collections
    for (const smcDoc of this.findAllSemanticId(
      submodel.submodelElements,
      semIdDocument
    )) {
      if (smcDoc.modelType !== "SubmodelElementCollection") {
        continue;
      }

      const docCollection = smcDoc as SubmodelElementCollection;
      if (!docCollection.value) {
        continue;
      }

      // Find DocumentVersion collections
      for (const smcVer of this.findAllSemanticId(
        docCollection.value,
        semIdDocumentVersion
      )) {
        if (smcVer.modelType !== "SubmodelElementCollection") {
          continue;
        }

        const verCollection = smcVer as SubmodelElementCollection;
        if (!verCollection.value) {
          continue;
        }

        // Extract metadata
        let title = this.findFirstPropertyValue(verCollection.value, semIdTitle) ||
          this.findFirstMultiLangValue(verCollection.value, semIdTitle, defaultLang) ||
          "";

        const subTitle = this.findFirstPropertyValue(verCollection.value, semIdSubTitle) ||
          this.findFirstMultiLangValue(verCollection.value, semIdSubTitle, defaultLang);

        if (subTitle) {
          title += `\n${subTitle}`;
        }

        const organization = this.findFirstPropertyValue(verCollection.value, semIdOrganization) || "";

        // Extract language codes
        const countryCodes = this.findAllPropertyValues(verCollection.value, semIdLanguage);

        // Language filter
        if (selectedLanguage && countryCodes.length > 0) {
          if (!countryCodes.some(cc => cc.toLowerCase() === selectedLanguage.toLowerCase())) {
            continue;
          }
        }

        // Further info
        const versionId = this.findFirstPropertyValue(verCollection.value, semIdDocumentVersionId);
        const valueId = this.findFirstPropertyValue(verCollection.value, semIdValueId);
        const date = this.findFirstPropertyValue(verCollection.value, semIdStatusSetDate);
        let furtherInfo = "";
        if (versionId) furtherInfo += ` · version: ${versionId}`;
        if (valueId) furtherInfo += ` · id: ${valueId}`;
        if (date) furtherInfo += ` · date: ${date}`;
        if (furtherInfo.length > 0) furtherInfo = furtherInfo.substring(2);

        // Create entity
        const entity = new DocumentEntity(title, organization, furtherInfo, countryCodes);
        entity.smVersion = SubmodelVersion.V12;
        entity.referableHash = `${packageHash}_${this.hashCode(smcDoc)}`;

        // Source elements
        entity.sourceElementsDocument = docCollection.value;
        entity.sourceElementsDocumentVersion = verCollection.value;

        // Digital file
        const digitalFile = this.findFirstFile(verCollection.value, semIdDigitalFile);
        if (digitalFile) {
          entity.digitalFile = DocumentEntity.createFileInfo(aasId, submodel.id, digitalFile);
        }

        // Preview file
        const previewFile = this.findFirstFile(verCollection.value, semIdPreviewFile);
        if (previewFile) {
          entity.previewFile = DocumentEntity.createFileInfo(aasId, submodel.id, previewFile);
        }

        list.push(entity);
      }
    }

    return list;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Find all elements with matching semantic ID
   */
  private static findAllSemanticId(
    elements: SubmodelElement[],
    semanticId: string
  ): SubmodelElement[] {
    const results: SubmodelElement[] = [];

    for (const element of elements) {
      if (element.semanticId) {
        const lastKey = element.semanticId.keys[element.semanticId.keys.length - 1];
        if (lastKey && this.semanticIdMatches(lastKey.value, semanticId)) {
          results.push(element);
        }
      }
    }

    return results;
  }

  /**
   * Find first property value
   */
  private static findFirstPropertyValue(
    elements: SubmodelElement[],
    semanticId: string
  ): string | null {
    for (const element of elements) {
      if (element.modelType === "Property" && element.semanticId) {
        const lastKey = element.semanticId.keys[element.semanticId.keys.length - 1];
        if (lastKey && this.semanticIdMatches(lastKey.value, semanticId)) {
          return (element as Property).value || null;
        }
      }
    }
    return null;
  }

  /**
   * Find all property values
   */
  private static findAllPropertyValues(
    elements: SubmodelElement[],
    semanticId: string
  ): string[] {
    const values: string[] = [];

    for (const element of elements) {
      if (element.modelType === "Property" && element.semanticId) {
        const lastKey = element.semanticId.keys[element.semanticId.keys.length - 1];
        if (lastKey && this.semanticIdMatches(lastKey.value, semanticId)) {
          const value = (element as Property).value;
          if (value) {
            values.push(value);
          }
        }
      }
    }

    return values;
  }

  /**
   * Find first multi-language property value
   */
  private static findFirstMultiLangValue(
    elements: SubmodelElement[],
    semanticId: string,
    defaultLang: string
  ): string | null {
    for (const element of elements) {
      if (element.modelType === "MultiLanguageProperty" && element.semanticId) {
        const lastKey = element.semanticId.keys[element.semanticId.keys.length - 1];
        if (lastKey && this.semanticIdMatches(lastKey.value, semanticId)) {
          const mlp = element as MultiLanguageProperty;
          if (mlp.value) {
            // Try to find default language
            for (const langString of mlp.value) {
              if (langString.language === defaultLang) {
                return langString.text;
              }
            }
            // Return first available
            if (mlp.value.length > 0) {
              return mlp.value[0].text;
            }
          }
        }
      }
    }
    return null;
  }

  /**
   * Find first file element
   */
  private static findFirstFile(
    elements: SubmodelElement[],
    semanticId: string
  ): AasFile | null {
    for (const element of elements) {
      if (element.modelType === "File" && element.semanticId) {
        const lastKey = element.semanticId.keys[element.semanticId.keys.length - 1];
        if (lastKey && this.semanticIdMatches(lastKey.value, semanticId)) {
          return element as AasFile;
        }
      }
    }
    return null;
  }

  /**
   * Check if semantic IDs match (relaxed matching)
   */
  private static semanticIdMatches(value1: string, value2: string): boolean {
    const v1 = value1.toLowerCase().trim();
    const v2 = value2.toLowerCase().trim();

    // Exact match
    if (v1 === v2) {
      return true;
    }

    // Relaxed match - check if one contains the other
    return v1.includes(v2) || v2.includes(v1);
  }

  /**
   * Simple hash code generation
   */
  private static hashCode(obj: any): string {
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(14, "0");
  }
}
