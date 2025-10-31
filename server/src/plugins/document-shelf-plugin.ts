/**
 * Document Shelf Plugin
 * 
 * TypeScript adaptation of C# AasxPluginDocumentShelf
 * Based on: /x-external-proj/idta-aasx-package-explorer/src/AasxPluginDocumentShelf/Plugin.cs
 * 
 * Provides visual extension for VDI 2770 / IDTA Handover Documentation Submodels
 * Supports V1.0, V1.1, and V1.2 of the documentation standard
 */

import type {
  IAasxPlugin,
  AasxPluginActionDescription,
  AasxPluginResultBase,
  AasxPluginResultVisualExtension,
  AasxPluginResultBaseObject,
  PluginContext,
  AasxPluginEventReturnBase
} from "../../../shared/plugin-types";
import type { Submodel, Key, Reference } from "../../../shared/aas-v3-types";
import { KeyTypes, ReferenceTypes } from "../../../shared/aas-v3-types";

// ============================================================================
// Document Shelf Options
// ============================================================================

export interface DocumentShelfOptionsRecord {
  /**
   * Force a specific version for parsing
   */
  forceVersion: "default" | "v10" | "v11" | "v12";

  /**
   * Usage information for this record
   */
  usageInfo?: string;

  /**
   * Allowed semantic IDs for Submodels
   */
  allowSubmodelSemanticId: Key[];
}

export interface DocumentShelfOptions {
  records: DocumentShelfOptionsRecord[];
}

/**
 * Create default Document Shelf options
 */
export function createDefaultDocumentShelfOptions(): DocumentShelfOptions {
  const options: DocumentShelfOptions = {
    records: []
  };

  // Basic record for VDI 2770 versions
  const basicRecord: DocumentShelfOptionsRecord = {
    forceVersion: "default",
    allowSubmodelSemanticId: [
      // V1.0 - VDI 2770 Documentation
      {
        type: KeyTypes.Submodel,
        value: "http://www.vdi.de/gma720/vdi2770/documentation"
      },
      // V1.1 - VDI 2770 Manufacturer Documentation
      {
        type: KeyTypes.Submodel,
        value: "https://admin-shell.io/vdi/2770/1/1/ManufacturerDocumentation"
      },
      // V1.2 - IDTA Handover Documentation
      {
        type: KeyTypes.Submodel,
        value: "https://admin-shell.io/idta/HandoverDocumentation/1/2"
      }
    ]
  };
  options.records.push(basicRecord);

  // CAD and engineering tools record
  const cadRecord: DocumentShelfOptionsRecord = {
    forceVersion: "v12",
    usageInfo: "Some manufacturers use manufacturer documentation to provide models for " +
      "Computer Aided Design (CAD) and further engineering tools.",
    allowSubmodelSemanticId: [
      {
        type: KeyTypes.Submodel,
        value: "smart.festo.com/AAS/Submodel/ComputerAidedDesign/1/0"
      },
      {
        type: KeyTypes.Submodel,
        value: "https://admin-shell.io/sandbox/idta/handover/MCAD/0/1/"
      },
      {
        type: KeyTypes.Submodel,
        value: "https://admin-shell.io/sandbox/idta/handover/EFCAD/0/1/"
      },
      {
        type: KeyTypes.Submodel,
        value: "https://admin-shell.io/sandbox/idta/handover/PLC/0/1/"
      }
    ]
  };
  options.records.push(cadRecord);

  return options;
}

// ============================================================================
// Document Shelf Plugin Session
// ============================================================================

export interface DocumentShelfSession {
  sessionId: string;
  anyUiControl: any; // Will be implemented in UI component
}

// ============================================================================
// Document Shelf Plugin Class
// ============================================================================

export class DocumentShelfPlugin implements IAasxPlugin {
  private options: DocumentShelfOptions;
  private context: PluginContext | null = null;
  private sessions: Map<string, DocumentShelfSession> = new Map();

  constructor() {
    this.options = createDefaultDocumentShelfOptions();
  }

  /**
   * Get plugin name
   */
  getPluginName(): string {
    return "AasxPluginDocumentShelf";
  }

  /**
   * Initialize plugin
   */
  initPlugin(args: string[]): void {
    if (this.context) {
      this.context.logger.info("InitPlugin() called with args = {0}", args.join(", "));
    }

    // Load options from context if available
    if (this.context?.options) {
      this.options = { ...this.options, ...this.context.options };
    }

    // Index semantic IDs for fast lookup
    this.indexOptions();
  }

  /**
   * Check for log messages
   */
  checkForLogMessage(): string | null {
    if (!this.context) {
      return null;
    }
    return this.context.logger.popMessage();
  }

