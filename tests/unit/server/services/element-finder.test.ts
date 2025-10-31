/**
 * ElementFinder Service - Comprehensive Test Suite
 * Tests path navigation, element lookup, and error handling
 * 
 * Testing Standards:
 * - 100% code coverage
 * - All edge cases covered
 * - Clear test descriptions
 * - AAA pattern (Arrange, Act, Assert)
 * - Type-safe assertions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ElementFinder, NotFoundError, type ElementPath } from '../../../../server/src/services/element-finder';
import {
  AasSubmodelElements,
  DataTypeDefXsd,
  type Environment,
  type Submodel,
  type SubmodelElement,
  type Property,
  type SubmodelElementCollection,
  type SubmodelElementList,
} from '../../../../shared/aas-v3-types';

describe('ElementFinder', () => {
  // Test fixtures
  let testEnvironment: Environment;
  let testSubmodel: Submodel;
  let testProperty: Property;
  let testCollection: SubmodelElementCollection;
  let nestedProperty: Property;

  beforeEach(() => {
    // Arrange: Create comprehensive test environment
    nestedProperty = {
      modelType: AasSubmodelElements.Property,
      idShort: 'NestedProperty',
      valueType: DataTypeDefXsd.String,
      value: 'nested value',
    };

    testCollection = {
      modelType: AasSubmodelElements.SubmodelElementCollection,
      idShort: 'TestCollection',
      value: [nestedProperty],
    };

    testProperty = {
      modelType: AasSubmodelElements.Property,
      idShort: 'TestProperty',
      valueType: DataTypeDefXsd.Int,
      value: '42',
    };

    testSubmodel = {
      id: 'https://example.com/submodel/test',
      idShort: 'TestSubmodel',
      submodelElements: [testProperty, testCollection],
    };

    testEnvironment = {
      assetAdministrationShells: [],
      submodels: [testSubmodel],
      conceptDescriptions: [],
    };
  });

  describe('findByPath', () => {
    describe('Success Cases', () => {
      it('should find submodel by path', () => {
        // Arrange
        const path: ElementPath[] = [
          { type: 'submodel', id: 'https://example.com/submodel/test' },
        ];

        // Act
        const result = ElementFinder.findByPath<Submodel>(testEnvironment, path);

        // Assert
        expect(result).toBeDefined();
        expect(result.element).toBe(testSubmodel);
        expect(result.element.idShort).toBe('TestSubmodel');
        expect(result.parent).toBe(testEnvironment);
        expect(result.path).toEqual(path);
      });

      it('should find property in submodel by path', () => {
        // Arrange
        const path: ElementPath[] = [
          { type: 'submodel', id: 'https://example.com/submodel/test' },
          { type: 'element', id: 'TestProperty' },
        ];

        // Act
        const result = ElementFinder.findByPath<Property>(testEnvironment, path);

        // Assert
        expect(result).toBeDefined();
        expect(result.element).toBe(testProperty);
        expect(result.element.idShort).toBe('TestProperty');
        expect(result.element.modelType).toBe(AasSubmodelElements.Property);
        expect(result.parent).toBe(testSubmodel);
        expect(result.path).toEqual(path);
      });

      it('should find nested property in collection by path', () => {
        // Arrange
        const path: ElementPath[] = [
          { type: 'submodel', id: 'https://example.com/submodel/test' },
          { type: 'element', id: 'TestCollection' },
          { type: 'element', id: 'NestedProperty' },
        ];

        // Act
        const result = ElementFinder.findByPath<Property>(testEnvironment, path);

        // Assert
        expect(result).toBeDefined();
        expect(result.element).toBe(nestedProperty);
        expect(result.element.idShort).toBe('NestedProperty');
        expect(result.element.value).toBe('nested value');
        expect(result.parent).toBe(testCollection);
        expect(result.path).toEqual(path);
      });

      it('should find collection element by path', () => {
        // Arrange
        const path: ElementPath[] = [
          { type: 'submodel', id: 'https://example.com/submodel/test' },
          { type: 'element', id: 'TestCollection' },
        ];

        // Act
        const result = ElementFinder.findByPath<SubmodelElementCollection>(
          testEnvironment,
          path
        );

        // Assert
        expect(result).toBeDefined();
        expect(result.element).toBe(testCollection);
        expect(result.element.modelType).toBe(AasSubmodelElements.SubmodelElementCollection);
        expect(result.element.value).toHaveLength(1);
        expect(result.parent).toBe(testSubmodel);
      });
    });

    describe('Error Cases', () => {
      it('should throw NotFoundError when submodel not found', () => {
        // Arrange
        const path: ElementPath[] = [
          { type: 'submodel', id: 'https://example.com/nonexistent' },
        ];

        // Act & Assert
        expect(() => {
          ElementFinder.findByPath(testEnvironment, path);
        }).toThrow(NotFoundError);

        try {
          ElementFinder.findByPath(testEnvironment, path);
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundError);
          expect((error as NotFoundError).path).toEqual(path);
          expect((error as NotFoundError).failedAt).toBe(0);
          expect((error as NotFoundError).message).toContain('Element not found');
        }
      });

      it('should throw NotFoundError when element not found', () => {
        // Arrange
        const path: ElementPath[] = [
          { type: 'submodel', id: 'https://example.com/submodel/test' },
          { type: 'element', id: 'NonexistentElement' },
        ];

        // Act & Assert
        expect(() => {
          ElementFinder.findByPath(testEnvironment, path);
        }).toThrow(NotFoundError);

        try {
          ElementFinder.findByPath(testEnvironment, path);
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundError);
          expect((error as NotFoundError).failedAt).toBe(1);
        }
      });

      it('should throw error when path is empty', () => {
        // Arrange
        const path: ElementPath[] = [];

        // Act & Assert
        expect(() => {
          ElementFinder.findByPath(testEnvironment, path);
        }).toThrow('Path cannot be empty');
      });

      it('should throw error for unknown path segment type', () => {
        // Arrange
        const path: ElementPath[] = [
          { type: 'invalid' as any, id: 'test' },
        ];

        // Act & Assert
        expect(() => {
          ElementFinder.findByPath(testEnvironment, path);
        }).toThrow('Unknown path segment type');
      });

      it('should throw NotFoundError when nested element not found', () => {
        // Arrange
        const path: ElementPath[] = [
          { type: 'submodel', id: 'https://example.com/submodel/test' },
          { type: 'element', id: 'TestCollection' },
          { type: 'element', id: 'NonexistentNested' },
        ];

        // Act & Assert
        expect(() => {
          ElementFinder.findByPath(testEnvironment, path);
        }).toThrow(NotFoundError);
      });
    });

    describe('Edge Cases', () => {
      it('should handle environment with no submodels', () => {
        // Arrange
        const emptyEnv: Environment = {
          assetAdministrationShells: [],
          submodels: [],
          conceptDescriptions: [],
        };
        const path: ElementPath[] = [
          { type: 'submodel', id: 'test' },
        ];

        // Act & Assert
        expect(() => {
          ElementFinder.findByPath(emptyEnv, path);
        }).toThrow(NotFoundError);
      });

      it('should handle submodel with no elements', () => {
        // Arrange
        const emptySubmodel: Submodel = {
          modelType: 'Submodel',
          id: 'https://example.com/empty',
          idShort: 'Empty',
          submodelElements: [],
        };
        testEnvironment.submodels = [emptySubmodel];

        const path: ElementPath[] = [
          { type: 'submodel', id: 'https://example.com/empty' },
          { type: 'element', id: 'test' },
        ];

        // Act & Assert
        expect(() => {
          ElementFinder.findByPath(testEnvironment, path);
        }).toThrow(NotFoundError);
      });

      it('should handle collection with empty value array', () => {
        // Arrange
        const emptyCollection: SubmodelElementCollection = {
          modelType: AasSubmodelElements.SubmodelElementCollection,
          idShort: 'EmptyCollection',
          value: [],
        };
        testSubmodel.submodelElements = [emptyCollection];

        const path: ElementPath[] = [
          { type: 'submodel', id: 'https://example.com/submodel/test' },
          { type: 'element', id: 'EmptyCollection' },
          { type: 'element', id: 'test' },
        ];

        // Act & Assert
        expect(() => {
          ElementFinder.findByPath(testEnvironment, path);
        }).toThrow(NotFoundError);
      });
    });
  });

  describe('findByStringPath', () => {
    it('should parse and find element by string path with simple IDs', () => {
      // Arrange - Create environment with simple IDs (no URLs)
      const simpleSubmodel: Submodel = {
        id: 'sm1',
        idShort: 'SimpleSubmodel',
        submodelElements: [testProperty],
      };
      const simpleEnv: Environment = {
        assetAdministrationShells: [],
        submodels: [simpleSubmodel],
        conceptDescriptions: [],
      };
      const stringPath = 'submodel/sm1/element/TestProperty';

      // Act
      const result = ElementFinder.findByStringPath<Property>(
        simpleEnv,
        stringPath
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.element).toBe(testProperty);
      expect(result.element.idShort).toBe('TestProperty');
    });

    it('should handle nested path in string format', () => {
      // Arrange
      const simpleSubmodel: Submodel = {
        id: 'sm1',
        idShort: 'SimpleSubmodel',
        submodelElements: [testCollection],
      };
      const simpleEnv: Environment = {
        assetAdministrationShells: [],
        submodels: [simpleSubmodel],
        conceptDescriptions: [],
      };
      const stringPath = 'submodel/sm1/element/TestCollection/element/NestedProperty';

      // Act
      const result = ElementFinder.findByStringPath<Property>(
        simpleEnv,
        stringPath
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.element).toBe(nestedProperty);
    });

    it('should throw error for invalid string path format (odd segments)', () => {
      // Arrange
      const invalidPath = 'submodel/test/element';

      // Act & Assert
      expect(() => {
        ElementFinder.findByStringPath(testEnvironment, invalidPath);
      }).toThrow('Invalid path format: must have type/id pairs');
    });

    it('should handle path with trailing slash', () => {
      // Arrange
      const simpleSubmodel: Submodel = {
        id: 'sm1',
        idShort: 'SimpleSubmodel',
        submodelElements: [testProperty],
      };
      const simpleEnv: Environment = {
        assetAdministrationShells: [],
        submodels: [simpleSubmodel],
        conceptDescriptions: [],
      };
      const stringPath = 'submodel/sm1/element/TestProperty/';

      // Act
      const result = ElementFinder.findByStringPath<Property>(
        simpleEnv,
        stringPath
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.element.idShort).toBe('TestProperty');
    });

    it('should handle path with leading slash', () => {
      // Arrange
      const simpleSubmodel: Submodel = {
        id: 'sm1',
        idShort: 'SimpleSubmodel',
        submodelElements: [testProperty],
      };
      const simpleEnv: Environment = {
        assetAdministrationShells: [],
        submodels: [simpleSubmodel],
        conceptDescriptions: [],
      };
      const stringPath = '/submodel/sm1/element/TestProperty';

      // Act
      const result = ElementFinder.findByStringPath<Property>(
        simpleEnv,
        stringPath
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.element.idShort).toBe('TestProperty');
    });
  });

  describe('getAllElements', () => {
    it('should return all elements in flat list', () => {
      // Act
      const elements = ElementFinder.getAllElements(testEnvironment);

      // Assert
      expect(elements).toHaveLength(3); // TestProperty, TestCollection, NestedProperty
      expect(elements).toContain(testProperty);
      expect(elements).toContain(testCollection);
      expect(elements).toContain(nestedProperty);
    });

    it('should return empty array for environment with no submodels', () => {
      // Arrange
      const emptyEnv: Environment = {
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [],
      };

      // Act
      const elements = ElementFinder.getAllElements(emptyEnv);

      // Assert
      expect(elements).toEqual([]);
    });

    it('should handle deeply nested collections', () => {
      // Arrange
      const deeplyNested: Property = {
        modelType: AasSubmodelElements.Property,
        idShort: 'DeeplyNested',
        valueType: DataTypeDefXsd.String,
        value: 'deep',
      };

      const level2Collection: SubmodelElementCollection = {
        modelType: AasSubmodelElements.SubmodelElementCollection,
        idShort: 'Level2',
        value: [deeplyNested],
      };

      const level1Collection: SubmodelElementCollection = {
        modelType: AasSubmodelElements.SubmodelElementCollection,
        idShort: 'Level1',
        value: [level2Collection],
      };

      testSubmodel.submodelElements = [level1Collection];

      // Act
      const elements = ElementFinder.getAllElements(testEnvironment);

      // Assert
      expect(elements).toHaveLength(3); // Level1, Level2, DeeplyNested
      expect(elements).toContain(deeplyNested);
    });

    it('should handle SubmodelElementList', () => {
      // Arrange
      const listElement: SubmodelElementList = {
        modelType: AasSubmodelElements.SubmodelElementList,
        idShort: 'TestList',
        typeValueListElement: AasSubmodelElements.Property,
        value: [testProperty],
      };

      testSubmodel.submodelElements = [listElement];

      // Act
      const elements = ElementFinder.getAllElements(testEnvironment);

      // Assert
      expect(elements).toHaveLength(2); // TestList, TestProperty
      expect(elements).toContain(listElement);
      expect(elements).toContain(testProperty);
    });
  });

  describe('findParent', () => {
    it('should find parent of element', () => {
      // Arrange
      const path: ElementPath[] = [
        { type: 'submodel', id: 'https://example.com/submodel/test' },
        { type: 'element', id: 'TestProperty' },
      ];

      // Act
      const result = ElementFinder.findParent(testEnvironment, path);

      // Assert
      expect(result).toBeDefined();
      expect(result!.element).toBe(testSubmodel);
      expect(result!.element.idShort).toBe('TestSubmodel');
    });

    it('should find parent of nested element', () => {
      // Arrange
      const path: ElementPath[] = [
        { type: 'submodel', id: 'https://example.com/submodel/test' },
        { type: 'element', id: 'TestCollection' },
        { type: 'element', id: 'NestedProperty' },
      ];

      // Act
      const result = ElementFinder.findParent(testEnvironment, path);

      // Assert
      expect(result).toBeDefined();
      expect(result!.element).toBe(testCollection);
      expect(result!.element.idShort).toBe('TestCollection');
    });

    it('should return null for empty path', () => {
      // Arrange
      const path: ElementPath[] = [];

      // Act
      const result = ElementFinder.findParent(testEnvironment, path);

      // Assert
      expect(result).toBeNull();
    });

    it('should find submodel as parent for root-level element', () => {
      // Arrange
      const path: ElementPath[] = [
        { type: 'element', id: 'TestProperty' },
      ];

      // Act
      const result = ElementFinder.findParent(testEnvironment, path);

      // Assert
      expect(result).toBeDefined();
      expect(result!.element).toBe(testSubmodel);
    });

    it('should return null if parent not found', () => {
      // Arrange
      const path: ElementPath[] = [
        { type: 'submodel', id: 'nonexistent' },
        { type: 'element', id: 'test' },
      ];

      // Act
      const result = ElementFinder.findParent(testEnvironment, path);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('buildPath', () => {
    it('should build path to element', () => {
      // Act
      const path = ElementFinder.buildPath(testEnvironment, 'TestProperty');

      // Assert
      expect(path).toBeDefined();
      expect(path).toHaveLength(2);
      expect(path![0]).toEqual({
        type: 'submodel',
        id: 'https://example.com/submodel/test',
      });
      expect(path![1]).toEqual({
        type: 'element',
        id: 'TestProperty',
      });
    });

    it('should build path to nested element', () => {
      // Act
      const path = ElementFinder.buildPath(testEnvironment, 'NestedProperty');

      // Assert
      expect(path).toBeDefined();
      expect(path).toHaveLength(3);
      expect(path![0].type).toBe('submodel');
      expect(path![1]).toEqual({ type: 'element', id: 'TestCollection' });
      expect(path![2]).toEqual({ type: 'element', id: 'NestedProperty' });
    });

    it('should return null if element not found', () => {
      // Act
      const path = ElementFinder.buildPath(testEnvironment, 'Nonexistent');

      // Assert
      expect(path).toBeNull();
    });

    it('should handle multiple submodels', () => {
      // Arrange
      const submodel2: Submodel = {
        id: 'https://example.com/submodel/test2',
        idShort: 'TestSubmodel2',
        submodelElements: [
          {
            modelType: AasSubmodelElements.Property,
            idShort: 'UniqueProperty',
            valueType: DataTypeDefXsd.String,
            value: 'test',
          } as Property,
        ],
      };
      testEnvironment.submodels!.push(submodel2);

      // Act
      const path = ElementFinder.buildPath(testEnvironment, 'UniqueProperty');

      // Assert
      expect(path).toBeDefined();
      expect(path![0].id).toBe('https://example.com/submodel/test2');
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety with generic return type', () => {
      // Arrange
      const path: ElementPath[] = [
        { type: 'submodel', id: 'https://example.com/submodel/test' },
        { type: 'element', id: 'TestProperty' },
      ];

      // Act
      const result = ElementFinder.findByPath<Property>(testEnvironment, path);

      // Assert - TypeScript should enforce this at compile time
      expect(result.element.modelType).toBe(AasSubmodelElements.Property);
      expect('valueType' in result.element).toBe(true);
      expect('value' in result.element).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle large environment efficiently', () => {
      // Arrange - Create environment with 1000 elements
      const largeSubmodel: Submodel = {
        id: 'https://example.com/large',
        idShort: 'Large',
        submodelElements: Array.from({ length: 1000 }, (_, i) => ({
          modelType: AasSubmodelElements.Property,
          idShort: `Property${i}`,
          valueType: DataTypeDefXsd.Int,
          value: String(i),
        } as Property)),
      };
      testEnvironment.submodels = [largeSubmodel];

      const path: ElementPath[] = [
        { type: 'submodel', id: 'https://example.com/large' },
        { type: 'element', id: 'Property999' },
      ];

      // Act
      const startTime = performance.now();
      const result = ElementFinder.findByPath(testEnvironment, path);
      const endTime = performance.now();

      // Assert
      expect(result).toBeDefined();
      expect(result.element.idShort).toBe('Property999');
      expect(endTime - startTime).toBeLessThan(10); // Should be < 10ms
    });
  });
});
