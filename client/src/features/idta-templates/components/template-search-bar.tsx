/**
 * Template Search Bar Component
 * Search and filter interface for templates
 * Implementation will be added in Task 5.2
 */

import type { TemplateFilters } from '@/../../shared/idta-templates-types';

export interface TemplateSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: TemplateFilters;
  onFiltersChange: (filters: TemplateFilters) => void;
  activeFilterCount: number;
}

export function TemplateSearchBar(props: TemplateSearchBarProps) {
  return (
    <div>
      <input
        type="text"
        value={props.searchQuery}
        onChange={(e) => props.onSearchChange(e.target.value)}
        placeholder="Search templates..."
      />
      {/* Implementation will be added in Task 5.2 */}
    </div>
  );
}
