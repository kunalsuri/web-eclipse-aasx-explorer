/**
 * Tests for AAS V3.0 Advanced Specification Constraints
 * (shared/validation-rules/aasd-advanced-constraints.ts)
 *
 * AASd-050 and AASd-090 were corrected per audit finding ADV-2026-07-15-01:
 * the previously-registered logic did not match the real IDTA AAS V3.0
 * metamodel constraint text for those IDs. See
 * ai/analysis/audit-reports/DEFECT_TRACEABILITY.md.
 */

import { describe, it, expect } from "vitest";
import type { Environment, ValidationContext } from "@shared/validation-types";
import {
  AASd_050,
  AASd_090,
  AASdAdvancedConstraints,
} from "@shared/validation-rules/aasd-advanced-constraints";

function createContext(environment: Environment): ValidationContext {
  return {
    environment,
    element: environment,
    path: "",
    root: environment,
  };
}

describe("AASd Advanced Constraints", () => {
  describe("AASd-050: IEC 61360 Data Specification Template Reference", () => {
    it("passes when DataSpecificationIec61360 content references the canonical IRI", () => {
      const env: Environment = {
        conceptDescriptions: [
          {
            id: "cd1",
            embeddedDataSpecifications: [
              {
                dataSpecification: {
                  type: "ExternalReference",
                  keys: [
                    {
                      type: "GlobalReference",
                      value:
                        "https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0",
                    },
                  ],
                },
                dataSpecificationContent: {
                  modelType: "DataSpecificationIec61360",
                  preferredName: [{ language: "en", text: "Temperature" }],
                },
              },
            ],
          } as any,
        ],
      };

      const errors = AASd_050.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("passes when the IRI differs only by scheme/case (http vs https, IEC61360 casing)", () => {
      // Real AAS files (and this repo's own AASd-049 fixtures) use both
      // "http://" and "https://" and both "IEC61360" and "Iec61360" casing.
      const env: Environment = {
        submodels: [
          {
            id: "sm1",
            idShort: "TestSubmodel",
            embeddedDataSpecifications: [
              {
                dataSpecification: {
                  type: "ExternalReference",
                  keys: [
                    {
                      type: "GlobalReference",
                      value:
                        "http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIec61360/3/0",
                    },
                  ],
                },
                dataSpecificationContent: {
                  modelType: "DataSpecificationIec61360",
                  preferredName: [{ language: "en", text: "Test" }],
                },
              },
            ],
          } as any,
        ],
      };

      const errors = AASd_050.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("fails when DataSpecificationIec61360 content references the wrong IRI", () => {
      const env: Environment = {
        conceptDescriptions: [
          {
            id: "cd1",
            embeddedDataSpecifications: [
              {
                dataSpecification: {
                  type: "ExternalReference",
                  keys: [
                    {
                      type: "GlobalReference",
                      value: "https://example.com/not-the-iec61360-template",
                    },
                  ],
                },
                dataSpecificationContent: {
                  modelType: "DataSpecificationIec61360",
                  preferredName: [{ language: "en", text: "Temperature" }],
                },
              },
            ],
          } as any,
        ],
      };

      const errors = AASd_050.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-050");
      expect(errors[0].message).toContain("DataSpecificationIec61360");
      expect(errors[0].severity).toBe("error");
    });

    it("fails when the dataSpecification reference has no keys", () => {
      const env: Environment = {
        conceptDescriptions: [
          {
            id: "cd1",
            embeddedDataSpecifications: [
              {
                dataSpecification: {
                  type: "ExternalReference",
                  keys: [],
                },
                dataSpecificationContent: {
                  modelType: "DataSpecificationIec61360",
                  preferredName: [{ language: "en", text: "Temperature" }],
                },
              },
            ],
          } as any,
        ],
      };

      const errors = AASd_050.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-050");
    });

    it("does not apply to data specification content that is not DataSpecificationIec61360", () => {
      const env: Environment = {
        conceptDescriptions: [
          {
            id: "cd1",
            embeddedDataSpecifications: [
              {
                dataSpecification: {
                  type: "ExternalReference",
                  keys: [
                    {
                      type: "GlobalReference",
                      value: "https://example.com/some-other-template",
                    },
                  ],
                },
                dataSpecificationContent: {
                  modelType: "DataSpecificationPhysicalUnit",
                },
              },
            ],
          } as any,
        ],
      };

      const errors = AASd_050.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("finds violations nested inside SubmodelElementCollection and SubmodelElementList", () => {
      const env: Environment = {
        submodels: [
          {
            id: "sm1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "SubmodelElementCollection",
                idShort: "Nested",
                value: [
                  {
                    modelType: "Property",
                    idShort: "NestedProp",
                    valueType: "xs:string",
                    embeddedDataSpecifications: [
                      {
                        dataSpecification: {
                          type: "ExternalReference",
                          keys: [
                            { type: "GlobalReference", value: "https://example.com/wrong" },
                          ],
                        },
                        dataSpecificationContent: {
                          modelType: "DataSpecificationIec61360",
                          preferredName: [{ language: "en", text: "Nested Prop" }],
                        },
                      },
                    ],
                  } as any,
                ],
              } as any,
            ],
          },
        ],
      };

      const errors = AASd_050.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-050");
      expect(errors[0].path).toContain("value[0]");
    });
  });

  describe("AASd-090: DataElement Category Value", () => {
    it("passes when a Property has no category (defaults to VARIABLE)", () => {
      const env: Environment = {
        submodels: [
          {
            id: "sm1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Property",
                idShort: "TestProp",
                valueType: "xs:string",
                value: "hello",
              },
            ],
          },
        ],
      };

      const errors = AASd_090.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("passes when category is CONSTANT, PARAMETER, or VARIABLE", () => {
      const makeEnv = (category: string): Environment => ({
        submodels: [
          {
            id: "sm1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Property",
                idShort: "TestProp",
                valueType: "xs:string",
                value: "hello",
                category,
              } as any,
            ],
          },
        ],
      });

      for (const category of ["CONSTANT", "PARAMETER", "VARIABLE"]) {
        const errors = AASd_090.validate(createContext(makeEnv(category)));
        expect(errors).toHaveLength(0);
      }
    });

    it("fails when a Property has an invalid category", () => {
      const env: Environment = {
        submodels: [
          {
            id: "sm1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Property",
                idShort: "TestProp",
                valueType: "xs:string",
                value: "hello",
                category: "PROPERTY",
              } as any,
            ],
          },
        ],
      };

      const errors = AASd_090.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-090");
      expect(errors[0].severity).toBe("error");
      expect(errors[0].message).toContain("CONSTANT, PARAMETER, or VARIABLE");
    });

    it("fails for other DataElement subtypes (Blob, File, Range, MultiLanguageProperty, ReferenceElement)", () => {
      const dataElementFixtures: any[] = [
        { modelType: "Blob", idShort: "b1", contentType: "application/pdf", category: "BAD" },
        { modelType: "File", idShort: "f1", contentType: "application/pdf", category: "BAD" },
        { modelType: "Range", idShort: "r1", valueType: "xs:int", min: "1", category: "BAD" },
        {
          modelType: "MultiLanguageProperty",
          idShort: "m1",
          value: [{ language: "en", text: "x" }],
          category: "BAD",
        },
        { modelType: "ReferenceElement", idShort: "re1", category: "BAD" },
      ];

      const env: Environment = {
        submodels: [
          {
            id: "sm1",
            idShort: "TestSubmodel",
            submodelElements: dataElementFixtures,
          },
        ],
      };

      const errors = AASd_090.validate(createContext(env));
      expect(errors).toHaveLength(dataElementFixtures.length);
      errors.forEach((error) => expect(error.code).toBe("AASd-090"));
    });

    it("does not apply to non-DataElement submodel elements (e.g. SubmodelElementCollection)", () => {
      const env: Environment = {
        submodels: [
          {
            id: "sm1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "SubmodelElementCollection",
                idShort: "Coll",
                category: "NOT_A_DATA_ELEMENT_CATEGORY",
                value: [],
              } as any,
            ],
          },
        ],
      };

      const errors = AASd_090.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("finds violations nested inside Entity statements and AnnotatedRelationshipElement annotations", () => {
      const env: Environment = {
        submodels: [
          {
            id: "sm1",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Entity",
                idShort: "TestEntity",
                entityType: "CoManagedEntity",
                statements: [
                  {
                    modelType: "Property",
                    idShort: "EntityProp",
                    valueType: "xs:string",
                    category: "INVALID",
                  } as any,
                ],
              } as any,
              {
                modelType: "AnnotatedRelationshipElement",
                idShort: "TestRel",
                first: { type: "ModelReference", keys: [{ type: "Submodel", value: "sm1" }] },
                second: { type: "ModelReference", keys: [{ type: "Submodel", value: "sm2" }] },
                annotations: [
                  {
                    modelType: "Property",
                    idShort: "AnnotationProp",
                    valueType: "xs:string",
                    category: "INVALID",
                  } as any,
                ],
              } as any,
            ],
          },
        ],
      };

      const errors = AASd_090.validate(createContext(env));
      expect(errors).toHaveLength(2);
      errors.forEach((error) => expect(error.code).toBe("AASd-090"));
    });
  });

  describe("AASdAdvancedConstraints registration", () => {
    it("still registers 11 constraints with unique IDs including the corrected AASd-050 and AASd-090", () => {
      expect(AASdAdvancedConstraints).toHaveLength(11);

      const ids = AASdAdvancedConstraints.map((rule) => rule.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).toContain("AASd-050");
      expect(ids).toContain("AASd-090");
    });
  });
});
