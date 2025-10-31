/**
 * Number Editor
 * 
 * Numeric input editor with type validation and constraints.
 */

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PropertyEditorProps } from './types';

export function NumberEditor({
  value,
  onChange,
  onBlur,
  validation,
  disabled,
  placeholder,
  metadata,
  className,
  autoFocus,
}: PropertyEditorProps<number | string>) {
  const [localValue, setLocalValue] = React.useState(String(value ?? ''));
  const [isDirty, setIsDirty] = React.useState(false);

  // Extract constraints
  const minConstraint = metadata?.constraints?.find(c => c.type === 'min');
  const maxConstraint = metadata?.constraints?.find(c => c.type === 'max');
  const min = minConstraint?.value;
  const max = maxConstraint?.value;

  // Determine if this is an integer type
  const isInteger = metadata?.valueType?.includes('int') || 
                    metadata?.valueType?.includes('Int') ||
                    metadata?.valueType?.includes('long') ||
                    metadata?.valueType?.includes('short') ||
                    metadata?.valueType?.includes('byte');

  // Sync with external value changes
  React.useEffect(() => {
    if (!isDirty) {
      setLocalValue(String(value ?? ''));
    }
  }, [value, isDirty]);

  // Validation is handled inline during input

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Allow empty, minus sign, and valid numbers
    if (newValue === '' || newValue === '-' || /^-?\d*\.?\d*$/.test(newValue)) {
      setLocalValue(newValue);
      setIsDirty(true);
      
      // Only call onChange if it's a valid number
      if (newValue !== '' && newValue !== '-') {
        const num = isInteger ? Number.parseInt(newValue, 10) : Number.parseFloat(newValue);
        if (!Number.isNaN(num)) {
          onChange(num);
        }
      }
    }
  };

  const handleBlur = () => {
    if (localValue === '' || localValue === '-') {
      setLocalValue('');
      onChange(null as any);
    } else {
      const num = isInteger ? Number.parseInt(localValue, 10) : Number.parseFloat(localValue);
      if (!Number.isNaN(num)) {
        onChange(num);
      }
    }
    setIsDirty(false);
    onBlur?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setLocalValue(String(value ?? ''));
      setIsDirty(false);
      e.currentTarget.blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      increment();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      decrement();
    }
  };

  const increment = () => {
    const parsedValue = isInteger ? Number.parseInt(localValue, 10) : Number.parseFloat(localValue);
    const current = localValue === '' ? 0 : parsedValue;
    if (Number.isNaN(current)) return;
    
    const step = isInteger ? 1 : 0.1;
    const newValue = current + step;
    
    if (max === undefined || newValue <= max) {
      const formatted = isInteger ? String(newValue) : newValue.toFixed(1);
      setLocalValue(formatted);
      onChange(newValue);
    }
  };

  const decrement = () => {
    const parsedValue = isInteger ? Number.parseInt(localValue, 10) : Number.parseFloat(localValue);
    const current = localValue === '' ? 0 : parsedValue;
    if (Number.isNaN(current)) return;
    
    const step = isInteger ? 1 : 0.1;
    const newValue = current - step;
    
    if (min === undefined || newValue >= min) {
      const formatted = isInteger ? String(newValue) : newValue.toFixed(1);
      setLocalValue(formatted);
      onChange(newValue);
    }
  };

  const hasErrors = validation && !validation.isValid;

  return (
    <div className="relative flex items-center gap-1">
      <Input
        type="text"
        inputMode="numeric"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled || metadata?.readonly}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          'pr-8',
          hasErrors && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        aria-invalid={hasErrors}
      />
      
      {/* Increment/Decrement Buttons */}
      {!disabled && !metadata?.readonly && (
        <div className="absolute right-1 flex flex-col">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-4 w-6 p-0"
            onClick={increment}
            disabled={max !== undefined && Number.parseFloat(localValue) >= max}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-4 w-6 p-0"
            onClick={decrement}
            disabled={min !== undefined && Number.parseFloat(localValue) <= min}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
