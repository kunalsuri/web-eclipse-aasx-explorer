/**
 * Sample AAS Data Generator
 * Creates sample AAS environments for testing and demonstration
 */

import type {
    Environment,
    AssetAdministrationShell,
    Submodel,
    Property,
    SubmodelElementCollection,
} from "./aas-v3-types";
import type {
    Environment,
    AssetAdministrationShell,
    Submodel,
    Property,
    SubmodelElementCollection,
} from "./aas-v3-types";
import {
    AssetKind,
    ModelingKind,
    DataTypeDefXsd,
    AasSubmodelElements,
    ReferenceTypes,
    KeyTypes,
} from "./aas-v3-types";
import {
    createReference,
    createLangStringName,
    createLangStringText,
} from "./aas-serialization";

/**
 * Create a sample AAS Environment
 */
export function createSampleEnvironment(): Environment {
    const aasId = "https://example.com/ids/aas/1234_5678_9012_3456";
    const submodelTechnicalDataId =
        "https://example.com/ids/sm/1234_5678_9012_3457";
    const submodelDocumentationId =
        "https://example.com/ids/sm/1234_5678_9012_3458";

    const aas = createSampleAAS(aasId, [
        submodelTechnicalDataId,
        submodelDocumentationId,
    ]);
    const technicalDataSubmodel = createSampleTechnicalDataSubmodel(
        submodelTechnicalDataId
    );
    const documentationSubmodel = createSampleDocumentationSubmodel(
        submodelDocumentationId
    );

    return {
        assetAdministrationShells: [aas],
        submodels: [technicalDataSubmodel, documentationSubmodel],
        conceptDescriptions: [],
    };
}

/**
 * Create a sample Asset Administration Shell
 */
export function createSampleAAS(
    id: string,
    submodelIds: string[]
): AssetAdministrationShell {
    return {
        id,
        idShort: "SampleAAS",
        displayName: [createLangStringName("Sample Asset Administration Shell", "en")],
        description: [
            createLangStringText(
                "This is a sample AAS for demonstration purposes",
                "en"
            ),
        ],
        assetInformation: {
            assetKind: AssetKind.Instance,
            globalAssetId: "https://example.com/ids/asset/1234_5678_9012_3456",
            assetType: "Product",
            specificAssetIds: [
                {
                    name: "SerialNumber",
                    value: "SN-12345-67890",
                    semanticId: createReference(
                        "https://example.com/ids/cd/SerialNumber",
                        ReferenceTypes.ExternalReference,
                        KeyTypes.GlobalReference
                    ),
                },
                {
                    name: "ManufacturerPartNumber",
                    value: "MPN-ABC-123",
                    semanticId: createReference(
                        "https://example.com/ids/cd/ManufacturerPartNumber",
                        ReferenceTypes.ExternalReference,
                        KeyTypes.GlobalReference
                    ),
                },
            ],
        },
        submodels: submodelIds.map((smId) =>
            createReference(smId, ReferenceTypes.ModelReference, KeyTypes.Submodel)
        ),
    };
}

/**
 * Create a sample Technical Data Submodel
 */
