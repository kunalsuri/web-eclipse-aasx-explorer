/**
 * Shared type definitions for IDTA Templates Integration
 * Used by both frontend and backend
 */

/**
 * Template release status
 */
export type TemplateStatus = 'released' | 'in-development' | 'deprecated';

/**
 * Template file format
 */
export type TemplateFileFormat = 'json' | 'aasx';

/**
 * IDTA Template metadata
 */
export interface IdtaTemplate {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  version: string;               // Semantic version (e.g., "1.0.0")
  description: string;           // Short description
  longDescription?: string;      // Detailed description
  semanticId: string;            // AAS semantic ID
  status: TemplateStatus;        // Release status
  category?: string;             // Template category/domain
  downloadUrl: string;           // GitHub download URL
  documentationUrl?: string;     // Link to docs
  fileFormat: TemplateFileFormat; // File format
  fileSize?: number;             // Size in bytes
  lastModified: string;          // ISO date string
  author: string;                // IDTA or organization
  tags?: string[];               // Searchable tags
  isDownloaded?: boolean;        // Download status (populated by backend)
}

/**
 * Submodel element structure for template preview
 */
export interface SubmodelElement {
  idShort: string;
  modelType: string;
  semanticId?: string;
  valueType?: string;
  description?: string;
  children?: SubmodelElement[];  // For nested structures
}

/**
 * Submodel structure for template details
 */
export interface SubmodelStructure {
  submodel: {
    idShort: string;
    semanticId: string;
    description?: string;
  };
  submodelElements: SubmodelElement[];
}

/**
 * Template filters for search and filtering
 */
export interface TemplateFilters {
  status: TemplateStatus | 'all';
  downloadStatus: 'downloaded' | 'not-downloaded' | 'all';
  category?: string;
}

/**
 * Cache metadata
 */
export interface CacheMetadata {
  templates: IdtaTemplate[];
  lastUpdated: string;           // ISO date string
  source: 'github';
  version: string;               // Cache format version
}

/**
 * Template information for viewer
 */
export interface TemplateInfo {
  id: string;
  name: string;
  version: string;
  isTemplate: true;
}

/**
 * Customization options for creating package from template
 */
export interface CustomizeIds {
  aasId?: string;
  aasIdShort?: string;
  submodelIds?: Record<string, string>; // Map of original ID to new ID
}

/**
 * Request to create package from template
 */
export interface CreateFromTemplateRequest {
  packageName: string;
  customizeIds?: CustomizeIds;
  includeSampleData?: boolean; // Default: false (empty values)
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Response from GET /api/idta-templates/list
 */
export interface TemplateListResponse {
  templates: IdtaTemplate[];
  lastUpdated: string;
  source: 'cache' | 'github';
}

/**
 * Response from GET /api/idta-templates/:id
 */
export interface TemplateDetailsResponse {
  template: IdtaTemplate;
  structure: SubmodelStructure;
  isDownloaded: boolean;
  localPath?: string;
}

/**
 * Request body for POST /api/idta-templates/:id/download
 */
export interface DownloadRequest {
  version?: string; // Optional, defaults to latest
}

/**
 * Response from POST /api/idta-templates/:id/download
 */
export interface DownloadResponse {
  success: boolean;
  templateId: string;
  localPath: string;
  version: string;
  alreadyExists?: boolean; // True if template was already downloaded
}

/**
 * Response from GET /api/idta-templates/:id/status
 */
export interface TemplateStatusResponse {
  isDownloaded: boolean;
  localVersion?: string;
  latestVersion: string;
  updateAvailable: boolean;
  localPath?: string;
}

/**
 * Response from GET /api/idta-templates/:id/environment
 */
export interface TemplateEnvironmentResponse {
  environment: any; // AAS Environment type (imported from aas-v3-types)
  templateInfo: TemplateInfo;
}

/**
 * Response from POST /api/idta-templates/:id/create-package
 */
export interface CreateFromTemplateResponse {
  success: boolean;
  packageId: string;
  packageName: string;
  environment: any; // AAS Environment type
  metadata: any; // PackageMetadata type
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error codes for IDTA template operations
 */
export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  GITHUB_API_ERROR = 'GITHUB_API_ERROR',
  DOWNLOAD_FAILED = 'DOWNLOAD_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  CACHE_ERROR = 'CACHE_ERROR',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
}

/**
 * Custom error class for IDTA template operations
 */
export class IdtaTemplateError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public details?: any
  ) {
    super(message);
    this.name = 'IdtaTemplateError';
  }
}

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.NETWORK_ERROR]: 'Unable to connect. Showing cached templates.',
  [ErrorCode.GITHUB_API_ERROR]: 'Template repository temporarily unavailable.',
  [ErrorCode.DOWNLOAD_FAILED]: 'Download failed. Please try again.',
  [ErrorCode.VALIDATION_FAILED]: 'Template file is invalid or corrupted.',
  [ErrorCode.CACHE_ERROR]: 'Unable to load cached data.',
  [ErrorCode.FILE_SYSTEM_ERROR]: 'Unable to save template locally.',
  [ErrorCode.TEMPLATE_NOT_FOUND]: 'Template not found.',
};
