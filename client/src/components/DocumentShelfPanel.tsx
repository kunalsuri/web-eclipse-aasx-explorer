/**
 * Document Shelf Panel Component
 * 
 * React component for displaying VDI 2770 documents in a list view
 * Supports filtering, searching, and document preview
 */

import { useState, useMemo, useCallback } from "react";
import { FileText, Search, Download, Eye, Globe } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface DocumentEntity {
  title: string;
  organization: string;
  furtherInfo: string;
  countryCodes: string[];
  digitalFile: FileInfo | null;
  previewFile: FileInfo | null;
  referableHash: string | null;
  smVersion: string;
}

export interface FileInfo {
  path: string;
  mimeType: string;
  aasId: string;
  smId: string;
  idShortPath: string;
}

interface DocumentShelfPanelProps {
  documents: DocumentEntity[];
  onDocumentClick?: (document: DocumentEntity) => void;
  onDocumentDoubleClick?: (document: DocumentEntity) => Promise<void>;
  onDownload?: (document: DocumentEntity) => void;
  onPreview?: (document: DocumentEntity) => void;
  defaultLanguage?: string;
}

// ============================================================================
// Document Card Component
// ============================================================================

interface DocumentCardProps {
  document: DocumentEntity;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onDownload?: () => void;
  onPreview?: () => void;
}

function DocumentCard({
  document,
  onClick,
  onDoubleClick,
  onDownload,
  onPreview
}: DocumentCardProps) {
  return (
    <div
      className="group relative flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onClick?.();
        }
      }}
    >
      {/* Header with icon and actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Document icon */}
          <div className="flex-shrink-0 rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>

          {/* Title and organization */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
              {document.title || "Untitled Document"}
            </h3>
            {document.organization && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {document.organization}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onPreview && document.previewFile && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
              className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Preview"
            >
              <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          {onDownload && document.digitalFile && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
              className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Download"
            >
              <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Further info */}
      {document.furtherInfo && (
        <p className="text-xs text-gray-500 dark:text-gray-500">
          {document.furtherInfo}
        </p>
      )}

      {/* Footer with language codes and file info */}
      <div className="flex items-center justify-between gap-3 text-xs">
        {/* Language codes */}
        {document.countryCodes.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              {document.countryCodes.join(", ")}
            </span>
          </div>
        )}

        {/* File type */}
        {document.digitalFile && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
            {getFileExtension(document.digitalFile.path)}
          </span>
        )}
      </div>

      {/* Version badge */}
      <div className="absolute top-2 right-2">
        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          {formatVersion(document.smVersion)}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Main Document Shelf Panel Component
// ============================================================================

export function DocumentShelfPanel({
  documents,
  onDocumentClick,
  onDocumentDoubleClick,
  onDownload,
  onPreview,
  defaultLanguage = "en"
}: DocumentShelfPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  // Extract unique languages and versions
  const { languages, versions } = useMemo(() => {
    const langSet = new Set<string>();
    const verSet = new Set<string>();

    for (const doc of documents) {
      for (const code of doc.countryCodes) {
        langSet.add(code);
      }
      verSet.add(doc.smVersion);
    }

    return {
      languages: Array.from(langSet).sort(),
      versions: Array.from(verSet).sort()
    };
  }, [documents]);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(query);
        const matchesOrg = doc.organization.toLowerCase().includes(query);
        const matchesInfo = doc.furtherInfo.toLowerCase().includes(query);

        if (!matchesTitle && !matchesOrg && !matchesInfo) {
          return false;
        }
      }

      // Language filter
      if (selectedLanguage) {
        if (!doc.countryCodes.includes(selectedLanguage)) {
          return false;
        }
      }

      // Version filter
      if (selectedVersion) {
        if (doc.smVersion !== selectedVersion) {
          return false;
        }
      }

      return true;
    });
  }, [documents, searchQuery, selectedLanguage, selectedVersion]);

  // Handle document click
  const handleDocumentClick = useCallback(
    (document: DocumentEntity) => {
      onDocumentClick?.(document);
    },
    [onDocumentClick]
  );

  // Handle document double click
  const handleDocumentDoubleClick = useCallback(
    async (document: DocumentEntity) => {
      if (onDocumentDoubleClick) {
        await onDocumentDoubleClick(document);
      }
    },
    [onDocumentDoubleClick]
  );

  // Handle download
  const handleDownload = useCallback(
    (document: DocumentEntity) => {
      onDownload?.(document);
    },
    [onDownload]
  );

  // Handle preview
  const handlePreview = useCallback(
    (document: DocumentEntity) => {
      onPreview?.(document);
    },
    [onPreview]
  );

  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Document Shelf
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {filteredDocuments.length} of {documents.length} documents
            </p>
          </div>
        </div>

        {/* Search and filters */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Language filter */}
          {languages.length > 0 && (
            <select
              value={selectedLanguage || ""}
              onChange={(e) => setSelectedLanguage(e.target.value || null)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              aria-label="Filter by language"
            >
              <option value="">All Languages</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          )}

          {/* Version filter */}
          {versions.length > 1 && (
            <select
              value={selectedVersion || ""}
              onChange={(e) => setSelectedVersion(e.target.value || null)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              aria-label="Filter by version"
            >
              <option value="">All Versions</option>
              {versions.map((ver) => (
                <option key={ver} value={ver}>
                  {formatVersion(ver)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredDocuments.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                No documents found
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {searchQuery || selectedLanguage || selectedVersion
                  ? "Try adjusting your filters"
                  : "No documents available in this package"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc, index) => (
              <DocumentCard
                key={doc.referableHash || index}
                document={doc}
                onClick={() => handleDocumentClick(doc)}
                onDoubleClick={() => handleDocumentDoubleClick(doc)}
                onDownload={() => handleDownload(doc)}
                onPreview={() => handlePreview(doc)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getFileExtension(path: string): string {
  const parts = path.split(".");
  if (parts.length > 1) {
    return parts[parts.length - 1].toUpperCase();
  }
  return "FILE";
}

function formatVersion(version: string): string {
  const versionMap: Record<string, string> = {
    default: "V1.0",
    v10: "V1.0",
    v11: "V1.1",
    v12: "V1.2"
  };

  return versionMap[version] || version;
}

// ============================================================================
// Custom Hook for Document Shelf
// ============================================================================

export function useDocumentShelf(submodelId: string) {
  const [documents, setDocuments] = useState<DocumentEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load documents from API
  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      const response = await fetch(`/api/plugins/document-shelf/documents/${submodelId}`);
      if (!response.ok) {
        throw new Error("Failed to load documents");
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [submodelId]);

  // Download document
  const downloadDocument = useCallback(async (document: DocumentEntity) => {
    if (!document.digitalFile) {
      return;
    }

    try {
      // TODO: Replace with actual download logic
      const response = await fetch(
        `/api/files/${document.digitalFile.aasId}/${document.digitalFile.smId}/${document.digitalFile.path}`
      );
      if (!response.ok) {
        throw new Error("Failed to download document");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = document.digitalFile.path.split("/").pop() || "document";
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download document:", err);
    }
  }, []);

  return {
    documents,
    loading,
    error,
    loadDocuments,
    downloadDocument
  };
}
