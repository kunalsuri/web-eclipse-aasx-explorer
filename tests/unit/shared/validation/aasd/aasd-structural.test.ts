/**
 * Tests for AAS V3.0 Structural Constraints (AASd-001 to AASd-049)
 */

import { describe, it, expect } from "vitest";
import type { Environment, ValidationContext } from "@shared/validation-types";
import {
  AASd_001,
  AASd_003,
  AASd_004,
  AASd_009,
  AASd_010,
  AASd_011,
  AASd_012,
  AASd_013,
  AASd_015,
  AASd_016,
  AASd_017,
  AASd_018,
  AASd_019,
  AASd_020,
  AASd_023,
  AASd_024,
  AASd_025,
  AASd_026,
  AASd_027,
  AASd_028,
  AASd_029,
  AASd_030,
  AASd_045,
  AASd_046,
  AASd_047,
  AASd_048,
  AASd_049,
  AASdStructuralConstraints,
} from "@shared/validation-rules/aasd-structural";

// Helper function to create validation context
function createContext(environment: Environment): ValidationContext {
  return {
    environment,
    element: environment,
    path: "",
    root: environment,
  };
}

describe("AASd Structural Constraints", () => {
  describe("AASd-001: Environment Must Contain Content", () => {
    it("should pass when environment has AAS", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "test-aas",
            idShort: "TestAAS",
            assetInformation: {
              assetKind: "Instance",
            },
          },
        ],
      };

      const errors = AASd_001.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should pass when environment has Submodels", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
          },
        ],
      };

      const errors = AASd_001.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should fail when environment is empty", () => {
      const env: Environment = {};

      const errors = AASd_001.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-001");
      expect(errors[0].severity).toBe("error");
    });

    it("should fail when environment has empty arrays", () => {
      const env: Environment = {
        assetAdministrationShells: [],
        submodels: [],
      };

      const errors = AASd_001.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-001");
    });
  });

  describe("AASd-003: AAS Must Have AssetInformation", () => {
    it("should pass when AAS has assetInformation", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "test-aas",
            idShort: "TestAAS",
            assetInformation: {
              assetKind: "Instance",
            },
          },
        ],
      };

      const errors = AASd_003.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should fail when AAS lacks assetInformation", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "test-aas",
            idShort: "TestAAS",
          } as any,
        ],
      };

      const errors = AASd_003.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-003");
      expect(errors[0].severity).toBe("error");
      expect(errors[0].path).toBe("assetAdministrationShells[0].assetInformation");
    });
  });

  describe("AASd-004: AssetInformation Must Have AssetKind", () => {
    it("should pass when assetInformation has assetKind", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "test-aas",
            idShort: "TestAAS",
            assetInformation: {
              assetKind: "Instance",
            },
          },
        ],
      };

      const errors = AASd_004.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should fail when assetInformation lacks assetKind", () => {
      const env: Environment = {
        assetAdministrationShells: [
          {
            id: "test-aas",
            idShort: "TestAAS",
            assetInformation: {} as any,
          },
        ],
      };

      const errors = AASd_004.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-004");
      expect(errors[0].severity).toBe("error");
    });
  });

  describe("AASd-009: Submodel Must Have SemanticId", () => {
    it("should pass when submodel has semanticId", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            semanticId: {
              type: "ExternalReference",
              keys: [{ type: "GlobalReference", value: "http://example.com/concept" }],
            },
          },
        ],
      };

      const errors = AASd_009.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should warn when submodel lacks semanticId", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
          },
        ],
      };

      const errors = AASd_009.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-009");
      expect(errors[0].severity).toBe("warning");
    });
  });

  describe("AASd-010: SubmodelElement Must Have IdShort", () => {
    it("should pass when elements have idShort", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Property",
                idShort: "TestProperty",
                valueType: "xs:string",
              },
            ],
          },
        ],
      };

      const errors = AASd_010.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should fail when element lacks idShort", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Property",
                valueType: "xs:string",
              } as any,
            ],
          },
        ],
      };

      const errors = AASd_010.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-010");
      expect(errors[0].severity).toBe("error");
    });

    it("should pass when element in list lacks idShort", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "SubmodelElementList",
                idShort: "TestList",
                typeValueListElement: "Property",
                value: [
                  {
                    modelType: "Property",
                    valueType: "xs:string",
                    // No idShort - should be allowed in lists
                  } as any,
                ],
              },
            ],
          },
        ],
      };

      const errors = AASd_010.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });
  });

  describe("AASd-011: Property Must Have ValueType", () => {
    it("should pass when property has valueType", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Property",
                idShort: "TestProperty",
                valueType: "xs:string",
              },
            ],
          },
        ],
      };

      const errors = AASd_011.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should fail when property lacks valueType", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Property",
                idShort: "TestProperty",
              } as any,
            ],
          },
        ],
      };

      const errors = AASd_011.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-011");
      expect(errors[0].severity).toBe("error");
    });
  });

  describe("AASd-012: Range Must Have ValueType", () => {
    it("should pass when range has valueType", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Range",
                idShort: "TestRange",
                valueType: "xs:double",
                min: "0.0",
                max: "100.0",
              },
            ],
          },
        ],
      };

      const errors = AASd_012.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should fail when range lacks valueType", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Range",
                idShort: "TestRange",
                min: "0.0",
                max: "100.0",
              } as any,
            ],
          },
        ],
      };

      const errors = AASd_012.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-012");
      expect(errors[0].severity).toBe("error");
    });
  });

  describe("AASd-013: Blob Must Have ContentType", () => {
    it("should pass when blob has contentType", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Blob",
                idShort: "TestBlob",
                contentType: "application/pdf",
                value: "base64encodeddata",
              },
            ],
          },
        ],
      };

      const errors = AASd_013.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should fail when blob lacks contentType", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Blob",
                idShort: "TestBlob",
                value: "base64encodeddata",
              } as any,
            ],
          },
        ],
      };

      const errors = AASd_013.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-013");
      expect(errors[0].severity).toBe("error");
    });
  });

  describe("AASd-015: File Must Have Value", () => {
    it("should pass when file has value", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "File",
                idShort: "TestFile",
                contentType: "text/plain",
                value: "/path/to/file.txt",
              },
            ],
          },
        ],
      };

      const errors = AASd_015.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should fail when file lacks value", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "File",
                idShort: "TestFile",
                contentType: "text/plain",
              } as any,
            ],
          },
        ],
      };

      const errors = AASd_015.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-015");
      expect(errors[0].severity).toBe("error");
    });

    it("should fail when file has empty value", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "File",
                idShort: "TestFile",
                contentType: "text/plain",
                value: "   ",
              },
            ],
          },
        ],
      };

      const errors = AASd_015.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-015");
    });
  });

  describe("AASd-016: ReferenceElement Must Have Value", () => {
    it("should pass when reference element has value", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "ReferenceElement",
                idShort: "TestRef",
                value: {
                  type: "ModelReference",
                  keys: [{ type: "Property", value: "someProperty" }],
                },
              },
            ],
          },
        ],
      };

      const errors = AASd_016.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should fail when reference element lacks value", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "ReferenceElement",
                idShort: "TestRef",
              } as any,
            ],
          },
        ],
      };

      const errors = AASd_016.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-016");
      expect(errors[0].severity).toBe("error");
    });
  });

  describe("AASd-017: RelationshipElement Must Have Endpoints", () => {
    it("should pass when relationship has both endpoints", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "RelationshipElement",
                idShort: "TestRelation",
                first: {
                  type: "ModelReference",
                  keys: [{ type: "Property", value: "prop1" }],
                },
                second: {
                  type: "ModelReference",
                  keys: [{ type: "Property", value: "prop2" }],
                },
              },
            ],
          },
        ],
      };

      const errors = AASd_017.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should fail when relationship lacks first endpoint", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "RelationshipElement",
                idShort: "TestRelation",
                second: {
                  type: "ModelReference",
                  keys: [{ type: "Property", value: "prop2" }],
                },
              } as any,
            ],
          },
        ],
      };

      const errors = AASd_017.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-017");
      expect(errors[0].message).toContain("first");
    });

    it("should fail when relationship lacks second endpoint", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "RelationshipElement",
                idShort: "TestRelation",
                first: {
                  type: "ModelReference",
                  keys: [{ type: "Property", value: "prop1" }],
                },
              } as any,
            ],
          },
        ],
      };

      const errors = AASd_017.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-017");
      expect(errors[0].message).toContain("second");
    });

    it("should work for AnnotatedRelationshipElement", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "AnnotatedRelationshipElement",
                idShort: "TestAnnotatedRelation",
                // Missing both endpoints
              } as any,
            ],
          },
        ],
      };

      const errors = AASd_017.validate(createContext(env));
      expect(errors).toHaveLength(2); // Both first and second missing
      expect(errors.every(e => e.code === "AASd-017")).toBe(true);
    });
  });

  describe("AASd-018: SubmodelElementCollection Value Optional", () => {
    it("should pass when collection has elements", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "SubmodelElementCollection",
                idShort: "TestCollection",
                value: [
                  {
                    modelType: "Property",
                    idShort: "prop1",
                    valueType: "xs:string",
                  },
                ],
              },
            ],
          },
        ],
      };

      const errors = AASd_018.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should provide info when collection is empty", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "SubmodelElementCollection",
                idShort: "TestCollection",
                value: [],
              },
            ],
          },
        ],
      };

      const errors = AASd_018.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-018");
      expect(errors[0].severity).toBe("info");
    });
  });

  describe("AASd-019: SubmodelElementList Must Have Type", () => {
    it("should pass when list has typeValueListElement", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "SubmodelElementList",
                idShort: "TestList",
                typeValueListElement: "Property",
                value: [],
              },
            ],
          },
        ],
      };

      const errors = AASd_019.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should fail when list lacks typeValueListElement", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "SubmodelElementList",
                idShort: "TestList",
                value: [],
              } as any,
            ],
          },
        ],
      };

      const errors = AASd_019.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-019");
      expect(errors[0].severity).toBe("error");
    });
  });

  describe("AASd-020: Operation Variables Optional", () => {
    it("should pass when operation has variables", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Operation",
                idShort: "TestOperation",
                inputVariables: [
                  {
                    value: {
                      modelType: "Property",
                      idShort: "input1",
                      valueType: "xs:string",
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      const errors = AASd_020.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should provide info when operation has no variables", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Operation",
                idShort: "TestOperation",
              },
            ],
          },
        ],
      };

      const errors = AASd_020.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-020");
      expect(errors[0].severity).toBe("info");
    });
  });

  describe("AASd-023: Entity Must Have EntityType", () => {
    it("should pass when entity has entityType", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Entity",
                idShort: "TestEntity",
                entityType: "CoManagedEntity",
              },
            ],
          },
        ],
      };

      const errors = AASd_023.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should fail when entity lacks entityType", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Entity",
                idShort: "TestEntity",
              } as any,
            ],
          },
        ],
      };

      const errors = AASd_023.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-023");
      expect(errors[0].severity).toBe("error");
    });
  });

  describe("AASd-024: BasicEventElement Must Have Observed", () => {
    it("should pass when event has observed", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "BasicEventElement",
                idShort: "TestEvent",
                observed: {
                  type: "ModelReference",
                  keys: [{ type: "Property", value: "observedProp" }],
                },
                direction: "output",
                state: "on",
              },
            ],
          },
        ],
      };

      const errors = AASd_024.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should fail when event lacks observed", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "BasicEventElement",
                idShort: "TestEvent",
                direction: "output",
                state: "on",
              } as any,
            ],
          },
        ],
      };

      const errors = AASd_024.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-024");
      expect(errors[0].severity).toBe("error");
    });
  });

  describe("AASd-025: BasicEventElement Must Have Direction", () => {
    it("should pass when event has direction", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "BasicEventElement",
                idShort: "TestEvent",
                observed: {
                  type: "ModelReference",
                  keys: [{ type: "Property", value: "observedProp" }],
                },
                direction: "output",
                state: "on",
              },
            ],
          },
        ],
      };

      const errors = AASd_025.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should fail when event lacks direction", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "BasicEventElement",
                idShort: "TestEvent",
                observed: {
                  type: "ModelReference",
                  keys: [{ type: "Property", value: "observedProp" }],
                },
                state: "on",
              } as any,
            ],
          },
        ],
      };

      const errors = AASd_025.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-025");
      expect(errors[0].severity).toBe("error");
    });
  });

  describe("AASd-026: Qualifier Must Have Type", () => {
    it("should pass when qualifier has type", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            qualifiers: [
              {
                type: "multiplicity",
                valueType: "xs:string",
                value: "1..1",
              },
            ],
          },
        ],
      };

      const errors = AASd_026.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should fail when qualifier lacks type", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            qualifiers: [
              {
                valueType: "xs:string",
                value: "1..1",
              } as any,
            ],
          },
        ],
      };

      const errors = AASd_026.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-026");
      expect(errors[0].severity).toBe("error");
    });

    it("should fail when qualifier has empty type", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            qualifiers: [
              {
                type: "   ",
                valueType: "xs:string",
                value: "1..1",
              },
            ],
          },
        ],
      };

      const errors = AASd_026.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-026");
    });
  });

  describe("AASd-027: Extension Must Have Name", () => {
    it("should pass when extension has name", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            extensions: [
              {
                name: "customProperty",
                valueType: "xs:string",
                value: "customValue",
              },
            ],
          },
        ],
      };

      const errors = AASd_027.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should fail when extension lacks name", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            extensions: [
              {
                valueType: "xs:string",
                value: "customValue",
              } as any,
            ],
          },
        ],
      };

      const errors = AASd_027.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-027");
      expect(errors[0].severity).toBe("error");
    });
  });

  describe("AASd-028: Reference Must Have Type", () => {
    it("should pass when reference has type", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            semanticId: {
              type: "ExternalReference",
              keys: [{ type: "GlobalReference", value: "http://example.com" }],
            },
          },
        ],
      };

      const errors = AASd_028.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should fail when reference lacks type", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            semanticId: {
              keys: [{ type: "GlobalReference", value: "http://example.com" }],
            } as any,
          },
        ],
      };

      const errors = AASd_028.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-028");
      expect(errors[0].severity).toBe("error");
    });
  });

  describe("AASd-029: Key Must Have Type And Value", () => {
    it("should pass when keys have type and value", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            semanticId: {
              type: "ExternalReference",
              keys: [{ type: "GlobalReference", value: "http://example.com" }],
            },
          },
        ],
      };

      const errors = AASd_029.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should fail when key lacks type", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            semanticId: {
              type: "ExternalReference",
              keys: [{ value: "http://example.com" } as any],
            },
          },
        ],
      };

      const errors = AASd_029.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-029");
      expect(errors[0].message).toContain("type");
    });

    it("should fail when key lacks value", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            semanticId: {
              type: "ExternalReference",
              keys: [{ type: "GlobalReference" } as any],
            },
          },
        ],
      };

      const errors = AASd_029.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-029");
      expect(errors[0].message).toContain("value");
    });

    it("should fail when key has empty value", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            semanticId: {
              type: "ExternalReference",
              keys: [{ type: "GlobalReference", value: "   " }],
            },
          },
        ],
      };

      const errors = AASd_029.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-029");
    });
  });

  describe("AASd-030: LangString Must Have Language And Text", () => {
    it("should pass when langstring has language and text", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            description: [
              { language: "en", text: "English description" },
              { language: "de", text: "German description" },
            ],
          },
        ],
      };

      const errors = AASd_030.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should fail when langstring lacks language", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            description: [
              { text: "Description without language" } as any,
            ],
          },
        ],
      };

      const errors = AASd_030.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-030");
      expect(errors[0].message).toContain("language");
    });

    it("should fail when langstring lacks text", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            description: [
              { language: "en" } as any,
            ],
          },
        ],
      };

      const errors = AASd_030.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-030");
      expect(errors[0].message).toContain("text");
    });

    it("should work with MultiLanguageProperty", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "MultiLanguageProperty",
                idShort: "TestMLProp",
                value: [
                  { language: "en", text: "English value" },
                  { language: "", text: "Value without language" }, // Should fail
                ],
              },
            ],
          },
        ],
      };

      const errors = AASd_030.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-030");
    });
  });

  describe("All Structural Constraints", () => {
    it("should export structural constraints", () => {
      // 27 implemented. 14 fabricated placeholder IDs (AASd-031..044) were
      // removed as non-standard - see ADV-2026-07-14-03 in
      // ai/analysis/audit-reports/DEFECT_TRACEABILITY.md.
      expect(AASdStructuralConstraints.length).toBeGreaterThanOrEqual(27);
      
      // Check that all constraints have proper structure
      AASdStructuralConstraints.forEach((constraint) => {
        expect(constraint.id).toMatch(/^AASd-\d{3}$/);
        expect(constraint.name).toBeTruthy();
        expect(constraint.description).toBeTruthy();
        expect(constraint.severity).toMatch(/^(error|warning|info)$/);
        expect(constraint.category).toBe("structure");
        expect(typeof constraint.validate).toBe("function");
      });
    });

    it("should have unique constraint IDs", () => {
      const ids = AASdStructuralConstraints.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should cover the expected constraint range", () => {
      // Currently implemented structural constraints. AASd-031..044 removed:
      // not real IDTA constraint IDs (ADV-2026-07-14-03).
      const expectedIds = [
        "AASd-001", "AASd-003", "AASd-004", "AASd-009", "AASd-010",
        "AASd-011", "AASd-012", "AASd-013", "AASd-015", "AASd-016",
        "AASd-017", "AASd-018", "AASd-019", "AASd-020", "AASd-023",
        "AASd-024", "AASd-025", "AASd-026", "AASd-027", "AASd-028",
        "AASd-029", "AASd-030", "AASd-045", "AASd-046", "AASd-047",
        "AASd-048", "AASd-049",
      ];

      const actualIds = AASdStructuralConstraints.map(c => c.id).sort();
      expect(actualIds).toEqual(expectedIds.sort());
    });
  });

  describe("AASd-045: SubmodelElementList Type Consistency", () => {
    it("should pass when all elements match declared type", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "SubmodelElementList",
                idShort: "TestList",
                typeValueListElement: "Property",
                value: [
                  {
                    modelType: "Property",
                    valueType: "xs:string",
                  },
                  {
                    modelType: "Property",
                    valueType: "xs:int",
                  },
                ],
              },
            ],
          },
        ],
      };

      const errors = AASd_045.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should fail when element type does not match declared type", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "SubmodelElementList",
                idShort: "TestList",
                typeValueListElement: "Property",
                value: [
                  {
                    modelType: "Property",
                    valueType: "xs:string",
                  },
                  {
                    modelType: "Range", // Wrong type!
                    valueType: "xs:int",
                  },
                ],
              },
            ],
          },
        ],
      };

      const errors = AASd_045.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-045");
      expect(errors[0].message).toContain("Range");
      expect(errors[0].message).toContain("Property");
    });

    it("should pass when list is empty", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "SubmodelElementList",
                idShort: "TestList",
                typeValueListElement: "Property",
                value: [],
              },
            ],
          },
        ],
      };

      const errors = AASd_045.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });
  });

  describe("AASd-046: Operation Variable Validity", () => {
    it("should pass when operation variables are valid", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Operation",
                idShort: "TestOperation",
                inputVariables: [
                  {
                    value: {
                      modelType: "Property",
                      idShort: "Input1",
                      valueType: "xs:string",
                    },
                  },
                ],
                outputVariables: [
                  {
                    value: {
                      modelType: "Property",
                      idShort: "Output1",
                      valueType: "xs:int",
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      const errors = AASd_046.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should fail when input variable lacks value", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Operation",
                idShort: "TestOperation",
                inputVariables: [
                  {} as any, // Missing value
                ],
              },
            ],
          },
        ],
      };

      const errors = AASd_046.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-046");
      expect(errors[0].message).toContain("input variable");
    });

    it("should fail when output variable has invalid value", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Operation",
                idShort: "TestOperation",
                outputVariables: [
                  {
                    value: {} as any, // Missing modelType
                  },
                ],
              },
            ],
          },
        ],
      };

      const errors = AASd_046.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-046");
      expect(errors[0].message).toContain("output variable");
    });
  });

  describe("AASd-047: AnnotatedRelationshipElement Annotation Validity", () => {
    it("should pass when annotations are valid", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "AnnotatedRelationshipElement",
                idShort: "TestAnnotatedRel",
                first: {
                  type: "ModelReference",
                  keys: [{ type: "Submodel", value: "sm1" }],
                },
                second: {
                  type: "ModelReference",
                  keys: [{ type: "Submodel", value: "sm2" }],
                },
                annotations: [
                  {
                    modelType: "Property",
                    idShort: "Annotation1",
                    valueType: "xs:string",
                  },
                ],
              },
            ],
          },
        ],
      };

      const errors = AASd_047.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should fail when annotation lacks modelType", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "AnnotatedRelationshipElement",
                idShort: "TestAnnotatedRel",
                first: {
                  type: "ModelReference",
                  keys: [{ type: "Submodel", value: "sm1" }],
                },
                second: {
                  type: "ModelReference",
                  keys: [{ type: "Submodel", value: "sm2" }],
                },
                annotations: [
                  {
                    idShort: "Annotation1",
                  } as any, // Missing modelType
                ],
              },
            ],
          },
        ],
      };

      const errors = AASd_047.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-047");
      expect(errors[0].message).toContain("valid SubmodelElement");
    });

    it("should fail when annotation lacks idShort", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "AnnotatedRelationshipElement",
                idShort: "TestAnnotatedRel",
                first: {
                  type: "ModelReference",
                  keys: [{ type: "Submodel", value: "sm1" }],
                },
                second: {
                  type: "ModelReference",
                  keys: [{ type: "Submodel", value: "sm2" }],
                },
                annotations: [
                  {
                    modelType: "Property",
                    valueType: "xs:string",
                  } as any, // Missing idShort
                ],
              },
            ],
          },
        ],
      };

      const errors = AASd_047.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-047");
      expect(errors[0].message).toContain("idShort");
    });
  });

  describe("AASd-048: Entity Statement Validity", () => {
    it("should pass when entity statements are valid", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Entity",
                idShort: "TestEntity",
                entityType: "CoManagedEntity",
                statements: [
                  {
                    modelType: "Property",
                    idShort: "Statement1",
                    valueType: "xs:string",
                  },
                ],
              },
            ],
          },
        ],
      };

      const errors = AASd_048.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should fail when statement lacks modelType", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Entity",
                idShort: "TestEntity",
                entityType: "CoManagedEntity",
                statements: [
                  {
                    idShort: "Statement1",
                  } as any, // Missing modelType
                ],
              },
            ],
          },
        ],
      };

      const errors = AASd_048.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-048");
      expect(errors[0].message).toContain("valid SubmodelElement");
    });

    it("should fail when statement lacks idShort", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            submodelElements: [
              {
                modelType: "Entity",
                idShort: "TestEntity",
                entityType: "CoManagedEntity",
                statements: [
                  {
                    modelType: "Property",
                    valueType: "xs:string",
                  } as any, // Missing idShort
                ],
              },
            ],
          },
        ],
      };

      const errors = AASd_048.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-048");
      expect(errors[0].message).toContain("idShort");
    });
  });

  describe("AASd-049: Embedded Data Specification Content Validity", () => {
    it("should pass when data specification has valid content", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            embeddedDataSpecifications: [
              {
                dataSpecification: {
                  type: "ExternalReference",
                  keys: [
                    {
                      type: "GlobalReference",
                      value: "http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0",
                    },
                  ],
                },
                dataSpecificationContent: {
                  modelType: "DataSpecificationIec61360",
                  preferredName: [
                    { language: "en", text: "Test Specification" },
                  ],
                },
              },
            ],
          },
        ],
      };

      const errors = AASd_049.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });

    it("should fail when data specification lacks content", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            embeddedDataSpecifications: [
              {
                dataSpecification: {
                  type: "ExternalReference",
                  keys: [
                    {
                      type: "GlobalReference",
                      value: "http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0",
                    },
                  ],
                },
              } as any, // Missing dataSpecificationContent
            ],
          },
        ],
      };

      const errors = AASd_049.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-049");
      expect(errors[0].message).toContain("dataSpecificationContent");
    });

    it("should fail when IEC 61360 content lacks preferredName", () => {
      const env: Environment = {
        submodels: [
          {
            id: "test-sm",
            idShort: "TestSubmodel",
            embeddedDataSpecifications: [
              {
                dataSpecification: {
                  type: "ExternalReference",
                  keys: [
                    {
                      type: "GlobalReference",
                      value: "http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0",
                    },
                  ],
                },
                dataSpecificationContent: {
                  modelType: "DataSpecificationIec61360",
                  // Missing preferredName
                } as any,
              },
            ],
          },
        ],
      };

      const errors = AASd_049.validate(createContext(env));
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("AASd-049");
      expect(errors[0].message).toContain("preferredName");
    });
  });
});