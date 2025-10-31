/**
 * Update Service
 * Handles property and element updates with validation, backup, and atomic saves
 */

import fs from 'fs/promises';
import path from 'path';
import type {
  Environment,
  SubmodelElement,
  Property,
  MultiLanguageProperty,
  LangStringTextType,
} from '../../../shared/aas-v3-types';
import { ElementFinder, type ElementPath, NotFoundError } from './element-finder';
import { AtomicFileWriter, FileLockManager } from './atomic-file-writer';
import { AuditLogService } from './audit-log';
import { validateEnvironmentAdvanced, validationEngine } from '../../../shared/aas-validation-engine';

export interface UpdateResult {
  readonly success: boolean;
  readonly element: SubmodelElement;
  readonly version: number;
  readonly timestamp: string;
}

export class ValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super(`Validation failed: ${errors.join(', ')}`);
    this.name = 'ValidationError';
  }
}

export class UpdateService {
  private readonly dataDir: string;
  private readonly backupDir: string;
  private readonly auditLog: AuditLogService;

  constructor(
    dataDir: string = './data/aasx',
    backupDir: string = './data/aasx-backups',
    auditLog?: AuditLogService
  ) {
    this.dataDir = dataDir;
    this.backupDir = backupDir;
    this.auditLog = auditLog || new AuditLogService();
  }

  /**
   * Update a property value
   */
  async updatePropertyValue(
    fileId: string,
    elementPath: ElementPath[],
    value: any,
    userId: string = 'anonymous'
  ): Promise<UpdateResult> {
    return FileLockManager.withLock(this.getFilePath(fileId), async () => {
      // 1. Load environment
      const environment = await this.loadEnvironment(fileId);

      // 2. Find element
      const findResult = ElementFinder.findByPath<SubmodelElement>(
        environment,
        elementPath
      );
      const element = findResult.element;

      // 3. Validate element type
      if (element.modelType !== 'Property' && element.modelType !== 'MultiLanguageProperty') {
        throw new Error(`Element is not a property: ${element.modelType}`);
      }

      // 4. Store old value for audit
      const oldValue = (element as any).value;

      // 5. Validate new value
      const validationErrors = this.validateValue(element, value);
      if (validationErrors.length > 0) {
        throw new ValidationError(validationErrors);
      }

      // 6. Create backup
      await this.createBackup(fileId);

      // 7. Apply change
      (element as any).value = value;

      // 8. Validate entire environment
      const envValidation = validateEnvironmentAdvanced(environment);
      if (!envValidation.isValid) {
        // Rollback
        (element as any).value = oldValue;
        throw new ValidationError(envValidation.errors.map((e: any) => e.message));
      }

      // 9. Save atomically
      const version = await this.saveEnvironment(fileId, environment);

      // 10. Log change
      await this.auditLog.logEdit({
        userId,
        action: 'update',
        resourceType: 'property',
        resourceId: element.idShort || 'unknown',
        changes: [
          {
            field: 'value',
            oldValue,
            newValue: value,
          },
        ],
        metadata: {
          fileId,
          elementPath: elementPath.map((p) => `${p.type}/${p.id}`).join('/'),
          modelType: element.modelType,
        },
      });

      return {
        success: true,
        element,
        version,
        timestamp: new Date().toISOString(),
      };
    });
  }

  /**
   * Update multiple properties of an element
   */
  async updateElement(
    fileId: string,
    elementPath: ElementPath[],
    updates: Partial<SubmodelElement>,
    userId: string = 'anonymous'
  ): Promise<UpdateResult> {
    return FileLockManager.withLock(this.getFilePath(fileId), async () => {
      // 1. Load environment
      const environment = await this.loadEnvironment(fileId);

      // 2. Find element
      const findResult = ElementFinder.findByPath<SubmodelElement>(
        environment,
        elementPath
      );
      const element = findResult.element;

      // 3. Store old values for audit and rollback
      const oldValues: Record<string, any> = {};
      const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

      // 4. Create backup
      await this.createBackup(fileId);

      // 5. Apply updates
      for (const [key, value] of Object.entries(updates)) {
        if (key in element) {
          oldValues[key] = (element as any)[key];
          (element as any)[key] = value;
          changes.push({
            field: key,
            oldValue: oldValues[key],
            newValue: value,
          });
        }
      }

      // 6. Validate entire environment
      const envValidation = validateEnvironmentAdvanced(environment);
      if (!envValidation.isValid) {
        // Rollback all changes
        for (const [key, value] of Object.entries(oldValues)) {
          (element as any)[key] = value;
        }
        throw new ValidationError(envValidation.errors.map((e: any) => e.message));
      }

      // 7. Save atomically
      const version = await this.saveEnvironment(fileId, environment);

      // 8. Log changes
      await this.auditLog.logEdit({
        userId,
        action: 'update',
        resourceType: 'property',
        resourceId: element.idShort || 'unknown',
        changes,
        metadata: {
          fileId,
          elementPath: elementPath.map((p) => `${p.type}/${p.id}`).join('/'),
          modelType: element.modelType,
        },
      });

      return {
        success: true,
        element,
        version,
        timestamp: new Date().toISOString(),
      };
    });
  }

