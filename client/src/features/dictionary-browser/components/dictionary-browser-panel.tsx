/**
 * Dictionary Browser Panel Component
 * 
 * Main container for browsing and searching ECLASS and IEC CDD dictionaries
 * Provides tabbed interface with search, filters, and results display
 */

import { useState } from 'react';
import { Book, Search as SearchIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DictionarySource } from '@shared/dictionary-types';

interface DictionaryBrowserPanelProps {
  readonly onImport?: (conceptId: string, source: DictionarySource) => void;
}

export function DictionaryBrowserPanel({ onImport }: DictionaryBrowserPanelProps) {
  const [activeTab, setActiveTab] = useState<DictionarySource>(DictionarySource.ECLASS);

  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <Book className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Dictionary Browser
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Search and import standardized concept descriptions
            </p>
          </div>
        </div>
      </div>

      {/* Tabbed Interface */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as DictionarySource)}
          className="flex h-full flex-col"
        >
          {/* Tab List */}
          <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value={DictionarySource.ECLASS}>
                ECLASS
              </TabsTrigger>
              <TabsTrigger value={DictionarySource.IECCDD}>
                IEC CDD
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ECLASS Tab Content */}
          <TabsContent
            value={DictionarySource.ECLASS}
            className="flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
          >
            <DictionaryTabContent
              source={DictionarySource.ECLASS}
              onImport={onImport}
            />
          </TabsContent>

          {/* IEC CDD Tab Content */}
          <TabsContent
            value={DictionarySource.IECCDD}
            className="flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
          >
            <DictionaryTabContent
              source={DictionarySource.IECCDD}
              onImport={onImport}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/**
 * Dictionary Tab Content Component
 * Contains search bar, filters, and results for a specific dictionary source
 */
interface DictionaryTabContentProps {
  readonly source: DictionarySource;
  readonly onImport?: (conceptId: string, source: DictionarySource) => void;
}

function DictionaryTabContent({ source, onImport }: DictionaryTabContentProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex h-full flex-col">
      {/* Search Area */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${source === DictionarySource.ECLASS ? 'ECLASS' : 'IEC CDD'} concepts...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>

        {/* Filters Section - Placeholder */}
        <div className="mt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Filters will be added in the next task
          </p>
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {searchQuery ? (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Results will be displayed here (implemented in next task)
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <SearchIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                Start searching
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Enter a search term to find {source === DictionarySource.ECLASS ? 'ECLASS' : 'IEC CDD'} concepts
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
