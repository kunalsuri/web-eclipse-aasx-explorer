/**
 * Bulk Operation Progress
 * 
 * Progress indicator for bulk operations affecting multiple elements.
 */

import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Progress } from '../ui/progress';

interface BulkOperationProgressProps {
  total: number;
  completed: number;
  succeeded: number;
  failed: number;
  currentElement?: string;
  isComplete: boolean;
}

export function BulkOperationProgress({
  total,
  completed,
  succeeded,
  failed,
  currentElement,
  isComplete,
}: BulkOperationProgressProps) {
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="space-y-4 p-4 border rounded-md">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {isComplete ? 'Complete' : 'Processing...'}
          </span>
          <span className="text-muted-foreground">
            {completed} / {total}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Current Element */}
      {!isComplete && currentElement && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Processing: {currentElement}</span>
        </div>
      )}

      {/* Results */}
      <div className="flex items-center gap-4 text-sm">
        {/* Succeeded */}
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>{succeeded} succeeded</span>
        </div>

        {/* Failed */}
        {failed > 0 && (
          <div className="flex items-center gap-1 text-destructive">
            <XCircle className="h-4 w-4" />
            <span>{failed} failed</span>
          </div>
        )}
      </div>

      {/* Completion Message */}
      {isComplete && (
        <div className={`text-sm font-medium ${failed === 0 ? 'text-green-600' : 'text-yellow-600'}`}>
          {failed === 0
            ? '✓ All operations completed successfully'
            : `⚠ Completed with ${failed} error${failed === 1 ? '' : 's'}`}
        </div>
      )}
    </div>
  );
}
