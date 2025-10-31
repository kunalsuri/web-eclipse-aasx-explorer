/**
 * Tests for AASd Specification Constraints
 * 
 * Comprehensive test suite for all AASd validation rules
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ValidationEngine } from "@shared/aas-validation-engine";
import type { Environment } from "@shared/aas-v3-types";
import { AssetKind, AasSubmodelElements, KeyTypes, ReferenceTypes } from "@shared/aas-v3-types";

describe("AASd Constraint Validation", () => {
  let engine: ValidationEngine;

  beforeEach(() => {
    engine = new ValidationEngine();
  });

  describe("AASd-002: IdShort Pattern Validation", () => {
    it("should accept valid idShort patterns", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "https://example.com/aas1",
            idShort: "ValidIdShort",
            assetInformation: {
              assetKind: AssetKind.Instance,
            },
          },
        ],
      };

      const result = engine.validateWithRules(env, ["AASd-002"]);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject idShort starting with digit", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "https://example.com/aas1",
            idShort: "1InvalidIdShort",
            assetInformation: {
              assetKind: AssetKind.Instance,
            },
          },
        ],
      };

      const result = engine.validateWithRules(env, ["AASd-002"]);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe("AASd-002");
    });

    it("should reject idShort with special characters", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/sm1",
            idShort: "Invalid-IdShort",
          },
        ],
      };

      const result = engine.validateWithRules(env, ["AASd-002"]);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe("AASd-002");
    });

    it("should accept idShort with underscores", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/sm1",
            idShort: "Valid_Id_Short_123",
          },
        ],
      };

      const result = engine.validateWithRules(env, ["AASd-002"]);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("AASd-021: Identifiable Must Have Valid ID", () => {
    it("should reject empty ID", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "",
            idShort: "TestAAS",
            assetInformation: {
              assetKind: AssetKind.Instance,
            },
          },
        ],
      };

      const result = engine.validateWithRules(env, ["AASd-021"]);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe("AASd-021");
    });

    it("should reject duplicate IDs", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "https://example.com/duplicate",
            idShort: "AAS1",
            assetInformation: { assetKind: AssetKind.Instance },
          },
          {
            id: "https://example.com/duplicate",
            idShort: "AAS2",
            assetInformation: { assetKind: AssetKind.Instance },
          },
        ],
      };

      const result = engine.validateWithRules(env, ["AASd-021"]);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe("AASd-021");
    });
  });

  describe("AASd-022: IdShort Uniqueness Within Parent", () => {
    it("should reject duplicate idShort in same parent", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/sm1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "DuplicateElement",
                modelType: AasSubmodelElements.Property,
                valueType: "xs:string",
              } as any,
              {
                idShort: "DuplicateElement",
                modelType: AasSubmodelElements.Property,
                valueType: "xs:int",
              } as any,
            ],
          },
        ],
      };

      const result = engine.validateWithRules(env, ["AASd-022"]);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe("AASd-022");
    });

    it("should allow same idShort in different parents", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/sm1",
            idShort: "Submodel1",
            submodelElements: [
              {
                idShort: "Temperature",
                modelType: AasSubmodelElements.Property,
                valueType: "xs:double",
              } as any,
            ],
          },
          {
            id: "https://example.com/sm2",
            idShort: "Submodel2",
            submodelElements: [
              {
                idShort: "Temperature",
                modelType: AasSubmodelElements.Property,
                valueType: "xs:double",
              } as any,
            ],
          },
        ],
      };

      const result = engine.validateWithRules(env, ["AASd-022"]);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("AASd-116: Reference Keys Not Empty", () => {
    it("should reject reference with empty keys array", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "https://example.com/aas1",
            idShort: "TestAAS",
            assetInformation: { assetKind: AssetKind.Instance },
            submodels: [
              {
                type: ReferenceTypes.ModelReference,
                keys: [],
              },
            ],
          },
        ],
      };

      const result = engine.validateWithRules(env, ["AASd-116"]);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe("AASd-116");
    });

    it("should reject key with empty value", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "https://example.com/aas1",
            idShort: "TestAAS",
            assetInformation: { assetKind: AssetKind.Instance },
            submodels: [
              {
                type: ReferenceTypes.ModelReference,
                keys: [
                  {
                    type: KeyTypes.Submodel,
                    value: "",
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = engine.validateWithRules(env, ["AASd-116"]);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe("AASd-116");
    });
  });

  describe("AASd-118: SupplementalSemanticId Requires SemanticId", () => {
    it("should reject supplementalSemanticIds without semanticId", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/sm1",
            idShort: "TestSubmodel",
            supplementalSemanticIds: [
              {
                type: ReferenceTypes.ExternalReference,
                keys: [{ type: KeyTypes.GlobalReference, value: "https://example.com/semantic" }],
              },
            ],
          },
        ],
      };

      const result = engine.validateWithRules(env, ["AASd-118"]);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe("AASd-118");
    });

    it("should accept supplementalSemanticIds with semanticId", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/sm1",
            idShort: "TestSubmodel",
            semanticId: {
              type: ReferenceTypes.ExternalReference,
              keys: [{ type: KeyTypes.GlobalReference, value: "https://example.com/primary" }],
            },
            supplementalSemanticIds: [
              {
                type: ReferenceTypes.ExternalReference,
                keys: [{ type: KeyTypes.GlobalReference, value: "https://example.com/supplemental" }],
              },
            ],
          },
        ],
      };

      const result = engine.validateWithRules(env, ["AASd-118"]);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("AASd-130: MultiLanguageProperty Unique Languages", () => {
    it("should reject duplicate language codes", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/sm1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "Description",
                modelType: AasSubmodelElements.MultiLanguageProperty,
                value: [
                  { language: "en", text: "English text" },
                  { language: "en", text: "Duplicate English" },
                  { language: "de", text: "German text" },
                ],
              } as any,
            ],
          },
        ],
      };

      const result = engine.validateWithRules(env, ["AASd-130"]);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe("AASd-130");
    });

    it("should accept unique language codes", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/sm1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "Description",
                modelType: AasSubmodelElements.MultiLanguageProperty,
                value: [
                  { language: "en", text: "English text" },
                  { language: "de", text: "German text" },
                  { language: "fr", text: "French text" },
                ],
              } as any,
            ],
          },
        ],
      };

      const result = engine.validateWithRules(env, ["AASd-130"]);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("AASd-131: Range Min Max Constraint", () => {
    it("should reject range where min > max", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/sm1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "InvalidRange",
                modelType: AasSubmodelElements.Range,
                valueType: "xs:double",
                min: "100",
                max: "50",
              } as any,
            ],
          },
        ],
      };

      const result = engine.validateWithRules(env, ["AASd-131"]);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe("AASd-131");
    });

    it("should accept range where min <= max", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/sm1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "ValidRange",
                modelType: AasSubmodelElements.Range,
                valueType: "xs:double",
                min: "0",
                max: "100",
              } as any,
            ],
          },
        ],
      };

      const result = engine.validateWithRules(env, ["AASd-131"]);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("AASd-007: SubmodelElementList Type Uniformity", () => {
    it("should reject mixed types in SubmodelElementList", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/sm1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "MixedList",
                modelType: AasSubmodelElements.SubmodelElementList,
                value: [
                  { modelType: AasSubmodelElements.Property, valueType: "xs:string" },
                  { modelType: AasSubmodelElements.Range, valueType: "xs:double" },
                ],
              } as any,
            ],
          },
        ],
      };

      const result = engine.validateWithRules(env, ["AASd-007"]);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe("AASd-007");
    });

    it("should accept uniform types in SubmodelElementList", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/sm1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "UniformList",
                modelType: AasSubmodelElements.SubmodelElementList,
                value: [
                  { idShort: "Prop1", modelType: AasSubmodelElements.Property, valueType: "xs:string" } as any,
                  { idShort: "Prop2", modelType: AasSubmodelElements.Property, valueType: "xs:string" } as any,
                ],
              } as any,
            ],
          },
        ],
      };

      const result = engine.validateWithRules(env, ["AASd-007"]);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("AASd-107: Property ValueType Valid", () => {
    it("should reject invalid valueType", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/sm1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "InvalidProperty",
                modelType: AasSubmodelElements.Property,
                valueType: "invalidType" as any,
              } as any,
            ],
          },
        ],
      };

      const result = engine.validateWithRules(env, ["AASd-107"]);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe("AASd-107");
    });

    it("should accept valid XSD data types", () => {
      const env: Environment = {
        submodels: [
          {
            id: "https://example.com/sm1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                idShort: "StringProperty",
                modelType: AasSubmodelElements.Property,
                valueType: "xs:string",
              } as any,
              {
                idShort: "IntProperty",
                modelType: AasSubmodelElements.Property,
                valueType: "xs:int",
              } as any,
              {
                idShort: "BoolProperty",
                modelType: AasSubmodelElements.Property,
                valueType: "xs:boolean",
              } as any,
            ],
          },
        ],
      };

      const result = engine.validateWithRules(env, ["AASd-107"]);
      expect(result.errors).toHaveLength(0);
    });
  });
});
