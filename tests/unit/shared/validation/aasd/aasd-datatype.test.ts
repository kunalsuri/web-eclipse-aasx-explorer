/**
 * Tests for AASd Data Type Constraints (AASd-132 to AASd-143)
 */

import { describe, it, expect } from "vitest";
import {
  AASd_132,
  AASd_133,
  AASd_134,
  AASd_135,
  AASd_136,
  AASd_137,
  AASd_138,
  AASd_139,
  AASd_140,
  AASd_141,
  AASd_142,
  AASd_143,
} from "@shared/validation-rules/aasd-datatype";
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

describe("AASd-132: Property Value Type Conformance", () => {
  it("should pass for valid integer property value", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "prop1",
              modelType: "Property",
              valueType: "xs:integer",
              value: "42",
            },
          ],
        },
      ],
    };

    const errors = AASd_132.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should fail for invalid integer property value", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "prop1",
              modelType: "Property",
              valueType: "xs:integer",
              value: "not-a-number",
            },
          ],
        },
      ],
    };

    const errors = AASd_132.validate(createContext(env));
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("AASd-132");
    expect(errors[0].message).toContain("does not conform");
  });

  it("should pass for valid boolean property value", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "prop1",
              modelType: "Property",
              valueType: "xs:boolean",
              value: "true",
            },
          ],
        },
      ],
    };

    const errors = AASd_132.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should pass for valid float property value", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "prop1",
              modelType: "Property",
              valueType: "xs:float",
              value: "123.45",
            },
          ],
        },
      ],
    };

    const errors = AASd_132.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should pass for empty value", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "prop1",
              modelType: "Property",
              valueType: "xs:integer",
              value: "",
            },
          ],
        },
      ],
    };

    const errors = AASd_132.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });
});

describe("AASd-133: Range Min Value Type Conformance", () => {
  it("should pass for valid range min value", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "range1",
              modelType: "Range",
              valueType: "xs:integer",
              min: "10",
              max: "100",
            },
          ],
        },
      ],
    };

    const errors = AASd_133.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should fail for invalid range min value", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "range1",
              modelType: "Range",
              valueType: "xs:integer",
              min: "not-a-number",
              max: "100",
            },
          ],
        },
      ],
    };

    const errors = AASd_133.validate(createContext(env));
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("AASd-133");
    expect(errors[0].path).toContain(".min");
  });
});

describe("AASd-134: Range Max Value Type Conformance", () => {
  it("should pass for valid range max value", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "range1",
              modelType: "Range",
              valueType: "xs:double",
              min: "10.5",
              max: "100.5",
            },
          ],
        },
      ],
    };

    const errors = AASd_134.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should fail for invalid range max value", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "range1",
              modelType: "Range",
              valueType: "xs:double",
              min: "10.5",
              max: "invalid",
            },
          ],
        },
      ],
    };

    const errors = AASd_134.validate(createContext(env));
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("AASd-134");
    expect(errors[0].path).toContain(".max");
  });
});

describe("AASd-135: Qualifier Value Type Conformance", () => {
  it("should pass for valid qualifier value", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          qualifiers: [
            {
              type: "MaxValue",
              valueType: "xs:integer",
              value: "100",
            },
          ],
        },
      ],
    };

    const errors = AASd_135.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should fail for invalid qualifier value", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          qualifiers: [
            {
              type: "MaxValue",
              valueType: "xs:integer",
              value: "not-an-integer",
            },
          ],
        },
      ],
    };

    const errors = AASd_135.validate(createContext(env));
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("AASd-135");
    expect(errors[0].path).toContain("qualifiers");
  });

  it("should validate qualifiers in nested elements", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "prop1",
              modelType: "Property",
              valueType: "xs:string",
              qualifiers: [
                {
                  type: "Precision",
                  valueType: "xs:double",
                  value: "invalid-double",
                },
              ],
            },
          ],
        },
      ],
    };

    const errors = AASd_135.validate(createContext(env));
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("AASd-135");
  });
});

describe("AASd-136: Extension Value Type Conformance", () => {
  it("should pass for valid extension value", () => {
    const env: Environment = {
      assetAdministrationShells: [
        {
          id: "aas1",
          assetInformation: { assetKind: "Instance" },
          extensions: [
            {
              name: "customField",
              valueType: "xs:string",
              value: "some text",
            },
          ],
        },
      ],
    };

    const errors = AASd_136.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });

  it("should fail for invalid extension value", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          extensions: [
            {
              name: "customNumber",
              valueType: "xs:integer",
              value: "not-a-number",
            },
          ],
        },
      ],
    };

    const errors = AASd_136.validate(createContext(env));
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("AASd-136");
    expect(errors[0].path).toContain("extensions");
  });
});