  /**
   * List available actions
   */
  listActions(): AasxPluginActionDescription[] {
    return [
      {
        name: "call-check-visual-extension",
        info: "Checks if the plugin can provide a visual extension for a Submodel"
      },
      {
        name: "get-check-visual-extension",
        info: "Returns true if visual extension is available"
      },
      {
        name: "fill-anyui-visual-extension",
        info: "Creates and fills the visual extension UI"
      },
      {
        name: "update-anyui-visual-extension",
        info: "Updates the visual extension UI"
      },
      {
        name: "dispose-anyui-visual-extension",
        info: "Disposes the visual extension UI"
      },
      {
        name: "set-json-options",
        info: "Sets plugin options from JSON"
      },
      {
        name: "get-json-options",
        info: "Gets plugin options as JSON"
      },
      {
        name: "get-licenses",
        info: "Returns license information"
      },
      {
        name: "get-events",
        info: "Returns pending events from event stack"
      },
      {
        name: "event-return",
        info: "Handles event return from UI"
      },
      {
        name: "get-list-new-submodel",
        info: "Returns list of Submodel templates that can be created"
      },
      {
        name: "generate-submodel",
        info: "Generates a new Submodel from template"
      }
    ];
  }

  /**
   * Activate an action
   */
  activateAction(action: string, ...args: any[]): AasxPluginResultBase | null {
    // Most frequently used action first
    if (action === "call-check-visual-extension") {
      return this.handleCheckVisualExtension(args);
    }

    if (action === "get-check-visual-extension") {
      const result: AasxPluginResultBaseObject = {
        strType: "True",
        obj: true
      };
      return result;
    }

    if (action === "fill-anyui-visual-extension") {
      return this.handleFillVisualExtension(args);
    }

    if (action === "update-anyui-visual-extension") {
      return this.handleUpdateVisualExtension(args);
    }

    if (action === "dispose-anyui-visual-extension") {
      return this.handleDisposeVisualExtension(args);
    }

    if (action === "set-json-options") {
      return this.handleSetOptions(args);
    }

    if (action === "get-json-options") {
      return this.handleGetOptions();
    }

    if (action === "get-licenses") {
      return this.handleGetLicenses();
    }

    if (action === "get-events") {
      return this.handleGetEvents();
    }

    if (action === "event-return") {
      return this.handleEventReturn(args);
    }

    if (action === "get-list-new-submodel") {
      return this.handleGetListNewSubmodel();
    }

    if (action === "generate-submodel") {
      return this.handleGenerateSubmodel(args);
    }

    return null;
  }

  /**
   * Set plugin context
   */
  setContext(context: PluginContext): void {
    this.context = context;
  }

  // ============================================================================
  // Action Handlers
  // ============================================================================

  /**
   * Check if plugin can provide visual extension for a Submodel
   */
  private handleCheckVisualExtension(args: any[]): AasxPluginResultBase | null {
    if (args.length < 1) {
      return null;
    }

    // Looking only for Submodels
    const sm = args[0] as Submodel;
    if (!sm || !sm.semanticId) {
      return null;
    }

    // Check if Submodel semantic ID matches any record
    const found = this.matchesSemanticId(sm.semanticId);
    if (!found) {
      return null;
    }

    // Success - prepare visual extension record
    const result: AasxPluginResultVisualExtension = {
      tag: "DOC",
      caption: "Document Shelf"
    };

    return result;
  }

  /**
   * Fill visual extension with UI controls
   */
  private handleFillVisualExtension(args: any[]): AasxPluginResultBase | null {
    // Arguments: package, submodel, panel, display-context, session-id, operation-context
    if (args.length < 6) {
      return null;
    }

    const sessionId = args[4] as string;

    // Create new session
    const session: DocumentShelfSession = {
      sessionId,
      anyUiControl: {
        // Will be populated by React component
        package: args[0],
        submodel: args[1],
        panel: args[2],
        displayContext: args[3],
        operationContext: args[5],
        options: this.options
      }
    };

    this.sessions.set(sessionId, session);

    // Return session control
    const result: AasxPluginResultBaseObject = {
      strType: "DocumentShelfControl",
      obj: session.anyUiControl
    };

    return result;
  }

  /**
   * Update visual extension
   */
  private handleUpdateVisualExtension(args: any[]): AasxPluginResultBase | null {
    // Arguments: panel, display-context, session-id
    if (args.length < 3) {
      return null;
    }

    const sessionId = args[2] as string;
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Update session control
    if (session.anyUiControl) {
      session.anyUiControl.panel = args[0];
      session.anyUiControl.displayContext = args[1];
    }

    const result: AasxPluginResultBaseObject = {
      strType: "Updated",
      obj: 42
    };

    return result;
  }

  /**
   * Dispose visual extension
   */
  private handleDisposeVisualExtension(args: any[]): AasxPluginResultBase | null {
    // Arguments: session-id
    if (args.length < 1) {
      return null;
    }

    const sessionId = args[0] as string;
    const session = this.sessions.get(sessionId);

    if (session) {
      // Cleanup resources
      if (session.anyUiControl) {
        session.anyUiControl = null;
      }

      // Remove session
      this.sessions.delete(sessionId);
    }

    return null;
  }

