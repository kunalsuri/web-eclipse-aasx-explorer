/**
 * Search History Panel Component
 * 
 * Displays last 50 searches in reverse chronological order
 * Allows re-running searches and clearing history
 */

import { Clock, Trash2, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSearchHistory } from '../hooks/use-search-history';
import type { DictionarySource } from '@shared/dictionary-types';

interface SearchHistoryPanelProps {
  readonly onSearchSelect?: (query: string, source: DictionarySource) => void;
}

export function SearchHistoryPanel({ onSearchSelect }: SearchHistoryPanelProps) {
  const { history, clearHistory, removeEntry } = useSearchHistory();

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (history.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">
            No search history
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Your recent searches will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Search History
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Clear All
          </Button>
        </div>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
          {history.length} {history.length === 1 ? 'search' : 'searches'}
        </p>
      </div>

      {/* History List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {history.map((entry) => (
            <Card
              key={entry.id}
              className="group cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => onSearchSelect?.(entry.query, entry.source)}
            >
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="flex-1 min-w-0">
                  {/* Query */}
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {entry.query}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 dark:bg-blue-900/30">
                      {entry.source.toUpperCase()}
                    </span>
                    <span>{entry.resultCount} results</span>
                    <span>{formatTimestamp(entry.timestamp)}</span>
                  </div>
                </div>

                {/* Remove button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeEntry(entry.id);
                  }}
                >
                  <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-600" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
