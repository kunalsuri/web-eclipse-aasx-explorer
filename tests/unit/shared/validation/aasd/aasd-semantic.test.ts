/**
 * Tests for AAS V3.0 Semantic Constraints (AASd-053 to AASd-097)
 */

import { describe, it, expect } from "vitest";
import {
  AASd_053,
  AASd_054,
  AASd_055,
  AASd_056,
  AASd_057,
  AASd_058,
  AASd_059,
  AASd_060,
  AASd_061,
  AASd_062,
  AASd_063,
  AASd_064,
  AASd_065,
  AASd_066,
  AASd_067,
  AASd_068,
  AASd_069,
  AASd_070,
  AASd_071,
  AASd_072,
  AASd_073,
  AASd_074,
  AASd_075,
  AASd_076,
  AASd_077,
} from "@shared/validation-rules/aasd-semantic";
import type { ValidationContext } from "@shared/validation-types";
import type { Environment } from "@shared/aas-v3-types";

// Helper to create validation context
function createContext(environment: Environment): ValidationContext {
  return {
    environment,
    element: environment,
    path: "",
    root: environment,
  };
}

describe("AASd-053: SemanticId Must Reference ConceptDescription", () => {
  it("should pass when semanticId references ConceptDescription", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          semanticId: {
            type: "ModelReference",
            keys: [{ type: "ConceptDescription", value: "cd1" }],
          },
        },
      ],
    };

    const errors = AASd_053.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should pass when semanticId is ExternalReference", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          semanticId: {
            type: "ExternalReference",
            keys: [{ type: "GlobalReference", value: "http://example.com/concept" }],
          },
        },
      ],
    };

    const errors = AASd_053.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should warn when semanticId does not reference ConceptDescription", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          semanticId: {
            type: "ModelReference",
            keys: [{ type: "Submodel", value: "sm2" }],
          },
        },
      ],
    };

    const errors = AASd_053.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-053");
    expect(errors[0].severity).toBe("warning");
  });
});

describe("AASd-054: ConceptDescription Must Have ID", () => {
  it("should pass when ConceptDescription has id", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "cd1",
        },
      ],
    };

    const errors = AASd_054.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should fail when ConceptDescription has no id", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "",
        },
      ],
    };

    const errors = AASd_054.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-054");
    expect(errors[0].severity).toBe("error");
  });
});

describe("AASd-055: ConceptDescription Should Have Category", () => {
  it("should pass when ConceptDescription has category", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "cd1",
          category: "PROPERTY",
        },
      ],
    };

    const errors = AASd_055.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should warn when ConceptDescription has no category", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "cd1",
        },
      ],
    };

    const errors = AASd_055.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-055");
    expect(errors[0].severity).toBe("warning");
  });
});

describe("AASd-056: IsCaseOf Must Reference ConceptDescription", () => {
  it("should pass when isCaseOf references ConceptDescription", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "cd1",
          isCaseOf: [
            {
              type: "ModelReference",
              keys: [{ type: "ConceptDescription", value: "cd2" }],
            },
          ],
        },
      ],
    };

    const errors = AASd_056.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should fail when isCaseOf does not reference ConceptDescription", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "cd1",
          isCaseOf: [
            {
              type: "ModelReference",
              keys: [{ type: "Submodel", value: "sm1" }],
            },
          ],
        },
      ],
    };

    const errors = AASd_056.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-056");
    expect(errors[0].severity).toBe("error");
  });
});

describe("AASd-057: DataSpecification Must Be Valid", () => {
  it("should pass when embeddedDataSpecifications is valid", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "cd1",
          embeddedDataSpecifications: [
            {
              dataSpecification: {
                type: "ExternalReference",
                keys: [{ type: "GlobalReference", value: "http://example.com/spec" }],
              },
              dataSpecificationContent: {
                preferredName: [{ language: "en", text: "Test" }],
              },
            },
          ],
        },
      ],
    };

    const errors = AASd_057.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should fail when dataSpecification is missing", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "cd1",
          embeddedDataSpecifications: [
            {
              dataSpecificationContent: {
                preferredName: [{ language: "en", text: "Test" }],
              },
            } as any,
          ],
        },
      ],
    };

    const errors = AASd_057.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-057");
  });
});

describe("AASd-058: EmbeddedDataSpecification Must Have Content", () => {
  it("should pass when dataSpecificationContent is present", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "cd1",
          embeddedDataSpecifications: [
            {
              dataSpecification: {
                type: "ExternalReference",
                keys: [{ type: "GlobalReference", value: "http://example.com/spec" }],
              },
              dataSpecificationContent: {
                preferredName: [{ language: "en", text: "Test" }],
              },
            },
          ],
        },
      ],
    };

    const errors = AASd_058.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should fail when dataSpecificationContent is missing", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "cd1",
          embeddedDataSpecifications: [
            {
              dataSpecification: {
                type: "ExternalReference",
                keys: [{ type: "GlobalReference", value: "http://example.com/spec" }],
              },
            } as any,
          ],
        },
      ],
    };

    const errors = AASd_058.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-058");
  });
});

