/**
 * Environment Validation Tests
 * Tests for Task 2.2.1: Environment validation rules
 */

import { describe, it, expect } from "vitest";
import { validationEngine } from "@shared/aas-validation-engine";
import type { Environment } from "@shared/aas-v3-types";
import {
  AssetKind,
  ReferenceTypes,
  KeyTypes,
} from "@shared/aas-v3-types";

describe("Environment Validation - Task 2.2.1", () => {
  describe("Environment Has Content", () => {
    it("should detect empty environment", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find((e) => e.code === "ENV_EMPTY");
      expect(error).toBeDefined();
      expect(error?.message).toContain("at least one");
    });

    it("should pass with only AAS", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "aas1",
            idShort: "AAS1",
            assetInformation: {
              assetKind: AssetKind.Instance,
              globalAssetId: "asset1",
            },
          },
        ],
        submodels: [],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find((e) => e.code === "ENV_EMPTY");
      expect(error).toBeUndefined();
    });

    it("should pass with only Submodels", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
          },
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find((e) => e.code === "ENV_EMPTY");
      expect(error).toBeUndefined();
    });

    it("should pass with both AAS and Submodels", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "aas1",
            idShort: "AAS1",
            assetInformation: {
              assetKind: AssetKind.Instance,
              globalAssetId: "asset1",
            },
          },
        ],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
          },
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find((e) => e.code === "ENV_EMPTY");
      expect(error).toBeUndefined();
    });
  });

  describe("Unique Identifiers", () => {
    it("should detect duplicate AAS IDs", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "duplicate-id",
            idShort: "AAS1",
            assetInformation: {
              assetKind: AssetKind.Instance,
              globalAssetId: "asset1",
            },
          },
          {
            id: "duplicate-id",
            idShort: "AAS2",
            assetInformation: {
              assetKind: AssetKind.Instance,
              globalAssetId: "asset2",
            },
          },
        ],
        submodels: [],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find((e) => e.code === "DUPLICATE_ID");
      expect(error).toBeDefined();
      expect(error?.message).toContain("duplicate-id");
    });

    it("should detect duplicate Submodel IDs", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [
          {
            id: "duplicate-id",
            idShort: "Submodel1",
          },
          {
            id: "duplicate-id",
            idShort: "Submodel2",
          },
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find((e) => e.code === "DUPLICATE_ID");
      expect(error).toBeDefined();
      expect(error?.message).toContain("duplicate-id");
    });

    it("should detect duplicate ConceptDescription IDs", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [
          {
            id: "duplicate-id",
            idShort: "Concept1",
          } as any,
          {
            id: "duplicate-id",
            idShort: "Concept2",
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find((e) => e.code === "DUPLICATE_ID");
      expect(error).toBeDefined();
      expect(error?.message).toContain("duplicate-id");
    });

    it("should allow same ID across different types", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "same-id",
            idShort: "AAS1",
            assetInformation: {
              assetKind: AssetKind.Instance,
              globalAssetId: "asset1",
            },
          },
        ],
        submodels: [
          {
            id: "same-id",
            idShort: "Submodel1",
          },
        ],
        conceptDescriptions: [
          {
            id: "same-id",
            idShort: "Concept1",
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      // IDs only need to be unique within their type, so this should pass
      const errors = result.errors.filter((e) => e.code === "DUPLICATE_ID");
      expect(errors).toHaveLength(0);
    });

    it("should pass with all unique IDs", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "aas1",
            idShort: "AAS1",
            assetInformation: {
              assetKind: AssetKind.Instance,
              globalAssetId: "asset1",
            },
          },
          {
            id: "aas2",
            idShort: "AAS2",
            assetInformation: {
              assetKind: AssetKind.Instance,
              globalAssetId: "asset2",
            },
          },
        ],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
          },
          {
            id: "sm2",
            idShort: "Submodel2",
          },
        ],
        conceptDescriptions: [
          {
            id: "cd1",
            idShort: "Concept1",
          } as any,
          {
            id: "cd2",
            idShort: "Concept2",
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter((e) => e.code === "DUPLICATE_ID");
      expect(errors).toHaveLength(0);
    });
  });

  describe("Environment Structure Completeness", () => {
    it("should warn about AAS without submodels", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "aas1",
            idShort: "AAS1",
            assetInformation: {
              assetKind: AssetKind.Instance,
              globalAssetId: "asset1",
            },
            // No submodels array
          },
        ],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
          },
        ],
      };

      const result = validationEngine.validate(env);
      const warning = result.warnings.find((w) => w.code === "AAS_NO_SUBMODELS");
      expect(warning).toBeDefined();
    });

    it("should warn about orphaned submodels", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "aas1",
            idShort: "AAS1",
            assetInformation: {
              assetKind: AssetKind.Instance,
              globalAssetId: "asset1",
            },
            submodels: [
              {
                type: ReferenceTypes.ModelReference,
                keys: [{ type: KeyTypes.Submodel, value: "sm1" }],
              },
            ],
          },
        ],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
          },
          {
            id: "sm2",
            idShort: "Submodel2", // Orphaned - not referenced by any AAS
          },
        ],
      };

      const result = validationEngine.validate(env);
      const warning = result.warnings.find((w) => w.code === "ORPHANED_SUBMODEL");
      expect(warning).toBeDefined();
      expect(warning?.message).toContain("sm2");
    });

    it("should warn about unused concept descriptions", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
            semanticId: {
              type: ReferenceTypes.ModelReference,
              keys: [{ type: KeyTypes.ConceptDescription, value: "cd1" }],
            },
          },
        ],
        conceptDescriptions: [
          {
            id: "cd1",
            idShort: "Concept1",
          } as any,
          {
            id: "cd2",
            idShort: "Concept2", // Unused - not referenced
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const warning = result.warnings.find((w) => w.code === "UNUSED_CONCEPT_DESCRIPTION");
      expect(warning).toBeDefined();
      expect(warning?.message).toContain("cd2");
    });

    it("should pass with complete structure", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "aas1",
            idShort: "AAS1",
            assetInformation: {
              assetKind: AssetKind.Instance,
              globalAssetId: "asset1",
            },
            submodels: [
              {
                type: ReferenceTypes.ModelReference,
                keys: [{ type: KeyTypes.Submodel, value: "sm1" }],
              },
            ],
          },
        ],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
            semanticId: {
              type: ReferenceTypes.ModelReference,
              keys: [{ type: KeyTypes.ConceptDescription, value: "cd1" }],
            },
          },
        ],
        conceptDescriptions: [
          {
            id: "cd1",
            idShort: "Concept1",
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const warnings = result.warnings.filter(
        (w) =>
          w.code === "AAS_NO_SUBMODELS" ||
          w.code === "ORPHANED_SUBMODEL" ||
          w.code === "UNUSED_CONCEPT_DESCRIPTION"
      );
      expect(warnings).toHaveLength(0);
    });
  });

  describe("Environment Consistency", () => {
    it("should detect inconsistent modeling kinds", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [
          {
            id: "sm1",
            idShort: "TemplateSubmodel",
            kind: "Template",
            submodelElements: [
              {
                idShort: "Property1",
                modelType: "Property",
                valueType: "xs:string",
                value: "instance-value", // Template shouldn't have instance values
              } as any,
            ],
          },
        ],
      };

      const result = validationEngine.validate(env);
      const warning = result.warnings.find(
        (w) => w.code === "TEMPLATE_WITH_VALUES"
      );
      expect(warning).toBeDefined();
    });

    it("should warn about missing descriptions", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "aas1",
            idShort: "AAS1",
            assetInformation: {
              assetKind: AssetKind.Instance,
              globalAssetId: "asset1",
            },
            // No description
          },
        ],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
            // No description
          },
        ],
      };

      const result = validationEngine.validate(env);
      // Missing descriptions are info level, not warnings
      const infos = result.infos.filter(
        (i) => i.code === "MISSING_DESCRIPTION"
      );
      expect(infos.length).toBeGreaterThan(0);
    });

    it("should validate environment metadata", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "aas1",
            idShort: "AAS1",
            assetInformation: {
              assetKind: AssetKind.Instance,
              globalAssetId: "asset1",
            },
          },
        ],
        submodels: [],
      };

      const result = validationEngine.validate(env);
      // Should not have critical errors
      expect(result.errors.length).toBe(0);
    });
  });

  describe("Environment Validation Preset", () => {
    it("should run environment validation rules", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [],
      };

      const result = validationEngine.validate(env);

      // Should detect empty environment
      const error = result.errors.find((e) => e.code === "ENV_EMPTY");
      expect(error).toBeDefined();
    });
  });

  describe("Performance", () => {
    it("should validate large environment efficiently", () => {
      // Create environment with 100 AAS, 200 submodels, 100 concepts
      const env: Environment = {
        assetAdministrationShells: Array.from({ length: 100 }, (_, i) => ({
          id: `aas${i}`,
          idShort: `AAS${i}`,
          assetInformation: {
            assetKind: AssetKind.Instance,
            globalAssetId: `asset${i}`,
          },
          submodels: [
            {
              type: ReferenceTypes.ModelReference,
              keys: [{ type: KeyTypes.Submodel, value: `sm${i * 2}` }],
            },
            {
              type: ReferenceTypes.ModelReference,
              keys: [{ type: KeyTypes.Submodel, value: `sm${i * 2 + 1}` }],
            },
          ],
        })),
        submodels: Array.from({ length: 200 }, (_, i) => ({
          id: `sm${i}`,
          idShort: `Submodel${i}`,
          semanticId: {
            type: ReferenceTypes.ModelReference,
            keys: [{ type: KeyTypes.ConceptDescription, value: `cd${i % 100}` }],
          },
        })),
        conceptDescriptions: Array.from({ length: 100 }, (_, i) => ({
          id: `cd${i}`,
          idShort: `Concept${i}`,
        })) as any,
      };

      const startTime = Date.now();
      const result = validationEngine.validate(env);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500); // Should complete in < 500ms
      expect(result.errors.filter((e) => e.code === "DUPLICATE_ID")).toHaveLength(0);
    });
  });
});
