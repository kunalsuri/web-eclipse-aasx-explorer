/**
 * Reference Path Builder
 * 
 * Visual component for building and editing reference paths.
 * Shows key hierarchy and allows manual path construction.
 */

import { useState } from 'react';
import { Plus, X, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface Reference {
  type: 'ModelReference' | 'ExternalReference';
  keys: Key[];
}

interface Key {
  type: KeyTypes;
  value: string;
}

type KeyTypes = 
  | 'AssetAdministrationShell'
  | 'Submodel'
  | 'SubmodelElement'
  | 'ConceptDescription'
  | 'Property'
  | 'MultiLanguageProperty'
  | 'Range'
  | 'ReferenceElement'
  | 'Blob'
  | 'File'
  | 'SubmodelElementCollection'
  | 'SubmodelElementList'
  | 'Entity'
  | 'RelationshipElement'
  | 'AnnotatedRelationshipElement'
  | 'Operation'
  | 'Capability'
  | 'BasicEventElement';

const KEY_TYPES: KeyTypes[] = [
  'AssetAdministrationShell',
  'Submodel',
  'SubmodelElement',
  'ConceptDescription',
  'Property',
  'MultiLanguageProperty',
  'Range',
  'ReferenceElement',
  'Blob',
  'File',
  'SubmodelElementCollection',
  'SubmodelElementList',
  'Entity',
  'RelationshipElement',
  'AnnotatedRelationshipElement',
  'Operation',
  'Capability',
  'BasicEventElement',
];

// ============================================================================
// Reference Path Builder Component
// ============================================================================

interface ReferencePathBuilderProps {
  value: Reference | null;
  onChange: (value: Reference) => void;
  disabled?: boolean;
}

export function ReferencePathBuilder({
  value,
  onChange,
  disabled,
}: ReferencePathBuilderProps) {
  const [referenceType, setReferenceType] = useState<'ModelReference' | 'ExternalReference'>(
    value?.type || 'ModelReference'
  );
  const [keys, setKeys] = useState<Key[]>(value?.keys || []);

  // Add new key
  const addKey = () => {
    const newKeys = [
      ...keys,
      { type: 'SubmodelElement' as KeyTypes, value: '' },
    ];
    setKeys(newKeys);
    updateReference(newKeys);
  };

  // Remove key
  const removeKey = (index: number) => {
    const newKeys = keys.filter((_, i) => i !== index);
    setKeys(newKeys);
    updateReference(newKeys);
  };

  // Update key type
  const updateKeyType = (index: number, type: KeyTypes) => {
    const newKeys = [...keys];
    newKeys[index] = { ...newKeys[index], type };
    setKeys(newKeys);
    updateReference(newKeys);
  };

  // Update key value
  const updateKeyValue = (index: number, value: string) => {
    const newKeys = [...keys];
    newKeys[index] = { ...newKeys[index], value };
    setKeys(newKeys);
    updateReference(newKeys);
  };

  // Update reference
  const updateReference = (newKeys: Key[]) => {
    onChange({
      type: referenceType,
      keys: newKeys,
    });
  };

  // Update reference type
  const handleReferenceTypeChange = (type: 'ModelReference' | 'ExternalReference') => {
    setReferenceType(type);
    onChange({
      type,
      keys,
    });
  };

  // Validate reference path
  const validatePath = (): { isValid: boolean; error?: string } => {
    if (keys.length === 0) {
      return { isValid: false, error: 'At least one key is required' };
    }

    for (const key of keys) {
      if (!key.value || key.value.trim() === '') {
        return { isValid: false, error: 'All keys must have a value' };
      }
    }

    return { isValid: true };
  };

  const validation = validatePath();

  return (
    <div className="space-y-4">
      {/* Reference Type Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Reference Type</label>
        <Select
          value={referenceType}
          onValueChange={handleReferenceTypeChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ModelReference">Model Reference</SelectItem>
            <SelectItem value="ExternalReference">External Reference</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Keys List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Reference Path</label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addKey}
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Key
          </Button>
        </div>

        {keys.length === 0 && (
          <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md">
            No keys defined. Click "Add Key" to start building the reference path.
          </div>
        )}

        {keys.map((key, index) => (
          <div key={index} className="flex items-start gap-2">
            {/* Key Index */}
            {index > 0 && (
              <ChevronRight className="h-5 w-5 text-muted-foreground mt-2 flex-shrink-0" />
            )}

            {/* Key Type Selector */}
            <div className="flex-1 min-w-0">
              <Select
                value={key.type}
                onValueChange={(type) => updateKeyType(index, type as KeyTypes)}
                disabled={disabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KEY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Key Value Input */}
            <div className="flex-1 min-w-0">
              <Input
                type="text"
                value={key.value}
                onChange={(e) => updateKeyValue(index, e.target.value)}
                placeholder="Enter key value..."
                disabled={disabled}
              />
            </div>

            {/* Remove Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeKey(index)}
              disabled={disabled}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Validation Message */}
      {!validation.isValid && keys.length > 0 && (
        <div className="text-sm text-destructive">
          {validation.error}
        </div>
      )}

      {/* Path Preview */}
      {keys.length > 0 && validation.isValid && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Path Preview</label>
          <div className="px-3 py-2 bg-muted rounded-md text-sm font-mono break-all">
            {keys.map((k, i) => (
              <span key={i}>
                {i > 0 && ' / '}
                <span className="text-muted-foreground">{k.type}:</span>
                {k.value}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
