/**
 * DateTime Editor
 * 
 * Date/time picker editor with ISO 8601 format support.
 */

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import type { PropertyEditorProps } from './types';

export interface DateTimeEditorProps extends PropertyEditorProps<string> {
  mode?: 'date' | 'datetime' | 'time';
}

export function DateTimeEditor({
  value,
  onChange,
  onBlur,
  validation,
  disabled,
  placeholder,
  metadata,
  className,
  autoFocus,
  mode = 'datetime',
}: DateTimeEditorProps) {
  const [localValue, setLocalValue] = React.useState(value || '');
  const [isOpen, setIsOpen] = React.useState(false);

  // Sync with external value changes
  React.useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  // Parse ISO 8601 string to Date
  const parseISOString = (isoString: string): Date | null => {
    if (!isoString) return null;
    
    try {
      const date = new Date(isoString);
      return isValid(date) ? date : null;
    } catch {
      return null;
    }
  };

  // Format Date to ISO 8601 string
  const formatToISO = (date: Date): string => {
    if (mode === 'date') {
      return format(date, 'yyyy-MM-dd');
    } else if (mode === 'time') {
      return format(date, 'HH:mm:ss');
    } else {
      return date.toISOString();
    }
  };

  // Get display format
  const getDisplayFormat = (): string => {
    if (mode === 'date') return 'yyyy-MM-dd';
    if (mode === 'time') return 'HH:mm:ss';
    return 'yyyy-MM-dd HH:mm:ss';
  };

  // Format for display
  const getDisplayValue = (): string => {
    if (!localValue) return '';
    
    const date = parseISOString(localValue);
    if (!date) return localValue;
    
    try {
      return format(date, getDisplayFormat());
    } catch {
      return localValue;
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const isoString = formatToISO(date);
    setLocalValue(isoString);
    onChange(isoString);
    setIsOpen(false);
    onBlur?.();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Validate and update if valid
    const date = parseISOString(newValue);
    if (date) {
      onChange(newValue);
    }
  };

  const handleBlur = () => {
    // Validate on blur
    const date = parseISOString(localValue);
    if (date) {
      const isoString = formatToISO(date);
      setLocalValue(isoString);
      onChange(isoString);
    } else if (localValue === '') {
      onChange('');
    }
    onBlur?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setLocalValue(value || '');
      e.currentTarget.blur();
    }
  };

  const currentDate = parseISOString(localValue);
  const hasErrors = validation && !validation.isValid;

  // For time-only mode, use input type="time"
  if (mode === 'time') {
    return (
      <Input
        type="time"
        value={localValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled || metadata?.readonly}
        placeholder={placeholder || 'HH:mm:ss'}
        autoFocus={autoFocus}
        className={cn(
          hasErrors && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        aria-invalid={hasErrors}
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        value={getDisplayValue()}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled || metadata?.readonly}
        placeholder={placeholder || getDisplayFormat()}
        autoFocus={autoFocus}
        className={cn(
          'flex-1',
          hasErrors && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        aria-invalid={hasErrors}
      />
      
      {!disabled && !metadata?.readonly && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={currentDate || undefined}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
