/**
 * Clipboard Preview Component
 * Shows what's currently in the clipboard
 */

import { Copy, Scissors, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ClipboardItem {
  element: any;
  operation: 'copy' | 'cut';
  sourceId: string;
  timestamp: number;
}

interface ClipboardPreviewProps {
  clipboardItem: ClipboardItem | null;
  onClear: () => void;
  onPaste?: () => void;
  className?: string;
}

export function ClipboardPreview({
  clipboardItem,
  onClear,
  onPaste,
  className,
}: ClipboardPreviewProps) {
  if (!clipboardItem) {
    return null;
  }

  const { element, operation, timestamp } = clipboardItem;
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true });

  // Get element display name
  const getElementName = (el: any): string => {
    if (el.idShort) return el.idShort;
    if (el.modelType) return el.modelType;
    return 'Unknown Element';
  };

  // Get element type
  const getElementType = (el: any): string => {
    return el.modelType || 'Element';
  };

  return (
    <Card className={cn('w-full max-w-sm', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {operation === 'copy' ? (
              <Copy className="h-4 w-4 text-blue-500" />
            ) : (
              <Scissors className="h-4 w-4 text-orange-500" />
            )}
            Clipboard
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            title="Clear clipboard"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Element info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {getElementType(element)}
            </Badge>
            <Badge
              variant={operation === 'copy' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {operation === 'copy' ? 'Copied' : 'Cut'}
            </Badge>
          </div>
          <p className="text-sm font-medium truncate" title={getElementName(element)}>
            {getElementName(element)}
          </p>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{timeAgo}</span>
        </div>

        {/* Paste button */}
        {onPaste && (
          <Button
            variant="outline"
            size="sm"
            onClick={onPaste}
            className="w-full"
          >
            Paste
          </Button>
        )}

        {/* Additional info */}
        {element.value !== undefined && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Value:</span>{' '}
            <span className="truncate">{String(element.value).substring(0, 50)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
