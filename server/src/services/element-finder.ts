/**
 * Element Finder Service
 * Navigates AAS Environment structure to find elements by path
 * 
 * Path Format: ['aas', 'aasId', 'submodel', 'submodelId', 'element', 'elementIdShort', ...]
 * Example: ['submodel', 'https://example.com/sm1', 'element', 'TechnicalData', 'element', 'Weight']
 */

import type {
  Environment,
  AssetAdministrationShell,
  Submodel,
  SubmodelElement,
  SubmodelElementCollection,
  SubmodelElementList,
  AnnotatedRelationshipElement,
  Entity,
} from '../../../shared/aas-v3-types';

export interface ElementPath {
  readonly type: 'aas' | 'submodel' | 'element' | 'conceptDescription';
  readonly id: string;
}

export interface FindResult<T = any> {
  readonly element: T;
  readonly parent: any | null;
  readonly path: ElementPath[];
}

export class NotFoundError extends Error {
  constructor(
    public readonly path: ElementPath[],
    public readonly failedAt: number
  ) {
    super(`Element not found at path: ${JSON.stringify(path)}`);
    this.name = 'NotFoundError';
  }
}

export class ElementFinder {
  /**
   * Find element by path array
   */
  static findByPath<T = SubmodelElement>(
    environment: Environment,
    path: ElementPath[]
  ): FindResult<T> {
    if (path.length === 0) {
      throw new Error('Path cannot be empty');
    }

    let current: any = environment;
    let parent: any = null;
    const traversedPath: ElementPath[] = [];

    for (let i = 0; i < path.length; i++) {
      const segment = path[i];
      traversedPath.push(segment);

      switch (segment.type) {
        case 'aas':
          parent = environment;
          current = this.findAAS(environment, segment.id);
          break;

        case 'submodel':
          parent = environment;
          current = this.findSubmodel(environment, segment.id);
          break;

        case 'element':
          if (!current) {
            throw new NotFoundError(path, i);
          }
          parent = current;
          current = this.findElement(current, segment.id);
          break;

        case 'conceptDescription':
          parent = environment;
          current = this.findConceptDescription(environment, segment.id);
          break;

        default:
          throw new Error(`Unknown path segment type: ${(segment as any).type}`);
      }

      if (!current) {
        throw new NotFoundError(path, i);
      }
    }

    return {
      element: current as T,
      parent,
      path: traversedPath,
    };
  }

  /**
   * Find element by simple string path (convenience method)
   * Format: "submodel/submodelId/element/elementId/element/nestedElementId"
   */
  static findByStringPath<T = SubmodelElement>(
    environment: Environment,
    stringPath: string
  ): FindResult<T> {
    const parts = stringPath.split('/').filter(Boolean);
    
    if (parts.length % 2 !== 0) {
      throw new Error('Invalid path format: must have type/id pairs');
    }

    const path: ElementPath[] = [];
    for (let i = 0; i < parts.length; i += 2) {
      const type = parts[i] as ElementPath['type'];
      const id = parts[i + 1];
      path.push({ type, id });
    }

    return this.findByPath<T>(environment, path);
  }

  /**
   * Find AssetAdministrationShell by ID
   */
  private static findAAS(
    environment: Environment,
    id: string
  ): AssetAdministrationShell | null {
    return environment.assetAdministrationShells?.find((aas) => aas.id === id) || null;
  }

  /**
   * Find Submodel by ID
   */
  private static findSubmodel(
    environment: Environment,
    id: string
  ): Submodel | null {
    return environment.submodels?.find((sm) => sm.id === id) || null;
  }

  /**
   * Find ConceptDescription by ID
   */
  private static findConceptDescription(
    environment: Environment,
    id: string
  ): any | null {
    return environment.conceptDescriptions?.find((cd) => cd.id === id) || null;
  }

  /**
   * Find SubmodelElement within a parent (Submodel or collection element)
   */
  private static findElement(
    parent: Submodel | SubmodelElement,
    idShort: string
  ): SubmodelElement | null {
    // Get elements array from parent
    const elements = this.getElementsFromParent(parent);
    
    if (!elements) {
      return null;
    }

    // Direct match
    const direct = elements.find((el) => el.idShort === idShort);
    if (direct) {
      return direct;
    }

    // Search in nested collections (depth-first)
    for (const element of elements) {
      if (this.canContainElements(element)) {
        const nested = this.findElement(element, idShort);
        if (nested) {
          return nested;
        }
      }
    }

    return null;
  }

