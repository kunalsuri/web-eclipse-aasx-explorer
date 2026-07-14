/**
 * AAS V3.0 Serialization Utilities
 * Handles JSON serialization and deserialization of AAS elements
 */

import type {
  Environment,
  AssetAdministrationShell,
  Submodel,
  SubmodelElement,
  Reference,
  LangStringNameType,
  LangStringTextType,
} from "./aas-v3-types";
import { ReferenceTypes, KeyTypes } from "./aas-v3-types";

// ============================================================================
// Serialization
// ============================================================================

/**
 * Serialize an AAS Environment to JSON string
 */
export function serializeEnvironment(env: Environment): string {
  return JSON.stringify(env, null, 2);
}

/**
 * Serialize an Asset Administration Shell to JSON string
 */
export function serializeAAS(aas: AssetAdministrationShell): string {
  return JSON.stringify(aas, null, 2);
}

/**
 * Serialize a Submodel to JSON string
 */
export function serializeSubmodel(submodel: Submodel): string {
  return JSON.stringify(submodel, null, 2);
}

/**
 * Serialize a Submodel Element to JSON string
 */
export function serializeSubmodelElement(element: SubmodelElement): string {
  return JSON.stringify(element, null, 2);
}

// ============================================================================
// Deserialization
// ============================================================================

/**
 * Deserialize JSON string to AAS Environment
 */
