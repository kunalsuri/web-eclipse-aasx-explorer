/**
 * Export Dialog Component
 * Dialog for exporting AAS data to various formats
 */

import { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authenticatedFetch } from '@/features/auth/utils/jwt-auth-utils';

interface ExportDialogProps {
  fileId: string;
  fileName?: string;
  trigger?: React.ReactNode;
}

type ExportFormat = 'json' | 'csv' | 'csv-properties';

export function ExportDialog({ fileId, fileName = 'export', trigger }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('json');
  const [prettyPrint, setPrettyPrint] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      let url = '';
      let filename = '';

      switch (format) {
        case 'json':
          url = `/api/aasx/${fileId}/export/json?pretty=${prettyPrint}`;
          filename = `${fileName}.json`;
          break;
        case 'csv':
          url = `/api/aasx/${fileId}/export/csv`;
          filename = `${fileName}.csv`;
          break;
        case 'csv-properties':
          url = `/api/aasx/${fileId}/export/csv?type=properties`;
          filename = `${fileName}-properties.csv`;
          break;
      }

      const response = await authenticatedFetch(url);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setExportSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setExportSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export AAS Data</DialogTitle>
          <DialogDescription>
            Choose a format to export your AAS data. The file will be downloaded to your computer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
              <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-accent cursor-pointer">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    <div>
                      <div className="font-medium">JSON</div>
                      <div className="text-xs text-muted-foreground">
                        Complete AAS environment in JSON format
                      </div>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-accent cursor-pointer">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <div>
                      <div className="font-medium">CSV (Full)</div>
                      <div className="text-xs text-muted-foreground">
                        All elements with metadata in CSV format
                      </div>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-accent cursor-pointer">
                <RadioGroupItem value="csv-properties" id="csv-properties" />
                <Label htmlFor="csv-properties" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <div>
                      <div className="font-medium">CSV (Properties Only)</div>
                      <div className="text-xs text-muted-foreground">
                        Flat list of properties with values
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* JSON Options */}
          {format === 'json' && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pretty-print"
                  checked={prettyPrint}
                  onCheckedChange={(checked) => setPrettyPrint(checked as boolean)}
                />
                <Label htmlFor="pretty-print" className="text-sm font-normal cursor-pointer">
                  Pretty print (formatted with indentation)
                </Label>
              </div>
            </div>
          )}

          {/* Success Message */}
          {exportSuccess && (
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-600 dark:text-green-400">
                Export successful! File downloaded.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
