/**
 * Help System Hook
 * 
 * Provides help dialog state management and F1 keyboard shortcut.
 */

import { useState, useEffect, useCallback } from 'react';

interface UseHelpSystemOptions {
  enableF1?: boolean;
  initialTopic?: string;
}

/**
 * Hook for help system
 */
export function useHelpSystem(options: UseHelpSystemOptions = {}) {
  const { enableF1 = true, initialTopic } = options;
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<string | undefined>(initialTopic);
  
  // Open help dialog
  const openHelp = useCallback((topic?: string) => {
    setCurrentTopic(topic);
    setIsOpen(true);
  }, []);
  
  // Close help dialog
  const closeHelp = useCallback(() => {
    setIsOpen(false);
  }, []);
  
  // Toggle help dialog
  const toggleHelp = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);
  
  // F1 keyboard shortcut
  useEffect(() => {
    if (!enableF1) return;
    
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'F1') {
        e.preventDefault();
        openHelp();
      }
    }
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableF1, openHelp]);
  
  return {
    isOpen,
    currentTopic,
    openHelp,
    closeHelp,
    toggleHelp,
  };
}

/**
 * Hook for context-sensitive help
 */
export function useContextHelp(topicId: string) {
  const { openHelp } = useHelpSystem({ enableF1: false });
  
  const showHelp = useCallback(() => {
    openHelp(topicId);
  }, [openHelp, topicId]);
  
  return { showHelp };
}
