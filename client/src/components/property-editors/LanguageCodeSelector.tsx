/**
 * Language Code Selector
 * 
 * Dropdown selector for ISO 639-1 language codes with search functionality.
 */

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

// ISO 639-1 Language Codes
const LANGUAGE_CODES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turkish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'cs', name: 'Czech' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'ro', name: 'Romanian' },
  { code: 'el', name: 'Greek' },
  { code: 'he', name: 'Hebrew' },
  { code: 'th', name: 'Thai' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ms', name: 'Malay' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'hr', name: 'Croatian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'et', name: 'Estonian' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
];

export interface LanguageCodeSelectorProps {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  excludeCodes?: string[];
  placeholder?: string;
}

export function LanguageCodeSelector({
  value,
  onChange,
  disabled,
  excludeCodes = [],
  placeholder = 'Select language...',
}: LanguageCodeSelectorProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter languages based on search and exclusions
  const filteredLanguages = React.useMemo(() => {
    return LANGUAGE_CODES.filter((lang) => {
      if (excludeCodes.includes(lang.code)) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          lang.code.toLowerCase().includes(query) ||
          lang.name.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [searchQuery, excludeCodes]);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {/* Search Input */}
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search languages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Language Options */}
        <div className="max-h-60 overflow-y-auto">
          {filteredLanguages.length > 0 ? (
            filteredLanguages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                <span className="font-mono text-xs text-muted-foreground mr-2">
                  {lang.code}
                </span>
                {lang.name}
              </SelectItem>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No languages found
            </div>
          )}
        </div>
      </SelectContent>
    </Select>
  );
}