  /**
   * Set plugin options
   */
  private handleSetOptions(args: any[]): AasxPluginResultBase | null {
    if (args.length < 1) {
      return null;
    }

    try {
      const newOptions = args[0] as DocumentShelfOptions;
      this.options = { ...this.options, ...newOptions };
      this.indexOptions();

      const result: AasxPluginResultBaseObject = {
        strType: "OK",
        obj: true
      };

      return result;
    } catch (error) {
      if (this.context) {
        this.context.logger.error("Failed to set options", error as Error);
      }
      return null;
    }
  }

  /**
   * Get plugin options
   */
  private handleGetOptions(): AasxPluginResultBase | null {
    const result: AasxPluginResultBaseObject = {
      strType: "DocumentShelfOptions",
      obj: this.options
    };

    return result;
  }

  /**
   * Get license information
   */
  private handleGetLicenses(): AasxPluginResultBase | null {
    const result: AasxPluginResultBaseObject = {
      strType: "License",
      obj: {
        shortLicense: "Document Shelf Plugin - Apache License 2.0",
        isStandardLicense: true,
        longLicense: "Licensed under the Apache License, Version 2.0"
      }
    };

    return result;
  }

  /**
   * Get pending events
   */
  private handleGetEvents(): AasxPluginResultBase | null {
    if (!this.context) {
      return null;
    }

    const events: any[] = [];
    while (this.context.eventStack.hasEvents()) {
      const event = this.context.eventStack.popEvent();
      if (event) {
        events.push(event);
      }
    }

    const result: AasxPluginResultBaseObject = {
      strType: "Events",
      obj: events
    };

    return result;
  }

  /**
   * Handle event return from UI
   */
  private handleEventReturn(args: any[]): AasxPluginResultBase | null {
    // Arguments: event-return-base, session-id
    if (args.length < 2) {
      return null;
    }

    const eventReturn = args[0] as AasxPluginEventReturnBase;
    const sessionId = args[1] as string;
    const session = this.sessions.get(sessionId);

    if (session && session.anyUiControl) {
      // Handle event return in UI control
      // This will be implemented in the React component
      if (this.context) {
        this.context.logger.debug("Event return received for session {0}", sessionId);
      }
    }

    return null;
  }

  /**
   * Get list of Submodel templates
   */
  private handleGetListNewSubmodel(): AasxPluginResultBase | null {
    const list = [
      "Documentation (V1.2)",
      "Documentation (V1.1)",
      "Documentation (V1.0)"
    ];

    const result: AasxPluginResultBaseObject = {
      strType: "SubmodelList",
      obj: list
    };

    return result;
  }

  /**
   * Generate a new Submodel from template
   */
  private handleGenerateSubmodel(args: any[]): AasxPluginResultBase | null {
    if (args.length < 1 || typeof args[0] !== "string") {
      return null;
    }

    const smName = args[0] as string;
    let sm: Partial<Submodel>;

    if (smName.includes("V1.1")) {
      sm = {
        id: "",
        idShort: "ManufacturerDocumentation",
        semanticId: {
          type: ReferenceTypes.ExternalReference,
          keys: [{
            type: KeyTypes.Submodel,
            value: "https://admin-shell.io/vdi/2770/1/1/ManufacturerDocumentation"
          }]
        },
        submodelElements: []
      };
    } else if (smName.includes("V1.0")) {
      sm = {
        id: "",
        idShort: "Documentation",
        semanticId: {
          type: ReferenceTypes.ExternalReference,
          keys: [{
            type: KeyTypes.Submodel,
            value: "http://www.vdi.de/gma720/vdi2770/documentation"
          }]
        },
        submodelElements: []
      };
    } else {
      // V1.2 (default)
      sm = {
        id: "",
        idShort: "HandoverDocumentation",
        semanticId: {
          type: ReferenceTypes.ExternalReference,
          keys: [{
            type: KeyTypes.Submodel,
            value: "https://admin-shell.io/idta/HandoverDocumentation/1/2"
          }]
        },
        submodelElements: []
      };
    }

    const result: AasxPluginResultBaseObject = {
      strType: "OK",
      obj: sm
    };

    return result;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Index options for fast semantic ID lookup
   */
  private indexOptions(): void {
    // Build index of semantic IDs for fast matching
    // This is called after options are loaded or updated
    if (this.context) {
      this.context.logger.debug("Indexed {0} option records", this.options.records.length);
    }
  }

  /**
   * Check if a semantic ID matches any record
   */
  private matchesSemanticId(semanticId: Reference): boolean {
    if (!semanticId.keys || semanticId.keys.length === 0) {
      return false;
    }

    // Get the last key (most specific)
    const lastKey = semanticId.keys[semanticId.keys.length - 1];

    // Check against all records
    for (const record of this.options.records) {
      for (const allowedKey of record.allowSubmodelSemanticId) {
        if (this.keysMatch(lastKey, allowedKey)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if two keys match
   */
  private keysMatch(key1: Key, key2: Key): boolean {
    // Normalize values for comparison
    const value1 = key1.value.toLowerCase().trim();
    const value2 = key2.value.toLowerCase().trim();

    // Exact match
    if (value1 === value2) {
      return true;
    }

    // Relaxed match - check if one contains the other
    return value1.includes(value2) || value2.includes(value1);
  }
}
