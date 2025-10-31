/**
 * Validation Panel Component
 * Displays validation results with error grouping and navigation
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Download,
  RefreshCw,
  Filter,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import type { ValidationResult, ValidationError } from "../../../../../shared/aas-validation-engine";
import { ValidationReportDialog } from "./validation-report-dialog";

interface ValidationPanelProps {
  readonly result: ValidationResult | null;
  readonly onRevalidate?: () => void;
  readonly onNavigateToError?: (error: ValidationError) => void;
  readonly onExportReport?: () => void;
}

export function ValidationPanel({
  result,
  onRevalidate,
  onNavigateToError,
  onExportReport,
}: ValidationPanelProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<"all" | "error" | "warning" | "info">("all");
  const [showReportDialog, setShowReportDialog] = useState(false);

  if (!result) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              No validation results available
            </p>
            {onRevalidate && (
              <Button onClick={onRevalidate} variant="outline" className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Validation
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredErrors = getFilteredErrors(result, selectedSeverity);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {result.isValid ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              Validation Results
            </CardTitle>
            <CardDescription>
              Validated in {result.duration}ms • {result.timestamp.toLocaleString()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onRevalidate && (
              <Button onClick={onRevalidate} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Revalidate
              </Button>
            )}
            <Button onClick={() => setShowReportDialog(true)} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <SummaryCard
            icon={<AlertCircle className="h-5 w-5" />}
            label="Errors"
            count={result.errors.length}
            variant="error"
            active={selectedSeverity === "error"}
            onClick={() => setSelectedSeverity("error")}
          />
          <SummaryCard
            icon={<AlertTriangle className="h-5 w-5" />}
            label="Warnings"
            count={result.warnings.length}
            variant="warning"
            active={selectedSeverity === "warning"}
            onClick={() => setSelectedSeverity("warning")}
          />
          <SummaryCard
            icon={<Info className="h-5 w-5" />}
            label="Info"
            count={result.infos.length}
            variant="info"
            active={selectedSeverity === "info"}
            onClick={() => setSelectedSeverity("info")}
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter:</span>
          <Button
            variant={selectedSeverity === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSeverity("all")}
          >
            All ({result.errors.length + result.warnings.length + result.infos.length})
          </Button>
          <Button
            variant={selectedSeverity === "error" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSeverity("error")}
          >
            Errors ({result.errors.length})
          </Button>
          <Button
            variant={selectedSeverity === "warning" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSeverity("warning")}
          >
            Warnings ({result.warnings.length})
          </Button>
          <Button
            variant={selectedSeverity === "info" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSeverity("info")}
          >
            Info ({result.infos.length})
          </Button>
        </div>

        <Separator className="mb-4" />

        {/* Results List */}
        <ScrollArea className="h-[calc(100vh-450px)]">
          {filteredErrors.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
              <p className="text-sm text-muted-foreground">
                {selectedSeverity === "all"
                  ? "No validation issues found"
                  : `No ${selectedSeverity} messages`}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredErrors.map((error, index) => (
                <ValidationErrorCard
                  key={`${error.code}-${error.path}-${index}`}
                  error={error}
                  onNavigate={onNavigateToError}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      
      {/* Report Dialog */}
      <ValidationReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        validationResult={result}
      />
    </Card>
  );
}

// Summary Card Component
interface SummaryCardProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly count: number;
  readonly variant: "error" | "warning" | "info";
  readonly active: boolean;
  readonly onClick: () => void;
}

function SummaryCard({ icon, label, count, variant, active, onClick }: SummaryCardProps) {
  const colorClasses = {
    error: "text-red-500 border-red-200 bg-red-50 dark:bg-red-950/20",
    warning: "text-yellow-500 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20",
    info: "text-blue-500 border-blue-200 bg-blue-50 dark:bg-blue-950/20",
  };

  const activeClasses = active ? "ring-2 ring-primary" : "";

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all hover:shadow-md ${colorClasses[variant]} ${activeClasses}`}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 text-left">
        <div className="text-2xl font-bold">{count}</div>
        <div className="text-sm font-medium">{label}</div>
      </div>
    </button>
  );
}

// Validation Error Card Component
interface ValidationErrorCardProps {
  readonly error: ValidationError;
  readonly onNavigate?: (error: ValidationError) => void;
}

function ValidationErrorCard({ error, onNavigate }: ValidationErrorCardProps) {
  const severityConfig = {
    error: {
      icon: <AlertCircle className="h-4 w-4" />,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      borderColor: "border-red-200",
    },
    warning: {
      icon: <AlertTriangle className="h-4 w-4" />,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      borderColor: "border-yellow-200",
    },
    info: {
      icon: <Info className="h-4 w-4" />,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200",
    },
  };

  const config = severityConfig[error.severity];

  return (
    <div
      className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor} transition-all hover:shadow-sm`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 mt-0.5 ${config.color}`}>{config.icon}</div>
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {error.code}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {error.severity}
                </Badge>
              </div>
              <p className="text-sm font-medium text-foreground">{error.message}</p>
            </div>
            {onNavigate && error.path && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate(error)}
                className="flex-shrink-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Path */}
          {error.path && (
            <div className="text-xs text-muted-foreground font-mono bg-muted/50 rounded px-2 py-1">
              {error.path}
            </div>
          )}

          {/* Suggestion */}
          {error.suggestion && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{error.suggestion}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to filter errors by severity
function getFilteredErrors(
  result: ValidationResult,
  severity: "all" | "error" | "warning" | "info"
): ValidationError[] {
  if (severity === "all") {
    return [...result.errors, ...result.warnings, ...result.infos];
  }
  if (severity === "error") {
    return result.errors;
  }
  if (severity === "warning") {
    return result.warnings;
  }
  return result.infos;
}
