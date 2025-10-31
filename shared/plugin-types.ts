/**
 * Plugin System Type Definitions
 * 
 * Defines the core types and interfaces for the plugin system,
 * including plugin manifests, API interfaces, and lifecycle hooks.
 * 
 * @module shared/plugin-types
 */

import type { Referable, Environment } from "./aas-v3-types";
import type { ValidationResult } from "./validation-types";

// ============================================================================
// Plugin Manifest Types
// ============================================================================

/**
 * Plugin manifest - describes a plugin's metadata and capabilities
 */
export interface PluginManifest {
  /** Unique plugin identifier (e.g., "export-table") */
  id: string;

  /** Human-readable plugin name */
  name: string;

  /** Semantic version (e.g., "1.0.0") */
  version: string;

  /** Plugin description */
  description: string;

  /** Plugin author information */
  author: {
    name: string;
    email: string;
    url?: string;
  };

  /** License identifier (e.g., "MIT", "Apache-2.0") */
  license: string;

  /** Plugin dependencies (other plugins required) */
  dependencies?: {
    [pluginId: string]: string; // version range (e.g., "^1.0.0")
  };

  /** Entry points for plugin code */
  main: string; // Server-side entry point
  client?: string; // Client-side entry point (optional)

  /** Plugin capabilities */
  capabilities: {
    ui?: boolean; // Has UI components
    api?: boolean; // Provides API endpoints
    background?: boolean; // Runs background tasks
  };

  /** Configuration schema (JSON Schema) */
  configSchema?: Record<string, any>;

  /** Required permissions */
  permissions: PluginPermission[];

  /** Plugin icon (optional) */
  icon?: string;

  /** Plugin homepage URL (optional) */
  homepage?: string;

  /** Plugin repository URL (optional) */
  repository?: string;
}

/**
 * Plugin permissions
 */
export type PluginPermission =
  | "read:environment" // Read AAS environment data
  | "write:environment" // Modify AAS environment data
  | "read:files" // Read files from file system
  | "write:files" // Write files to file system
  | "network" // Make network requests
  | "storage" // Access plugin storage
  | "ui:register" // Register UI components
  | "api:register"; // Register API endpoints

// ============================================================================
// Plugin Lifecycle Types
// ============================================================================

/**
 * Plugin instance - represents a loaded and initialized plugin
 */
export interface Plugin {
  /** Plugin manifest */
  manifest: PluginManifest;

  /** Plugin enabled state */
  enabled: boolean;

  /** Plugin initialization state */
  initialized: boolean;

  /** Plugin configuration */
  config: Record<string, any>;

  /** Lifecycle hooks */
  initialize: (api: PluginAPI) => Promise<void>;
  activate: () => Promise<void>;
  deactivate: () => Promise<void>;
  dispose?: () => Promise<void>;

  /** UI integration (if capabilities.ui is true) */
  components?: PluginComponent[];
  menuItems?: MenuItem[];
  toolbarButtons?: ToolbarButton[];

  /** API integration (if capabilities.api is true) */
  routes?: PluginRoute[];
}

// ============================================================================
// Plugin API Types
// ============================================================================

/**
 * Plugin API - provides access to core application services
 */
export interface PluginAPI {
  // ========== Element Operations ==========

  /**
   * Get an element by ID
   */
  getElement: (id: string) => Promise<Referable | null>;

  /**
   * Update an element
   */
  updateElement: (id: string, data: Partial<Referable>) => Promise<void>;

  /**
   * Delete an element
   */
  deleteElement: (id: string) => Promise<void>;

  /**
   * Create a new element
   */
  createElement: (
    parentId: string,
    element: Referable,
    position?: number
  ) => Promise<string>;

  // ========== Environment Operations ==========

  /**
   * Get the current environment
   */
  getEnvironment: () => Promise<Environment>;

  /**
   * Update the environment
   */
  updateEnvironment: (environment: Environment) => Promise<void>;

  // ========== Validation Operations ==========

  /**
   * Validate an element
   */
  validate: (element: Referable) => Promise<ValidationResult[]>;

  /**
   * Validate the entire environment
   */
  validateEnvironment: () => Promise<ValidationResult[]>;

  // ========== UI Integration ==========

  /**
   * Register a UI component
   */
  registerComponent: (component: PluginComponent) => void;

  /**
   * Register a menu item
   */
  registerMenuItem: (item: MenuItem) => void;

  /**
   * Register a toolbar button
   */
  registerToolbarButton: (button: ToolbarButton) => void;

  /**
   * Show a notification
   */
  showNotification: (
    message: string,
    type: "info" | "success" | "warning" | "error"
  ) => void;

  /**
   * Show a dialog
   */
  showDialog: (dialog: DialogOptions) => Promise<any>;

  // ========== Storage Operations ==========

  /**
   * Get plugin data from storage
   */
  getPluginData: (key: string) => Promise<any>;

  /**
   * Set plugin data in storage
   */
  setPluginData: (key: string, value: any) => Promise<void>;

  /**
   * Delete plugin data from storage
   */
  deletePluginData: (key: string) => Promise<void>;

  // ========== File Operations ==========

  /**
   * Read a file
   */
  readFile: (path: string) => Promise<Buffer>;

  /**
   * Write a file
   */
  writeFile: (path: string, data: Buffer) => Promise<void>;

  /**
   * Delete a file
   */
  deleteFile: (path: string) => Promise<void>;

  // ========== Network Operations ==========

  /**
   * Make an HTTP request
   */
  fetch: (url: string, options?: RequestInit) => Promise<Response>;

  // ========== Plugin Information ==========

