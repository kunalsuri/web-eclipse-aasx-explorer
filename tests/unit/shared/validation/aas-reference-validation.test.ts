/**
 * Reference Integrity Validation Tests
 * Tests for Task 2.1.3: Add reference integrity validation
 */

import { describe, it, expect } from "vitest";
import { validationEngine } from "@shared/aas-validation-engine";
import type { Environment } from "@shared/aas-v3-types";
import {
  AssetKind,
  ReferenceTypes,
  KeyTypes,
  AasSubmodelElements,
} from "@shared/aas-v3-types";

describe("Reference Integrity Validation", () => {
  describe("Enhanced Reference Checking", () => {
    it("should detect broken submodel references", () => {
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
                keys: [{ type: KeyTypes.Submodel, value: "nonexistent-submodel" }],
              },
            ],
          },
        ],
        submodels: [],
      };

      const result = validationEngine.validateWithPreset(env, "reference");

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe("BROKEN_REFERENCE");
      expect(result.errors[0].message).toContain("nonexistent-submodel");
    });

    it("should validate correct submodel references", () => {
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
        ],
      };

      const result = validationEngine.validateWithPreset(env, "reference");

      const brokenRefErrors = result.errors.filter(
        (e) => e.code === "BROKEN_REFERENCE"
      );
      expect(brokenRefErrors).toHaveLength(0);
    });

    it("should validate derivedFrom references", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "aas1",
            idShort: "AAS1",
            assetInformation: {
              assetKind: AssetKind.Instance,
              globalAssetId: "asset1",
            },
            derivedFrom: {
              type: ReferenceTypes.ModelReference,
              keys: [{ type: KeyTypes.AssetAdministrationShell, value: "aas2" }],
            },
          },
          {
            id: "aas2",
            idShort: "AAS2",
            assetInformation: {
              assetKind: AssetKind.Type,
              globalAssetId: "asset2",
            },
          },
        ],
        submodels: [],
      };

      const result = validationEngine.validateWithPreset(env, "reference");

      const brokenRefErrors = result.errors.filter(
        (e) => e.code === "BROKEN_REFERENCE"
      );
      expect(brokenRefErrors).toHaveLength(0);
    });

    it("should allow external semantic ID references", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
            semanticId: {
              type: ReferenceTypes.ExternalReference,
              keys: [
                {
                  type: KeyTypes.GlobalReference,
                  value: "https://example.com/semantic/id",
                },
              ],
            },
          },
        ],
      };

      const result = validationEngine.validateWithPreset(env, "reference");

      const brokenRefErrors = result.errors.filter(
        (e) => e.code === "BROKEN_REFERENCE"
      );
      expect(brokenRefErrors).toHaveLength(0);
    });

    it("should validate ReferenceElement references", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
            submodelElements: [
              {
                idShort: "RefElement",
                modelType: AasSubmodelElements.ReferenceElement,
                value: {
                  type: ReferenceTypes.ModelReference,
                  keys: [{ type: KeyTypes.Submodel, value: "sm2" }],
                },
              } as any,
            ],
          },
        ],
      };

      const result = validationEngine.validateWithPreset(env, "reference");

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === "BROKEN_REFERENCE")).toBe(
        true
      );
    });

    it("should validate RelationshipElement references", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
            submodelElements: [
              {
                idShort: "Relationship",
                modelType: AasSubmodelElements.RelationshipElement,
                first: {
                  type: ReferenceTypes.ModelReference,
                  keys: [{ type: KeyTypes.Property, value: "prop1" }],
                },
                second: {
                  type: ReferenceTypes.ModelReference,
                  keys: [{ type: KeyTypes.Property, value: "prop2" }],
                },
              } as any,
            ],
          },
        ],
      };

      const result = validationEngine.validateWithPreset(env, "reference");

      expect(result.isValid).toBe(false);
      expect(
        result.errors.filter((e) => e.code === "BROKEN_REFERENCE").length
      ).toBeGreaterThan(0);
    });
  });

  describe("Circular Reference Detection", () => {
    it("should detect circular derivedFrom references", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "aas1",
            idShort: "AAS1",
            assetInformation: {
              assetKind: AssetKind.Instance,
              globalAssetId: "asset1",
            },
            derivedFrom: {
              type: ReferenceTypes.ModelReference,
              keys: [{ type: KeyTypes.AssetAdministrationShell, value: "aas2" }],
            },
          },
          {
            id: "aas2",
            idShort: "AAS2",
            assetInformation: {
              assetKind: AssetKind.Instance,
              globalAssetId: "asset2",
            },
            derivedFrom: {
              type: ReferenceTypes.ModelReference,
              keys: [{ type: KeyTypes.AssetAdministrationShell, value: "aas1" }],
            },
          },
        ],
        submodels: [],
      };

      const result = validationEngine.validateWithPreset(env, "reference");

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.code === "CIRCULAR_REFERENCE")
      ).toBe(true);
    });

    it("should detect self-referencing derivedFrom", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "aas1",
            idShort: "AAS1",
            assetInformation: {
              assetKind: AssetKind.Instance,
              globalAssetId: "asset1",
            },
            derivedFrom: {
              type: ReferenceTypes.ModelReference,
              keys: [{ type: KeyTypes.AssetAdministrationShell, value: "aas1" }],
            },
          },
        ],
        submodels: [],
      };

      const result = validationEngine.validateWithPreset(env, "reference");

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.code === "CIRCULAR_REFERENCE")
      ).toBe(true);
    });

    it("should allow valid derivedFrom chains", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "aas1",
            idShort: "AAS1",
            assetInformation: {
              assetKind: AssetKind.Instance,
              globalAssetId: "asset1",
            },
            derivedFrom: {
              type: ReferenceTypes.ModelReference,
              keys: [{ type: KeyTypes.AssetAdministrationShell, value: "aas2" }],
            },
          },
          {
            id: "aas2",
            idShort: "AAS2",
            assetInformation: {
              assetKind: AssetKind.Type,
              globalAssetId: "asset2",
            },
          },
        ],
        submodels: [],
      };

      const result = validationEngine.validateWithPreset(env, "reference");

      expect(
        result.errors.some((e) => e.code === "CIRCULAR_REFERENCE")
      ).toBe(false);
    });
  });

  describe("Key Structure Validation", () => {
    it("should detect empty keys array", () => {
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
                keys: [],
              },
            ],
          },
        ],
        submodels: [],
      };

      const result = validationEngine.validateWithPreset(env, "reference");

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.code === "REFERENCE_EMPTY_KEYS")
      ).toBe(true);
    });

    it("should detect missing key type", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
            semanticId: {
              type: ReferenceTypes.ExternalReference,
              keys: [
                {
                  type: "" as any,
                  value: "https://example.com/semantic",
                },
              ],
            },
          },
        ],
      };

      const result = validationEngine.validateWithPreset(env, "reference");

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === "KEY_MISSING_TYPE")).toBe(
        true
      );
    });

    it("should detect missing key value", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
            semanticId: {
              type: ReferenceTypes.ExternalReference,
              keys: [
                {
                  type: KeyTypes.GlobalReference,
                  value: "",
                },
              ],
            },
          },
        ],
      };

      const result = validationEngine.validateWithPreset(env, "reference");

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === "KEY_MISSING_VALUE")).toBe(
        true
      );
    });

    it("should detect invalid key type", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
            semanticId: {
              type: ReferenceTypes.ExternalReference,
              keys: [
                {
                  type: "InvalidKeyType" as any,
                  value: "https://example.com/semantic",
                },
              ],
            },
          },
        ],
      };

      const result = validationEngine.validateWithPreset(env, "reference");

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === "KEY_INVALID_TYPE")).toBe(
        true
      );
    });

    it("should detect missing reference type", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
            semanticId: {
              type: "" as any,
              keys: [
                {
                  type: KeyTypes.GlobalReference,
                  value: "https://example.com/semantic",
                },
              ],
            },
          },
        ],
      };

      const result = validationEngine.validateWithPreset(env, "reference");

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.code === "REFERENCE_MISSING_TYPE")
      ).toBe(true);
    });

    it("should detect invalid reference type", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
            semanticId: {
              type: "InvalidRefType" as any,
              keys: [
                {
                  type: KeyTypes.GlobalReference,
                  value: "https://example.com/semantic",
                },
              ],
            },
          },
        ],
      };

      const result = validationEngine.validateWithPreset(env, "reference");

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.code === "REFERENCE_INVALID_TYPE")
      ).toBe(true);
    });

    it("should validate correct key structure", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
            semanticId: {
              type: ReferenceTypes.ExternalReference,
              keys: [
                {
                  type: KeyTypes.GlobalReference,
                  value: "https://example.com/semantic",
                },
              ],
            },
          },
        ],
      };

      const result = validationEngine.validateWithPreset(env, "reference");

      const keyErrors = result.errors.filter(
        (e) =>
          e.code === "KEY_MISSING_TYPE" ||
          e.code === "KEY_MISSING_VALUE" ||
          e.code === "KEY_INVALID_TYPE" ||
          e.code === "REFERENCE_MISSING_TYPE" ||
          e.code === "REFERENCE_INVALID_TYPE"
      );
      expect(keyErrors).toHaveLength(0);
    });
  });

  describe("Reference Type Validation", () => {
    it("should detect reference type mismatch for submodel", () => {
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
                keys: [{ type: KeyTypes.Submodel, value: "aas2" }],
              },
            ],
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
        submodels: [],
      };

      const result = validationEngine.validateWithPreset(env, "reference");

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.code === "REFERENCE_TYPE_MISMATCH")
      ).toBe(true);
    });

    it("should detect reference type mismatch for derivedFrom", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "aas1",
            idShort: "AAS1",
            assetInformation: {
              assetKind: AssetKind.Instance,
              globalAssetId: "asset1",
            },
            derivedFrom: {
              type: ReferenceTypes.ModelReference,
              keys: [{ type: KeyTypes.AssetAdministrationShell, value: "sm1" }],
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

      const result = validationEngine.validateWithPreset(env, "reference");

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.code === "REFERENCE_TYPE_MISMATCH")
      ).toBe(true);
    });

    it("should validate correct reference types", () => {
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
            derivedFrom: {
              type: ReferenceTypes.ModelReference,
              keys: [{ type: KeyTypes.AssetAdministrationShell, value: "aas2" }],
            },
          },
          {
            id: "aas2",
            idShort: "AAS2",
            assetInformation: {
              assetKind: AssetKind.Type,
              globalAssetId: "asset2",
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

      const result = validationEngine.validateWithPreset(env, "reference");

      const typeErrors = result.errors.filter(
        (e) => e.code === "REFERENCE_TYPE_MISMATCH"
      );
      expect(typeErrors).toHaveLength(0);
    });

    it("should detect key type mismatch warning", () => {
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
                keys: [{ type: KeyTypes.Property, value: "sm1" }], // Wrong key type
              },
            ],
          },
        ],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
          },
        ],
      };

      const result = validationEngine.validateWithPreset(env, "reference");

      expect(
        result.warnings.some((w) => w.code === "KEY_TYPE_MISMATCH")
      ).toBe(true);
    });
  });

  describe("Nested Reference Validation", () => {
    it("should validate references in nested SubmodelElementCollections", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
            submodelElements: [
              {
                idShort: "Collection",
                modelType: AasSubmodelElements.SubmodelElementCollection,
                value: [
                  {
                    idShort: "RefElement",
                    modelType: AasSubmodelElements.ReferenceElement,
                    value: {
                      type: ReferenceTypes.ModelReference,
                      keys: [{ type: KeyTypes.Submodel, value: "sm2" }],
                    },
                  } as any,
                ],
              } as any,
            ],
          },
        ],
      };

      const result = validationEngine.validateWithPreset(env, "reference");

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === "BROKEN_REFERENCE")).toBe(
        true
      );
    });

    it("should validate references in SubmodelElementLists", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
            submodelElements: [
              {
                idShort: "List",
                modelType: AasSubmodelElements.SubmodelElementList,
                typeValueListElement: AasSubmodelElements.ReferenceElement,
                value: [
                  {
                    idShort: "RefElement1",
                    modelType: AasSubmodelElements.ReferenceElement,
                    value: {
                      type: ReferenceTypes.ModelReference,
                      keys: [{ type: KeyTypes.Submodel, value: "sm2" }],
                    },
                  } as any,
                ],
              } as any,
            ],
          },
        ],
      };

      const result = validationEngine.validateWithPreset(env, "reference");

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === "BROKEN_REFERENCE")).toBe(
        true
      );
    });
  });

  describe("Performance", () => {
    it("should validate large environment with many references quickly", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [],
      };

      // Create 100 submodels with references
      for (let i = 0; i < 100; i++) {
        env.submodels!.push({
          id: `sm${i}`,
          idShort: `Submodel${i}`,
          semanticId: {
            type: ReferenceTypes.ExternalReference,
            keys: [
              {
                type: KeyTypes.GlobalReference,
                value: `https://example.com/semantic/${i}`,
              },
            ],
          },
          submodelElements: [
            {
              idShort: `RefElement${i}`,
              modelType: AasSubmodelElements.ReferenceElement,
              value: {
                type: ReferenceTypes.ModelReference,
                keys: [{ type: KeyTypes.Submodel, value: `sm${(i + 1) % 100}` }],
              },
            } as any,
          ],
        });
      }

      const startTime = Date.now();
      const result = validationEngine.validateWithPreset(env, "reference");
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100); // Should complete in < 100ms
      expect(result.errors.filter((e) => e.code === "BROKEN_REFERENCE")).toHaveLength(0);
    });
  });
});
