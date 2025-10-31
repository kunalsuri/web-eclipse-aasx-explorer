/**
 * Blob Editor
 * 
 * Editor for Blob elements with file upload and Base64 encoding.
 * Supports drag-and-drop and displays image previews.
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, FileIcon, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PropertyEditorProps } from './types';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export interface BlobValue {
  value: string; // Base64 encoded content
  contentType: string;
}

export interface BlobEditorProps extends PropertyEditorProps<BlobValue | null> {
  maxSize?: number;
  acceptedTypes?: string[];
}

export function BlobEditor({
  value,
  onChange,
  onBlur,
  validation,
  disabled,
  placeholder,
  metadata,
  className,
  maxSize = MAX_FILE_SIZE,
  acceptedTypes,
}: BlobEditorProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [fileName, setFileName] = React.useState<string>('');
  const [fileSize, setFileSize] = React.useState<number>(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const hasErrors = validation && !validation.isValid;
  const isImage = value?.contentType?.startsWith('image/');

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    if (disabled || metadata?.readonly) return;

    // Validate file size
    if (file.size > maxSize) {
      alert(`File size exceeds maximum of ${formatFileSize(maxSize)}`);
      return;
    }

    // Validate file type
    if (acceptedTypes && acceptedTypes.length > 0) {
      const fileType = file.type;
      if (!acceptedTypes.includes(fileType)) {
        alert(`File type ${fileType} is not accepted`);
        return;
      }
    }

    setIsLoading(true);
    setFileName(file.name);
    setFileSize(file.size);

    try {
      // Read file as Base64
      const base64 = await readFileAsBase64(file);

      // Update value
      onChange({
        value: base64,
        contentType: file.type || 'application/octet-stream',
      });

      onBlur?.();
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Failed to read file');
    } finally {
      setIsLoading(false);
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
    if (!disabled && !metadata?.readonly) {
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

    if (disabled || metadata?.readonly) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle clear
  const handleClear = () => {
    onChange(null);
    setFileName('');
    setFileSize(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onBlur?.();
  };

  // Handle click to upload
  const handleClick = () => {
    if (!disabled && !metadata?.readonly) {
      fileInputRef.current?.click();
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

  // Read file as Base64
  function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Hidden file input */}
      <Input
        ref={fileInputRef}
        type="file"
        onChange={handleInputChange}
        accept={acceptedTypes?.join(',')}
        className="hidden"
        disabled={disabled || metadata?.readonly}
      />

      {/* Upload area */}
      {!value && (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            isDragging && 'border-primary bg-primary/5',
            hasErrors && 'border-destructive',
            (disabled || metadata?.readonly) && 'opacity-50 cursor-not-allowed'
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
            Maximum file size: {formatFileSize(maxSize)}
          </p>
          {acceptedTypes && acceptedTypes.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Accepted types: {acceptedTypes.join(', ')}
            </p>
          )}
        </div>
      )}

      {/* File preview */}
      {value && (
        <div className="border rounded-lg p-4 space-y-4">
          {/* Image preview */}
          {isImage && (
            <div className="flex justify-center">
              <img
                src={`data:${value.contentType};base64,${value.value}`}
                alt="Preview"
                className="max-w-full max-h-64 rounded"
              />
            </div>
          )}

          {/* File info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isImage ? (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              ) : (
                <FileIcon className="h-8 w-8 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">{fileName || 'Uploaded file'}</p>
                <p className="text-xs text-muted-foreground">
                  {value.contentType} • {formatFileSize(fileSize)}
                </p>
              </div>
            </div>

            {!disabled && !metadata?.readonly && (
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

          {/* Replace button */}
          {!disabled && !metadata?.readonly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClick}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Replace File
            </Button>
          )}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="text-center text-sm text-muted-foreground">
          Loading file...
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
