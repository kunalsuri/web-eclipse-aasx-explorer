/**
 * Type-Specific Property Editors
 * Specialized editor components for different AAS value types
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';

export interface BaseEditorProps {
  readonly value: any;
  readonly onChange: (value: any) => void;
  readonly disabled?: boolean;
  readonly errors?: string[];
  readonly label?: string;
}

/**
 * StringEditor - Editor for string properties
 * Supports single-line and multi-line text
 */
export function StringEditor({
  value,
  onChange,
  disabled = false,
  errors = [],
  label = 'Value',
}: BaseEditorProps) {
  const hasErrors = errors.length > 0;
  const isMultiline = value && value.length > 100;

  return (
    <div className="space-y-2">
      <Label htmlFor="string-value" className="text-sm font-medium">
        {label}
      </Label>
      {isMultiline ? (
        <Textarea
          id="string-value"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={hasErrors ? 'border-destructive' : ''}
          placeholder="Enter text..."
          rows={4}
        />
      ) : (
        <Input
          id="string-value"
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={hasErrors ? 'border-destructive' : ''}
          placeholder="Enter text..."
        />
      )}
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
 * NumberEditor - Editor for numeric properties
 * Supports integers and floating-point numbers
 */
export function NumberEditor({
  value,
  onChange,
  disabled = false,
  errors = [],
  label = 'Value',
  valueType,
}: BaseEditorProps & { readonly valueType: string }) {
  const hasErrors = errors.length > 0;
  const isInteger = ['xs:int', 'xs:integer', 'xs:long', 'xs:short', 'xs:byte'].includes(valueType);
  const step = isInteger ? '1' : 'any';

  return (
    <div className="space-y-2">
      <Label htmlFor="number-value" className="text-sm font-medium">
        {label}
      </Label>
      <Input
        id="number-value"
        type="number"
        step={step}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={hasErrors ? 'border-destructive' : ''}
        placeholder={isInteger ? 'Enter integer...' : 'Enter number...'}
      />
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
 * BooleanEditor - Editor for boolean properties
 * Uses a switch/toggle component
 */
export function BooleanEditor({
  value,
  onChange,
  disabled = false,
  label = 'Value',
}: BaseEditorProps) {
  const boolValue = value === true || value === 'true';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="boolean-value" className="text-sm font-medium">
          {label}
        </Label>
        <Switch
          id="boolean-value"
          checked={boolValue}
          onCheckedChange={(checked) => onChange(checked)}
          disabled={disabled}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Current value: {boolValue ? 'true' : 'false'}
      </p>
    </div>
  );
}

/**
 * DateEditor - Editor for date properties
 */
export function DateEditor({
  value,
  onChange,
  disabled = false,
  errors = [],
  label = 'Value',
}: BaseEditorProps) {
  const hasErrors = errors.length > 0;

  return (
    <div className="space-y-2">
      <Label htmlFor="date-value" className="text-sm font-medium">
        {label}
      </Label>
      <Input
        id="date-value"
        type="date"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={hasErrors ? 'border-destructive' : ''}
      />
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
 * DateTimeEditor - Editor for datetime properties
 */
export function DateTimeEditor({
  value,
  onChange,
  disabled = false,
  errors = [],
  label = 'Value',
}: BaseEditorProps) {
  const hasErrors = errors.length > 0;

  return (
    <div className="space-y-2">
      <Label htmlFor="datetime-value" className="text-sm font-medium">
        {label}
      </Label>
      <Input
        id="datetime-value"
        type="datetime-local"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={hasErrors ? 'border-destructive' : ''}
      />
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
 * TimeEditor - Editor for time properties
 */
export function TimeEditor({
  value,
  onChange,
  disabled = false,
  errors = [],
  label = 'Value',
}: BaseEditorProps) {
  const hasErrors = errors.length > 0;

  return (
    <div className="space-y-2">
      <Label htmlFor="time-value" className="text-sm font-medium">
        {label}
      </Label>
      <Input
        id="time-value"
        type="time"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={hasErrors ? 'border-destructive' : ''}
      />
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
 * EnumEditor - Editor for enumerated properties
 * Uses a dropdown/select component
 */
export function EnumEditor({
  value,
  onChange,
  disabled = false,
  errors = [],
  label = 'Value',
  options = [],
}: BaseEditorProps & { readonly options?: string[] }) {
  const hasErrors = errors.length > 0;

  return (
    <div className="space-y-2">
      <Label htmlFor="enum-value" className="text-sm font-medium">
        {label}
      </Label>
      <Select value={value ?? ''} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={hasErrors ? 'border-destructive' : ''}>
          <SelectValue placeholder="Select an option..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
 * Get the appropriate editor component based on value type
 */
export function getEditorForType(valueType: string) {
  switch (valueType) {
    case 'xs:boolean':
      return BooleanEditor;
    case 'xs:int':
    case 'xs:integer':
    case 'xs:long':
    case 'xs:short':
    case 'xs:byte':
    case 'xs:unsignedInt':
    case 'xs:unsignedLong':
    case 'xs:unsignedShort':
    case 'xs:unsignedByte':
    case 'xs:double':
    case 'xs:float':
    case 'xs:decimal':
      return NumberEditor;
    case 'xs:date':
      return DateEditor;
    case 'xs:dateTime':
      return DateTimeEditor;
    case 'xs:time':
      return TimeEditor;
    case 'xs:string':
    default:
      return StringEditor;
  }
}
