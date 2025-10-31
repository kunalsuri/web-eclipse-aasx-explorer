/**
 * Validation Report Dialog Component
 * Allows users to export validation reports in multiple formats
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileJson, FileText, FileSpreadsheet, FileCode } from "lucide-react";
import type { ValidationResult } from "../../../../../shared/aas-validation-engine";
import {
  generateValidationReport,
  downloadReport,
  getMimeType,
  getFileExtension,
  type ReportOptions,
} from "../utils/validation-report-generator";

interface ValidationReportDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly validationResult: ValidationResult | null;
}

export function ValidationReportDialog({
  open,
  onOpenChange,
  validationResult,
}: ValidationReportDialogProps) {
  const [format, setFormat] = useState<"json" | "csv" | "html" | "pdf">("html");
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [groupBySeverity, setGroupBySeverity] = useState(true);
  const [includeTimestamp, setIncludeTimestamp] = useState(true);

  const handleExport = () => {
    if (!validationResult) return;

    const options: ReportOptions = {
      format,
      includeSummary,
      includeDetails,
      groupBySeverity,
      timestamp: includeTimestamp,
    };

    const report = generateValidationReport(validationResult, options);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const filename = `aas-validation-report-${timestamp}.${getFileExtension(format)}`;
    const mimeType = getMimeType(format);

    downloadReport(report, filename, mimeType);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Validation Report
          </DialogTitle>
          <DialogDescription>
            Choose the format and options for your validation report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Report Format</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as any)}>
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="html" id="html" />
                <Label htmlFor="html" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FileCode className="h-4 w-4 text-orange-500" />
                  <div>
                    <div className="font-medium">HTML Report</div>
                    <div className="text-xs text-muted-foreground">
                      Styled report that can be printed to PDF
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FileJson className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="font-medium">JSON Format</div>
                    <div className="text-xs text-muted-foreground">
                      Machine-readable structured data
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FileSpreadsheet className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="font-medium">CSV Format</div>
                    <div className="text-xs text-muted-foreground">
                      Import into Excel or other tools
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors opacity-50">
                <RadioGroupItem value="pdf" id="pdf" disabled />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-not-allowed flex-1">
                  <FileText className="h-4 w-4 text-red-500" />
                  <div>
                    <div className="font-medium">PDF Format</div>
                    <div className="text-xs text-muted-foreground">
                      Coming soon - use HTML and print to PDF
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Report Options</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="summary"
                  checked={includeSummary}
                  onCheckedChange={(checked) => setIncludeSummary(checked as boolean)}
                />
                <Label htmlFor="summary" className="cursor-pointer">
                  Include summary statistics
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="details"
                  checked={includeDetails}
                  onCheckedChange={(checked) => setIncludeDetails(checked as boolean)}
                />
                <Label htmlFor="details" className="cursor-pointer">
                  Include detailed error list
                </Label>
              </div>

              {format === "json" && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="group"
                    checked={groupBySeverity}
                    onCheckedChange={(checked) => setGroupBySeverity(checked as boolean)}
                  />
                  <Label htmlFor="group" className="cursor-pointer">
                    Group by severity (JSON only)
                  </Label>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="timestamp"
                  checked={includeTimestamp}
                  onCheckedChange={(checked) => setIncludeTimestamp(checked as boolean)}
                />
                <Label htmlFor="timestamp" className="cursor-pointer">
                  Include timestamp
                </Label>
              </div>
            </div>
          </div>

          {/* Preview Info */}
          {validationResult && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm font-medium">Report Preview:</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Errors:</span>{" "}
                  <span className="font-semibold text-red-500">{validationResult.errors.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Warnings:</span>{" "}
                  <span className="font-semibold text-yellow-600">
                    {validationResult.warnings.length}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Info:</span>{" "}
                  <span className="font-semibold text-blue-600">{validationResult.infos.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={!validationResult}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
