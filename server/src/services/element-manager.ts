/**
 * ElementManager Service
 * 
 * Handles adding, removing, and reordering elements in AAS Environment.
 * Provides transaction-safe operations with validation and audit logging.
 * 
 * @module ElementManager
 */

import type {
  Environment,
  Submodel,
  SubmodelElement,
  SubmodelElementCollection,
  SubmodelElementList,
  AnnotatedRelationshipElement,
  Entity,
} from '../../../shared/aas-v3-types';
import { ElementFinder, type ElementPath, NotFoundError } from './element-finder';
import { AtomicFileWriter, FileLockManager } from './atomic-file-writer';
import { AuditLogService } from './audit-log';
import { validateEnvironmentAdvanced } from '../../../shared/aas-validation-engine';
import fs from 'fs/promises';
import path from 'path';

export interface AddElementResult {
  readonly success: boolean;
  readonly element: SubmodelElement;
  readonly index: number;
  readonly version: number;
  readonly timestamp: string;
}

export interface RemoveElementResult {
  readonly success: boolean;
  readonly removedElement: SubmodelElement;
  readonly version: number;
  readonly timestamp: string;
}

export interface ReorderResult {
  readonly success: boolean;
  readonly newOrder: string[];
  readonly version: number;
  readonly timestamp: string;
}

export class ValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super(`Validation failed: ${errors.join(', ')}`);
    this.name = 'ValidationError';
  }
}

