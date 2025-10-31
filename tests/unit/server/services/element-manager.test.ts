/**
 * ElementManager Service - Comprehensive Test Suite
 * Tests element addition, removal, and reordering with validation
 * 
 * Testing Standards:
 * - 100% code coverage
 * - All edge cases covered
 * - Clear test descriptions
 * - AAA pattern (Arrange, Act, Assert)
 * - Type-safe assertions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ElementManager, ValidationError } from '../../../../server/src/services/element-manager';
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
} from '../../../../shared/aas-v3-types';

describe('ElementManager', () => {
  let elementManager: ElementManager;
  let testEnvironment: Environment;
  let testSubmodel: Submodel;
  let testProperty1: Property;
  let testProperty2: Property;
  let testCollection: SubmodelElementCollection;
  const testFileId = 'test-element-manager';
  const testDataDir = path.join(process.cwd(), 'data', 'aasx');
  const testBackupDir = path.join(process.cwd(), 'data', 'aasx-backups');

  beforeEach(async () => {
    // Arrange: Create test environment
    testProperty1 = {
      modelType: AasSubmodelElements.Property,
      idShort: 'Property1',
      valueType: DataTypeDefXsd.String,
      value: 'value1',
    };

    testProperty2 = {
      modelType: AasSubmodelElements.Property,
      idShort: 'Property2',
      valueType: DataTypeDefXsd.String,
      value: 'value2',
    };

    testCollection = {
      modelType: AasSubmodelElements.SubmodelElementCollection,
      idShort: 'Collection1',
      value: [],
    };

    testSubmodel = {
      id: 'https://example.com/submodel/test',
      idShort: 'TestSubmodel',
      submodelElements: [testProperty1, testProperty2, testCollection],
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

    elementManager = new ElementManager();
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

  describe('addElement', () => {
    describe('Success Cases', () => {
      it('should add element to submodel', async () => {
        // Arrange
        const parentPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
        ];
        const newProperty: Property = {
          modelType: AasSubmodelElements.Property,
          idShort: 'NewProperty',
          valueType: DataTypeDefXsd.Int,
          value: '100',
        };

        // Act
        const result = await elementManager.addElement(
          testFileId,
          parentPath,
          newProperty,
          undefined,
          'test-user'
        );

        // Assert
        expect(result.success).toBe(true);
        expect(result.element).toBe(newProperty);
        expect(result.index).toBe(3); // Added at end
        expect(result.version).toBeGreaterThan(0);
        expect(result.timestamp).toBeDefined();

        // Verify persistence
        const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const savedEnv = JSON.parse(fileContent) as Environment;
        expect(savedEnv.submodels![0].submodelElements).toHaveLength(4);
        expect(savedEnv.submodels![0].submodelElements![3].idShort).toBe('NewProperty');
      });

      it('should add element at specific position', async () => {
        // Arrange
        const parentPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
        ];
        const newProperty: Property = {
          modelType: AasSubmodelElements.Property,
          idShort: 'InsertedProperty',
          valueType: DataTypeDefXsd.String,
          value: 'inserted',
        };

        // Act
        const result = await elementManager.addElement(
          testFileId,
          parentPath,
          newProperty,
          1, // Insert at position 1
          'test-user'
        );

        // Assert
        expect(result.success).toBe(true);
        expect(result.index).toBe(1);

        // Verify order
        const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const savedEnv = JSON.parse(fileContent) as Environment;
        const elements = savedEnv.submodels![0].submodelElements!;
        expect(elements[0].idShort).toBe('Property1');
        expect(elements[1].idShort).toBe('InsertedProperty');
        expect(elements[2].idShort).toBe('Property2');
      });

      it('should add element to collection', async () => {
        // Arrange
        const parentPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
          { type: 'element' as const, id: 'Collection1' },
        ];
        const newProperty: Property = {
          modelType: AasSubmodelElements.Property,
          idShort: 'CollectionProperty',
          valueType: DataTypeDefXsd.String,
          value: 'in collection',
        };

        // Act
        const result = await elementManager.addElement(
          testFileId,
          parentPath,
          newProperty,
          undefined,
          'test-user'
        );

        // Assert
        expect(result.success).toBe(true);
        expect(result.index).toBe(0);

        // Verify in collection
        const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const savedEnv = JSON.parse(fileContent) as Environment;
        const collection = savedEnv.submodels![0].submodelElements![2] as SubmodelElementCollection;
        expect(collection.value).toHaveLength(1);
        expect(collection.value![0].idShort).toBe('CollectionProperty');
      });

      it('should create backup before adding', async () => {
        // Arrange
        const parentPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
        ];
        const newProperty: Property = {
          modelType: AasSubmodelElements.Property,
          idShort: 'BackupTest',
          valueType: DataTypeDefXsd.String,
          value: 'test',
        };

        // Act
        await elementManager.addElement(
          testFileId,
          parentPath,
          newProperty,
          undefined,
          'test-user'
        );

        // Assert - Check backup was created
        const backupFiles = await fs.readdir(testBackupDir);
        const testBackups = backupFiles.filter(f => f.startsWith(testFileId));
        expect(testBackups.length).toBeGreaterThan(0);
      });
    });

    describe('Validation Cases', () => {
      it('should reject duplicate idShort', async () => {
        // Arrange
        const parentPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
        ];
        const duplicateProperty: Property = {
          modelType: AasSubmodelElements.Property,
          idShort: 'Property1', // Duplicate!
          valueType: DataTypeDefXsd.String,
          value: 'duplicate',
        };

        // Act & Assert
        await expect(
          elementManager.addElement(
            testFileId,
            parentPath,
            duplicateProperty,
            undefined,
            'test-user'
          )
        ).rejects.toThrow(ValidationError);
      });

      it('should validate environment after adding', async () => {
        // Arrange
        const parentPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
        ];
        // Create invalid element (missing required fields)
        const invalidElement: any = {
          modelType: AasSubmodelElements.Property,
          // Missing idShort
          valueType: DataTypeDefXsd.String,
          value: 'test',
        };

        // Act & Assert
        await expect(
          elementManager.addElement(
            testFileId,
            parentPath,
            invalidElement,
            undefined,
            'test-user'
          )
        ).rejects.toThrow(ValidationError);
      });
    });

    describe('Error Cases', () => {
      it('should throw error when parent not found', async () => {
        // Arrange
        const parentPath = [
          { type: 'submodel' as const, id: 'nonexistent' },
        ];
        const newProperty: Property = {
          modelType: AasSubmodelElements.Property,
          idShort: 'Test',
          valueType: DataTypeDefXsd.String,
          value: 'test',
        };

        // Act & Assert
        await expect(
          elementManager.addElement(
            testFileId,
            parentPath,
            newProperty,
            undefined,
            'test-user'
          )
        ).rejects.toThrow(NotFoundError);
      });

      it('should throw error when parent is not a container', async () => {
        // Arrange - Try to add to a Property (not a container)
        const parentPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
          { type: 'element' as const, id: 'Property1' },
        ];
        const newProperty: Property = {
          modelType: AasSubmodelElements.Property,
          idShort: 'Test',
          valueType: DataTypeDefXsd.String,
          value: 'test',
        };

        // Act & Assert
        await expect(
          elementManager.addElement(
            testFileId,
            parentPath,
            newProperty,
            undefined,
            'test-user'
          )
        ).rejects.toThrow('not a container');
      });
    });
  });

  describe('removeElement', () => {
    describe('Success Cases', () => {
      it('should remove element from submodel', async () => {
        // Arrange
        const elementPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
          { type: 'element' as const, id: 'Property2' },
        ];

        // Act
        const result = await elementManager.removeElement(
          testFileId,
          elementPath,
          'test-user'
        );

        // Assert
        expect(result.success).toBe(true);
        expect(result.removedElement.idShort).toBe('Property2');
        expect(result.version).toBeGreaterThan(0);

        // Verify removal
        const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const savedEnv = JSON.parse(fileContent) as Environment;
        expect(savedEnv.submodels![0].submodelElements).toHaveLength(2);
        expect(savedEnv.submodels![0].submodelElements!.find(e => e.idShort === 'Property2')).toBeUndefined();
      });

      it('should remove element from collection', async () => {
        // Arrange - First add element to collection
        const addPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
          { type: 'element' as const, id: 'Collection1' },
        ];
        const newProperty: Property = {
          modelType: AasSubmodelElements.Property,
          idShort: 'ToRemove',
          valueType: DataTypeDefXsd.String,
          value: 'test',
        };
        await elementManager.addElement(testFileId, addPath, newProperty);

        const removePath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
          { type: 'element' as const, id: 'Collection1' },
          { type: 'element' as const, id: 'ToRemove' },
        ];

        // Act
        const result = await elementManager.removeElement(
          testFileId,
          removePath,
          'test-user'
        );

        // Assert
        expect(result.success).toBe(true);
        expect(result.removedElement.idShort).toBe('ToRemove');

        // Verify collection is empty again
        const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const savedEnv = JSON.parse(fileContent) as Environment;
        const collection = savedEnv.submodels![0].submodelElements![2] as SubmodelElementCollection;
        expect(collection.value).toHaveLength(0);
      });

      it('should create backup before removing', async () => {
        // Arrange
        const elementPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
          { type: 'element' as const, id: 'Property1' },
        ];

        // Act
        await elementManager.removeElement(
          testFileId,
          elementPath,
          'test-user'
        );

        // Assert - Check backup was created
        const backupFiles = await fs.readdir(testBackupDir);
        const testBackups = backupFiles.filter(f => f.startsWith(testFileId));
        expect(testBackups.length).toBeGreaterThan(0);
      });
    });

    describe('Error Cases', () => {
      it('should throw error when element not found', async () => {
        // Arrange
        const elementPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
          { type: 'element' as const, id: 'Nonexistent' },
        ];

        // Act & Assert
        await expect(
          elementManager.removeElement(
            testFileId,
            elementPath,
            'test-user'
          )
        ).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('reorderElements', () => {
    describe('Success Cases', () => {
      it('should reorder elements in submodel', async () => {
        // Arrange
        const parentPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
        ];
        const newOrder = ['Property2', 'Collection1', 'Property1'];

        // Act
        const result = await elementManager.reorderElements(
          testFileId,
          parentPath,
          newOrder,
          'test-user'
        );

        // Assert
        expect(result.success).toBe(true);
        expect(result.newOrder).toEqual(newOrder);
        expect(result.version).toBeGreaterThan(0);

        // Verify new order
        const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const savedEnv = JSON.parse(fileContent) as Environment;
        const elements = savedEnv.submodels![0].submodelElements!;
        expect(elements[0].idShort).toBe('Property2');
        expect(elements[1].idShort).toBe('Collection1');
        expect(elements[2].idShort).toBe('Property1');
      });

      it('should reorder elements in collection', async () => {
        // Arrange - Add multiple elements to collection
        const collectionPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
          { type: 'element' as const, id: 'Collection1' },
        ];
        
        await elementManager.addElement(testFileId, collectionPath, {
          modelType: AasSubmodelElements.Property,
          idShort: 'A',
          valueType: DataTypeDefXsd.String,
          value: 'a',
        } as Property);
        
        await elementManager.addElement(testFileId, collectionPath, {
          modelType: AasSubmodelElements.Property,
          idShort: 'B',
          valueType: DataTypeDefXsd.String,
          value: 'b',
        } as Property);
        
        await elementManager.addElement(testFileId, collectionPath, {
          modelType: AasSubmodelElements.Property,
          idShort: 'C',
          valueType: DataTypeDefXsd.String,
          value: 'c',
        } as Property);

        const newOrder = ['C', 'A', 'B'];

        // Act
        const result = await elementManager.reorderElements(
          testFileId,
          collectionPath,
          newOrder,
          'test-user'
        );

        // Assert
        expect(result.success).toBe(true);
        expect(result.newOrder).toEqual(newOrder);

        // Verify order in collection
        const filePath = path.join(testDataDir, `${testFileId}-environment.json`);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const savedEnv = JSON.parse(fileContent) as Environment;
        const collection = savedEnv.submodels![0].submodelElements![2] as SubmodelElementCollection;
        expect(collection.value![0].idShort).toBe('C');
        expect(collection.value![1].idShort).toBe('A');
        expect(collection.value![2].idShort).toBe('B');
      });
    });

    describe('Validation Cases', () => {
      it('should reject order with wrong count', async () => {
        // Arrange
        const parentPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
        ];
        const wrongOrder = ['Property1', 'Property2']; // Missing Collection1

        // Act & Assert
        await expect(
          elementManager.reorderElements(
            testFileId,
            parentPath,
            wrongOrder,
            'test-user'
          )
        ).rejects.toThrow(ValidationError);
      });

      it('should reject order with missing idShorts', async () => {
        // Arrange
        const parentPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
        ];
        const wrongOrder = ['Property1', 'Property2', 'Nonexistent'];

        // Act & Assert
        await expect(
          elementManager.reorderElements(
            testFileId,
            parentPath,
            wrongOrder,
            'test-user'
          )
        ).rejects.toThrow(ValidationError);
      });

      it('should reject order with extra idShorts', async () => {
        // Arrange
        const parentPath = [
          { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
        ];
        const wrongOrder = ['Property1', 'Property2', 'Collection1', 'Extra'];

        // Act & Assert
        await expect(
          elementManager.reorderElements(
            testFileId,
            parentPath,
            wrongOrder,
            'test-user'
          )
        ).rejects.toThrow(ValidationError);
      });
    });
  });

  describe('Performance', () => {
    it('should add element in < 200ms', async () => {
      // Arrange
      const parentPath = [
        { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
      ];
      const newProperty: Property = {
        modelType: AasSubmodelElements.Property,
        idShort: 'PerformanceTest',
        valueType: DataTypeDefXsd.String,
        value: 'test',
      };

      // Act
      const startTime = performance.now();
      await elementManager.addElement(
        testFileId,
        parentPath,
        newProperty,
        undefined,
        'test-user'
      );
      const endTime = performance.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(200);
    });

    it('should remove element in < 200ms', async () => {
      // Arrange
      const elementPath = [
        { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
        { type: 'element' as const, id: 'Property1' },
      ];

      // Act
      const startTime = performance.now();
      await elementManager.removeElement(
        testFileId,
        elementPath,
        'test-user'
      );
      const endTime = performance.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(200);
    });

    it('should reorder elements in < 200ms', async () => {
      // Arrange
      const parentPath = [
        { type: 'submodel' as const, id: 'https://example.com/submodel/test' },
      ];
      const newOrder = ['Collection1', 'Property1', 'Property2'];

      // Act
      const startTime = performance.now();
      await elementManager.reorderElements(
        testFileId,
        parentPath,
        newOrder,
        'test-user'
      );
      const endTime = performance.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(200);
    });
  });
});
