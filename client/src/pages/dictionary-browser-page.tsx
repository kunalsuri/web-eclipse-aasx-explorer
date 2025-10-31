/**
 * Dictionary Browser Page
 * 
 * Main page for browsing and searching ECLASS and IEC CDD dictionaries
 * Allows users to search, compare, and import standardized concept descriptions
 */


import { AppLayout } from '@/features/app-shell';
import { DictionaryBrowserPanel } from '@/features/dictionary-browser/components/dictionary-browser-panel';
import { Separator } from '@/components/ui/separator';
import { Book } from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { DictionarySource } from '@shared/dictionary-types';

export function DictionaryBrowserPage() {
  /**
   * Handle concept import
   */
  const handleImport = (conceptId: string, source: DictionarySource) => {
    console.log('Import concept:', conceptId, 'from', source);
    // TODO: Implement actual import logic
    // This will be connected to the AAS editor in a future task
  };

  /**
   * Keyboard shortcuts for dictionary browser
   */
  useKeyboardShortcuts({
    enabled: true,
    shortcuts: [
      {
        key: 'd',
        ctrl: true,
        shift: true,
        description: 'Open dictionary browser',
        action: () => {
          // Already on dictionary page, focus search input
          const searchInput = document.querySelector<HTMLInputElement>(
            'input[type="text"][placeholder*="Search"]'
          );
          searchInput?.focus();
        },
      },
      {
        key: 'Escape',
        description: 'Close modals and clear selection',
        action: () => {
          // Close any open modals or dialogs
          const closeButtons = document.querySelectorAll('[aria-label="Close"]');
          if (closeButtons.length > 0) {
            (closeButtons[0] as HTMLElement).click();
          }
        },
      },
      {
        key: 'f',
        ctrl: true,
        description: 'Focus search input',
        action: () => {
          const searchInput = document.querySelector<HTMLInputElement>(
            'input[type="text"][placeholder*="Search"]'
          );
          searchInput?.focus();
        },
      },
    ],
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Book className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Dictionary Browser
              </h1>
              <p className="text-muted-foreground">
                Search and import standardized concept descriptions from ECLASS and IEC CDD
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Dictionary Browser Panel */}
        <div className="h-[calc(100vh-12rem)]">
          <DictionaryBrowserPanel onImport={handleImport} />
        </div>

        {/* Info Section */}
        <div className="rounded-lg border border-gray-200 bg-muted/50 p-4 dark:border-gray-700">
          <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            About Dictionary Integration
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              The Dictionary Browser enables semantic interoperability by providing access to
              standardized concept descriptions from industry-recognized dictionaries.
            </p>
            <p>
              <strong>Supported Dictionaries:</strong>
            </p>
            <ul className="ml-6 list-disc space-y-1">
              <li>
                <strong>ECLASS:</strong> Standardized classification and product description
                system for products and services
              </li>
              <li>
                <strong>IEC CDD:</strong> International Electrotechnical Commission Common Data
                Dictionary for standardized data elements
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
