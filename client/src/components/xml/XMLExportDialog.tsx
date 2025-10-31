/**
 * XML Export Dialog
 * 
 * Dialog for exporting AAS environment to XML format.
 * Provides options for formatting and validation.
 */

import { useState } from 'react';
import { Download, FileText, Settings } from 'lucide-react';
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
import { Switch } from '../ui/switch';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

interface XMLExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportOptions) => Promise<void>;
}

export interface ExportOptions {
  prettyPrint: boolean;
  includeComments: boolean;
  validateBeforeExport: boolean;
  schemaVersion: '3.0';
}

export function XMLExportDialog({
  open,
  onOpenChange,
  onExport,
}: XMLExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>({
    prettyPrint: true,
    includeComments: false,
    validateBeforeExport: true,
    schemaVersion: '3.0',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      await onExport(options);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to export XML');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export as XML
          </DialogTitle>
          <DialogDescription>
            Export the current AAS environment to XML format compliant with AAS V3 specification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Schema Version */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Schema Version
            </Label>
            <RadioGroup
              value={options.schemaVersion}
              onValueChange={(value) =>
                setOptions({ ...options, schemaVersion: value as '3.0' })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="3.0" id="v3" />
                <Label htmlFor="v3" className="font-normal">
                  AAS V3.0 (Recommended)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Formatting Options */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Formatting Options</Label>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="pretty-print">Pretty Print</Label>
                <p className="text-sm text-muted-foreground">
                  Format XML with indentation for readability
                </p>
              </div>
              <Switch
                id="pretty-print"
                checked={options.prettyPrint}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, prettyPrint: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="comments">Include Comments</Label>
                <p className="text-sm text-muted-foreground">
                  Add descriptive comments to XML elements
                </p>
              </div>
              <Switch
                id="comments"
                checked={options.includeComments}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, includeComments: checked })
                }
              />
            </div>
          </div>

          {/* Validation Options */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Validation</Label>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="validate">Validate Before Export</Label>
                <p className="text-sm text-muted-foreground">
                  Check for errors before generating XML
                </p>
              </div>
              <Switch
                id="validate"
                checked={options.validateBeforeExport}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, validateBeforeExport: checked })
                }
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export XML'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
