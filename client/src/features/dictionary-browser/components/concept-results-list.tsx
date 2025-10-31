/**
 * Concept Results List Component
 * 
 * Displays dictionary concept search results with pagination
 * Supports selection for comparison and import actions
 */

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { DictionaryConcept } from '@shared/dictionary-types';

const RESULTS_PER_PAGE = 20;

interface ConceptResultsListProps {
  readonly concepts: DictionaryConcept[];
  readonly isLoading?: boolean;
  readonly selectedIds?: string[];
  readonly onSelect?: (conceptId: string) => void;
  readonly onImport?: (concept: DictionaryConcept) => void;
  readonly onViewDetails?: (concept: DictionaryConcept) => void;
}

export function ConceptResultsList({
  concepts,
  isLoading = false,
  selectedIds = [],
  onSelect,
  onImport,
  onViewDetails,
}: ConceptResultsListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination
  const totalPages = Math.ceil(concepts.length / RESULTS_PER_PAGE);
  const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
  const endIndex = startIndex + RESULTS_PER_PAGE;
  const currentConcepts = concepts.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Loading state
  if (isLoading) {
    const skeletonItems = Array.from({ length: 5 }, (_, i) => i);
    return (
      <div className="space-y-4">
        {skeletonItems.map((i) => (
          <Card key={`skeleton-${i}`} className="animate-pulse">
            <CardHeader>
              <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-2 h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
            </CardHeader>
            <CardContent>
              <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-2 h-3 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Empty state
  if (concepts.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No concepts found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {startIndex + 1}-{Math.min(endIndex, concepts.length)} of {concepts.length} results
      </div>

      {/* Concept cards */}
      <div className="space-y-3">
        {currentConcepts.map((concept) => (
          <ConceptCard
            key={concept.id}
            concept={concept}
            isSelected={selectedIds.includes(concept.id)}
            onSelect={onSelect}
            onImport={onImport}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center pt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => handlePageChange(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              {totalPages > 5 && currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

/**
 * Individual Concept Card Component
 */
interface ConceptCardProps {
  readonly concept: DictionaryConcept;
  readonly isSelected: boolean;
  readonly onSelect?: (conceptId: string) => void;
  readonly onImport?: (concept: DictionaryConcept) => void;
  readonly onViewDetails?: (concept: DictionaryConcept) => void;
}

function ConceptCard({
  concept,
  isSelected,
  onSelect,
  onImport,
  onViewDetails,
}: ConceptCardProps) {
  const preferredName = concept.preferredName?.[0]?.text || 'Unnamed Concept';
  const definition = concept.definition?.[0]?.text || 'No definition available';

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Selection checkbox */}
            {onSelect && (
              <div className="pt-1">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onSelect(concept.id)}
                  aria-label={`Select ${preferredName}`}
                />
              </div>
            )}

            {/* Concept info */}
            <div className="flex-1">
              <CardTitle
                className="cursor-pointer text-base hover:text-blue-600 dark:hover:text-blue-400"
                onClick={() => onViewDetails?.(concept)}
              >
                {preferredName}
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                {concept.id} • {concept.source.toUpperCase()}
              </CardDescription>
            </div>
          </div>

          {/* Import button */}
          {onImport && (
            <Button
              size="sm"
              onClick={() => onImport(concept)}
              className="flex-shrink-0"
            >
              <Download className="mr-1 h-3 w-3" />
              Import
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Definition */}
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
          {definition}
        </p>

        {/* Metadata */}
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
          {concept.dataType && (
            <span className="rounded-full bg-blue-100 px-2 py-1 dark:bg-blue-900/30">
              Type: {concept.dataType}
            </span>
          )}
          {concept.unit && (
            <span className="rounded-full bg-green-100 px-2 py-1 dark:bg-green-900/30">
              Unit: {concept.unit}
            </span>
          )}
          {concept.category && (
            <span className="rounded-full bg-purple-100 px-2 py-1 dark:bg-purple-900/30">
              {concept.category}
            </span>
          )}
        </div>

        {/* Classification path */}
        {concept.classificationPath && concept.classificationPath.length > 0 && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
            {concept.classificationPath.join(' > ')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
