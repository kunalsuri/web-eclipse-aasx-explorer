/**
 * AAS Package Creator Service
 * Creates new empty AAS packages from scratch
 * Based on C# implementation: PackageCentral.cs:47-70
 */

import { v4 as uuidv4 } from "uuid";
import type {
  Environment,
  AssetAdministrationShell,
  Submodel,
  AssetInformation,
  Property,
  SubmodelElementCollection,
} from "../../../shared/aas-v3-types";
import {
  AssetKind,
  ModelingKind,
  ReferenceTypes,
  KeyTypes,
  AasSubmodelElements,
  DataTypeDefXsd,
} from "../../../shared/aas-v3-types";

// ============================================================================
// Types
// ============================================================================

export interface CreatePackageOptions {
  packageName?: string;
  includeDefaultAAS?: boolean;
  includeDefaultSubmodel?: boolean;
}

export interface PackageCreationResult {
  success: boolean;
  packageId: string;
  environment: Environment;
  metadata: PackageMetadata;
  error?: string;
}

export interface PackageMetadata {
  id: string;
  name: string;
  createdAt: string;
  lastModified: string;
  version: string;
}

// ============================================================================
// AAS Package Creator
// ============================================================================

export class AasPackageCreator {
  /**
   * Create a new empty AAS package
   * Mirrors C# implementation: PackageCentral.New()
   */
  static createNewPackage(options: CreatePackageOptions = {}): PackageCreationResult {
    try {
      const {
        packageName = "New Package",
        includeDefaultAAS = false,
        includeDefaultSubmodel = false,
      } = options;

      // Generate unique package ID
      const packageId = uuidv4();

      // Create empty environment (mirrors AdminShellPackageEnvBase.cs:249)
      const environment: Environment = {
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [],
      };

      // Optionally add default AAS
      if (includeDefaultAAS) {
        const defaultAAS = this.createDefaultAAS();
        environment.assetAdministrationShells = [defaultAAS];

        // Optionally add default submodel
        if (includeDefaultSubmodel) {
          const defaultSubmodel = this.createDefaultSubmodel();
          environment.submodels = [defaultSubmodel];

          // Link submodel to AAS
          defaultAAS.submodels = [
            {
              type: ReferenceTypes.ModelReference,
              keys: [
                {
                  type: KeyTypes.Submodel,
                  value: defaultSubmodel.id,
                },
              ],
            },
          ];
        }
      }

      // Create metadata
      const metadata: PackageMetadata = {
        id: packageId,
        name: packageName,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: "1.0.0",
      };

      return {
        success: true,
        packageId,
        environment,
        metadata,
      };
    } catch (error) {
      return {
        success: false,
        packageId: "",
        environment: {
          assetAdministrationShells: [],
          submodels: [],
          conceptDescriptions: [],
        },
        metadata: {
          id: "",
          name: "",
          createdAt: "",
          lastModified: "",
          version: "",
        },
        error: `Failed to create package: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Create a default Asset Administration Shell
   */
  private static createDefaultAAS(): AssetAdministrationShell {
    const aasId = `https://example.com/ids/aas/${uuidv4()}`;

    return {
      id: aasId,
      idShort: "DefaultAAS",
      displayName: [
        {
          language: "en",
          text: "Default Asset Administration Shell",
        },
      ],
      description: [
        {
          language: "en",
          text: "A default AAS created from template",
        },
      ],
      assetInformation: this.createDefaultAssetInformation(),
      submodels: [],
    };
  }

  /**
   * Create default asset information
   */
  private static createDefaultAssetInformation(): AssetInformation {
    return {
      assetKind: AssetKind.Instance,
      globalAssetId: `https://example.com/ids/asset/${uuidv4()}`,
      specificAssetIds: [],
    };
  }

  /**
   * Create a default Submodel
   */
  private static createDefaultSubmodel(): Submodel {
    const submodelId = `https://example.com/ids/sm/${uuidv4()}`;

    return {
      id: submodelId,
      idShort: "DefaultSubmodel",
      kind: ModelingKind.Instance,
      displayName: [
        {
          language: "en",
          text: "Default Submodel",
        },
      ],
      description: [
        {
          language: "en",
          text: "A default submodel created from template",
        },
      ],
      submodelElements: [],
    };
  }

  /**
   * Create an AAS from a template
   */
  static createFromTemplate(templateType: string): PackageCreationResult {
    const options: CreatePackageOptions = {
      packageName: `${templateType} Package`,
      includeDefaultAAS: true,
      includeDefaultSubmodel: true,
    };

    const result = this.createNewPackage(options);

    if (!result.success) {
      return result;
    }

    // Customize based on template type
    switch (templateType) {
      case "digital-nameplate":
        this.applyDigitalNameplateTemplate(result.environment);
        break;
      case "technical-data":
        this.applyTechnicalDataTemplate(result.environment);
        break;
      case "empty":
      default:
        // Already empty, no changes needed
        break;
    }

    return result;
  }

  /**
   * Apply Digital Nameplate template
   */
  private static applyDigitalNameplateTemplate(environment: Environment): void {
    if (!environment.submodels || environment.submodels.length === 0) {
      return;
    }

    const submodel = environment.submodels[0];
    submodel.idShort = "DigitalNameplate";
    submodel.semanticId = {
      type: ReferenceTypes.ExternalReference,
      keys: [
        {
          type: KeyTypes.GlobalReference,
          value: "https://admin-shell.io/zvei/nameplate/1/0/Nameplate",
        },
      ],
    };

    // Add common nameplate properties
    submodel.submodelElements = [
      {
        modelType: AasSubmodelElements.Property,
        idShort: "ManufacturerName",
        valueType: DataTypeDefXsd.String,
        semanticId: {
          type: ReferenceTypes.ExternalReference,
          keys: [
            {
              type: KeyTypes.GlobalReference,
              value: "0173-1#02-AAO677#002",
            },
          ],
        },
      } as Property,
      {
        modelType: AasSubmodelElements.Property,
        idShort: "ManufacturerProductDesignation",
        valueType: DataTypeDefXsd.String,
        semanticId: {
          type: ReferenceTypes.ExternalReference,
          keys: [
            {
              type: KeyTypes.GlobalReference,
              value: "0173-1#02-AAW338#001",
            },
          ],
        },
      } as Property,
      {
        modelType: AasSubmodelElements.Property,
        idShort: "SerialNumber",
        valueType: DataTypeDefXsd.String,
        semanticId: {
          type: ReferenceTypes.ExternalReference,
          keys: [
            {
              type: KeyTypes.GlobalReference,
              value: "0173-1#02-AAM556#002",
            },
          ],
        },
      } as Property,
    ];
  }

  /**
   * Apply Technical Data template
   */
  private static applyTechnicalDataTemplate(environment: Environment): void {
    if (!environment.submodels || environment.submodels.length === 0) {
      return;
    }

    const submodel = environment.submodels[0];
    submodel.idShort = "TechnicalData";
    submodel.semanticId = {
      type: ReferenceTypes.ExternalReference,
      keys: [
        {
          type: KeyTypes.GlobalReference,
          value: "https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/2",
        },
      ],
    };

    // Add common technical data properties
    submodel.submodelElements = [
      {
        modelType: AasSubmodelElements.SubmodelElementCollection,
        idShort: "GeneralInformation",
        value: [
          {
            modelType: AasSubmodelElements.Property,
            idShort: "ProductClass",
            valueType: DataTypeDefXsd.String,
          } as Property,
          {
            modelType: AasSubmodelElements.Property,
            idShort: "ProductArticleNumber",
            valueType: DataTypeDefXsd.String,
          } as Property,
        ],
      } as SubmodelElementCollection,
      {
        modelType: AasSubmodelElements.SubmodelElementCollection,
        idShort: "TechnicalProperties",
        value: [
          {
            modelType: AasSubmodelElements.Property,
            idShort: "Weight",
            valueType: DataTypeDefXsd.Double,
          } as Property,
          {
            modelType: AasSubmodelElements.Property,
            idShort: "Dimensions",
            valueType: DataTypeDefXsd.String,
          } as Property,
        ],
      } as SubmodelElementCollection,
    ];
  }

  /**
   * Validate package before creation
   */
  static validatePackageOptions(options: CreatePackageOptions): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (options.packageName && options.packageName.length > 255) {
      errors.push("Package name must be less than 255 characters");
    }

    if (options.packageName && !/^[a-zA-Z0-9\s\-_]+$/.test(options.packageName)) {
      errors.push("Package name contains invalid characters");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
