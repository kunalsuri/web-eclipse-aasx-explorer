/**
 * File Editor
 * 
 * Editor for File elements with server-side file storage.
 * Supports drag-and-drop and file download.
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, FileIcon, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PropertyEditorProps } from './types';

export interface FileValue {
  value: string; // File path on server
  contentType: string;
}

export interface FileMetadata {
  fileName: string;
  fileSize: number;
  uploadDate: string;
  valueType: string;
  readonly?: boolean;
}

export interface FileEditorProps extends PropertyEditorProps<FileValue | null> {
  onUpload?: (file: File) => Promise<{ path: string; contentType: string }>;
  onDownload?: (path: string) => Promise<void>;
  metadata?: FileMetadata;
}

export function FileEditor({
  value,
  onChange,
  onBlur,
  validation,
  disabled,
  placeholder,
  metadata: propMetadata,
  className,
  onUpload,
  onDownload,
}: FileEditorProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [fileMetadata, setFileMetadata] = React.useState<FileMetadata | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const hasErrors = validation && !validation.isValid;

  // Load file metadata when value changes
  React.useEffect(() => {
    if (value && propMetadata) {
      setFileMetadata(propMetadata);
    }
  }, [value, propMetadata]);

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    if (disabled || propMetadata?.readonly) return;

    if (!onUpload) {
      console.error('onUpload handler not provided');
      return;
    }

    setIsUploading(true);

    try {
      // Upload file to server
      const result = await onUpload(file);

      // Update value with file path
      onChange({
        value: result.path,
        contentType: result.contentType,
      });

      // Update metadata
      setFileMetadata({
        fileName: file.name,
        fileSize: file.size,
        uploadDate: new Date().toISOString(),
        valueType: result.contentType,
        readonly: propMetadata?.readonly,
      });

      onBlur?.();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !propMetadata?.readonly) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || propMetadata?.readonly) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle clear
  const handleClear = () => {
    onChange(null);
    setFileMetadata(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onBlur?.();
  };

  // Handle click to upload
  const handleClick = () => {
    if (!disabled && !propMetadata?.readonly) {
      fileInputRef.current?.click();
    }
  };

  // Handle download
  const handleDownload = async () => {
    if (!value || !onDownload) return;

    try {
      await onDownload(value.value);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  // Format file size
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Format date
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Hidden file input */}
      <Input
        ref={fileInputRef}
        type="file"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || propMetadata?.readonly}
      />

      {/* Upload area */}
      {!value && (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            isDragging && 'border-primary bg-primary/5',
            hasErrors && 'border-destructive',
            (disabled || propMetadata?.readonly) && 'opacity-50 cursor-not-allowed'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            {placeholder || 'Drag and drop a file here, or click to select'}
          </p>
          <p className="text-xs text-muted-foreground">
            File will be uploaded to the server
          </p>
        </div>
      )}

      {/* File info */}
      {value && fileMetadata && (
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileIcon className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{fileMetadata.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {value.contentType} • {formatFileSize(fileMetadata.fileSize)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Uploaded: {formatDate(fileMetadata.uploadDate)}
                </p>
              </div>
            </div>

            {!disabled && !propMetadata?.readonly && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {onDownload && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}

            {!disabled && !propMetadata?.readonly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClick}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Replace
              </Button>
            )}
          </div>

          {/* File path */}
          <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
            <div className="font-medium mb-1">Server Path:</div>
            <div className="font-mono break-all">{value.value}</div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isUploading && (
        <div className="text-center text-sm text-muted-foreground">
          Uploading file...
        </div>
      )}

      {/* Validation errors */}
      {hasErrors && validation.errors.length > 0 && (
        <div className="text-sm text-destructive">
          {validation.errors[0].message}
        </div>
      )}
    </div>
  );
}