  /**
   * Get elements array from parent
   */
  private static getElementsFromParent(
    parent: Submodel | SubmodelElement
  ): SubmodelElement[] | null {
    // Submodel
    if ('submodelElements' in parent) {
      return parent.submodelElements || null;
    }

    // From here on, parent must be a SubmodelElement - Submodel has no
    // modelType field, but TS can't narrow that away via the check above
    // alone (submodelElements is optional), so guard explicitly.
    if (!('modelType' in parent)) {
      return null;
    }

    // SubmodelElementCollection
    if (parent.modelType === 'SubmodelElementCollection') {
      return (parent as SubmodelElementCollection).value || null;
    }

    // SubmodelElementList
    if (parent.modelType === 'SubmodelElementList') {
      return (parent as SubmodelElementList).value || null;
    }

    // AnnotatedRelationshipElement
    if (parent.modelType === 'AnnotatedRelationshipElement') {
      return (parent as AnnotatedRelationshipElement).annotations || null;
    }

    // Entity
    if (parent.modelType === 'Entity') {
      return (parent as Entity).statements || null;
    }

    return null;
  }

  /**
   * Check if element can contain other elements
   */
  private static canContainElements(element: SubmodelElement): boolean {
    const containerTypes = [
      'SubmodelElementCollection',
      'SubmodelElementList',
      'AnnotatedRelationshipElement',
      'Entity',
    ];

    return containerTypes.includes(element.modelType);
  }

  /**
   * Get all elements in a flat list (for search/iteration)
   */
  static getAllElements(environment: Environment): SubmodelElement[] {
    const elements: SubmodelElement[] = [];

    environment.submodels?.forEach((submodel) => {
      if (submodel.submodelElements) {
        this.collectElementsRecursive(submodel.submodelElements, elements);
      }
    });

    return elements;
  }

  /**
   * Recursively collect all elements
   */
  private static collectElementsRecursive(
    elements: SubmodelElement[],
    collector: SubmodelElement[]
  ): void {
    for (const element of elements) {
      collector.push(element);

      if (this.canContainElements(element)) {
        const nested = this.getElementsFromParent(element);
        if (nested) {
          this.collectElementsRecursive(nested, collector);
        }
      }
    }
  }

  /**
   * Find parent of an element
   */
  static findParent(
    environment: Environment,
    elementPath: ElementPath[]
  ): FindResult<Submodel | SubmodelElement> | null {
    if (elementPath.length === 0) {
      return null;
    }

    // Parent path is all segments except the last
    const parentPath = elementPath.slice(0, -1);

    if (parentPath.length === 0) {
      // Element is at root level (in a submodel)
      const lastSegment = elementPath[elementPath.length - 1];
      if (lastSegment.type === 'element') {
        // Find which submodel contains this element
        for (const submodel of environment.submodels || []) {
          const found = submodel.submodelElements?.find(
            (el) => el.idShort === lastSegment.id
          );
          if (found) {
            return {
              element: submodel,
              parent: environment,
              path: [{ type: 'submodel', id: submodel.id }],
            };
          }
        }
      }
      return null;
    }

    try {
      return this.findByPath(environment, parentPath);
    } catch (error) {
      return null;
    }
  }

  /**
   * Build path to an element (reverse lookup)
   */
  static buildPath(
    environment: Environment,
    elementIdShort: string
  ): ElementPath[] | null {
    // Search in all submodels
    for (const submodel of environment.submodels || []) {
      const path = this.buildPathInSubmodel(submodel, elementIdShort);
      if (path) {
        return [{ type: 'submodel', id: submodel.id }, ...path];
      }
    }

    return null;
  }

  /**
   * Build path within a submodel
   */
  private static buildPathInSubmodel(
    submodel: Submodel,
    elementIdShort: string,
    currentPath: ElementPath[] = []
  ): ElementPath[] | null {
    const elements = submodel.submodelElements || [];

    for (const element of elements) {
      if (element.idShort === elementIdShort) {
        return [...currentPath, { type: 'element', id: element.idShort }];
      }

      if (this.canContainElements(element)) {
        const nested = this.getElementsFromParent(element);
        if (nested) {
          const nestedPath = this.buildPathInElements(
            nested,
            elementIdShort,
            [...currentPath, { type: 'element', id: element.idShort ?? '' }]
          );
          if (nestedPath) {
            return nestedPath;
          }
        }
      }
    }

    return null;
  }

  /**
   * Build path within elements array
   */
  private static buildPathInElements(
    elements: SubmodelElement[],
    elementIdShort: string,
    currentPath: ElementPath[]
  ): ElementPath[] | null {
    for (const element of elements) {
      if (element.idShort === elementIdShort) {
        return [...currentPath, { type: 'element', id: element.idShort }];
      }

      if (this.canContainElements(element)) {
        const nested = this.getElementsFromParent(element);
        if (nested) {
          const nestedPath = this.buildPathInElements(
            nested,
            elementIdShort,
            [...currentPath, { type: 'element', id: element.idShort ?? '' }]
          );
          if (nestedPath) {
            return nestedPath;
          }
        }
      }
    }

    return null;
  }
}
