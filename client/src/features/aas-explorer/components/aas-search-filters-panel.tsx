/**
 * AAS Search Filters Panel Component
 * Filter sidebar with multi-select filters and presets
 */

import { useState, useCallback } from 'react';
import { Filter, X, Save, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SearchResultType } from '../../../../../shared/aas-search-types';
import type { AdvancedFilterOptions } from '../../../../../shared/aas-search-filters';

interface AASSearchFiltersPanelProps {
  onFiltersChange: (filters: AdvancedFilterOptions) => void;
  currentFilters: AdvancedFilterOptions;
}

interface FilterPreset {
  id: string;
  name: string;
  filters: AdvancedFilterOptions;
}

const ELEMENT_TYPES = [
  { value: SearchResultType.AssetAdministrationShell, label: 'Asset Administration Shell' },
  { value: SearchResultType.Submodel, label: 'Submodel' },
  { value: SearchResultType.Property, label: 'Property' },
  { value: SearchResultType.MultiLanguageProperty, label: 'Multi-Language Property' },
  { value: SearchResultType.Range, label: 'Range' },
  { value: SearchResultType.ReferenceElement, label: 'Reference Element' },
  { value: SearchResultType.File, label: 'File' },
  { value: SearchResultType.Blob, label: 'Blob' },
  { value: SearchResultType.SubmodelElementCollection, label: 'Collection' },
  { value: SearchResultType.SubmodelElementList, label: 'List' },
];

