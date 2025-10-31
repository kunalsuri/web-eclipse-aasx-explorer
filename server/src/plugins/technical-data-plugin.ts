/**
 * Technical Data Plugin
 * 
 * TypeScript adaptation of C# AasxPluginTechnicalData
 * Based on: /x-external-proj/idta-aasx-package-explorer/src/AasxPluginTechnicalData/Plugin.cs
 * 
 * Provides visual extension for Technical Data Submodels (ZVEI/IDTA)
 * Supports V1.0, V1.1, and V1.2 of the technical data standard
 */

import type {
  IAasxPlugin,
  AasxPluginActionDescription,
  AasxPluginResultBase,
  AasxPluginResultVisualExtension,
  AasxPluginResultBaseObject,
  PluginContext
} from "../../../shared/plugin-types";
import type { Submodel, Reference } from "../../../shared/aas-v3-types";
import { KeyTypes } from "../../../shared/aas-v3-types";

// ============================================================================
// Technical Data Options
// ============================================================================

export interface TechnicalDataOptionsRecord {
  /**
   * Allowed semantic IDs for Submodels
   */
  allowSubmodelSemanticId: Array<{
    type: KeyTypes;
    value: string;
  }>;
}

export interface TechnicalDataOptions {
  records: TechnicalDataOptionsRecord[];
}

/**
 * Create default Technical Data options
 */
export function createDefaultTechnicalDataOptions(): TechnicalDataOptions {
  const options: TechnicalDataOptions = {
    records: []
  };

  // V1.0 - ZVEI Technical Data
  const rec10: TechnicalDataOptionsRecord = {
    allowSubmodelSemanticId: [
      {
        type: KeyTypes.Submodel,
        value: "https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/0"
      }
    ]
  };
  options.records.push(rec10);

  // V1.1 - ZVEI Technical Data
  const rec11: TechnicalDataOptionsRecord = {
    allowSubmodelSemanticId: [
      {
        type: KeyTypes.Submodel,
        value: "https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/1"
      }
    ]
  };
  options.records.push(rec11);

  // V1.2 - IDTA Technical Data
  const rec12: TechnicalDataOptionsRecord = {
    allowSubmodelSemanticId: [
      {
        type: KeyTypes.Submodel,
        value: "https://admin-shell.io/IDTA/TechnicalData/1/2"
      }
    ]
  };
  options.records.push(rec12);

  return options;
}

// ============================================================================
// Technical Data Plugin Session
// ============================================================================

export interface TechnicalDataSession {
  sessionId: string;
  anyUiControl: any; // Will be populated by React component
}

// ============================================================================
// Technical Data Plugin Class
// ============================================================================

export class TechnicalDataPlugin implements IAasxPlugin {
  private options: TechnicalDataOptions;
  private context: PluginContext | null = null;
  private readonly sessions: Map<string, TechnicalDataSession> = new Map();

  constructor() {
    this.options = createDefaultTechnicalDataOptions();
  }

  /**
   * Get plugin name
   */
  getPluginName(): string {
    return "AasxPluginTechnicalData";
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
      tag: "TED",
      caption: "Technical Data Viewer"
    };

    return result;
  }

  /**
   * Fill visual extension with UI controls
   */
  private handleFillVisualExtension(args: any[]): AasxPluginResultBase | null {
    // Arguments: package, submodel, panel, display-context, session-id, operation-context, security-handler
    if (args.length < 7) {
      return null;
    }

    const sessionId = args[4] as string;

    // Create new session
    const session: TechnicalDataSession = {
      sessionId,
      anyUiControl: {
        // Will be populated by React component
        package: args[0],
        submodel: args[1],
        panel: args[2],
        displayContext: args[3],
        operationContext: args[5],
        securityHandler: args[6],
        options: this.options
      }
    };

    this.sessions.set(sessionId, session);

    // Return session control
    const result: AasxPluginResultBaseObject = {
      strType: "TechnicalDataControl",
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
      const newOptions = args[0] as TechnicalDataOptions;
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
      strType: "TechnicalDataOptions",
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
        shortLicense: "The application uses one class provided under The Code Project Open License (CPOL).",
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

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Index options for fast semantic ID lookup
   */
  private indexOptions(): void {
    // Build index of semantic IDs for fast matching
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
        if (this.keysMatch(lastKey.value, allowedKey.value)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if two key values match
   */
  private keysMatch(value1: string, value2: string): boolean {
    // Normalize values for comparison
    const v1 = value1.toLowerCase().trim();
    const v2 = value2.toLowerCase().trim();

    // Exact match
    if (v1 === v2) {
      return true;
    }

    // Relaxed match - check if one contains the other
    return v1.includes(v2) || v2.includes(v1);
  }
}