export function createSampleTechnicalDataSubmodel(id: string): Submodel {
    const generalInfo: SubmodelElementCollection = {
        modelType: AasSubmodelElements.SubmodelElementCollection,
        idShort: "GeneralInformation",
        displayName: [createLangStringName("General Information", "en")],
        description: [
            createLangStringText("General information about the product", "en"),
        ],
        value: [
            {
                modelType: AasSubmodelElements.Property,
                idShort: "ManufacturerName",
                displayName: [createLangStringName("Manufacturer Name", "en")],
                valueType: DataTypeDefXsd.String,
                value: "Example Manufacturing Corp.",
            } as Property,
            {
                modelType: AasSubmodelElements.Property,
                idShort: "ManufacturerProductDesignation",
                displayName: [
                    createLangStringName("Manufacturer Product Designation", "en"),
                ],
                valueType: DataTypeDefXsd.String,
                value: "Industrial Motor XM-2000",
            } as Property,
            {
                modelType: AasSubmodelElements.Property,
                idShort: "ProductArticleNumberOfManufacturer",
                displayName: [
                    createLangStringName("Product Article Number of Manufacturer", "en"),
                ],
                valueType: DataTypeDefXsd.String,
                value: "XM-2000-A1",
            } as Property,
        ],
    };

    const technicalProperties: SubmodelElementCollection = {
        modelType: AasSubmodelElements.SubmodelElementCollection,
        idShort: "TechnicalProperties",
        displayName: [createLangStringName("Technical Properties", "en")],
        description: [
            createLangStringText("Technical specifications of the product", "en"),
        ],
        value: [
            {
                modelType: AasSubmodelElements.Property,
                idShort: "NominalVoltage",
                displayName: [createLangStringName("Nominal Voltage", "en")],
                valueType: DataTypeDefXsd.Double,
                value: "400",
                semanticId: createReference(
                    "0173-1#02-AAZ819#001",
                    ReferenceTypes.ExternalReference,
                    KeyTypes.GlobalReference
                ),
            } as Property,
            {
                modelType: AasSubmodelElements.Property,
                idShort: "NominalPower",
                displayName: [createLangStringName("Nominal Power", "en")],
                valueType: DataTypeDefXsd.Double,
                value: "15000",
                semanticId: createReference(
                    "0173-1#02-AAZ820#001",
                    ReferenceTypes.ExternalReference,
                    KeyTypes.GlobalReference
                ),
            } as Property,
            {
                modelType: AasSubmodelElements.Property,
                idShort: "NominalSpeed",
                displayName: [createLangStringName("Nominal Speed", "en")],
                valueType: DataTypeDefXsd.Integer,
                value: "1500",
                semanticId: createReference(
                    "0173-1#02-AAZ821#001",
                    ReferenceTypes.ExternalReference,
                    KeyTypes.GlobalReference
                ),
            } as Property,
            {
                modelType: AasSubmodelElements.Property,
                idShort: "Weight",
                displayName: [createLangStringName("Weight", "en")],
                valueType: DataTypeDefXsd.Double,
                value: "250.5",
                semanticId: createReference(
                    "0173-1#02-AAB713#005",
                    ReferenceTypes.ExternalReference,
                    KeyTypes.GlobalReference
                ),
            } as Property,
        ],
    };

    return {
        id,
        idShort: "TechnicalData",
        kind: ModelingKind.Instance,
        displayName: [createLangStringName("Technical Data", "en")],
        description: [
            createLangStringText(
                "Technical data and specifications of the product",
                "en"
            ),
        ],
        semanticId: createReference(
            "https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/2",
            ReferenceTypes.ExternalReference,
            KeyTypes.GlobalReference
        ),
        submodelElements: [generalInfo, technicalProperties],
    };
}

/**
 * Create a sample Documentation Submodel
 */
export function createSampleDocumentationSubmodel(id: string): Submodel {
    return {
        id,
        idShort: "Documentation",
        kind: ModelingKind.Instance,
        displayName: [createLangStringName("Documentation", "en")],
        description: [
            createLangStringText("Product documentation and manuals", "en"),
        ],
        semanticId: createReference(
            "https://admin-shell.io/ZVEI/TechnicalData/Documentation/1/1",
            ReferenceTypes.ExternalReference,
            KeyTypes.GlobalReference
        ),
        submodelElements: [
            {
                modelType: AasSubmodelElements.File,
                idShort: "OperatingManual",
                displayName: [createLangStringName("Operating Manual", "en")],
                description: [
                    createLangStringText("Operating manual for the product", "en"),
                ],
                contentType: "application/pdf",
                value: "/aasx/OperatingManual_EN.pdf",
            },
            {
                modelType: AasSubmodelElements.File,
                idShort: "SafetyInstructions",
                displayName: [createLangStringName("Safety Instructions", "en")],
                description: [
                    createLangStringText("Safety instructions for the product", "en"),
                ],
                contentType: "application/pdf",
                value: "/aasx/SafetyInstructions_EN.pdf",
            },
            {
                modelType: AasSubmodelElements.File,
                idShort: "TechnicalDrawing",
                displayName: [createLangStringName("Technical Drawing", "en")],
                description: [
                    createLangStringText("Technical drawing of the product", "en"),
                ],
                contentType: "image/png",
                value: "/aasx/TechnicalDrawing.png",
            },
        ],
    };
}

/**
 * Create a minimal AAS Environment for testing
 */
export function createMinimalEnvironment(): Environment {
    const aasId = "https://example.com/ids/aas/minimal";
    const submodelId = "https://example.com/ids/sm/minimal";

    return {
        assetAdministrationShells: [
            {
                id: aasId,
                idShort: "MinimalAAS",
                assetInformation: {
                    assetKind: AssetKind.Instance,
                    globalAssetId: "https://example.com/ids/asset/minimal",
                },
                submodels: [createReference(submodelId, ReferenceTypes.ModelReference, KeyTypes.Submodel)],
            },
        ],
        submodels: [
            {
                id: submodelId,
                idShort: "MinimalSubmodel",
                submodelElements: [
                    {
                        modelType: AasSubmodelElements.Property,
                        idShort: "ExampleProperty",
                        valueType: DataTypeDefXsd.String,
                        value: "Example Value",
                    } as Property,
                ],
            },
        ],
        conceptDescriptions: [],
    };
}
