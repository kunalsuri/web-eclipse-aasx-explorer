/**
 * Schema Validation Tests
 * Tests for Task 2.1.2: Implement schema validation
 */

import { describe, it, expect } from "vitest";
import { validationEngine } from "@shared/aas-validation-engine";
import type { Environment } from "@shared/aas-v3-types";

describe("Schema Validation - Task 2.1.2", () => {
  describe("Submodel Required Fields", () => {
    it("should detect missing submodel ID", () => {
      const env: Environment = {
        submodels: [
          {
            id: "",
            idShort: "TestSubmodel",
            submodelElements: [],
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find((e) => e.code === "SUBMODEL_MISSING_ID");
      expect(error).toBeDefined();
      expect(error?.path).toBe("submodels[0].id");
    });

    it("should detect missing submodel idShort", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel/1",
            idShort: "",
            submodelElements: [],
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find((e) => e.code === "SUBMODEL_MISSING_IDSHORT");
      expect(error).toBeDefined();
      expect(error?.path).toBe("submodels[0].idShort");
    });

    it("should pass validation for valid submodel", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel/1",
            idShort: "TestSubmodel",
            submodelElements: [],
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "SUBMODEL_MISSING_ID" || e.code === "SUBMODEL_MISSING_IDSHORT"
      );
      expect(errors.length).toBe(0);
    });
  });

  describe("SubmodelElement Required Fields", () => {
    it("should detect missing element idShort", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel/1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Property",
                idShort: "",
              } as any,
            ],
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find((e) => e.code === "ELEMENT_MISSING_IDSHORT");
      expect(error).toBeDefined();
    });

    it("should detect missing element modelType", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel/1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "TestProperty",
              } as any,
            ],
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find((e) => e.code === "ELEMENT_MISSING_MODELTYPE");
      expect(error).toBeDefined();
    });

    it("should validate nested elements recursively", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel/1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "SubmodelElementCollection",
                idShort: "Collection",
                value: [
                  {
                    modelType: "Property",
                    idShort: "",
                  } as any,
                ],
              } as any,
            ],
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find((e) => e.code === "ELEMENT_MISSING_IDSHORT");
      expect(error).toBeDefined();
      expect(error?.path).toContain("value[0]");
    });
  });

  describe("Property Type Validation", () => {
    it("should validate boolean property type", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel/1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Property",
                idShort: "BoolProp",
                valueType: "xs:boolean",
                value: "invalid",
              } as any,
            ],
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find((e) => e.code === "PROPERTY_TYPE_MISMATCH");
      expect(error).toBeDefined();
      expect(error?.path).toContain("submodelElements[0]");
    });

    it("should accept valid boolean values", () => {
      const validValues = ["true", "false", "0", "1"];

      validValues.forEach((value) => {
        const env: Environment = {
          submodels: [
            {
              id: "https://example.com/submodel/1",
              idShort: "TestSubmodel",
              submodelElements: [
                {
                  modelType: "Property",
                  idShort: "BoolProp",
                  valueType: "xs:boolean",
                  value,
                } as any,
              ],
            } as any,
          ],
        };

        const result = validationEngine.validate(env);
        const error = result.errors.find((e) => e.code === "PROPERTY_TYPE_MISMATCH");
        expect(error).toBeUndefined();
      });
    });

    it("should validate integer property type", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel/1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Property",
                idShort: "IntProp",
                valueType: "xs:int",
                value: "12.5",
              } as any,
            ],
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find((e) => e.code === "PROPERTY_TYPE_MISMATCH");
      expect(error).toBeDefined();
    });

    it("should accept valid integer values", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel/1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Property",
                idShort: "IntProp",
                valueType: "xs:int",
                value: "-42",
              } as any,
            ],
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find((e) => e.code === "PROPERTY_TYPE_MISMATCH");
      expect(error).toBeUndefined();
    });

    it("should validate float/double property type", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel/1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Property",
                idShort: "FloatProp",
                valueType: "xs:double",
                value: "not-a-number",
              } as any,
            ],
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find((e) => e.code === "PROPERTY_TYPE_MISMATCH");
      expect(error).toBeDefined();
    });

    it("should accept valid float values", () => {
      const validValues = ["3.14", "-2.5", "1e10", "1.5E-3"];

      validValues.forEach((value) => {
        const env: Environment = {
          submodels: [
            {
              id: "https://example.com/submodel/1",
              idShort: "TestSubmodel",
              submodelElements: [
                {
                  modelType: "Property",
                  idShort: "FloatProp",
                  valueType: "xs:double",
                  value,
                } as any,
              ],
            } as any,
          ],
        };

        const result = validationEngine.validate(env);
        const error = result.errors.find((e) => e.code === "PROPERTY_TYPE_MISMATCH");
        expect(error).toBeUndefined();
      });
    });

    it("should validate date property type", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel/1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Property",
                idShort: "DateProp",
                valueType: "xs:date",
                value: "not-a-date",
              } as any,
            ],
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find((e) => e.code === "PROPERTY_TYPE_MISMATCH");
      expect(error).toBeDefined();
    });

    it("should accept valid date values", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel/1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Property",
                idShort: "DateProp",
                valueType: "xs:date",
                value: "2024-10-14",
              } as any,
            ],
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find((e) => e.code === "PROPERTY_TYPE_MISMATCH");
      expect(error).toBeUndefined();
    });

    it("should validate Range min/max types", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel/1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Range",
                idShort: "TempRange",
                valueType: "xs:int",
                min: "10.5",
                max: "20.5",
              } as any,
            ],
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter((e) => e.code === "RANGE_TYPE_MISMATCH");
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe("Cardinality Validation", () => {
    it("should warn about empty SubmodelElementCollection", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel/1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "SubmodelElementCollection",
                idShort: "EmptyCollection",
                value: [],
              } as any,
            ],
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const warning = result.warnings.find((w) => w.code === "COLLECTION_EMPTY");
      expect(warning).toBeDefined();
    });

    it("should warn about empty SubmodelElementList", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel/1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "SubmodelElementList",
                idShort: "EmptyList",
                value: [],
              } as any,
            ],
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const warning = result.warnings.find((w) => w.code === "LIST_EMPTY");
      expect(warning).toBeDefined();
    });

    it("should detect type mismatch in SubmodelElementList", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel/1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "SubmodelElementList",
                idShort: "MixedList",
                typeValueListElement: "Property",
                value: [
                  {
                    modelType: "Property",
                    idShort: "Prop1",
                  },
                  {
                    modelType: "Range",
                    idShort: "Range1",
                  },
                ],
              } as any,
            ],
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find((e) => e.code === "LIST_TYPE_MISMATCH");
      expect(error).toBeDefined();
    });
  });

  describe("Asset Information Validation", () => {
    it("should detect missing assetKind", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "https://example.com/aas/1",
            idShort: "TestAAS",
            assetInformation: {
              globalAssetId: "https://example.com/asset/1",
            } as any,
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find((e) => e.code === "ASSET_INFO_MISSING_KIND");
      expect(error).toBeDefined();
    });

    it("should warn about missing globalAssetId", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "https://example.com/aas/1",
            idShort: "TestAAS",
            assetInformation: {
              assetKind: "Instance",
            } as any,
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const warning = result.warnings.find((w) => w.code === "ASSET_INFO_MISSING_GLOBAL_ID");
      expect(warning).toBeDefined();
    });

    it("should pass validation for complete asset information", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "https://example.com/aas/1",
            idShort: "TestAAS",
            assetInformation: {
              assetKind: "Instance",
              globalAssetId: "https://example.com/asset/1",
            } as any,
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "ASSET_INFO_MISSING_KIND" || e.code === "ASSET_INFO_MISSING_GLOBAL_ID"
      );
      expect(errors.length).toBe(0);
    });
  });

  describe("Schema Validation Preset", () => {
    it("should run only schema validation rules", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/submodel/1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Property",
                idShort: "TestProp",
                valueType: "xs:int",
                value: "not-an-int",
              } as any,
            ],
          } as any,
        ],
      };

      const result = validationEngine.validateWithPreset(env, "schema");
      
      // Should have schema errors
      const schemaError = result.errors.find((e) => e.code === "PROPERTY_TYPE_MISMATCH");
      expect(schemaError).toBeDefined();

      // Should not run reference integrity checks (not in schema preset)
      const refError = result.errors.find((e) => e.code === "BROKEN_REFERENCE");
      expect(refError).toBeUndefined();
    });
  });

  describe("Performance", () => {
    it("should validate large environment efficiently", () => {
      // Create environment with 100 submodels, each with 50 properties
      const env: Environment = {
        submodels: Array.from({ length: 100 }, (_, i) => ({
          id: `https://example.com/submodel/${i}`,
          idShort: `Submodel${i}`,
          submodelElements: Array.from({ length: 50 }, (_, j) => ({
            modelType: "Property",
            idShort: `Property${j}`,
            valueType: "xs:string",
            value: `Value${j}`,
          })),
        })) as any,
      };

      const startTime = Date.now();
      const result = validationEngine.validate(env);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(result.errors.length).toBe(0);
    });
  });
});
