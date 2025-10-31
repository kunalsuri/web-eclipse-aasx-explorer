/**
 * AAS V3.0 Advanced Validation Engine
 * Comprehensive validation with rule registration and extensibility
 */

import type {
  Environment,
  Reference,
} from "./aas-v3-types";

// Import and re-export validation types
import type {
  ValidationError,
  ValidationResult,
  ValidationRule,
  ValidationCategory,
  ValidationContext,
  ValidationPreset,
} from "./validation-types";

export type {
  ValidationError,
  ValidationResult,
  ValidationRule,
  ValidationCategory,
  ValidationContext,
  ValidationPreset,
};

// Import AASd specification constraints
import { AllAASdConstraints } from "./validation-rules/index";

// ============================================================================
// Validation Engine
// ============================================================================

export class ValidationEngine {
  private readonly rules: Map<string, ValidationRule> = new Map();
  private readonly presets: Map<string, ValidationPreset> = new Map();

  constructor() {
    this.registerDefaultRules();
    this.registerDefaultPresets();
    
    // Register AASd specification constraints
    AllAASdConstraints.forEach((constraint) => {
      this.registerRule(constraint);
    });
  }

  /**
   * Register a validation rule
   */
  registerRule(rule: ValidationRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Unregister a validation rule
   */
  unregisterRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Get all registered rules
   */
  getRules(): ValidationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category: ValidationCategory): ValidationRule[] {
    return this.getRules().filter((rule) => rule.category === category);
  }

  /**
   * Register a validation preset
   */
  registerPreset(preset: ValidationPreset): void {
    this.presets.set(preset.id, preset);
  }

  /**
   * Get all presets
   */
  getPresets(): ValidationPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Get preset by ID
   */
  getPreset(presetId: string): ValidationPreset | undefined {
    return this.presets.get(presetId);
  }

  /**
   * Validate environment with all rules
   */
  validate(environment: Environment): ValidationResult {
    const startTime = Date.now();
    const allErrors: ValidationError[] = [];

    // Run all rules
    const rulesList = Array.from(this.rules.values());
    for (const rule of rulesList) {
      const context: ValidationContext = {
        environment,
        element: environment,
        path: "",
        root: environment,
      };

      try {
        const errors = rule.validate(context);
        allErrors.push(...errors);
      } catch (error) {
        allErrors.push({
          path: "",
          message: `Rule "${rule.name}" failed: ${error instanceof Error ? error.message : String(error)}`,
          severity: "error",
          code: "RULE_EXECUTION_ERROR",
        });
      }
    }

    const duration = Date.now() - startTime;

    return this.aggregateResults(allErrors, duration);
  }

  /**
   * Validate with specific preset
   */
  validateWithPreset(
    environment: Environment,
    presetId: string
  ): ValidationResult {
    const preset = this.presets.get(presetId);
    if (!preset) {
      throw new Error(`Preset "${presetId}" not found`);
    }

    const startTime = Date.now();
    const allErrors: ValidationError[] = [];

    // Run only rules in preset
    for (const ruleId of preset.rules) {
      const rule = this.rules.get(ruleId);
      if (!rule) {
        console.warn(`Rule "${ruleId}" not found in preset "${presetId}"`);
        continue;
      }

      const context: ValidationContext = {
        environment,
        element: environment,
        path: "",
        root: environment,
      };

      try {
        const errors = rule.validate(context);
        allErrors.push(...errors);
      } catch (error) {
        allErrors.push({
          path: "",
          message: `Rule "${rule.name}" failed: ${error instanceof Error ? error.message : String(error)}`,
          severity: "error",
          code: "RULE_EXECUTION_ERROR",
        });
      }
    }

    const duration = Date.now() - startTime;

    return this.aggregateResults(allErrors, duration);
  }

  /**
   * Validate with specific rules
   */
  validateWithRules(
    environment: Environment,
    ruleIds: string[]
  ): ValidationResult {
    const startTime = Date.now();
    const allErrors: ValidationError[] = [];

    // Run only specified rules
    for (const ruleId of ruleIds) {
      const rule = this.rules.get(ruleId);
      if (!rule) {
        console.warn(`Rule "${ruleId}" not found`);
        continue;
      }

      const context: ValidationContext = {
        environment,
        element: environment,
        path: "",
        root: environment,
      };

      try {
        const errors = rule.validate(context);
        allErrors.push(...errors);
      } catch (error) {
        allErrors.push({
          path: "",
          message: `Rule "${rule.name}" failed: ${error instanceof Error ? error.message : String(error)}`,
          severity: "error",
          code: "RULE_EXECUTION_ERROR",
        });
      }
    }

    const duration = Date.now() - startTime;

    return this.aggregateResults(allErrors, duration);
  }

  /**
   * Validate specific element
   */
  validateElement(
    environment: Environment,
    element: any,
    path: string
  ): ValidationResult {
    const startTime = Date.now();
    const allErrors: ValidationError[] = [];

    const rulesList = Array.from(this.rules.values());
    for (const rule of rulesList) {
      const context: ValidationContext = {
        environment,
        element,
        path,
        root: environment,
      };

      try {
        const errors = rule.validate(context);
        allErrors.push(...errors);
      } catch (error) {
        allErrors.push({
          path,
          message: `Rule "${rule.name}" failed: ${error instanceof Error ? error.message : String(error)}`,
          severity: "error",
          code: "RULE_EXECUTION_ERROR",
        });
      }
    }

    const duration = Date.now() - startTime;

    return this.aggregateResults(allErrors, duration);
  }

