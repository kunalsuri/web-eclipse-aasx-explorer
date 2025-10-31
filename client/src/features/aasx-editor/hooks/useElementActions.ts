/**
 * Element Actions Hook
 * 
 * Provides all CRUD operations for AAS elements used by context menus and keyboard shortcuts
 */

import { useCallback } from "react";
import type { SubmodelElement, Submodel, AssetAdministrationShell } from "@/../../shared/aas-v3-types";

export interface ElementClipboard {
  element: SubmodelElement | Submodel | AssetAdministrationShell;
  operation: "copy" | "cut";
  timestamp: number;
}

interface UseElementActionsOptions {
  onElementUpdate?: (element: any) => void;
  onElementDelete?: (elementPath: string) => void;
  onElementCreate?: (parent: any, element: any) => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function useElementActions(options: UseElementActionsOptions = {}) {
  const {
    onElementUpdate,
    onElementDelete,
    onElementCreate,
    onUndo,
    onRedo,
  } = options;

  /**
   * Copy element to clipboard
   */
  const copyElement = useCallback((element: any) => {
    const clipboard: ElementClipboard = {
      element: JSON.parse(JSON.stringify(element)), // Deep clone
      operation: "copy",
      timestamp: Date.now(),
    };
    
    // Store in localStorage for cross-component access
    localStorage.setItem("aasx-clipboard", JSON.stringify(clipboard));
    
    return clipboard;
  }, []);

  /**
   * Cut element to clipboard
   */
  const cutElement = useCallback((element: any, elementPath: string) => {
    const clipboard: ElementClipboard = {
      element: JSON.parse(JSON.stringify(element)),
      operation: "cut",
      timestamp: Date.now(),
    };
    
    localStorage.setItem("aasx-clipboard", JSON.stringify(clipboard));
    
    // Delete the element after cutting
    if (onElementDelete) {
      onElementDelete(elementPath);
    }
    
    return clipboard;
  }, [onElementDelete]);

  /**
   * Paste element from clipboard
   */
  const pasteElement = useCallback((parent: any) => {
    const clipboardData = localStorage.getItem("aasx-clipboard");
    if (!clipboardData) {
      return null;
    }

    try {
      const clipboard: ElementClipboard = JSON.parse(clipboardData);
      
      // Check if clipboard is recent (within last 5 minutes)
      const fiveMinutes = 5 * 60 * 1000;
      if (Date.now() - clipboard.timestamp > fiveMinutes) {
        localStorage.removeItem("aasx-clipboard");
        return null;
      }

      // Clone the element and update idShort to avoid duplicates
      const element = JSON.parse(JSON.stringify(clipboard.element));
      
      if (element.idShort) {
        element.idShort = generateUniqueIdShort(element.idShort, parent);
      }

      if (onElementCreate) {
        onElementCreate(parent, element);
      }

      // Clear clipboard if it was a cut operation
      if (clipboard.operation === "cut") {
        localStorage.removeItem("aasx-clipboard");
      }

      return element;
    } catch (error) {
      console.error("Failed to paste element:", error);
      return null;
    }
  }, [onElementCreate]);

  /**
   * Duplicate element
   */
  const duplicateElement = useCallback((element: any, parent: any) => {
    const duplicated = JSON.parse(JSON.stringify(element));
    
    if (duplicated.idShort) {
      duplicated.idShort = generateUniqueIdShort(duplicated.idShort, parent);
    }

    if (onElementCreate) {
      onElementCreate(parent, duplicated);
    }

    return duplicated;
  }, [onElementCreate]);

  /**
   * Delete element
   */
  const deleteElement = useCallback((elementPath: string) => {
    if (onElementDelete) {
      onElementDelete(elementPath);
    }
  }, [onElementDelete]);

  /**
   * Move element up in collection
   */
  const moveElementUp = useCallback((parent: any, elementIndex: number) => {
    if (elementIndex <= 0) {
      return false;
    }

    if (parent.submodelElements) {
      const elements = [...parent.submodelElements];
      [elements[elementIndex - 1], elements[elementIndex]] = 
        [elements[elementIndex], elements[elementIndex - 1]];
      
      if (onElementUpdate) {
        onElementUpdate({ ...parent, submodelElements: elements });
      }
      return true;
    }

    return false;
  }, [onElementUpdate]);

  /**
   * Move element down in collection
   */
  const moveElementDown = useCallback((parent: any, elementIndex: number) => {
    if (!parent.submodelElements || elementIndex >= parent.submodelElements.length - 1) {
      return false;
    }

    const elements = [...parent.submodelElements];
    [elements[elementIndex], elements[elementIndex + 1]] = 
      [elements[elementIndex + 1], elements[elementIndex]];
    
    if (onElementUpdate) {
      onElementUpdate({ ...parent, submodelElements: elements });
    }
    return true;
  }, [onElementUpdate]);

  /**
   * Add new element to collection
   */
  const addElement = useCallback((parent: any, elementType: string) => {
    const newElement = createDefaultElement(elementType);
    
    if (onElementCreate) {
      onElementCreate(parent, newElement);
    }

    return newElement;
  }, [onElementCreate]);

  /**
   * Edit element (triggers edit mode)
   */
  const editElement = useCallback((element: any) => {
    // This would typically open an edit dialog or inline editor
    // The actual implementation depends on the UI framework
    if (onElementUpdate) {
      // Trigger edit mode - implementation-specific
      console.log("Edit element:", element);
    }
  }, [onElementUpdate]);

  /**
   * Check if clipboard has content
   */
  const hasClipboardContent = useCallback(() => {
    const clipboardData = localStorage.getItem("aasx-clipboard");
    if (!clipboardData) {
      return false;
    }

    try {
      const clipboard: ElementClipboard = JSON.parse(clipboardData);
      const fiveMinutes = 5 * 60 * 1000;
      return Date.now() - clipboard.timestamp <= fiveMinutes;
    } catch {
      return false;
    }
  }, []);

  return {
    copyElement,
    cutElement,
    pasteElement,
    duplicateElement,
    deleteElement,
    moveElementUp,
    moveElementDown,
    addElement,
    editElement,
    hasClipboardContent,
    undo: onUndo,
    redo: onRedo,
  };
}

/**
 * Generate unique idShort by appending number
 */
function generateUniqueIdShort(baseIdShort: string, parent: any): string {
  if (!parent || !parent.submodelElements) {
    return baseIdShort;
  }

  const existingIdShorts = new Set(
    parent.submodelElements.map((e: any) => e.idShort).filter(Boolean)
  );

  if (!existingIdShorts.has(baseIdShort)) {
    return baseIdShort;
  }

  // Extract base name and number
  const match = baseIdShort.match(/^(.+?)(\d*)$/);
  const baseName = match ? match[1] : baseIdShort;
  const baseNum = match && match[2] ? parseInt(match[2], 10) : 1;

  // Find next available number
  let counter = baseNum + 1;
  while (existingIdShorts.has(`${baseName}${counter}`)) {
    counter++;
  }

  return `${baseName}${counter}`;
}

/**
 * Create default element based on type
 */
function createDefaultElement(elementType: string): any {
  const baseElement = {
    idShort: `New${elementType}`,
    modelType: elementType,
  };

  switch (elementType) {
    case "Property":
      return {
        ...baseElement,
        valueType: "xs:string",
        value: "",
      };
    case "MultiLanguageProperty":
      return {
        ...baseElement,
        value: [{ language: "en", text: "" }],
      };
    case "Range":
      return {
        ...baseElement,
        valueType: "xs:double",
        min: "0",
        max: "100",
      };
    case "ReferenceElement":
      return {
        ...baseElement,
        value: {
          type: "ModelReference",
          keys: [],
        },
      };
    case "SubmodelElementCollection":
      return {
        ...baseElement,
        value: [],
      };
    case "SubmodelElementList":
      return {
        ...baseElement,
        typeValueListElement: "Property",
        value: [],
      };
    case "File":
      return {
        ...baseElement,
        contentType: "application/octet-stream",
        value: "",
      };
    case "Blob":
      return {
        ...baseElement,
        contentType: "application/octet-stream",
        value: "",
      };
    default:
      return baseElement;
  }
}