  /**
   * Update multi-language property
   */
  async updateMultiLanguageProperty(
    fileId: string,
    elementPath: ElementPath[],
    langStrings: LangStringTextType[],
    userId: string = 'anonymous'
  ): Promise<UpdateResult> {
    return this.updatePropertyValue(fileId, elementPath, langStrings, userId);
  }

  /**
   * Validate property value based on element type
   */
  private validateValue(element: SubmodelElement, value: any): string[] {
    const errors: string[] = [];

    if (element.modelType === 'Property') {
      const property = element as Property;
      
      // Validate based on value type
      if (property.valueType) {
        const typeErrors = this.validateValueType(property.valueType, value);
        errors.push(...typeErrors);
      }
    } else if (element.modelType === 'MultiLanguageProperty') {
      // Validate multi-language property
      if (!Array.isArray(value)) {
        errors.push('MultiLanguageProperty value must be an array');
      } else {
        for (const langString of value) {
          if (!langString.language || typeof langString.language !== 'string') {
            errors.push('Each language string must have a language code');
          }
          if (!langString.text || typeof langString.text !== 'string') {
            errors.push('Each language string must have text');
          }
        }

        // Check for duplicate languages
        const languages = value.map((ls: any) => ls.language);
        const uniqueLanguages = new Set(languages);
        if (languages.length !== uniqueLanguages.size) {
          errors.push('Duplicate language codes are not allowed');
        }
      }
    }

    return errors;
  }

  /**
   * Validate value based on XSD type
   */
  private validateValueType(valueType: string, value: any): string[] {
    const errors: string[] = [];

    // Allow empty values
    if (value === null || value === undefined || value === '') {
      return errors;
    }

    switch (valueType) {
      case 'xs:boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          errors.push('Value must be a boolean');
        }
        break;

      case 'xs:int':
      case 'xs:integer':
      case 'xs:long':
      case 'xs:short':
      case 'xs:byte':
      case 'xs:unsignedInt':
      case 'xs:unsignedLong':
      case 'xs:unsignedShort':
      case 'xs:unsignedByte':
        if (isNaN(Number(value)) || !Number.isInteger(Number(value))) {
          errors.push(`Value must be an integer for type ${valueType}`);
        }
        break;

      case 'xs:double':
      case 'xs:float':
      case 'xs:decimal':
        if (isNaN(Number(value))) {
          errors.push(`Value must be a number for type ${valueType}`);
        }
        break;

      case 'xs:date':
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
          errors.push('Value must be a valid date (YYYY-MM-DD)');
        }
        break;

      case 'xs:dateTime':
        if (isNaN(Date.parse(String(value)))) {
          errors.push('Value must be a valid date-time');
        }
        break;

      case 'xs:time':
        if (!/^\d{2}:\d{2}:\d{2}$/.test(String(value))) {
          errors.push('Value must be a valid time (HH:MM:SS)');
        }
        break;

      case 'xs:string':
      default:
        // String types are always valid
        break;
    }

    return errors;
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
      throw new Error(`Failed to load file: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    
    // Serialize to JSON
    const json = JSON.stringify(environment, null, 2);
    
    // Write atomically
    await AtomicFileWriter.writeFile(filePath, json);
    
    // Return version (timestamp-based)
    return Date.now();
  }

  /**
   * Create backup of file
   */
  private async createBackup(fileId: string): Promise<void> {
    const sourcePath = this.getFilePath(fileId);
    const backupPath = this.getBackupPath(fileId);

    try {
      // Ensure backup directory exists
      await fs.mkdir(this.backupDir, { recursive: true });
      
      // Copy file to backup
      await fs.copyFile(sourcePath, backupPath);
    } catch (error) {
      // If file doesn't exist, no backup needed
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(fileId: string): Promise<void> {
    const filePath = this.getFilePath(fileId);
    const backupPath = this.getBackupPath(fileId);

    try {
      await fs.copyFile(backupPath, filePath);
    } catch (error) {
      throw new Error(`Failed to restore from backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file path for AASX file
   */
  private getFilePath(fileId: string): string {
    return path.join(this.dataDir, `${fileId}-environment.json`);
  }

  /**
   * Get backup path for file
   */
  private getBackupPath(fileId: string): string {
    const timestamp = Date.now();
    return path.join(this.backupDir, `${fileId}-${timestamp}.json`);
  }

  /**
   * Clean old backups (keep last N backups)
   */
  async cleanOldBackups(fileId: string, keepCount: number = 10): Promise<void> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter((f) => f.startsWith(`${fileId}-`) && f.endsWith('.json'))
        .sort()
        .reverse();

      // Delete old backups
      for (let i = keepCount; i < backupFiles.length; i++) {
        const backupPath = path.join(this.backupDir, backupFiles[i]);
        await fs.unlink(backupPath);
      }
    } catch (error) {
      // Ignore errors in cleanup
    }
  }

  /**
   * Get file version (for optimistic locking)
   */
  async getFileVersion(fileId: string): Promise<number> {
    const filePath = this.getFilePath(fileId);
    
    try {
      const stats = await fs.stat(filePath);
      return stats.mtimeMs;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check if file has been modified since version
   */
  async hasConflict(fileId: string, expectedVersion: number): Promise<boolean> {
    const currentVersion = await this.getFileVersion(fileId);
    return currentVersion !== expectedVersion;
  }
}

// Singleton instance
export const updateService = new UpdateService();
