/**
 * AAS Search Filters
 * Advanced filtering system for search results
 */

import type { SearchResult } from './aas-search-types';
import { SearchResultType } from './aas-search-types';
import type { SubmodelElement } from './aas-v3-types';

/**
 * Filter operator types
 */
export enum FilterOperator {
  Equals = 'equals',
  NotEquals = 'notEquals',
  Contains = 'contains',
  NotContains = 'notContains',
  StartsWith = 'startsWith',
  EndsWith = 'endsWith',
  GreaterThan = 'greaterThan',
  GreaterThanOrEqual = 'greaterThanOrEqual',
  LessThan = 'lessThan',
  LessThanOrEqual = 'lessThanOrEqual',
  Between = 'between',
  In = 'in',
  NotIn = 'notIn',
  Matches = 'matches', // Regex
}

/**
 * Filter condition
 */
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
  value2?: any; // For 'between' operator
}

/**
 * Logical operator for combining filters
 */
export enum LogicalOperator {
  And = 'and',
  Or = 'or',
}

/**
 * Filter group with logical operator
 */
export interface FilterGroup {
  operator: LogicalOperator;
  conditions: (FilterCondition | FilterGroup)[];
}

/**
 * Type filter options
 */
export interface TypeFilter {
  types: SearchResultType[];
  exclude?: boolean; // If true, exclude these types instead of including
}

/**
 * Semantic ID filter options
 */
export interface SemanticIdFilter {
  semanticIds: string[];
  exactMatch?: boolean; // If true, require exact match; otherwise partial match
  exclude?: boolean;
}

/**
 * Value range filter options
 */
export interface ValueRangeFilter {
  min?: number;
  max?: number;
  includeMin?: boolean;
  includeMax?: boolean;
}

/**
 * Path filter options
 */
export interface PathFilter {
  pathPattern: string; // Glob pattern or regex
  regex?: boolean;
}

/**
 * Combined filter options
 */
export interface AdvancedFilterOptions {
  typeFilter?: TypeFilter;
  semanticIdFilter?: SemanticIdFilter;
  valueRangeFilter?: ValueRangeFilter;
  pathFilter?: PathFilter;
  customFilter?: FilterGroup;
  scoreThreshold?: number; // Minimum score to include
}

/**
 * AAS Search Filter Engine
 * Applies advanced filters to search results
 */
export class AASSearchFilter {
  /**
   * Apply type filter
   */
  public static filterByType(results: SearchResult[], filter: TypeFilter): SearchResult[] {
    if (filter.exclude) {
      return results.filter((result) => !filter.types.includes(result.type));
    } else {
      return results.filter((result) => filter.types.includes(result.type));
    }
  }

  /**
   * Apply semantic ID filter
   */
  public static filterBySemanticId(results: SearchResult[], filter: SemanticIdFilter): SearchResult[] {
    return results.filter((result) => {
      const element = result.element as any;
      if (!element.semanticId) {
        return filter.exclude ? true : false;
      }

      const semanticIdStr = this.extractSemanticId(element.semanticId);
      if (!semanticIdStr) {
        return filter.exclude ? true : false;
      }

      const matches = filter.semanticIds.some((filterSemanticId) => {
        if (filter.exactMatch) {
          return semanticIdStr === filterSemanticId;
        } else {
          return semanticIdStr.includes(filterSemanticId);
        }
      });

      return filter.exclude ? !matches : matches;
    });
  }

  /**
   * Apply value range filter
   */
  public static filterByValueRange(results: SearchResult[], filter: ValueRangeFilter): SearchResult[] {
    return results.filter((result) => {
      const element = result.element as any;
      if (!('value' in element)) {
        return false;
      }

      const value = this.extractNumericValue(element.value);
      if (value === null) {
        return false;
      }

      // Check minimum
      if (filter.min !== undefined) {
        if (filter.includeMin) {
          if (value < filter.min) return false;
        } else {
          if (value <= filter.min) return false;
        }
      }

      // Check maximum
      if (filter.max !== undefined) {
        if (filter.includeMax) {
          if (value > filter.max) return false;
        } else {
          if (value >= filter.max) return false;
        }
      }

      return true;
    });
  }

  /**
   * Apply path filter
   */
  public static filterByPath(results: SearchResult[], filter: PathFilter): SearchResult[] {
    return results.filter((result) => {
      const pathStr = result.path.join('/');

      if (filter.regex) {
        try {
          const regex = new RegExp(filter.pathPattern);
          return regex.test(pathStr);
        } catch {
          return false;
        }
      } else {
        // Simple glob-like matching
        const pattern = filter.pathPattern
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(pathStr);
      }
    });
  }

