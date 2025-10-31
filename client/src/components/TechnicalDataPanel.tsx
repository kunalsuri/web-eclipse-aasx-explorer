/**
 * Technical Data Panel Component
 * 
 * React component for displaying technical properties in a table format
 * Supports sorting, filtering, grouping, and unit conversion
 */

import { useState, useMemo, useCallback } from "react";
import { Table, Search, Filter, Download, ChevronDown, ChevronRight } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface TechnicalProperty {
  idShort: string;
  semanticId?: string;
  value: string;
  valueType: string;
  unit?: string;
  description?: string;
  category?: string;
}

interface PropertyGroup {
  name: string;
  semanticId: string;
  properties: TechnicalProperty[];
}

interface TechnicalDataPanelProps {
  properties: TechnicalProperty[];
  onExport?: (format: "csv" | "excel") => void;
  onUnitChange?: (property: TechnicalProperty, newUnit: string) => void;
}

// ============================================================================
// Property Row Component
// ============================================================================

interface PropertyRowProps {
  property: TechnicalProperty;
  onUnitChange?: (newUnit: string) => void;
}

function PropertyRow({ property, onUnitChange }: PropertyRowProps) {
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
        {property.idShort}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
        {property.value}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
        {property.unit || "-"}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
        {property.valueType}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-500">
        {property.description || "-"}
      </td>
    </tr>
  );
}

// ============================================================================
// Property Group Component
// ============================================================================

interface PropertyGroupProps {
  group: PropertyGroup;
  onUnitChange?: (property: TechnicalProperty, newUnit: string) => void;
}

function PropertyGroupComponent({ group, onUnitChange }: PropertyGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-4">
      {/* Group header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 rounded-lg bg-gray-100 px-4 py-3 text-left font-medium text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span>{group.name}</span>
        <span className="ml-auto text-sm text-gray-600 dark:text-gray-400">
          {group.properties.length} properties
        </span>
      </button>

      {/* Group properties */}
      {isExpanded && (
        <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Property
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Value
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Unit
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900">
              {group.properties.map((prop, idx) => (
                <PropertyRow
                  key={`${prop.idShort}-${idx}`}
                  property={prop}
                  onUnitChange={(unit) => onUnitChange?.(prop, unit)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Technical Data Panel Component
// ============================================================================

export function TechnicalDataPanel({
  properties,
  onExport,
  onUnitChange
}: TechnicalDataPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "value" | "type">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [groupByCategory, setGroupByCategory] = useState(true);

  // Group properties by semantic ID or category
  const groupedProperties = useMemo(() => {
    if (!groupByCategory) {
      return [{
        name: "All Properties",
        semanticId: "",
        properties
      }];
    }

    const groups = new Map<string, PropertyGroup>();

    for (const prop of properties) {
      const groupKey = prop.category || prop.semanticId || "Other";
      const groupName = prop.category || extractGroupName(prop.semanticId) || "Other";

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          name: groupName,
          semanticId: groupKey,
          properties: []
        });
      }

      groups.get(groupKey)!.properties.push(prop);
    }

    return Array.from(groups.values());
  }, [properties, groupByCategory]);

  // Filter and sort properties
  const filteredGroups = useMemo(() => {
    return groupedProperties.map(group => ({
      ...group,
      properties: group.properties
        .filter(prop => {
          if (!searchQuery) return true;
          const query = searchQuery.toLowerCase();
          return (
            prop.idShort.toLowerCase().includes(query) ||
            prop.value.toLowerCase().includes(query) ||
            prop.description?.toLowerCase().includes(query)
          );
        })
        .sort((a, b) => {
          let comparison = 0;
          
          if (sortBy === "name") {
            comparison = a.idShort.localeCompare(b.idShort);
          } else if (sortBy === "value") {
            comparison = a.value.localeCompare(b.value);
          } else if (sortBy === "type") {
            comparison = a.valueType.localeCompare(b.valueType);
          }

          return sortOrder === "asc" ? comparison : -comparison;
        })
    })).filter(group => group.properties.length > 0);
  }, [groupedProperties, searchQuery, sortBy, sortOrder]);

  // Calculate total properties
  const totalProperties = filteredGroups.reduce(
    (sum, group) => sum + group.properties.length,
    0
  );

  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Technical Data
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {totalProperties} properties
            </p>
          </div>

          {/* Export button */}
          {onExport && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onExport("csv")}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => onExport("excel")}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                Export Excel
              </button>
            </div>
          )}
        </div>

        {/* Search and controls */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "value" | "type")}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            aria-label="Sort by"
          >
            <option value="name">Sort by Name</option>
            <option value="value">Sort by Value</option>
            <option value="type">Sort by Type</option>
          </select>

          {/* Sort order */}
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
            title={sortOrder === "asc" ? "Ascending" : "Descending"}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>

          {/* Group toggle */}
          <button
            type="button"
            onClick={() => setGroupByCategory(!groupByCategory)}
            className={`rounded-lg border px-3 py-2 text-sm ${
              groupByCategory
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            <Filter className="inline h-4 w-4" /> Group
          </button>
        </div>
      </div>

      {/* Property groups */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredGroups.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Table className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                No properties found
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {searchQuery
                  ? "Try adjusting your search"
                  : "No technical data available"}
              </p>
            </div>
          </div>
        ) : (
          <div>
            {filteredGroups.map((group, idx) => (
              <PropertyGroupComponent
                key={`${group.semanticId}-${idx}`}
                group={group}
                onUnitChange={onUnitChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function extractGroupName(semanticId?: string): string | null {
  if (!semanticId) return null;

  // Extract last part of semantic ID as group name
  const parts = semanticId.split("/");
  const lastPart = parts[parts.length - 1];

  // Convert camelCase or PascalCase to readable format
  return lastPart
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

// ============================================================================
// Custom Hook for Technical Data
// ============================================================================

export function useTechnicalData(submodelId: string) {
  const [properties, setProperties] = useState<TechnicalProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/plugins/technical-data/properties/${submodelId}`);
      if (!response.ok) {
        throw new Error("Failed to load properties");
      }

      const data = await response.json();
      setProperties(data.properties || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [submodelId]);

  const exportData = useCallback(async (format: "csv" | "excel") => {
    try {
      const response = await fetch(
        `/api/plugins/technical-data/export/${submodelId}?format=${format}`
      );
      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      const a = globalThis.document.createElement("a");
      a.href = url;
      a.download = `technical-data.${format}`;
      globalThis.document.body.appendChild(a);
      a.click();
      a.remove();
      globalThis.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export data:", err);
    }
  }, [submodelId]);

  return {
    properties,
    loading,
    error,
    loadProperties,
    exportData
  };
}
