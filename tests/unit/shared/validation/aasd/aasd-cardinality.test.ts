/**
 * Tests for AASd Cardinality Constraints (AASd-144 to AASd-150)
 */

import { describe, it, expect } from "vitest";
import {
  AASd_144,
  AASd_145,
  AASd_146,
  AASd_147,
  AASd_148,
  AASd_149,
  AASd_150,
} from "@shared/validation-rules/aasd-cardinality";
import type { Environment } from "@shared/aas-v3-types";
import type { ValidationContext } from "@shared/validation-types";

// Helper to create validation context
function createContext(environment: Environment): ValidationContext {
  return {
    environment,
    element: environment,
    path: "",
    root: environment,
  };
}

describe("AASd-144: Submodel Element Cardinality", () => {
  it("should pass for submodel with elements", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
          submodelElements: [
            {
              idShort: "prop1",
              modelType: "Property",
              valueType: "xs:string",
            },
          ],
        },
      ],
    };

    const errors = AASd_144.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should provide info for empty submodel", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "EmptySubmodel",
          submodelElements: [],
        },
      ],
    };

    const errors = AASd_144.validate(createContext(env));
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("AASd-144");
    expect(errors[0].severity).toBe("info");
    expect(errors[0].message).toContain("no submodelElements");
  });

  it("should provide info for submodel without submodelElements property", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "MinimalSubmodel",
        },
      ],
    };

    const errors = AASd_144.validate(createContext(env));
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("AASd-144");
  });
});

describe("AASd-145: SubmodelElementCollection Cardinality", () => {
  it("should pass for collection with elements", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "collection1",
              modelType: "SubmodelElementCollection",
              value: [
                {
                  idShort: "prop1",
                  modelType: "Property",
                  valueType: "xs:string",
                },
              ],
            },
          ],
        },
      ],
    };

    const errors = AASd_145.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should provide info for empty collection", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "emptyCollection",
              modelType: "SubmodelElementCollection",
              value: [],
            },
          ],
        },
      ],
    };

    const errors = AASd_145.validate(createContext(env));
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("AASd-145");
    expect(errors[0].severity).toBe("info");
    expect(errors[0].message).toContain("is empty");
  });

  it("should provide info for collection without value property", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "collection1",
              modelType: "SubmodelElementCollection",
            },
          ],
        },
      ],
    };

    const errors = AASd_145.validate(createContext(env));
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("AASd-145");
  });
});


describe("AASd-146: SubmodelElementList Cardinality", () => {
  it("should pass for list with elements", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "list1",
              modelType: "SubmodelElementList",
              typeValueListElement: "Property",
              value: [
                {
                  modelType: "Property",
                  valueType: "xs:string",
                  value: "item1",
                },
              ],
            },
          ],
        },
      ],
    };

    const errors = AASd_146.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should provide info for empty list", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "emptyList",
              modelType: "SubmodelElementList",
              typeValueListElement: "Property",
              value: [],
            },
          ],
        },
      ],
    };

    const errors = AASd_146.validate(createContext(env));
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("AASd-146");
    expect(errors[0].severity).toBe("info");
    expect(errors[0].message).toContain("is empty");
  });

  it("should provide info for list without value property", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "list1",
              modelType: "SubmodelElementList",
              typeValueListElement: "Property",
            },
          ],
        },
      ],
    };

    const errors = AASd_146.validate(createContext(env));
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("AASd-146");
  });
});

