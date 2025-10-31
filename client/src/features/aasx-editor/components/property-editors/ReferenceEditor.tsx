/**
 * Reference Editor
 * 
 * Editor for Reference elements with key management and type selection
 * Implements AASd-116, AASd-120, AASd-121 constraints
 */

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Plus, Trash2, AlertCircle } from "lucide-react";
import type { Reference, Key } from "@/../../shared/aas-v3-types";
import { KeyTypes, ReferenceTypes } from "@/../../shared/aas-v3-types";

interface ReferenceEditorProps {
  reference: Reference;
  onSave: (updatedReference: Reference) => void;
  onCancel: () => void;
  readOnly?: boolean;
}

const KEY_TYPES = Object.values(KeyTypes);
const REFERENCE_TYPES = Object.values(ReferenceTypes);

export function ReferenceEditor({
  reference,
  onSave,
  onCancel,
  readOnly = false,
}: ReferenceEditorProps) {
  const [referenceType, setReferenceType] = useState<ReferenceTypes>(
    reference.type || ReferenceTypes.ModelReference
  );
  const [keys, setKeys] = useState<Key[]>(reference.keys || []);
  const [errors, setErrors] = useState<Map<number, string>>(new Map());
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    setReferenceType(reference.type || ReferenceTypes.ModelReference);
    setKeys(reference.keys || []);
  }, [reference]);

  /**
   * Validate reference
   * - AASd-116: Reference keys must not be empty
   * - AASd-120: External references must have GlobalReference type
   * - AASd-121: ModelReference last key must be model element type
   */
  function validateReference(
    type: ReferenceTypes,
    keyList: Key[]
  ): { keyErrors: Map<number, string>; globalError: string | null } {
    const keyErrors = new Map<number, string>();
    let globalErr: string | null = null;

    // AASd-116: Must have at least one key
    if (!keyList || keyList.length === 0) {
      globalErr = "Reference must have at least one key (AASd-116)";
      return { keyErrors, globalError: globalErr };
    }

    // Validate each key
    keyList.forEach((key, index) => {
      // AASd-116: Key value must not be empty
      if (!key.value || key.value.trim() === "") {
        keyErrors.set(index, "Key value must not be empty (AASd-116)");
      }

      // AASd-120: External references must use ExternalReference type
      const isExternalValue =
        key.value &&
        (key.value.startsWith("http://") ||
          key.value.startsWith("https://") ||
          key.value.startsWith("urn:"));

      if (isExternalValue && type !== ReferenceTypes.ExternalReference) {
        if (!keyErrors.has(index)) {
          keyErrors.set(
            index,
            "External URLs must use ExternalReference type (AASd-120)"
          );
        }
      }
    });

    // AASd-121: ModelReference last key type validation
    if (type === ReferenceTypes.ModelReference && keyList.length > 0) {
      const lastKey = keyList[keyList.length - 1];
      const modelElementTypes = [
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
        KeyTypes.Entity,
        KeyTypes.AnnotatedRelationshipElement,
        KeyTypes.RelationshipElement,
        KeyTypes.Operation,
        KeyTypes.Capability,
        KeyTypes.BasicEventElement,
      ];

      if (!modelElementTypes.includes(lastKey.type)) {
        globalErr = `ModelReference last key must be a model element type (AASd-121)`;
      }
    }

    return { keyErrors, globalError: globalErr };
  }

  /**
   * Update reference type
   */
  function handleTypeChange(type: ReferenceTypes): void {
    setReferenceType(type);
    const { keyErrors, globalError } = validateReference(type, keys);
    setErrors(keyErrors);
    setGlobalError(globalError);
  }

  /**
   * Add new key
   */
  function addKey(): void {
    const newKey: Key = {
      type: KeyTypes.GlobalReference,
      value: "",
    };
    const updatedKeys = [...keys, newKey];
    setKeys(updatedKeys);
  }

  /**
   * Remove key at index
   */
  function removeKey(index: number): void {
    const updatedKeys = keys.filter((_, i) => i !== index);
    setKeys(updatedKeys);
    
    const { keyErrors, globalError } = validateReference(referenceType, updatedKeys);
    setErrors(keyErrors);
    setGlobalError(globalError);
  }

  /**
   * Update key at index
   */
  function updateKey(index: number, field: "type" | "value", value: string): void {
    const updatedKeys = [...keys];
    updatedKeys[index] = {
      ...updatedKeys[index],
      [field]: value as any,
    };
    setKeys(updatedKeys);

    const { keyErrors, globalError } = validateReference(referenceType, updatedKeys);
    setErrors(keyErrors);
    setGlobalError(globalError);
  }

  /**
   * Handle save
   */
  function handleSave(): void {
    const { keyErrors, globalError } = validateReference(referenceType, keys);

    if (keyErrors.size > 0 || globalError) {
      setErrors(keyErrors);
      setGlobalError(globalError);
      return;
    }

    const updatedReference: Reference = {
      ...reference,
      type: referenceType,
      keys,
    };

    onSave(updatedReference);
  }

  const hasErrors = errors.size > 0 || globalError !== null;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="space-y-2">
        <Label htmlFor="reference-type">Reference Type</Label>
        <Select
          value={referenceType}
          onValueChange={(val) => handleTypeChange(val as ReferenceTypes)}
          disabled={readOnly}
        >
          <SelectTrigger id="reference-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REFERENCE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Reference Keys</Label>
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={addKey}>
              <Plus className="h-4 w-4 mr-1" />
              Add Key
            </Button>
          )}
        </div>

        {globalError && (
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <span>{globalError}</span>
          </div>
        )}

        <div className="space-y-3">
          {keys.map((key, index) => {
            const error = errors.get(index);

            return (
              <div key={index} className="space-y-2 p-3 border rounded-md bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground w-16">
                    Key {index + 1}
                  </span>
                  {!readOnly && keys.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-auto"
                      onClick={() => removeKey(index)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select
                      value={key.type}
                      onValueChange={(val) => updateKey(index, "type", val)}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="h-8">
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

                  <div className="space-y-1">
                    <Label className="text-xs">Value</Label>
                    <Input
                      value={key.value}
                      onChange={(e) => updateKey(index, "value", e.target.value)}
                      placeholder="Key value"
                      disabled={readOnly}
                      className={error ? "border-destructive h-8" : "h-8"}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            );
          })}

          {keys.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No keys defined. Click "Add Key" to create a reference.
            </div>
          )}
        </div>
      </div>

      {!readOnly && (
        <div className="flex gap-2 justify-end pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={hasErrors}>
            <Check className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      )}

      {!readOnly && (
        <p className="text-xs text-muted-foreground">
          Reference must have at least one key with a non-empty value.
        </p>
      )}
    </div>
  );
}
