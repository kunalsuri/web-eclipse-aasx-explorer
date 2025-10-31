/**
 * Help Dialog Component
 * 
 * Provides searchable help system with categories, search, and related topics.
 * Opened with F1 keyboard shortcut.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Book, Keyboard, HelpCircle, FileQuestion } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import helpContent from '../data/help-content.json';

interface HelpTopic {
  id: string;
  title: string;
  category: 'getting-started' | 'features' | 'shortcuts' | 'faq';
  content: string;
  keywords: string[];
  relatedTopics: string[];
}

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
}

const categoryIcons = {
  'getting-started': Book,
  'features': HelpCircle,
  'shortcuts': Keyboard,
  'faq': FileQuestion,
};

const categoryLabels = {
  'getting-started': 'Getting Started',
  'features': 'Features',
  'shortcuts': 'Keyboard Shortcuts',
  'faq': 'FAQ',
};

/**
 * Search help topics
 */
function searchTopics(topics: HelpTopic[], query: string): HelpTopic[] {
  if (!query.trim()) {
    return topics;
  }
  
  const lowerQuery = query.toLowerCase();
  
  return topics.filter((topic) => {
    // Search in title
    if (topic.title.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    // Search in content
    if (topic.content.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    // Search in keywords
    if (topic.keywords.some((kw) => kw.toLowerCase().includes(lowerQuery))) {
      return true;
    }
    
    return false;
  });
}

/**
 * Help Dialog Component
 */
export function HelpDialog({ isOpen, onClose, initialTopic }: HelpDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(initialTopic || null);
  
  const topics = helpContent.topics as HelpTopic[];
  
  // Filter topics by search and category
  const filteredTopics = useMemo(() => {
    let filtered = searchTopics(topics, searchQuery);
    
    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }
    
    return filtered;
  }, [topics, searchQuery, selectedCategory]);
  
  // Get current topic
  const currentTopic = useMemo(() => {
    return topics.find((t) => t.id === selectedTopic);
  }, [topics, selectedTopic]);
  
  // Get related topics
  const relatedTopics = useMemo(() => {
    if (!currentTopic) return [];
    return topics.filter((t) => currentTopic.relatedTopics.includes(t.id));
  }, [topics, currentTopic]);
  
  // Set initial topic
  useEffect(() => {
    if (initialTopic && !selectedTopic) {
      setSelectedTopic(initialTopic);
    }
  }, [initialTopic, selectedTopic]);
  
  // Auto-focus search on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        document.getElementById('help-search')?.focus();
      }, 100);
    }
  }, [isOpen]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center space-x-2">
            <HelpCircle className="h-5 w-5" />
            <span>Help & Documentation</span>
          </DialogTitle>
          <DialogDescription>
            Search for help topics or browse by category
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex h-full overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r flex flex-col">
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="help-search"
                  type="text"
                  placeholder="Search help..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Categories */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                <Button
                  variant={selectedCategory === null ? 'secondary' : 'ghost'}
                  className="w-full justify-start mb-1"
                  onClick={() => setSelectedCategory(null)}
                >
                  All Topics
                </Button>
                
                {Object.entries(categoryLabels).map(([key, label]) => {
                  const Icon = categoryIcons[key as keyof typeof categoryIcons];
                  const count = topics.filter((t) => t.category === key).length;
                  
                  return (
                    <Button
                      key={key}
                      variant={selectedCategory === key ? 'secondary' : 'ghost'}
                      className="w-full justify-start mb-1"
                      onClick={() => setSelectedCategory(key)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      <span className="flex-1 text-left">{label}</span>
                      <Badge variant="outline" className="ml-2">
                        {count}
                      </Badge>
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
          
          {/* Topic List */}
          <div className="w-80 border-r flex flex-col">
            <div className="p-4 border-b">
              <p className="text-sm text-muted-foreground">
                {filteredTopics.length} topic{filteredTopics.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-2">
                {filteredTopics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg mb-1 transition-colors',
                      selectedTopic === topic.id
                        ? 'bg-secondary'
                        : 'hover:bg-muted'
                    )}
                  >
                    <div className="font-medium mb-1">{topic.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {topic.content.substring(0, 100)}...
                    </div>
                  </button>
                ))}
                
                {filteredTopics.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileQuestion className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No topics found</p>
                    <p className="text-sm">Try a different search term</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          
          {/* Content */}
          <div className="flex-1 flex flex-col">
            {currentTopic ? (
              <>
                <div className="p-6 border-b">
                  <h2 className="text-2xl font-bold mb-2">{currentTopic.title}</h2>
                  <Badge variant="outline">
                    {categoryLabels[currentTopic.category]}
                  </Badge>
                </div>
                
                <ScrollArea className="flex-1 p-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {currentTopic.content.split('\n').map((line, i) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return (
                          <h3 key={i} className="font-semibold mt-4 mb-2">
                            {line.replace(/\*\*/g, '')}
                          </h3>
                        );
                      }
                      if (line.startsWith('- ')) {
                        return (
                          <li key={i} className="ml-4">
                            {line.substring(2)}
                          </li>
                        );
                      }
                      if (line.trim() === '') {
                        return <br key={i} />;
                      }
                      return <p key={i}>{line}</p>;
                    })}
                  </div>
                  
                  {relatedTopics.length > 0 && (
                    <div className="mt-8 pt-6 border-t">
                      <h3 className="font-semibold mb-3">Related Topics</h3>
                      <div className="flex flex-wrap gap-2">
                        {relatedTopics.map((topic) => (
                          <Button
                            key={topic.id}
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTopic(topic.id)}
                          >
                            {topic.title}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Book className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a topic to view help</p>
                  <p className="text-sm">Or search for what you need</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
