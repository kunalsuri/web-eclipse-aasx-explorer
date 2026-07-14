/**
 * UpdateService - Comprehensive Test Suite
 * Tests property updates, validation, atomic saves, backups, and error handling
 * 
 * Testing Standards:
 * - 100% code coverage
 * - All edge cases covered
 * - Clear test descriptions
 * - AAA pattern (Arrange, Act, Assert)
 * - Type-safe assertions
 * - Strict validation of all error scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UpdateService, ValidationError } from '../../../../server/src/services/update-service';
import { NotFoundError } from '../../../../server/src/services/element-finder';
import fs from 'fs/promises';
import path from 'path';
import {
  AasSubmodelElements,
  DataTypeDefXsd,
  type Environment,
  type Submodel,
  type Property,
  type SubmodelElementCollection,
  type LangStringTextType,
} from '../../../../shared/aas-v3-types';

describe('UpdateService', () => {
  let updateService: UpdateService;
  let testEnvironment: Environment;
  let testSubmodel: Submodel;
  let testProperty: Property;
  const testFileId = 'test-file-id';
  const testDataDir = path.join(process.cwd(), 'data', 'aasx');
  const testBackupDir = path.join(process.cwd(), 'data', 'aasx-backups');

  beforeEach(async () => {
    // Arrange: Create test environment
    testProperty = {
      modelType: AasSubmodelElements.Property,
      idShort: 'TestProperty',
      valueType: DataTypeDefXsd.Int,
      value: '42',
    };

    testSubmodel = {
      id: 'https://example.com/submodel/test',
      idShort: 'TestSubmodel',
      submodelElements: [testProperty],
    };

    testEnvironment = {
      assetAdministrationShells: [],
      submodels: [testSubmodel],
      conceptDescriptions: [],
    };

    // Create test directories
    await fs.mkdir(testDataDir, { recursive: true });
    await fs.mkdir(testBackupDir, { recursive: true });

    // Write test environment to file
    const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
    await fs.writeFile(filePath, JSON.stringify(testEnvironment, null, 2));

    updateService = new UpdateService();
  });

  afterEach(async () => {
    // Cleanup: Remove test files
    try {
      const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
      await fs.unlink(filePath);
    } catch {
      // File might not exist
    }

    // Cleanup backups
    try {
      const backupFiles = await fs.readdir(testBackupDir);
      for (const file of backupFiles) {
        if (file.startsWith(testFileId)) {
          await fs.unlink(path.join(testBackupDir, file));
        }
      }
    } catch {
      // Directory might not exist
    }
  });

  describe('updatePropertyValue', () => {
    describe('Success Cases', () => {
      it('should update property value successfully', async () => {
        // Arrange
        const elementPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
          { type: 'element' as const, id: 'TestProperty' },
        ];
        const newValue = '100';

        // Act
        const result = await updateService.updatePropertyValue(
          testFileId,
          elementPath,
          newValue,
          'test-user'
        );

        // Assert
        expect(result.success).toBe(true);
        expect(result.element).toBeDefined();
        expect((result.element as Property).value).toBe(newValue);
        expect(result.version).toBeGreaterThan(0);
        expect(result.timestamp).toBeDefined();
      });

      it('should update property with different value types', async () => {
        // Arrange - Create property with string type
        const stringProperty: Property = {
          modelType: AasSubmodelElements.Property,
          idShort: 'StringProperty',
          valueType: DataTypeDefXsd.String,
          value: 'old value',
        };
        testSubmodel.submodelElements!.push(stringProperty);
        
        const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
        await fs.writeFile(filePath, JSON.stringify(testEnvironment, null, 2));

        const elementPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
          { type: 'element' as const, id: 'StringProperty' },
        ];

        // Act
        const result = await updateService.updatePropertyValue(
          testFileId,
          elementPath,
          'new value',
          'test-user'
        );

        // Assert
        expect(result.success).toBe(true);
        expect((result.element as Property).value).toBe('new value');
      });

      it('should create backup before update', async () => {
        // Arrange
        const elementPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
          { type: 'element' as const, id: 'TestProperty' },
        ];

        // Act
        await updateService.updatePropertyValue(
          testFileId,
          elementPath,
          '200',
          'test-user'
        );

        // Assert - Check backup was created
        const backupFiles = await fs.readdir(testBackupDir);
        const testBackups = backupFiles.filter(f => f.startsWith(testFileId));
        expect(testBackups.length).toBeGreaterThan(0);
      });

      it('should persist changes to file', async () => {
        // Arrange
        const elementPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
          { type: 'element' as const, id: 'TestProperty' },
        ];
        const newValue = '300';

        // Act
        await updateService.updatePropertyValue(
          testFileId,
          elementPath,
          newValue,
          'test-user'
        );

        // Assert - Read file and verify
        const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const savedEnv = JSON.parse(fileContent) as Environment;
        const savedProperty = savedEnv.submodels![0].submodelElements![0] as Property;
        expect(savedProperty.value).toBe(newValue);
      });

      it('should handle empty string values', async () => {
        // Arrange
        const elementPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
          { type: 'element' as const, id: 'TestProperty' },
        ];

        // Act
        const result = await updateService.updatePropertyValue(
          testFileId,
          elementPath,
          '',
          'test-user'
        );

        // Assert
        expect(result.success).toBe(true);
        expect((result.element as Property).value).toBe('');
      });

      it('should handle null values', async () => {
        // Arrange
        const elementPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
          { type: 'element' as const, id: 'TestProperty' },
        ];

        // Act
        const result = await updateService.updatePropertyValue(
          testFileId,
          elementPath,
          null,
          'test-user'
        );

        // Assert
        expect(result.success).toBe(true);
        expect((result.element as Property).value).toBe(null);
      });
    });

    describe('Validation Cases', () => {
      it('should validate integer values', async () => {
        // Arrange
        const elementPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
          { type: 'element' as const, id: 'TestProperty' },
        ];

        // Act & Assert - Invalid integer
        await expect(
          updateService.updatePropertyValue(
            testFileId,
            elementPath,
            'not-a-number',
            'test-user'
          )
        ).rejects.toThrow(ValidationError);
      });

      it('should validate boolean values', async () => {
        // Arrange - Create boolean property
        const boolProperty: Property = {
          modelType: AasSubmodelElements.Property,
          idShort: 'BoolProperty',
          valueType: DataTypeDefXsd.Boolean,
          value: 'true',
        };
        testSubmodel.submodelElements!.push(boolProperty);
        
        const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
        await fs.writeFile(filePath, JSON.stringify(testEnvironment, null, 2));

        const elementPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
          { type: 'element' as const, id: 'BoolProperty' },
        ];

        // Act & Assert - Invalid boolean
        await expect(
          updateService.updatePropertyValue(
            testFileId,
            elementPath,
            'maybe',
            'test-user'
          )
        ).rejects.toThrow(ValidationError);
      });

      it('should validate double values', async () => {
        // Arrange - Create double property
        const doubleProperty: Property = {
          modelType: AasSubmodelElements.Property,
          idShort: 'DoubleProperty',
          valueType: DataTypeDefXsd.Double,
          value: '3.14',
        };
        testSubmodel.submodelElements!.push(doubleProperty);
        
        const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
        await fs.writeFile(filePath, JSON.stringify(testEnvironment, null, 2));

        const elementPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
          { type: 'element' as const, id: 'DoubleProperty' },
        ];

        // Act & Assert - Invalid double
        await expect(
          updateService.updatePropertyValue(
            testFileId,
            elementPath,
            'not-a-double',
            'test-user'
          )
        ).rejects.toThrow(ValidationError);
      });

      it('should validate date values', async () => {
        // Arrange - Create date property
        const dateProperty: Property = {
          modelType: AasSubmodelElements.Property,
          idShort: 'DateProperty',
          valueType: DataTypeDefXsd.Date,
          value: '2025-10-26',
        };
        testSubmodel.submodelElements!.push(dateProperty);
        
        const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
        await fs.writeFile(filePath, JSON.stringify(testEnvironment, null, 2));

        const elementPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
          { type: 'element' as const, id: 'DateProperty' },
        ];

        // Act & Assert - Invalid date format
        await expect(
          updateService.updatePropertyValue(
            testFileId,
            elementPath,
            '26/10/2025',
            'test-user'
          )
        ).rejects.toThrow(ValidationError);
      });

      it('should rollback on validation failure', async () => {
        // Arrange
        const elementPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
          { type: 'element' as const, id: 'TestProperty' },
        ];
        const originalValue = testProperty.value;

        // Act & Assert
        await expect(
          updateService.updatePropertyValue(
            testFileId,
            elementPath,
            'invalid-int',
            'test-user'
          )
        ).rejects.toThrow(ValidationError);

        // Verify value wasn't changed in file
        const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const savedEnv = JSON.parse(fileContent) as Environment;
        const savedProperty = savedEnv.submodels![0].submodelElements![0] as Property;
        expect(savedProperty.value).toBe(originalValue);
      });
    });

    describe('Error Cases', () => {
      it('should throw NotFoundError when element not found', async () => {
        // Arrange
        const elementPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
          { type: 'element' as const, id: 'NonexistentProperty' },
        ];

        // Act & Assert
        await expect(
          updateService.updatePropertyValue(
            testFileId,
            elementPath,
            '100',
            'test-user'
          )
        ).rejects.toThrow(NotFoundError);
      });

      it('should throw error when file not found', async () => {
        // Arrange
        const elementPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
          { type: 'element' as const, id: 'TestProperty' },
        ];

        // Act & Assert
        await expect(
          updateService.updatePropertyValue(
            'nonexistent-file',
            elementPath,
            '100',
            'test-user'
          )
        ).rejects.toThrow();
      });

      it('should throw error when element is not a property', async () => {
        // Arrange - Create collection
        const collection: SubmodelElementCollection = {
          modelType: AasSubmodelElements.SubmodelElementCollection,
          idShort: 'TestCollection',
          value: [],
        };
        testSubmodel.submodelElements!.push(collection);
        
        const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
        await fs.writeFile(filePath, JSON.stringify(testEnvironment, null, 2));

        const elementPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
          { type: 'element' as const, id: 'TestCollection' },
        ];

        // Act & Assert
        await expect(
          updateService.updatePropertyValue(
            testFileId,
            elementPath,
            '100',
            'test-user'
          )
        ).rejects.toThrow('Element is not a property');
      });
    });

    describe('Concurrency', () => {
      it('should handle sequential updates safely', async () => {
        // Arrange
        const elementPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
          { type: 'element' as const, id: 'TestProperty' },
        ];

        // Act - Perform sequential updates (file locking ensures this)
        const result1 = await updateService.updatePropertyValue(testFileId, elementPath, '100', 'user1');
        const result2 = await updateService.updatePropertyValue(testFileId, elementPath, '200', 'user2');
        const result3 = await updateService.updatePropertyValue(testFileId, elementPath, '300', 'user3');

        // Assert - All should complete successfully
        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);
        expect(result3.success).toBe(true);

        // Final value should be the last update
        const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const savedEnv = JSON.parse(fileContent) as Environment;
        const savedProperty = savedEnv.submodels![0].submodelElements![0] as Property;
        expect(savedProperty.value).toBe('300');
      });
    });
  });

  describe('updateElement', () => {
    it('should update multiple properties of an element', async () => {
      // Arrange
      const elementPath = [
        { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
        { type: 'element' as const, id: 'TestProperty' },
      ];
      // Add description to property first
      testProperty.description = [{ language: 'en', text: 'Original description' }];
      const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
      await fs.writeFile(filePath, JSON.stringify(testEnvironment, null, 2));

      const updates = {
        value: '999',
        description: [{ language: 'en', text: 'Updated description' }],
      };

      // Act
      const result = await updateService.updateElement(
        testFileId,
        elementPath,
        updates,
        'test-user'
      );

      // Assert
      expect(result.success).toBe(true);
      expect((result.element as Property).value).toBe('999');
      expect(result.element.description).toEqual(updates.description);
    });

    it('should update idShort successfully', async () => {
      // Arrange
      const elementPath = [
        { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
        { type: 'element' as const, id: 'TestProperty' },
      ];
      const updates = {
        idShort: 'UpdatedProperty',
      };

      // Act
      const result = await updateService.updateElement(
        testFileId,
        elementPath,
        updates,
        'test-user'
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.element.idShort).toBe('UpdatedProperty');
    });

    it('should update multiple properties successfully', async () => {
      // Arrange
      const elementPath = [
        { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
        { type: 'element' as const, id: 'TestProperty' },
      ];
      // Add description to property first
      testProperty.description = [{ language: 'en', text: 'Original description' }];
      const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
      await fs.writeFile(filePath, JSON.stringify(testEnvironment, null, 2));

      const updates = {
        idShort: 'UpdatedIdShort',
        description: [{ language: 'en', text: 'Test description' }],
      };

      // Act
      const result = await updateService.updateElement(
        testFileId,
        elementPath,
        updates,
        'test-user'
      );

      // Assert - Changes should be persisted
      expect(result.success).toBe(true);
      expect(result.element.idShort).toBe('UpdatedIdShort');
      
      const savedFilePath = path.join(testDataDir, `${testFileId}-environment.json`);
      const fileContent = await fs.readFile(savedFilePath, 'utf-8');
      const savedEnv = JSON.parse(fileContent) as Environment;
      const savedProperty = savedEnv.submodels![0].submodelElements![0] as Property;
      expect(savedProperty.idShort).toBe('UpdatedIdShort');
      expect(savedProperty.description).toEqual(updates.description);
    });
  });

  describe('updateMultiLanguageProperty', () => {
    it('should update multi-language property', async () => {
      // Arrange - Create multi-language property with all required fields
      const mlProperty: any = {
        modelType: AasSubmodelElements.MultiLanguageProperty,
        idShort: 'MLProperty',
        value: [
          { language: 'en', text: 'English' },
          { language: 'de', text: 'Deutsch' },
        ],
      };
      testSubmodel.submodelElements!.push(mlProperty);
      
      const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
      await fs.writeFile(filePath, JSON.stringify(testEnvironment, null, 2));

      const elementPath = [
        { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
        { type: 'element' as const, id: 'MLProperty' },
      ];
      const newLangStrings: LangStringTextType[] = [
        { language: 'en', text: 'Updated English' },
        { language: 'fr', text: 'Français' },
      ];

      // Act
      const result = await updateService.updateMultiLanguageProperty(
        testFileId,
        elementPath,
        newLangStrings,
        'test-user'
      );

      // Assert
      expect(result.success).toBe(true);
      const mlResult = result.element as any;
      expect(mlResult.value).toEqual(newLangStrings);
    });

    it('should reject duplicate language codes', async () => {
      // Arrange
      const mlProperty: any = {
        modelType: AasSubmodelElements.MultiLanguageProperty,
        idShort: 'MLProperty',
        value: [{ language: 'en', text: 'English' }],
      };
      testSubmodel.submodelElements!.push(mlProperty);
      
      const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
      await fs.writeFile(filePath, JSON.stringify(testEnvironment, null, 2));

      const elementPath = [
        { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
        { type: 'element' as const, id: 'MLProperty' },
      ];
      const invalidLangStrings: LangStringTextType[] = [
        { language: 'en', text: 'Text 1' },
        { language: 'en', text: 'Text 2' },
      ];

      // Act & Assert
      await expect(
        updateService.updateMultiLanguageProperty(
          testFileId,
          elementPath,
          invalidLangStrings,
          'test-user'
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should reject missing language codes', async () => {
      // Arrange
      const mlProperty: any = {
        modelType: AasSubmodelElements.MultiLanguageProperty,
        idShort: 'MLProperty',
        value: [{ language: 'en', text: 'English' }],
      };
      testSubmodel.submodelElements!.push(mlProperty);
      
      const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
      await fs.writeFile(filePath, JSON.stringify(testEnvironment, null, 2));

      const elementPath = [
        { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
        { type: 'element' as const, id: 'MLProperty' },
      ];
      const invalidLangStrings: any[] = [
        { text: 'Missing language' },
      ];

      // Act & Assert
      await expect(
        updateService.updateMultiLanguageProperty(
          testFileId,
          elementPath,
          invalidLangStrings,
          'test-user'
        )
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Backup and Restore', () => {
    it('should create backup with timestamp', async () => {
      // Arrange
      const elementPath = [
        { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
        { type: 'element' as const, id: 'TestProperty' },
      ];

      // Act
      const beforeUpdate = Date.now();
      await updateService.updatePropertyValue(
        testFileId,
        elementPath,
        '100',
        'test-user'
      );
      const afterUpdate = Date.now();

      // Assert
      const backupFiles = await fs.readdir(testBackupDir);
      const testBackups = backupFiles.filter(f => f.startsWith(testFileId));
      expect(testBackups.length).toBeGreaterThan(0);

      // Verify backup filename contains timestamp
      const backupFile = testBackups[0];
      const timestampMatch = backupFile.match(/\d{13}/);
      expect(timestampMatch).toBeTruthy();
      
      if (timestampMatch) {
        const timestamp = parseInt(timestampMatch[0]);
        expect(timestamp).toBeGreaterThanOrEqual(beforeUpdate);
        expect(timestamp).toBeLessThanOrEqual(afterUpdate);
      }
    });

    it('should restore from most recent backup', async () => {
      // Arrange - Create a backup manually
      const backupTimestamp = Date.now();
      const backupPath = path.join(testBackupDir, `${testFileId}-${backupTimestamp}.json`);
      const backupEnv = JSON.parse(JSON.stringify(testEnvironment));
      (backupEnv.submodels![0].submodelElements![0] as Property).value = '777';
      await fs.writeFile(backupPath, JSON.stringify(backupEnv, null, 2));

      // Modify the current file
      const elementPath = [
        { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
        { type: 'element' as const, id: 'TestProperty' },
      ];
      await updateService.updatePropertyValue(
        testFileId,
        elementPath,
        '999',
        'test-user'
      );

      // Act - Restore from backup
      await updateService.restoreFromBackup(testFileId);

      // Assert - File should be restored to backup
      const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const restoredEnv = JSON.parse(fileContent) as Environment;
      const restoredProperty = restoredEnv.submodels![0].submodelElements![0] as Property;
      // Should be restored to the most recent backup (which could be from the update or our manual backup)
      expect(['777', '42']).toContain(restoredProperty.value);
    });

    it('should clean old backups', async () => {
      // Arrange - Create multiple backups
      const backups = [];
      for (let i = 0; i < 15; i++) {
        const backupPath = path.join(
          testBackupDir,
          `${testFileId}-${Date.now() + i}.json`
        );
        await fs.writeFile(backupPath, JSON.stringify(testEnvironment, null, 2));
        backups.push(backupPath);
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 2));
      }

      // Act - Keep only 10 backups
      await updateService.cleanOldBackups(testFileId, 10);

      // Assert
      const remainingBackups = await fs.readdir(testBackupDir);
      const testBackups = remainingBackups.filter(f => f.startsWith(testFileId));
      expect(testBackups.length).toBe(10);
    });
  });

  describe('Version Tracking', () => {
    it('should increment version on each update', async () => {
      // Arrange
      const elementPath = [
        { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
        { type: 'element' as const, id: 'TestProperty' },
      ];

      // Act - Perform multiple updates with small delays to ensure different timestamps
      const result1 = await updateService.updatePropertyValue(
        testFileId,
        elementPath,
        '100',
        'test-user'
      );
      // Wait 2ms to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 2));
      
      const result2 = await updateService.updatePropertyValue(
        testFileId,
        elementPath,
        '200',
        'test-user'
      );
      // Wait 2ms to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 2));
      
      const result3 = await updateService.updatePropertyValue(
        testFileId,
        elementPath,
        '300',
        'test-user'
      );

      // Assert - Versions should increment
      expect(result2.version).toBeGreaterThan(result1.version);
      expect(result3.version).toBeGreaterThan(result2.version);
    });

    it('should detect version conflicts', async () => {
      // Arrange
      const version1 = await updateService.getFileVersion(testFileId);

      // Modify file externally
      const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
      await new Promise(resolve => setTimeout(resolve, 10)); // Ensure time difference
      await fs.writeFile(filePath, JSON.stringify(testEnvironment, null, 2));

      // Act
      const hasConflict = await updateService.hasConflict(testFileId, version1);

      // Assert
      expect(hasConflict).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should complete update in < 200ms', async () => {
      // Arrange
      const elementPath = [
        { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
        { type: 'element' as const, id: 'TestProperty' },
      ];

      // Act
      const startTime = performance.now();
      await updateService.updatePropertyValue(
        testFileId,
        elementPath,
        '100',
        'test-user'
      );
      const endTime = performance.now();

      // Assert
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(200);
    });

    it('should handle large environment efficiently', async () => {
      // Arrange - Create large environment
      const largeSubmodel: Submodel = {
        id: 'https://example.com/large',
        idShort: 'Large',
        submodelElements: Array.from({ length: 500 }, (_, i) => ({
          modelType: AasSubmodelElements.Property,
          idShort: `Property${i}`,
          valueType: DataTypeDefXsd.Int,
          value: String(i),
        } as Property)),
      };
      testEnvironment.submodels = [largeSubmodel];
      
      const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
      await fs.writeFile(filePath, JSON.stringify(testEnvironment, null, 2));

      const elementPath = [
        { type: 'submodel' as const, id: 'https://example.com/large' },
        { type: 'element' as const, id: 'Property250' },
      ];

      // Act
      const startTime = performance.now();
      await updateService.updatePropertyValue(
        testFileId,
        elementPath,
        '999',
        'test-user'
      );
      const endTime = performance.now();

      // Assert
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(500); // Allow more time for large file
    });
  });
});
