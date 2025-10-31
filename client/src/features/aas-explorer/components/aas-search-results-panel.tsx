/**
 * AAS Search Results Panel Component
 * Displays search results with highlighting and navigation
 */

import { useState } from 'react';
import { ChevronRight, FileText, Folder, Box, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { SearchResult } from '../../../../../shared/aas-search-types';

interface AASSearchResultsPanelProps {
  results: SearchResult[];
  query: string;
  onResultClick?: (result: SearchResult) => void;
  statistics?: {
    totalResults: number;
    searchTime: number;
    indexSize: number;
    query: string;
  } | null;
}

export function AASSearchResultsPanel({
  results,
  query,
  onResultClick,
  statistics,
}: AASSearchResultsPanelProps) {
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  function toggleExpanded(resultId: string) {
    setExpandedResults((prev) => {
      const next = new Set(prev);
      if (next.has(resultId)) {
        next.delete(resultId);
      } else {
        next.add(resultId);
      }
      return next;
    });
  }

  function getResultIcon(type: string) {
    if (type.includes('Shell')) return <Box className="h-4 w-4" />;
    if (type.includes('Submodel')) return <Folder className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  }

  function getTypeBadgeVariant(type: string): 'default' | 'secondary' | 'outline' {
    if (type.includes('Shell')) return 'default';
    if (type.includes('Submodel')) return 'secondary';
    return 'outline';
  }

  function highlightMatch(text: string, searchQuery: string): React.ReactNode {
    if (!searchQuery) return text;

    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-900">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Search Results</CardTitle>
          <CardDescription>No results found for "{query}"</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Try adjusting your search query or using different keywords.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </CardDescription>
          </div>
          {statistics && (
            <div className="text-xs text-muted-foreground">
              {statistics.searchTime.toFixed(2)}ms
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="space-y-2 p-6 pt-0">
            {results.map((result, index) => {
              const isExpanded = expandedResults.has(result.id);

              return (
                <div key={result.id}>
                  {index > 0 && <Separator className="my-2" />}
                  <div
                    className="group cursor-pointer rounded-lg border p-4 transition-colors hover:bg-accent"
                    onClick={() => onResultClick?.(result)}
                  >
                    {/* Result header */}
                    <div className="flex items-start gap-3">
                      <div className="mt-1 text-muted-foreground">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 space-y-2">
                        {/* Title and type */}
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">
                            {highlightMatch(result.idShort, query)}
                          </h4>
                          <Badge variant={getTypeBadgeVariant(result.type)} className="text-xs">
                            {result.type}
                          </Badge>
                        </div>

                        {/* Path */}
                        {result.path.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {result.path.map((segment, i) => (
                              <span key={i} className="flex items-center gap-1">
                                {i > 0 && <ChevronRight className="h-3 w-3" />}
                                <span>{highlightMatch(segment, query)}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Match summary */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            {result.matches.length} match{result.matches.length !== 1 ? 'es' : ''}
                          </span>
                          <span>Score: {result.score}</span>
                          {result.parentIdShort && (
                            <span>Parent: {result.parentIdShort}</span>
                          )}
                        </div>

                        {/* Matches preview */}
                        {result.matches.length > 0 && (
                          <div className="space-y-1">
                            {result.matches.slice(0, isExpanded ? undefined : 2).map((match, i) => (
                              <div
                                key={i}
                                className="rounded bg-muted p-2 text-xs font-mono"
                              >
                                <span className="text-muted-foreground">{match.field}: </span>
                                <span>{highlightMatch(match.matchedText, query)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Expand/collapse button */}
                        {result.matches.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(result.id);
                            }}
                          >
                            {isExpanded
                              ? 'Show less'
                              : `Show ${result.matches.length - 2} more matches`}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
