/**
 * History Panel Component
 * Displays undo/redo history with visualization
 */

import { Undo2, Redo2, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Command {
  readonly id: string;
  readonly type: string;
  readonly description: string;
  readonly timestamp: Date;
}

interface HistoryPanelProps {
  canUndo: boolean;
  canRedo: boolean;
  undoDescription?: string;
  redoDescription?: string;
  historySize: number;
  history?: ReadonlyArray<Command>;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  className?: string;
}

export function HistoryPanel({
  canUndo,
  canRedo,
  undoDescription,
  redoDescription,
  historySize,
  history = [],
  onUndo,
  onRedo,
  onClear,
  className,
}: HistoryPanelProps) {
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            History
          </CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs">
              {historySize}
            </Badge>
            {historySize > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                title="Clear history"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Undo/Redo controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="flex-1"
            title={undoDescription ? `Undo: ${undoDescription}` : 'Nothing to undo'}
          >
            <Undo2 className="h-4 w-4 mr-1" />
            Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            className="flex-1"
            title={redoDescription ? `Redo: ${redoDescription}` : 'Nothing to redo'}
          >
            <Redo2 className="h-4 w-4 mr-1" />
            Redo
          </Button>
        </div>

        {/* Current action descriptions */}
        {(undoDescription || redoDescription) && (
          <>
            <Separator />
            <div className="space-y-2 text-xs">
              {undoDescription && (
                <div className="flex items-start gap-2">
                  <Undo2 className="h-3 w-3 mt-0.5 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">
                    {undoDescription}
                  </span>
                </div>
              )}
              {redoDescription && (
                <div className="flex items-start gap-2">
                  <Redo2 className="h-3 w-3 mt-0.5 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">
                    {redoDescription}
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {/* History list */}
        {history.length > 0 && (
          <>
            <Separator />
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {history.slice().reverse().map((command, index) => (
                  <div
                    key={command.id}
                    className={cn(
                      'p-2 rounded-md text-xs space-y-1',
                      index === 0 ? 'bg-primary/10' : 'bg-muted/50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {command.type}
                      </Badge>
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(new Date(command.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-foreground truncate" title={command.description}>
                      {command.description}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        {/* Empty state */}
        {history.length === 0 && (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No history yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
