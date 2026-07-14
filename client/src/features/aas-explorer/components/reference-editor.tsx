/**
 * Reference Editor Component
 * Handles editing of Reference and ReferenceElement types
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, AlertCircle, Link2, ExternalLink } from 'lucide-react';
import type { Reference, Key, ReferenceTypes } from '../../../../../shared';
import { KeyTypes } from '../../../../../shared';

interface ReferenceEditorProps {
  readonly value: Reference | null;
  readonly onChange: (value: Reference) => void;
  readonly disabled?: boolean;
  readonly errors?: string[];
}

// Common key types from AAS V3 specification
const KEY_TYPES: KeyTypes[] = [
  KeyTypes.AssetAdministrationShell,
  KeyTypes.Submodel,
  KeyTypes.Property,
  KeyTypes.MultiLanguageProperty,
  KeyTypes.Range,
  KeyTypes.ReferenceElement,
  KeyTypes.Blob,
  KeyTypes.File,
  KeyTypes.SubmodelElementCollection,
  KeyTypes.SubmodelElementList,
  KeyTypes.Operation,
  KeyTypes.Entity,
  KeyTypes.ConceptDescription,
  KeyTypes.GlobalReference,
];

/**
 * ReferenceEditor - Editor for Reference types
 * Features:
 * - Reference type selector (ModelReference/ExternalReference)
 * - Key management (add/remove/edit)
 * - Key type and value editing
 * - Reference path display
 * - Validation
 */
export function ReferenceEditor({
  value,
  onChange,
  disabled = false,
  errors = [],
}: ReferenceEditorProps) {
  const [newKeyType, setNewKeyType] = useState<KeyTypes>(KeyTypes.Property);
  const hasErrors = errors.length > 0;

  const reference = value || {
    type: 'ModelReference' as ReferenceTypes,
    keys: [],
  };

  // Update reference type
  const updateReferenceType = (type: ReferenceTypes) => {
    onChange({
      ...reference,
      type,
    });
  };

  // Add a new key
  const addKey = () => {
    const newKey: Key = {
      type: newKeyType,
      value: '',
    };

    onChange({
      ...reference,
      keys: [...reference.keys, newKey],
    });
  };

  // Remove a key
  const removeKey = (index: number) => {
    onChange({
      ...reference,
      keys: reference.keys.filter((_, i) => i !== index),
    });
  };

  // Update key type
  const updateKeyType = (index: number, type: KeyTypes) => {
    const updatedKeys = [...reference.keys];
    updatedKeys[index] = { ...updatedKeys[index], type };
    onChange({
      ...reference,
      keys: updatedKeys,
    });
  };

  // Update key value
  const updateKeyValue = (index: number, value: string) => {
    const updatedKeys = [...reference.keys];
    updatedKeys[index] = { ...updatedKeys[index], value };
    onChange({
      ...reference,
      keys: updatedKeys,
    });
  };

  // Build reference path display
  const referencePath = reference.keys.map((key) => `${key.type}:${key.value || '?'}`).join(' → ');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Reference
        </Label>
        <Badge variant={reference.type === 'ModelReference' ? 'default' : 'secondary'}>
          {reference.type}
        </Badge>
      </div>

      {/* Reference Type Selector */}
      <div className="space-y-2">
        <Label className="text-sm">Reference Type</Label>
        <Select
          value={reference.type}
          onValueChange={(value) => updateReferenceType(value as ReferenceTypes)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ModelReference">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                <span>Model Reference</span>
              </div>
            </SelectItem>
            <SelectItem value="ExternalReference">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                <span>External Reference</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Reference Path Display */}
      {reference.keys.length > 0 && (
        <div className="p-3 bg-muted/50 rounded-md border">
          <p className="text-xs font-medium text-muted-foreground mb-1">Reference Path</p>
          <p className="text-sm font-mono break-all">{referencePath || 'Empty path'}</p>
        </div>
      )}

      {/* Keys List */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Keys ({reference.keys.length})</Label>
        
        {reference.keys.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-4 text-muted-foreground">
                <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No keys defined</p>
                <p className="text-xs mt-1">Add a key to build the reference path</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          reference.keys.map((key, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Key {index + 1}</CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeKey(index)}
                    disabled={disabled}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={key.type}
                    onValueChange={(value) => updateKeyType(index, value as KeyTypes)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-9">
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
                <div className="space-y-2">
                  <Label className="text-xs">Value</Label>
                  <Input
                    value={key.value}
                    onChange={(e) => updateKeyValue(index, e.target.value)}
                    disabled={disabled}
                    placeholder="Enter key value..."
                    className="h-9"
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Separator />

      {/* Add Key Section */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Add Key</Label>
        <div className="flex gap-2">
          <Select value={newKeyType} onValueChange={(value) => setNewKeyType(value as KeyTypes)} disabled={disabled}>
            <SelectTrigger className="flex-1">
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
          <Button
            size="sm"
            onClick={addKey}
            disabled={disabled}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Validation Errors */}
      {hasErrors && (
        <div className="flex items-center gap-2 text-destructive text-xs">
          <AlertCircle className="h-3 w-3" />
          <span>{errors[0]}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Validate reference integrity
 */
export function validateReference(reference: Reference | null): string[] {
  const errors: string[] = [];

  if (!reference) {
    errors.push('Reference is required');
    return errors;
  }

  if (!reference.type) {
    errors.push('Reference type is required');
  }

  if (!reference.keys || reference.keys.length === 0) {
    errors.push('At least one key is required');
    return errors;
  }

  // Check for empty key values
  const emptyKeys = reference.keys.filter((key) => !key.value || key.value.trim() === '');
  if (emptyKeys.length > 0) {
    errors.push(`Empty values in ${emptyKeys.length} key(s)`);
  }

  // Check for missing key types
  const missingTypes = reference.keys.filter((key) => !key.type);
  if (missingTypes.length > 0) {
    errors.push(`Missing types in ${missingTypes.length} key(s)`);
  }

  return errors;
}
