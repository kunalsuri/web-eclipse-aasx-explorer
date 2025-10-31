/**
 * AAS Search Bar Component
 * Global search input with keyboard shortcuts and suggestions
 */

import { useEffect, useState, useCallback } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAASSearch } from '../hooks/use-aas-search';
import type { SearchResult } from '../../../../../shared/aas-search-types';

interface AASSearchBarProps {
  fileId: string;
  onResultSelect?: (result: SearchResult) => void;
  placeholder?: string;
}

export function AASSearchBar({ fileId, onResultSelect, placeholder }: AASSearchBarProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const { search, results, isSearching, error } = useAASSearch(fileId);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('aas-recent-searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setRecentSearches((prev) => {
      const updated = [searchQuery, ...prev.filter((s) => s !== searchQuery)].slice(0, 10);
      localStorage.setItem('aas-recent-searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('aas-recent-searches');
  }, []);

  // Handle search
  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      setQuery(searchQuery);
      search({ query: searchQuery });
      saveRecentSearch(searchQuery);
    },
    [search, saveRecentSearch]
  );

  // Handle result selection
  const handleResultSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      onResultSelect?.(result);
    },
    [onResultSelect]
  );

  // Handle recent search selection
  const handleRecentSearchSelect = useCallback(
    (searchQuery: string) => {
      handleSearch(searchQuery);
    },
    [handleSearch]
  );

  // Keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Get result type badge color
  function getTypeBadgeVariant(type: string): 'default' | 'secondary' | 'outline' {
    if (type.includes('Shell')) return 'default';
    if (type.includes('Submodel')) return 'secondary';
    return 'outline';
  }

  return (
    <>
      {/* Search trigger button */}
      <Button
        variant="outline"
        className="relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-64 lg:w-96"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="inline-flex">{placeholder || 'Search AAS...'}</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Search dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search by name, value, description..."
          value={query}
          onValueChange={setQuery}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim()) {
              handleSearch(query);
            }
          }}
        />
        <CommandList>
          {/* Loading state */}
          {isSearching && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="py-6 text-center text-sm text-destructive">
              Error: {error}
            </div>
          )}

          {/* Empty state */}
          {!isSearching && !error && query && results.length === 0 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}

          {/* Search results */}
          {!isSearching && results.length > 0 && (
            <CommandGroup heading="Search Results">
              {results.slice(0, 10).map((result) => (
                <CommandItem
                  key={result.id}
                  value={result.id}
                  onSelect={() => handleResultSelect(result)}
                  className="flex items-start gap-2 py-3"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{result.idShort}</span>
                      <Badge variant={getTypeBadgeVariant(result.type)} className="text-xs">
                        {result.type}
                      </Badge>
                    </div>
                    {result.path.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {result.path.join(' / ')}
                      </div>
                    )}
                    {result.matches.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {result.matches.length} match{result.matches.length > 1 ? 'es' : ''} •
                        Score: {result.score}
                      </div>
                    )}
                  </div>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Recent searches */}
          {!query && recentSearches.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup
                heading={
                  <div className="flex items-center justify-between">
                    <span>Recent Searches</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={clearRecentSearches}
                    >
                      Clear
                    </Button>
                  </div>
                }
              >
                {recentSearches.map((recentQuery, index) => (
                  <CommandItem
                    key={index}
                    value={recentQuery}
                    onSelect={() => handleRecentSearchSelect(recentQuery)}
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{recentQuery}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto h-auto p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRecentSearches((prev) => {
                          const updated = prev.filter((s) => s !== recentQuery);
                          localStorage.setItem('aas-recent-searches', JSON.stringify(updated));
                          return updated;
                        });
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Search tips */}
          {!query && recentSearches.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              <p className="mb-2">Start typing to search...</p>
              <div className="space-y-1 text-xs">
                <p>• Search by name, value, or description</p>
                <p>• Use Ctrl+K (Cmd+K) to open search</p>
                <p>• Press Enter to search</p>
              </div>
            </div>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
