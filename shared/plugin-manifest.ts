/**
 * Plugin Manifest System
 * 
 * Defines the structure and validation for plugin manifests
 * Includes semantic versioning support and JSON schema validation
 */

// ============================================================================
// Plugin Manifest Interface
// ============================================================================

export interface PluginManifest {
  // Basic Information
  id: string;                    // Unique plugin identifier (e.g., "document-shelf")
  name: string;                  // Display name
  version: string;               // Semantic version (e.g., "1.0.0")
  description: string;           // Short description
  author: string;                // Author name
  license?: string;              // License type (e.g., "MIT", "Apache-2.0")
  homepage?: string;             // Plugin homepage URL
  repository?: string;           // Source code repository URL

  // Dependencies
  dependencies?: {
    [pluginId: string]: string;  // Plugin ID -> version range (e.g., "^1.0.0")
  };

  // Compatibility
  minAppVersion: string;         // Minimum app version required
  maxAppVersion?: string;        // Maximum app version supported

  // Entry Points
  main: string;                  // Main plugin file (e.g., "./index.js")

  // Capabilities
  capabilities: {
    ui?: boolean;                // Provides UI components
    dataTransform?: boolean;     // Transforms AAS data
    export?: boolean;            // Provides export functionality
    import?: boolean;            // Provides import functionality
    validation?: boolean;        // Provides validation rules
  };

  // Extension Points
  extensions?: {
    hooks?: string[];            // Hook IDs this plugin uses
    menus?: MenuExtension[];     // Menu items to add
    panels?: PanelExtension[];   // UI panels to add
  };

  // Settings Schema
  settings?: {
    [key: string]: SettingDefinition;
  };

  // Metadata
  keywords?: string[];           // Search keywords
  icon?: string;                 // Plugin icon path
  screenshots?: string[];        // Screenshot paths
}

export interface MenuExtension {
  id: string;
  label: string;
  location: "toolbar" | "context" | "main-menu";
  icon?: string;
  action: string;                // Action ID to trigger
  hotkey?: string;               // Keyboard shortcut (e.g., "Ctrl+Shift+D")
}

export interface PanelExtension {
  id: string;
  label: string;
  location: "sidebar" | "bottom" | "modal" | "floating";
  icon?: string;
  component: string;             // Component name to render
  defaultVisible?: boolean;      // Show by default
}

export interface SettingDefinition {
  type: "string" | "number" | "boolean" | "select" | "multiselect" | "color" | "file";
  label: string;
  description?: string;
  default?: any;
  options?: Array<{ label: string; value: any }>;
  min?: number;                  // For number type
  max?: number;                  // For number type
  pattern?: string;              // Regex pattern for string type
  required?: boolean;
}

// ============================================================================
// Semantic Version Support
// ============================================================================

export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
}

/**
 * Parse a semantic version string
 * @param version Version string (e.g., "1.2.3-beta.1+build.123")
 * @returns Parsed semantic version
 */
export function parseSemanticVersion(version: string): SemanticVersion {
  // Simplified regex to reduce complexity
  const regex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/;
  const match = regex.exec(version);

  if (!match) {
    throw new Error(`Invalid semantic version: ${version}`);
  }

  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
    prerelease: match[4],
    build: match[5]
  };
}

/**
 * Compare two semantic versions
 * @returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
export function compareSemanticVersions(v1: SemanticVersion, v2: SemanticVersion): number {
  // Compare major
  if (v1.major !== v2.major) {
    return v1.major > v2.major ? 1 : -1;
  }

  // Compare minor
  if (v1.minor !== v2.minor) {
    return v1.minor > v2.minor ? 1 : -1;
  }

  // Compare patch
  if (v1.patch !== v2.patch) {
    return v1.patch > v2.patch ? 1 : -1;
  }

  // Compare prerelease (no prerelease > prerelease)
  if (v1.prerelease && !v2.prerelease) {
    return -1;
  }
  if (!v1.prerelease && v2.prerelease) {
    return 1;
  }
  if (v1.prerelease && v2.prerelease) {
    return v1.prerelease.localeCompare(v2.prerelease);
  }

  return 0;
}

/**
 * Check if a version satisfies a version range
 * Supports: ^1.0.0, ~1.0.0, >=1.0.0, >1.0.0, <=1.0.0, <1.0.0, 1.0.0, *
 */
