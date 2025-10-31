/**
 * Document Preview Component
 * 
 * React component for previewing documents (PDF, images, text files)
 * Supports multiple file types with fallback to download
 */

import { useState, useEffect, useCallback } from "react";
import { X, Download, ZoomIn, ZoomOut, RotateCw, FileText, AlertCircle } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface DocumentPreviewProps {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  onClose?: () => void;
  onDownload?: () => void;
}

// ============================================================================
// PDF Preview Component
// ============================================================================

function PDFPreview({ fileUrl }: { fileUrl: string }) {
  return (
    <div className="h-full w-full">
      <iframe
        src={fileUrl}
        className="h-full w-full border-0"
        title="PDF Preview"
      />
    </div>
  );
}

// ============================================================================
// Image Preview Component
// ============================================================================

function ImagePreview({ fileUrl, fileName }: { fileUrl: string; fileName: string }) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 25, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 25, 25));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Image controls */}
      <div className="flex items-center justify-center gap-2 border-b border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800">
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={zoom <= 25}
          className="rounded p-2 hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="min-w-[4rem] text-center text-sm text-gray-700 dark:text-gray-300">
          {zoom}%
        </span>
        <button
          type="button"
          onClick={handleZoomIn}
          disabled={zoom >= 200}
          className="rounded p-2 hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <div className="mx-2 h-6 w-px bg-gray-300 dark:bg-gray-600" />
        <button
          type="button"
          onClick={handleRotate}
          className="rounded p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Rotate"
        >
          <RotateCw className="h-4 w-4" />
        </button>
      </div>

      {/* Image container */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
        <div className="flex min-h-full items-center justify-center p-4">
          <img
            src={fileUrl}
            alt={fileName}
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transition: "transform 0.2s ease-in-out"
            }}
            className="max-w-full"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Text Preview Component
// ============================================================================

function TextPreview({ fileUrl }: { fileUrl: string }) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadText() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error("Failed to load file");
        }

        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load file");
      } finally {
        setLoading(false);
      }
    }

    loadText();
  }, [fileUrl]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 text-sm text-gray-900 dark:text-gray-100">Failed to load file</p>
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-white p-6 dark:bg-gray-900">
      <pre className="whitespace-pre-wrap font-mono text-sm text-gray-900 dark:text-gray-100">
        {content}
      </pre>
    </div>
  );
}

// ============================================================================
// Unsupported File Type Component
// ============================================================================

function UnsupportedPreview({
  fileName,
  mimeType,
  onDownload
}: {
  fileName: string;
  mimeType: string;
  onDownload?: () => void;
}) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <FileText className="mx-auto h-16 w-16 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
          Preview not available
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {fileName}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
          {mimeType}
        </p>
        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Download className="h-4 w-4" />
            Download File
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Document Preview Component
// ============================================================================

export function DocumentPreview({
  fileUrl,
  fileName,
  mimeType,
  onClose,
  onDownload
}: DocumentPreviewProps) {
  // Determine preview type based on MIME type
  const getPreviewType = useCallback(() => {
    const type = mimeType.toLowerCase();

    if (type === "application/pdf") {
      return "pdf";
    }

    if (type.startsWith("image/")) {
      return "image";
    }

    if (
      type === "text/plain" ||
      type === "text/html" ||
      type === "text/xml" ||
      type === "application/json" ||
      type === "application/xml"
    ) {
      return "text";
    }

    return "unsupported";
  }, [mimeType]);

  const previewType = getPreviewType();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex h-[90vh] w-[90vw] max-w-6xl flex-col rounded-lg bg-white shadow-2xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex-1 min-w-0">
            <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-gray-100">
              {fileName}
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {mimeType}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Download"
              >
                <Download className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Close"
              >
                <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
            )}
          </div>
        </div>

        {/* Preview content */}
        <div className="flex-1 overflow-hidden">
          {previewType === "pdf" && <PDFPreview fileUrl={fileUrl} />}
          {previewType === "image" && <ImagePreview fileUrl={fileUrl} fileName={fileName} />}
          {previewType === "text" && <TextPreview fileUrl={fileUrl} />}
          {previewType === "unsupported" && (
            <UnsupportedPreview
              fileName={fileName}
              mimeType={mimeType}
              onDownload={onDownload}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Custom Hook for Document Preview
// ============================================================================

export function useDocumentPreview() {
  const [previewState, setPreviewState] = useState<{
    isOpen: boolean;
    fileUrl: string | null;
    fileName: string | null;
    mimeType: string | null;
  }>({
    isOpen: false,
    fileUrl: null,
    fileName: null,
    mimeType: null
  });

  const openPreview = useCallback(
    (fileUrl: string, fileName: string, mimeType: string) => {
      setPreviewState({
        isOpen: true,
        fileUrl,
        fileName,
        mimeType
      });
    },
    []
  );

  const closePreview = useCallback(() => {
    setPreviewState({
      isOpen: false,
      fileUrl: null,
      fileName: null,
      mimeType: null
    });
  }, []);

  return {
    isOpen: previewState.isOpen,
    fileUrl: previewState.fileUrl,
    fileName: previewState.fileName,
    mimeType: previewState.mimeType,
    openPreview,
    closePreview
  };
}