export class ElementManager {
  private readonly dataDir: string;
  private readonly backupDir: string;
  private readonly auditLog: AuditLogService;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data', 'aasx');
    this.backupDir = path.join(process.cwd(), 'data', 'aasx-backups');
    this.auditLog = new AuditLogService();
  }

  /**
   * Add a new element to a container (Submodel or Collection)
   */
  async addElement(
    fileId: string,
    parentPath: ElementPath[],
    newElement: SubmodelElement,
    position?: number,
    userId: string = 'anonymous'
  ): Promise<AddElementResult> {
    return FileLockManager.withLock(this.getFilePath(fileId), async () => {
      // 1. Load environment
      const environment = await this.loadEnvironment(fileId);

      // 2. Find parent container
      const parent = this.findParentContainer(environment, parentPath);

      // 3. Get elements array
      const elements = this.getElementsArray(parent);

      // 4. Validate new element doesn't have duplicate idShort
      if (newElement.idShort) {
        const duplicate = elements.find(e => e.idShort === newElement.idShort);
        if (duplicate) {
          throw new ValidationError([
            `Element with idShort "${newElement.idShort}" already exists in parent`
          ]);
        }
      }

      // 5. Create backup
      await this.createBackup(fileId);

      // 6. Determine insertion position
      const insertIndex = position !== undefined 
        ? Math.min(position, elements.length)
        : elements.length;

      // 7. Insert element
      elements.splice(insertIndex, 0, newElement);

      // 8. Validate entire environment
      const envValidation = validateEnvironmentAdvanced(environment);
      if (!envValidation.isValid) {
        // Rollback
        elements.splice(insertIndex, 1);
        throw new ValidationError(envValidation.errors.map((e: any) => e.message));
      }

      // 9. Save atomically
      const version = await this.saveEnvironment(fileId, environment);

      // 10. Log change
      await this.auditLog.logEdit({
        userId,
        action: 'create',
        resourceType: 'property',
        resourceId: newElement.idShort || 'unknown',
        changes: [
          {
            field: 'element',
            oldValue: null,
            newValue: newElement.idShort,
          },
        ],
        metadata: {
          fileId,
          parentPath: parentPath.map(p => `${p.type}/${p.id}`).join('/'),
          position: insertIndex,
          modelType: newElement.modelType,
        },
      });

      return {
        success: true,
        element: newElement,
        index: insertIndex,
        version,
        timestamp: new Date().toISOString(),
      };
    });
  }

  /**
   * Remove an element from its parent container
   */
  async removeElement(
    fileId: string,
    elementPath: ElementPath[],
    userId: string = 'anonymous'
  ): Promise<RemoveElementResult> {
    return FileLockManager.withLock(this.getFilePath(fileId), async () => {
      // 1. Load environment
      const environment = await this.loadEnvironment(fileId);

      // 2. Find element and its parent
      const findResult = ElementFinder.findByPath<SubmodelElement>(
        environment,
        elementPath
      );
      const element = findResult.element;

      // 3. Find parent container
      const parentPath = elementPath.slice(0, -1);
      const parent = parentPath.length > 0
        ? this.findParentContainer(environment, parentPath)
        : this.findSubmodelForElement(environment, elementPath);

      // 4. Get elements array
      const elements = this.getElementsArray(parent);

      // 5. Find element index
      const elementIndex = elements.findIndex(e => e === element);
      if (elementIndex === -1) {
        throw new NotFoundError(elementPath, elementPath.length - 1);
      }

      // 6. Create backup
      await this.createBackup(fileId);

      // 7. Remove element
      const [removedElement] = elements.splice(elementIndex, 1);

      // 8. Validate entire environment
      const envValidation = validateEnvironmentAdvanced(environment);
      if (!envValidation.isValid) {
        // Rollback
        elements.splice(elementIndex, 0, removedElement);
        throw new ValidationError(envValidation.errors.map((e: any) => e.message));
      }

      // 9. Save atomically
      const version = await this.saveEnvironment(fileId, environment);

      // 10. Log change
      await this.auditLog.logEdit({
        userId,
        action: 'delete',
        resourceType: 'property',
        resourceId: removedElement.idShort || 'unknown',
        changes: [
          {
            field: 'element',
            oldValue: removedElement.idShort,
            newValue: null,
          },
        ],
        metadata: {
          fileId,
          elementPath: elementPath.map(p => `${p.type}/${p.id}`).join('/'),
          modelType: removedElement.modelType,
        },
      });

      return {
        success: true,
        removedElement,
        version,
        timestamp: new Date().toISOString(),
      };
    });
  }

  /**
   * Reorder elements within a container
   */
  async reorderElements(
    fileId: string,
    parentPath: ElementPath[],
    newOrder: string[],
    userId: string = 'anonymous'
  ): Promise<ReorderResult> {
    return FileLockManager.withLock(this.getFilePath(fileId), async () => {
      // 1. Load environment
      const environment = await this.loadEnvironment(fileId);

      // 2. Find parent container
      const parent = this.findParentContainer(environment, parentPath);

      // 3. Get elements array
      const elements = this.getElementsArray(parent);

      // 4. Validate newOrder contains all current idShorts
      const currentIdShorts = elements
        .map(e => e.idShort)
        .filter(Boolean) as string[];
      
      if (newOrder.length !== currentIdShorts.length) {
        throw new ValidationError([
          `New order must contain exactly ${currentIdShorts.length} elements`
        ]);
      }

      const missingIds = currentIdShorts.filter(id => !newOrder.includes(id));
      if (missingIds.length > 0) {
        throw new ValidationError([
          `Missing idShorts in new order: ${missingIds.join(', ')}`
        ]);
      }

      const extraIds = newOrder.filter(id => !currentIdShorts.includes(id));
      if (extraIds.length > 0) {
        throw new ValidationError([
          `Unknown idShorts in new order: ${extraIds.join(', ')}`
        ]);
      }

      // 5. Create backup
      await this.createBackup(fileId);

      // 6. Store old order for rollback
      const oldElements = [...elements];

      // 7. Reorder elements
      const reorderedElements: SubmodelElement[] = [];
      for (const idShort of newOrder) {
        const element = elements.find(e => e.idShort === idShort);
        if (element) {
          reorderedElements.push(element);
        }
      }

      // 8. Replace elements array
      elements.length = 0;
      elements.push(...reorderedElements);

      // 9. Validate entire environment
      const envValidation = validateEnvironmentAdvanced(environment);
      if (!envValidation.isValid) {
        // Rollback
        elements.length = 0;
        elements.push(...oldElements);
        throw new ValidationError(envValidation.errors.map((e: any) => e.message));
      }

      // 10. Save atomically
      const version = await this.saveEnvironment(fileId, environment);

      // 11. Log change
      await this.auditLog.logEdit({
        userId,
        action: 'update',
        resourceType: 'property',
        resourceId: 'collection',
        changes: [
          {
            field: 'order',
            oldValue: currentIdShorts,
            newValue: newOrder,
          },
        ],
        metadata: {
          fileId,
          parentPath: parentPath.map(p => `${p.type}/${p.id}`).join('/'),
        },
      });

      return {
        success: true,
        newOrder,
        version,
        timestamp: new Date().toISOString(),
      };
    });
  }

  /**
   * Find parent container (Submodel or Collection)
   */
  private findParentContainer(
    environment: Environment,
    parentPath: ElementPath[]
  ): Submodel | SubmodelElementCollection | SubmodelElementList | AnnotatedRelationshipElement | Entity {
    if (parentPath.length === 0) {
      throw new Error('Parent path cannot be empty');
    }

    const lastSegment = parentPath[parentPath.length - 1];
    
    if (lastSegment.type === 'submodel') {
      // Parent is a submodel
      const submodel = environment.submodels?.find(sm => sm.id === lastSegment.id);
      if (!submodel) {
        throw new NotFoundError(parentPath, parentPath.length - 1);
      }
      return submodel;
    } else {
      // Parent is an element (must be a container type)
      const findResult = ElementFinder.findByPath(environment, parentPath);
      const element = findResult.element;

      if (!this.isContainer(element)) {
        throw new Error(
          `Element at path is not a container: ${element.modelType}`
        );
      }

      return element as SubmodelElementCollection | SubmodelElementList | AnnotatedRelationshipElement | Entity;
    }
  }

  /**
   * Find submodel that contains the element
   */
  private findSubmodelForElement(
    environment: Environment,
    elementPath: ElementPath[]
  ): Submodel {
    // Find the submodel segment in the path
    const submodelSegment = elementPath.find(seg => seg.type === 'submodel');
    if (!submodelSegment) {
      throw new Error('Element path must contain a submodel');
    }

    const submodel = environment.submodels?.find(sm => sm.id === submodelSegment.id);
    if (!submodel) {
      throw new NotFoundError(elementPath, 0);
    }

    return submodel;
  }

  /**
   * Get elements array from container
   */
  private getElementsArray(
    container: Submodel | SubmodelElementCollection | SubmodelElementList | AnnotatedRelationshipElement | Entity
  ): SubmodelElement[] {
    if ('submodelElements' in container) {
      // Submodel
      if (!container.submodelElements) {
        container.submodelElements = [];
      }
      return container.submodelElements;
    } else if ('value' in container && Array.isArray(container.value)) {
      // Collection or List
      return container.value;
    } else if ('annotations' in container) {
      // AnnotatedRelationshipElement
      if (!container.annotations) {
        container.annotations = [];
      }
      return container.annotations;
    } else if ('statements' in container) {
      // Entity
      if (!container.statements) {
        container.statements = [];
      }
      return container.statements;
    }

    throw new Error(`Container type not supported: ${(container as any).modelType}`);
  }

  /**
   * Check if element is a container
   */
  private isContainer(element: any): boolean {
    return (
      element.modelType === 'SubmodelElementCollection' ||
      element.modelType === 'SubmodelElementList' ||
      element.modelType === 'AnnotatedRelationshipElement' ||
      element.modelType === 'Entity'
    );
  }

  /**
   * Load environment from file
   */
  private async loadEnvironment(fileId: string): Promise<Environment> {
    const filePath = this.getFilePath(fileId);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as Environment;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`File not found: ${fileId}`);
      }
      throw error;
    }
  }

  /**
   * Save environment to file atomically
   */
  private async saveEnvironment(
    fileId: string,
    environment: Environment
  ): Promise<number> {
    const filePath = this.getFilePath(fileId);
    const json = JSON.stringify(environment, null, 2);

    await AtomicFileWriter.writeFile(filePath, json);

    // Return version (file modification time)
    const stats = await fs.stat(filePath);
    return stats.mtimeMs;
  }

  /**
   * Create backup of current file
   */
  private async createBackup(fileId: string): Promise<void> {
    const filePath = this.getFilePath(fileId);
    const backupPath = this.getBackupPath(fileId);

    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      await fs.copyFile(filePath, backupPath);
    } catch (error) {
      // If file doesn't exist yet, no backup needed
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Get file path for environment
   */
  private getFilePath(fileId: string): string {
    return path.join(this.dataDir, `${fileId}-environment.json`);
  }

  /**
   * Get backup path with timestamp
   */
  private getBackupPath(fileId: string): string {
    const timestamp = Date.now();
    return path.join(this.backupDir, `${fileId}-${timestamp}.json`);
  }

  /**
   * Delete an Asset Administration Shell
   */
  async deleteShell(
    fileId: string,
    shellId: string,
    userId: string = 'anonymous'
  ): Promise<void> {
    return FileLockManager.withLock(this.getFilePath(fileId), async () => {
      // 1. Load environment
      const environment = await this.loadEnvironment(fileId);

      // 2. Find shell
      const shellIndex = environment.assetAdministrationShells?.findIndex(
        s => s.id === shellId
      );

      if (shellIndex === undefined || shellIndex === -1) {
        throw new NotFoundError(`Shell with id "${shellId}" not found`);
      }

      // 3. Create backup
      await this.createBackup(fileId);

      // 4. Remove shell
      const removedShell = environment.assetAdministrationShells![shellIndex];
      environment.assetAdministrationShells!.splice(shellIndex, 1);

      // 5. Save environment
      const version = await this.saveEnvironment(fileId, environment);

      // 6. Audit log
      await this.auditLog.logEdit({
        userId,
        action: 'delete',
        resourceType: 'shell',
        resourceId: shellId,
        changes: [
          {
            field: 'shell',
            oldValue: removedShell.idShort,
            newValue: null,
          },
        ],
        metadata: {
          fileId,
          version,
        },
      });
    });
  }

  /**
   * Delete a Submodel
   */
  async deleteSubmodel(
    fileId: string,
    submodelId: string,
    userId: string = 'anonymous'
  ): Promise<void> {
    return FileLockManager.withLock(this.getFilePath(fileId), async () => {
      // 1. Load environment
      const environment = await this.loadEnvironment(fileId);

      // 2. Find submodel
      const submodelIndex = environment.submodels?.findIndex(
        sm => sm.id === submodelId
      );

      if (submodelIndex === undefined || submodelIndex === -1) {
        throw new NotFoundError(`Submodel with id "${submodelId}" not found`);
      }

      // 3. Remove submodel references from shells
      if (environment.assetAdministrationShells) {
        for (const shell of environment.assetAdministrationShells) {
          if (shell.submodels) {
            shell.submodels = shell.submodels.filter(ref => {
              const refId = ref.keys?.[0]?.value;
              return refId !== submodelId;
            });
          }
        }
      }

      // 4. Create backup
      await this.createBackup(fileId);

      // 5. Remove submodel
      const removedSubmodel = environment.submodels![submodelIndex];
      environment.submodels!.splice(submodelIndex, 1);

      // 6. Save environment
      const version = await this.saveEnvironment(fileId, environment);

      // 7. Audit log
      await this.auditLog.logEdit({
        userId,
        action: 'delete',
        resourceType: 'submodel',
        resourceId: submodelId,
        changes: [
          {
            field: 'submodel',
            oldValue: removedSubmodel.idShort,
            newValue: null,
          },
        ],
        metadata: {
          fileId,
          version,
        },
      });
    });
  }

  /**
   * Find dependencies for a shell
   */
  async findShellDependencies(
    fileId: string,
    shellId: string
  ): Promise<Array<{ type: string; count: number; ids: string[] }>> {
    const environment = await this.loadEnvironment(fileId);
    const dependencies: Array<{ type: string; count: number; ids: string[] }> = [];

    // Find shell
    const shell = environment.assetAdministrationShells?.find(s => s.id === shellId);
    if (!shell) {
      return dependencies;
    }

    // Check submodel references
    if (shell.submodels && shell.submodels.length > 0) {
      const submodelIds = shell.submodels
        .map(ref => ref.keys?.[0]?.value)
        .filter(Boolean) as string[];

      dependencies.push({
        type: 'submodel-references',
        count: submodelIds.length,
        ids: submodelIds,
      });
    }

    return dependencies;
  }

  /**
   * Find references to a submodel
   */
  async findSubmodelReferences(
    fileId: string,
    submodelId: string
  ): Promise<Array<{ shellId: string; shellIdShort: string }>> {
    const environment = await this.loadEnvironment(fileId);
    const references: Array<{ shellId: string; shellIdShort: string }> = [];

    if (environment.assetAdministrationShells) {
      for (const shell of environment.assetAdministrationShells) {
        if (shell.submodels) {
          const hasReference = shell.submodels.some(ref => {
            const refId = ref.keys?.[0]?.value;
            return refId === submodelId;
          });

          if (hasReference) {
            references.push({
              shellId: shell.id,
              shellIdShort: shell.idShort || shell.id,
            });
          }
        }
      }
    }

    return references;
  }
}

export const elementManager = new ElementManager();
