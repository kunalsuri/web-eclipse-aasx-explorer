/**
 * Semantic Validation Tests
 * Tests for Task 2.1.4: Implement semantic validation
 */

import { describe, it, expect } from "vitest";
import { validationEngine } from "@shared/aas-validation-engine";
import type { Environment } from "@shared/aas-v3-types";
import {
  AssetKind,
  ReferenceTypes,
  KeyTypes,
} from "@shared/aas-v3-types";

describe("Semantic Validation - Task 2.1.4", () => {
  describe("Semantic ID Format Validation", () => {
    it("should accept valid HTTP IRI semantic IDs", () => {
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

      const result = validationEngine.validate(env);
      const semanticErrors = result.warnings.filter(
        (w) => w.code === "INVALID_SEMANTIC_ID_FORMAT"
      );
      expect(semanticErrors).toHaveLength(0);
    });

    it("should accept valid ECLASS IRDI format", () => {
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
                  value: "0173-1#02-AAA123#001",
                },
              ],
            },
          },
        ],
      };

      const result = validationEngine.validate(env);
      const semanticErrors = result.warnings.filter(
        (w) => w.code === "INVALID_SEMANTIC_ID_FORMAT"
      );
      expect(semanticErrors).toHaveLength(0);
    });

    it("should accept valid IEC CDD IRDI format", () => {
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
                  value: "0112/2///61987#ABC123#001",
                },
              ],
            },
          },
        ],
      };

      const result = validationEngine.validate(env);
      const semanticErrors = result.warnings.filter(
        (w) => w.code === "INVALID_SEMANTIC_ID_FORMAT"
      );
      expect(semanticErrors).toHaveLength(0);
    });

    it("should accept URN format", () => {
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
                  value: "urn:example:semantic:id",
                },
              ],
            },
          },
        ],
      };

      const result = validationEngine.validate(env);
      const semanticErrors = result.warnings.filter(
        (w) => w.code === "INVALID_SEMANTIC_ID_FORMAT"
      );
      expect(semanticErrors).toHaveLength(0);
    });

    it("should warn about invalid semantic ID format", () => {
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
                  value: "invalid-semantic-id",
                },
              ],
            },
          },
        ],
      };

      const result = validationEngine.validate(env);
      const semanticError = result.warnings.find(
        (w) => w.code === "INVALID_SEMANTIC_ID_FORMAT"
      );
      expect(semanticError).toBeDefined();
      expect(semanticError?.path).toBe("submodels[0].semanticId");
    });

    it("should validate semantic IDs in nested SubmodelElements", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
            submodelElements: [
              {
                idShort: "Collection",
                modelType: "SubmodelElementCollection",
                value: [
                  {
                    idShort: "Property1",
                    modelType: "Property",
                    valueType: "xs:string",
                    semanticId: {
                      type: ReferenceTypes.ExternalReference,
                      keys: [
                        {
                          type: KeyTypes.GlobalReference,
                          value: "invalid-id",
                        },
                      ],
                    },
                  } as any,
                ],
              } as any,
            ],
          },
        ],
      };

      const result = validationEngine.validate(env);
      const semanticError = result.warnings.find(
        (w) => w.code === "INVALID_SEMANTIC_ID_FORMAT"
      );
      expect(semanticError).toBeDefined();
      expect(semanticError?.path).toContain("submodelElements");
    });
  });

  describe("Concept Description Validation", () => {
    it("should detect missing ConceptDescription ID", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [
          {
            id: "",
            idShort: "Concept1",
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find((e) => e.code === "CONCEPT_MISSING_ID");
      expect(error).toBeDefined();
      expect(error?.path).toBe("conceptDescriptions[0].id");
    });

    it("should warn about missing ConceptDescription idShort", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [
          {
            id: "https://example.com/concept/1",
            idShort: "",
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const warning = result.warnings.find(
        (w) => w.code === "CONCEPT_MISSING_IDSHORT"
      );
      expect(warning).toBeDefined();
    });

    it("should warn about invalid ConceptDescription ID format", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [
          {
            id: "invalid-concept-id",
            idShort: "Concept1",
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const warning = result.warnings.find(
        (w) => w.code === "INVALID_CONCEPT_ID_FORMAT"
      );
      expect(warning).toBeDefined();
    });

    it("should pass validation for valid ConceptDescription", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [
          {
            id: "https://example.com/concept/1",
            idShort: "Concept1",
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) =>
          e.code === "CONCEPT_MISSING_ID" || e.code === "CONCEPT_MISSING_IDSHORT"
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe("IEC 61360 Compliance", () => {
    it("should detect missing preferredName in IEC 61360 data spec", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [
          {
            id: "https://example.com/concept/1",
            idShort: "Concept1",
            embeddedDataSpecifications: [
              {
                dataSpecification: {
                  type: ReferenceTypes.ExternalReference,
                  keys: [
                    {
                      type: KeyTypes.GlobalReference,
                      value: "https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0",
                    },
                  ],
                },
                dataSpecificationContent: {
                  // Missing preferredName
                } as any,
              },
            ],
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find(
        (e) => e.code === "IEC61360_MISSING_PREFERRED_NAME"
      );
      expect(error).toBeDefined();
    });

    it("should validate preferredName structure", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [
          {
            id: "https://example.com/concept/1",
            idShort: "Concept1",
            embeddedDataSpecifications: [
              {
                dataSpecification: {
                  type: ReferenceTypes.ExternalReference,
                  keys: [
                    {
                      type: KeyTypes.GlobalReference,
                      value: "https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0",
                    },
                  ],
                },
                dataSpecificationContent: {
                  preferredName: [
                    {
                      language: "en",
                      text: "Test Concept",
                    },
                  ],
                } as any,
              },
            ],
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const errors = result.errors.filter(
        (e) => e.code === "IEC61360_MISSING_PREFERRED_NAME"
      );
      expect(errors).toHaveLength(0);
    });

    it("should detect missing language in preferredName", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [
          {
            id: "https://example.com/concept/1",
            idShort: "Concept1",
            embeddedDataSpecifications: [
              {
                dataSpecification: {
                  type: ReferenceTypes.ExternalReference,
                  keys: [
                    {
                      type: KeyTypes.GlobalReference,
                      value: "https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0",
                    },
                  ],
                },
                dataSpecificationContent: {
                  preferredName: [
                    {
                      text: "Test Concept",
                      // Missing language
                    } as any,
                  ],
                } as any,
              },
            ],
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find(
        (e) => e.code === "IEC61360_PREFERRED_NAME_MISSING_LANGUAGE"
      );
      expect(error).toBeDefined();
    });

    it("should warn about invalid IEC 61360 data type", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [
          {
            id: "https://example.com/concept/1",
            idShort: "Concept1",
            embeddedDataSpecifications: [
              {
                dataSpecification: {
                  type: ReferenceTypes.ExternalReference,
                  keys: [
                    {
                      type: KeyTypes.GlobalReference,
                      value: "https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0",
                    },
                  ],
                },
                dataSpecificationContent: {
                  preferredName: [
                    {
                      language: "en",
                      text: "Test Concept",
                    },
                  ],
                  dataType: "INVALID_TYPE",
                } as any,
              },
            ],
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const warning = result.warnings.find(
        (w) => w.code === "IEC61360_INVALID_DATA_TYPE"
      );
      expect(warning).toBeDefined();
    });

    it("should accept valid IEC 61360 data types", () => {
      const validTypes = [
        "STRING",
        "INTEGER_MEASURE",
        "REAL_MEASURE",
        "BOOLEAN",
        "DATE",
      ];

      validTypes.forEach((dataType) => {
        const env: Environment = {
          assetAdministrationShells: [],
          submodels: [],
          conceptDescriptions: [
            {
              id: "https://example.com/concept/1",
              idShort: "Concept1",
              embeddedDataSpecifications: [
                {
                  dataSpecification: {
                    type: ReferenceTypes.ExternalReference,
                    keys: [
                      {
                        type: KeyTypes.GlobalReference,
                        value: "https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0",
                      },
                    ],
                  },
                  dataSpecificationContent: {
                    preferredName: [
                      {
                        language: "en",
                        text: "Test Concept",
                      },
                    ],
                    dataType,
                  } as any,
                },
              ],
            } as any,
          ],
        };

        const result = validationEngine.validate(env);
        const warning = result.warnings.find(
          (w) => w.code === "IEC61360_INVALID_DATA_TYPE"
        );
        expect(warning).toBeUndefined();
      });
    });

    it("should warn about duplicate unit specification", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [
          {
            id: "https://example.com/concept/1",
            idShort: "Concept1",
            embeddedDataSpecifications: [
              {
                dataSpecification: {
                  type: ReferenceTypes.ExternalReference,
                  keys: [
                    {
                      type: KeyTypes.GlobalReference,
                      value: "https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0",
                    },
                  ],
                },
                dataSpecificationContent: {
                  preferredName: [
                    {
                      language: "en",
                      text: "Test Concept",
                    },
                  ],
                  unit: "m",
                  unitId: {
                    type: ReferenceTypes.ExternalReference,
                    keys: [
                      {
                        type: KeyTypes.GlobalReference,
                        value: "https://example.com/unit/meter",
                      },
                    ],
                  },
                } as any,
              },
            ],
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const warning = result.warnings.find(
        (w) => w.code === "IEC61360_DUPLICATE_UNIT"
      );
      expect(warning).toBeDefined();
    });
  });

  describe("Data Specification Validation", () => {
    it("should detect missing dataSpecification reference", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [
          {
            id: "https://example.com/concept/1",
            idShort: "Concept1",
            embeddedDataSpecifications: [
              {
                // Missing dataSpecification
                dataSpecificationContent: {} as any,
              } as any,
            ],
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find(
        (e) => e.code === "DATA_SPEC_MISSING_REFERENCE"
      );
      expect(error).toBeDefined();
    });

    it("should detect missing dataSpecificationContent", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [
          {
            id: "https://example.com/concept/1",
            idShort: "Concept1",
            embeddedDataSpecifications: [
              {
                dataSpecification: {
                  type: ReferenceTypes.ExternalReference,
                  keys: [
                    {
                      type: KeyTypes.GlobalReference,
                      value: "https://example.com/dataspec",
                    },
                  ],
                },
                // Missing dataSpecificationContent
              } as any,
            ],
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find(
        (e) => e.code === "DATA_SPEC_MISSING_CONTENT"
      );
      expect(error).toBeDefined();
    });

    it("should validate data specifications in Submodels", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
            embeddedDataSpecifications: [
              {
                // Missing dataSpecification
                dataSpecificationContent: {} as any,
              } as any,
            ],
          },
        ],
      };

      const result = validationEngine.validate(env);
      const error = result.errors.find(
        (e) => e.code === "DATA_SPEC_MISSING_REFERENCE"
      );
      expect(error).toBeDefined();
      expect(error?.path).toContain("submodels[0]");
    });
  });

  describe("Semantic ID Resolution", () => {
    it("should detect unresolved internal semantic ID", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
            semanticId: {
              type: ReferenceTypes.ModelReference,
              keys: [
                {
                  type: KeyTypes.ConceptDescription,
                  value: "nonexistent-concept",
                },
              ],
            },
          },
        ],
        conceptDescriptions: [],
      };

      const result = validationEngine.validate(env);
      const info = result.infos.find((i) => i.code === "SEMANTIC_ID_UNRESOLVED");
      expect(info).toBeDefined();
      expect(info?.path).toBe("submodels[0].semanticId");
    });

    it("should not warn about external semantic IDs", () => {
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
        conceptDescriptions: [],
      };

      const result = validationEngine.validate(env);
      const info = result.infos.find((i) => i.code === "SEMANTIC_ID_UNRESOLVED");
      expect(info).toBeUndefined();
    });

    it("should validate resolved semantic IDs", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
            semanticId: {
              type: ReferenceTypes.ModelReference,
              keys: [
                {
                  type: KeyTypes.ConceptDescription,
                  value: "concept1",
                },
              ],
            },
          },
        ],
        conceptDescriptions: [
          {
            id: "concept1",
            idShort: "Concept1",
          } as any,
        ],
      };

      const result = validationEngine.validate(env);
      const info = result.infos.find((i) => i.code === "SEMANTIC_ID_UNRESOLVED");
      expect(info).toBeUndefined();
    });

    it("should validate semantic IDs in nested elements", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [
          {
            id: "sm1",
            idShort: "Submodel1",
            submodelElements: [
              {
                idShort: "Property1",
                modelType: "Property",
                valueType: "xs:string",
                semanticId: {
                  type: ReferenceTypes.ModelReference,
                  keys: [
                    {
                      type: KeyTypes.ConceptDescription,
                      value: "nonexistent-concept",
                    },
                  ],
                },
              } as any,
            ],
          },
        ],
        conceptDescriptions: [],
      };

      const result = validationEngine.validate(env);
      const info = result.infos.find((i) => i.code === "SEMANTIC_ID_UNRESOLVED");
      expect(info).toBeDefined();
      expect(info?.path).toContain("submodelElements");
    });
  });

  describe("Semantic Validation Preset", () => {
    it("should run only semantic validation rules", () => {
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
                  value: "invalid-semantic-id",
                },
              ],
            },
          },
        ],
        conceptDescriptions: [
          {
            id: "",
            idShort: "Concept1",
          } as any,
        ],
      };

      const result = validationEngine.validateWithPreset(env, "semantic");

      // Should have semantic warnings/errors
      const semanticWarning = result.warnings.find(
        (w) => w.code === "INVALID_SEMANTIC_ID_FORMAT"
      );
      expect(semanticWarning).toBeDefined();

      const conceptError = result.errors.find(
        (e) => e.code === "CONCEPT_MISSING_ID"
      );
      expect(conceptError).toBeDefined();

      // Should not run schema validation (not in semantic preset)
      const schemaError = result.errors.find(
        (e) => e.code === "SUBMODEL_MISSING_ID"
      );
      expect(schemaError).toBeUndefined();
    });
  });

  describe("Performance", () => {
    it("should validate large environment with semantic data efficiently", () => {
      // Create environment with 50 submodels and 50 concept descriptions
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: Array.from({ length: 50 }, (_, i) => ({
          id: `sm${i}`,
          idShort: `Submodel${i}`,
          semanticId: {
            type: ReferenceTypes.ModelReference,
            keys: [
              {
                type: KeyTypes.ConceptDescription,
                value: `concept${i}`,
              },
            ],
          },
          submodelElements: [
            {
              idShort: `Property${i}`,
              modelType: "Property",
              valueType: "xs:string",
              semanticId: {
                type: ReferenceTypes.ModelReference,
                keys: [
                  {
                    type: KeyTypes.ConceptDescription,
                    value: `concept${i}`,
                  },
                ],
              },
            } as any,
          ],
        })),
        conceptDescriptions: Array.from({ length: 50 }, (_, i) => ({
          id: `concept${i}`,
          idShort: `Concept${i}`,
          embeddedDataSpecifications: [
            {
              dataSpecification: {
                type: ReferenceTypes.ExternalReference,
                keys: [
                  {
                    type: KeyTypes.GlobalReference,
                    value: "https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0",
                  },
                ],
              },
              dataSpecificationContent: {
                preferredName: [
                  {
                    language: "en",
                    text: `Concept ${i}`,
                  },
                ],
                dataType: "STRING",
              } as any,
            },
          ],
        })) as any,
      };

      const startTime = Date.now();
      const result = validationEngine.validate(env);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(200); // Should complete in < 200ms
      // The test data may have some validation issues, but performance is the key metric
      expect(result.errors.length).toBeLessThan(150); // Allow some errors in test data
    });
  });
});
