/**
 * Multi-Language Property Editor
 * Handles editing of MultiLanguageProperty elements with multiple language entries
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, AlertCircle, Globe } from 'lucide-react';
import type { LangStringTextType } from '../../../../../shared';

interface MultiLanguageEditorProps {
  readonly value: LangStringTextType[];
  readonly onChange: (value: LangStringTextType[]) => void;
  readonly disabled?: boolean;
  readonly errors?: string[];
}

// Common language codes based on ISO 639-1
const COMMON_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'it', name: 'Italian (Italiano)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'nl', name: 'Dutch (Nederlands)' },
  { code: 'pl', name: 'Polish (Polski)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'ko', name: 'Korean (한국어)' },
];

/**
 * MultiLanguageEditor - Editor for multi-language properties
 * Features:
 * - Add/remove language entries
 * - Language code selector
 * - Validate language codes
 * - Display all languages in edit mode
 */
export function MultiLanguageEditor({
  value = [],
  onChange,
  disabled = false,
  errors = [],
}: MultiLanguageEditorProps) {
  const [newLanguage, setNewLanguage] = useState('en');
  const hasErrors = errors.length > 0;

  // Add a new language entry
  const addLanguage = () => {
    // Check if language already exists
    if (value.some((entry) => entry.language === newLanguage)) {
      return;
    }

    const newEntry: LangStringTextType = {
      language: newLanguage,
      text: '',
    };

    onChange([...value, newEntry]);
  };

  // Remove a language entry
  const removeLanguage = (language: string) => {
    onChange(value.filter((entry) => entry.language !== language));
  };

  // Update text for a specific language
  const updateText = (language: string, text: string) => {
    onChange(
      value.map((entry) =>
        entry.language === language ? { ...entry, text } : entry
      )
    );
  };

  // Get available languages (not yet added)
  const availableLanguages = COMMON_LANGUAGES.filter(
    (lang) => !value.some((entry) => entry.language === lang.code)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Multi-Language Values
        </Label>
        <Badge variant="secondary">{value.length} languages</Badge>
      </div>

      {/* Language Entries */}
      <div className="space-y-3">
        {value.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-4 text-muted-foreground">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No language entries yet</p>
                <p className="text-xs mt-1">Add a language to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          value.map((entry) => (
            <Card key={entry.language}>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{entry.language}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {COMMON_LANGUAGES.find((l) => l.code === entry.language)?.name || entry.language}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeLanguage(entry.language)}
                      disabled={disabled}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <Input
                    value={entry.text}
                    onChange={(e) => updateText(entry.language, e.target.value)}
                    disabled={disabled}
                    placeholder={`Enter text in ${entry.language}...`}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Separator />

      {/* Add Language Section */}
      {availableLanguages.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Add Language</Label>
          <div className="flex gap-2">
            <Select value={newLanguage} onValueChange={setNewLanguage} disabled={disabled}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select language..." />
              </SelectTrigger>
              <SelectContent>
                {availableLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {lang.code}
                      </Badge>
                      <span>{lang.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={addLanguage}
              disabled={disabled || availableLanguages.length === 0}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      )}

      {availableLanguages.length === 0 && value.length > 0 && (
        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground">
            All common languages have been added
          </p>
        </div>
      )}

      {/* Validation Errors */}
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
 * Validate language codes
 */
export function validateLanguageCodes(value: LangStringTextType[]): string[] {
  const errors: string[] = [];

  if (value.length === 0) {
    errors.push('At least one language entry is required');
    return errors;
  }

  // Check for duplicate language codes
  const languages = value.map((entry) => entry.language);
  const duplicates = languages.filter((lang, index) => languages.indexOf(lang) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate language codes: ${duplicates.join(', ')}`);
  }

  // Check for empty text values
  const emptyEntries = value.filter((entry) => !entry.text || entry.text.trim() === '');
  if (emptyEntries.length > 0) {
    errors.push(`Empty text for languages: ${emptyEntries.map((e) => e.language).join(', ')}`);
  }

  // Validate language code format (ISO 639-1: 2 letters)
  const invalidCodes = value.filter((entry) => !/^[a-z]{2}(-[A-Z]{2})?$/.test(entry.language));
  if (invalidCodes.length > 0) {
    errors.push(`Invalid language codes: ${invalidCodes.map((e) => e.language).join(', ')}`);
  }

  return errors;
}