export function deserializeEnvironment(json: string): Environment {
  try {
    const parsed = JSON.parse(json);
    return validateEnvironment(parsed);
  } catch (error) {
    throw new Error(
      `Failed to deserialize Environment: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Deserialize JSON string to Asset Administration Shell
 */
export function deserializeAAS(json: string): AssetAdministrationShell {
  try {
    const parsed = JSON.parse(json);
    return validateAAS(parsed);
  } catch (error) {
    throw new Error(
      `Failed to deserialize AAS: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Deserialize JSON string to Submodel
 */
export function deserializeSubmodel(json: string): Submodel {
  try {
    const parsed = JSON.parse(json);
    return validateSubmodel(parsed);
  } catch (error) {
    throw new Error(
      `Failed to deserialize Submodel: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate and return Environment
 */
function validateEnvironment(data: unknown): Environment {
  if (!data || typeof data !== "object") {
    throw new Error("Environment must be an object");
  }

  const env = data as Environment;

  // Validate arrays if present
  if (env.assetAdministrationShells) {
    if (!Array.isArray(env.assetAdministrationShells)) {
      throw new Error("assetAdministrationShells must be an array");
    }
    env.assetAdministrationShells.forEach((aas, index) => {
      try {
        validateAAS(aas);
      } catch (error) {
        throw new Error(
          `Invalid AAS at index ${index}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  if (env.submodels) {
    if (!Array.isArray(env.submodels)) {
      throw new Error("submodels must be an array");
    }
    env.submodels.forEach((submodel, index) => {
      try {
        validateSubmodel(submodel);
      } catch (error) {
        throw new Error(
          `Invalid Submodel at index ${index}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  if (env.conceptDescriptions) {
    if (!Array.isArray(env.conceptDescriptions)) {
      throw new Error("conceptDescriptions must be an array");
    }
  }

  return env;
}

/**
 * Validate and return Asset Administration Shell
 */
function validateAAS(data: unknown): AssetAdministrationShell {
  if (!data || typeof data !== "object") {
    throw new Error("AAS must be an object");
  }

  const aas = data as AssetAdministrationShell;

  // Required fields
  if (!aas.id || typeof aas.id !== "string") {
    throw new Error("AAS must have a valid id");
  }

  if (!aas.assetInformation || typeof aas.assetInformation !== "object") {
    throw new Error("AAS must have assetInformation");
  }

  if (!aas.assetInformation.assetKind) {
    throw new Error("assetInformation must have assetKind");
  }

  return aas;
}

/**
 * Validate and return Submodel
 */
function validateSubmodel(data: unknown): Submodel {
  if (!data || typeof data !== "object") {
    throw new Error("Submodel must be an object");
  }

  const submodel = data as Submodel;

  // Required fields
  if (!submodel.id || typeof submodel.id !== "string") {
    throw new Error("Submodel must have a valid id");
  }

  return submodel;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a Reference from a string ID
 */
export function createReference(
  id: string,
  type: ReferenceTypes = ReferenceTypes.ModelReference,
  keyType: KeyTypes = KeyTypes.Submodel
): Reference {
  return {
    type,
    keys: [
      {
        type: keyType,
        value: id,
      },
    ],
  };
}

/**
 * Get the ID from a Reference
 */
export function getReferenceId(ref: Reference): string | null {
  if (!ref.keys || ref.keys.length === 0) {
    return null;
  }
  return ref.keys[ref.keys.length - 1].value;
}

/**
 * Create a LangString for name
 */
export function createLangStringName(
  text: string,
  language: string = "en"
): LangStringNameType {
  return { language, text };
}

/**
 * Create a LangString for text
 */
export function createLangStringText(
  text: string,
  language: string = "en"
): LangStringTextType {
  return { language, text };
}

/**
 * Get text from LangString array (prefer English, fallback to first)
 */
export function getLangStringText(
  langStrings: LangStringTextType[] | LangStringNameType[] | undefined,
  preferredLanguage: string = "en"
): string | null {
  if (!langStrings || langStrings.length === 0) {
    return null;
  }

  // Try to find preferred language
  const preferred = langStrings.find((ls) => ls.language === preferredLanguage);
  if (preferred) {
    return preferred.text;
  }

  // Fallback to first available
  return langStrings[0].text;
}

/**
 * Deep clone an AAS element
 */
export function cloneEnvironment(env: Environment): Environment {
  return JSON.parse(JSON.stringify(env));
}

/**
 * Deep clone an AAS
 */
export function cloneAAS(aas: AssetAdministrationShell): AssetAdministrationShell {
  return JSON.parse(JSON.stringify(aas));
}

/**
 * Deep clone a Submodel
 */
export function cloneSubmodel(submodel: Submodel): Submodel {
  return JSON.parse(JSON.stringify(submodel));
}

/**
 * Deep clone a Submodel Element
 */
export function cloneSubmodelElement(element: SubmodelElement): SubmodelElement {
  return JSON.parse(JSON.stringify(element));
}

// ============================================================================
// Comparison
// ============================================================================

/**
 * Compare two References for equality
 */
export function referencesEqual(ref1: Reference, ref2: Reference): boolean {
  if (ref1.type !== ref2.type) {
    return false;
  }

  if (ref1.keys.length !== ref2.keys.length) {
    return false;
  }

  return ref1.keys.every((key1, index) => {
    const key2 = ref2.keys[index];
    return key1.type === key2.type && key1.value === key2.value;
  });
}

/**
 * Check if a Reference points to a specific ID
 */
export function referencePointsTo(ref: Reference, id: string): boolean {
  const refId = getReferenceId(ref);
  return refId === id;
}

// ============================================================================
// Search and Query
// ============================================================================

/**
 * Find an AAS by ID in an Environment
 */
export function findAASById(
  env: Environment,
  id: string
): AssetAdministrationShell | null {
  if (!env.assetAdministrationShells) {
    return null;
  }
  return env.assetAdministrationShells.find((aas) => aas.id === id) || null;
}

/**
 * Find a Submodel by ID in an Environment
 */
export function findSubmodelById(env: Environment, id: string): Submodel | null {
  if (!env.submodels) {
    return null;
  }
  return env.submodels.find((sm) => sm.id === id) || null;
}

/**
 * Find a Submodel by Reference in an Environment
 */
export function findSubmodelByReference(
  env: Environment,
  ref: Reference
): Submodel | null {
  const id = getReferenceId(ref);
  if (!id) {
    return null;
  }
  return findSubmodelById(env, id);
}

/**
 * Find a Submodel Element by idShort in a Submodel
 */
export function findSubmodelElementByIdShort(
  submodel: Submodel,
  idShort: string
): SubmodelElement | null {
  if (!submodel.submodelElements) {
    return null;
  }

  for (const element of submodel.submodelElements) {
    if (element.idShort === idShort) {
      return element;
    }

    // Search recursively in collections
    if (
      element.modelType === "SubmodelElementCollection" &&
      "value" in element &&
      Array.isArray(element.value)
    ) {
      const found = findInElements(element.value, idShort);
      if (found) {
        return found;
      }
    }

    // Search recursively in lists
    if (
      element.modelType === "SubmodelElementList" &&
      "value" in element &&
      Array.isArray(element.value)
    ) {
      const found = findInElements(element.value, idShort);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

/**
 * Helper function to search in element arrays
 */
function findInElements(
  elements: SubmodelElement[],
  idShort: string
): SubmodelElement | null {
  for (const element of elements) {
    if (element.idShort === idShort) {
      return element;
    }

    // Recursive search
    if (
      (element.modelType === "SubmodelElementCollection" ||
        element.modelType === "SubmodelElementList") &&
      "value" in element &&
      Array.isArray(element.value)
    ) {
      const found = findInElements(element.value, idShort);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

/**
 * Get all Submodel Elements from a Submodel (flat list)
 */
export function getAllSubmodelElements(submodel: Submodel): SubmodelElement[] {
  const result: SubmodelElement[] = [];

  function collectElements(elements: SubmodelElement[] | undefined) {
    if (!elements) {
      return;
    }

    for (const element of elements) {
      result.push(element);

      // Collect from collections
      if (
        (element.modelType === "SubmodelElementCollection" ||
          element.modelType === "SubmodelElementList") &&
        "value" in element &&
        Array.isArray(element.value)
      ) {
        collectElements(element.value);
      }
    }
  }

  collectElements(submodel.submodelElements);
  return result;
}

/**
 * Count total elements in a Submodel
 */
export function countSubmodelElements(submodel: Submodel): number {
  return getAllSubmodelElements(submodel).length;
}