  /**
   * Apply score threshold filter
   */
  public static filterByScore(results: SearchResult[], threshold: number): SearchResult[] {
    return results.filter((result) => result.score >= threshold);
  }

  /**
   * Apply custom filter expression
   */
  public static filterByCustomExpression(results: SearchResult[], filterGroup: FilterGroup): SearchResult[] {
    return results.filter((result) => this.evaluateFilterGroup(result, filterGroup));
  }

  /**
   * Apply all advanced filters
   */
  public static applyAdvancedFilters(
    results: SearchResult[],
    options: AdvancedFilterOptions
  ): SearchResult[] {
    let filtered = results;

    // Apply type filter
    if (options.typeFilter) {
      filtered = this.filterByType(filtered, options.typeFilter);
    }

    // Apply semantic ID filter
    if (options.semanticIdFilter) {
      filtered = this.filterBySemanticId(filtered, options.semanticIdFilter);
    }

    // Apply value range filter
    if (options.valueRangeFilter) {
      filtered = this.filterByValueRange(filtered, options.valueRangeFilter);
    }

    // Apply path filter
    if (options.pathFilter) {
      filtered = this.filterByPath(filtered, options.pathFilter);
    }

    // Apply score threshold
    if (options.scoreThreshold !== undefined) {
      filtered = this.filterByScore(filtered, options.scoreThreshold);
    }

    // Apply custom filter
    if (options.customFilter) {
      filtered = this.filterByCustomExpression(filtered, options.customFilter);
    }

    return filtered;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private static evaluateFilterGroup(result: SearchResult, group: FilterGroup): boolean {
    const results = group.conditions.map((condition) => {
      if ('operator' in condition && 'conditions' in condition) {
        // It's a nested FilterGroup
        return this.evaluateFilterGroup(result, condition as FilterGroup);
      } else {
        // It's a FilterCondition
        return this.evaluateFilterCondition(result, condition as FilterCondition);
      }
    });

    if (group.operator === LogicalOperator.And) {
      return results.every((r) => r);
    } else {
      return results.some((r) => r);
    }
  }

  private static evaluateFilterCondition(result: SearchResult, condition: FilterCondition): boolean {
    const fieldValue = this.getFieldValue(result, condition.field);

    switch (condition.operator) {
      case FilterOperator.Equals:
        return fieldValue === condition.value;

      case FilterOperator.NotEquals:
        return fieldValue !== condition.value;

      case FilterOperator.Contains:
        return String(fieldValue).includes(String(condition.value));

      case FilterOperator.NotContains:
        return !String(fieldValue).includes(String(condition.value));

      case FilterOperator.StartsWith:
        return String(fieldValue).startsWith(String(condition.value));

      case FilterOperator.EndsWith:
        return String(fieldValue).endsWith(String(condition.value));

      case FilterOperator.GreaterThan:
        return Number(fieldValue) > Number(condition.value);

      case FilterOperator.GreaterThanOrEqual:
        return Number(fieldValue) >= Number(condition.value);

      case FilterOperator.LessThan:
        return Number(fieldValue) < Number(condition.value);

      case FilterOperator.LessThanOrEqual:
        return Number(fieldValue) <= Number(condition.value);

      case FilterOperator.Between:
        const numValue = Number(fieldValue);
        return numValue >= Number(condition.value) && numValue <= Number(condition.value2);

      case FilterOperator.In:
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);

      case FilterOperator.NotIn:
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);

      case FilterOperator.Matches:
        try {
          const regex = new RegExp(String(condition.value));
          return regex.test(String(fieldValue));
        } catch {
          return false;
        }

      default:
        return false;
    }
  }

  private static getFieldValue(result: SearchResult, field: string): any {
    // Support dot notation for nested fields
    const parts = field.split('.');
    let value: any = result;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else if (value && typeof value === 'object' && 'element' in value && part in value.element) {
        value = value.element[part];
      } else {
        return null;
      }
    }

    return value;
  }

  private static extractSemanticId(semanticId: any): string | null {
    if (!semanticId || !semanticId.keys || !Array.isArray(semanticId.keys)) {
      return null;
    }

    return semanticId.keys.map((key: any) => key.value).join('/');
  }

  private static extractNumericValue(value: any): number | null {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    }

    return null;
  }
}
