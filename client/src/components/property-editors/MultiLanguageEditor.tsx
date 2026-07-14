/**
 * Multi-Language Editor
 * 
 * Editor for multi-language properties with support for multiple languages.
 * Allows adding, editing, and removing language entries.
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PropertyEditorProps } from './types';
import type { LangStringTextType } from '../../../../shared/aas-v3-types';

export interface MultiLanguageEditorProps extends PropertyEditorProps<LangStringTextType[]> {
  maxLanguages?: number;
  requiredLanguages?: string[];
}

export function MultiLanguageEditor({
  value = [],
  onChange,
  onBlur,
  validation,
  disabled,
  metadata,
  className,
  maxLanguages = 10,
  requiredLanguages = [],
}: MultiLanguageEditorProps) {
  const [entries, setEntries] = React.useState<Array<{ lang: string; text: string }>>(
    value.map(({ language, text }) => ({ lang: language, text }))
  );

  // Sync with external value changes
  React.useEffect(() => {
    setEntries(value.map(({ language, text }) => ({ lang: language, text })));
  }, [value]);

  // Convert entries to LangStringTextType[]
  const entriesToValue = (entries: Array<{ lang: string; text: string }>): LangStringTextType[] => {
    return entries
      .filter(({ lang, text }) => lang && text)
      .map(({ lang, text }) => ({ language: lang, text }));
  };

  // Add new language entry
  const addLanguage = () => {
    if (entries.length >= maxLanguages) {
      return;
    }

    const newEntries = [...entries, { lang: '', text: '' }];
    setEntries(newEntries);
  };

  // Remove language entry
  const removeLanguage = (index: number) => {
    const entry = entries[index];
    
    // Prevent removing required languages
    if (requiredLanguages.includes(entry.lang)) {
      return;
    }

    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
    onChange(entriesToValue(newEntries));
  };

  // Update language code
  const updateLanguage = (index: number, lang: string) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], lang };
    setEntries(newEntries);
    onChange(entriesToValue(newEntries));
  };

  // Update text value
  const updateText = (index: number, text: string) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], text };
    setEntries(newEntries);
    onChange(entriesToValue(newEntries));
  };

  // Check if language code is duplicate
  const isDuplicateLanguage = (lang: string, currentIndex: number): boolean => {
    return entries.some((entry, index) => 
      index !== currentIndex && entry.lang === lang && lang !== ''
    );
  };

  const hasErrors = validation && !validation.isValid;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Language Entries */}
      {entries.map((entry, index) => {
        const isDuplicate = isDuplicateLanguage(entry.lang, index);
        const isRequired = requiredLanguages.includes(entry.lang);

        return (
          <div key={index} className="flex items-start gap-2">
            {/* Language Code Input */}
            <Input
              type="text"
              value={entry.lang}
              onChange={(e) => updateLanguage(index, e.target.value)}
              onBlur={onBlur}
              disabled={disabled || metadata?.readonly}
              placeholder="en"
              className={cn(
                'w-20',
                isDuplicate && 'border-destructive',
                hasErrors && 'border-destructive'
              )}
              maxLength={10}
              aria-label="Language code"
              aria-invalid={isDuplicate}
            />

            {/* Text Input */}
            <Input
              type="text"
              value={entry.text}
              onChange={(e) => updateText(index, e.target.value)}
              onBlur={onBlur}
              disabled={disabled || metadata?.readonly}
              placeholder="Enter text..."
              className={cn(
                'flex-1',
                hasErrors && 'border-destructive'
              )}
              aria-label={`Text for ${entry.lang || 'language'}`}
            />

            {/* Remove Button */}
            {!disabled && !metadata?.readonly && !isRequired && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeLanguage(index)}
                className="h-10 w-10"
                aria-label="Remove language"
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            {/* Required Indicator */}
            {isRequired && (
              <div className="h-10 w-10 flex items-center justify-center text-xs text-muted-foreground">
                Required
              </div>
            )}
          </div>
        );
      })}

      {/* Duplicate Warning */}
      {entries.some((entry, index) => isDuplicateLanguage(entry.lang, index)) && (
        <div className="text-sm text-destructive">
          Duplicate language codes are not allowed
        </div>
      )}

      {/* Add Language Button */}
      {!disabled && !metadata?.readonly && entries.length < maxLanguages && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLanguage}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Language
        </Button>
      )}

      {/* Max Languages Warning */}
      {entries.length >= maxLanguages && (
        <div className="text-sm text-muted-foreground">
          Maximum {maxLanguages} languages allowed
        </div>
      )}
    </div>
  );
}