export function AASSearchFiltersPanel({
  onFiltersChange,
  currentFilters,
}: AASSearchFiltersPanelProps) {
  const [selectedTypes, setSelectedTypes] = useState<SearchResultType[]>(
    currentFilters.typeFilter?.types || []
  );
  const [minValue, setMinValue] = useState<string>(
    currentFilters.valueRangeFilter?.min?.toString() || ''
  );
  const [maxValue, setMaxValue] = useState<string>(
    currentFilters.valueRangeFilter?.max?.toString() || ''
  );
  const [pathPattern, setPathPattern] = useState<string>(
    currentFilters.pathFilter?.pathPattern || ''
  );
  const [scoreThreshold, setScoreThreshold] = useState<string>(
    currentFilters.scoreThreshold?.toString() || ''
  );
  const [presets, setPresets] = useState<FilterPreset[]>(() => {
    const stored = localStorage.getItem('aas-filter-presets');
    return stored ? JSON.parse(stored) : [];
  });
  const [presetName, setPresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Apply filters
  const applyFilters = useCallback(() => {
    const filters: AdvancedFilterOptions = {};

    // Type filter
    if (selectedTypes.length > 0) {
      filters.typeFilter = {
        types: selectedTypes,
      };
    }

    // Value range filter
    if (minValue || maxValue) {
      filters.valueRangeFilter = {
        min: minValue ? parseFloat(minValue) : undefined,
        max: maxValue ? parseFloat(maxValue) : undefined,
        includeMin: true,
        includeMax: true,
      };
    }

    // Path filter
    if (pathPattern) {
      filters.pathFilter = {
        pathPattern,
      };
    }

    // Score threshold
    if (scoreThreshold) {
      filters.scoreThreshold = parseFloat(scoreThreshold);
    }

    onFiltersChange(filters);
  }, [selectedTypes, minValue, maxValue, pathPattern, scoreThreshold, onFiltersChange]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedTypes([]);
    setMinValue('');
    setMaxValue('');
    setPathPattern('');
    setScoreThreshold('');
    onFiltersChange({});
  }, [onFiltersChange]);

  // Toggle type selection
  function toggleType(type: SearchResultType) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  // Save preset
  function savePreset() {
    if (!presetName.trim()) return;

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName,
      filters: {
        typeFilter: selectedTypes.length > 0 ? { types: selectedTypes } : undefined,
        valueRangeFilter:
          minValue || maxValue
            ? {
                min: minValue ? parseFloat(minValue) : undefined,
                max: maxValue ? parseFloat(maxValue) : undefined,
                includeMin: true,
                includeMax: true,
              }
            : undefined,
        pathFilter: pathPattern ? { pathPattern } : undefined,
        scoreThreshold: scoreThreshold ? parseFloat(scoreThreshold) : undefined,
      },
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem('aas-filter-presets', JSON.stringify(updated));
    setPresetName('');
    setShowSaveDialog(false);
  }

  // Load preset
  function loadPreset(preset: FilterPreset) {
    setSelectedTypes(preset.filters.typeFilter?.types || []);
    setMinValue(preset.filters.valueRangeFilter?.min?.toString() || '');
    setMaxValue(preset.filters.valueRangeFilter?.max?.toString() || '');
    setPathPattern(preset.filters.pathFilter?.pathPattern || '');
    setScoreThreshold(preset.filters.scoreThreshold?.toString() || '');
    onFiltersChange(preset.filters);
  }

  // Delete preset
  function deletePreset(presetId: string) {
    const updated = presets.filter((p) => p.id !== presetId);
    setPresets(updated);
    localStorage.setItem('aas-filter-presets', JSON.stringify(updated));
  }

  // Count active filters
  const activeFilterCount =
    (selectedTypes.length > 0 ? 1 : 0) +
    (minValue || maxValue ? 1 : 0) +
    (pathPattern ? 1 : 0) +
    (scoreThreshold ? 1 : 0);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filters</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount}</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
        <CardDescription>Refine your search results</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="space-y-6 p-6 pt-0">
            {/* Element Types */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Element Types</Label>
              <div className="space-y-2">
                {ELEMENT_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.value}
                      checked={selectedTypes.includes(type.value)}
                      onCheckedChange={() => toggleType(type.value)}
                    />
                    <label
                      htmlFor={type.value}
                      className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Value Range */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Value Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="min-value" className="text-xs">
                    Min
                  </Label>
                  <Input
                    id="min-value"
                    type="number"
                    placeholder="Min"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="max-value" className="text-xs">
                    Max
                  </Label>
                  <Input
                    id="max-value"
                    type="number"
                    placeholder="Max"
                    value={maxValue}
                    onChange={(e) => setMaxValue(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Path Pattern */}
            <div className="space-y-3">
              <Label htmlFor="path-pattern" className="text-sm font-semibold">
                Path Pattern
              </Label>
              <Input
                id="path-pattern"
                placeholder="e.g., TechnicalData/*"
                value={pathPattern}
                onChange={(e) => setPathPattern(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use * for wildcards (e.g., TechnicalData/*)
              </p>
            </div>

            <Separator />

            {/* Score Threshold */}
            <div className="space-y-3">
              <Label htmlFor="score-threshold" className="text-sm font-semibold">
                Minimum Score
              </Label>
              <Input
                id="score-threshold"
                type="number"
                placeholder="e.g., 20"
                value={scoreThreshold}
                onChange={(e) => setScoreThreshold(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Only show results with score above this value
              </p>
            </div>

            <Separator />

            {/* Apply button */}
            <Button onClick={applyFilters} className="w-full">
              Apply Filters
            </Button>

            <Separator />

            {/* Presets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Filter Presets</Label>
                <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Filter Preset</DialogTitle>
                      <DialogDescription>
                        Save your current filters as a preset for quick access later.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="preset-name">Preset Name</Label>
                        <Input
                          id="preset-name"
                          placeholder="e.g., Technical Properties"
                          value={presetName}
                          onChange={(e) => setPresetName(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={savePreset} disabled={!presetName.trim()}>
                        Save Preset
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {presets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved presets</p>
              ) : (
                <div className="space-y-2">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between rounded-lg border p-2"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 justify-start"
                        onClick={() => loadPreset(preset)}
                      >
                        {preset.name}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePreset(preset.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
