/**
 * Hook for fetching and managing IDTA template list
 * Implementation will be added in Task 4.1
 */

import type { IdtaTemplate } from '@/../../shared/idta-templates-types';

export interface UseIdtaTemplatesReturn {
  templates: IdtaTemplate[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  lastUpdated: Date | null;
}

export function useIdtaTemplates(): UseIdtaTemplatesReturn {
  // Stub implementation
  return {
    templates: [],
    isLoading: false,
    error: null,
    refetch: () => {},
    lastUpdated: null,
  };
}
