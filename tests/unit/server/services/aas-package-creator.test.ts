/**
 * Tests for AAS Package Creator Service
 */

import { describe, it, expect } from "vitest";
import { AasPackageCreator } from "../../../../server/src/services/aas-package-creator";
import { AssetKind, ModelingKind } from "../../../../shared/aas-v3-types";

describe("AasPackageCreator", () => {
  describe("createNewPackage", () => {
    it("should create an empty package with default options", () => {
      const result = AasPackageCreator.createNewPackage();

      expect(result.success).toBe(true);
      expect(result.packageId).toBeTruthy();
      expect(result.environment).toBeDefined();
      expect(result.environment.assetAdministrationShells).toEqual([]);
      expect(result.environment.submodels).toEqual([]);
      expect(result.environment.conceptDescriptions).toEqual([]);
      expect(result.metadata.name).toBe("New Package");
    });

    it("should create a package with custom name", () => {
      const result = AasPackageCreator.createNewPackage({
        packageName: "Test Package",
      });

      expect(result.success).toBe(true);
      expect(result.metadata.name).toBe("Test Package");
    });

    it("should create a package with default AAS", () => {
      const result = AasPackageCreator.createNewPackage({
        includeDefaultAAS: true,
      });

      expect(result.success).toBe(true);
      expect(result.environment.assetAdministrationShells).toHaveLength(1);

      const aas = result.environment.assetAdministrationShells![0];
      expect(aas.id).toBeTruthy();
      expect(aas.idShort).toBe("DefaultAAS");
      expect(aas.assetInformation).toBeDefined();
      expect(aas.assetInformation.assetKind).toBe(AssetKind.Instance);
    });

    it("should create a package with default AAS and Submodel", () => {
      const result = AasPackageCreator.createNewPackage({
        includeDefaultAAS: true,
        includeDefaultSubmodel: true,
      });

      expect(result.success).toBe(true);
      expect(result.environment.assetAdministrationShells).toHaveLength(1);
      expect(result.environment.submodels).toHaveLength(1);

      const aas = result.environment.assetAdministrationShells![0];
      const submodel = result.environment.submodels![0];

      expect(submodel.id).toBeTruthy();
      expect(submodel.idShort).toBe("DefaultSubmodel");
      expect(submodel.kind).toBe(ModelingKind.Instance);

      // Check that submodel is linked to AAS
      expect(aas.submodels).toHaveLength(1);
      expect(aas.submodels![0].keys[0].value).toBe(submodel.id);
    });

    it("should not include submodel if AAS is not included", () => {
      const result = AasPackageCreator.createNewPackage({
        includeDefaultAAS: false,
        includeDefaultSubmodel: true,
      });

      expect(result.success).toBe(true);
      expect(result.environment.assetAdministrationShells).toEqual([]);
      expect(result.environment.submodels).toEqual([]);
    });

    it("should generate unique IDs for each package", () => {
      const result1 = AasPackageCreator.createNewPackage();
      const result2 = AasPackageCreator.createNewPackage();

      expect(result1.packageId).not.toBe(result2.packageId);
    });

    it("should include metadata with timestamps", () => {
      const result = AasPackageCreator.createNewPackage();

      expect(result.metadata.id).toBe(result.packageId);
      expect(result.metadata.createdAt).toBeTruthy();
      expect(result.metadata.lastModified).toBeTruthy();
      expect(result.metadata.version).toBe("1.0.0");
    });
  });

  describe("createFromTemplate", () => {
    it("should create empty template", () => {
      const result = AasPackageCreator.createFromTemplate("empty");

      expect(result.success).toBe(true);
      expect(result.environment.assetAdministrationShells).toHaveLength(1);
      expect(result.environment.submodels).toHaveLength(1);
    });

    it("should create digital nameplate template", () => {
      const result = AasPackageCreator.createFromTemplate("digital-nameplate");

      expect(result.success).toBe(true);
      expect(result.environment.submodels).toHaveLength(1);

      const submodel = result.environment.submodels![0];
      expect(submodel.idShort).toBe("DigitalNameplate");
      expect(submodel.semanticId).toBeDefined();
      expect(submodel.submodelElements).toHaveLength(3);

      // Check for expected properties
      const propertyIds = submodel.submodelElements!.map((e) => e.idShort);
      expect(propertyIds).toContain("ManufacturerName");
      expect(propertyIds).toContain("ManufacturerProductDesignation");
      expect(propertyIds).toContain("SerialNumber");
    });

    it("should create technical data template", () => {
      const result = AasPackageCreator.createFromTemplate("technical-data");

      expect(result.success).toBe(true);
      expect(result.environment.submodels).toHaveLength(1);

      const submodel = result.environment.submodels![0];
      expect(submodel.idShort).toBe("TechnicalData");
      expect(submodel.semanticId).toBeDefined();
      expect(submodel.submodelElements).toHaveLength(2);

      // Check for expected collections
      const collectionIds = submodel.submodelElements!.map((e) => e.idShort);
      expect(collectionIds).toContain("GeneralInformation");
      expect(collectionIds).toContain("TechnicalProperties");
    });
  });

  describe("validatePackageOptions", () => {
    it("should validate valid package name", () => {
      const result = AasPackageCreator.validatePackageOptions({
        packageName: "Valid Package Name",
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject package name that is too long", () => {
      const longName = "a".repeat(256);
      const result = AasPackageCreator.validatePackageOptions({
        packageName: longName,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Package name must be less than 255 characters"
      );
    });

    it("should reject package name with invalid characters", () => {
      const result = AasPackageCreator.validatePackageOptions({
        packageName: "Invalid@Name#",
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Package name contains invalid characters");
    });

    it("should allow package name with dashes and underscores", () => {
      const result = AasPackageCreator.validatePackageOptions({
        packageName: "Valid-Package_Name-123",
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