describe("AASd-137: Boolean Value Validation", () => {
  it("should pass for valid boolean values", () => {
    const validValues = ["true", "false", "1", "0"];
    
    validValues.forEach((value) => {
      const env: Environment = {
        submodels: [
          {
            id: "sm1",
            submodelElements: [
              {
                idShort: "boolProp",
                modelType: "Property",
                valueType: "xs:boolean",
                value,
              },
            ],
          },
        ],
      };

      const errors = AASd_137.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });
  });

  it("should fail for invalid boolean values", () => {
    const invalidValues = ["yes", "no", "TRUE", "FALSE", "2", "-1"];
    
    invalidValues.forEach((value) => {
      const env: Environment = {
        submodels: [
          {
            id: "sm1",
            submodelElements: [
              {
                idShort: "boolProp",
                modelType: "Property",
                valueType: "xs:boolean",
                value,
              },
            ],
          },
        ],
      };

      const errors = AASd_137.validate(createContext(env));
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].code).toBe("AASd-137");
    });
  });
});

describe("AASd-138: Integer Value Validation", () => {
  it("should pass for valid integer values", () => {
    const testCases = [
      { valueType: "xs:integer", value: "42" },
      { valueType: "xs:integer", value: "-123" },
      { valueType: "xs:int", value: "0" },
      { valueType: "xs:positiveInteger", value: "1" },
      { valueType: "xs:nonNegativeInteger", value: "0" },
      { valueType: "xs:negativeInteger", value: "-1" },
    ];

    testCases.forEach(({ valueType, value }) => {
      const env: Environment = {
        submodels: [
          {
            id: "sm1",
            submodelElements: [
              {
                idShort: "intProp",
                modelType: "Property",
                valueType: valueType as any,
                value,
              },
            ],
          },
        ],
      };

      const errors = AASd_138.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });
  });

  it("should fail for invalid integer values", () => {
    const testCases = [
      { valueType: "xs:integer", value: "12.5" },
      { valueType: "xs:integer", value: "abc" },
      { valueType: "xs:positiveInteger", value: "0" },
      { valueType: "xs:positiveInteger", value: "-1" },
      { valueType: "xs:nonNegativeInteger", value: "-1" },
      { valueType: "xs:negativeInteger", value: "1" },
    ];

    testCases.forEach(({ valueType, value }) => {
      const env: Environment = {
        submodels: [
          {
            id: "sm1",
            submodelElements: [
              {
                idShort: "intProp",
                modelType: "Property",
                valueType: valueType as any,
                value,
              },
            ],
          },
        ],
      };

      const errors = AASd_138.validate(createContext(env));
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].code).toBe("AASd-138");
    });
  });
});

describe("AASd-139: Float/Double Value Validation", () => {
  it("should pass for valid float values", () => {
    const testCases = [
      { valueType: "xs:float", value: "123.45" },
      { valueType: "xs:double", value: "-0.5" },
      { valueType: "xs:decimal", value: "1.23e-4" },
      { valueType: "xs:float", value: "42" },
      { valueType: "xs:double", value: "1.23E+10" },
    ];

    testCases.forEach(({ valueType, value }) => {
      const env: Environment = {
        submodels: [
          {
            id: "sm1",
            submodelElements: [
              {
                idShort: "floatProp",
                modelType: "Property",
                valueType: valueType as any,
                value,
              },
            ],
          },
        ],
      };

      const errors = AASd_139.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });
  });

  it("should fail for invalid float values", () => {
    const testCases = [
      { valueType: "xs:float", value: "not-a-number" },
      { valueType: "xs:double", value: "12.34.56" },
      { valueType: "xs:decimal", value: "abc" },
    ];

    testCases.forEach(({ valueType, value }) => {
      const env: Environment = {
        submodels: [
          {
            id: "sm1",
            submodelElements: [
              {
                idShort: "floatProp",
                modelType: "Property",
                valueType: valueType as any,
                value,
              },
            ],
          },
        ],
      };

      const errors = AASd_139.validate(createContext(env));
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].code).toBe("AASd-139");
    });
  });
});

describe("AASd-140: String Value Validation", () => {
  it("should always pass for string values", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "stringProp",
              modelType: "Property",
              valueType: "xs:string",
              value: "any string is valid",
            },
          ],
        },
      ],
    };

    const errors = AASd_140.validate(createContext(env));
    expect(errors).toHaveLength(0);
  });
});

