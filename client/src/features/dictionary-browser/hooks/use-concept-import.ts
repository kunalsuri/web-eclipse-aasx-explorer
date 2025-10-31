/**
 * useConceptImport Hook
 * Hook for importing dictionary concepts as ConceptDescriptions
 */

import { useState, useCallback } from 'react';
import type {
  DictionaryConcept,
  ValidationResult,
} from '../../../../../shared/dictionary-types';
import type { ConceptDescription } from '../../../../../shared/aas-v3-types';
import * as dictionaryApi from '../api/dictionary-api';

interface UseConceptImportReturn {
  // Import operations
  importConcept: (concept: DictionaryConcept) => Promise<ConceptDescription>;
  validateConcept: (concept: DictionaryConcept) => Promise<ValidationResult>;
  
  // State
  isImporting: boolean;
  importError: Error | null;
  validationResult: ValidationResult | null;
}

export function useConceptImport(): UseConceptImportReturn {
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<Error | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  /**
   * Import concept as ConceptDescription
   */
  const importConcept = useCallback(async (
    concept: DictionaryConcept
  ): Promise<ConceptDescription> => {
    setIsImporting(true);
    setImportError(null);
    
    try {
      // Validate first
      const validation = await dictionaryApi.validateConcept(concept);
      setValidationResult(validation);
      
      if (!validation.isValid) {
        const errorMessage = validation.errors.map(e => e.message).join(', ');
        throw new Error(`Validation failed: ${errorMessage}`);
      }
      
      // Import the concept
      const conceptDescription = await dictionaryApi.importConcept(concept);
      
      return conceptDescription;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Import failed');
      setImportError(error);
      throw error;
    } finally {
      setIsImporting(false);
    }
  }, []);

  /**
   * Validate concept without importing
   */
  const validateConcept = useCallback(async (
    concept: DictionaryConcept
  ): Promise<ValidationResult> => {
    try {
      const validation = await dictionaryApi.validateConcept(concept);
      setValidationResult(validation);
      return validation;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Validation failed');
      setImportError(error);
      throw error;
    }
  }, []);

  return {
    importConcept,
    validateConcept,
    isImporting,
    importError,
    validationResult,
  };
}
