/**
 * Range Editor
 * 
 * Editor for Range SubmodelElement with min/max validation (AASd-131, AASd-014)
 */

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, AlertCircle } from "lucide-react";
import type { Range } from "@/../../shared/aas-v3-types";
import { DataTypeDefXsd } from "@/../../shared/aas-v3-types";

interface RangeEditorProps {
  range: Range;
  onSave: (updatedRange: Range) => void;
  onCancel: () => void;
  readOnly?: boolean;
}

// Numeric data types suitable for Range
const NUMERIC_DATA_TYPES: DataTypeDefXsd[] = [
  DataTypeDefXsd.Integer,
  DataTypeDefXsd.Int,
  DataTypeDefXsd.Long,
  DataTypeDefXsd.Short,
  DataTypeDefXsd.Byte,
  DataTypeDefXsd.Double,
  DataTypeDefXsd.Float,
  DataTypeDefXsd.Decimal,
];

export function RangeEditor({
  range,
  onSave,
  onCancel,
  readOnly = false,
}: RangeEditorProps) {
  const [min, setMin] = useState<string>(range.min || "");
  const [max, setMax] = useState<string>(range.max || "");
  const [valueType, setValueType] = useState<DataTypeDefXsd>(range.valueType);
  const [errors, setErrors] = useState<{ min?: string; max?: string; range?: string }>({});

  useEffect(() => {
    setMin(range.min || "");
    setMax(range.max || "");
    setValueType(range.valueType);
  }, [range]);

  /**
   * Validate numeric value
   */
  function validateNumericValue(val: string, type: DataTypeDefXsd): string | null {
    if (!val || val.trim() === "") {
      return null; // Empty is allowed
    }

    const isInteger = [
      DataTypeDefXsd.Integer,
      DataTypeDefXsd.Int,
      DataTypeDefXsd.Long,
      DataTypeDefXsd.Short,
      DataTypeDefXsd.Byte,
    ].includes(type);

    if (isInteger) {
      if (isNaN(parseInt(val, 10)) || !Number.isInteger(parseFloat(val))) {
        return "Must be an integer";
      }
    } else {
      if (isNaN(parseFloat(val))) {
        return "Must be a number";
      }
    }

    return null;
  }

  /**
   * Validate range constraints
   * - AASd-014: Either min or max must be set
   * - AASd-131: min <= max
   */
  function validateRange(minVal: string, maxVal: string, type: DataTypeDefXsd): {
    min?: string;
    max?: string;
    range?: string;
  } {
    const newErrors: { min?: string; max?: string; range?: string } = {};

    // AASd-014: Either min or max must be defined
    if ((!minVal || minVal.trim() === "") && (!maxVal || maxVal.trim() === "")) {
      newErrors.range = "At least min or max must be defined (AASd-014)";
      return newErrors;
    }

    // Validate individual values
    const minError = validateNumericValue(minVal, type);
    const maxError = validateNumericValue(maxVal, type);

    if (minError) {
      newErrors.min = minError;
    }
    if (maxError) {
      newErrors.max = maxError;
    }

    // AASd-131: min <= max
    if (!minError && !maxError && minVal && maxVal) {
      const minNum = parseFloat(minVal);
      const maxNum = parseFloat(maxVal);

      if (!isNaN(minNum) && !isNaN(maxNum) && minNum > maxNum) {
        newErrors.range = "Min value must be less than or equal to max value (AASd-131)";
      }
    }

    return newErrors;
  }

  /**
   * Handle min value change
   */
  function handleMinChange(value: string): void {
    setMin(value);
    const newErrors = validateRange(value, max, valueType);
    setErrors(newErrors);
  }

  /**
   * Handle max value change
   */
  function handleMaxChange(value: string): void {
    setMax(value);
    const newErrors = validateRange(min, value, valueType);
    setErrors(newErrors);
  }

  /**
   * Handle value type change
   */
  function handleTypeChange(type: DataTypeDefXsd): void {
    setValueType(type);
    const newErrors = validateRange(min, max, type);
    setErrors(newErrors);
  }

  /**
   * Handle save
   */
  function handleSave(): void {
    const validationErrors = validateRange(min, max, valueType);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const updatedRange: Range = {
      ...range,
      min: min || undefined,
      max: max || undefined,
      valueType,
    };

    onSave(updatedRange);
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

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
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
            {NUMERIC_DATA_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="range-min">Min Value</Label>
          <Input
            id="range-min"
            type="text"
            value={min}
            onChange={(e) => handleMinChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Minimum value"
            disabled={readOnly}
            className={errors.min ? "border-destructive" : ""}
          />
          {errors.min && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.min}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="range-max">Max Value</Label>
          <Input
            id="range-max"
            type="text"
            value={max}
            onChange={(e) => handleMaxChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Maximum value"
            disabled={readOnly}
            className={errors.max ? "border-destructive" : ""}
          />
          {errors.max && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.max}</span>
            </div>
          )}
        </div>
      </div>

      {errors.range && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <span>{errors.range}</span>
        </div>
      )}

      {!readOnly && (
        <div className="flex gap-2 justify-end pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={hasErrors}
          >
            <Check className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      )}

      {!readOnly && (
        <p className="text-xs text-muted-foreground">
          Tip: Press Enter to save, Esc to cancel. At least min or max must be defined.
        </p>
      )}
    </div>
  );
}