describe("AASd-141: DateTime Value Validation", () => {
  it("should pass for valid dateTime values", () => {
    const testCases = [
      { valueType: "xs:dateTime", value: "2023-12-25T10:30:00" },
      { valueType: "xs:dateTime", value: "2023-12-25T10:30:00Z" },
      { valueType: "xs:dateTime", value: "2023-12-25T10:30:00+01:00" },
      { valueType: "xs:date", value: "2023-12-25" },
      { valueType: "xs:time", value: "10:30:00" },
      { valueType: "xs:gYear", value: "2023" },
      { valueType: "xs:gYearMonth", value: "2023-12" },
    ];

    testCases.forEach(({ valueType, value }) => {
      const env: Environment = {
        submodels: [
          {
            id: "sm1",
            submodelElements: [
              {
                idShort: "dateProp",
                modelType: "Property",
                valueType: valueType as any,
                value,
              },
            ],
          },
        ],
      };

      const errors = AASd_141.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });
  });

  it("should fail for invalid dateTime values", () => {
    const testCases = [
      { valueType: "xs:dateTime", value: "not-a-date" },
      { valueType: "xs:date", value: "25-12-2023" },
      { valueType: "xs:time", value: "invalid-time" },
      { valueType: "xs:gYear", value: "23" },
    ];

    testCases.forEach(({ valueType, value }) => {
      const env: Environment = {
        submodels: [
          {
            id: "sm1",
            submodelElements: [
              {
                idShort: "dateProp",
                modelType: "Property",
                valueType: valueType as any,
                value,
              },
            ],
          },
        ],
      };

      const errors = AASd_141.validate(createContext(env));
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].code).toBe("AASd-141");
    });
  });
});

describe("AASd-142: Duration Value Validation", () => {
  it("should pass for valid duration values", () => {
    const validDurations = [
      "P1Y2M3DT4H5M6S",
      "PT1H30M",
      "P7D",
      "PT30M",
      "P1Y",
      "PT0.5S",
    ];

    validDurations.forEach((value) => {
      const env: Environment = {
        submodels: [
          {
            id: "sm1",
            submodelElements: [
              {
                idShort: "durationProp",
                modelType: "Property",
                valueType: "xs:duration",
                value,
              },
            ],
          },
        ],
      };

      const errors = AASd_142.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });
  });

  it("should fail for invalid duration values", () => {
    const invalidDurations = [
      "1 hour",
      "30 minutes",
      "1Y2M3D",
      "P",
      "PT",
    ];

    invalidDurations.forEach((value) => {
      const env: Environment = {
        submodels: [
          {
            id: "sm1",
            submodelElements: [
              {
                idShort: "durationProp",
                modelType: "Property",
                valueType: "xs:duration",
                value,
              },
            ],
          },
        ],
      };

      const errors = AASd_142.validate(createContext(env));
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].code).toBe("AASd-142");
    });
  });
});

describe("AASd-143: Base64 Value Validation", () => {
  it("should pass for valid base64 values", () => {
    const validBase64 = [
      "SGVsbG8gV29ybGQ=",
      "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXo=",
      "MTIzNDU2Nzg5MA==",
    ];

    validBase64.forEach((value) => {
      const env: Environment = {
        submodels: [
          {
            id: "sm1",
            submodelElements: [
              {
                idShort: "base64Prop",
                modelType: "Property",
                valueType: "xs:base64Binary",
                value,
              },
            ],
          },
        ],
      };

      const errors = AASd_143.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });
  });

  it("should fail for invalid base64 values", () => {
    const invalidBase64 = [
      "not-base64!",
      "SGVsbG8gV29ybGQ",  // Missing padding
      "Hello World",
    ];

    invalidBase64.forEach((value) => {
      const env: Environment = {
        submodels: [
          {
            id: "sm1",
            submodelElements: [
              {
                idShort: "base64Prop",
                modelType: "Property",
                valueType: "xs:base64Binary",
                value,
              },
            ],
          },
        ],
      };

      const errors = AASd_143.validate(createContext(env));
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].code).toBe("AASd-143");
    });
  });

  it("should pass for valid hexBinary values", () => {
    const validHex = [
      "48656C6C6F",
      "ABCDEF0123456789",
      "00",
    ];

    validHex.forEach((value) => {
      const env: Environment = {
        submodels: [
          {
            id: "sm1",
            submodelElements: [
              {
                idShort: "hexProp",
                modelType: "Property",
                valueType: "xs:hexBinary",
                value,
              },
            ],
          },
        ],
      };

      const errors = AASd_143.validate(createContext(env));
      expect(errors).toHaveLength(0);
    });
  });

  it("should fail for invalid hexBinary values", () => {
    const invalidHex = [
      "GHIJKL",  // Invalid hex characters
      "123",     // Odd length
      "Hello",
    ];

    invalidHex.forEach((value) => {
      const env: Environment = {
        submodels: [
          {
            id: "sm1",
            submodelElements: [
              {
                idShort: "hexProp",
                modelType: "Property",
                valueType: "xs:hexBinary",
                value,
              },
            ],
          },
        ],
      };

      const errors = AASd_143.validate(createContext(env));
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].code).toBe("AASd-143");
    });
  });

  it("should validate Blob values as base64", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "blob1",
              modelType: "Blob",
              contentType: "image/png",
              value: "not-valid-base64!",
            },
          ],
        },
      ],
    };

    const errors = AASd_143.validate(createContext(env));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("AASd-143");
    expect(errors[0].message).toContain("Base64");
  });
});
