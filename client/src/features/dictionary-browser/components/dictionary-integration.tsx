/**
 * Dictionary Integration Component
 * 
 * Provides integration between dictionary browser and property editor
 * Adds "Browse Dictionary" button to semantic ID fields
 */

import { useState } from 'react';
import { Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DictionaryBrowserPanel } from './dictionary-browser-panel';
import type { DictionarySource } from '@shared/dictionary-types';

interface DictionaryIntegrationProps {
  readonly onSelect?: (conceptId: string, source: DictionarySource) => void;
  readonly initialQuery?: string;
}

/**
 * Dictionary Browser Button
 * Can be added next to semantic ID fields in property editors
 */
export function DictionaryBrowserButton({
  onSelect,
  initialQuery,
}: DictionaryIntegrationProps) {
  const [open, setOpen] = useState(false);

  const handleImport = (conceptId: string, source: DictionarySource) => {
    onSelect?.(conceptId, source);
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex-shrink-0"
      >
        <Book className="mr-2 h-4 w-4" />
        Browse Dictionary
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Browse Dictionary</DialogTitle>
          </DialogHeader>
          <div className="h-[70vh]">
            <DictionaryBrowserPanel onImport={handleImport} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Example usage in a property editor:
 * 
 * ```tsx
 * <div className="flex gap-2">
 *   <Input
 *     value={semanticId}
 *     onChange={(e) => setSemanticId(e.target.value)}
 *     placeholder="Enter semantic ID..."
 *   />
 *   <DictionaryBrowserButton
 *     onSelect={(conceptId) => setSemanticId(conceptId)}
 *   />
 * </div>
 * ```
 */
