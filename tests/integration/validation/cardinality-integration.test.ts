/**
 * Integration test for cardinality constraints
 */

import { describe, it, expect } from "vitest";
import { AllAASdConstraints, getConstraintCount } from "@shared/validation-rules/index";
import type { Environment } from "@shared/aas-v3-types";
import type { ValidationContext } from "@shared/validation-types";

describe("Cardinality Constraints Integration", () => {
  it("should include all 7 cardinality constraints in AllAASdConstraints", () => {
    const cardinalityConstraints = AllAASdConstraints.filter(
      (rule) => rule.category === "cardinality"
    );
    
    expect(cardinalityConstraints.length).toBe(7);
    
    // Check specific constraint IDs exist
    const cardinalityIds = cardinalityConstraints.map((rule) => rule.id);
    expect(cardinalityIds).toContain("AASd-144");
    expect(cardinalityIds).toContain("AASd-145");
    expect(cardinalityIds).toContain("AASd-146");
    expect(cardinalityIds).toContain("AASd-147");
    expect(cardinalityIds).toContain("AASd-148");
    expect(cardinalityIds).toContain("AASd-149");
    expect(cardinalityIds).toContain("AASd-150");
  });

  it("should validate a complete environment with cardinality issues", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "EmptySubmodel",
          // No submodelElements - should trigger AASd-144
        },
        {
          id: "sm2",
          idShort: "SubmodelWithElements",
          submodelElements: [
            {
              idShort: "emptyCollection",
              modelType: "SubmodelElementCollection",
              value: [], // Empty - should trigger AASd-145
            },
            {
              idShort: "emptyList",
              modelType: "SubmodelElementList",
              typeValueListElement: "Property",
              value: [], // Empty - should trigger AASd-146
            },
            {
              idShort: "emptyOperation",
              modelType: "Operation",
              // No variables - should trigger AASd-147
            },
            {
              idShort: "emptyEntity",
              modelType: "Entity",
              entityType: "CoManagedEntity",
              statements: [], // Empty - should trigger AASd-148
            },
            {
              idShort: "emptyAnnotatedRel",
              modelType: "AnnotatedRelationshipElement",
              first: {
                type: "ModelReference",
                keys: [{ type: "Property", value: "prop1" }],
              },
              second: {
                type: "ModelReference",
                keys: [{ type: "Property", value: "prop2" }],
              },
              annotations: [], // Empty - should trigger AASd-149
            },
          ],
        },
      ],
      conceptDescriptions: [
        {
          id: "cd1",
          idShort: "ConceptWithEmptyIsCaseOf",
          isCaseOf: [], // Empty - should trigger AASd-150
        },
      ],
    };

    const ctx: ValidationContext = {
      environment: env,
      element: env,
      path: "",
      root: env,
    };

    // Run all cardinality constraints
    const cardinalityConstraints = AllAASdConstraints.filter(
      (rule) => rule.category === "cardinality"
    );

    let totalInfos = 0;
    cardinalityConstraints.forEach((rule) => {
      const errors = rule.validate(ctx);
      totalInfos += errors.filter(e => e.severity === "info").length;
    });

    // Should find 7 info messages (one for each constraint)
    expect(totalInfos).toBe(7);
  });

  it("should report correct total constraint count", () => {
    const count = getConstraintCount();
    // Should have 150 constraints (143 existing + 7 new cardinality)
    expect(count).toBe(150);
  });

  it("should have all cardinality constraints with info severity", () => {
    const cardinalityConstraints = AllAASdConstraints.filter(
      (rule) => rule.category === "cardinality"
    );

    cardinalityConstraints.forEach((rule) => {
      expect(rule.severity).toBe("info");
    });
  });

  it("should validate a well-formed environment without cardinality issues", () => {
    const env: Environment = {
      submodels: [
        {
          id: "sm1",
          idShort: "WellFormedSubmodel",
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
            {
              idShort: "list1",
              modelType: "SubmodelElementList",
              typeValueListElement: "Property",
              value: [
                {
                  modelType: "Property",
                  valueType: "xs:string",
                },
              ],
            },
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
                },
              ],
            },
          ],
        },
      ],
      conceptDescriptions: [
        {
          id: "cd1",
          idShort: "WellFormedConcept",
          isCaseOf: [
            {
              type: "ExternalReference",
              keys: [{ type: "GlobalReference", value: "http://example.com/concept" }],
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

    // Run all cardinality constraints
    const cardinalityConstraints = AllAASdConstraints.filter(
      (rule) => rule.category === "cardinality"
    );

    let totalInfos = 0;
    cardinalityConstraints.forEach((rule) => {
      const errors = rule.validate(ctx);
      totalInfos += errors.length;
    });

    // Should find no issues
    expect(totalInfos).toBe(0);
  });
});
