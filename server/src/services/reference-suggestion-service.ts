/**
 * Reference Suggestion Service
 * 
 * Provides fast lookup and search for AAS elements to support
 * reference autocomplete in the UI.
 */

import type { Environment, AssetAdministrationShell, Submodel, SubmodelElement, ConceptDescription, Key, Reference } from '../../../shared/aas-v3-types';
import { KeyTypes, AasSubmodelElements } from '../../../shared/aas-v3-types';

/**
 * Map a submodel element's modelType (AasSubmodelElements) to the
 * corresponding KeyTypes member used in Reference/Key paths. The two enums
 * share the same string values for overlapping members, but are distinct
 * nominal types, so a direct cast is not safe - use this explicit table.
 */
const SUBMODEL_ELEMENT_TO_KEY_TYPE: Record<AasSubmodelElements, KeyTypes> = {
  [AasSubmodelElements.AnnotatedRelationshipElement]: KeyTypes.AnnotatedRelationshipElement,
  [AasSubmodelElements.BasicEventElement]: KeyTypes.BasicEventElement,
  [AasSubmodelElements.Blob]: KeyTypes.Blob,
  [AasSubmodelElements.Capability]: KeyTypes.Capability,
  [AasSubmodelElements.DataElement]: KeyTypes.DataElement,
  [AasSubmodelElements.Entity]: KeyTypes.Entity,
  [AasSubmodelElements.EventElement]: KeyTypes.EventElement,
  [AasSubmodelElements.File]: KeyTypes.File,
  [AasSubmodelElements.MultiLanguageProperty]: KeyTypes.MultiLanguageProperty,
  [AasSubmodelElements.Operation]: KeyTypes.Operation,
  [AasSubmodelElements.Property]: KeyTypes.Property,
  [AasSubmodelElements.Range]: KeyTypes.Range,
  [AasSubmodelElements.ReferenceElement]: KeyTypes.ReferenceElement,
  [AasSubmodelElements.RelationshipElement]: KeyTypes.RelationshipElement,
  [AasSubmodelElements.SubmodelElement]: KeyTypes.SubmodelElement,
  [AasSubmodelElements.SubmodelElementList]: KeyTypes.SubmodelElementList,
  [AasSubmodelElements.SubmodelElementCollection]: KeyTypes.SubmodelElementCollection,
};

function toKeyType(modelType: AasSubmodelElements): KeyTypes {
  return SUBMODEL_ELEMENT_TO_KEY_TYPE[modelType];
}

export interface ReferenceSuggestion {
  id: string;
  idShort: string;
  type: KeyTypes;
  path: Key[];
  semanticId?: Reference;
  displayName: string;
  parentPath?: string;
}

export interface SearchOptions {
  query?: string;
  filterType?: KeyTypes;
  maxResults?: number;
}

export class ReferenceSuggestionService {
  private indexCache: Map<string, ReferenceSuggestion[]> = new Map();
  private lastIndexTime: number = 0;
  private readonly CACHE_TTL = 60000; // 1 minute

