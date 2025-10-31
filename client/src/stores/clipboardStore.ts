/**
 * Clipboard Store
 * 
 * Zustand store for managing clipboard operations (copy/cut/paste).
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface ClipboardContent {
  elements: any[];
  operation: 'copy' | 'cut';
  timestamp: number;
  sourceParent?: string;
}

interface ClipboardState {
  content: ClipboardContent | null;
  
  // Actions
  copy: (elements: any[]) => void;
  cut: (elements: any[], sourceParent?: string) => void;
  paste: (targetParent: any) => Promise<any[]>;
  clear: () => void;
  
  // Queries
  hasContent: () => boolean;
  isCut: (elementId: string) => boolean;
  canPaste: (targetParent: any) => boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Deep clone an element
 */
function cloneElement(element: any): any {
  return structuredClone(element);
}

/**
 * Generate new ID for element
 */
function generateNewId(originalId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${originalId}_copy_${timestamp}_${random}`;
}

/**
 * Update IDs recursively
 */
function updateIds(element: any): any {
  const cloned = cloneElement(element);
  
  // Update element ID
  if (cloned.id) {
    cloned.id = generateNewId(cloned.id);
  }
  
  // Update idShort to avoid duplicates
  if (cloned.idShort) {
    cloned.idShort = `${cloned.idShort}_copy`;
  }
  
  // Recursively update child elements
  if (cloned.value && Array.isArray(cloned.value)) {
    cloned.value = cloned.value.map(updateIds);
  }
  if (cloned.submodelElements && Array.isArray(cloned.submodelElements)) {
    cloned.submodelElements = cloned.submodelElements.map(updateIds);
  }
  if (cloned.statements && Array.isArray(cloned.statements)) {
    cloned.statements = cloned.statements.map(updateIds);
  }
  
  return cloned;
}

/**
 * Check if element can be pasted into target
 */
function canPasteInto(element: any, target: any): boolean {
  // Can paste into containers
  const containerTypes = [
    'Submodel',
    'SubmodelElementCollection',
    'SubmodelElementList',
    'Entity',
  ];
  
  if (!containerTypes.includes(target.modelType)) {
    return false;
  }
  
  // For SubmodelElementList, check type compatibility
  if (target.modelType === 'SubmodelElementList') {
    if (target.typeValueListElement && element.modelType !== target.typeValueListElement) {
      return false;
    }
  }
  
  return true;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useClipboardStore = create<ClipboardState>()(
  devtools(
    (set, get) => ({
      content: null,

      // Copy elements to clipboard
      copy: (elements) => {
        set({
          content: {
            elements: elements.map(cloneElement),
            operation: 'copy',
            timestamp: Date.now(),
          },
        });
      },

      // Cut elements to clipboard
      cut: (elements, sourceParent) => {
        set({
          content: {
            elements: elements.map(cloneElement),
            operation: 'cut',
            timestamp: Date.now(),
            sourceParent,
          },
        });
      },

      // Paste elements from clipboard
      paste: async (targetParent) => {
        const { content } = get();
        
        if (!content) {
          throw new Error('Clipboard is empty');
        }

        // Check if can paste
        const canPaste = content.elements.every(el => canPasteInto(el, targetParent));
        if (!canPaste) {
          throw new Error('Cannot paste elements into this target');
        }

        // Clone and update IDs
        const pastedElements = content.elements.map(updateIds);

        // If cut operation, clear clipboard
        if (content.operation === 'cut') {
          set({ content: null });
        }

        return pastedElements;
      },

      // Clear clipboard
      clear: () => {
        set({ content: null });
      },

      // Check if clipboard has content
      hasContent: () => {
        return get().content !== null;
      },

      // Check if element is cut
      isCut: (elementId) => {
        const { content } = get();
        if (!content || content.operation !== 'cut') {
          return false;
        }
        return content.elements.some(el => el.id === elementId || el.idShort === elementId);
      },

      // Check if can paste into target
      canPaste: (targetParent) => {
        const { content } = get();
        if (!content) return false;
        
        return content.elements.every(el => canPasteInto(el, targetParent));
      },
    }),
    { name: 'ClipboardStore' }
  )
);

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access clipboard operations
 */
export function useClipboard() {
  const copy = useClipboardStore((state) => state.copy);
  const cut = useClipboardStore((state) => state.cut);
  const paste = useClipboardStore((state) => state.paste);
  const clear = useClipboardStore((state) => state.clear);
  const hasContent = useClipboardStore((state) => state.hasContent());
  const content = useClipboardStore((state) => state.content);

  return {
    copy,
    cut,
    paste,
    clear,
    hasContent,
    content,
    operation: content?.operation,
  };
}

/**
 * Hook to check if element is cut
 */
export function useIsCut(elementId: string) {
  return useClipboardStore((state) => state.isCut(elementId));
}

/**
 * Hook to check if can paste
 */
export function useCanPaste(targetParent: any) {
  return useClipboardStore((state) => state.canPaste(targetParent));
}