describe("AASd-059: PreferredName Required for IEC 61360", () => {
  it("should pass when preferredName is present", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "cd1",
          embeddedDataSpecifications: [
            {
              dataSpecification: {
                type: "ExternalReference",
                keys: [{ type: "GlobalReference", value: "http://example.com/spec" }],
              },
              dataSpecificationContent: {
                preferredName: [{ language: "en", text: "Test Property" }],
              },
            },
          ],
        },
      ],
    };

    const errors = AASd_059.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should fail when preferredName is empty", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "cd1",
          embeddedDataSpecifications: [
            {
              dataSpecification: {
                type: "ExternalReference",
                keys: [{ type: "GlobalReference", value: "http://example.com/spec" }],
              },
              dataSpecificationContent: {
                preferredName: [],
              },
            },
          ],
        },
      ],
    };

    const errors = AASd_059.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-059");
  });
});

describe("AASd-060: DataType Required for IEC 61360", () => {
  it("should pass when dataType is present", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "cd1",
          embeddedDataSpecifications: [
            {
              dataSpecification: {
                type: "ExternalReference",
                keys: [{ type: "GlobalReference", value: "http://example.com/spec" }],
              },
              dataSpecificationContent: {
                preferredName: [{ language: "en", text: "Test" }],
                dataType: "STRING",
              },
            },
          ],
        },
      ],
    };

    const errors = AASd_060.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should fail when dataType is missing", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "cd1",
          embeddedDataSpecifications: [
            {
              dataSpecification: {
                type: "ExternalReference",
                keys: [{ type: "GlobalReference", value: "http://example.com/spec" }],
              },
              dataSpecificationContent: {
                preferredName: [{ language: "en", text: "Test" }],
                dataType: undefined,
              },
            },
          ],
        },
      ],
    };

    const errors = AASd_060.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-060");
  });
});

describe("AASd-073: DataType Must Be Valid IEC 61360 Type", () => {
  it("should pass with valid dataType", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "cd1",
          embeddedDataSpecifications: [
            {
              dataSpecification: {
                type: "ExternalReference",
                keys: [{ type: "GlobalReference", value: "http://example.com/spec" }],
              },
              dataSpecificationContent: {
                preferredName: [{ language: "en", text: "Test" }],
                dataType: "STRING",
              },
            },
          ],
        },
      ],
    };

    const errors = AASd_073.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should fail with invalid dataType", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "cd1",
          embeddedDataSpecifications: [
            {
              dataSpecification: {
                type: "ExternalReference",
                keys: [{ type: "GlobalReference", value: "http://example.com/spec" }],
              },
              dataSpecificationContent: {
                preferredName: [{ language: "en", text: "Test" }],
                dataType: "INVALID_TYPE",
              },
            },
          ],
        },
      ],
    };

    const errors = AASd_073.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-073");
  });
});

describe("AASd-071: LevelType Must Have Min And Max", () => {
  it("should pass when levelType has min and max", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "cd1",
          embeddedDataSpecifications: [
            {
              dataSpecification: {
                type: "ExternalReference",
                keys: [{ type: "GlobalReference", value: "http://example.com/spec" }],
              },
              dataSpecificationContent: {
                preferredName: [{ language: "en", text: "Test" }],
                levelType: {
                  min: "0",
                  max: "100",
                },
              },
            },
          ],
        },
      ],
    };

    const errors = AASd_071.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should fail when levelType is missing min", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "cd1",
          embeddedDataSpecifications: [
            {
              dataSpecification: {
                type: "ExternalReference",
                keys: [{ type: "GlobalReference", value: "http://example.com/spec" }],
              },
              dataSpecificationContent: {
                preferredName: [{ language: "en", text: "Test" }],
                levelType: {
                  max: "100",
                } as any,
              },
            },
          ],
        },
      ],
    };

    const errors = AASd_071.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-071");
  });
});

describe("AASd-072: LevelType Min Max Constraint", () => {
  it("should pass when min <= max", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "cd1",
          embeddedDataSpecifications: [
            {
              dataSpecification: {
                type: "ExternalReference",
                keys: [{ type: "GlobalReference", value: "http://example.com/spec" }],
              },
              dataSpecificationContent: {
                preferredName: [{ language: "en", text: "Test" }],
                levelType: {
                  min: "0",
                  max: "100",
                },
              },
            },
          ],
        },
      ],
    };

    const errors = AASd_072.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should fail when min > max", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "cd1",
          embeddedDataSpecifications: [
            {
              dataSpecification: {
                type: "ExternalReference",
                keys: [{ type: "GlobalReference", value: "http://example.com/spec" }],
              },
              dataSpecificationContent: {
                preferredName: [{ language: "en", text: "Test" }],
                levelType: {
                  min: "100",
                  max: "0",
                },
              },
            },
          ],
        },
      ],
    };

    const errors = AASd_072.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-072");
  });
});
