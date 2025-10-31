/**
 * Tests for Submodel Validation Rules (Task 2.2.3)
 * 
 * Tests cover:
 * - Submodel semantic ID validation
 * - Element structure validation
 * - Kind consistency validation
 * - Qualifier validation
 * - idShort uniqueness validation
 */

import { describe, it, expect } from "vitest";
import { validationEngine } from "@shared/aas-validation-engine";
import type { Environment, Submodel, SubmodelElement } from "@shared/aas-v3-types";

describe("Submodel Validation Rules (Task 2.2.3)", () => {
  // ========================================================================
  // Test 1: Submodel Semantic ID Validation
  // ========================================================================

  describe("submodel-semantic-id-valid", () => {
    it("should warn when submodel has no semantic ID", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            // No semanticId
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const warnings = result.warnings.filter(
        (w) => w.code === "SUBMODEL_NO_SEMANTIC_ID"
      );

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].message).toContain("has no semantic ID");
    });

    it("should error when semantic ID has no keys", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            semanticId: {
              type: "ExternalReference",
              keys: [], // Empty keys
            },
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "SUBMODEL_SEMANTIC_ID_NO_KEYS"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("has no keys");
    });

    it("should pass when submodel has valid semantic ID", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            semanticId: {
              type: "ExternalReference",
              keys: [
                {
                  type: "GlobalReference",
                  value: "https://example.com/concept1",
                },
              ],
            },
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "SUBMODEL_SEMANTIC_ID_NO_KEYS"
      );

      expect(errors.length).toBe(0);
    });
  });

  // ========================================================================
  // Test 2: Element Structure Validation
  // ========================================================================

  describe("submodel-element-structure-valid", () => {
    it("should error when element has no modelType", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "Element1",
                // No modelType
              } as any,
            ],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "ELEMENT_MISSING_MODEL_TYPE"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("must have a modelType");
    });

    it("should error when SubmodelElementCollection value is not an array", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "Collection1",
                modelType: "SubmodelElementCollection",
                value: "not an array" as any,
              } as any,
            ],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "COLLECTION_VALUE_NOT_ARRAY"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("must be an array");
    });

    it("should error when SubmodelElementList has no typeValueListElement", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "List1",
                modelType: "SubmodelElementList",
                // No typeValueListElement
                value: [],
              } as any,
            ],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "LIST_MISSING_TYPE"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("must have typeValueListElement");
    });

    it("should error when SubmodelElementList elements have mismatched types", () => {
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
                value: [
                  {
                    idShort: "Prop1",
                    modelType: "Property",
                    valueType: "xs:string",
                  },
                  {
                    idShort: "Prop2",
                    modelType: "Range", // Wrong type!
                    valueType: "xs:int",
                  },
                ],
              } as any,
            ],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "LIST_TYPE_MISMATCH"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("does not match expected type");
    });

    it("should error when Blob has no contentType", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "Blob1",
                modelType: "Blob",
                // No contentType
                value: "base64data",
              } as any,
            ],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "BLOB_MISSING_CONTENT_TYPE"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("must have contentType");
    });

    it("should error when File has no contentType", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "File1",
                modelType: "File",
                // No contentType
                value: "/path/to/file.pdf",
              } as any,
            ],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "FILE_MISSING_CONTENT_TYPE"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("must have contentType");
    });

    it("should error when RelationshipElement has no first reference", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "Rel1",
                modelType: "RelationshipElement",
                // No first
                second: {
                  type: "ModelReference",
                  keys: [{ type: "Property", value: "Prop2" }],
                },
              } as any,
            ],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "RELATIONSHIP_MISSING_FIRST"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("must have first reference");
    });

    it("should error when RelationshipElement has no second reference", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "Rel1",
                modelType: "RelationshipElement",
                first: {
                  type: "ModelReference",
                  keys: [{ type: "Property", value: "Prop1" }],
                },
                // No second
              } as any,
            ],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "RELATIONSHIP_MISSING_SECOND"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("must have second reference");
    });

    it("should pass when all element structures are valid", () => {
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
              {
                idShort: "Blob1",
                modelType: "Blob",
                contentType: "application/octet-stream",
                value: "base64data",
              },
              {
                idShort: "File1",
                modelType: "File",
                contentType: "application/pdf",
                value: "/path/to/file.pdf",
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const structureErrors = result.errors.filter(
        (e) =>
          e.code === "ELEMENT_MISSING_MODEL_TYPE" ||
          e.code === "BLOB_MISSING_CONTENT_TYPE" ||
          e.code === "FILE_MISSING_CONTENT_TYPE"
      );

      expect(structureErrors.length).toBe(0);
    });
  });

  // ========================================================================
  // Test 3: Kind Consistency Validation
  // ========================================================================

  describe("submodel-kind-consistency", () => {
    it("should warn when Template submodel has instance values", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TemplateSubmodel",
            kind: "Template",
            submodelElements: [
              {
                idShort: "Prop1",
                modelType: "Property",
                valueType: "xs:string",
                value: "This is a value", // Template should not have values
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const warnings = result.warnings.filter(
        (w) => w.code === "SUBMODEL_TEMPLATE_WITH_VALUES"
      );

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].message).toContain("Template submodel");
      expect(warnings[0].message).toContain("contains instance values");
    });

    it("should provide info when Instance submodel has elements without values", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "InstanceSubmodel",
            kind: "Instance",
            submodelElements: [
              {
                idShort: "Prop1",
                modelType: "Property",
                valueType: "xs:string",
                // No value
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const infos = result.infos.filter(
        (i) => i.code === "SUBMODEL_INSTANCE_WITHOUT_VALUES"
      );

      expect(infos.length).toBeGreaterThan(0);
      expect(infos[0].message).toContain("Instance submodel");
      expect(infos[0].message).toContain("without values");
    });

    it("should pass when Template submodel has no values", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TemplateSubmodel",
            kind: "Template",
            submodelElements: [
              {
                idShort: "Prop1",
                modelType: "Property",
                valueType: "xs:string",
                // No value - correct for template
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const warnings = result.warnings.filter(
        (w) => w.code === "SUBMODEL_TEMPLATE_WITH_VALUES"
      );

      expect(warnings.length).toBe(0);
    });

    it("should pass when Instance submodel has values", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "InstanceSubmodel",
            kind: "Instance",
            submodelElements: [
              {
                idShort: "Prop1",
                modelType: "Property",
                valueType: "xs:string",
                value: "test value",
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const infos = result.infos.filter(
        (i) => i.code === "SUBMODEL_INSTANCE_WITHOUT_VALUES"
      );

      expect(infos.length).toBe(0);
    });
  });

  // ========================================================================
  // Test 4: Qualifier Validation
  // ========================================================================

  describe("submodel-qualifier-validation", () => {
    it("should error when qualifier has no type", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            qualifiers: [
              {
                // No type
                valueType: "xs:string",
                value: "test",
              } as any,
            ],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "QUALIFIER_MISSING_TYPE"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("must have a type");
    });

    it("should error when qualifier has no valueType", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            qualifiers: [
              {
                type: "TestQualifier",
                // No valueType
                value: "test",
              } as any,
            ],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "QUALIFIER_MISSING_VALUE_TYPE"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("must have a valueType");
    });

    it("should error when qualifier has invalid valueType", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            qualifiers: [
              {
                type: "TestQualifier",
                valueType: "invalid:type" as any,
                value: "test",
              },
            ],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "QUALIFIER_INVALID_VALUE_TYPE"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("Invalid qualifier valueType");
    });

    it("should error when qualifier has invalid kind", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            qualifiers: [
              {
                type: "TestQualifier",
                valueType: "xs:string",
                kind: "InvalidKind" as any,
                value: "test",
              },
            ],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "QUALIFIER_INVALID_KIND"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("Invalid qualifier kind");
    });

    it("should validate qualifiers in nested elements", () => {
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
                qualifiers: [
                  {
                    // No type
                    valueType: "xs:string",
                    value: "test",
                  } as any,
                ],
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "QUALIFIER_MISSING_TYPE"
      );

      expect(errors.length).toBeGreaterThan(0);
    });

    it("should pass when qualifiers are valid", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            qualifiers: [
              {
                type: "TestQualifier",
                valueType: "xs:string",
                kind: "ValueQualifier",
                value: "test",
              },
            ],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const qualifierErrors = result.errors.filter(
        (e) =>
          e.code === "QUALIFIER_MISSING_TYPE" ||
          e.code === "QUALIFIER_MISSING_VALUE_TYPE" ||
          e.code === "QUALIFIER_INVALID_VALUE_TYPE" ||
          e.code === "QUALIFIER_INVALID_KIND"
      );

      expect(qualifierErrors.length).toBe(0);
    });
  });

  // ========================================================================
  // Test 5: idShort Uniqueness Validation
  // ========================================================================

  describe("submodel-element-idshort-unique", () => {
    it("should error when duplicate idShort at same level", () => {
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
              },
              {
                idShort: "Prop1", // Duplicate!
                modelType: "Property",
                valueType: "xs:int",
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "DUPLICATE_IDSHORT"
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("Duplicate idShort");
      expect(errors[0].message).toContain("Prop1");
    });

    it("should allow same idShort at different levels", () => {
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
              },
              {
                idShort: "Collection1",
                modelType: "SubmodelElementCollection",
                value: [
                  {
                    idShort: "Prop1", // Same as parent level, but OK
                    modelType: "Property",
                    valueType: "xs:int",
                  },
                ],
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "DUPLICATE_IDSHORT"
      );

      expect(errors.length).toBe(0);
    });

    it("should detect duplicates in nested collections", () => {
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
                  {
                    idShort: "Prop1", // Duplicate in collection!
                    modelType: "Property",
                    valueType: "xs:int",
                  },
                ],
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "DUPLICATE_IDSHORT"
      );

      expect(errors.length).toBeGreaterThan(0);
    });

    it("should pass when all idShorts are unique at each level", () => {
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
              },
              {
                idShort: "Prop2",
                modelType: "Property",
                valueType: "xs:int",
              },
              {
                idShort: "Collection1",
                modelType: "SubmodelElementCollection",
                value: [
                  {
                    idShort: "NestedProp1",
                    modelType: "Property",
                    valueType: "xs:string",
                  },
                  {
                    idShort: "NestedProp2",
                    modelType: "Property",
                    valueType: "xs:int",
                  },
                ],
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "DUPLICATE_IDSHORT"
      );

      expect(errors.length).toBe(0);
    });
  });

  // ========================================================================
  // Test 6: Submodel Preset Validation
  // ========================================================================

  describe("submodel preset", () => {
    it("should validate with submodel preset", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel1",
            idShort: "TestSubmodel",
            // No semantic ID - should warn
            submodelElements: [
              {
                idShort: "Prop1",
                modelType: "Property",
                valueType: "xs:string",
              },
              {
                idShort: "Prop1", // Duplicate - should error
                modelType: "Property",
                valueType: "xs:int",
              },
            ] as SubmodelElement[],
          } as Submodel,
        ],
      };

      const result = validationEngine.validateWithPreset(env, "submodel");

      // Should have warnings about missing semantic ID
      const semanticWarnings = result.warnings.filter(
        (w) => w.code === "SUBMODEL_NO_SEMANTIC_ID"
      );
      expect(semanticWarnings.length).toBeGreaterThan(0);

      // Should have errors about duplicate idShort
      const duplicateErrors = result.errors.filter(
        (e) => e.code === "DUPLICATE_IDSHORT"
      );
      expect(duplicateErrors.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // Test 7: Performance Test
  // ========================================================================

  describe("performance", () => {
    it("should validate large submodel efficiently", () => {
      // Create a submodel with 100 elements
      const elements: SubmodelElement[] = [];
      for (let i = 0; i < 100; i++) {
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
            semanticId: {
              type: "ExternalReference",
              keys: [
                {
                  type: "GlobalReference",
                  value: "https://example.com/concept1",
                },
              ],
            },
            submodelElements: elements,
          } as Submodel,
        ],
      };

      const startTime = Date.now();
      const result = validationEngine.validateWithPreset(env, "submodel");
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100); // Should complete in < 100ms
      expect(result.errors.length).toBe(0);
    });
  });
});
