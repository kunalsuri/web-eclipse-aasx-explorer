/**
 * Integration test for AASd Advanced Constraints (AASd-050, AASd-090)
 *
 * Verifies that the corrected AASd-050 (IEC 61360 data specification
 * template reference) and AASd-090 (DataElement category value) constraints
 * run correctly through the full ValidationEngine alongside sibling
 * constraints that inspect the same elements:
 *  - AASd-049 also inspects embeddedDataSpecifications/dataSpecificationContent
 *  - AASd-107 also inspects Property elements
 *
 * See ai/analysis/audit-reports/DEFECT_TRACEABILITY.md (ADV-2026-07-15-01)
 * for the audit finding that corrected these two rules.
 */

import { describe, it, expect } from "vitest";
import { ValidationEngine } from "@shared/aas-validation-engine";
import type { Environment } from "@shared/aas-v3-types";

describe("AASd Advanced Constraints Integration", () => {
  it("loads the corrected AASd-050 and AASd-090 rules into the validation engine", () => {
    const engine = new ValidationEngine();
    const allRules = engine.getRules();
    const ids = allRules.map((rule) => rule.id);

    expect(ids.filter((id) => id === "AASd-050")).toHaveLength(1);
    expect(ids.filter((id) => id === "AASd-090")).toHaveLength(1);
  });

  it("reports both AASd-049 and AASd-050 when an IEC 61360 data specification is malformed", () => {
    const engine = new ValidationEngine();

    const env: Environment = {
      submodels: [
        {
          id: "https://example.com/sm/technical-data",
          idShort: "TechnicalData",
          embeddedDataSpecifications: [
            {
              dataSpecification: {
                type: "ExternalReference",
                keys: [
                  {
                    type: "GlobalReference",
                    // Wrong IRI: violates AASd-050
                    value: "https://example.com/not-the-real-template",
                  },
                ],
              },
              dataSpecificationContent: {
                modelType: "DataSpecificationIec61360",
                // Missing preferredName: violates AASd-049
              } as any,
            },
          ],
        },
      ],
    };

    const result = engine.validate(env);
    const errorCodes = result.errors.map((e) => e.code);

    expect(errorCodes).toContain("AASd-049");
    expect(errorCodes).toContain("AASd-050");
  });

  it("accepts an IEC 61360 data specification that satisfies both AASd-049 and AASd-050", () => {
    const engine = new ValidationEngine();

    const env: Environment = {
      conceptDescriptions: [
        {
          id: "https://example.com/cd/temperature",
          idShort: "Temperature",
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
        },
      ],
    };

    const result = engine.validate(env);
    const errorCodes = result.errors.map((e) => e.code);

    expect(errorCodes).not.toContain("AASd-049");
    expect(errorCodes).not.toContain("AASd-050");
  });

  it("reports both AASd-090 and AASd-107 for a Property with an invalid category and valueType", () => {
    const engine = new ValidationEngine();

    const env: Environment = {
      submodels: [
        {
          id: "https://example.com/sm/technical-data",
          idShort: "TechnicalData",
          submodelElements: [
            {
              modelType: "Property",
              idShort: "BadProp",
              valueType: "xs:notARealType" as any, // violates AASd-107
              value: "1",
              category: "PROPERTY", // violates AASd-090 (not CONSTANT/PARAMETER/VARIABLE)
            } as any,
          ],
        },
      ],
    };

    const result = engine.validate(env);
    const errorCodes = result.errors.map((e) => e.code);

    expect(errorCodes).toContain("AASd-090");
    expect(errorCodes).toContain("AASd-107");
  });

  it("does not flag a well-formed Property (valid valueType, default category)", () => {
    const engine = new ValidationEngine();

    const env: Environment = {
      submodels: [
        {
          id: "https://example.com/sm/technical-data",
          idShort: "TechnicalData",
          submodelElements: [
            {
              modelType: "Property",
              idShort: "GoodProp",
              valueType: "xs:double",
              value: "42.0",
              // category omitted -> defaults to VARIABLE, valid
            },
          ],
        },
      ],
    };

    const result = engine.validate(env);
    const errorCodes = result.errors.map((e) => e.code);

    expect(errorCodes).not.toContain("AASd-090");
    expect(errorCodes).not.toContain("AASd-107");
  });
});
