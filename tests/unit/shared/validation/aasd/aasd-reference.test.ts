/**
 * Tests for AAS V3.0 Reference Constraints (AASd-098 to AASd-129)
 */

import { describe, it, expect } from "vitest";
import { AASdReferenceConstraints } from "@shared/validation-rules/aasd-reference";
import type { Environment, Reference } from "@shared/aas-v3-types";
import { ReferenceTypes, KeyTypes } from "@shared/aas-v3-types";
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

// Helper to create a basic reference
function createReference(
  type: ReferenceTypes,
  keys: Array<{ type: string; value: string }>
): Reference {
  return {
    type,
    keys: keys.map((k) => ({ type: k.type, value: k.value })),
  };
}

describe("AASd-098: Reference Type Must Be Valid", () => {
  const rule = AASdReferenceConstraints.find((r) => r.id === "AASd-098")!;

  it("should pass for valid ModelReference", () => {
    const env: Environment = {
      assetAdministrationShells: [
        {
          id: "aas1",
          idShort: "TestAAS",
          assetInformation: {
            assetKind: "Instance",
          },
          submodels: [
            createReference(ReferenceTypes.ModelReference, [
              { type: "Submodel", value: "sm1" },
            ]),
          ],
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should pass for valid ExternalReference", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
          semanticId: createReference(ReferenceTypes.ExternalReference, [
            { type: "GlobalReference", value: "https://example.com/concept" },
          ]),
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should fail for missing reference type", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
          semanticId: {
            type: undefined as any,
            keys: [{ type: "GlobalReference", value: "test" }],
          },
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-098");
    expect(errors[0].message).toContain("must have type defined");
  });

  it("should fail for invalid reference type", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
          semanticId: {
            type: "InvalidType" as any,
            keys: [{ type: "GlobalReference", value: "test" }],
          },
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-098");
    expect(errors[0].message).toContain("Invalid reference type");
  });
});

describe("AASd-099: Key Type Must Be Valid", () => {
  const rule = AASdReferenceConstraints.find((r) => r.id === "AASd-099")!;

  it("should pass for valid key types", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
          semanticId: createReference(ReferenceTypes.ModelReference, [
            { type: "Submodel", value: "sm1" },
            { type: "Property", value: "prop1" },
          ]),
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should fail for missing key type", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
          semanticId: {
            type: ReferenceTypes.ModelReference,
            keys: [{ type: undefined as any, value: "test" }],
          },
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-099");
    expect(errors[0].message).toContain("must have type defined");
  });

  it("should fail for invalid key type", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
          semanticId: {
            type: ReferenceTypes.ModelReference,
            keys: [{ type: "InvalidKeyType", value: "test" }],
          },
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-099");
    expect(errors[0].message).toContain("Invalid key type");
  });
});

describe("AASd-100: Key Value Must Not Be Empty", () => {
  const rule = AASdReferenceConstraints.find((r) => r.id === "AASd-100")!;

  it("should pass for non-empty key values", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
          semanticId: createReference(ReferenceTypes.ModelReference, [
            { type: "Submodel", value: "sm1" },
          ]),
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should fail for empty key value", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
          semanticId: {
            type: ReferenceTypes.ModelReference,
            keys: [{ type: "Submodel", value: "" }],
          },
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-100");
    expect(errors[0].message).toContain("must not be empty");
  });

  it("should fail for whitespace-only key value", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
          semanticId: {
            type: ReferenceTypes.ModelReference,
            keys: [{ type: "Submodel", value: "   " }],
          },
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-100");
  });
});

describe("AASd-101: GlobalReference For External References", () => {
  const rule = AASdReferenceConstraints.find((r) => r.id === "AASd-101")!;

  it("should pass for external URL with ExternalReference type", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
          semanticId: createReference(ReferenceTypes.ExternalReference, [
            { type: "GlobalReference", value: "https://example.com/concept" },
          ]),
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should pass for URN with ExternalReference type", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
          semanticId: createReference(ReferenceTypes.ExternalReference, [
            { type: "GlobalReference", value: "urn:example:concept:123" },
          ]),
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should fail for external URL with ModelReference type", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
          semanticId: {
            type: ReferenceTypes.ModelReference,
            keys: [{ type: "GlobalReference", value: "https://example.com/concept" }],
          },
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-101");
    expect(errors[0].message).toContain("must have type 'ExternalReference'");
  });
});

describe("AASd-102: ModelReference For Internal References", () => {
  const rule = AASdReferenceConstraints.find((r) => r.id === "AASd-102")!;

  it("should pass for internal reference with ModelReference type", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
          semanticId: createReference(ReferenceTypes.ModelReference, [
            { type: "ConceptDescription", value: "cd1" },
          ]),
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should fail for internal reference with ExternalReference type", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
          semanticId: {
            type: ReferenceTypes.ExternalReference,
            keys: [{ type: "ConceptDescription", value: "cd1" }],
          },
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-102");
    expect(errors[0].message).toContain("must have type 'ModelReference'");
  });
});

describe("AASd-108: Reference Integrity", () => {
  const rule = AASdReferenceConstraints.find((r) => r.id === "AASd-108")!;

  it("should pass for reference with keys", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
          semanticId: createReference(ReferenceTypes.ModelReference, [
            { type: "ConceptDescription", value: "cd1" },
          ]),
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should fail for reference without keys", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
          semanticId: {
            type: ReferenceTypes.ModelReference,
            keys: [],
          },
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-108");
    expect(errors[0].message).toContain("at least one key");
  });
});

