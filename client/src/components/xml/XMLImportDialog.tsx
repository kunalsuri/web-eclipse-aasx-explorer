/**
 * XML Import Dialog
 * 
 * Dialog for importing AAS environment from XML format.
 * Displays validation results and allows user to proceed or cancel.
 */

import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { ScrollArea } from '../ui/scroll-area';

interface XMLImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File, options: ImportOptions) => Promise<ImportResult>;
}

export interface ImportOptions {
  validationMode: 'strict' | 'lenient' | 'permissive';
  validateReferences: boolean;
}

export interface ImportResult {
  success: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  elementCount?: {
    shells: number;
    submodels: number;
    conceptDescriptions: number;
  };
}

interface ValidationError {
  line: number;
  column: number;
  message: string;
  path: string;
}

interface ValidationWarning {
  line: number;
  column: number;
  message: string;
  path: string;
}

export function XMLImportDialog({
  open,
  onOpenChange,
  onImport,
}: XMLImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [options, setOptions] = useState<ImportOptions>({
    validationMode: 'lenient',
    validateReferences: true,
  });
  const [validationResult, setValidationResult] = useState<ImportResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValidationResult(null);
    }
  }, []);

  // Handle validation
  const handleValidate = async () => {
    if (!selectedFile) return;

    setIsValidating(true);
    try {
      const result = await onImport(selectedFile, options);
      setValidationResult(result);
    } catch (error: any) {
      setValidationResult({
        success: false,
        errors: [{ line: 0, column: 0, message: error.message, path: '' }],
        warnings: [],
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!selectedFile || !validationResult) return;

    setIsImporting(true);
    try {
      await onImport(selectedFile, options);
      onOpenChange(false);
      // Reset state
      setSelectedFile(null);
      setValidationResult(null);
    } catch (error: any) {
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
    }
  };

  // Reset dialog
  const handleClose = () => {
    setSelectedFile(null);
    setValidationResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import XML
          </DialogTitle>
          <DialogDescription>
            Import an AAS environment from XML format. The file will be validated before import.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File Selection */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Select XML File</Label>
            <div className="flex items-center gap-2">
              <input
                id="file-upload"
                type="file"
                accept=".xml"
                onChange={handleFileSelect}
                className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {selectedFile && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleValidate}
                  disabled={isValidating}
                >
                  {isValidating ? 'Validating...' : 'Validate'}
                </Button>
              )}
            </div>
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Validation Mode */}
          <div className="space-y-2">
            <Label>Validation Mode</Label>
            <RadioGroup
              value={options.validationMode}
              onValueChange={(value) =>
                setOptions({ ...options, validationMode: value as any })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="strict" id="strict" />
                <Label htmlFor="strict" className="font-normal">
                  <span className="font-medium">Strict</span> - Reject any schema violations
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="lenient" id="lenient" />
                <Label htmlFor="lenient" className="font-normal">
                  <span className="font-medium">Lenient</span> - Import valid elements, warn on invalid (Recommended)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="permissive" id="permissive" />
                <Label htmlFor="permissive" className="font-normal">
                  <span className="font-medium">Permissive</span> - Import everything, report issues
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Validation Results */}
          {validationResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
                {validationResult.success ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium">Validation Successful</p>
                      {validationResult.elementCount && (
                        <p className="text-sm text-muted-foreground">
                          {validationResult.elementCount.shells} shells, {validationResult.elementCount.submodels} submodels, {validationResult.elementCount.conceptDescriptions} concept descriptions
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <div className="flex-1">
                      <p className="font-medium">Validation Failed</p>
                      <p className="text-sm text-muted-foreground">
                        {validationResult.errors.length} errors, {validationResult.warnings.length} warnings
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Errors */}
              {validationResult.errors.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Errors ({validationResult.errors.length})
                  </Label>
                  <ScrollArea className="h-32 rounded-md border p-3">
                    <div className="space-y-2">
                      {validationResult.errors.map((error, index) => (
                        <div key={index} className="text-sm">
                          <p className="font-medium text-destructive">
                            Line {error.line}, Column {error.column}
                          </p>
                          <p className="text-muted-foreground">{error.message}</p>
                          {error.path && (
                            <p className="text-xs text-muted-foreground">Path: {error.path}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Warnings */}
              {validationResult.warnings.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-yellow-600 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Warnings ({validationResult.warnings.length})
                  </Label>
                  <ScrollArea className="h-24 rounded-md border p-3">
                    <div className="space-y-2">
                      {validationResult.warnings.map((warning, index) => (
                        <div key={index} className="text-sm">
                          <p className="font-medium text-yellow-600">
                            Line {warning.line}, Column {warning.column}
                          </p>
                          <p className="text-muted-foreground">{warning.message}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!validationResult || !validationResult.success || isImporting}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? 'Importing...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
