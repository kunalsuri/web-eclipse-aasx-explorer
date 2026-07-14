/**
 * Property Value Editor
 * 
 * Inline editor for Property SubmodelElement values with type validation
 */

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Check, X, AlertCircle } from "lucide-react";
import type { Property } from "@/../../shared/aas-v3-types";
import { DataTypeDefXsd } from "@/../../shared/aas-v3-types";

interface PropertyValueEditorProps {
  property: Property;
  onSave: (updatedProperty: Property) => void;
  onCancel: () => void;
  readOnly?: boolean;
}

const XSD_DATA_TYPES: DataTypeDefXsd[] = [
  DataTypeDefXsd.String,
  DataTypeDefXsd.Boolean,
  DataTypeDefXsd.Integer,
  DataTypeDefXsd.Int,
  DataTypeDefXsd.Long,
  DataTypeDefXsd.Short,
  DataTypeDefXsd.Byte,
  DataTypeDefXsd.Double,
  DataTypeDefXsd.Float,
  DataTypeDefXsd.Decimal,
  DataTypeDefXsd.Date,
  DataTypeDefXsd.Time,
  DataTypeDefXsd.DateTime,
  DataTypeDefXsd.AnyUri,
  DataTypeDefXsd.Base64Binary,
  DataTypeDefXsd.HexBinary,
];

export function PropertyValueEditor({
  property,
  onSave,
  onCancel,
  readOnly = false,
}: PropertyValueEditorProps) {
  const [value, setValue] = useState<string>(property.value || "");
  const [valueType, setValueType] = useState<DataTypeDefXsd>(property.valueType);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nextValue = property.value || "";
    setValue(nextValue);
    setValueType(property.valueType);
    setError(validateValue(nextValue, property.valueType));
  }, [property]);

  /**
   * Validate value against its declared type
   */
  function validateValue(val: string, type: DataTypeDefXsd): string | null {
    if (!val || val.trim() === "") {
      return null; // Empty values are allowed
    }

    switch (type) {
      case DataTypeDefXsd.Boolean:
        if (!["true", "false", "0", "1"].includes(val.toLowerCase())) {
          return "Boolean must be 'true', 'false', '0', or '1'";
        }
        break;
      case DataTypeDefXsd.Integer:
      case DataTypeDefXsd.Int:
      case DataTypeDefXsd.Long:
      case DataTypeDefXsd.Short:
      case DataTypeDefXsd.Byte:
        if (isNaN(parseInt(val, 10)) || !Number.isInteger(parseFloat(val))) {
          return "Value must be an integer";
        }
        break;
      case DataTypeDefXsd.Double:
      case DataTypeDefXsd.Float:
      case DataTypeDefXsd.Decimal:
        if (isNaN(parseFloat(val))) {
          return "Value must be a number";
        }
        break;
      case DataTypeDefXsd.Date:
        // Basic ISO date validation (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
          return "Date must be in format YYYY-MM-DD";
        }
        break;
      case DataTypeDefXsd.Time:
        // Basic time validation (HH:MM:SS)
        if (!/^\d{2}:\d{2}:\d{2}$/.test(val)) {
          return "Time must be in format HH:MM:SS";
        }
        break;
      case DataTypeDefXsd.DateTime:
        // Basic ISO datetime validation
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
          return "DateTime must be in format YYYY-MM-DDTHH:MM:SS";
        }
        break;
      case DataTypeDefXsd.AnyUri:
        try {
          new URL(val);
        } catch {
          return "Value must be a valid URI";
        }
        break;
      default:
        // String and binary types - no validation needed
        break;
    }

    return null;
  }

  /**
   * Handle value change with validation
   */
  function handleValueChange(newValue: string): void {
    setValue(newValue);
    const validationError = validateValue(newValue, valueType);
    setError(validationError);
  }

  /**
   * Handle value type change
   */
  function handleTypeChange(newType: DataTypeDefXsd): void {
    setValueType(newType);
    const validationError = validateValue(value, newType);
    setError(validationError);
  }

  /**
   * Handle save
   */
  function handleSave(): void {
    const validationError = validateValue(value, valueType);
    if (validationError) {
      setError(validationError);
      return;
    }

    const updatedProperty: Property = {
      ...property,
      value,
      valueType,
    };

    onSave(updatedProperty);
  }

  /**
   * Handle keyboard shortcuts
   */
  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="space-y-2">
        <Label htmlFor="property-value">Value</Label>
        <Input
          id="property-value"
          value={value}
          onChange={(e) => handleValueChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter property value"
          disabled={readOnly}
          className={error ? "border-destructive" : ""}
          autoFocus
        />
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="value-type">Value Type</Label>
        <Select
          value={valueType}
          onValueChange={(val) => handleTypeChange(val as DataTypeDefXsd)}
          disabled={readOnly}
        >
          <SelectTrigger id="value-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {XSD_DATA_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!readOnly && (
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!!error}
          >
            <Check className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      )}
    </div>
  );
}