  /**
   * Search for elements in the environment
   */
  async searchElements(
    environment: Environment,
    options: SearchOptions = {}
  ): Promise<ReferenceSuggestion[]> {
    const { query, filterType, maxResults = 100 } = options;

    // Get all suggestions
    const allSuggestions = await this.indexEnvironment(environment);

    // Filter by type if specified
    let filtered = filterType
      ? allSuggestions.filter((s) => s.type === filterType)
      : allSuggestions;

    // Filter by query if specified
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.idShort.toLowerCase().includes(lowerQuery) ||
          s.id.toLowerCase().includes(lowerQuery) ||
          s.displayName.toLowerCase().includes(lowerQuery)
      );
    }

    // Limit results
    return filtered.slice(0, maxResults);
  }

  /**
   * Get suggestions by semantic ID
   */
  async getSuggestionsBySemanticId(
    environment: Environment,
    semanticId: Reference
  ): Promise<ReferenceSuggestion[]> {
    const allSuggestions = await this.indexEnvironment(environment);

    return allSuggestions.filter((s) => {
      if (!s.semanticId) return false;
      return this.referencesMatch(s.semanticId, semanticId);
    });
  }

  /**
   * Get suggestion by ID
   */
  async getSuggestionById(
    environment: Environment,
    id: string
  ): Promise<ReferenceSuggestion | null> {
    const allSuggestions = await this.indexEnvironment(environment);
    return allSuggestions.find((s) => s.id === id) || null;
  }

  /**
   * Index environment for fast lookup
   */
  private async indexEnvironment(
    environment: Environment
  ): Promise<ReferenceSuggestion[]> {
    const envKey = this.getEnvironmentKey(environment);

    // Check cache
    const now = Date.now();
    if (
      this.indexCache.has(envKey) &&
      now - this.lastIndexTime < this.CACHE_TTL
    ) {
      return this.indexCache.get(envKey)!;
    }

    // Build index
    const suggestions: ReferenceSuggestion[] = [];

    // Index shells
    if (environment.assetAdministrationShells) {
      for (const shell of environment.assetAdministrationShells) {
        suggestions.push(this.createShellSuggestion(shell));
      }
    }

    // Index submodels
    if (environment.submodels) {
      for (const submodel of environment.submodels) {
        suggestions.push(this.createSubmodelSuggestion(submodel));

        // Index submodel elements
        if (submodel.submodelElements) {
          this.indexSubmodelElements(
            submodel.submodelElements,
            [{ type: KeyTypes.Submodel, value: submodel.id }],
            suggestions
          );
        }
      }
    }

    // Index concept descriptions
    if (environment.conceptDescriptions) {
      for (const cd of environment.conceptDescriptions) {
        suggestions.push(this.createConceptDescriptionSuggestion(cd));
      }
    }

    // Cache results
    this.indexCache.set(envKey, suggestions);
    this.lastIndexTime = now;

    return suggestions;
  }

  /**
   * Index submodel elements recursively
   */
  private indexSubmodelElements(
    elements: SubmodelElement[],
    parentPath: Key[],
    suggestions: ReferenceSuggestion[]
  ): void {
    for (const element of elements) {
      const idShort = element.idShort ?? '';
      const keyType = toKeyType(element.modelType);
      const elementPath: Key[] = [
        ...parentPath,
        { type: keyType, value: idShort },
      ];

      suggestions.push({
        id: idShort,
        idShort,
        type: keyType,
        path: elementPath,
        semanticId: element.semanticId,
        displayName: `${idShort} (${element.modelType})`,
        parentPath: parentPath.map((k) => k.value).join(' / '),
      });

      // Recursively index children
      if ('value' in element && Array.isArray(element.value)) {
        this.indexSubmodelElements(element.value as SubmodelElement[], elementPath, suggestions);
      }
      if ('submodelElements' in element && Array.isArray(element.submodelElements)) {
        this.indexSubmodelElements(element.submodelElements, elementPath, suggestions);
      }
    }
  }

  /**
   * Create shell suggestion
   */
  private createShellSuggestion(
    shell: AssetAdministrationShell
  ): ReferenceSuggestion {
    return {
      id: shell.id,
      idShort: shell.idShort || shell.id,
      type: KeyTypes.AssetAdministrationShell,
      path: [{ type: KeyTypes.AssetAdministrationShell, value: shell.id }],
      // Note: AssetAdministrationShell does not implement HasSemantics in the
      // AAS V3 spec, so there is no semanticId to carry over here.
      displayName: `${shell.idShort || shell.id} (Shell)`,
    };
  }

  /**
   * Create submodel suggestion
   */
  private createSubmodelSuggestion(submodel: Submodel): ReferenceSuggestion {
    return {
      id: submodel.id,
      idShort: submodel.idShort || submodel.id,
      type: KeyTypes.Submodel,
      path: [{ type: KeyTypes.Submodel, value: submodel.id }],
      semanticId: submodel.semanticId,
      displayName: `${submodel.idShort || submodel.id} (Submodel)`,
    };
  }

  /**
   * Create concept description suggestion
   */
  private createConceptDescriptionSuggestion(
    cd: ConceptDescription
  ): ReferenceSuggestion {
    return {
      id: cd.id,
      idShort: cd.idShort || cd.id,
      type: KeyTypes.ConceptDescription,
      path: [{ type: KeyTypes.ConceptDescription, value: cd.id }],
      displayName: `${cd.idShort || cd.id} (ConceptDescription)`,
    };
  }

  /**
   * Check if two references match
   */
  private referencesMatch(ref1: Reference, ref2: Reference): boolean {
    if (ref1.type !== ref2.type) return false;
    if (ref1.keys.length !== ref2.keys.length) return false;

    return ref1.keys.every((key, index) => {
      const key2 = ref2.keys[index];
      return key.type === key2.type && key.value === key2.value;
    });
  }

  /**
   * Generate cache key for environment
   */
  private getEnvironmentKey(environment: Environment): string {
    // Simple hash based on counts
    const shellCount = environment.assetAdministrationShells?.length || 0;
    const submodelCount = environment.submodels?.length || 0;
    const cdCount = environment.conceptDescriptions?.length || 0;
    return `env_${shellCount}_${submodelCount}_${cdCount}`;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.indexCache.clear();
    this.lastIndexTime = 0;
  }
}

// Singleton instance
export const referenceSuggestionService = new ReferenceSuggestionService();
