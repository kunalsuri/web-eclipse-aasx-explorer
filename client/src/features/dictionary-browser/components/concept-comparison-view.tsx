/**
 * Concept Comparison View Component
 * 
 * Displays up to 4 concepts side-by-side for comparison
 * Highlights differences in data types, units, and definitions
 */

import { Download, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { DictionaryConcept } from '@shared/dictionary-types';

const MAX_CONCEPTS = 4;

interface ConceptComparisonViewProps {
  readonly concepts: DictionaryConcept[];
  readonly onImport?: (concept: DictionaryConcept) => void;
  readonly onRemove?: (conceptId: string) => void;
  readonly onClose?: () => void;
}

export function ConceptComparisonView({
  concepts,
  onImport,
  onRemove,
  onClose,
}: ConceptComparisonViewProps) {
  const displayConcepts = concepts.slice(0, MAX_CONCEPTS);

  if (displayConcepts.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select concepts to compare
        </p>
      </div>
    );
  }

  // Detect differences
  const hasDifferentDataTypes = new Set(displayConcepts.map((c) => c.dataType)).size > 1;
  const hasDifferentUnits = new Set(displayConcepts.map((c) => c.unit)).size > 1;
  const hasDifferentDefinitions = new Set(
    displayConcepts.map((c) => c.definition?.[0]?.text)
  ).size > 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Concept Comparison
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Comparing {displayConcepts.length} of {concepts.length} selected concepts
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Comparison Grid */}
      <ScrollArea className="w-full">
        <div className={`grid gap-4 ${getGridClass(displayConcepts.length)}`}>
          {displayConcepts.map((concept) => (
            <ConceptComparisonCard
              key={concept.id}
              concept={concept}
              highlightDataType={hasDifferentDataTypes}
              highlightUnit={hasDifferentUnits}
              highlightDefinition={hasDifferentDefinitions}
              onImport={onImport}
              onRemove={onRemove}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Legend */}
      {(hasDifferentDataTypes || hasDifferentUnits || hasDifferentDefinitions) && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900/50 dark:bg-yellow-900/20">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            <span className="font-semibold">Highlighted fields</span> indicate differences
            between concepts
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Individual Concept Comparison Card
 */
interface ConceptComparisonCardProps {
  readonly concept: DictionaryConcept;
  readonly highlightDataType: boolean;
  readonly highlightUnit: boolean;
  readonly highlightDefinition: boolean;
  readonly onImport?: (concept: DictionaryConcept) => void;
  readonly onRemove?: (conceptId: string) => void;
}

function ConceptComparisonCard({
  concept,
  highlightDataType,
  highlightUnit,
  highlightDefinition,
  onImport,
  onRemove,
}: ConceptComparisonCardProps) {
  const preferredName = concept.preferredName?.[0]?.text || 'Unnamed Concept';
  const definition = concept.definition?.[0]?.text || 'No definition available';

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm">{preferredName}</CardTitle>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={() => onRemove(concept.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {concept.id}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          {concept.source.toUpperCase()}
        </p>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pt-0">
        {/* Definition */}
        <div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Definition
          </p>
          <p
            className={`mt-1 text-xs text-gray-900 dark:text-gray-100 line-clamp-3 ${
              highlightDefinition ? 'rounded bg-yellow-100 p-1 dark:bg-yellow-900/30' : ''
            }`}
          >
            {definition}
          </p>
        </div>

        {/* Data Type */}
        <div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Data Type
          </p>
          <p
            className={`mt-1 text-xs text-gray-900 dark:text-gray-100 ${
              highlightDataType ? 'rounded bg-yellow-100 p-1 dark:bg-yellow-900/30' : ''
            }`}
          >
            {concept.dataType || 'Not specified'}
          </p>
        </div>

        {/* Unit */}
        <div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Unit
          </p>
          <p
            className={`mt-1 text-xs text-gray-900 dark:text-gray-100 ${
              highlightUnit ? 'rounded bg-yellow-100 p-1 dark:bg-yellow-900/30' : ''
            }`}
          >
            {concept.unit || 'Not specified'}
          </p>
        </div>

        {/* Category */}
        {concept.category && (
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Category
            </p>
            <p className="mt-1 text-xs text-gray-900 dark:text-gray-100">
              {concept.category}
            </p>
          </div>
        )}

        {/* Classification Path */}
        {concept.classificationPath && concept.classificationPath.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Classification
            </p>
            <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">
              {concept.classificationPath.join(' > ')}
            </p>
          </div>
        )}

        {/* Import Button */}
        {onImport && (
          <Button
            size="sm"
            className="w-full"
            onClick={() => onImport(concept)}
          >
            <Download className="mr-1 h-3 w-3" />
            Import
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Get grid class based on number of concepts
 */
function getGridClass(count: number): string {
  switch (count) {
    case 1:
      return 'grid-cols-1';
    case 2:
      return 'grid-cols-1 md:grid-cols-2';
    case 3:
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    case 4:
    default:
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
  }
}
