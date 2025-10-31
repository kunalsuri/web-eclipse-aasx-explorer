/**
 * Task 2.2.2: AAS Validation Rules Tests
 * 
 * Tests for Asset Administration Shell specific validation rules
 */

import { describe, it, expect } from "vitest";
import { validationEngine } from "@shared/aas-validation-engine";
import type { Environment, AssetAdministrationShell } from "@shared/aas-v3-types";
import { AssetKind, ReferenceTypes, KeyTypes } from "@shared/aas-v3-types";

describe("Task 2.2.2: AAS Validation Rules", () => {
  describe("aas-required-fields", () => {
    it("should pass for AAS with all required fields", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "https://example.com/aas/1",
            idShort: "TestAAS",
            assetInformation: {
              assetKind: AssetKind.Instance,
            },
          },
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(e => e.code === "AAS_MISSING_ID" || e.code === "AAS_MISSING_ASSET_INFORMATION");
      expect(errors).toHaveLength(0);
    });

    it("should fail when AAS has no id", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "",
            assetInformation: {
              assetKind: AssetKind.Instance,
            },
          } as AssetAdministrationShell,
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find(e => e.code === "AAS_MISSING_ID");
      expect(error).toBeDefined();
      expect(error?.path).toBe("assetAdministrationShells[0].id");
    });

    it("should fail when AAS has no assetInformation", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "https://example.com/aas/1",
          } as AssetAdministrationShell,
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find(e => e.code === "AAS_MISSING_ASSET_INFORMATION");
      expect(error).toBeDefined();
      expect(error?.path).toBe("assetAdministrationShells[0].assetInformation");
    });
  });

  describe("aas-asset-information-valid", () => {
    it("should pass for valid asset information", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "https://example.com/aas/1",
            assetInformation: {
              assetKind: AssetKind.Instance,
              globalAssetId: "https://example.com/asset/1",
              specificAssetIds: [
                {
                  name: "SerialNumber",
                  value: "SN12345",
                },
              ],
            },
          },
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(e => e.code.startsWith("ASSET_INFO"));
      expect(errors).toHaveLength(0);
    });

    it("should fail when assetKind is missing", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "https://example.com/aas/1",
            assetInformation: {} as any,
          },
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find(e => e.code === "ASSET_INFO_MISSING_KIND");
      expect(error).toBeDefined();
      expect(error?.path).toBe("assetAdministrationShells[0].assetInformation.assetKind");
    });

    it("should fail when assetKind has invalid value", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "https://example.com/aas/1",
            assetInformation: {
              assetKind: "InvalidKind" as any,
            },
          },
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find(e => e.code === "ASSET_INFO_INVALID_KIND");
      expect(error).toBeDefined();
      expect(error?.message).toContain("InvalidKind");
    });

    it("should validate all assetKind enum values", () => {
      const validKinds = [AssetKind.Type, AssetKind.Instance, AssetKind.NotApplicable];
      
      validKinds.forEach((kind) => {
        const env: Environment = {
          assetAdministrationShells: [
            {
              id: "https://example.com/aas/1",
              assetInformation: {
                assetKind: kind,
              },
            },
          ],
        };

        const result = validationEngine.validate(env);
        const errors = result.errors.filter(e => e.code === "ASSET_INFO_INVALID_KIND");
        expect(errors).toHaveLength(0);
      });
    });

    it("should fail when specificAssetId has no name", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "https://example.com/aas/1",
            assetInformation: {
              assetKind: AssetKind.Instance,
              specificAssetIds: [
                {
                  name: "",
                  value: "SN12345",
                },
              ],
            },
          },
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find(e => e.code === "SPECIFIC_ASSET_ID_MISSING_NAME");
      expect(error).toBeDefined();
    });

    it("should fail when specificAssetId has no value", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "https://example.com/aas/1",
            assetInformation: {
              assetKind: AssetKind.Instance,
              specificAssetIds: [
                {
                  name: "SerialNumber",
                  value: "",
                },
              ],
            },
          },
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find(e => e.code === "SPECIFIC_ASSET_ID_MISSING_VALUE");
      expect(error).toBeDefined();
    });
  });

  describe("aas-submodel-references-valid", () => {
    it("should pass when all submodel references resolve", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "https://example.com/aas/1",
            assetInformation: {
              assetKind: AssetKind.Instance,
            },
            submodels: [
              {
                type: ReferenceTypes.ModelReference,
                keys: [
                  {
                    type: KeyTypes.Submodel,
                    value: "https://example.com/sm/1",
                  },
                ],
              },
            ],
          },
        ],
        submodels: [
          {
            id: "https://example.com/sm/1",
            idShort: "TestSubmodel",
          },
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(e => e.code === "AAS_SUBMODEL_REF_NOT_FOUND");
      expect(errors).toHaveLength(0);
    });

    it("should fail when submodel reference does not resolve", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "https://example.com/aas/1",
            assetInformation: {
              assetKind: AssetKind.Instance,
            },
            submodels: [
              {
                type: ReferenceTypes.ModelReference,
                keys: [
                  {
                    type: KeyTypes.Submodel,
                    value: "https://example.com/sm/missing",
                  },
                ],
              },
            ],
          },
        ],
        submodels: [
          {
            id: "https://example.com/sm/1",
            idShort: "TestSubmodel",
          },
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find(e => e.code === "AAS_SUBMODEL_REF_NOT_FOUND");
      expect(error).toBeDefined();
      expect(error?.message).toContain("missing");
    });

    it("should pass for external submodel references", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "https://example.com/aas/1",
            assetInformation: {
              assetKind: AssetKind.Instance,
            },
            submodels: [
              {
                type: ReferenceTypes.ModelReference,
                keys: [
                  {
                    type: KeyTypes.Submodel,
                    value: "https://external.com/submodel/1",
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(e => e.code === "AAS_SUBMODEL_REF_NOT_FOUND");
      expect(errors).toHaveLength(0);
    });
  });

  describe("aas-administration-info-valid", () => {
    it("should pass for valid administration info", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "https://example.com/aas/1",
            assetInformation: {
              assetKind: AssetKind.Instance,
            },
            administration: {
              version: "1.0.0",
              revision: "1",
            },
          },
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(e => e.code.startsWith("ADMIN_"));
      expect(errors).toHaveLength(0);
    });

    it("should warn for invalid version format", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "https://example.com/aas/1",
            assetInformation: {
              assetKind: AssetKind.Instance,
            },
            administration: {
              version: "v1.0",
            },
          },
        ],
      };

      const result = validationEngine.validate(env);
      const warning = result.warnings.find(w => w.code === "ADMIN_INVALID_VERSION");
      expect(warning).toBeDefined();
    });

    it("should warn for invalid revision format", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "https://example.com/aas/1",
            assetInformation: {
              assetKind: AssetKind.Instance,
            },
            administration: {
              version: "1.0.0",
              revision: "rev1",
            },
          },
        ],
      };

      const result = validationEngine.validate(env);
      const warning = result.warnings.find(w => w.code === "ADMIN_INVALID_REVISION");
      expect(warning).toBeDefined();
    });

    it("should provide info when version without revision", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "https://example.com/aas/1",
            assetInformation: {
              assetKind: AssetKind.Instance,
            },
            administration: {
              version: "1.0.0",
            },
          },
        ],
      };

      const result = validationEngine.validate(env);
      const info = result.infos.find(i => i.code === "ADMIN_VERSION_WITHOUT_REVISION");
      expect(info).toBeDefined();
    });
  });

  describe("Performance", () => {
    it("should validate 100 AAS in reasonable time", () => {
      const aasArray = Array.from({ length: 100 }, (_, i) => ({
        id: `https://example.com/aas/${i}`,
        idShort: `AAS${i}`,
        assetInformation: {
          assetKind: AssetKind.Instance,
          globalAssetId: `https://example.com/asset/${i}`,
        },
        submodels: [
          {
            type: ReferenceTypes.ModelReference,
            keys: [
              {
                type: KeyTypes.Submodel,
                value: `https://example.com/sm/${i}`,
              },
            ],
          },
        ],
      }));

      const submodelArray = Array.from({ length: 100 }, (_, i) => ({
        id: `https://example.com/sm/${i}`,
        idShort: `Submodel${i}`,
      }));

      const env: Environment = {
        assetAdministrationShells: aasArray,
        submodels: submodelArray,
      };

      const startTime = performance.now();
      const result = validationEngine.validate(env);
      const endTime = performance.now();

      const aasErrors = result.errors.filter(e => 
        e.code.startsWith("AAS_") || e.code.startsWith("ASSET_INFO") || e.code.startsWith("ADMIN_")
      );
      expect(aasErrors).toHaveLength(0);
      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});
