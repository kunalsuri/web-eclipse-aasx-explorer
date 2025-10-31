/**
 * Validation Panel
 * 
 * Panel displaying validation errors, warnings, and info messages.
 * Allows filtering by severity and navigation to problematic elements.
 */

import { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, Filter, X } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ValidationMessage {
  id: string;
  elementId: string;
  elementPath: string;
  severity: 'error' | 'warning' | 'info';
  constraintId: string;
  message: string;
  suggestion?: string;
  timestamp: number;
}

interface ValidationPanelProps {
  validations: ValidationMessage[];
  onNavigate: (elementId: string) => void;
  onClear?: () => void;
}

type SeverityFilter = 'all' | 'error' | 'warning' | 'info';

// ============================================================================
// Validation Panel Component
// ============================================================================

export function ValidationPanel({
  validations,
  onNavigate,
  onClear,
}: ValidationPanelProps) {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter validations
  const filteredValidations = validations.filter(v => {
    // Filter by severity
    if (severityFilter !== 'all' && v.severity !== severityFilter) {
      return false;
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        v.message.toLowerCase().includes(term) ||
        v.elementPath.toLowerCase().includes(term) ||
        v.constraintId.toLowerCase().includes(term)
      );
    }

    return true;
  });

  // Count by severity
  const counts = {
    error: validations.filter(v => v.severity === 'error').length,
    warning: validations.filter(v => v.severity === 'warning').length,
    info: validations.filter(v => v.severity === 'info').length,
  };

  // Get icon for severity
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-destructive';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Validation Results</h3>
          <div className="flex items-center gap-2 text-sm">
            {counts.error > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertCircle className="h-3 w-3" />
                {counts.error}
              </span>
            )}
            {counts.warning > 0 && (
              <span className="flex items-center gap-1 text-yellow-600">
                <AlertTriangle className="h-3 w-3" />
                {counts.warning}
              </span>
            )}
            {counts.info > 0 && (
              <span className="flex items-center gap-1 text-blue-600">
                <Info className="h-3 w-3" />
                {counts.info}
              </span>
            )}
          </div>
        </div>

        {onClear && validations.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 p-4 border-b">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select
          value={severityFilter}
          onValueChange={(value) => setSeverityFilter(value as SeverityFilter)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({validations.length})</SelectItem>
            <SelectItem value="error">Errors ({counts.error})</SelectItem>
            <SelectItem value="warning">Warnings ({counts.warning})</SelectItem>
            <SelectItem value="info">Info ({counts.info})</SelectItem>
          </SelectContent>
        </Select>

        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-1 text-sm border rounded-md"
        />
      </div>

      {/* Validation List */}
      <ScrollArea className="flex-1">
        {filteredValidations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            {validations.length === 0 ? (
              <>
                <Info className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No validation issues found
                </p>
              </>
            ) : (
              <>
                <Filter className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No results match your filters
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredValidations.map((validation) => (
              <button
                key={validation.id}
                type="button"
                onClick={() => onNavigate(validation.elementId)}
                className="w-full text-left p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Severity Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getSeverityIcon(validation.severity)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Message */}
                    <div className={cn('font-medium text-sm', getSeverityColor(validation.severity))}>
                      {validation.message}
                    </div>

                    {/* Element Path */}
                    <div className="text-xs text-muted-foreground truncate">
                      {validation.elementPath}
                    </div>

                    {/* Constraint ID */}
                    <div className="text-xs text-muted-foreground">
                      Constraint: {validation.constraintId}
                    </div>

                    {/* Suggestion */}
                    {validation.suggestion && (
                      <div className="text-xs text-blue-600 mt-2">
                        💡 {validation.suggestion}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="flex-shrink-0 text-xs text-muted-foreground">
                    {new Date(validation.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {filteredValidations.length > 0 && (
        <div className="p-4 border-t text-xs text-muted-foreground">
          Showing {filteredValidations.length} of {validations.length} validation{validations.length === 1 ? '' : 's'}
        </div>
      )}
    </div>
  );
}
