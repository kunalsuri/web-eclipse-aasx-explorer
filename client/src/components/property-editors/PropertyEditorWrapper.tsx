/**
 * Property Editor Wrapper
 * 
 * Common wrapper component for all property editors.
 * Provides label, error display, help text, and consistent styling.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ValidationResult } from './types';

export interface PropertyEditorWrapperProps {
  label?: string;
  helpText?: string;
  validation?: ValidationResult;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function PropertyEditorWrapper({
  label,
  helpText,
  validation,
  required,
  children,
  className,
}: PropertyEditorWrapperProps) {
  const hasErrors = validation && !validation.isValid && validation.errors.length > 0;
  const hasWarnings = validation && validation.warnings.length > 0;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label and Help */}
      {label && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
          
          {helpText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{helpText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}

      {/* Editor Component */}
      <div className="relative">
        {children}
      </div>

      {/* Validation Errors */}
      {hasErrors && (
        <div className="space-y-1">
          {validation.errors.map((error, index) => (
            <div
              key={index}
              className="flex items-start gap-2 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p>{error.message}</p>
                {error.suggestion && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Suggestion: {error.suggestion}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Validation Warnings */}
      {hasWarnings && !hasErrors && (
        <div className="space-y-1">
          {validation.warnings.map((warning, index) => (
            <div
              key={index}
              className="flex items-start gap-2 text-sm text-yellow-600 dark:text-yellow-500"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>{warning.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
