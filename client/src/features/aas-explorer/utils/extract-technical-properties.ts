/**
 * Technical property extraction
 *
 * Walks a parsed AAS Environment and flattens its data-bearing submodel
 * elements (Property, Range, MultiLanguageProperty) into the flat
 * `TechnicalProperty` shape consumed by `TechnicalDataPanel`. Nested
 * SubmodelElementCollection / SubmodelElementList containers are traversed
 * recursively; the enclosing submodel's idShort is used as the group category.
 */

import type {
  Environment,
  SubmodelElement,
  Property,
  Range,
  MultiLanguageProperty,
  SubmodelElementCollection,
  SubmodelElementList,
  LangStringTextType,
  Reference,
} from "../../../../../shared";

export interface TechnicalProperty {
  idShort: string;
  semanticId?: string;
  value: string;
  valueType: string;
  unit?: string;
  description?: string;
  category?: string;
}

function lastSemanticIdValue(reference?: Reference): string | undefined {
  const keys = reference?.keys;
  if (!keys || keys.length === 0) {
    return undefined;
  }
  return keys[keys.length - 1]?.value || undefined;
}

function pickLangText(
  entries: LangStringTextType[] | undefined,
  defaultLang: string
): string | undefined {
  if (!entries || entries.length === 0) {
    return undefined;
  }
  const preferred = entries.find((entry) => entry.language === defaultLang);
  return (preferred ?? entries[0]).text || undefined;
}

function collect(
  elements: SubmodelElement[] | undefined,
  category: string,
  defaultLang: string,
  out: TechnicalProperty[]
): void {
  if (!elements) {
    return;
  }

  for (const element of elements) {
    // Widen the string-enum discriminant so string-literal cases type-check.
    const modelType: string = element.modelType;

    switch (modelType) {
      case "Property": {
        const property = element as Property;
        out.push({
          idShort: property.idShort ?? "",
          semanticId: lastSemanticIdValue(property.semanticId),
          value: property.value ?? "",
          valueType: property.valueType ?? "",
          description: pickLangText(property.description, defaultLang),
          category,
        });
        break;
      }
      case "Range": {
        const range = element as Range;
        out.push({
          idShort: range.idShort ?? "",
          semanticId: lastSemanticIdValue(range.semanticId),
          value: `${range.min ?? ""} … ${range.max ?? ""}`.trim(),
          valueType: range.valueType ?? "",
          description: pickLangText(range.description, defaultLang),
          category,
        });
        break;
      }
      case "MultiLanguageProperty": {
        const mlp = element as MultiLanguageProperty;
        out.push({
          idShort: mlp.idShort ?? "",
          semanticId: lastSemanticIdValue(mlp.semanticId),
          value: pickLangText(mlp.value, defaultLang) ?? "",
          valueType: "langString",
          description: pickLangText(mlp.description, defaultLang),
          category,
        });
        break;
      }
      case "SubmodelElementCollection":
        collect((element as SubmodelElementCollection).value, category, defaultLang, out);
        break;
      case "SubmodelElementList":
        collect((element as SubmodelElementList).value, category, defaultLang, out);
        break;
      default:
        break;
    }
  }
}

/**
 * Flatten every submodel's data-bearing elements into `TechnicalProperty[]`.
 * Grouping metadata (`category`) is set to the containing submodel's idShort so
 * the panel's group-by view separates properties per submodel.
 */
export function extractTechnicalProperties(
  environment: Environment | null | undefined,
  defaultLang: string = "en"
): TechnicalProperty[] {
  const submodels = environment?.submodels;
  if (!submodels) {
    return [];
  }

  const out: TechnicalProperty[] = [];
  for (const submodel of submodels) {
    const category = submodel.idShort || submodel.id || "Submodel";
    collect(submodel.submodelElements, category, defaultLang, out);
  }
  return out;
}
