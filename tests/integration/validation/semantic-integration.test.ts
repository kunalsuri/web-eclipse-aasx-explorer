/**
 * Integration tests for semantic constraints
 * Tests the complete semantic validation workflow
 */

import { describe, it, expect } from "vitest";
import { AASdSemanticConstraints } from "@shared/validation-rules/aasd-semantic";
import type { ValidationContext } from "@shared/validation-types";
import type { Environment } from "@shared/aas-v3-types";

function createContext(environment: Environment): ValidationContext {
  return {
    environment,
    element: environment,
    path: "",
    root: environment,
  };
}

describe("Semantic Constraints Integration", () => {
  it("should have semantic constraints", () => {
    // Currently 43 implemented, spec calls for 45 total
    expect(AASdSemanticConstraints.length).toBeGreaterThanOrEqual(43);
  });

  it("should validate a complete valid AAS model with IEC 61360", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "https://example.com/cd/temperature",
          category: "PROPERTY",
          idShort: "Temperature",
          embeddedDataSpecifications: [
            {
              dataSpecification: {
                type: "ExternalReference",
                keys: [
                  {
                    type: "GlobalReference",
                    value: "https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIec61360/3/0",
                  },
                ],
              },
              dataSpecificationContent: {
                preferredName: [
                  { language: "en", text: "Temperature" },
                  { language: "de", text: "Temperatur" },
                ],
                definition: [
                  { language: "en", text: "Measure of thermal energy" },
                ],
                dataType: "REAL_MEASURE",
                unit: "°C",
                levelType: {
                  min: "-273.15",
                  max: "1000",
                },
              },
            },
          ],
        },
      ],
      submodels: [
        {
          id: "https://example.com/sm/technical-data",
          idShort: "TechnicalData",
          semanticId: {
            type: "ExternalReference",
            keys: [
              {
                type: "GlobalReference",
                value: "https://example.com/semantics/technical-data",
              },
            ],
          },
          submodelElements: [
            {
              modelType: "Property",
              idShort: "MaxTemperature",
              valueType: "xs:double",
              value: "85.0",
              semanticId: {
                type: "ModelReference",
                keys: [
                  {
                    type: "ConceptDescription",
                    value: "https://example.com/cd/temperature",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const ctx = createContext(env);
    let totalErrors = 0;

    // Run all semantic constraints
    for (const rule of AASdSemanticConstraints) {
      const errors = rule.validate(ctx);
      totalErrors += errors.filter((e) => e.severity === "error").length;
    }

    expect(totalErrors).toBe(0);
  });

  it("should detect multiple semantic violations", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "", // AASd-054: Missing ID
          // Missing category - AASd-055
          embeddedDataSpecifications: [
            {
              dataSpecification: {
                type: "ExternalReference",
                keys: [{ type: "GlobalReference", value: "http://example.com/spec" }],
              },
              dataSpecificationContent: {
                preferredName: [], // AASd-059: Empty preferredName
                dataType: "INVALID_TYPE", // AASd-073: Invalid dataType
              },
            },
          ],
        },
      ],
    };

    const ctx = createContext(env);
    let totalErrors = 0;
    let totalWarnings = 0;

    for (const rule of AASdSemanticConstraints) {
      const errors = rule.validate(ctx);
      totalErrors += errors.filter((e) => e.severity === "error").length;
      totalWarnings += errors.filter((e) => e.severity === "warning").length;
    }

    expect(totalErrors).toBeGreaterThan(0);
    expect(totalWarnings).toBeGreaterThan(0);
  });

  it("should validate IEC 61360 data specification completeness", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "cd1",
          category: "PROPERTY",
          embeddedDataSpecifications: [
            {
              dataSpecification: {
                type: "ExternalReference",
                keys: [{ type: "GlobalReference", value: "http://example.com/spec" }],
              },
              dataSpecificationContent: {
                preferredName: [{ language: "en", text: "Test Property" }],
                dataType: "INTEGER_MEASURE",
                unit: "mm",
                definition: [{ language: "en", text: "A test property" }],
                valueList: {
                  valueReferencePairs: [
                    {
                      value: "1",
                      valueId: {
                        type: "ExternalReference",
                        keys: [{ type: "GlobalReference", value: "http://example.com/value1" }],
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      ],
    };

    const ctx = createContext(env);
    let totalErrors = 0;

    for (const rule of AASdSemanticConstraints) {
      const errors = rule.validate(ctx);
      totalErrors += errors.filter((e) => e.severity === "error").length;
    }

    expect(totalErrors).toBe(0);
  });

  it("should validate semantic reference chains", () => {
    const env: Environment = {
      conceptDescriptions: [
        {
          id: "cd1",
          category: "PROPERTY",
          isCaseOf: [
            {
              type: "ModelReference",
              keys: [{ type: "ConceptDescription", value: "cd2" }],
            },
          ],
        },
        {
          id: "cd2",
          category: "CONCEPT",
        },
      ],
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

    const ctx = createContext(env);
    let totalErrors = 0;

    for (const rule of AASdSemanticConstraints) {
      const errors = rule.validate(ctx);
      totalErrors += errors.filter((e) => e.severity === "error").length;
    }

    expect(totalErrors).toBe(0);
  });
});