export function satisfiesVersionRange(version: string, range: string): boolean {
  if (range === "*") {
    return true;
  }

  const v = parseSemanticVersion(version);

  // Exact match
  if (!range.match(/^[~^<>=]/)) {
    const r = parseSemanticVersion(range);
    return compareSemanticVersions(v, r) === 0;
  }

  // Caret range (^1.2.3 = >=1.2.3 <2.0.0)
  if (range.startsWith("^")) {
    const r = parseSemanticVersion(range.slice(1));
    return v.major === r.major &&
      (v.minor > r.minor || (v.minor === r.minor && v.patch >= r.patch));
  }

  // Tilde range (~1.2.3 = >=1.2.3 <1.3.0)
  if (range.startsWith("~")) {
    const r = parseSemanticVersion(range.slice(1));
    return v.major === r.major && v.minor === r.minor && v.patch >= r.patch;
  }

  // Comparison operators
  const comparisonRegex = /^(>=|>|<=|<)(.+)$/;
  const match = comparisonRegex.exec(range);
  if (match) {
    const operator = match[1];
    const r = parseSemanticVersion(match[2]);
    const cmp = compareSemanticVersions(v, r);

    switch (operator) {
      case ">=":
        return cmp >= 0;
      case ">":
        return cmp > 0;
      case "<=":
        return cmp <= 0;
      case "<":
        return cmp < 0;
      default:
        return false;
    }
  }

  return false;
}

// ============================================================================
// Manifest Validation
// ============================================================================

export interface ManifestValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface ManifestValidationResult {
  valid: boolean;
  errors: ManifestValidationError[];
  warnings: ManifestValidationError[];
}

/**
 * Validate a plugin manifest
 */
