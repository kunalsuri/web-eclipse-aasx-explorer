/**
 * Filter Panel Component
 * 
 * Provides filtering options for dictionary search results
 * Includes data type, unit, category filters, and value list toggle
 */

import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { SearchFilters } from '@shared/dictionary-types';
import { DataTypeDefXsd } from '@shared/aas-v3-types';

interface FilterPanelProps {
  readonly filters: SearchFilters;
  readonly onFiltersChange: (filters: SearchFilters) => void;
  readonly onClearFilters?: () => void;
}

export function FilterPanel({ filters, onFiltersChange, onClearFilters }: FilterPanelProps) {
  const [open, setOpen] = useState(false);

  // Common data types
  const dataTypes = [
    DataTypeDefXsd.String,
    DataTypeDefXsd.Integer,
    DataTypeDefXsd.Double,
    DataTypeDefXsd.Boolean,
    DataTypeDefXsd.Date,
    DataTypeDefXsd.DateTime,
  ];

  // Common units
  const commonUnits = [
    '°C',
    '°F',
    'K',
    'm',
    'mm',
    'cm',
    'kg',
    'g',
    'V',
    'A',
    'W',
    'Pa',
    'bar',
    's',
    'min',
    'h',
  ];

  // Handle data type toggle
  const handleDataTypeToggle = (dataType: DataTypeDefXsd) => {
    const current = filters.dataType || [];
    const updated = current.includes(dataType)
      ? current.filter((t) => t !== dataType)
      : [...current, dataType];
    onFiltersChange({ ...filters, dataType: updated });
  };

  // Handle unit toggle
  const handleUnitToggle = (unit: string) => {
    const current = filters.unit || [];
    const updated = current.includes(unit)
      ? current.filter((u) => u !== unit)
      : [...current, unit];
    onFiltersChange({ ...filters, unit: updated });
  };

  // Handle value list toggle
  const handleValueListToggle = (checked: boolean) => {
    onFiltersChange({ ...filters, hasValueList: checked });
  };

  // Count active filters
  const activeFilterCount =
    (filters.dataType?.length || 0) +
    (filters.unit?.length || 0) +
    (filters.category?.length || 0) +
    (filters.hasValueList ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Filters</SheetTitle>
            {activeFilterCount > 0 && onClearFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-red-600 hover:text-red-700 dark:text-red-400"
              >
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
          <div className="space-y-6 py-6">
            {/* Data Type Filter */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                Data Type
              </h3>
              <div className="space-y-2">
                {dataTypes.map((dataType) => (
                  <div key={dataType} className="flex items-center space-x-2">
                    <Checkbox
                      id={`datatype-${dataType}`}
                      checked={filters.dataType?.includes(dataType) || false}
                      onCheckedChange={() => handleDataTypeToggle(dataType)}
                    />
                    <Label
                      htmlFor={`datatype-${dataType}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {dataType}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Unit Filter */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                Unit
              </h3>
              <div className="space-y-2">
                {commonUnits.map((unit) => (
                  <div key={unit} className="flex items-center space-x-2">
                    <Checkbox
                      id={`unit-${unit}`}
                      checked={filters.unit?.includes(unit) || false}
                      onCheckedChange={() => handleUnitToggle(unit)}
                    />
                    <Label
                      htmlFor={`unit-${unit}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {unit}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Value List Filter */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                Additional Options
              </h3>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-value-list"
                  checked={filters.hasValueList || false}
                  onCheckedChange={handleValueListToggle}
                />
                <Label
                  htmlFor="has-value-list"
                  className="text-sm font-normal cursor-pointer"
                >
                  Has Value List
                </Label>
              </div>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Only show concepts with predefined value lists
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
