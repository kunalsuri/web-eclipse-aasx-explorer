/**
 * Reference Editor
 * 
 * Autocomplete editor for Reference and ReferenceElement types.
 * Provides fuzzy search across environment elements with type filtering.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, ExternalLink } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import type { PropertyEditorProps } from './types';

// ============================================================================
// Types
// ============================================================================

interface Reference {
  type: 'ModelReference' | 'ExternalReference';
  keys: Key[];
}

interface Key {
  type: KeyTypes;
  value: string;
}

type KeyTypes = 
  | 'AssetAdministrationShell'
  | 'Submodel'
  | 'SubmodelElement'
  | 'ConceptDescription'
  | 'Property'
  | 'MultiLanguageProperty'
  | 'Range'
  | 'ReferenceElement'
  | 'Blob'
  | 'File'
  | 'SubmodelElementCollection'
  | 'SubmodelElementList'
  | 'Entity'
  | 'RelationshipElement'
  | 'AnnotatedRelationshipElement'
  | 'Operation'
  | 'Capability'
  | 'BasicEventElement';

interface ReferenceSuggestion {
  id: string;
  idShort: string;
  type: KeyTypes;
  path: Key[];
  semanticId?: Reference;
  displayName: string;
  description?: string;
}

// ============================================================================
// Reference Editor Component
// ============================================================================

export function ReferenceEditor({
  value,
  onChange,
  onBlur,
  validation,
  disabled,
  placeholder = 'Search for element...',
  metadata,
  autoFocus,
}: PropertyEditorProps<Reference | null>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<ReferenceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Format reference for display
  const formatReference = (ref: Reference | null): string => {
    if (!ref || !ref.keys || ref.keys.length === 0) {
      return '';
    }
    return ref.keys.map(k => k.value).join(' / ');
  };

  // Search for suggestions
  const searchSuggestions = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // API call will be implemented when integrating with backend
      // const results = await api.searchElements(term, metadata?.filterType);
      
      // Mock suggestions for now
      const allSuggestions: ReferenceSuggestion[] = [
        {
          id: 'shell-1',
          idShort: 'ExampleShell',
          type: 'AssetAdministrationShell',
          path: [{ type: 'AssetAdministrationShell', value: 'shell-1' }],
          displayName: 'Example Shell',
          description: 'An example asset administration shell',
        },
        {
          id: 'submodel-1',
          idShort: 'TechnicalData',
          type: 'Submodel',
          path: [{ type: 'Submodel', value: 'submodel-1' }],
          displayName: 'Technical Data Submodel',
        },
      ];

      const mockSuggestions = allSuggestions.filter(s =>
        s.idShort.toLowerCase().includes(term.toLowerCase()) ||
        s.displayName.toLowerCase().includes(term.toLowerCase())
      );

      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Failed to search suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [metadata]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchSuggestions(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, searchSuggestions]);

  // Handle suggestion selection
  const selectSuggestion = useCallback((suggestion: ReferenceSuggestion) => {
    const reference: Reference = {
      type: 'ModelReference',
      keys: suggestion.path,
    };

    onChange(reference);
    setSearchTerm('');
    setShowSuggestions(false);
    setSelectedIndex(0);
  }, [onChange]);

  // Handle clear
  const handleClear = useCallback(() => {
    onChange(null);
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
  }, [onChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        onBlur?.();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSearchTerm('');
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, selectSuggestion, onBlur]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasValue = value && value.keys && value.keys.length > 0;
  const hasError = validation && !validation.isValid;

  return (
    <div className="relative w-full">
      {/* Current Value Display */}
      {hasValue && !showSuggestions && (
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 border rounded-md bg-background',
          hasError && 'border-destructive',
          disabled && 'opacity-50 cursor-not-allowed'
        )}>
          <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="flex-1 text-sm truncate">
            {formatReference(value)}
          </span>
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Search Input */}
      {(!hasValue || showSuggestions) && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            className={cn(
              'pl-9',
              hasError && 'border-destructive'
            )}
          />
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && (searchTerm.length >= 2 || suggestions.length > 0) && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {isLoading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Searching...
            </div>
          )}

          {!isLoading && suggestions.length === 0 && searchTerm.length >= 2 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No elements found
            </div>
          )}

          {!isLoading && suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => selectSuggestion(suggestion)}
              className={cn(
                'w-full px-3 py-2 text-left hover:bg-accent transition-colors',
                index === selectedIndex && 'bg-accent'
              )}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {suggestion.idShort}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {suggestion.displayName}
                  </div>
                  {suggestion.description && (
                    <div className="text-xs text-muted-foreground truncate mt-1">
                      {suggestion.description}
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground flex-shrink-0">
                  {suggestion.type}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Manual Entry Link */}
      {!hasValue && !showSuggestions && (
        <button
          type="button"
          onClick={() => setShowSuggestions(true)}
          className="text-xs text-primary hover:underline mt-1"
          disabled={disabled}
        >
          Search or enter reference manually
        </button>
      )}
    </div>
  );
}
