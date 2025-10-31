/**
 * Concept Details Modal Component
 * 
 * Displays full concept information in a modal dialog
 * Shows properties, data type, unit, definition, and classification hierarchy
 */

import { Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { DictionaryConcept } from '@shared/dictionary-types';

interface ConceptDetailsModalProps {
  readonly concept: DictionaryConcept | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onImport?: (concept: DictionaryConcept) => void;
}

export function ConceptDetailsModal({
  concept,
  open,
  onOpenChange,
  onImport,
}: ConceptDetailsModalProps) {
  if (!concept) return null;

  const preferredName = concept.preferredName?.[0]?.text || 'Unnamed Concept';
  const definition = concept.definition?.[0]?.text || 'No definition available';
  const shortName = concept.shortName?.[0]?.text;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl">{preferredName}</DialogTitle>
              <DialogDescription className="mt-1">
                {concept.id} • {concept.source.toUpperCase()}
                {concept.version && ` • v${concept.version}`}
              </DialogDescription>
            </div>
            {onImport && (
              <Button onClick={() => onImport(concept)} size="sm">
                <Download className="mr-2 h-4 w-4" />
                Import
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4">
            {/* Short Name */}
            {shortName && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Short Name
                </h3>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  {shortName}
                </p>
              </div>
            )}

            {/* Definition */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Definition
              </h3>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                {definition}
              </p>
            </div>

            <Separator />

            {/* Data Specification */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                Data Specification
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {concept.dataType && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Data Type
                    </p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {concept.dataType}
                    </p>
                  </div>
                )}
                {concept.unit && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Unit
                    </p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {concept.unit}
                    </p>
                  </div>
                )}
                {concept.unitId && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Unit ID
                    </p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {concept.unitId}
                    </p>
                  </div>
                )}
                {concept.valueFormat && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Value Format
                    </p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {concept.valueFormat}
                    </p>
                  </div>
                )}
                {concept.symbol && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Symbol
                    </p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {concept.symbol}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Value List */}
            {concept.valueList && (
              <>
                <Separator />
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Value List
                  </h3>
                  <div className="space-y-2">
                    {concept.valueList.valueReferencePairs?.map((pair) => (
                      <div
                        key={pair.value}
                        className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                      >
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {pair.value}
                        </p>
                        {pair.valueId && (
                          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                            ID: {pair.valueId.keys?.[0]?.value}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Classification */}
            {concept.classificationPath && concept.classificationPath.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Classification Hierarchy
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    {concept.classificationPath.map((path, idx) => (
                      <div key={path} className="flex items-center gap-2">
                        <span className="rounded-md bg-gray-100 px-2 py-1 dark:bg-gray-800">
                          {path}
                        </span>
                        {idx < concept.classificationPath!.length - 1 && (
                          <span className="text-gray-400">›</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Category */}
            {concept.category && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Category
                  </h3>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    {concept.category}
                  </p>
                </div>
              </>
            )}

            {/* Source of Definition */}
            {concept.sourceOfDefinition && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Source of Definition
                  </h3>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    {concept.sourceOfDefinition}
                  </p>
                </div>
              </>
            )}

            {/* Additional Properties */}
            {concept.properties && Object.keys(concept.properties).length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Additional Properties
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(concept.properties).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          {key}:
                        </span>
                        <span className="text-gray-900 dark:text-gray-100">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
