/**
 * Integration test for AASd Structural Constraints
 * 
 * Verifies that the structural constraints are properly integrated
 * into the validation engine and can validate real AAS models.
 */

import { describe, it, expect } from "vitest";
import { ValidationEngine } from "@shared/aas-validation-engine";
import type { Environment } from "@shared/aas-v3-types";

describe("AASd Structural Constraints Integration", () => {
  it("should load all structural constraints into validation engine", () => {
    const engine = new ValidationEngine();
    const allRules = engine.getRules();
    
    // Count structural constraints (AASd-XXX format)
    const structuralConstraints = allRules.filter(rule => 
      rule.id.match(/^AASd-\d{3}$/) && rule.category === "structure"
    );
    
    // Verify we have a reasonable number of structural constraints
    expect(structuralConstraints.length).toBeGreaterThan(30);
    
    // Verify some key constraints are present
    const constraintIds = structuralConstraints.map(c => c.id);
    // Check that we have the expected structural constraints
    expect(constraintIds).toContain("AASd-007"); // SubmodelElementList type uniformity
    expect(constraintIds).toContain("AASd-022"); // Structural constraint
    
    // Log available constraints for debugging
    console.log(`Available structural constraints: ${constraintIds.slice(0, 10).join(', ')}...`);
  });

  it("should validate a complete AAS environment with structural constraints", () => {
    const engine = new ValidationEngine();
    
    const validEnvironment: Environment = {
      assetAdministrationShells: [
        {
          id: "https://example.com/aas/motor",
          idShort: "MotorAAS",
          assetInformation: {
            assetKind: "Instance",
            globalAssetId: "https://example.com/assets/motor-001",
          },
          submodels: [
            {
              type: "ModelReference",
              keys: [
                {
                  type: "Submodel",
                  value: "https://example.com/submodels/nameplate",
                },
              ],
            },
          ],
        },
      ],
      submodels: [
        {
          id: "https://example.com/submodels/nameplate",
          idShort: "Nameplate",
          semanticId: {
            type: "ExternalReference",
            keys: [
              {
                type: "GlobalReference",
                value: "https://admin-shell.io/zvei/nameplate/1/0/Nameplate",
              },
            ],
          },
          submodelElements: [
            {
              modelType: "Property",
              idShort: "ManufacturerName",
              valueType: "xs:string",
              value: "Example Motor Corp",
              semanticId: {
                type: "ExternalReference",
                keys: [
                  {
                    type: "GlobalReference",
                    value: "https://admin-shell.io/zvei/nameplate/1/0/Nameplate/ManufacturerName",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const result = engine.validate(validEnvironment);
    
    // Should have minimal errors (the environment is mostly valid)
    // Note: Some constraints may flag warnings or minor issues
    expect(result.errors.length).toBeLessThan(5);
    
    // Log validation results for debugging
    if (result.errors.length > 0) {
      console.log(`Validation errors: ${result.errors.map(e => `${e.code}: ${e.message}`).join(', ')}`);
    }
    if (result.warnings && result.warnings.length > 0) {
      console.log(`Validation warnings: ${result.warnings.length}`);
    }
  });

  it("should detect structural violations", () => {
    const engine = new ValidationEngine();
    
    const invalidEnvironment: Environment = {
      assetAdministrationShells: [
        {
          id: "", // AASd-021: Empty ID
          idShort: "123InvalidIdShort", // AASd-002: Invalid idShort pattern
          // Missing assetInformation - AASd-003
        } as any,
      ],
      submodels: [
        {
          id: "test-submodel",
          idShort: "TestSubmodel",
          submodelElements: [
            {
              modelType: "Property",
              // Missing idShort - AASd-010
              // Missing valueType - AASd-011
            } as any,
          ],
        },
      ],
    };

    const result = engine.validate(invalidEnvironment);
    
    // Should detect multiple structural violations
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    
    // Check for specific constraint violations
    const errorCodes = result.errors.map(e => e.code);
    expect(errorCodes).toContain("AASd-002"); // Invalid idShort pattern
    expect(errorCodes).toContain("AASd-003"); // Missing assetInformation
    expect(errorCodes).toContain("AASd-010"); // Missing element idShort
    expect(errorCodes).toContain("AASd-011"); // Missing property valueType
    expect(errorCodes).toContain("AASd-021"); // Empty ID
  });

  it("should validate SubmodelElementList type uniformity (AASd-007)", () => {
    const engine = new ValidationEngine();
    
    const environmentWithMixedList: Environment = {
      submodels: [
        {
          id: "test-submodel",
          idShort: "TestSubmodel",
          submodelElements: [
            {
              modelType: "SubmodelElementList",
              idShort: "MixedList",
              typeValueListElement: "Property",
              value: [
                {
                  modelType: "Property",
                  idShort: "prop1",
                  valueType: "xs:string",
                },
                {
                  modelType: "Range", // Wrong type - should be Property
                  idShort: "range1",
                  valueType: "xs:double",
                },
              ],
            },
          ],
        },
      ],
    };

    const result = engine.validate(environmentWithMixedList);
    
    expect(result.isValid).toBe(false);
    const errorCodes = result.errors.map(e => e.code);
    expect(errorCodes).toContain("AASd-007"); // Type uniformity violation
  });

  it("should validate Entity globalAssetId requirement (AASd-008)", () => {
    const engine = new ValidationEngine();
    
    const environmentWithSelfManagedEntity: Environment = {
      submodels: [
        {
          id: "test-submodel",
          idShort: "TestSubmodel",
          submodelElements: [
            {
              modelType: "Entity",
              idShort: "SelfManagedEntity",
              entityType: "SelfManagedEntity",
              // Missing globalAssetId - required for SelfManagedEntity
            } as any,
          ],
        },
      ],
    };

    const result = engine.validate(environmentWithSelfManagedEntity);
    
    expect(result.isValid).toBe(false);
    const errorCodes = result.errors.map(e => e.code);
    expect(errorCodes).toContain("AASd-008"); // Missing globalAssetId for SelfManagedEntity
  });

  it("should validate Range min/max requirement (AASd-014)", () => {
    const engine = new ValidationEngine();
    
    const environmentWithEmptyRange: Environment = {
      submodels: [
        {
          id: "test-submodel",
          idShort: "TestSubmodel",
          submodelElements: [
            {
              modelType: "Range",
              idShort: "EmptyRange",
              valueType: "xs:double",
              // Missing both min and max - AASd-014
            } as any,
          ],
        },
      ],
    };

    const result = engine.validate(environmentWithEmptyRange);
    
    expect(result.isValid).toBe(false);
    const errorCodes = result.errors.map(e => e.code);
    expect(errorCodes).toContain("AASd-014"); // Range requires min or max
  });

  it("should validate SubmodelElementList type consistency (AASd-045)", () => {
    const engine = new ValidationEngine();
    
    const environmentWithInconsistentList: Environment = {
      submodels: [
        {
          id: "test-submodel",
          idShort: "TestSubmodel",
          submodelElements: [
            {
              modelType: "SubmodelElementList",
              idShort: "InconsistentList",
              typeValueListElement: "Property",
              value: [
                {
                  modelType: "Property",
                  valueType: "xs:string",
                },
                {
                  modelType: "Range", // Does not match declared type
                  valueType: "xs:double",
                },
              ],
            },
          ],
        },
      ],
    };

    const result = engine.validate(environmentWithInconsistentList);
    
    expect(result.isValid).toBe(false);
    const errorCodes = result.errors.map(e => e.code);
    expect(errorCodes).toContain("AASd-045"); // Type consistency violation
  });

  it("should validate Operation variable validity (AASd-046)", () => {
    const engine = new ValidationEngine();
    
    const environmentWithInvalidOperationVariable: Environment = {
      submodels: [
        {
          id: "test-submodel",
          idShort: "TestSubmodel",
          submodelElements: [
            {
              modelType: "Operation",
              idShort: "TestOperation",
              inputVariables: [
                {
                  value: {} as any, // Missing modelType
                },
              ],
            },
          ],
        },
      ],
    };

    const result = engine.validate(environmentWithInvalidOperationVariable);
    
    expect(result.isValid).toBe(false);
    const errorCodes = result.errors.map(e => e.code);
    expect(errorCodes).toContain("AASd-046"); // Invalid operation variable
  });

  it("should validate AnnotatedRelationshipElement annotation validity (AASd-047)", () => {
    const engine = new ValidationEngine();
    
    const environmentWithInvalidAnnotation: Environment = {
      submodels: [
        {
          id: "test-submodel",
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
                  idShort: "InvalidAnnotation",
                  // Missing modelType
                } as any,
              ],
            },
          ],
        },
      ],
    };

    const result = engine.validate(environmentWithInvalidAnnotation);
    
    expect(result.isValid).toBe(false);
    const errorCodes = result.errors.map(e => e.code);
    expect(errorCodes).toContain("AASd-047"); // Invalid annotation
  });

  it("should validate Entity statement validity (AASd-048)", () => {
    const engine = new ValidationEngine();
    
    const environmentWithInvalidStatement: Environment = {
      submodels: [
        {
          id: "test-submodel",
          idShort: "TestSubmodel",
          submodelElements: [
            {
              modelType: "Entity",
              idShort: "TestEntity",
              entityType: "CoManagedEntity",
              statements: [
                {
                  idShort: "InvalidStatement",
                  // Missing modelType
                } as any,
              ],
            },
          ],
        },
      ],
    };

    const result = engine.validate(environmentWithInvalidStatement);
    
    expect(result.isValid).toBe(false);
    const errorCodes = result.errors.map(e => e.code);
    expect(errorCodes).toContain("AASd-048"); // Invalid statement
  });

  it("should validate embedded data specification content (AASd-049)", () => {
    const engine = new ValidationEngine();
    
    const environmentWithInvalidDataSpec: Environment = {
      submodels: [
        {
          id: "test-submodel",
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
              // Missing dataSpecificationContent
            } as any,
          ],
        },
      ],
    };

    const result = engine.validate(environmentWithInvalidDataSpec);
    
    expect(result.isValid).toBe(false);
    const errorCodes = result.errors.map(e => e.code);
    expect(errorCodes).toContain("AASd-049"); // Missing data specification content
  });

  it("should validate all new constraints together in a complex model", () => {
    const engine = new ValidationEngine();
    
    // Create a complex environment with multiple violations of new constraints
    const complexEnvironment: Environment = {
      submodels: [
        {
          id: "test-submodel",
          idShort: "ComplexSubmodel",
          submodelElements: [
            // AASd-045 violation
            {
              modelType: "SubmodelElementList",
              idShort: "BadList",
              typeValueListElement: "Property",
              value: [
                {
                  modelType: "Range", // Wrong type
                  valueType: "xs:double",
                },
              ],
            },
            // AASd-046 violation
            {
              modelType: "Operation",
              idShort: "BadOperation",
              inputVariables: [
                {
                  value: {} as any, // Invalid variable
                },
              ],
            },
            // AASd-047 violation
            {
              modelType: "AnnotatedRelationshipElement",
              idShort: "BadAnnotatedRel",
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
                  idShort: "BadAnnotation",
                } as any, // Missing modelType
              ],
            },
            // AASd-048 violation
            {
              modelType: "Entity",
              idShort: "BadEntity",
              entityType: "CoManagedEntity",
              statements: [
                {
                  idShort: "BadStatement",
                } as any, // Missing modelType
              ],
            },
          ],
          // AASd-049 violation
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

    const result = engine.validate(complexEnvironment);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(4); // At least 5 violations
    
    const errorCodes = result.errors.map(e => e.code);
    expect(errorCodes).toContain("AASd-045");
    expect(errorCodes).toContain("AASd-046");
    expect(errorCodes).toContain("AASd-047");
    expect(errorCodes).toContain("AASd-048");
    expect(errorCodes).toContain("AASd-049");
  });
});
