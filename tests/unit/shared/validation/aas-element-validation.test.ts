/**
 * Tests for SubmodelElement Validation Rules (Task 2.2.4)
 * 
 * Tests cover:
 * - Property validation
 * - Range validation
 * - MultiLanguageProperty validation
 * - Collection validation
 * - List validation
 * - Operation validation
 * - Entity validation
 */

import { describe, it, expect } from "vitest";
import { validationEngine } from "@shared/aas-validation-engine";
import type { Environment, Submodel, SubmodelElement } from "@shared/aas-v3-types";

describe("SubmodelElement Validation Rules (Task 2.2.4)", () => {
  // ========================================================================
  // Test 1: Property Validation
  // ========================================================================

  describe("property-validation", () => {
    it("should error when Property has no valueType", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "Prop1",
                modelType: "Property",
                // No valueType
                value: "test",
              } as any,
            ],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "PROPERTY_MISSING_VALUE_TYPE"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("must have a valueType");
    });

    it("should pass when Property has valueType", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "Prop1",
                modelType: "Property",
                valueType: "xs:string",
                value: "test",
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "PROPERTY_MISSING_VALUE_TYPE"
      );

      expect(errors.length).toBe(0);
    });
  });

  // ========================================================================
  // Test 2: Range Validation
  // ========================================================================

  describe("range-validation", () => {
    it("should error when Range has no valueType", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "Range1",
                modelType: "Range",
                // No valueType
                min: "0",
                max: "100",
              } as any,
            ],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "RANGE_MISSING_VALUE_TYPE"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("must have a valueType");
    });

    it("should warn when Range has no min or max", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "Range1",
                modelType: "Range",
                valueType: "xs:int",
                // No min or max
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const warnings = result.warnings.filter(
        (w) => w.code === "RANGE_NO_VALUES"
      );

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].message).toContain("at least min or max");
    });

    it("should error when Range min > max", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "Range1",
                modelType: "Range",
                valueType: "xs:int",
                min: "100",
                max: "0", // min > max!
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "RANGE_MIN_GREATER_THAN_MAX"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("less than or equal to");
    });

    it("should pass when Range has valid min and max", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "Range1",
                modelType: "Range",
                valueType: "xs:int",
                min: "0",
                max: "100",
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const rangeErrors = result.errors.filter(
        (e) =>
          e.code === "RANGE_MISSING_VALUE_TYPE" ||
          e.code === "RANGE_MIN_GREATER_THAN_MAX"
      );

      expect(rangeErrors.length).toBe(0);
    });
  });

  // ========================================================================
  // Test 3: MultiLanguageProperty Validation
  // ========================================================================

  describe("multilanguage-property-validation", () => {
    it("should error when MultiLanguageProperty value is not an array", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "MLProp1",
                modelType: "MultiLanguageProperty",
                value: "not an array" as any,
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "MULTILANG_VALUE_NOT_ARRAY"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("must be an array");
    });

    it("should error when language string has no language", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "MLProp1",
                modelType: "MultiLanguageProperty",
                value: [
                  {
                    // No language
                    text: "Hello",
                  } as any,
                ],
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "MULTILANG_MISSING_LANGUAGE"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("must have a language code");
    });

    it("should error when language string has no text", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "MLProp1",
                modelType: "MultiLanguageProperty",
                value: [
                  {
                    language: "en",
                    // No text
                  } as any,
                ],
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "MULTILANG_MISSING_TEXT"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("must have text");
    });

    it("should warn when language code is invalid", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "MLProp1",
                modelType: "MultiLanguageProperty",
                value: [
                  {
                    language: "invalid123", // Invalid language code
                    text: "Hello",
                  },
                ],
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const warnings = result.warnings.filter(
        (w) => w.code === "MULTILANG_INVALID_LANGUAGE_CODE"
      );

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].message).toContain("Invalid language code");
    });

    it("should warn when duplicate language codes", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "MLProp1",
                modelType: "MultiLanguageProperty",
                value: [
                  {
                    language: "en",
                    text: "Hello",
                  },
                  {
                    language: "en", // Duplicate!
                    text: "Hi",
                  },
                ],
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const warnings = result.warnings.filter(
        (w) => w.code === "MULTILANG_DUPLICATE_LANGUAGE"
      );

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].message).toContain("Duplicate language code");
    });

    it("should pass when MultiLanguageProperty is valid", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "MLProp1",
                modelType: "MultiLanguageProperty",
                value: [
                  {
                    language: "en",
                    text: "Hello",
                  },
                  {
                    language: "de",
                    text: "Hallo",
                  },
                ],
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const mlErrors = result.errors.filter((e) =>
        e.code.startsWith("MULTILANG_")
      );

      expect(mlErrors.length).toBe(0);
    });
  });

  // ========================================================================
  // Test 4: Collection Validation
  // ========================================================================

  describe("collection-validation", () => {
    it("should provide info when collection is empty", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "Collection1",
                modelType: "SubmodelElementCollection",
                value: [], // Empty
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const infos = result.infos.filter((i) => i.code === "COLLECTION_EMPTY");

      expect(infos.length).toBeGreaterThan(0);
      expect(infos[0].message).toContain("is empty");
    });

    it("should pass when collection has elements", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "Collection1",
                modelType: "SubmodelElementCollection",
                value: [
                  {
                    idShort: "Prop1",
                    modelType: "Property",
                    valueType: "xs:string",
                  },
                ],
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const infos = result.infos.filter((i) => i.code === "COLLECTION_EMPTY");

      expect(infos.length).toBe(0);
    });
  });

  // ========================================================================
  // Test 5: List Validation
  // ========================================================================

  describe("list-validation", () => {
    it("should error when List with Property type has no valueTypeListElement", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "List1",
                modelType: "SubmodelElementList",
                typeValueListElement: "Property",
                // No valueTypeListElement
                value: [],
              } as any,
            ],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "LIST_MISSING_VALUE_TYPE"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("must have valueTypeListElement");
    });

    it("should provide info when list is empty", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "List1",
                modelType: "SubmodelElementList",
                typeValueListElement: "Property",
                valueTypeListElement: "xs:string",
                value: [], // Empty
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const infos = result.infos.filter((i) => i.code === "LIST_EMPTY");

      expect(infos.length).toBeGreaterThan(0);
      expect(infos[0].message).toContain("is empty");
    });

    it("should error when list element valueType doesn't match", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "List1",
                modelType: "SubmodelElementList",
                typeValueListElement: "Property",
                valueTypeListElement: "xs:string",
                value: [
                  {
                    idShort: "Prop1",
                    modelType: "Property",
                    valueType: "xs:int", // Mismatch!
                  },
                ],
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "LIST_VALUE_TYPE_MISMATCH"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("does not match");
    });

    it("should pass when list is valid", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "List1",
                modelType: "SubmodelElementList",
                typeValueListElement: "Property",
                valueTypeListElement: "xs:string",
                value: [
                  {
                    idShort: "Prop1",
                    modelType: "Property",
                    valueType: "xs:string",
                  },
                  {
                    idShort: "Prop2",
                    modelType: "Property",
                    valueType: "xs:string",
                  },
                ],
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const listErrors = result.errors.filter((e) =>
        e.code.startsWith("LIST_")
      );

      expect(listErrors.length).toBe(0);
    });
  });

  // ========================================================================
  // Test 6: Operation Validation
  // ========================================================================

  describe("operation-validation", () => {
    it("should warn when Operation has no variables", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "Op1",
                modelType: "Operation",
                // No variables
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const warnings = result.warnings.filter(
        (w) => w.code === "OPERATION_NO_VARIABLES"
      );

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].message).toContain("has no variables");
    });

    it("should error when operation variable has no value", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "Op1",
                modelType: "Operation",
                inputVariables: [
                  {
                    // No value
                  } as any,
                ],
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "OPERATION_VARIABLE_NO_VALUE"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("must have a value");
    });

    it("should pass when Operation is valid", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "Op1",
                modelType: "Operation",
                inputVariables: [
                  {
                    value: {
                      idShort: "Input1",
                      modelType: "Property",
                      valueType: "xs:string",
                    },
                  },
                ],
                outputVariables: [
                  {
                    value: {
                      idShort: "Output1",
                      modelType: "Property",
                      valueType: "xs:string",
                    },
                  },
                ],
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const opErrors = result.errors.filter((e) =>
        e.code.startsWith("OPERATION_")
      );

      expect(opErrors.length).toBe(0);
    });
  });

  // ========================================================================
  // Test 7: Entity Validation
  // ========================================================================

  describe("entity-validation", () => {
    it("should error when Entity has no entityType", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "Entity1",
                modelType: "Entity",
                // No entityType
              } as any,
            ],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "ENTITY_MISSING_TYPE"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("must have an entityType");
    });

    it("should error when Entity has invalid entityType", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "Entity1",
                modelType: "Entity",
                entityType: "InvalidType" as any,
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "ENTITY_INVALID_TYPE"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("Invalid entityType");
    });

    it("should warn when SelfManagedEntity has no globalAssetId", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "Entity1",
                modelType: "Entity",
                entityType: "SelfManagedEntity",
                // No globalAssetId
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const warnings = result.warnings.filter(
        (w) => w.code === "ENTITY_SELF_MANAGED_NO_GLOBAL_ID"
      );

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].message).toContain("should have a globalAssetId");
    });

    it("should pass when Entity is valid", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "Entity1",
                modelType: "Entity",
                entityType: "CoManagedEntity",
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const entityErrors = result.errors.filter((e) =>
        e.code.startsWith("ENTITY_")
      );

      expect(entityErrors.length).toBe(0);
    });
  });

  // ========================================================================
  // Test 8: Element Preset Validation
  // ========================================================================

  describe("element preset", () => {
    it("should validate with element preset", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "Prop1",
                modelType: "Property",
                // No valueType - should error
                value: "test",
              } as any,
              {
                idShort: "Range1",
                modelType: "Range",
                valueType: "xs:int",
                min: "100",
                max: "0", // min > max - should error
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validateWithPreset(env, "element");

      // Should have errors
      expect(result.errors.length).toBeGreaterThan(0);

      // Should have Property error
      const propErrors = result.errors.filter(
        (e) => e.code === "PROPERTY_MISSING_VALUE_TYPE"
      );
      expect(propErrors.length).toBeGreaterThan(0);

      // Should have Range error
      const rangeErrors = result.errors.filter(
        (e) => e.code === "RANGE_MIN_GREATER_THAN_MAX"
      );
      expect(rangeErrors.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // Test 9: Performance Test
  // ========================================================================

  describe("performance", () => {
    it("should validate large submodel with many elements efficiently", () => {
      // Create a submodel with 50 elements of various types
      const elements: SubmodelElement[] = [];
      for (let i = 0; i < 50; i++) {
        elements.push({
          idShort: `Prop${i}`,
          modelType: "Property",
          valueType: "xs:string",
          value: `value${i}`,
        } as SubmodelElement);
      }

      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "LargeSubmodel",
            submodelElements: elements,
          } as Submodel,
        ],
      };

      const startTime = Date.now();
      const result = validationEngine.validateWithPreset(env, "element");
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100); // Should complete in < 100ms
      expect(result.errors.length).toBe(0);
    });
  });
});
