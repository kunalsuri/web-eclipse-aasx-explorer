/**
 * Property Grid
 * 
 * Grid layout for viewing and editing all properties of an AAS element.
 * Groups properties by category with collapsible sections.
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { PropertyEditorFactory } from '../property-editors/PropertyEditorFactory';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface PropertyGridProps {
  element: any;
  onChange: (path: string, value: any) => void;
  readonly?: boolean;
}

interface PropertyGroup {
  title: string;
  properties: PropertyDescriptor[];
  collapsible: boolean;
  defaultExpanded: boolean;
}

interface PropertyDescriptor {
  key: string;
  label: string;
  value: any;
  valueType: string;
  editor: string;
  readonly: boolean;
  helpText?: string;
}

// ============================================================================
// Property Group Definitions
// ============================================================================

function getPropertyGroups(element: any): PropertyGroup[] {
  const groups: PropertyGroup[] = [];

  // Identification Group
  const identificationProps: PropertyDescriptor[] = [];
  if ('idShort' in element) {
    identificationProps.push({
      key: 'idShort',
      label: 'ID Short',
      value: element.idShort,
      valueType: 'xs:string',
      editor: 'string',
      readonly: false,
      helpText: 'Short identifier for the element',
    });
  }
  if ('id' in element) {
    identificationProps.push({
      key: 'id',
      label: 'ID',
      value: element.id,
      valueType: 'xs:string',
      editor: 'string',
      readonly: true,
      helpText: 'Unique identifier (read-only)',
    });
  }
  if ('category' in element) {
    identificationProps.push({
      key: 'category',
      label: 'Category',
      value: element.category,
      valueType: 'xs:string',
      editor: 'string',
      readonly: false,
      helpText: 'Element category',
    });
  }
  if (identificationProps.length > 0) {
    groups.push({
      title: 'Identification',
      properties: identificationProps,
      collapsible: false,
      defaultExpanded: true,
    });
  }

  // Semantics Group
  const semanticsProps: PropertyDescriptor[] = [];
  if ('semanticId' in element) {
    semanticsProps.push({
      key: 'semanticId',
      label: 'Semantic ID',
      value: element.semanticId,
      valueType: 'Reference',
      editor: 'reference',
      readonly: false,
      helpText: 'Reference to semantic definition',
    });
  }
  if ('supplementalSemanticIds' in element) {
    semanticsProps.push({
      key: 'supplementalSemanticIds',
      label: 'Supplemental Semantic IDs',
      value: element.supplementalSemanticIds,
      valueType: 'Reference[]',
      editor: 'reference-list',
      readonly: false,
      helpText: 'Additional semantic references',
    });
  }
  if (semanticsProps.length > 0) {
    groups.push({
      title: 'Semantics',
      properties: semanticsProps,
      collapsible: true,
      defaultExpanded: true,
    });
  }

  // Administrative Group
  const adminProps: PropertyDescriptor[] = [];
  if ('displayName' in element) {
    adminProps.push({
      key: 'displayName',
      label: 'Display Name',
      value: element.displayName,
      valueType: 'MultiLanguageProperty',
      editor: 'multilang',
      readonly: false,
      helpText: 'Human-readable name in multiple languages',
    });
  }
  if ('description' in element) {
    adminProps.push({
      key: 'description',
      label: 'Description',
      value: element.description,
      valueType: 'MultiLanguageProperty',
      editor: 'multilang',
      readonly: false,
      helpText: 'Detailed description in multiple languages',
    });
  }
  if (adminProps.length > 0) {
    groups.push({
      title: 'Administrative',
      properties: adminProps,
      collapsible: true,
      defaultExpanded: false,
    });
  }

  // Type-Specific Group
  const typeSpecificProps: PropertyDescriptor[] = [];
  
  // Property-specific
  if (element.modelType === 'Property') {
    if ('valueType' in element) {
      typeSpecificProps.push({
        key: 'valueType',
        label: 'Value Type',
        value: element.valueType,
        valueType: 'xs:string',
        editor: 'string',
        readonly: false,
        helpText: 'Data type of the property value',
      });
    }
    if ('value' in element) {
      typeSpecificProps.push({
        key: 'value',
        label: 'Value',
        value: element.value,
        valueType: element.valueType || 'xs:string',
        editor: 'string',
        readonly: false,
        helpText: 'Property value',
      });
    }
  }

  // Range-specific
  if (element.modelType === 'Range') {
    if ('valueType' in element) {
      typeSpecificProps.push({
        key: 'valueType',
        label: 'Value Type',
        value: element.valueType,
        valueType: 'xs:string',
        editor: 'string',
        readonly: false,
      });
    }
    if ('min' in element) {
      typeSpecificProps.push({
        key: 'min',
        label: 'Minimum',
        value: element.min,
        valueType: element.valueType || 'xs:string',
        editor: 'string',
        readonly: false,
      });
    }
    if ('max' in element) {
      typeSpecificProps.push({
        key: 'max',
        label: 'Maximum',
        value: element.max,
        valueType: element.valueType || 'xs:string',
        editor: 'string',
        readonly: false,
      });
    }
  }

  // Blob/File-specific
  if (element.modelType === 'Blob' || element.modelType === 'File') {
    if ('contentType' in element) {
      typeSpecificProps.push({
        key: 'contentType',
        label: 'Content Type',
        value: element.contentType,
        valueType: 'xs:string',
        editor: 'string',
        readonly: false,
        helpText: 'MIME type of the content',
      });
    }
  }

  if (typeSpecificProps.length > 0) {
    groups.push({
      title: `${element.modelType} Properties`,
      properties: typeSpecificProps,
      collapsible: true,
      defaultExpanded: true,
    });
  }

  return groups;
}

// ============================================================================
// Property Grid Component
// ============================================================================

export function PropertyGrid({
  element,
  onChange,
  readonly = false,
}: PropertyGridProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(
      getPropertyGroups(element)
        .filter(g => g.defaultExpanded)
        .map(g => g.title)
    )
  );

  const groups = getPropertyGroups(element);

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  if (!element) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No element selected
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="space-y-1">
        {groups.map((group) => {
          const isExpanded = expandedGroups.has(group.title);

          return (
            <div key={group.title} className="border-b">
              {/* Group Header */}
              <button
                type="button"
                onClick={() => group.collapsible && toggleGroup(group.title)}
                className={cn(
                  'w-full flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-accent transition-colors',
                  !group.collapsible && 'cursor-default'
                )}
                disabled={!group.collapsible}
              >
                {group.collapsible && (
                  isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )
                )}
                {!group.collapsible && <div className="w-4" />}
                <span>{group.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {group.properties.length} {group.properties.length === 1 ? 'property' : 'properties'}
                </span>
              </button>

              {/* Group Properties */}
              {isExpanded && (
                <div className="divide-y">
                  {group.properties.map((prop) => (
                    <div
                      key={prop.key}
                      className="grid grid-cols-[200px_1fr] gap-4 px-4 py-3 hover:bg-accent/50 transition-colors"
                    >
                      {/* Property Label */}
                      <div className="flex flex-col justify-center">
                        <label className="text-sm font-medium">
                          {prop.label}
                        </label>
                        {prop.helpText && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {prop.helpText}
                          </p>
                        )}
                      </div>

                      {/* Property Editor */}
                      <div className="flex items-center">
                        <PropertyEditorFactory
                          value={prop.value}
                          onChange={(value) => onChange(prop.key, value)}
                          valueType={prop.valueType}
                          disabled={readonly || prop.readonly}
                          className="w-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Element Type Badge */}
      <div className="px-4 py-3 bg-muted/50 text-xs text-muted-foreground">
        Element Type: <span className="font-medium">{element.modelType}</span>
      </div>
    </div>
  );
}
