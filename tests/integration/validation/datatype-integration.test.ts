/**
 * Integration test for data type constraints
 */

import { describe, it, expect } from "vitest";
import { AllAASdConstraints, getConstraintCount } from "@shared/validation-rules/index";
import type { Environment } from "@shared/aas-v3-types";
import type { ValidationContext } from "@shared/validation-types";

describe("Data Type Constraints Integration", () => {
  it("should include all 12 data type constraints in AllAASdConstraints", () => {
    const datatypeConstraints = AllAASdConstraints.filter(
      (rule) => rule.category === "datatype"
    );
    
    // Should have at least 12 data type constraints (AASd-132 to AASd-143)
    expect(datatypeConstraints.length).toBeGreaterThanOrEqual(12);
    
    // Check specific constraint IDs exist
    const datatypeIds = datatypeConstraints.map((rule) => rule.id);
    expect(datatypeIds).toContain("AASd-132");
    expect(datatypeIds).toContain("AASd-133");
    expect(datatypeIds).toContain("AASd-134");
    expect(datatypeIds).toContain("AASd-135");
    expect(datatypeIds).toContain("AASd-136");
    expect(datatypeIds).toContain("AASd-137");
    expect(datatypeIds).toContain("AASd-138");
    expect(datatypeIds).toContain("AASd-139");
    expect(datatypeIds).toContain("AASd-140");
    expect(datatypeIds).toContain("AASd-141");
    expect(datatypeIds).toContain("AASd-142");
    expect(datatypeIds).toContain("AASd-143");
  });

  it("should validate a complete environment with data type violations", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          submodelElements: [
            {
              idShort: "validProp",
              modelType: "Property",
              valueType: "xs:integer",
              value: "42",
            },
            {
              idShort: "invalidProp",
              modelType: "Property",
              valueType: "xs:integer",
              value: "not-a-number",
            },
            {
              idShort: "validRange",
              modelType: "Range",
              valueType: "xs:double",
              min: "10.5",
              max: "100.5",
            },
            {
              idShort: "invalidRange",
              modelType: "Range",
              valueType: "xs:integer",
              min: "invalid",
              max: "also-invalid",
            },
          ],
        },
      ],
    };

    const ctx: ValidationContext = {
      environment: env,
      element: env,
      path: "",
      root: env,
    };

    // Run all data type constraints
    const datatypeConstraints = AllAASdConstraints.filter(
      (rule) => rule.category === "datatype"
    );

    let totalErrors = 0;
    datatypeConstraints.forEach((rule) => {
      const errors = rule.validate(ctx);
      totalErrors += errors.length;
    });

    // Should find at least 3 errors (invalid property + invalid range min + invalid range max)
    expect(totalErrors).toBeGreaterThanOrEqual(3);
  });

  it("should report correct constraint count", () => {
    const count = getConstraintCount();
    // Should have at least 138 constraints (126 existing + 12 new data type)
    expect(count).toBeGreaterThanOrEqual(138);
  });
});