  /**
   * Aggregate validation results
   */
  private aggregateResults(
    allErrors: ValidationError[],
    duration: number
  ): ValidationResult {
    const errors = allErrors.filter((e) => e.severity === "error");
    const warnings = allErrors.filter((e) => e.severity === "warning");
    const infos = allErrors.filter((e) => e.severity === "info");

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      infos,
      timestamp: new Date(),
      duration,
    };
  }

  /**
   * Register default validation rules
   */
  private registerDefaultRules(): void {
    // Structure rules
    this.registerRule({
      id: "env-has-content",
      name: "Environment Has Content",
      description: "Environment must have at least one AAS or Submodel",
      severity: "error",
      category: "structure",
      validate: (ctx) => {
        const env = ctx.environment;
        if (
          (!env.assetAdministrationShells ||
            env.assetAdministrationShells.length === 0) &&
          (!env.submodels || env.submodels.length === 0)
        ) {
          return [
            {
              path: "",
              message:
                "Environment must contain at least one Asset Administration Shell or Submodel",
              severity: "error",
              code: "ENV_EMPTY",
            },
          ];
        }
        return [];
      },
    });

    // Schema rules - AAS
    this.registerRule({
      id: "aas-required-fields",
      name: "AAS Required Fields",
      description: "AAS must have required fields (id, idShort, assetInformation)",
      severity: "error",
      category: "schema",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.assetAdministrationShells) {
          env.assetAdministrationShells.forEach((aas, index) => {
            const basePath = `assetAdministrationShells[${index}]`;

            if (!aas.id || aas.id.trim() === "") {
              errors.push({
                path: `${basePath}.id`,
                message: "AAS must have an id",
                severity: "error",
                code: "AAS_MISSING_ID",
                suggestion: "Add a unique identifier for the AAS",
              });
            }
            if (!aas.idShort) {
              errors.push({
                path: `${basePath}.idShort`,
                message: "AAS must have an idShort",
                severity: "error",
                code: "AAS_MISSING_IDSHORT",
              });
            }
            if (!aas.assetInformation) {
              errors.push({
                path: `${basePath}.assetInformation`,
                message: "AAS must have assetInformation",
                severity: "error",
                code: "AAS_MISSING_ASSET_INFORMATION",
                suggestion: "Add assetInformation with at least assetKind",
              });
            }
          });
        }

        return errors;
      },
    });

    // Asset information validation
    this.registerRule({
      id: "aas-asset-information-valid",
      name: "AAS Asset Information Valid",
      description: "Validate asset information structure and content",
      severity: "error",
      category: "schema",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.assetAdministrationShells) {
          env.assetAdministrationShells.forEach((aas, index) => {
            const basePath = `assetAdministrationShells[${index}]`;

            if (aas.assetInformation) {
              const assetInfo = aas.assetInformation;
              const assetPath = `${basePath}.assetInformation`;

              // Required: assetKind
              if (!assetInfo.assetKind) {
                errors.push({
                  path: `${assetPath}.assetKind`,
                  message: "AssetInformation must have assetKind",
                  severity: "error",
                  code: "ASSET_INFO_MISSING_KIND",
                  suggestion: "Set assetKind to 'Type', 'Instance', or 'NotApplicable'",
                });
              } else {
                // Validate assetKind enum value
                const validKinds = ["Type", "Instance", "NotApplicable"];
                if (!validKinds.includes(assetInfo.assetKind)) {
                  errors.push({
                    path: `${assetPath}.assetKind`,
                    message: `Invalid assetKind: ${assetInfo.assetKind}`,
                    severity: "error",
                    code: "ASSET_INFO_INVALID_KIND",
                    suggestion: `Must be one of: ${validKinds.join(", ")}`,
                  });
                }
              }

              // Validate specificAssetIds
              if (assetInfo.specificAssetIds) {
                assetInfo.specificAssetIds.forEach((specificId, sidIndex) => {
                  const sidPath = `${assetPath}.specificAssetIds[${sidIndex}]`;

                  // Required: name
                  if (!specificId.name || specificId.name.trim() === "") {
                    errors.push({
                      path: `${sidPath}.name`,
                      message: "SpecificAssetId must have a name",
                      severity: "error",
                      code: "SPECIFIC_ASSET_ID_MISSING_NAME",
                      suggestion: "Add a name for the specific asset identifier",
                    });
                  }

                  // Required: value
                  if (!specificId.value || specificId.value.trim() === "") {
                    errors.push({
                      path: `${sidPath}.value`,
                      message: "SpecificAssetId must have a value",
                      severity: "error",
                      code: "SPECIFIC_ASSET_ID_MISSING_VALUE",
                      suggestion: "Add a value for the specific asset identifier",
                    });
                  }
                });
              }
            }
          });
        }

        return errors;
      },
    });

    // Submodel references validation
    this.registerRule({
      id: "aas-submodel-references-valid",
      name: "AAS Submodel References Valid",
      description: "Validate that AAS submodel references are valid and resolve",
      severity: "error",
      category: "reference",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.assetAdministrationShells) {
          env.assetAdministrationShells.forEach((aas, index) => {
            const basePath = `assetAdministrationShells[${index}]`;

            if (aas.submodels) {
              aas.submodels.forEach((smRef, smIndex) => {
                const refPath = `${basePath}.submodels[${smIndex}]`;

                // Check if reference resolves
                if (smRef.keys && smRef.keys.length > 0) {
                  const lastKey = smRef.keys[smRef.keys.length - 1];
                  const submodelId = lastKey.value;

                  // Check if submodel exists in environment
                  const submodelExists = env.submodels?.some((sm) => sm.id === submodelId);

                  if (!submodelExists) {
                    // Check if it's an external URL from a different domain
                    const isExternalUrl = submodelId.startsWith("http://") || submodelId.startsWith("https://");

                    // Check if any submodel in the environment shares the same domain
                    const hasSameDomainSubmodel = env.submodels?.some((sm) => {
                      if (!sm.id) return false;
                      try {
                        const refUrl = new URL(submodelId);
                        const smUrl = new URL(sm.id);
                        return refUrl.origin === smUrl.origin;
                      } catch {
                        return false;
                      }
                    });

                    // Only report error if:
                    // 1. It's not an external URL, OR
                    // 2. It's an external URL but from the same domain as other submodels
                    if (!isExternalUrl || hasSameDomainSubmodel) {
                      errors.push({
                        path: refPath,
                        message: `Submodel reference does not resolve: ${submodelId} (missing)`,
                        severity: "error",
                        code: "AAS_SUBMODEL_REF_NOT_FOUND",
                        suggestion: "Add the referenced submodel or remove the reference",
                      });
                    }
                  }
                }
              });
            }
          });
        }

        return errors;
      },
    });

    // Administration info validation
    this.registerRule({
      id: "aas-administration-info-valid",
      name: "AAS Administration Info Valid",
      description: "Validate AAS administration information",
      severity: "warning",
      category: "schema",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];
        const infos: ValidationError[] = [];
        const env = ctx.environment;

        if (env.assetAdministrationShells) {
          env.assetAdministrationShells.forEach((aas, index) => {
            const basePath = `assetAdministrationShells[${index}]`;

            if (aas.administration) {
              const admin = aas.administration;
              const adminPath = `${basePath}.administration`;

              // Validate version format (semantic versioning recommended)
              if (admin.version) {
                const semverPattern = /^\d+\.\d+(\.\d+)?$/;
                if (!semverPattern.test(admin.version)) {
                  warnings.push({
                    path: `${adminPath}.version`,
                    message: `Version format should follow semantic versioning: ${admin.version}`,
                    severity: "warning",
                    code: "ADMIN_INVALID_VERSION",
                    suggestion: "Use format: MAJOR.MINOR or MAJOR.MINOR.PATCH",
                  });
                }

                // Info: version without revision
                if (!admin.revision) {
                  infos.push({
                    path: `${adminPath}.revision`,
                    message: "Version is set but revision is missing",
                    severity: "info",
                    code: "ADMIN_VERSION_WITHOUT_REVISION",
                    suggestion: "Consider adding a revision number",
                  });
                }
              }

              // Validate revision format
              if (admin.revision) {
                const revisionPattern = /^\d+$/;
                if (!revisionPattern.test(admin.revision)) {
                  warnings.push({
                    path: `${adminPath}.revision`,
                    message: `Revision should be a number: ${admin.revision}`,
                    severity: "warning",
                    code: "ADMIN_INVALID_REVISION",
                    suggestion: "Use a numeric revision number",
                  });
                }
              }
            }
          });
        }

        return [...errors, ...warnings, ...infos];
      },
    });

    // Schema rules - Submodel
    this.registerRule({
      id: "submodel-required-fields",
      name: "Submodel Required Fields",
      description: "Submodel must have required fields (id, idShort)",
      severity: "error",
      category: "schema",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.submodels) {
          env.submodels.forEach((sm, index) => {
            if (!sm.id) {
              errors.push({
                path: `submodels[${index}].id`,
                message: "Submodel must have an ID",
                severity: "error",
                code: "SUBMODEL_MISSING_ID",
              });
            }
            if (!sm.idShort) {
              errors.push({
                path: `submodels[${index}].idShort`,
                message: "Submodel must have an idShort",
                severity: "error",
                code: "SUBMODEL_MISSING_IDSHORT",
              });
            }
          });
        }

        return errors;
      },
    });

    // Schema rules - SubmodelElement
    this.registerRule({
      id: "submodel-element-required-fields",
      name: "SubmodelElement Required Fields",
      description: "SubmodelElements must have required fields (idShort, modelType)",
      severity: "error",
      category: "schema",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.submodels) {
          env.submodels.forEach((sm, smIndex) => {
            if (sm.submodelElements) {
              this.validateSubmodelElementsRecursive(
                sm.submodelElements,
                `submodels[${smIndex}].submodelElements`,
                errors
              );
            }
          });
        }

        return errors;
      },
    });

    // Schema rules - Type validation
    this.registerRule({
      id: "property-type-validation",
      name: "Property Type Validation",
      description: "Property values must match their declared valueType",
      severity: "error",
      category: "schema",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.submodels) {
          env.submodels.forEach((sm, smIndex) => {
            if (sm.submodelElements) {
              this.validatePropertyTypesRecursive(
                sm.submodelElements,
                `submodels[${smIndex}].submodelElements`,
                errors
              );
            }
          });
        }

        return errors;
      },
    });

    // Schema rules - Cardinality validation
    this.registerRule({
      id: "cardinality-validation",
      name: "Cardinality Validation",
      description: "Collections and lists must respect cardinality constraints",
      severity: "warning",
      category: "cardinality",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.submodels) {
          env.submodels.forEach((sm, smIndex) => {
            if (sm.submodelElements) {
              this.validateCardinalityRecursive(
                sm.submodelElements,
                `submodels[${smIndex}].submodelElements`,
                errors
              );
            }
          });
        }

        return errors;
      },
    });

    // Schema rules - Asset Information
    this.registerRule({
      id: "asset-information-validation",
      name: "Asset Information Validation",
      description: "Asset information must have required fields (assetKind, globalAssetId)",
      severity: "error",
      category: "schema",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.assetAdministrationShells) {
          env.assetAdministrationShells.forEach((aas, index) => {
            if (aas.assetInformation) {
              const assetInfo = aas.assetInformation;
              const basePath = `assetAdministrationShells[${index}].assetInformation`;

              if (!assetInfo.assetKind) {
                errors.push({
                  path: `${basePath}.assetKind`,
                  message: "Asset information must have assetKind",
                  severity: "error",
                  code: "ASSET_INFO_MISSING_KIND",
                });
              }

              if (!assetInfo.globalAssetId) {
                errors.push({
                  path: `${basePath}.globalAssetId`,
                  message: "Asset information must have globalAssetId",
                  severity: "warning",
                  code: "ASSET_INFO_MISSING_GLOBAL_ID",
                });
              }
            }
          });
        }

        return errors;
      },
    });

    // Reference integrity rules - Enhanced
    this.registerRule({
      id: "reference-integrity",
      name: "Reference Integrity",
      description: "All references must point to existing elements",
      severity: "error",
      category: "reference",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        // Build ID index for fast lookup
        const idIndex = this.buildIdIndex(env);

        // Check AAS submodel references
        if (env.assetAdministrationShells) {
          env.assetAdministrationShells.forEach((aas, aasIndex) => {
            if (aas.submodels) {
              aas.submodels.forEach((ref, refIndex) => {
                this.validateReference(
                  ref,
                  `assetAdministrationShells[${aasIndex}].submodels[${refIndex}]`,
                  idIndex,
                  errors
                );
              });
            }

            // Check derivedFrom reference
            if (aas.derivedFrom) {
              this.validateReference(
                aas.derivedFrom,
                `assetAdministrationShells[${aasIndex}].derivedFrom`,
                idIndex,
                errors
              );
            }
          });
        }

        // Check submodel references
        if (env.submodels) {
          env.submodels.forEach((sm, smIndex) => {
            // Check semanticId
            if (sm.semanticId) {
              this.validateReference(
                sm.semanticId,
                `submodels[${smIndex}].semanticId`,
                idIndex,
                errors,
                true // Allow external references
              );
            }

            // Check submodel element references
            if (sm.submodelElements) {
              this.validateSubmodelElementReferences(
                sm.submodelElements,
                `submodels[${smIndex}].submodelElements`,
                idIndex,
                errors
              );
            }
          });
        }

        return errors;
      },
    });

    // Circular reference detection
    this.registerRule({
      id: "circular-reference-detection",
      name: "Circular Reference Detection",
      description: "Detect circular references in AAS structure",
      severity: "error",
      category: "reference",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        // Check AAS derivedFrom chains
        if (env.assetAdministrationShells) {
          env.assetAdministrationShells.forEach((aas, aasIndex) => {
            const visited = new Set<string>();
            const path: string[] = [];

            if (this.hasCircularReference(
              aas,
              env,
              visited,
              path,
              "derivedFrom"
            )) {
              errors.push({
                path: `assetAdministrationShells[${aasIndex}].derivedFrom`,
                message: `Circular reference detected: ${path.join(" -> ")} -> ${aas.id}`,
                severity: "error",
                code: "CIRCULAR_REFERENCE",
                suggestion: "Remove circular derivedFrom reference",
              });
            }
          });
        }

        return errors;
      },
    });

    // Key structure validation
    this.registerRule({
      id: "key-structure-validation",
      name: "Key Structure Validation",
      description: "Validate reference key structures",
      severity: "error",
      category: "reference",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        // Validate all references in AAS
        if (env.assetAdministrationShells) {
          env.assetAdministrationShells.forEach((aas, aasIndex) => {
            if (aas.submodels) {
              aas.submodels.forEach((ref, refIndex) => {
                this.validateKeyStructure(
                  ref,
                  `assetAdministrationShells[${aasIndex}].submodels[${refIndex}]`,
                  errors
                );
              });
            }

            if (aas.derivedFrom) {
              this.validateKeyStructure(
                aas.derivedFrom,
                `assetAdministrationShells[${aasIndex}].derivedFrom`,
                errors
              );
            }
          });
        }

        // Validate all references in Submodels
        if (env.submodels) {
          env.submodels.forEach((sm, smIndex) => {
            if (sm.semanticId) {
              this.validateKeyStructure(
                sm.semanticId,
                `submodels[${smIndex}].semanticId`,
                errors
              );
            }

            if (sm.submodelElements) {
              this.validateSubmodelElementKeyStructures(
                sm.submodelElements,
                `submodels[${smIndex}].submodelElements`,
                errors
              );
            }
          });
        }

        return errors;
      },
    });

    // Reference type validation
    this.registerRule({
      id: "reference-type-validation",
      name: "Reference Type Validation",
      description: "Validate that reference types match target element types",
      severity: "error",
      category: "reference",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        // Build type index
        const typeIndex = this.buildTypeIndex(env);

        // Check AAS submodel references
        if (env.assetAdministrationShells) {
          env.assetAdministrationShells.forEach((aas, aasIndex) => {
            if (aas.submodels) {
              aas.submodels.forEach((ref, refIndex) => {
                this.validateReferenceType(
                  ref,
                  "Submodel",
                  `assetAdministrationShells[${aasIndex}].submodels[${refIndex}]`,
                  typeIndex,
                  errors
                );
              });
            }

            if (aas.derivedFrom) {
              this.validateReferenceType(
                aas.derivedFrom,
                "AssetAdministrationShell",
                `assetAdministrationShells[${aasIndex}].derivedFrom`,
                typeIndex,
                errors
              );
            }
          });
        }

        return errors;
      },
    });

    // Duplicate ID rules
    this.registerRule({
      id: "unique-ids",
      name: "Unique IDs",
      description: "All IDs must be unique within their scope",
      severity: "error",
      category: "structure",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        // Check AAS IDs
        if (env.assetAdministrationShells) {
          const aasIds = new Set<string>();
          env.assetAdministrationShells.forEach((aas, index) => {
            if (aasIds.has(aas.id)) {
              errors.push({
                path: `assetAdministrationShells[${index}].id`,
                message: `Duplicate AAS ID: ${aas.id}`,
                severity: "error",
                code: "DUPLICATE_ID",
              });
            }
            aasIds.add(aas.id);
          });
        }

        // Check Submodel IDs
        if (env.submodels) {
          const smIds = new Set<string>();
          env.submodels.forEach((sm, index) => {
            if (smIds.has(sm.id)) {
              errors.push({
                path: `submodels[${index}].id`,
                message: `Duplicate Submodel ID: ${sm.id}`,
                severity: "error",
                code: "DUPLICATE_ID",
              });
            }
            smIds.add(sm.id);
          });
        }

        // Check ConceptDescription IDs
        if (env.conceptDescriptions) {
          const cdIds = new Set<string>();
          env.conceptDescriptions.forEach((cd, index) => {
            if (cdIds.has(cd.id)) {
              errors.push({
                path: `conceptDescriptions[${index}].id`,
                message: `Duplicate ConceptDescription ID: ${cd.id}`,
                severity: "error",
                code: "DUPLICATE_ID",
              });
            }
            cdIds.add(cd.id);
          });
        }

        return errors;
      },
    });

    // Environment structure completeness (NEW for Task 2.2.1)
    this.registerRule({
      id: "aas-without-submodels",
      name: "AAS Without Submodels",
      description: "Warn about AAS without submodel references",
      severity: "warning",
      category: "structure",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.assetAdministrationShells) {
          env.assetAdministrationShells.forEach((aas, index) => {
            if (!aas.submodels || aas.submodels.length === 0) {
              errors.push({
                path: `assetAdministrationShells[${index}]`,
                message: `AAS "${aas.idShort}" has no submodel references`,
                severity: "warning",
                code: "AAS_NO_SUBMODELS",
                suggestion: "Consider adding submodel references to provide structure",
              });
            }
          });
        }

        return errors;
      },
    });

    // Orphaned submodels detection (NEW for Task 2.2.1)
    this.registerRule({
      id: "orphaned-submodels",
      name: "Orphaned Submodels",
      description: "Detect submodels not referenced by any AAS",
      severity: "warning",
      category: "structure",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (!env.submodels || env.submodels.length === 0) {
          return errors;
        }

        // Build set of referenced submodel IDs
        const referencedSubmodels = new Set<string>();
        if (env.assetAdministrationShells) {
          env.assetAdministrationShells.forEach((aas) => {
            if (aas.submodels) {
              aas.submodels.forEach((ref) => {
                const smId = this.getReferenceId(ref);
                if (smId) {
                  referencedSubmodels.add(smId);
                }
              });
            }
          });
        }

        // Check for orphaned submodels
        env.submodels.forEach((sm, index) => {
          if (!referencedSubmodels.has(sm.id)) {
            errors.push({
              path: `submodels[${index}]`,
              message: `Submodel "${sm.idShort}" (${sm.id}) is not referenced by any AAS`,
              severity: "warning",
              code: "ORPHANED_SUBMODEL",
              suggestion: "Add a reference to this submodel from an AAS or remove it",
            });
          }
        });

        return errors;
      },
    });

    // Unused concept descriptions (NEW for Task 2.2.1)
    this.registerRule({
      id: "unused-concept-descriptions",
      name: "Unused Concept Descriptions",
      description: "Detect concept descriptions not referenced anywhere",
      severity: "warning",
      category: "structure",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (!env.conceptDescriptions || env.conceptDescriptions.length === 0) {
          return errors;
        }

        // Build set of referenced concept description IDs
        const referencedConcepts = new Set<string>();

        // Check submodel semantic IDs
        if (env.submodels) {
          env.submodels.forEach((sm) => {
            if (sm.semanticId) {
              const cdId = this.getReferenceId(sm.semanticId);
              if (cdId) {
                referencedConcepts.add(cdId);
              }
            }

            // Check submodel element semantic IDs
            if (sm.submodelElements) {
              this.collectSemanticIdReferences(sm.submodelElements, referencedConcepts);
            }
          });
        }

        // Check for unused concept descriptions
        env.conceptDescriptions.forEach((cd, index) => {
          if (!referencedConcepts.has(cd.id)) {
            errors.push({
              path: `conceptDescriptions[${index}]`,
              message: `ConceptDescription "${cd.idShort}" (${cd.id}) is not referenced anywhere`,
              severity: "warning",
              code: "UNUSED_CONCEPT_DESCRIPTION",
              suggestion: "Remove unused concept description or add references to it",
            });
          }
        });

        return errors;
      },
    });

    // Template with instance values (NEW for Task 2.2.1)
    this.registerRule({
      id: "template-with-values",
      name: "Template With Values",
      description: "Warn about template submodels with instance values",
      severity: "warning",
      category: "structure",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.submodels) {
          env.submodels.forEach((sm, index) => {
            if (sm.kind === "Template" && sm.submodelElements) {
              // Check if any elements have values
              const hasValues = this.checkForInstanceValues(sm.submodelElements);
              if (hasValues) {
                errors.push({
                  path: `submodels[${index}]`,
                  message: `Template submodel "${sm.idShort}" contains instance values`,
                  severity: "warning",
                  code: "TEMPLATE_WITH_VALUES",
                  suggestion: "Templates should not contain instance values, only structure",
                });
              }
            }
          });
        }

        return errors;
      },
    });

    // Missing descriptions (NEW for Task 2.2.1)
    this.registerRule({
      id: "missing-descriptions",
      name: "Missing Descriptions",
      description: "Warn about elements without descriptions",
      severity: "info",
      category: "structure",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        // Check AAS descriptions
        if (env.assetAdministrationShells) {
          env.assetAdministrationShells.forEach((aas, index) => {
            if (!aas.description || aas.description.length === 0) {
              errors.push({
                path: `assetAdministrationShells[${index}].description`,
                message: `AAS "${aas.idShort}" has no description`,
                severity: "info",
                code: "MISSING_DESCRIPTION",
                suggestion: "Add a description to improve documentation",
              });
            }
          });
        }

        // Check Submodel descriptions
        if (env.submodels) {
          env.submodels.forEach((sm, index) => {
            if (!sm.description || sm.description.length === 0) {
              errors.push({
                path: `submodels[${index}].description`,
                message: `Submodel "${sm.idShort}" has no description`,
                severity: "info",
                code: "MISSING_DESCRIPTION",
                suggestion: "Add a description to improve documentation",
              });
            }
          });
        }

        return errors;
      },
    });

    // ========================================================================
    // Submodel Validation Rules (Task 2.2.3)
    // ========================================================================

    // Submodel semantic ID validation
    this.registerRule({
      id: "submodel-semantic-id-valid",
      name: "Submodel Semantic ID Valid",
      description: "Submodel should have a valid semantic ID",
      severity: "warning",
      category: "semantic",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.submodels) {
          env.submodels.forEach((sm, index) => {
            const basePath = `submodels[${index}]`;

            // Warn if no semantic ID
            if (!sm.semanticId) {
              errors.push({
                path: `${basePath}.semanticId`,
                message: `Submodel "${sm.idShort}" has no semantic ID`,
                severity: "warning",
                code: "SUBMODEL_NO_SEMANTIC_ID",
                suggestion: "Add a semantic ID to improve interoperability",
              });
            } else {
              // Validate semantic ID format (already done by semantic-id-format rule)
              // Just check if keys exist
              if (!sm.semanticId.keys || sm.semanticId.keys.length === 0) {
                errors.push({
                  path: `${basePath}.semanticId`,
                  message: `Submodel "${sm.idShort}" semantic ID has no keys`,
                  severity: "error",
                  code: "SUBMODEL_SEMANTIC_ID_NO_KEYS",
                });
              }
            }
          });
        }

        return errors;
      },
    });

    // Submodel element structure validation
    this.registerRule({
      id: "submodel-element-structure-valid",
      name: "Submodel Element Structure Valid",
      description: "Validate submodel element structure and hierarchy",
      severity: "error",
      category: "structure",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.submodels) {
          env.submodels.forEach((sm, smIndex) => {
            const basePath = `submodels[${smIndex}]`;

            if (sm.submodelElements) {
              // Validate element structure recursively
              this.validateElementStructureRecursive(
                sm.submodelElements,
                `${basePath}.submodelElements`,
                errors
              );
            }
          });
        }

        return errors;
      },
    });

    // Submodel kind consistency validation
    this.registerRule({
      id: "submodel-kind-consistency",
      name: "Submodel Kind Consistency",
      description: "Validate kind consistency between submodel and elements",
      severity: "warning",
      category: "structure",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.submodels) {
          env.submodels.forEach((sm, smIndex) => {
            const basePath = `submodels[${smIndex}]`;
            const submodelKind = sm.kind || "Instance"; // Default is Instance

            // Template submodels should not have values
            if (submodelKind === "Template" && sm.submodelElements) {
              const hasValues = this.checkForInstanceValues(sm.submodelElements);
              if (hasValues) {
                errors.push({
                  path: basePath,
                  message: `Template submodel "${sm.idShort}" contains instance values`,
                  severity: "warning",
                  code: "SUBMODEL_TEMPLATE_WITH_VALUES",
                  suggestion: "Templates should only define structure, not values",
                });
              }
            }

            // Instance submodels should have values
            if (submodelKind === "Instance" && sm.submodelElements) {
              const hasNoValues = this.checkForMissingValues(sm.submodelElements);
              if (hasNoValues) {
                errors.push({
                  path: basePath,
                  message: `Instance submodel "${sm.idShort}" has elements without values`,
                  severity: "info",
                  code: "SUBMODEL_INSTANCE_WITHOUT_VALUES",
                  suggestion: "Consider adding values to instance elements",
                });
              }
            }
          });
        }

        return errors;
      },
    });

    // Submodel qualifier validation
    this.registerRule({
      id: "submodel-qualifier-validation",
      name: "Submodel Qualifier Validation",
      description: "Validate qualifier structure and values",
      severity: "error",
      category: "schema",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.submodels) {
          env.submodels.forEach((sm, smIndex) => {
            const basePath = `submodels[${smIndex}]`;

            // Validate submodel qualifiers
            if (sm.qualifiers) {
              sm.qualifiers.forEach((qualifier, qIndex) => {
                const qualifierPath = `${basePath}.qualifiers[${qIndex}]`;
                this.validateQualifier(qualifier, qualifierPath, errors);
              });
            }

            // Validate element qualifiers recursively
            if (sm.submodelElements) {
              this.validateElementQualifiersRecursive(
                sm.submodelElements,
                `${basePath}.submodelElements`,
                errors
              );
            }
          });
        }

        return errors;
      },
    });

    // Submodel idShort uniqueness within submodel
    this.registerRule({
      id: "submodel-element-idshort-unique",
      name: "Submodel Element idShort Unique",
      description: "idShort must be unique within the same level",
      severity: "error",
      category: "structure",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.submodels) {
          env.submodels.forEach((sm, smIndex) => {
            const basePath = `submodels[${smIndex}]`;

            if (sm.submodelElements) {
              this.validateIdShortUniquenessRecursive(
                sm.submodelElements,
                `${basePath}.submodelElements`,
                errors
              );
            }
          });
        }

        return errors;
      },
    });

    // ========================================================================
    // SubmodelElement Validation Rules (Task 2.2.4)
    // ========================================================================

    // Property validation
    this.registerRule({
      id: "property-validation",
      name: "Property Validation",
      description: "Validate Property elements",
      severity: "error",
      category: "schema",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.submodels) {
          env.submodels.forEach((sm, smIndex) => {
            if (sm.submodelElements) {
              this.validatePropertiesRecursive(
                sm.submodelElements,
                `submodels[${smIndex}].submodelElements`,
                errors
              );
            }
          });
        }

        return errors;
      },
    });

    // Range validation
    this.registerRule({
      id: "range-validation",
      name: "Range Validation",
      description: "Validate Range elements",
      severity: "error",
      category: "schema",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.submodels) {
          env.submodels.forEach((sm, smIndex) => {
            if (sm.submodelElements) {
              this.validateRangesRecursive(
                sm.submodelElements,
                `submodels[${smIndex}].submodelElements`,
                errors
              );
            }
          });
        }

        return errors;
      },
    });

    // MultiLanguageProperty validation
    this.registerRule({
      id: "multilanguage-property-validation",
      name: "MultiLanguageProperty Validation",
      description: "Validate MultiLanguageProperty elements",
      severity: "error",
      category: "schema",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.submodels) {
          env.submodels.forEach((sm, smIndex) => {
            if (sm.submodelElements) {
              this.validateMultiLanguagePropertiesRecursive(
                sm.submodelElements,
                `submodels[${smIndex}].submodelElements`,
                errors
              );
            }
          });
        }

        return errors;
      },
    });

    // Collection validation (enhanced)
    this.registerRule({
      id: "collection-validation",
      name: "Collection Validation",
      description: "Validate SubmodelElementCollection elements",
      severity: "warning",
      category: "structure",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.submodels) {
          env.submodels.forEach((sm, smIndex) => {
            if (sm.submodelElements) {
              this.validateCollectionsRecursive(
                sm.submodelElements,
                `submodels[${smIndex}].submodelElements`,
                errors
              );
            }
          });
        }

        return errors;
      },
    });

    // List validation (enhanced)
    this.registerRule({
      id: "list-validation",
      name: "List Validation",
      description: "Validate SubmodelElementList elements",
      severity: "error",
      category: "structure",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.submodels) {
          env.submodels.forEach((sm, smIndex) => {
            if (sm.submodelElements) {
              this.validateListsRecursive(
                sm.submodelElements,
                `submodels[${smIndex}].submodelElements`,
                errors
              );
            }
          });
        }

        return errors;
      },
    });

    // Operation validation
    this.registerRule({
      id: "operation-validation",
      name: "Operation Validation",
      description: "Validate Operation elements",
      severity: "error",
      category: "schema",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.submodels) {
          env.submodels.forEach((sm, smIndex) => {
            if (sm.submodelElements) {
              this.validateOperationsRecursive(
                sm.submodelElements,
                `submodels[${smIndex}].submodelElements`,
                errors
              );
            }
          });
        }

        return errors;
      },
    });

    // Entity validation
    this.registerRule({
      id: "entity-validation",
      name: "Entity Validation",
      description: "Validate Entity elements",
      severity: "error",
      category: "schema",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.submodels) {
          env.submodels.forEach((sm, smIndex) => {
            if (sm.submodelElements) {
              this.validateEntitiesRecursive(
                sm.submodelElements,
                `submodels[${smIndex}].submodelElements`,
                errors
              );
            }
          });
        }

        return errors;
      },
    });

    // ========================================================================
    // AAS Validation Rules (Task 2.2.2)
    // ========================================================================

    // AAS derivedFrom reference validation
    this.registerRule({
      id: "aas-derived-from-validation",
      name: "AAS DerivedFrom Validation",
      description: "Validate AAS derivedFrom references",
      severity: "error",
      category: "reference",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (!env.assetAdministrationShells) {
          return errors;
        }

        env.assetAdministrationShells.forEach((aas, index) => {
          if (aas.derivedFrom) {
            // Validate reference structure
            if (!aas.derivedFrom.keys || aas.derivedFrom.keys.length === 0) {
              errors.push({
                path: `assetAdministrationShells[${index}].derivedFrom`,
                message: `AAS "${aas.idShort}" has derivedFrom with no keys`,
                severity: "error",
                code: "INVALID_DERIVED_FROM",
                suggestion: "Provide at least one key in the derivedFrom reference",
              });
            } else {
              // Validate that the reference points to an AAS
              const lastKey = aas.derivedFrom.keys[aas.derivedFrom.keys.length - 1];
              if (lastKey.type !== "AssetAdministrationShell") {
                errors.push({
                  path: `assetAdministrationShells[${index}].derivedFrom`,
                  message: `AAS "${aas.idShort}" derivedFrom must reference another AAS, found ${lastKey.type}`,
                  severity: "error",
                  code: "INVALID_DERIVED_FROM_TYPE",
                  suggestion: "Ensure derivedFrom references an AssetAdministrationShell",
                });
              }
            }
          }
        });

        return errors;
      },
    });

    // AAS submodel reference validation
    this.registerRule({
      id: "aas-submodel-references",
      name: "AAS Submodel References",
      description: "Validate AAS submodel references resolve correctly",
      severity: "error",
      category: "reference",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (!env.assetAdministrationShells) {
          return errors;
        }

        // Build submodel ID index
        const submodelIds = new Set<string>();
        if (env.submodels) {
          env.submodels.forEach((sm) => submodelIds.add(sm.id));
        }

        env.assetAdministrationShells.forEach((aas, index) => {
          if (aas.submodels && aas.submodels.length > 0) {
            aas.submodels.forEach((ref, refIndex) => {
              // Validate reference structure
              if (!ref.keys || ref.keys.length === 0) {
                errors.push({
                  path: `assetAdministrationShells[${index}].submodels[${refIndex}]`,
                  message: `AAS "${aas.idShort}" has submodel reference with no keys`,
                  severity: "error",
                  code: "INVALID_SUBMODEL_REFERENCE",
                  suggestion: "Provide at least one key in the submodel reference",
                });
                return;
              }

              // Get the referenced ID
              const lastKey = ref.keys[ref.keys.length - 1];

              // Validate key type
              if (lastKey.type !== "Submodel") {
                errors.push({
                  path: `assetAdministrationShells[${index}].submodels[${refIndex}]`,
                  message: `AAS "${aas.idShort}" submodel reference must point to Submodel, found ${lastKey.type}`,
                  severity: "error",
                  code: "INVALID_SUBMODEL_REFERENCE_TYPE",
                  suggestion: "Ensure the reference key type is 'Submodel'",
                });
                return;
              }

              // Check if reference resolves (only for ModelReference)
              if (ref.type === "ModelReference" && !submodelIds.has(lastKey.value)) {
                errors.push({
                  path: `assetAdministrationShells[${index}].submodels[${refIndex}]`,
                  message: `AAS "${aas.idShort}" references non-existent submodel: ${lastKey.value}`,
                  severity: "error",
                  code: "UNRESOLVED_SUBMODEL_REFERENCE",
                  suggestion: `Add a submodel with id "${lastKey.value}" or fix the reference`,
                });
              }
            });
          }
        });

        return errors;
      },
    });

    // AAS administration validation
    this.registerRule({
      id: "aas-administration-validation",
      name: "AAS Administration Validation",
      description: "Validate AAS administration information",
      severity: "warning",
      category: "schema",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (!env.assetAdministrationShells) {
          return errors;
        }

        env.assetAdministrationShells.forEach((aas, index) => {
          if (aas.administration) {
            const admin = aas.administration;

            // Validate version format (should be semantic versioning)
            if (admin.version) {
              const versionRegex = /^\d+(\.\d+)*$/;
              if (!versionRegex.test(admin.version)) {
                errors.push({
                  path: `assetAdministrationShells[${index}].administration.version`,
                  message: `AAS "${aas.idShort}" has invalid version format: ${admin.version}`,
                  severity: "warning",
                  code: "INVALID_VERSION_FORMAT",
                  suggestion: "Use semantic versioning format (e.g., 1.0.0)",
                });
              }
            }

            // Validate revision format
            if (admin.revision) {
              const revisionRegex = /^\d+$/;
              if (!revisionRegex.test(admin.revision)) {
                errors.push({
                  path: `assetAdministrationShells[${index}].administration.revision`,
                  message: `AAS "${aas.idShort}" has invalid revision format: ${admin.revision}`,
                  severity: "warning",
                  code: "INVALID_REVISION_FORMAT",
                  suggestion: "Use numeric revision format (e.g., 1, 2, 3)",
                });
              }
            }

            // Validate templateId format if present
            if (admin.templateId) {
              if (admin.templateId.trim() === "") {
                errors.push({
                  path: `assetAdministrationShells[${index}].administration.templateId`,
                  message: `AAS "${aas.idShort}" has empty templateId`,
                  severity: "warning",
                  code: "EMPTY_TEMPLATE_ID",
                  suggestion: "Provide a valid templateId or remove the field",
                });
              }
            }
          }
        });

        return errors;
      },
    });

    // AAS asset information validation (enhanced)
    this.registerRule({
      id: "aas-asset-information-complete",
      name: "AAS Asset Information Complete",
      description: "Validate completeness of AAS asset information",
      severity: "warning",
      category: "schema",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (!env.assetAdministrationShells) {
          return errors;
        }

        env.assetAdministrationShells.forEach((aas, index) => {
          const assetInfo = aas.assetInformation;

          // Warn if no globalAssetId
          if (!assetInfo.globalAssetId) {
            errors.push({
              path: `assetAdministrationShells[${index}].assetInformation.globalAssetId`,
              message: `AAS "${aas.idShort}" has no globalAssetId`,
              severity: "warning",
              code: "MISSING_GLOBAL_ASSET_ID",
              suggestion: "Provide a globalAssetId for better asset identification",
            });
          }

          // Validate specificAssetIds if present
          if (assetInfo.specificAssetIds && assetInfo.specificAssetIds.length > 0) {
            assetInfo.specificAssetIds.forEach((specificId, sidIndex) => {
              // Check required fields
              if (!specificId.name || specificId.name.trim() === "") {
                errors.push({
                  path: `assetAdministrationShells[${index}].assetInformation.specificAssetIds[${sidIndex}].name`,
                  message: `AAS "${aas.idShort}" has specificAssetId without name`,
                  severity: "error",
                  code: "MISSING_SPECIFIC_ASSET_ID_NAME",
                  suggestion: "Provide a name for the specificAssetId",
                });
              }

              if (!specificId.value || specificId.value.trim() === "") {
                errors.push({
                  path: `assetAdministrationShells[${index}].assetInformation.specificAssetIds[${sidIndex}].value`,
                  message: `AAS "${aas.idShort}" has specificAssetId without value`,
                  severity: "error",
                  code: "MISSING_SPECIFIC_ASSET_ID_VALUE",
                  suggestion: "Provide a value for the specificAssetId",
                });
              }

              // Validate externalSubjectId if present
              if (specificId.externalSubjectId) {
                if (!specificId.externalSubjectId.keys || specificId.externalSubjectId.keys.length === 0) {
                  errors.push({
                    path: `assetAdministrationShells[${index}].assetInformation.specificAssetIds[${sidIndex}].externalSubjectId`,
                    message: `AAS "${aas.idShort}" has externalSubjectId with no keys`,
                    severity: "warning",
                    code: "INVALID_EXTERNAL_SUBJECT_ID",
                    suggestion: "Provide at least one key in the externalSubjectId reference",
                  });
                }
              }
            });
          }

          // Validate defaultThumbnail if present
          if (assetInfo.defaultThumbnail) {
            if (!assetInfo.defaultThumbnail.path || assetInfo.defaultThumbnail.path.trim() === "") {
              errors.push({
                path: `assetAdministrationShells[${index}].assetInformation.defaultThumbnail.path`,
                message: `AAS "${aas.idShort}" has defaultThumbnail without path`,
                severity: "error",
                code: "MISSING_THUMBNAIL_PATH",
                suggestion: "Provide a path for the defaultThumbnail",
              });
            }
          }
        });

        return errors;
      },
    });

    // AAS idShort uniqueness within environment
    this.registerRule({
      id: "aas-idshort-uniqueness",
      name: "AAS idShort Uniqueness",
      description: "Warn about duplicate AAS idShort values",
      severity: "warning",
      category: "structure",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (!env.assetAdministrationShells || env.assetAdministrationShells.length < 2) {
          return errors;
        }

        const idShortMap = new Map<string, number[]>();

        env.assetAdministrationShells.forEach((aas, index) => {
          if (aas.idShort) {
            if (!idShortMap.has(aas.idShort)) {
              idShortMap.set(aas.idShort, []);
            }
            idShortMap.get(aas.idShort)!.push(index);
          }
        });

        // Report duplicates
        idShortMap.forEach((indices, idShort) => {
          if (indices.length > 1) {
            indices.forEach((index) => {
              errors.push({
                path: `assetAdministrationShells[${index}].idShort`,
                message: `AAS idShort "${idShort}" is used ${indices.length} times`,
                severity: "warning",
                code: "DUPLICATE_AAS_IDSHORT",
                suggestion: "Use unique idShort values for better identification",
              });
            });
          }
        });

        return errors;
      },
    });

    // Semantic validation - Enhanced
    this.registerRule({
      id: "semantic-id-format",
      name: "Semantic ID Format",
      description: "Semantic IDs should follow proper format (IRI or IRDI)",
      severity: "warning",
      category: "semantic",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        // Validate Submodel semantic IDs
        if (env.submodels) {
          env.submodels.forEach((sm, index) => {
            if (sm.semanticId) {
              const semanticId = this.getReferenceId(sm.semanticId);
              if (semanticId && !this.isValidSemanticId(semanticId)) {
                errors.push({
                  path: `submodels[${index}].semanticId`,
                  message: `Semantic ID should be a valid IRI or IRDI: ${semanticId}`,
                  severity: "warning",
                  code: "INVALID_SEMANTIC_ID_FORMAT",
                  suggestion: "Use ECLASS (0173-1#...) or IEC CDD format, or a valid HTTP(S) IRI",
                });
              }
            }

            // Validate SubmodelElement semantic IDs
            if (sm.submodelElements) {
              this.validateSemanticIdsRecursive(
                sm.submodelElements,
                `submodels[${index}].submodelElements`,
                errors
              );
            }
          });
        }

        // Validate ConceptDescription semantic IDs
        if (env.conceptDescriptions) {
          env.conceptDescriptions.forEach((cd, index) => {
            if (cd.id) {
              if (!this.isValidSemanticId(cd.id)) {
                errors.push({
                  path: `conceptDescriptions[${index}].id`,
                  message: `ConceptDescription ID should be a valid IRI or IRDI: ${cd.id}`,
                  severity: "warning",
                  code: "INVALID_CONCEPT_ID_FORMAT",
                  suggestion: "Use ECLASS or IEC CDD format",
                });
              }
            }
          });
        }

        return errors;
      },
    });

    // Concept Description validation
    this.registerRule({
      id: "concept-description-validation",
      name: "Concept Description Validation",
      description: "Validate ConceptDescription structure and required fields",
      severity: "error",
      category: "semantic",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.conceptDescriptions) {
          env.conceptDescriptions.forEach((cd, index) => {
            const basePath = `conceptDescriptions[${index}]`;

            // Required fields
            if (!cd.id) {
              errors.push({
                path: `${basePath}.id`,
                message: "ConceptDescription must have an ID",
                severity: "error",
                code: "CONCEPT_MISSING_ID",
              });
            }

            if (!cd.idShort) {
              errors.push({
                path: `${basePath}.idShort`,
                message: "ConceptDescription should have an idShort",
                severity: "warning",
                code: "CONCEPT_MISSING_IDSHORT",
              });
            }

            // Validate IEC 61360 data specification if present
            if (cd.embeddedDataSpecifications) {
              cd.embeddedDataSpecifications.forEach((eds, edsIndex) => {
                if (eds.dataSpecification) {
                  const dsId = this.getReferenceId(eds.dataSpecification);

                  // Check if it's IEC 61360
                  if (dsId && dsId.includes("61360")) {
                    this.validateIEC61360DataSpec(
                      eds.dataSpecificationContent,
                      `${basePath}.embeddedDataSpecifications[${edsIndex}].dataSpecificationContent`,
                      errors
                    );
                  }
                }
              });
            }
          });
        }

        return errors;
      },
    });

    // IEC 61360 compliance validation
    this.registerRule({
      id: "iec-61360-compliance",
      name: "IEC 61360 Compliance",
      description: "Validate IEC 61360 data specification compliance",
      severity: "warning",
      category: "semantic",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.conceptDescriptions) {
          env.conceptDescriptions.forEach((cd, index) => {
            if (cd.embeddedDataSpecifications) {
              cd.embeddedDataSpecifications.forEach((eds, edsIndex) => {
                if (eds.dataSpecification) {
                  const dsId = this.getReferenceId(eds.dataSpecification);

                  // Check if it's IEC 61360
                  if (dsId && dsId.includes("61360")) {
                    const content = eds.dataSpecificationContent as any;
                    const basePath = `conceptDescriptions[${index}].embeddedDataSpecifications[${edsIndex}].dataSpecificationContent`;

                    // Validate preferred name
                    if (!content?.preferredName || (Array.isArray(content.preferredName) && content.preferredName.length === 0)) {
                      errors.push({
                        path: `${basePath}.preferredName`,
                        message: "IEC 61360: preferredName is required",
                        severity: "warning",
                        code: "IEC61360_MISSING_PREFERRED_NAME",
                      });
                    }

                    // Validate data type
                    if (!content?.dataType) {
                      errors.push({
                        path: `${basePath}.dataType`,
                        message: "IEC 61360: dataType should be specified",
                        severity: "info",
                        code: "IEC61360_MISSING_DATA_TYPE",
                      });
                    }

                    // Validate definition
                    if (!content?.definition || (Array.isArray(content.definition) && content.definition.length === 0)) {
                      errors.push({
                        path: `${basePath}.definition`,
                        message: "IEC 61360: definition is recommended",
                        severity: "info",
                        code: "IEC61360_MISSING_DEFINITION",
                      });
                    }
                  }
                }
              });
            }
          });
        }

        return errors;
      },
    });

    // Data specification validation
    this.registerRule({
      id: "data-specification-validation",
      name: "Data Specification Validation",
      description: "Validate embedded data specifications",
      severity: "warning",
      category: "semantic",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        // Validate ConceptDescription data specifications
        if (env.conceptDescriptions) {
          env.conceptDescriptions.forEach((cd, index) => {
            if (cd.embeddedDataSpecifications) {
              cd.embeddedDataSpecifications.forEach((eds, edsIndex) => {
                const basePath = `conceptDescriptions[${index}].embeddedDataSpecifications[${edsIndex}]`;

                // Check dataSpecification reference
                if (!eds.dataSpecification) {
                  errors.push({
                    path: `${basePath}.dataSpecification`,
                    message: "Embedded data specification must have a dataSpecification reference",
                    severity: "error",
                    code: "DATA_SPEC_MISSING_REFERENCE",
                  });
                }

                // Check dataSpecificationContent
                if (!eds.dataSpecificationContent) {
                  errors.push({
                    path: `${basePath}.dataSpecificationContent`,
                    message: "Embedded data specification must have content",
                    severity: "error",
                    code: "DATA_SPEC_MISSING_CONTENT",
                  });
                }
              });
            }
          });
        }

        // Validate Submodel data specifications
        if (env.submodels) {
          env.submodels.forEach((sm, index) => {
            if (sm.embeddedDataSpecifications) {
              sm.embeddedDataSpecifications.forEach((eds, edsIndex) => {
                const basePath = `submodels[${index}].embeddedDataSpecifications[${edsIndex}]`;

                if (!eds.dataSpecification) {
                  errors.push({
                    path: `${basePath}.dataSpecification`,
                    message: "Embedded data specification must have a dataSpecification reference",
                    severity: "error",
                    code: "DATA_SPEC_MISSING_REFERENCE",
                  });
                }

                if (!eds.dataSpecificationContent) {
                  errors.push({
                    path: `${basePath}.dataSpecificationContent`,
                    message: "Embedded data specification must have content",
                    severity: "error",
                    code: "DATA_SPEC_MISSING_CONTENT",
                  });
                }
              });
            }
          });
        }

        return errors;
      },
    });

    // Semantic ID reference resolution
    this.registerRule({
      id: "semantic-id-resolution",
      name: "Semantic ID Resolution",
      description: "Check if semantic IDs can be resolved to ConceptDescriptions",
      severity: "info",
      category: "semantic",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        // Build ConceptDescription index
        const conceptIndex = new Set<string>();
        if (env.conceptDescriptions) {
          env.conceptDescriptions.forEach((cd) => {
            if (cd.id) {
              conceptIndex.add(cd.id);
            }
          });
        }

        // Check Submodel semantic IDs
        if (env.submodels) {
          env.submodels.forEach((sm, index) => {
            if (sm.semanticId) {
              const semanticId = this.getReferenceId(sm.semanticId);

              // Only check internal references (not external URLs)
              if (semanticId && !semanticId.startsWith("http://") && !semanticId.startsWith("https://")) {
                if (!conceptIndex.has(semanticId)) {
                  errors.push({
                    path: `submodels[${index}].semanticId`,
                    message: `Semantic ID references non-existent ConceptDescription: ${semanticId}`,
                    severity: "info",
                    code: "SEMANTIC_ID_UNRESOLVED",
                    suggestion: "Add corresponding ConceptDescription or use external reference",
                  });
                }
              }
            }

            // Check SubmodelElement semantic IDs
            if (sm.submodelElements) {
              this.validateSemanticIdResolutionRecursive(
                sm.submodelElements,
                `submodels[${index}].submodelElements`,
                conceptIndex,
                errors
              );
            }
          });
        }

        return errors;
      },
    });
  }

  /**
   * Helper: Build ID index for fast reference lookup
   */
  private buildIdIndex(env: Environment): Map<string, { type: string; element: any }> {
    const index = new Map<string, { type: string; element: any }>();

    // Index AAS
    if (env.assetAdministrationShells) {
      env.assetAdministrationShells.forEach((aas) => {
        if (aas.id) {
          index.set(aas.id, { type: "AssetAdministrationShell", element: aas });
        }
      });
    }

    // Index Submodels
    if (env.submodels) {
      env.submodels.forEach((sm) => {
        if (sm.id) {
          index.set(sm.id, { type: "Submodel", element: sm });
        }
      });
    }

    // Index ConceptDescriptions
    if (env.conceptDescriptions) {
      env.conceptDescriptions.forEach((cd) => {
        if (cd.id) {
          index.set(cd.id, { type: "ConceptDescription", element: cd });
        }
      });
    }

    return index;
  }

  /**
   * Helper: Build type index for reference type validation
   */
  private buildTypeIndex(env: Environment): Map<string, string> {
    const index = new Map<string, string>();

    if (env.assetAdministrationShells) {
      env.assetAdministrationShells.forEach((aas) => {
        if (aas.id) {
          index.set(aas.id, "AssetAdministrationShell");
        }
      });
    }

    if (env.submodels) {
      env.submodels.forEach((sm) => {
        if (sm.id) {
          index.set(sm.id, "Submodel");
        }
      });
    }

    if (env.conceptDescriptions) {
      env.conceptDescriptions.forEach((cd) => {
        if (cd.id) {
          index.set(cd.id, "ConceptDescription");
        }
      });
    }

    return index;
  }

  /**
   * Helper: Validate a single reference
   */
  private validateReference(
    ref: Reference,
    path: string,
    idIndex: Map<string, { type: string; element: any }>,
    errors: ValidationError[],
    allowExternal: boolean = false
  ): void {
    if (!ref.keys || ref.keys.length === 0) {
      errors.push({
        path,
        message: "Reference must have at least one key",
        severity: "error",
        code: "REFERENCE_EMPTY_KEYS",
      });
      return;
    }

    const targetId = ref.keys[ref.keys.length - 1].value;

    // Check if reference is external (starts with http:// or https://)
    if (allowExternal && (targetId.startsWith("http://") || targetId.startsWith("https://"))) {
      return; // External references are allowed
    }

    if (!idIndex.has(targetId)) {
      errors.push({
        path,
        message: `Reference to non-existent element: ${targetId}`,
        severity: "error",
        code: "BROKEN_REFERENCE",
        suggestion: "Ensure the referenced element exists in the environment",
      });
    }
  }

  /**
   * Helper: Validate submodel element references recursively
   */
  private validateSubmodelElementReferences(
    elements: any[],
    basePath: string,
    idIndex: Map<string, { type: string; element: any }>,
    errors: ValidationError[]
  ): void {
    elements.forEach((element, index) => {
      const path = `${basePath}[${index}]`;

      // Check semanticId
      if (element.semanticId) {
        this.validateReference(
          element.semanticId,
          `${path}.semanticId`,
          idIndex,
          errors,
          true // Allow external references
        );
      }

      // Check ReferenceElement
      if (element.modelType === "ReferenceElement" && element.value) {
        this.validateReference(
          element.value,
          `${path}.value`,
          idIndex,
          errors
        );
      }

      // Check RelationshipElement
      if (element.modelType === "RelationshipElement") {
        if (element.first) {
          this.validateReference(
            element.first,
            `${path}.first`,
            idIndex,
            errors
          );
        }
        if (element.second) {
          this.validateReference(
            element.second,
            `${path}.second`,
            idIndex,
            errors
          );
        }
      }

      // Check AnnotatedRelationshipElement
      if (element.modelType === "AnnotatedRelationshipElement") {
        if (element.first) {
          this.validateReference(
            element.first,
            `${path}.first`,
            idIndex,
            errors
          );
        }
        if (element.second) {
          this.validateReference(
            element.second,
            `${path}.second`,
            idIndex,
            errors
          );
        }
      }

      // Recursively validate nested elements
      if (element.value && Array.isArray(element.value)) {
        this.validateSubmodelElementReferences(
          element.value,
          `${path}.value`,
          idIndex,
          errors
        );
      }
    });
  }

  /**
   * Helper: Check for circular references
   */
  private hasCircularReference(
    element: any,
    env: Environment,
    visited: Set<string>,
    path: string[],
    refField: string
  ): boolean {
    if (!element.id) {
      return false;
    }

    if (visited.has(element.id)) {
      return true;
    }

    visited.add(element.id);
    path.push(element.id);

    // Check the reference field
    if (element[refField]) {
      const ref = element[refField];
      const targetId = this.getReferenceId(ref);

      if (targetId) {
        // Find the target element
        let targetElement: any = null;

        if (env.assetAdministrationShells) {
          targetElement = env.assetAdministrationShells.find((aas) => aas.id === targetId);
        }

        if (targetElement) {
          if (this.hasCircularReference(targetElement, env, visited, path, refField)) {
            return true;
          }
        }
      }
    }

    visited.delete(element.id);
    path.pop();
    return false;
  }

  /**
   * Helper: Validate key structure
   */
  private validateKeyStructure(
    ref: Reference,
    path: string,
    errors: ValidationError[]
  ): void {
    if (!ref.keys || ref.keys.length === 0) {
      errors.push({
        path,
        message: "Reference must have at least one key",
        severity: "error",
        code: "REFERENCE_EMPTY_KEYS",
      });
      return;
    }

    ref.keys.forEach((key, keyIndex) => {
      // Validate key type
      if (!key.type) {
        errors.push({
          path: `${path}.keys[${keyIndex}].type`,
          message: "Key must have a type",
          severity: "error",
          code: "KEY_MISSING_TYPE",
        });
      }

      // Validate key value
      if (!key.value) {
        errors.push({
          path: `${path}.keys[${keyIndex}].value`,
          message: "Key must have a value",
          severity: "error",
          code: "KEY_MISSING_VALUE",
        });
      }

      // Validate key type is valid
      const validKeyTypes = [
        "AssetAdministrationShell",
        "Submodel",
        "SubmodelElement",
        "SubmodelElementCollection",
        "SubmodelElementList",
        "Property",
        "MultiLanguageProperty",
        "Range",
        "ReferenceElement",
        "Blob",
        "File",
        "Operation",
        "Entity",
        "ConceptDescription",
        "GlobalReference",
        "FragmentReference",
      ];

      if (key.type && !validKeyTypes.includes(key.type)) {
        errors.push({
          path: `${path}.keys[${keyIndex}].type`,
          message: `Invalid key type: ${key.type}`,
          severity: "error",
          code: "KEY_INVALID_TYPE",
          suggestion: `Valid types: ${validKeyTypes.join(", ")}`,
        });
      }
    });

    // Validate reference type
    if (!ref.type) {
      errors.push({
        path: `${path}.type`,
        message: "Reference must have a type",
        severity: "error",
        code: "REFERENCE_MISSING_TYPE",
      });
    } else {
      const validRefTypes = ["ExternalReference", "ModelReference"];
      if (!validRefTypes.includes(ref.type)) {
        errors.push({
          path: `${path}.type`,
          message: `Invalid reference type: ${ref.type}`,
          severity: "error",
          code: "REFERENCE_INVALID_TYPE",
          suggestion: `Valid types: ${validRefTypes.join(", ")}`,
        });
      }
    }
  }

  /**
   * Helper: Validate submodel element key structures recursively
   */
  private validateSubmodelElementKeyStructures(
    elements: any[],
    basePath: string,
    errors: ValidationError[]
  ): void {
    elements.forEach((element, index) => {
      const path = `${basePath}[${index}]`;

      // Check semanticId
      if (element.semanticId) {
        this.validateKeyStructure(
          element.semanticId,
          `${path}.semanticId`,
          errors
        );
      }

      // Check ReferenceElement
      if (element.modelType === "ReferenceElement" && element.value) {
        this.validateKeyStructure(
          element.value,
          `${path}.value`,
          errors
        );
      }

      // Check RelationshipElement
      if (element.modelType === "RelationshipElement") {
        if (element.first) {
          this.validateKeyStructure(
            element.first,
            `${path}.first`,
            errors
          );
        }
        if (element.second) {
          this.validateKeyStructure(
            element.second,
            `${path}.second`,
            errors
          );
        }
      }

      // Check AnnotatedRelationshipElement
      if (element.modelType === "AnnotatedRelationshipElement") {
        if (element.first) {
          this.validateKeyStructure(
            element.first,
            `${path}.first`,
            errors
          );
        }
        if (element.second) {
          this.validateKeyStructure(
            element.second,
            `${path}.second`,
            errors
          );
        }
      }

      // Recursively validate nested elements
      if (element.value && Array.isArray(element.value)) {
        this.validateSubmodelElementKeyStructures(
          element.value,
          `${path}.value`,
          errors
        );
      }
    });
  }

  /**
   * Helper: Validate reference type matches target
   */
  private validateReferenceType(
    ref: Reference,
    expectedType: string,
    path: string,
    typeIndex: Map<string, string>,
    errors: ValidationError[]
  ): void {
    if (!ref.keys || ref.keys.length === 0) {
      return; // Already handled by key structure validation
    }

    const targetId = ref.keys[ref.keys.length - 1].value;
    const actualType = typeIndex.get(targetId);

    if (actualType && actualType !== expectedType) {
      errors.push({
        path,
        message: `Reference type mismatch: expected ${expectedType}, but target is ${actualType}`,
        severity: "error",
        code: "REFERENCE_TYPE_MISMATCH",
        suggestion: `Ensure reference points to a ${expectedType}`,
      });
    }

    // Also check the last key type matches expected type
    const lastKey = ref.keys[ref.keys.length - 1];
    if (lastKey.type && lastKey.type !== expectedType && lastKey.type !== "GlobalReference") {
      errors.push({
        path: `${path}.keys[${ref.keys.length - 1}].type`,
        message: `Key type mismatch: expected ${expectedType}, but got ${lastKey.type}`,
        severity: "warning",
        code: "KEY_TYPE_MISMATCH",
        suggestion: `Key type should match the referenced element type`,
      });
    }
  }

  /**
   * Helper: Validate SubmodelElements recursively
   */
  private validateSubmodelElementsRecursive(
    elements: any[],
    basePath: string,
    errors: ValidationError[]
  ): void {
    elements.forEach((element, index) => {
      const path = `${basePath}[${index}]`;

      if (!element.idShort) {
        errors.push({
          path: `${path}.idShort`,
          message: "SubmodelElement must have an idShort",
          severity: "error",
          code: "ELEMENT_MISSING_IDSHORT",
        });
      }

      if (!element.modelType) {
        errors.push({
          path: `${path}.modelType`,
          message: "SubmodelElement must have a modelType",
          severity: "error",
          code: "ELEMENT_MISSING_MODELTYPE",
        });
      }

      // Recursively validate nested elements
      if (element.value && Array.isArray(element.value)) {
        this.validateSubmodelElementsRecursive(
          element.value,
          `${path}.value`,
          errors
        );
      }
    });
  }

  /**
   * Helper: Validate property types recursively
   */
  private validatePropertyTypesRecursive(
    elements: any[],
    basePath: string,
    errors: ValidationError[]
  ): void {
    elements.forEach((element, index) => {
      const path = `${basePath}[${index}]`;

      // Validate Property type
      if (element.modelType === "Property" && element.valueType && element.value) {
        const isValid = this.validateValueType(element.value, element.valueType);
        if (!isValid) {
          errors.push({
            path: `${path}.value`,
            message: `Property value "${element.value}" does not match declared type ${element.valueType}`,
            severity: "error",
            code: "PROPERTY_TYPE_MISMATCH",
            suggestion: `Ensure value conforms to ${element.valueType}`,
          });
        }
      }

      // Validate Range type
      if (element.modelType === "Range" && element.valueType) {
        if (element.min !== undefined) {
          const isValid = this.validateValueType(element.min, element.valueType);
          if (!isValid) {
            errors.push({
              path: `${path}.min`,
              message: `Range min value does not match declared type ${element.valueType}`,
              severity: "error",
              code: "RANGE_TYPE_MISMATCH",
            });
          }
        }
        if (element.max !== undefined) {
          const isValid = this.validateValueType(element.max, element.valueType);
          if (!isValid) {
            errors.push({
              path: `${path}.max`,
              message: `Range max value does not match declared type ${element.valueType}`,
              severity: "error",
              code: "RANGE_TYPE_MISMATCH",
            });
          }
        }
      }

      // Recursively validate nested elements
      if (element.value && Array.isArray(element.value)) {
        this.validatePropertyTypesRecursive(
          element.value,
          `${path}.value`,
          errors
        );
      }
    });
  }

  /**
   * Helper: Validate cardinality recursively
   */
  private validateCardinalityRecursive(
    elements: any[],
    basePath: string,
    errors: ValidationError[]
  ): void {
    elements.forEach((element, index) => {
      const path = `${basePath}[${index}]`;

      // Validate SubmodelElementCollection
      if (element.modelType === "SubmodelElementCollection") {
        if (element.value && Array.isArray(element.value)) {
          if (element.value.length === 0) {
            errors.push({
              path: `${path}.value`,
              message: "SubmodelElementCollection should not be empty",
              severity: "warning",
              code: "COLLECTION_EMPTY",
            });
          }
        }
      }

      // Validate SubmodelElementList
      if (element.modelType === "SubmodelElementList") {
        if (element.value && Array.isArray(element.value)) {
          if (element.value.length === 0) {
            errors.push({
              path: `${path}.value`,
              message: "SubmodelElementList should not be empty",
              severity: "warning",
              code: "LIST_EMPTY",
            });
          }

          // Check type consistency in list
          if (element.typeValueListElement && element.value.length > 0) {
            const expectedType = element.typeValueListElement;
            element.value.forEach((item: any, itemIndex: number) => {
              if (item.modelType !== expectedType) {
                errors.push({
                  path: `${path}.value[${itemIndex}]`,
                  message: `List element type ${item.modelType} does not match expected type ${expectedType}`,
                  severity: "error",
                  code: "LIST_TYPE_MISMATCH",
                });
              }
            });
          }
        }
      }

      // Recursively validate nested elements
      if (element.value && Array.isArray(element.value)) {
        this.validateCardinalityRecursive(
          element.value,
          `${path}.value`,
          errors
        );
      }
    });
  }

  /**
   * Helper: Validate value against XSD type
   */
  private validateValueType(value: string, valueType: string): boolean {
    if (!value || !valueType) {
      return true; // Skip validation if either is missing
    }

    const val = value.toString();

    switch (valueType) {
      case "xs:boolean":
        return val === "true" || val === "false" || val === "0" || val === "1";

      case "xs:int":
      case "xs:integer":
      case "xs:long":
      case "xs:short":
      case "xs:byte":
        return /^-?\d+$/.test(val);

      case "xs:unsignedInt":
      case "xs:unsignedLong":
      case "xs:unsignedShort":
      case "xs:unsignedByte":
      case "xs:positiveInteger":
      case "xs:nonNegativeInteger":
        return /^\d+$/.test(val) && parseInt(val, 10) >= 0;

      case "xs:negativeInteger":
      case "xs:nonPositiveInteger":
        return /^-?\d+$/.test(val) && parseInt(val, 10) <= 0;

      case "xs:float":
      case "xs:double":
      case "xs:decimal":
        return /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(val);

      case "xs:date":
        return /^\d{4}-\d{2}-\d{2}$/.test(val);

      case "xs:dateTime":
        return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val);

      case "xs:time":
        return /^\d{2}:\d{2}:\d{2}/.test(val);

      case "xs:duration":
        return /^P(\d+Y)?(\d+M)?(\d+D)?(T(\d+H)?(\d+M)?(\d+(\.\d+)?S)?)?$/.test(val);

      case "xs:anyURI":
        try {
          new URL(val);
          return true;
        } catch {
          return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(val); // Basic URI scheme check
        }

      case "xs:base64Binary":
        return /^[A-Za-z0-9+/]*={0,2}$/.test(val);

      case "xs:hexBinary":
        return /^[0-9A-Fa-f]*$/.test(val);

      case "xs:string":
      default:
        return true; // String accepts anything
    }
  }

  /**
   * Helper: Get reference ID
   */
  private getReferenceId(ref: Reference): string | undefined {
    if (!ref.keys || ref.keys.length === 0) {
      return undefined;
    }
    return ref.keys[ref.keys.length - 1].value;
  }

  /**
   * Helper: Check if reference ID is external (HTTP/HTTPS URL)
   */
  private isExternalReference(id: string): boolean {
    return id.startsWith("http://") || id.startsWith("https://");
  }

  /**
   * Helper: Validate semantic ID format (Enhanced for Task 2.1.4)
   */
  private isValidSemanticId(id: string): boolean {
    if (!id) {
      return false;
    }

    // Check for HTTP(S) IRI
    if (id.startsWith("http://") || id.startsWith("https://")) {
      try {
        new URL(id);
        return true;
      } catch {
        return false;
      }
    }

    // Check for ECLASS IRDI format (0173-1#02-AAA123#001)
    if (id.match(/^0173-1#\d{2}-[A-Z0-9]{6}#\d+$/)) {
      return true;
    }

    // Check for IEC CDD IRDI format (0112/2///61987#ABC123#001)
    if (id.match(/^0112\/2\/\/\/\d+#[A-Z]{3}\d{3}#\d+$/)) {
      return true;
    }

    // Check for generic IRDI format
    if (id.match(/^\d{4}-\d+#\d{2}-[A-Z0-9]+#\d+$/)) {
      return true;
    }

    // Check for URN format
    if (id.startsWith("urn:")) {
      return true;
    }

    return false;
  }

  /**
   * Helper: Validate semantic IDs recursively in SubmodelElements
   */
  private validateSemanticIdsRecursive(
    elements: any[],
    basePath: string,
    errors: ValidationError[]
  ): void {
    elements.forEach((element, index) => {
      const path = `${basePath}[${index}]`;

      // Check semanticId
      if (element.semanticId) {
        const semanticId = this.getReferenceId(element.semanticId);
        if (semanticId && !this.isValidSemanticId(semanticId)) {
          errors.push({
            path: `${path}.semanticId`,
            message: `Semantic ID should be a valid IRI or IRDI: ${semanticId}`,
            severity: "warning",
            code: "INVALID_SEMANTIC_ID_FORMAT",
            suggestion: "Use ECLASS or IEC CDD format",
          });
        }
      }

      // Recurse into collections and lists
      if (element.modelType === "SubmodelElementCollection" && element.value) {
        this.validateSemanticIdsRecursive(element.value, `${path}.value`, errors);
      }

      if (element.modelType === "SubmodelElementList" && element.value) {
        this.validateSemanticIdsRecursive(element.value, `${path}.value`, errors);
      }
    });
  }

  /**
   * Helper: Validate semantic ID resolution recursively
   */
  private validateSemanticIdResolutionRecursive(
    elements: any[],
    basePath: string,
    conceptIndex: Set<string>,
    errors: ValidationError[]
  ): void {
    elements.forEach((element, index) => {
      const path = `${basePath}[${index}]`;

      // Check semanticId
      if (element.semanticId) {
        const semanticId = this.getReferenceId(element.semanticId);

        // Only check internal references
        if (semanticId && !semanticId.startsWith("http://") && !semanticId.startsWith("https://")) {
          if (!conceptIndex.has(semanticId)) {
            errors.push({
              path: `${path}.semanticId`,
              message: `Semantic ID references non-existent ConceptDescription: ${semanticId}`,
              severity: "info",
              code: "SEMANTIC_ID_UNRESOLVED",
              suggestion: "Add corresponding ConceptDescription or use external reference",
            });
          }
        }
      }

      // Recurse into collections and lists
      if (element.modelType === "SubmodelElementCollection" && element.value) {
        this.validateSemanticIdResolutionRecursive(
          element.value,
          `${path}.value`,
          conceptIndex,
          errors
        );
      }

      if (element.modelType === "SubmodelElementList" && element.value) {
        this.validateSemanticIdResolutionRecursive(
          element.value,
          `${path}.value`,
          conceptIndex,
          errors
        );
      }
    });
  }

  /**
   * Helper: Collect semantic ID references from SubmodelElements
   */
  private collectSemanticIdReferences(
    elements: any[],
    referencedConcepts: Set<string>
  ): void {
    elements.forEach((element) => {
      if (element.semanticId) {
        const cdId = this.getReferenceId(element.semanticId);
        if (cdId) {
          referencedConcepts.add(cdId);
        }
      }

      // Recurse into collections and lists
      if (element.modelType === "SubmodelElementCollection" && element.value) {
        this.collectSemanticIdReferences(element.value, referencedConcepts);
      }

      if (element.modelType === "SubmodelElementList" && element.value) {
        this.collectSemanticIdReferences(element.value, referencedConcepts);
      }
    });
  }

  /**
   * Helper: Check if SubmodelElements have instance values
   */
  private checkForInstanceValues(elements: any[]): boolean {
    for (const element of elements) {
      // Check if element has a value
      if (element.modelType === "Property" && element.value !== undefined && element.value !== null && element.value !== "") {
        return true;
      }

      if (element.modelType === "MultiLanguageProperty" && element.value && element.value.length > 0) {
        return true;
      }

      if (element.modelType === "Range" && (element.min !== undefined || element.max !== undefined)) {
        return true;
      }

      if (element.modelType === "Blob" && element.value) {
        return true;
      }

      if (element.modelType === "File" && element.value) {
        return true;
      }

      // Recurse into collections and lists
      if (element.modelType === "SubmodelElementCollection" && element.value) {
        if (this.checkForInstanceValues(element.value)) {
          return true;
        }
      }

      if (element.modelType === "SubmodelElementList" && element.value) {
        if (this.checkForInstanceValues(element.value)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Helper: Check if SubmodelElements are missing values (for Instance kind)
   */
  private checkForMissingValues(elements: any[]): boolean {
    for (const element of elements) {
      // Check if element is missing a value
      if (element.modelType === "Property" && (element.value === undefined || element.value === null || element.value === "")) {
        return true;
      }

      if (element.modelType === "MultiLanguageProperty" && (!element.value || element.value.length === 0)) {
        return true;
      }

      if (element.modelType === "Range" && element.min === undefined && element.max === undefined) {
        return true;
      }

      if (element.modelType === "Blob" && !element.value) {
        return true;
      }

      if (element.modelType === "File" && !element.value) {
        return true;
      }

      // Recurse into collections and lists
      if (element.modelType === "SubmodelElementCollection" && element.value) {
        if (this.checkForMissingValues(element.value)) {
          return true;
        }
      }

      if (element.modelType === "SubmodelElementList" && element.value) {
        if (this.checkForMissingValues(element.value)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Helper: Validate element structure recursively
   */
  private validateElementStructureRecursive(
    elements: any[],
    basePath: string,
    errors: ValidationError[]
  ): void {
    elements.forEach((element, index) => {
      const path = `${basePath}[${index}]`;

      // Validate modelType is present
      if (!element.modelType) {
        errors.push({
          path: `${path}.modelType`,
          message: "SubmodelElement must have a modelType",
          severity: "error",
          code: "ELEMENT_MISSING_MODEL_TYPE",
        });
      }

      // Validate SubmodelElementCollection structure
      if (element.modelType === "SubmodelElementCollection") {
        if (element.value && !Array.isArray(element.value)) {
          errors.push({
            path: `${path}.value`,
            message: "SubmodelElementCollection value must be an array",
            severity: "error",
            code: "COLLECTION_VALUE_NOT_ARRAY",
          });
        } else if (element.value) {
          this.validateElementStructureRecursive(element.value, `${path}.value`, errors);
        }
      }

      // Validate SubmodelElementList structure
      if (element.modelType === "SubmodelElementList") {
        if (!element.typeValueListElement) {
          errors.push({
            path: `${path}.typeValueListElement`,
            message: "SubmodelElementList must have typeValueListElement",
            severity: "error",
            code: "LIST_MISSING_TYPE",
          });
        }

        if (element.value && !Array.isArray(element.value)) {
          errors.push({
            path: `${path}.value`,
            message: "SubmodelElementList value must be an array",
            severity: "error",
            code: "LIST_VALUE_NOT_ARRAY",
          });
        } else if (element.value) {
          // Validate all elements have the same type
          const expectedType = element.typeValueListElement;
          element.value.forEach((listElement: any, listIndex: number) => {
            if (listElement.modelType !== expectedType) {
              errors.push({
                path: `${path}.value[${listIndex}]`,
                message: `List element type mismatch: expected ${expectedType}, got ${listElement.modelType}`,
                severity: "error",
                code: "LIST_TYPE_MISMATCH",
              });
            }
          });

          this.validateElementStructureRecursive(element.value, `${path}.value`, errors);
        }
      }

      // Validate Blob structure
      if (element.modelType === "Blob") {
        if (!element.contentType) {
          errors.push({
            path: `${path}.contentType`,
            message: "Blob must have contentType",
            severity: "error",
            code: "BLOB_MISSING_CONTENT_TYPE",
          });
        }
      }

      // Validate File structure
      if (element.modelType === "File") {
        if (!element.contentType) {
          errors.push({
            path: `${path}.contentType`,
            message: "File must have contentType",
            severity: "error",
            code: "FILE_MISSING_CONTENT_TYPE",
          });
        }
      }

      // Validate RelationshipElement structure
      if (element.modelType === "RelationshipElement") {
        if (!element.first) {
          errors.push({
            path: `${path}.first`,
            message: "RelationshipElement must have first reference",
            severity: "error",
            code: "RELATIONSHIP_MISSING_FIRST",
          });
        }
        if (!element.second) {
          errors.push({
            path: `${path}.second`,
            message: "RelationshipElement must have second reference",
            severity: "error",
            code: "RELATIONSHIP_MISSING_SECOND",
          });
        }
      }

      // Validate AnnotatedRelationshipElement structure
      if (element.modelType === "AnnotatedRelationshipElement") {
        if (!element.first) {
          errors.push({
            path: `${path}.first`,
            message: "AnnotatedRelationshipElement must have first reference",
            severity: "error",
            code: "ANNOTATED_RELATIONSHIP_MISSING_FIRST",
          });
        }
        if (!element.second) {
          errors.push({
            path: `${path}.second`,
            message: "AnnotatedRelationshipElement must have second reference",
            severity: "error",
            code: "ANNOTATED_RELATIONSHIP_MISSING_SECOND",
          });
        }
      }
    });
  }

  /**
   * Helper: Validate qualifier structure
   */
  private validateQualifier(
    qualifier: any,
    path: string,
    errors: ValidationError[]
  ): void {
    // Required fields
    if (!qualifier.type) {
      errors.push({
        path: `${path}.type`,
        message: "Qualifier must have a type",
        severity: "error",
        code: "QUALIFIER_MISSING_TYPE",
      });
    }

    if (!qualifier.valueType) {
      errors.push({
        path: `${path}.valueType`,
        message: "Qualifier must have a valueType",
        severity: "error",
        code: "QUALIFIER_MISSING_VALUE_TYPE",
      });
    }

    // Validate valueType is valid
    if (qualifier.valueType) {
      const validValueTypes = [
        "xs:string", "xs:boolean", "xs:decimal", "xs:integer", "xs:double",
        "xs:float", "xs:date", "xs:time", "xs:dateTime", "xs:anyURI",
        "xs:base64Binary", "xs:hexBinary", "xs:long", "xs:int", "xs:short",
        "xs:byte", "xs:nonNegativeInteger", "xs:positiveInteger",
        "xs:unsignedLong", "xs:unsignedInt", "xs:unsignedShort", "xs:unsignedByte",
        "xs:nonPositiveInteger", "xs:negativeInteger", "xs:duration",
        "xs:gDay", "xs:gMonth", "xs:gMonthDay", "xs:gYear", "xs:gYearMonth",
      ];

      if (!validValueTypes.includes(qualifier.valueType)) {
        errors.push({
          path: `${path}.valueType`,
          message: `Invalid qualifier valueType: ${qualifier.valueType}`,
          severity: "error",
          code: "QUALIFIER_INVALID_VALUE_TYPE",
          suggestion: "Use a valid XSD data type",
        });
      }
    }

    // Validate kind if present
    if (qualifier.kind) {
      const validKinds = ["ConceptQualifier", "TemplateQualifier", "ValueQualifier"];
      if (!validKinds.includes(qualifier.kind)) {
        errors.push({
          path: `${path}.kind`,
          message: `Invalid qualifier kind: ${qualifier.kind}`,
          severity: "error",
          code: "QUALIFIER_INVALID_KIND",
          suggestion: `Valid kinds: ${validKinds.join(", ")}`,
        });
      }
    }
  }

  /**
   * Helper: Validate element qualifiers recursively
   */
  private validateElementQualifiersRecursive(
    elements: any[],
    basePath: string,
    errors: ValidationError[]
  ): void {
    elements.forEach((element, index) => {
      const path = `${basePath}[${index}]`;

      // Validate element qualifiers
      if (element.qualifiers) {
        element.qualifiers.forEach((qualifier: any, qIndex: number) => {
          this.validateQualifier(qualifier, `${path}.qualifiers[${qIndex}]`, errors);
        });
      }

      // Recurse into collections and lists
      if (element.modelType === "SubmodelElementCollection" && element.value) {
        this.validateElementQualifiersRecursive(element.value, `${path}.value`, errors);
      }

      if (element.modelType === "SubmodelElementList" && element.value) {
        this.validateElementQualifiersRecursive(element.value, `${path}.value`, errors);
      }
    });
  }

  /**
   * Helper: Validate idShort uniqueness within the same level
   */
  private validateIdShortUniquenessRecursive(
    elements: any[],
    basePath: string,
    errors: ValidationError[]
  ): void {
    // Check uniqueness at this level
    const idShorts = new Map<string, number>();

    elements.forEach((element, index) => {
      if (element.idShort) {
        if (idShorts.has(element.idShort)) {
          const firstIndex = idShorts.get(element.idShort)!;
          errors.push({
            path: `${basePath}[${index}].idShort`,
            message: `Duplicate idShort "${element.idShort}" at same level (first occurrence at index ${firstIndex})`,
            severity: "error",
            code: "DUPLICATE_IDSHORT",
            suggestion: "idShort must be unique within the same level",
          });
        } else {
          idShorts.set(element.idShort, index);
        }
      }

      // Recurse into collections and lists
      const path = `${basePath}[${index}]`;
      if (element.modelType === "SubmodelElementCollection" && element.value) {
        this.validateIdShortUniquenessRecursive(element.value, `${path}.value`, errors);
      }

      if (element.modelType === "SubmodelElementList" && element.value) {
        this.validateIdShortUniquenessRecursive(element.value, `${path}.value`, errors);
      }
    });
  }

  /**
   * Helper: Validate Property elements recursively
   */
  private validatePropertiesRecursive(
    elements: any[],
    basePath: string,
    errors: ValidationError[]
  ): void {
    elements.forEach((element, index) => {
      const path = `${basePath}[${index}]`;

      if (element.modelType === "Property") {
        // Validate valueType is present
        if (!element.valueType) {
          errors.push({
            path: `${path}.valueType`,
            message: "Property must have a valueType",
            severity: "error",
            code: "PROPERTY_MISSING_VALUE_TYPE",
          });
        }

        // Note: Detailed value type validation is handled by property-type-validation rule
      }

      // Recurse into collections and lists
      if (element.modelType === "SubmodelElementCollection" && element.value) {
        this.validatePropertiesRecursive(element.value, `${path}.value`, errors);
      }

      if (element.modelType === "SubmodelElementList" && element.value) {
        this.validatePropertiesRecursive(element.value, `${path}.value`, errors);
      }
    });
  }

  /**
   * Helper: Validate Range elements recursively
   */
  private validateRangesRecursive(
    elements: any[],
    basePath: string,
    errors: ValidationError[]
  ): void {
    elements.forEach((element, index) => {
      const path = `${basePath}[${index}]`;

      if (element.modelType === "Range") {
        // Validate valueType is present
        if (!element.valueType) {
          errors.push({
            path: `${path}.valueType`,
            message: "Range must have a valueType",
            severity: "error",
            code: "RANGE_MISSING_VALUE_TYPE",
          });
        }

        // Validate min and max are present
        if (element.min === undefined && element.max === undefined) {
          errors.push({
            path: `${path}`,
            message: "Range should have at least min or max value",
            severity: "warning",
            code: "RANGE_NO_VALUES",
            suggestion: "Specify at least one of min or max",
          });
        }

        // Validate min <= max if both present
        if (element.min !== undefined && element.max !== undefined && element.valueType) {
          if (!this.validateRangeOrder(element.min, element.max, element.valueType)) {
            errors.push({
              path: `${path}`,
              message: `Range min (${element.min}) should be less than or equal to max (${element.max})`,
              severity: "error",
              code: "RANGE_MIN_GREATER_THAN_MAX",
            });
          }
        }

        // Note: Detailed value type validation is handled by property-type-validation rule
      }

      // Recurse into collections and lists
      if (element.modelType === "SubmodelElementCollection" && element.value) {
        this.validateRangesRecursive(element.value, `${path}.value`, errors);
      }

      if (element.modelType === "SubmodelElementList" && element.value) {
        this.validateRangesRecursive(element.value, `${path}.value`, errors);
      }
    });
  }

  /**
   * Helper: Validate MultiLanguageProperty elements recursively
   */
  private validateMultiLanguagePropertiesRecursive(
    elements: any[],
    basePath: string,
    errors: ValidationError[]
  ): void {
    elements.forEach((element, index) => {
      const path = `${basePath}[${index}]`;

      if (element.modelType === "MultiLanguageProperty") {
        // Validate value is an array if present
        if (element.value && !Array.isArray(element.value)) {
          errors.push({
            path: `${path}.value`,
            message: "MultiLanguageProperty value must be an array",
            severity: "error",
            code: "MULTILANG_VALUE_NOT_ARRAY",
          });
        }

        // Validate each language string
        if (element.value && Array.isArray(element.value)) {
          element.value.forEach((langString: any, langIndex: number) => {
            if (!langString.language) {
              errors.push({
                path: `${path}.value[${langIndex}].language`,
                message: "Language string must have a language code",
                severity: "error",
                code: "MULTILANG_MISSING_LANGUAGE",
              });
            }

            if (!langString.text) {
              errors.push({
                path: `${path}.value[${langIndex}].text`,
                message: "Language string must have text",
                severity: "error",
                code: "MULTILANG_MISSING_TEXT",
              });
            }

            // Validate language code format (ISO 639-1 or BCP 47)
            if (langString.language && !this.isValidLanguageCode(langString.language)) {
              errors.push({
                path: `${path}.value[${langIndex}].language`,
                message: `Invalid language code: ${langString.language}`,
                severity: "warning",
                code: "MULTILANG_INVALID_LANGUAGE_CODE",
                suggestion: "Use ISO 639-1 (e.g., 'en', 'de') or BCP 47 format",
              });
            }
          });

          // Check for duplicate language codes
          const languages = new Set<string>();
          element.value.forEach((langString: any, langIndex: number) => {
            if (langString.language) {
              if (languages.has(langString.language)) {
                errors.push({
                  path: `${path}.value[${langIndex}].language`,
                  message: `Duplicate language code: ${langString.language}`,
                  severity: "warning",
                  code: "MULTILANG_DUPLICATE_LANGUAGE",
                });
              }
              languages.add(langString.language);
            }
          });
        }
      }

      // Recurse into collections and lists
      if (element.modelType === "SubmodelElementCollection" && element.value) {
        this.validateMultiLanguagePropertiesRecursive(element.value, `${path}.value`, errors);
      }

      if (element.modelType === "SubmodelElementList" && element.value) {
        this.validateMultiLanguagePropertiesRecursive(element.value, `${path}.value`, errors);
      }
    });
  }

  /**
   * Helper: Validate Collection elements recursively
   */
  private validateCollectionsRecursive(
    elements: any[],
    basePath: string,
    errors: ValidationError[]
  ): void {
    elements.forEach((element, index) => {
      const path = `${basePath}[${index}]`;

      if (element.modelType === "SubmodelElementCollection") {
        // Warn if collection is empty
        if (!element.value || element.value.length === 0) {
          errors.push({
            path: `${path}.value`,
            message: `Collection "${element.idShort}" is empty`,
            severity: "info",
            code: "COLLECTION_EMPTY",
            suggestion: "Consider adding elements or removing empty collection",
          });
        }

        // Recurse into nested collections
        if (element.value) {
          this.validateCollectionsRecursive(element.value, `${path}.value`, errors);
        }
      }

      // Recurse into lists
      if (element.modelType === "SubmodelElementList" && element.value) {
        this.validateCollectionsRecursive(element.value, `${path}.value`, errors);
      }
    });
  }

  /**
   * Helper: Validate List elements recursively
   */
  private validateListsRecursive(
    elements: any[],
    basePath: string,
    errors: ValidationError[]
  ): void {
    elements.forEach((element, index) => {
      const path = `${basePath}[${index}]`;

      if (element.modelType === "SubmodelElementList") {
        // Validate valueTypeListElement if typeValueListElement is Property or Range
        if (element.typeValueListElement === "Property" || element.typeValueListElement === "Range") {
          if (!element.valueTypeListElement) {
            errors.push({
              path: `${path}.valueTypeListElement`,
              message: `List with typeValueListElement "${element.typeValueListElement}" must have valueTypeListElement`,
              severity: "error",
              code: "LIST_MISSING_VALUE_TYPE",
            });
          }
        }

        // Warn if list is empty
        if (!element.value || element.value.length === 0) {
          errors.push({
            path: `${path}.value`,
            message: `List "${element.idShort}" is empty`,
            severity: "info",
            code: "LIST_EMPTY",
            suggestion: "Consider adding elements or removing empty list",
          });
        }

        // Validate all elements have consistent valueType if specified
        if (element.value && element.valueTypeListElement) {
          element.value.forEach((listElement: any, listIndex: number) => {
            if (listElement.valueType && listElement.valueType !== element.valueTypeListElement) {
              errors.push({
                path: `${path}.value[${listIndex}].valueType`,
                message: `List element valueType ${listElement.valueType} does not match list valueTypeListElement ${element.valueTypeListElement}`,
                severity: "error",
                code: "LIST_VALUE_TYPE_MISMATCH",
              });
            }
          });
        }

        // Recurse into nested lists
        if (element.value) {
          this.validateListsRecursive(element.value, `${path}.value`, errors);
        }
      }

      // Recurse into collections
      if (element.modelType === "SubmodelElementCollection" && element.value) {
        this.validateListsRecursive(element.value, `${path}.value`, errors);
      }
    });
  }

  /**
   * Helper: Validate Operation elements recursively
   */
  private validateOperationsRecursive(
    elements: any[],
    basePath: string,
    errors: ValidationError[]
  ): void {
    elements.forEach((element, index) => {
      const path = `${basePath}[${index}]`;

      if (element.modelType === "Operation") {
        // Validate at least one variable type is present
        if (
          (!element.inputVariables || element.inputVariables.length === 0) &&
          (!element.outputVariables || element.outputVariables.length === 0) &&
          (!element.inoutputVariables || element.inoutputVariables.length === 0)
        ) {
          errors.push({
            path: `${path}`,
            message: `Operation "${element.idShort}" has no variables`,
            severity: "warning",
            code: "OPERATION_NO_VARIABLES",
            suggestion: "Add at least one input, output, or inoutput variable",
          });
        }

        // Validate input variables
        if (element.inputVariables) {
          element.inputVariables.forEach((variable: any, varIndex: number) => {
            if (!variable.value) {
              errors.push({
                path: `${path}.inputVariables[${varIndex}].value`,
                message: "Operation variable must have a value (SubmodelElement)",
                severity: "error",
                code: "OPERATION_VARIABLE_NO_VALUE",
              });
            }
          });
        }

        // Validate output variables
        if (element.outputVariables) {
          element.outputVariables.forEach((variable: any, varIndex: number) => {
            if (!variable.value) {
              errors.push({
                path: `${path}.outputVariables[${varIndex}].value`,
                message: "Operation variable must have a value (SubmodelElement)",
                severity: "error",
                code: "OPERATION_VARIABLE_NO_VALUE",
              });
            }
          });
        }

        // Validate inoutput variables
        if (element.inoutputVariables) {
          element.inoutputVariables.forEach((variable: any, varIndex: number) => {
            if (!variable.value) {
              errors.push({
                path: `${path}.inoutputVariables[${varIndex}].value`,
                message: "Operation variable must have a value (SubmodelElement)",
                severity: "error",
                code: "OPERATION_VARIABLE_NO_VALUE",
              });
            }
          });
        }
      }

      // Recurse into collections and lists
      if (element.modelType === "SubmodelElementCollection" && element.value) {
        this.validateOperationsRecursive(element.value, `${path}.value`, errors);
      }

      if (element.modelType === "SubmodelElementList" && element.value) {
        this.validateOperationsRecursive(element.value, `${path}.value`, errors);
      }
    });
  }

  /**
   * Helper: Validate Entity elements recursively
   */
  private validateEntitiesRecursive(
    elements: any[],
    basePath: string,
    errors: ValidationError[]
  ): void {
    elements.forEach((element, index) => {
      const path = `${basePath}[${index}]`;

      if (element.modelType === "Entity") {
        // Validate entityType is present
        if (!element.entityType) {
          errors.push({
            path: `${path}.entityType`,
            message: "Entity must have an entityType",
            severity: "error",
            code: "ENTITY_MISSING_TYPE",
          });
        }

        // Validate entityType is valid
        if (element.entityType) {
          const validTypes = ["CoManagedEntity", "SelfManagedEntity"];
          if (!validTypes.includes(element.entityType)) {
            errors.push({
              path: `${path}.entityType`,
              message: `Invalid entityType: ${element.entityType}`,
              severity: "error",
              code: "ENTITY_INVALID_TYPE",
              suggestion: `Valid types: ${validTypes.join(", ")}`,
            });
          }
        }

        // SelfManagedEntity should have globalAssetId
        if (element.entityType === "SelfManagedEntity" && !element.globalAssetId) {
          errors.push({
            path: `${path}.globalAssetId`,
            message: "SelfManagedEntity should have a globalAssetId",
            severity: "warning",
            code: "ENTITY_SELF_MANAGED_NO_GLOBAL_ID",
            suggestion: "Add globalAssetId for SelfManagedEntity",
          });
        }
      }

      // Recurse into collections and lists
      if (element.modelType === "SubmodelElementCollection" && element.value) {
        this.validateEntitiesRecursive(element.value, `${path}.value`, errors);
      }

      if (element.modelType === "SubmodelElementList" && element.value) {
        this.validateEntitiesRecursive(element.value, `${path}.value`, errors);
      }
    });
  }

  /**
   * Helper: Validate range order (min <= max)
   */
  private validateRangeOrder(min: string, max: string, valueType: string): boolean {
    try {
      // For numeric types, compare numerically
      if (
        valueType.includes("int") ||
        valueType.includes("Int") ||
        valueType.includes("long") ||
        valueType.includes("Long") ||
        valueType.includes("short") ||
        valueType.includes("Short") ||
        valueType.includes("byte") ||
        valueType.includes("Byte")
      ) {
        return parseInt(min, 10) <= parseInt(max, 10);
      }

      if (
        valueType.includes("float") ||
        valueType.includes("Float") ||
        valueType.includes("double") ||
        valueType.includes("Double") ||
        valueType.includes("decimal") ||
        valueType.includes("Decimal")
      ) {
        return parseFloat(min) <= parseFloat(max);
      }

      // For string types, compare lexicographically
      return min <= max;
    } catch {
      // If comparison fails, assume valid
      return true;
    }
  }

  /**
   * Helper: Validate language code format
   */
  private isValidLanguageCode(code: string): boolean {
    // ISO 639-1 (2-letter) or BCP 47 format
    const iso639_1 = /^[a-z]{2}$/i;
    const bcp47 = /^[a-z]{2,3}(-[A-Z]{2})?(-[a-z]{4})?(-[A-Z]{2})?$/i;

    return iso639_1.test(code) || bcp47.test(code);
  }

  /**
   * Helper: Validate IEC 61360 data specification content
   */
  private validateIEC61360DataSpec(
    content: any,
    basePath: string,
    errors: ValidationError[]
  ): void {
    if (!content) {
      return;
    }

    // Required fields for IEC 61360
    if (!content.preferredName || (content.preferredName as any[]).length === 0) {
      errors.push({
        path: `${basePath}.preferredName`,
        message: "IEC 61360: preferredName is required",
        severity: "error",
        code: "IEC61360_MISSING_PREFERRED_NAME",
      });
    }

    // Validate preferredName structure
    if (content.preferredName && Array.isArray(content.preferredName)) {
      (content.preferredName as any[]).forEach((pn: any, index: number) => {
        if (!pn.language) {
          errors.push({
            path: `${basePath}.preferredName[${index}].language`,
            message: "IEC 61360: preferredName must have language",
            severity: "error",
            code: "IEC61360_PREFERRED_NAME_MISSING_LANGUAGE",
          });
        }
        if (!pn.text) {
          errors.push({
            path: `${basePath}.preferredName[${index}].text`,
            message: "IEC 61360: preferredName must have text",
            severity: "error",
            code: "IEC61360_PREFERRED_NAME_MISSING_TEXT",
          });
        }
      });
    }

    // Validate data type if present
    if (content.dataType) {
      const validDataTypes = [
        "STRING",
        "STRING_TRANSLATABLE",
        "INTEGER_MEASURE",
        "INTEGER_COUNT",
        "INTEGER_CURRENCY",
        "REAL_MEASURE",
        "REAL_COUNT",
        "REAL_CURRENCY",
        "BOOLEAN",
        "DATE",
        "TIME",
        "TIMESTAMP",
        "URL",
        "RATIONAL",
        "RATIONAL_MEASURE",
        "FILE",
        "BLOB",
        "HTML",
      ];

      if (!validDataTypes.includes(content.dataType)) {
        errors.push({
          path: `${basePath}.dataType`,
          message: `IEC 61360: Invalid data type: ${content.dataType}`,
          severity: "warning",
          code: "IEC61360_INVALID_DATA_TYPE",
          suggestion: `Use one of: ${validDataTypes.join(", ")}`,
        });
      }
    }

    // Validate unit if present
    if (content.unit && content.unitId) {
      errors.push({
        path: `${basePath}`,
        message: "IEC 61360: Cannot have both unit and unitId",
        severity: "warning",
        code: "IEC61360_DUPLICATE_UNIT",
        suggestion: "Use either unit or unitId, not both",
      });
    }

    // Validate value format if present
    if (content.valueFormat) {
      // Check if it's a valid regex pattern
      try {
        new RegExp(content.valueFormat);
      } catch (e) {
        errors.push({
          path: `${basePath}.valueFormat`,
          message: `IEC 61360: Invalid value format regex: ${content.valueFormat}`,
          severity: "warning",
          code: "IEC61360_INVALID_VALUE_FORMAT",
        });
      }
    }

    // ============================================================================
    // Task 2.2.2: AAS Validation Rules
    // ============================================================================

    // AAS required fields validation
    this.registerRule({
      id: "aas-required-fields",
      name: "AAS Required Fields",
      description: "Validate that all required AAS fields are present",
      severity: "error",
      category: "schema",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.assetAdministrationShells) {
          env.assetAdministrationShells.forEach((aas, index) => {
            const basePath = `assetAdministrationShells[${index}]`;

            // Required: id (from Identifiable)
            if (!aas.id || aas.id.trim() === "") {
              errors.push({
                path: `${basePath}.id`,
                message: "AAS must have an id",
                severity: "error",
                code: "AAS_MISSING_ID",
                suggestion: "Add a unique identifier for the AAS",
              });
            }

            // Required: assetInformation
            if (!aas.assetInformation) {
              errors.push({
                path: `${basePath}.assetInformation`,
                message: "AAS must have assetInformation",
                severity: "error",
                code: "AAS_MISSING_ASSET_INFORMATION",
                suggestion: "Add assetInformation with at least assetKind",
              });
            }
          });
        }

        return errors;
      },
    });

    // Asset information validation
    this.registerRule({
      id: "aas-asset-information-valid",
      name: "AAS Asset Information Valid",
      description: "Validate asset information structure and content",
      severity: "error",
      category: "schema",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.assetAdministrationShells) {
          env.assetAdministrationShells.forEach((aas, index) => {
            const basePath = `assetAdministrationShells[${index}]`;

            if (aas.assetInformation) {
              const assetInfo = aas.assetInformation;
              const assetPath = `${basePath}.assetInformation`;

              // Required: assetKind
              if (!assetInfo.assetKind) {
                errors.push({
                  path: `${assetPath}.assetKind`,
                  message: "AssetInformation must have assetKind",
                  severity: "error",
                  code: "ASSET_INFO_MISSING_KIND",
                  suggestion: "Set assetKind to 'Type', 'Instance', or 'NotApplicable'",
                });
              } else {
                // Validate assetKind enum value
                const validKinds = ["Type", "Instance", "NotApplicable"];
                if (!validKinds.includes(assetInfo.assetKind)) {
                  errors.push({
                    path: `${assetPath}.assetKind`,
                    message: `Invalid assetKind: ${assetInfo.assetKind}`,
                    severity: "error",
                    code: "ASSET_INFO_INVALID_KIND",
                    suggestion: `Must be one of: ${validKinds.join(", ")}`,
                  });
                }
              }

              // Validate globalAssetId format (if present)
              if (assetInfo.globalAssetId) {
                const id = assetInfo.globalAssetId.trim();
                if (id === "") {
                  errors.push({
                    path: `${assetPath}.globalAssetId`,
                    message: "globalAssetId cannot be empty",
                    severity: "error",
                    code: "ASSET_INFO_EMPTY_GLOBAL_ID",
                    suggestion: "Remove globalAssetId or provide a valid identifier",
                  });
                }
              }

              // Validate specificAssetIds
              if (assetInfo.specificAssetIds) {
                assetInfo.specificAssetIds.forEach((specificId, sidIndex) => {
                  const sidPath = `${assetPath}.specificAssetIds[${sidIndex}]`;

                  // Required: name
                  if (!specificId.name || specificId.name.trim() === "") {
                    errors.push({
                      path: `${sidPath}.name`,
                      message: "SpecificAssetId must have a name",
                      severity: "error",
                      code: "SPECIFIC_ASSET_ID_MISSING_NAME",
                      suggestion: "Add a name for the specific asset identifier",
                    });
                  }

                  // Required: value
                  if (!specificId.value || specificId.value.trim() === "") {
                    errors.push({
                      path: `${sidPath}.value`,
                      message: "SpecificAssetId must have a value",
                      severity: "error",
                      code: "SPECIFIC_ASSET_ID_MISSING_VALUE",
                      suggestion: "Add a value for the specific asset identifier",
                    });
                  }

                  // Validate externalSubjectId reference (if present)
                  if (specificId.externalSubjectId) {
                    this.validateKeyStructure(
                      specificId.externalSubjectId,
                      `${sidPath}.externalSubjectId`,
                      errors
                    );
                  }
                });
              }

              // Validate defaultThumbnail (if present)
              if (assetInfo.defaultThumbnail) {
                const thumbnail = assetInfo.defaultThumbnail;
                const thumbPath = `${assetPath}.defaultThumbnail`;

                // Required: path
                if (!thumbnail.path || thumbnail.path.trim() === "") {
                  errors.push({
                    path: `${thumbPath}.path`,
                    message: "Resource must have a path",
                    severity: "error",
                    code: "RESOURCE_MISSING_PATH",
                    suggestion: "Add a path to the thumbnail resource",
                  });
                }
              }
            }
          });
        }

        return errors;
      },
    });

    // Submodel references validation
    this.registerRule({
      id: "aas-submodel-references-valid",
      name: "AAS Submodel References Valid",
      description: "Validate that AAS submodel references are valid and resolve correctly",
      severity: "error",
      category: "reference",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        // Build submodel ID index
        const submodelIds = new Set<string>();
        if (env.submodels) {
          env.submodels.forEach((sm) => {
            submodelIds.add(sm.id);
          });
        }

        if (env.assetAdministrationShells) {
          env.assetAdministrationShells.forEach((aas, index) => {
            const basePath = `assetAdministrationShells[${index}]`;

            if (aas.submodels) {
              aas.submodels.forEach((ref, refIndex) => {
                const refPath = `${basePath}.submodels[${refIndex}]`;

                // Validate key structure
                this.validateKeyStructure(ref, refPath, errors);

                // Check if reference resolves (only for ModelReference)
                if (ref.type === "ModelReference") {
                  const refId = this.getReferenceId(ref);
                  if (refId && !this.isExternalReference(refId) && !submodelIds.has(refId)) {
                    errors.push({
                      path: refPath,
                      message: `Submodel reference does not resolve: ${refId}`,
                      severity: "error",
                      code: "AAS_SUBMODEL_REF_NOT_FOUND",
                      suggestion: "Ensure the referenced submodel exists in the environment",
                    });
                  }
                }
              });
            }
          });
        }

        return errors;
      },
    });

    // Administration info validation
    this.registerRule({
      id: "aas-administration-info-valid",
      name: "AAS Administration Info Valid",
      description: "Validate administration information structure",
      severity: "warning",
      category: "schema",
      validate: (ctx) => {
        const errors: ValidationError[] = [];
        const env = ctx.environment;

        if (env.assetAdministrationShells) {
          env.assetAdministrationShells.forEach((aas, index) => {
            const basePath = `assetAdministrationShells[${index}]`;

            if (aas.administration) {
              const admin = aas.administration;
              const adminPath = `${basePath}.administration`;

              // Validate version format (if present)
              if (admin.version) {
                const versionRegex = /^\d+(\.\d+)*$/;
                if (!versionRegex.test(admin.version)) {
                  errors.push({
                    path: `${adminPath}.version`,
                    message: `Invalid version format: ${admin.version}`,
                    severity: "warning",
                    code: "ADMIN_INVALID_VERSION",
                    suggestion: "Use semantic versioning format (e.g., 1.0.0)",
                  });
                }
              }

              // Validate revision format (if present)
              if (admin.revision) {
                const revisionRegex = /^\d+$/;
                if (!revisionRegex.test(admin.revision)) {
                  errors.push({
                    path: `${adminPath}.revision`,
                    message: `Invalid revision format: ${admin.revision}`,
                    severity: "warning",
                    code: "ADMIN_INVALID_REVISION",
                    suggestion: "Use numeric revision format (e.g., 1, 2, 3)",
                  });
                }
              }

              // Warn if version without revision
              if (admin.version && !admin.revision) {
                errors.push({
                  path: `${adminPath}`,
                  message: "Version specified without revision",
                  severity: "info",
                  code: "ADMIN_VERSION_WITHOUT_REVISION",
                  suggestion: "Consider adding a revision number",
                });
              }
            }
          });
        }

        return errors;
      },
    });
  }

  /**
   * Register default presets
   */
  private registerDefaultPresets(): void {
    // Strict AAS V3 validation
    this.registerPreset({
      id: "strict",
      name: "Strict AAS V3",
      description: "Full AAS V3 specification compliance",
      rules: [
        "env-has-content",
        "unique-ids",
        "env-structure-complete",
        "env-consistency",
        "aas-required-fields",
        "aas-asset-information-valid",
        "aas-submodel-references-valid",
        "aas-administration-info-valid",
        "submodel-required-fields",
        "submodel-semantic-id-valid",
        "submodel-element-structure-valid",
        "submodel-kind-consistency",
        "submodel-qualifier-validation",
        "submodel-element-idshort-unique",
        "submodel-element-required-fields",
        "property-type-validation",
        "property-validation",
        "range-validation",
        "multilanguage-property-validation",
        "collection-validation",
        "list-validation",
        "operation-validation",
        "entity-validation",
        "cardinality-validation",
        "reference-integrity",
        "circular-reference-detection",
        "key-structure-validation",
        "reference-type-validation",
        "semantic-id-format",
        "concept-description-validation",
        "iec-61360-compliance",
        "data-specification-validation",
        "semantic-id-resolution",
      ],
      strict: true,
    });

    // Relaxed validation
    this.registerPreset({
      id: "relaxed",
      name: "Relaxed",
      description: "Basic validation with warnings",
      rules: [
        "env-has-content",
        "aas-required-fields",
        "aas-asset-information-valid",
        "submodel-required-fields",
        "unique-ids",
        "reference-integrity",
        "aas-submodel-references-valid",
      ],
      strict: false,
    });

    // Structure only
    this.registerPreset({
      id: "structure",
      name: "Structure Only",
      description: "Validate structure and required fields only",
      rules: [
        "env-has-content",
        "aas-required-fields",
        "submodel-required-fields",
      ],
      strict: false,
    });

    // Schema validation only
    this.registerPreset({
      id: "schema",
      name: "Schema Validation",
      description: "Validate schema compliance (types, required fields, cardinality)",
      rules: [
        "aas-required-fields",
        "aas-asset-information-valid",
        "aas-administration-info-valid",
        "submodel-required-fields",
        "submodel-element-required-fields",
        "property-type-validation",
        "cardinality-validation",
      ],
      strict: false,
    });

    // Reference validation only
    this.registerPreset({
      id: "reference",
      name: "Reference Validation",
      description: "Validate reference integrity and structure",
      rules: [
        "reference-integrity",
        "circular-reference-detection",
        "key-structure-validation",
        "reference-type-validation",
      ],
      strict: false,
    });

    // Semantic validation only (NEW for Task 2.1.4)
    this.registerPreset({
      id: "semantic",
      name: "Semantic Validation",
      description: "Validate semantic IDs, concept descriptions, and IEC 61360 compliance",
      rules: [
        "semantic-id-format",
        "concept-description-validation",
        "iec-61360-compliance",
        "data-specification-validation",
        "semantic-id-resolution",
      ],
      strict: false,
    });

    // AAS validation only (NEW for Task 2.2.2)
    this.registerPreset({
      id: "aas",
      name: "AAS Validation",
      description: "Validate Asset Administration Shell specific rules",
      rules: [
        "aas-required-fields",
        "aas-asset-information-valid",
        "aas-submodel-references-valid",
        "aas-administration-info-valid",
      ],
      strict: false,
    });

    // Submodel validation only (NEW for Task 2.2.3)
    this.registerPreset({
      id: "submodel",
      name: "Submodel Validation",
      description: "Validate Submodel specific rules",
      rules: [
        "submodel-required-fields",
        "submodel-semantic-id-valid",
        "submodel-element-structure-valid",
        "submodel-kind-consistency",
        "submodel-qualifier-validation",
        "submodel-element-idshort-unique",
      ],
      strict: false,
    });

    // SubmodelElement validation only (NEW for Task 2.2.4)
    this.registerPreset({
      id: "element",
      name: "SubmodelElement Validation",
      description: "Validate SubmodelElement specific rules",
      rules: [
        "property-validation",
        "range-validation",
        "multilanguage-property-validation",
        "collection-validation",
        "list-validation",
        "operation-validation",
        "entity-validation",
      ],
      strict: false,
    });
  }
}



// ============================================================================
// Singleton Instance
// ============================================================================

export const validationEngine = new ValidationEngine();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Validate environment with default rules
 */
export function validateEnvironmentAdvanced(
  environment: Environment
): ValidationResult {
  return validationEngine.validate(environment);
}

/**
 * Validate with preset
 */
export function validateWithPreset(
  environment: Environment,
  presetId: string
): ValidationResult {
  return validationEngine.validateWithPreset(environment, presetId);
}