export function validatePluginManifest(manifest: any): ManifestValidationResult {
  const errors: ManifestValidationError[] = [];
  const warnings: ManifestValidationError[] = [];

  // Required fields
  if (manifest.id) {
    if (!/^[a-z0-9-]+$/.test(manifest.id)) {
      errors.push({
        field: "id",
        message: "Plugin ID must contain only lowercase letters, numbers, and hyphens",
        severity: "error"
      });
    }
  } else {
    errors.push({ field: "id", message: "Plugin ID is required", severity: "error" });
  }

  if (!manifest.name) {
    errors.push({ field: "name", message: "Plugin name is required", severity: "error" });
  }

  if (manifest.version) {
    try {
      parseSemanticVersion(manifest.version);
    } catch {
      errors.push({
        field: "version",
        message: `Invalid semantic version: ${manifest.version}`,
        severity: "error"
      });
    }
  } else {
    errors.push({ field: "version", message: "Plugin version is required", severity: "error" });
  }

  if (!manifest.description) {
    warnings.push({
      field: "description",
      message: "Plugin description is recommended",
      severity: "warning"
    });
  }

  if (!manifest.author) {
    warnings.push({ field: "author", message: "Plugin author is recommended", severity: "warning" });
  }

  if (manifest.minAppVersion) {
    try {
      parseSemanticVersion(manifest.minAppVersion);
    } catch {
      errors.push({
        field: "minAppVersion",
        message: `Invalid semantic version: ${manifest.minAppVersion}`,
        severity: "error"
      });
    }
  } else {
    errors.push({
      field: "minAppVersion",
      message: "Minimum app version is required",
      severity: "error"
    });
  }

  if (manifest.maxAppVersion) {
    try {
      parseSemanticVersion(manifest.maxAppVersion);
    } catch {
      errors.push({
        field: "maxAppVersion",
        message: `Invalid semantic version: ${manifest.maxAppVersion}`,
        severity: "error"
      });
    }
  }

  if (!manifest.main) {
    errors.push({ field: "main", message: "Main entry point is required", severity: "error" });
  }

  if (!manifest.capabilities) {
    warnings.push({
      field: "capabilities",
      message: "Plugin capabilities should be specified",
      severity: "warning"
    });
  }

  // Validate dependencies
  if (manifest.dependencies && typeof manifest.dependencies === "object") {
    for (const [depId, depVersion] of Object.entries(manifest.dependencies)) {
      if (typeof depVersion !== "string") {
        errors.push({
          field: `dependencies.${depId}`,
          message: "Dependency version must be a string",
          severity: "error"
        });
      }
    }
  } else if (manifest.dependencies) {
    errors.push({
      field: "dependencies",
      message: "Dependencies must be an object",
      severity: "error"
    });
  }

  // Validate extensions
  if (manifest.extensions) {
    if (manifest.extensions.menus && Array.isArray(manifest.extensions.menus)) {
      for (const [index, menu] of manifest.extensions.menus.entries()) {
        if (!menu.id) {
          errors.push({
            field: `extensions.menus[${index}].id`,
            message: "Menu ID is required",
            severity: "error"
          });
        }
        if (!menu.label) {
          errors.push({
            field: `extensions.menus[${index}].label`,
            message: "Menu label is required",
            severity: "error"
          });
        }
        if (!menu.action) {
          errors.push({
            field: `extensions.menus[${index}].action`,
            message: "Menu action is required",
            severity: "error"
          });
        }
      }
    } else if (manifest.extensions.menus) {
      errors.push({
        field: "extensions.menus",
        message: "Menu extensions must be an array",
        severity: "error"
      });
    }

    if (manifest.extensions.panels && Array.isArray(manifest.extensions.panels)) {
      for (const [index, panel] of manifest.extensions.panels.entries()) {
        if (!panel.id) {
          errors.push({
            field: `extensions.panels[${index}].id`,
            message: "Panel ID is required",
            severity: "error"
          });
        }
        if (!panel.label) {
          errors.push({
            field: `extensions.panels[${index}].label`,
            message: "Panel label is required",
            severity: "error"
          });
        }
        if (!panel.component) {
          errors.push({
            field: `extensions.panels[${index}].component`,
            message: "Panel component is required",
            severity: "error"
          });
        }
      }
    } else if (manifest.extensions.panels) {
      errors.push({
        field: "extensions.panels",
        message: "Panel extensions must be an array",
        severity: "error"
      });
    }
  }

  // Validate settings
  if (manifest.settings && typeof manifest.settings === "object") {
    for (const [key, setting] of Object.entries(manifest.settings)) {
      const s = setting as any;
      if (!s.type) {
        errors.push({
          field: `settings.${key}.type`,
          message: "Setting type is required",
          severity: "error"
        });
      }
      if (!s.label) {
        errors.push({
          field: `settings.${key}.label`,
          message: "Setting label is required",
          severity: "error"
        });
      }
    }
  } else if (manifest.settings) {
    errors.push({
      field: "settings",
      message: "Settings must be an object",
      severity: "error"
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// JSON Schema for Manifest
// ============================================================================

export const PLUGIN_MANIFEST_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  required: ["id", "name", "version", "minAppVersion", "main", "capabilities"],
  properties: {
    id: {
      type: "string",
      pattern: "^[a-z0-9-]+$",
      description: "Unique plugin identifier"
    },
    name: {
      type: "string",
      minLength: 1,
      description: "Display name"
    },
    version: {
      type: "string",
      pattern: String.raw`^\d+\.\d+\.\d+`,
      description: "Semantic version"
    },
    description: {
      type: "string",
      description: "Short description"
    },
    author: {
      type: "string",
      description: "Author name"
    },
    license: {
      type: "string",
      description: "License type"
    },
    homepage: {
      type: "string",
      format: "uri",
      description: "Plugin homepage URL"
    },
    repository: {
      type: "string",
      format: "uri",
      description: "Source code repository URL"
    },
    dependencies: {
      type: "object",
      additionalProperties: {
        type: "string"
      },
      description: "Plugin dependencies"
    },
    minAppVersion: {
      type: "string",
      pattern: String.raw`^\d+\.\d+\.\d+`,
      description: "Minimum app version required"
    },
    maxAppVersion: {
      type: "string",
      pattern: String.raw`^\d+\.\d+\.\d+`,
      description: "Maximum app version supported"
    },
    main: {
      type: "string",
      description: "Main plugin file"
    },
    capabilities: {
      type: "object",
      properties: {
        ui: { type: "boolean" },
        dataTransform: { type: "boolean" },
        export: { type: "boolean" },
        import: { type: "boolean" },
        validation: { type: "boolean" }
      },
      description: "Plugin capabilities"
    },
    extensions: {
      type: "object",
      properties: {
        hooks: {
          type: "array",
          items: { type: "string" }
        },
        menus: {
          type: "array",
          items: {
            type: "object",
            required: ["id", "label", "action"],
            properties: {
              id: { type: "string" },
              label: { type: "string" },
              location: {
                type: "string",
                enum: ["toolbar", "context", "main-menu"]
              },
              icon: { type: "string" },
              action: { type: "string" },
              hotkey: { type: "string" }
            }
          }
        },
        panels: {
          type: "array",
          items: {
            type: "object",
            required: ["id", "label", "component"],
            properties: {
              id: { type: "string" },
              label: { type: "string" },
              location: {
                type: "string",
                enum: ["sidebar", "bottom", "modal", "floating"]
              },
              icon: { type: "string" },
              component: { type: "string" },
              defaultVisible: { type: "boolean" }
            }
          }
        }
      },
      description: "Extension points"
    },
    settings: {
      type: "object",
      additionalProperties: {
        type: "object",
        required: ["type", "label"],
        properties: {
          type: {
            type: "string",
            enum: ["string", "number", "boolean", "select", "multiselect", "color", "file"]
          },
          label: { type: "string" },
          description: { type: "string" },
          default: {},
          options: {
            type: "array",
            items: {
              type: "object",
              required: ["label", "value"],
              properties: {
                label: { type: "string" },
                value: {}
              }
            }
          },
          min: { type: "number" },
          max: { type: "number" },
          pattern: { type: "string" },
          required: { type: "boolean" }
        }
      },
      description: "Settings schema"
    },
    keywords: {
      type: "array",
      items: { type: "string" },
      description: "Search keywords"
    },
    icon: {
      type: "string",
      description: "Plugin icon path"
    },
    screenshots: {
      type: "array",
      items: { type: "string" },
      description: "Screenshot paths"
    }
  }
};