describe("AASd-110: Reference Target Must Exist", () => {
  const rule = AASdReferenceConstraints.find((r) => r.id === "AASd-110")!;

  it("should pass when referenced Submodel exists", () => {
    const env: Environment = {
      assetAdministrationShells: [
        {
          id: "aas1",
          idShort: "TestAAS",
          assetInformation: {
            assetKind: "Instance",
          },
          submodels: [
            createReference(ReferenceTypes.ModelReference, [
              { type: "Submodel", value: "sm1" },
            ]),
          ],
        },
      ],
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should warn when referenced Submodel does not exist", () => {
    const env: Environment = {
      assetAdministrationShells: [
        {
          id: "aas1",
          idShort: "TestAAS",
          assetInformation: {
            assetKind: "Instance",
          },
          submodels: [
            createReference(ReferenceTypes.ModelReference, [
              { type: "Submodel", value: "nonexistent" },
            ]),
          ],
        },
      ],
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-110");
    expect(errors[0].message).toContain("not found");
  });
});

describe("AASd-117: SemanticId Reference Validation", () => {
  const rule = AASdReferenceConstraints.find((r) => r.id === "AASd-117")!;

  it("should pass when semanticId references ConceptDescription", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
          semanticId: createReference(ReferenceTypes.ModelReference, [
            { type: "ConceptDescription", value: "cd1" },
          ]),
        },
      ],
      conceptDescriptions: [
        {
          id: "cd1",
          idShort: "TestConcept",
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should warn when semanticId references non-ConceptDescription", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
          semanticId: createReference(ReferenceTypes.ModelReference, [
            { type: "Submodel", value: "sm2" },
          ]),
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-117");
    expect(errors[0].severity).toBe("warning");
  });

  it("should provide info when ConceptDescription not found", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
          semanticId: createReference(ReferenceTypes.ModelReference, [
            { type: "ConceptDescription", value: "nonexistent" },
          ]),
        },
      ],
      conceptDescriptions: [],
    };

    const errors = rule.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-117");
    expect(errors[0].severity).toBe("info");
    expect(errors[0].message).toContain("not found");
  });
});

describe("AASd-123: Reference Must Not Be Self-Referential", () => {
  const rule = AASdReferenceConstraints.find((r) => r.id === "AASd-123")!;

  it("should pass for non-self-referential reference", () => {
    const env: Environment = {
      assetAdministrationShells: [
        {
          id: "aas1",
          idShort: "TestAAS",
          assetInformation: {
            assetKind: "Instance",
          },
          submodels: [
            createReference(ReferenceTypes.ModelReference, [
              { type: "Submodel", value: "sm1" },
            ]),
          ],
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should warn for self-referential reference", () => {
    const env: Environment = {
      assetAdministrationShells: [
        {
          id: "aas1",
          idShort: "TestAAS",
          assetInformation: {
            assetKind: "Instance",
          },
          derivedFrom: createReference(ReferenceTypes.ModelReference, [
            { type: "AssetAdministrationShell", value: "aas1" },
          ]),
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-123");
    expect(errors[0].message).toContain("references itself");
  });
});

describe("AASd-125: External Reference URL Validation", () => {
  const rule = AASdReferenceConstraints.find((r) => r.id === "AASd-125")!;

  it("should pass for valid HTTP URL", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
          semanticId: createReference(ReferenceTypes.ExternalReference, [
            { type: "GlobalReference", value: "https://example.com/concept" },
          ]),
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should pass for valid URN", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
          semanticId: createReference(ReferenceTypes.ExternalReference, [
            { type: "GlobalReference", value: "urn:example:concept:123" },
          ]),
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should warn for invalid URL", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
          semanticId: createReference(ReferenceTypes.ExternalReference, [
            { type: "GlobalReference", value: "http://invalid url with spaces" },
          ]),
        },
      ],
    };

    const errors = rule.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-125");
    expect(errors[0].message).toContain("Invalid URL format");
  });
});

describe("Integration: Multiple Reference Constraints", () => {
  it("should validate complex reference scenarios", () => {
    const env: Environment = {
      assetAdministrationShells: [
        {
          id: "aas1",
          idShort: "TestAAS",
          assetInformation: {
            assetKind: "Instance",
          },
          submodels: [
            createReference(ReferenceTypes.ModelReference, [
              { type: "Submodel", value: "sm1" },
            ]),
          ],
        },
      ],
      submodels: [
        {
          id: "sm1",
          idShort: "TestSubmodel",
          semanticId: createReference(ReferenceTypes.ModelReference, [
            { type: "ConceptDescription", value: "cd1" },
          ]),
          submodelElements: [
            {
              idShort: "prop1",
              modelType: "Property",
              valueType: "xs:string",
              semanticId: createReference(ReferenceTypes.ExternalReference, [
                { type: "GlobalReference", value: "https://example.com/prop" },
              ]),
            },
          ],
        },
      ],
      conceptDescriptions: [
        {
          id: "cd1",
          idShort: "TestConcept",
        },
      ],
    };

    // Run all reference constraints
    const allErrors = AASdReferenceConstraints.flatMap((rule) =>
      rule.validate(createContext(env))
    );

    // Should have no errors for this valid environment
    const errors = allErrors.filter((e) => e.severity === "error");
    expect(errors).toHaveLength(0);
  });
});