  /**
   * Get plugin manifest
   */
  getManifest: () => PluginManifest;

  /**
   * Get plugin configuration
   */
  getConfig: () => Record<string, any>;

  /**
   * Update plugin configuration
   */
  updateConfig: (config: Record<string, any>) => Promise<void>;
}

// ============================================================================
// UI Integration Types
// ============================================================================

/**
 * Plugin component - UI component provided by a plugin
 */
export interface PluginComponent {
  /** Unique component ID */
  id: string;

  /** Component type */
  type: "panel" | "dialog" | "editor" | "viewer" | "widget";

  /** React component */
  component: React.ComponentType<any>;

  /** Component props */
  props?: Record<string, any>;

  /** Component title */
  title?: string;

  /** Component icon */
  icon?: string;

  /** Where to render the component */
  location?:
    | "sidebar"
    | "main"
    | "toolbar"
    | "statusbar"
    | "contextmenu"
    | "dialog";
}

/**
 * Menu item - menu item provided by a plugin
 */
export interface MenuItem {
  /** Unique menu item ID */
  id: string;

  /** Menu item label */
  label: string;

  /** Menu item icon */
  icon?: string;

  /** Menu item action */
  action: () => void | Promise<void>;

  /** Menu item keyboard shortcut */
  shortcut?: string;

  /** Menu item enabled state */
  enabled?: boolean;

  /** Submenu items */
  submenu?: MenuItem[];

  /** Menu location */
  location: "file" | "edit" | "view" | "tools" | "help" | "context";
}

/**
 * Toolbar button - toolbar button provided by a plugin
 */
export interface ToolbarButton {
  /** Unique button ID */
  id: string;

  /** Button label */
  label: string;

  /** Button icon */
  icon: string;

  /** Button action */
  action: () => void | Promise<void>;

  /** Button tooltip */
  tooltip?: string;

  /** Button enabled state */
  enabled?: boolean;

  /** Button location */
  location: "main" | "secondary";
}

/**
 * Dialog options
 */
export interface DialogOptions {
  /** Dialog title */
  title: string;

  /** Dialog message */
  message?: string;

  /** Dialog type */
  type: "info" | "warning" | "error" | "confirm" | "prompt" | "custom";

  /** Dialog buttons */
  buttons?: DialogButton[];

  /** Custom dialog component */
  component?: React.ComponentType<any>;

  /** Dialog props */
  props?: Record<string, any>;
}

/**
 * Dialog button
 */
export interface DialogButton {
  /** Button label */
  label: string;

  /** Button action */
  action: () => void | Promise<void>;

  /** Button variant */
  variant?: "primary" | "secondary" | "danger";
}

// ============================================================================
// API Integration Types
// ============================================================================

/**
 * Plugin route - API route provided by a plugin
 */
export interface PluginRoute {
  /** HTTP method */
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

  /** Route path (relative to /api/plugins/:pluginId) */
  path: string;

  /** Route handler */
  handler: (req: any, res: any) => void | Promise<void>;

  /** Route middleware */
  middleware?: Array<(req: any, res: any, next: any) => void>;

  /** Route description */
  description?: string;
}

// ============================================================================
// Plugin Registry Types
// ============================================================================

/**
 * Plugin registry entry
 */
export interface PluginRegistryEntry {
  /** Plugin manifest */
  manifest: PluginManifest;

  /** Plugin instance */
  instance: Plugin | null;

  /** Plugin state */
  state: PluginState;

  /** Plugin error (if failed to load) */
  error?: Error;

  /** Plugin load time */
  loadedAt?: Date;

  /** Plugin activation time */
  activatedAt?: Date;
}

/**
 * Plugin state
 */
export type PluginState =
  | "unloaded" // Not loaded yet
  | "loading" // Currently loading
  | "loaded" // Loaded but not initialized
  | "initializing" // Currently initializing
  | "initialized" // Initialized but not activated
  | "activating" // Currently activating
  | "active" // Active and running
  | "deactivating" // Currently deactivating
  | "deactivated" // Deactivated
  | "error"; // Failed to load or initialize

// ============================================================================
// Plugin Configuration Types
// ============================================================================

/**
 * Plugin configuration
 */
export interface PluginConfiguration {
  /** Plugin ID */
  pluginId: string;

  /** Plugin enabled state */
  enabled: boolean;

  /** Plugin configuration values */
  config: Record<string, any>;

  /** Plugin auto-start on application launch */
  autoStart?: boolean;

  /** Plugin priority (for load order) */
  priority?: number;
}

// ============================================================================
// Plugin Events Types
// ============================================================================

/**
 * Plugin event
 */
export interface PluginEvent {
  /** Event type */
  type: PluginEventType;

  /** Plugin ID */
  pluginId: string;

  /** Event timestamp */
  timestamp: Date;

  /** Event data */
  data?: any;
}

/**
 * Plugin event type
 */
export type PluginEventType =
  | "plugin:loaded"
  | "plugin:initialized"
  | "plugin:activated"
  | "plugin:deactivated"
  | "plugin:error"
  | "plugin:config:changed";

// ============================================================================
// Plugin Storage Types
// ============================================================================

/**
 * Plugin storage interface
 */
export interface PluginStorage {
  /** Get a value from storage */
  get: (key: string) => Promise<any>;

  /** Set a value in storage */
  set: (key: string, value: any) => Promise<void>;

  /** Delete a value from storage */
  delete: (key: string) => Promise<void>;

  /** Clear all storage */
  clear: () => Promise<void>;

  /** Get all keys */
  keys: () => Promise<string[]>;

  /** Check if a key exists */
  has: (key: string) => Promise<boolean>;
}

// All types are exported inline above
