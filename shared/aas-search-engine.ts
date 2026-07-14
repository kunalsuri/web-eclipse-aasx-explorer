/**
 * AAS Search Engine
 * Full-text search engine for AAS content with indexing and ranking
 */

import type {
  Environment,
  AssetAdministrationShell,
  Submodel,
  SubmodelElement,
  LangStringTextType,
  Reference,
} from './aas-v3-types';
import type {
  SearchResult,
  SearchOptions,
  SearchIndexEntry,
  SearchMatch,
  SearchStatistics,
} from './aas-search-types';
import { SearchResultType, SearchField } from './aas-search-types';
import { AASSearchFilter, type AdvancedFilterOptions } from './aas-search-filters';

/**
 * AAS Search Engine
 * Provides full-text search capabilities for AAS environments
 */
export class AASSearchEngine {
  private index: Map<string, SearchIndexEntry> = new Map();
  private environment: Environment | null = null;

  /**
   * Index an AAS environment for searching
   */
  public indexEnvironment(environment: Environment): void {
    this.environment = environment;
    this.index.clear();

    // Index Asset Administration Shells
    if (environment.assetAdministrationShells) {
      for (const aas of environment.assetAdministrationShells) {
        this.indexAAS(aas, []);
      }
    }

    // Index Submodels
    if (environment.submodels) {
      for (const submodel of environment.submodels) {
        this.indexSubmodel(submodel, []);
      }
    }
  }

  /**
   * Search the indexed environment
   */
  public search(options: SearchOptions, filters?: AdvancedFilterOptions): SearchResult[] {
    const startTime = performance.now();

    if (!options.query || options.query.trim() === '') {
      return [];
    }

    const results: SearchResult[] = [];
    const query = options.caseSensitive ? options.query : options.query.toLowerCase();
    const maxResults = options.maxResults || 100;

    // Search through index
    for (const entry of this.index.values()) {
      // Filter by type if specified
      if (options.types && options.types.length > 0) {
        if (!options.types.includes(entry.type)) {
          continue;
        }
      }

      // Search in specified fields or all fields
      const matches = this.findMatches(entry, query, options);

      if (matches.length > 0) {
        const score = this.calculateScore(matches, query);
        results.push({
          id: entry.id,
          type: entry.type,
          idShort: entry.idShort,
          path: entry.path,
          matches,
          score,
          element: entry.element,
          parentId: entry.parentId,
          parentIdShort: entry.parentIdShort,
        });
      }

      // Stop if we've reached max results (before filtering)
      if (results.length >= maxResults * 2) {
        break;
      }
    }

    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);

    // Apply advanced filters if provided
    let filtered = results;
    if (filters) {
      filtered = AASSearchFilter.applyAdvancedFilters(results, filters);
    }

