/**
 * useClipboard Hook
 * Custom hook for copy/paste/cut operations on AAS elements
 * 
 * Features:
 * - Server-side clipboard integration
 * - Local fallback for offline mode
 * - Automatic sync with server
 * - Reference tracking
 */

import { useState, useCallback, useEffect } from 'react';
import { clipboardApi } from '../api/clipboard-api';
import type { SubmodelElement } from '../../../../../shared/aas-v3-types';
import { toast } from '@/hooks/use-toast';

export interface ClipboardItem {
  element: SubmodelElement;
  operation: 'copy' | 'cut';
  sourcePackageId: string;
  sourceElementPath: string[];
  timestamp: number;
  metadata?: {
    elementType: string;
    hasChildren: boolean;
    referenceCount: number;
  };
}

interface UseClipboardOptions {
  useServer?: boolean;
  packageId?: string;
  onError?: (error: Error) => void;
}

interface UseClipboardResult {
  clipboardItem: ClipboardItem | null;
  copy: (element: SubmodelElement, sourceElementPath: string[]) => Promise<void>;
  cut: (element: SubmodelElement, sourceElementPath: string[]) => Promise<void>;
  paste: (targetParentPath: string[]) => Promise<SubmodelElement | null>;
  clear: () => Promise<void>;
  canPaste: boolean;
  isLoading: boolean;
  error: Error | null;
}

const CLIPBOARD_KEY = 'aas-clipboard';
const CLIPBOARD_EXPIRY = 1000 * 60 * 60; // 1 hour

export function useClipboard(options: UseClipboardOptions = {}): UseClipboardResult {
  const { useServer = true, packageId = 'default', onError } = options;
  const [clipboardItem, setClipboardItem] = useState<ClipboardItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load clipboard on mount
  useEffect(() => {
    const loadClipboard = async () => {
      if (useServer) {
        try {
          const item = await clipboardApi.getClipboard();
          if (item) {
            setClipboardItem(item);
          }
        } catch (err) {
          // Fallback to localStorage
          loadFromLocalStorage();
        }
      } else {
        loadFromLocalStorage();
      }
    };

    loadClipboard();
  }, [useServer]);

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(CLIPBOARD_KEY);
      if (stored) {
        const item = JSON.parse(stored) as ClipboardItem;
        if (Date.now() - item.timestamp < CLIPBOARD_EXPIRY) {
          setClipboardItem(item);
        }
      }
    } catch (err) {
      console.warn('Failed to load clipboard from localStorage:', err);
    }
  };

  // Copy element
  const copy = useCallback(
    async (element: SubmodelElement, sourceElementPath: string[]) => {
      setIsLoading(true);
      setError(null);

      try {
        if (useServer) {
          const result = await clipboardApi.copy(element, packageId, sourceElementPath);
          setClipboardItem(result);
          
          toast({
            title: 'Copied',
            description: `${element.modelType} "${element.idShort || 'unnamed'}" copied to clipboard`,
          });
        } else {
          const item: ClipboardItem = {
            element: JSON.parse(JSON.stringify(element)),
            operation: 'copy',
            sourcePackageId: packageId,
            sourceElementPath,
            timestamp: Date.now(),
          };
          setClipboardItem(item);
          localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(item));
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to copy');
        setError(error);
        if (onError) onError(error);
        
        toast({
          title: 'Copy Failed',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [useServer, packageId, onError]
  );

  // Cut element
  const cut = useCallback(
    async (element: SubmodelElement, sourceElementPath: string[]) => {
      setIsLoading(true);
      setError(null);

      try {
        if (useServer) {
          const result = await clipboardApi.cut(element, packageId, sourceElementPath);
          setClipboardItem(result);
          
          toast({
            title: 'Cut',
            description: `${element.modelType} "${element.idShort || 'unnamed'}" cut to clipboard`,
          });
        } else {
          const item: ClipboardItem = {
            element: JSON.parse(JSON.stringify(element)),
            operation: 'cut',
            sourcePackageId: packageId,
            sourceElementPath,
            timestamp: Date.now(),
          };
          setClipboardItem(item);
          localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(item));
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to cut');
        setError(error);
        if (onError) onError(error);
        
        toast({
          title: 'Cut Failed',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [useServer, packageId, onError]
  );

  // Paste element
  const paste = useCallback(
    async (targetParentPath: string[]): Promise<SubmodelElement | null> => {
      if (!clipboardItem) {
        toast({
          title: 'Paste Failed',
          description: 'Clipboard is empty',
          variant: 'destructive',
        });
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (useServer) {
          const result = await clipboardApi.paste({
            targetPackageId: packageId,
            targetParentPath,
            regenerateIds: true,
            updateReferences: true,
          });

          if (result.warnings.length > 0) {
            toast({
              title: 'Pasted with Warnings',
              description: result.warnings.join(', '),
            });
          } else {
            toast({
              title: 'Pasted',
              description: `${result.element.modelType} pasted successfully`,
            });
          }

          // Clear clipboard if it was a cut operation
          if (clipboardItem.operation === 'cut') {
            await clear();
          }

          return result.element;
        } else {
          // Local paste
          const element = clipboardItem.element;
          
          if (clipboardItem.operation === 'cut') {
            await clear();
          }
          
          return element;
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to paste');
        setError(error);
        if (onError) onError(error);
        
        toast({
          title: 'Paste Failed',
          description: error.message,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [clipboardItem, useServer, packageId, onError]
  );

  // Clear clipboard
  const clear = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (useServer) {
        await clipboardApi.clear();
      }
      setClipboardItem(null);
      localStorage.removeItem(CLIPBOARD_KEY);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to clear clipboard');
      setError(error);
      if (onError) onError(error);
    } finally {
      setIsLoading(false);
    }
  }, [useServer, onError]);

  // Check if can paste
  const canPaste = clipboardItem !== null && Date.now() - clipboardItem.timestamp < CLIPBOARD_EXPIRY;

  return {
    clipboardItem,
    copy,
    cut,
    paste,
    clear,
    canPaste,
    isLoading,
    error,
  };
}