describe("AASd-147: Operation Variables Cardinality", () => {
  it("should pass for operation with input variables", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "operation1",
              modelType: "Operation",
              inputVariables: [
                {
                  value: {
                    idShort: "input1",
                    modelType: "Property",
                    valueType: "xs:string",
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    const errors = AASd_147.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should pass for operation with output variables", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "operation1",
              modelType: "Operation",
              outputVariables: [
                {
                  value: {
                    idShort: "output1",
                    modelType: "Property",
                    valueType: "xs:string",
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    const errors = AASd_147.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should pass for operation with inoutput variables", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "operation1",
              modelType: "Operation",
              inoutputVariables: [
                {
                  value: {
                    idShort: "inout1",
                    modelType: "Property",
                    valueType: "xs:string",
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    const errors = AASd_147.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should provide info for operation without variables", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "emptyOperation",
              modelType: "Operation",
            },
          ],
        },
      ],
    };

    const errors = AASd_147.validate(createContext(env));
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("AASd-147");
    expect(errors[0].severity).toBe("info");
    expect(errors[0].message).toContain("no variables");
  });

  it("should provide info for operation with empty variable arrays", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "operation1",
              modelType: "Operation",
              inputVariables: [],
              outputVariables: [],
              inoutputVariables: [],
            },
          ],
        },
      ],
    };

    const errors = AASd_147.validate(createContext(env));
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("AASd-147");
  });
});


describe("AASd-148: Entity Statements Cardinality", () => {
  it("should pass for entity with statements", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "entity1",
              modelType: "Entity",
              entityType: "CoManagedEntity",
              statements: [
                {
                  idShort: "prop1",
                  modelType: "Property",
                  valueType: "xs:string",
                },
              ],
            },
          ],
        },
      ],
    };

    const errors = AASd_148.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should provide info for entity without statements", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "emptyEntity",
              modelType: "Entity",
              entityType: "SelfManagedEntity",
              statements: [],
            },
          ],
        },
      ],
    };

    const errors = AASd_148.validate(createContext(env));
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("AASd-148");
    expect(errors[0].severity).toBe("info");
    expect(errors[0].message).toContain("no statements");
  });

  it("should provide info for entity without statements property", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "entity1",
              modelType: "Entity",
              entityType: "CoManagedEntity",
            },
          ],
        },
      ],
    };

    const errors = AASd_148.validate(createContext(env));
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("AASd-148");
  });
});

describe("AASd-149: AnnotatedRelationshipElement Annotations Cardinality", () => {
  it("should pass for annotated relationship with annotations", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "annotatedRel1",
              modelType: "AnnotatedRelationshipElement",
              first: {
                type: "ModelReference",
                keys: [{ type: "Property", value: "prop1" }],
              },
              second: {
                type: "ModelReference",
                keys: [{ type: "Property", value: "prop2" }],
              },
              annotations: [
                {
                  idShort: "annotation1",
                  modelType: "Property",
                  valueType: "xs:string",
                  value: "annotation value",
                },
              ],
            },
          ],
        },
      ],
    };

    const errors = AASd_149.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should provide info for annotated relationship without annotations", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "annotatedRel1",
              modelType: "AnnotatedRelationshipElement",
              first: {
                type: "ModelReference",
                keys: [{ type: "Property", value: "prop1" }],
              },
              second: {
                type: "ModelReference",
                keys: [{ type: "Property", value: "prop2" }],
              },
              annotations: [],
            },
          ],
        },
      ],
    };

    const errors = AASd_149.validate(createContext(env));
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("AASd-149");
    expect(errors[0].severity).toBe("info");
    expect(errors[0].message).toContain("no annotations");
  });

  it("should provide info for annotated relationship without annotations property", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "annotatedRel1",
              modelType: "AnnotatedRelationshipElement",
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

    const errors = AASd_149.validate(createContext(env));
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("AASd-149");
  });
});

describe("AASd-150: ConceptDescription IsCaseOf Cardinality", () => {
  it("should pass for concept description with isCaseOf references", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "cd1",
          idShort: "TestConcept",
          isCaseOf: [
            {
              type: "ExternalReference",
              keys: [{ type: "GlobalReference", value: "http://example.com/concept" }],
            },
          ],
        },
      ],
    };

    const errors = AASd_150.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should pass for concept description without isCaseOf property", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "cd1",
          idShort: "TestConcept",
        },
      ],
    };

    const errors = AASd_150.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should provide info for concept description with empty isCaseOf array", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "cd1",
          idShort: "TestConcept",
          isCaseOf: [],
        },
      ],
    };

    const errors = AASd_150.validate(createContext(env));
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("AASd-150");
    expect(errors[0].severity).toBe("info");
    expect(errors[0].message).toContain("empty isCaseOf");
  });
});
