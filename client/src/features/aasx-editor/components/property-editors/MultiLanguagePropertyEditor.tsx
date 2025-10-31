/**
 * MultiLanguageProperty Editor
 * 
 * Editor for MultiLanguageProperty values with support for multiple languages
 */

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, X, Plus, Trash2, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MultiLanguageProperty, LangStringTextType } from "@/../../shared/aas-v3-types";

interface MultiLanguagePropertyEditorProps {
  property: MultiLanguageProperty;
  onSave: (updatedProperty: MultiLanguageProperty) => void;
  onCancel: () => void;
  readOnly?: boolean;
}

// Common language codes (ISO 639-1)
const COMMON_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "de", name: "German" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  { code: "ru", name: "Russian" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
];

export function MultiLanguagePropertyEditor({
  property,
  onSave,
  onCancel,
  readOnly = false,
}: MultiLanguagePropertyEditorProps) {
  const [langStrings, setLangStrings] = useState<LangStringTextType[]>(
    property.value || [{ language: "en", text: "" }]
  );
  const [errors, setErrors] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    setLangStrings(property.value || [{ language: "en", text: "" }]);
  }, [property]);

  /**
   * Validate language strings
   * - Each language code must be unique (AASd-130)
   * - Language code and text must not be empty
   */
  function validateLangStrings(strings: LangStringTextType[]): Map<number, string> {
    const newErrors = new Map<number, string>();
    const seenLanguages = new Set<string>();

    strings.forEach((langString, index) => {
      // Check for empty language
      if (!langString.language || langString.language.trim() === "") {
        newErrors.set(index, "Language code is required");
        return;
      }

      // Check for duplicate language (AASd-130)
      if (seenLanguages.has(langString.language)) {
        newErrors.set(index, `Duplicate language code: ${langString.language}`);
      } else {
        seenLanguages.add(langString.language);
      }

      // Check for empty text (warning)
      if (!langString.text || langString.text.trim() === "") {
        // Don't block save, but could warn
      }
    });

    return newErrors;
  }

  /**
   * Update language string at index
   */
  function updateLangString(index: number, field: "language" | "text", value: string): void {
    const updated = [...langStrings];
    updated[index] = { ...updated[index], [field]: value };
    setLangStrings(updated);
    
    // Revalidate
    const newErrors = validateLangStrings(updated);
    setErrors(newErrors);
  }

  /**
   * Add new language string
   */
  function addLangString(): void {
    // Find first unused common language
    const usedLanguages = new Set(langStrings.map(ls => ls.language));
    const availableLanguage = COMMON_LANGUAGES.find(
      lang => !usedLanguages.has(lang.code)
    );

    const newLangString: LangStringTextType = {
      language: availableLanguage?.code || "",
      text: "",
    };

    setLangStrings([...langStrings, newLangString]);
  }

  /**
   * Remove language string at index
   */
  function removeLangString(index: number): void {
    if (langStrings.length <= 1) {
      // Don't allow removing the last language string
      return;
    }

    const updated = langStrings.filter((_, i) => i !== index);
    setLangStrings(updated);
    
    // Revalidate
    const newErrors = validateLangStrings(updated);
    setErrors(newErrors);
  }

  /**
   * Handle save
   */
  function handleSave(): void {
    const validationErrors = validateLangStrings(langStrings);
    
    if (validationErrors.size > 0) {
      setErrors(validationErrors);
      return;
    }

    // Filter out empty text values
    const validLangStrings = langStrings.filter(
      ls => ls.language && ls.language.trim() !== ""
    );

    const updatedProperty: MultiLanguageProperty = {
      ...property,
      value: validLangStrings,
    };

    onSave(updatedProperty);
  }

  /**
   * Handle keyboard shortcuts on text inputs
   */
  function handleKeyDown(e: React.KeyboardEvent, index: number): void {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  const hasErrors = errors.size > 0;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">
          Multi-Language Values
        </Label>
        {!readOnly && (
          <Button
            variant="outline"
            size="sm"
            onClick={addLangString}
            disabled={langStrings.length >= COMMON_LANGUAGES.length}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Language
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {langStrings.map((langString, index) => {
          const error = errors.get(index);
          
          return (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <div className="w-32">
                    <Select
                      value={langString.language}
                      onValueChange={(val) => updateLangString(index, "language", val)}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Language" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_LANGUAGES.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.code} - {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Input
                    value={langString.text}
                    onChange={(e) => updateLangString(index, "text", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    placeholder={`Text in ${langString.language || "language"}`}
                    disabled={readOnly}
                    className={error ? "border-destructive flex-1" : "flex-1"}
                  />

                  {!readOnly && langStrings.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLangString(index)}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

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
          Tip: Press Ctrl+Enter to save, Esc to cancel
        </p>
      )}
    </div>
  );
}
