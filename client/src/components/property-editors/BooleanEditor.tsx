/**
 * Boolean Editor
 * 
 * Toggle/checkbox editor for boolean values.
 */

import * as React from 'react';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { PropertyEditorProps } from './types';

export interface BooleanEditorProps extends PropertyEditorProps<boolean | null> {
  variant?: 'switch' | 'checkbox';
  triState?: boolean; // Allow null/undefined state
}

export function BooleanEditor({
  value,
  onChange,
  onBlur,
  disabled,
  metadata,
  className,
  variant = 'switch',
  triState = false,
}: BooleanEditorProps) {
  const handleChange = (checked: boolean) => {
    onChange(checked);
    onBlur?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      
      if (triState) {
        // Cycle through: false -> true -> null -> false
        if (value === false) {
          onChange(true);
        } else if (value === true) {
          onChange(null);
        } else {
          onChange(false);
        }
      } else {
        onChange(!value);
      }
      
      onBlur?.();
    }
  };

  if (variant === 'checkbox') {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <Checkbox
          checked={value === true}
          onCheckedChange={handleChange}
          disabled={disabled || metadata?.readonly}
          onKeyDown={handleKeyDown}
          aria-label="Boolean value"
        />
        {triState && value === null && (
          <span className="text-sm text-muted-foreground">(not set)</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Switch
        checked={value === true}
        onCheckedChange={handleChange}
        disabled={disabled || metadata?.readonly}
        onKeyDown={handleKeyDown}
        aria-label="Boolean value"
      />
      <span className="text-sm text-muted-foreground">
        {value === true && 'True'}
        {value === false && 'False'}
        {value === null && 'Not set'}
      </span>
    </div>
  );
}