    return filtered.slice(0, maxResults);
  }

  /**
   * Get search statistics
   */
  public getStatistics(query: string, results: SearchResult[]): SearchStatistics {
    return {
      totalResults: results.length,
      searchTime: 0, // Will be calculated by caller
      indexSize: this.index.size,
      query,
    };
  }

  /**
   * Clear the search index
   */
  public clearIndex(): void {
    this.index.clear();
    this.environment = null;
  }

  /**
   * Get index size
   */
  public getIndexSize(): number {
    return this.index.size;
  }

  /**
   * Search by property value
   * Specialized search for finding elements by their value
   */
  public searchByPropertyValue(
    value: string,
    options?: Partial<SearchOptions>,
    filters?: AdvancedFilterOptions
  ): SearchResult[] {
    return this.search(
      {
        query: value,
        fields: [SearchField.Value],
        caseSensitive: options?.caseSensitive ?? false,
        wholeWord: options?.wholeWord ?? false,
        regex: options?.regex ?? false,
        maxResults: options?.maxResults ?? 100,
      },
      filters
    );
  }

  /**
   * Search by ID or idShort
   * Specialized search for finding elements by their identifiers
   */
  public searchById(id: string, options?: Partial<SearchOptions>): SearchResult[] {
    return this.search({
      query: id,
      fields: [SearchField.Id, SearchField.IdShort],
      caseSensitive: options?.caseSensitive ?? false,
      wholeWord: options?.wholeWord ?? false,
      regex: options?.regex ?? false,
      maxResults: options?.maxResults ?? 100,
    });
  }

  /**
   * Search by semantic ID
   * Specialized search for finding elements by their semantic identifier
   */
  public searchBySemanticId(semanticId: string, options?: Partial<SearchOptions>): SearchResult[] {
    return this.search({
      query: semanticId,
      fields: [SearchField.SemanticId],
      caseSensitive: options?.caseSensitive ?? false,
      wholeWord: options?.wholeWord ?? false,
      regex: options?.regex ?? false,
      maxResults: options?.maxResults ?? 100,
    });
  }

  /**
   * Search by description
   * Specialized search for finding elements by their description text
   */
  public searchByDescription(description: string, options?: Partial<SearchOptions>): SearchResult[] {
    return this.search({
      query: description,
      fields: [SearchField.Description],
      caseSensitive: options?.caseSensitive ?? false,
      wholeWord: options?.wholeWord ?? false,
      regex: options?.regex ?? false,
      maxResults: options?.maxResults ?? 100,
    });
  }

  /**
   * Search by display name
   * Specialized search for finding elements by their display name
   */
  public searchByDisplayName(displayName: string, options?: Partial<SearchOptions>): SearchResult[] {
    return this.search({
      query: displayName,
      fields: [SearchField.DisplayName],
      caseSensitive: options?.caseSensitive ?? false,
      wholeWord: options?.wholeWord ?? false,
      regex: options?.regex ?? false,
      maxResults: options?.maxResults ?? 100,
    });
  }

  /**
   * Search by category
   * Specialized search for finding elements by their category
   */
  public searchByCategory(category: string, options?: Partial<SearchOptions>): SearchResult[] {
    return this.search({
      query: category,
      fields: [SearchField.Category],
      caseSensitive: options?.caseSensitive ?? false,
      wholeWord: options?.wholeWord ?? false,
      regex: options?.regex ?? false,
      maxResults: options?.maxResults ?? 100,
    });
  }

  // ============================================================================
  // Private Methods - Indexing
  // ============================================================================

  private indexAAS(aas: AssetAdministrationShell, path: string[]): void {
    const currentPath = [...path, aas.idShort || aas.id];
    const searchableText = this.buildSearchableText({
      idShort: aas.idShort,
      id: aas.id,
      description: aas.description,
      displayName: aas.displayName,
      category: aas.category,
    });

    this.index.set(aas.id, {
      id: aas.id,
      type: SearchResultType.AssetAdministrationShell,
      idShort: aas.idShort || aas.id,
      path: currentPath,
      searchableText,
      element: aas,
    });
  }

  private indexSubmodel(submodel: Submodel, path: string[]): void {
    const currentPath = [...path, submodel.idShort || submodel.id];
    const searchableText = this.buildSearchableText({
      idShort: submodel.idShort,
      id: submodel.id,
      description: submodel.description,
      displayName: submodel.displayName,
      category: submodel.category,
      semanticId: submodel.semanticId,
    });

    this.index.set(submodel.id, {
      id: submodel.id,
      type: SearchResultType.Submodel,
      idShort: submodel.idShort || submodel.id,
      path: currentPath,
      searchableText,
      element: submodel,
    });

    // Index submodel elements
    if (submodel.submodelElements) {
      for (const element of submodel.submodelElements) {
        this.indexSubmodelElement(element, currentPath, submodel.id, submodel.idShort);
      }
    }
  }

  private indexSubmodelElement(
    element: SubmodelElement,
    path: string[],
    parentId?: string,
    parentIdShort?: string
  ): void {
    const elementId = this.getElementId(element);
    const currentPath = [...path, element.idShort || elementId];

    const searchableText = this.buildSearchableText({
      idShort: element.idShort,
      description: element.description,
      displayName: element.displayName,
      category: element.category,
      semanticId: element.semanticId,
      value: this.getElementValue(element) ?? undefined,
    });

    const type = this.getElementType(element);

    this.index.set(elementId, {
      id: elementId,
      type,
      idShort: element.idShort || elementId,
      path: currentPath,
      searchableText,
      element,
      parentId,
      parentIdShort,
    });

    // Recursively index nested elements
    if ('value' in element && Array.isArray(element.value)) {
      for (const child of element.value) {
        if (typeof child === 'object' && child !== null && 'idShort' in child) {
          this.indexSubmodelElement(child as SubmodelElement, currentPath, elementId, element.idShort);
        }
      }
    }
  }

  // ============================================================================
  // Private Methods - Searching
  // ============================================================================

  private findMatches(
    entry: SearchIndexEntry,
    query: string,
    options: SearchOptions
  ): SearchMatch[] {
    const matches: SearchMatch[] = [];
    const fields = options.fields || [SearchField.All];

    // If searching all fields, use the searchable text
    if (fields.includes(SearchField.All)) {
      const text = options.caseSensitive ? entry.searchableText : entry.searchableText.toLowerCase();
      const matchIndices = this.findAllOccurrences(text, query, options);

      for (const index of matchIndices) {
        matches.push({
          field: SearchField.All,
          value: entry.searchableText,
          matchedText: entry.searchableText.substring(index, index + query.length),
          startIndex: index,
          endIndex: index + query.length,
        });
      }
    } else {
      // Search specific fields
      for (const field of fields) {
        const fieldValue = this.getFieldValue(entry.element, field);
        if (fieldValue) {
          const text = options.caseSensitive ? fieldValue : fieldValue.toLowerCase();
          const matchIndices = this.findAllOccurrences(text, query, options);

          for (const index of matchIndices) {
            matches.push({
              field,
              value: fieldValue,
              matchedText: fieldValue.substring(index, index + query.length),
              startIndex: index,
              endIndex: index + query.length,
            });
          }
        }
      }
    }

    return matches;
  }

  private findAllOccurrences(text: string, query: string, options: SearchOptions): number[] {
    const indices: number[] = [];

    if (options.regex) {
      try {
        const flags = options.caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(query, flags);
        let match;
        while ((match = regex.exec(text)) !== null) {
          indices.push(match.index);
        }
      } catch (error) {
        // Invalid regex, fall back to literal search
        return this.findLiteralOccurrences(text, query, options.wholeWord);
      }
    } else {
      return this.findLiteralOccurrences(text, query, options.wholeWord);
    }

    return indices;
  }

  private findLiteralOccurrences(text: string, query: string, wholeWord?: boolean): number[] {
    const indices: number[] = [];
    let index = 0;

    while ((index = text.indexOf(query, index)) !== -1) {
      if (wholeWord) {
        const before = index > 0 ? text[index - 1] : ' ';
        const after = index + query.length < text.length ? text[index + query.length] : ' ';
        const isWordBoundary = /\W/.test(before) && /\W/.test(after);

        if (isWordBoundary) {
          indices.push(index);
        }
      } else {
        indices.push(index);
      }
      index += query.length;
    }

    return indices;
  }

  private calculateScore(matches: SearchMatch[], query: string): number {
    let score = 0;

    for (const match of matches) {
      // Base score for match
      score += 10;

      // Bonus for exact match
      if (match.matchedText === query) {
        score += 20;
      }

      // Bonus for match at start
      if (match.startIndex === 0) {
        score += 15;
      }

      // Bonus for specific field matches
      if (match.field === SearchField.IdShort) {
        score += 30;
      } else if (match.field === SearchField.Id) {
        score += 25;
      } else if (match.field === SearchField.DisplayName) {
        score += 20;
      }
    }

    return score;
  }

  // ============================================================================
  // Private Methods - Utilities
  // ============================================================================

  private buildSearchableText(data: {
    idShort?: string;
    id?: string;
    description?: LangStringTextType[];
    displayName?: LangStringTextType[];
    category?: string;
    semanticId?: Reference;
    value?: string;
  }): string {
    const parts: string[] = [];

    if (data.idShort) parts.push(data.idShort);
    if (data.id) parts.push(data.id);
    if (data.category) parts.push(data.category);
    if (data.value) parts.push(data.value);

    if (data.description) {
      for (const desc of data.description) {
        parts.push(desc.text);
      }
    }

    if (data.displayName) {
      for (const name of data.displayName) {
        parts.push(name.text);
      }
    }

    if (data.semanticId) {
      const semanticIdStr = this.referenceToString(data.semanticId);
      if (semanticIdStr) parts.push(semanticIdStr);
    }

    return parts.join(' ');
  }

  private getFieldValue(
    element: AssetAdministrationShell | Submodel | SubmodelElement,
    field: SearchField
  ): string | null {
    switch (field) {
      case SearchField.IdShort:
        return element.idShort || null;
      case SearchField.Id:
        return 'id' in element ? element.id : null;
      case SearchField.Category:
        return element.category || null;
      case SearchField.Description:
        return element.description ? element.description.map((d) => d.text).join(' ') : null;
      case SearchField.DisplayName:
        return element.displayName ? element.displayName.map((d) => d.text).join(' ') : null;
      case SearchField.SemanticId:
        return 'semanticId' in element && element.semanticId
          ? this.referenceToString(element.semanticId)
          : null;
      case SearchField.Value:
        return this.getElementValue(element);
      default:
        return null;
    }
  }

  private getElementValue(element: any): string | null {
    if ('value' in element) {
      if (typeof element.value === 'string') {
        return element.value;
      } else if (Array.isArray(element.value)) {
        return element.value.map((v: any) => (typeof v === 'string' ? v : JSON.stringify(v))).join(' ');
      } else if (element.value && typeof element.value === 'object') {
        return JSON.stringify(element.value);
      }
    }
    return null;
  }

  private getElementId(element: SubmodelElement): string {
    // Generate a unique ID for elements that don't have one
    return element.idShort || `element_${Math.random().toString(36).substring(2, 11)}`;
  }

  private getElementType(element: SubmodelElement): SearchResultType {
    // Determine the type based on the element's modelType
    if ('modelType' in element) {
      const modelType = (element as any).modelType;
      if (modelType in SearchResultType) {
        return SearchResultType[modelType as keyof typeof SearchResultType];
      }
    }

    // Fallback: try to infer from properties
    if ('value' in element && typeof element.value === 'string') {
      return SearchResultType.Property;
    }
    if ('value' in element && Array.isArray(element.value)) {
      return SearchResultType.SubmodelElementCollection;
    }

    return SearchResultType.Property; // Default fallback
  }

  private referenceToString(reference: Reference): string {
    if (!reference.keys || reference.keys.length === 0) {
      return '';
    }
    return reference.keys.map((key) => key.value).join('/');
  }
}
