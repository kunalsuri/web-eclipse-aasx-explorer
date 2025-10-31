/**
 * String Editor
 * 
 * Text input editor for string values with validation support.
 */

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { PropertyEditorProps } from './types';

export function StringEditor({
  value,
  onChange,
  onBlur,
  validation,
  disabled,
  placeholder,
  metadata,
  className,
  autoFocus,
}: PropertyEditorProps<string>) {
  const [localValue, setLocalValue] = React.useState(value || '');
  const [isDirty, setIsDirty] = React.useState(false);

  // Sync with external value changes
  React.useEffect(() => {
    if (!isDirty) {
      setLocalValue(value || '');
    }
  }, [value, isDirty]);

  // Debounced onChange
  const debouncedOnChange = React.useMemo(
    () => {
      let timeoutId: NodeJS.Timeout;
      return (newValue: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          onChange(newValue);
          setIsDirty(false);
        }, 300);
      };
    },
    [onChange]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setIsDirty(true);
    debouncedOnChange(newValue);
  };

  const handleBlur = () => {
    // Immediate update on blur
    if (isDirty) {
      onChange(localValue);
      setIsDirty(false);
    }
    onBlur?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Save on Enter
      if (isDirty) {
        onChange(localValue);
        setIsDirty(false);
      }
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      // Cancel on Escape
      setLocalValue(value || '');
      setIsDirty(false);
      e.currentTarget.blur();
    }
  };

  const hasErrors = validation && !validation.isValid;

  return (
    <Input
      type="text"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={disabled || metadata?.readonly}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={cn(
        hasErrors && 'border-destructive focus-visible:ring-destructive',
        className
      )}
      aria-invalid={hasErrors}
      aria-describedby={hasErrors ? 'error-message' : undefined}
    />
  );
}
