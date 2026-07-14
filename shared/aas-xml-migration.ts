/**
 * AAS XML migration
 *
 * Converts AAS V1.0, V2.0, and V3.0 XML environments into the V3 TypeScript
 * model used by the web application. The legacy mappings intentionally follow
 * the C# package explorer's conversion behavior, which is guarded by the
 * committed golden-master environments.
 */

import { XMLParser } from "fast-xml-parser";
import type { Environment } from "./aas-v3-types";

type AasXmlVersion = "1.0" | "2.0" | "3.0";
type XmlNode = Record<string, any>;
type ReferenceMode = "semantic" | "model" | "external" | "caseOf" | "auto";
interface MigratedKey {
    type: string;
    value: string;
    local: string | undefined;
}

const ELEMENT_TYPES: Record<string, string> = {
    annotatedRelationshipElement: "AnnotatedRelationshipElement",
    basicEvent: "BasicEventElement",
    basicEventElement: "BasicEventElement",
    blob: "Blob",
    capability: "Capability",
    entity: "Entity",
    file: "File",
    multiLanguageProperty: "MultiLanguageProperty",
    operation: "Operation",
    property: "Property",
    range: "Range",
    referenceElement: "ReferenceElement",
    relationshipElement: "RelationshipElement",
    submodelElementCollection: "SubmodelElementCollection",
    submodelElementList: "SubmodelElementList",
};

const DATA_TYPE_NAMES: Record<string, string> = {
    anyuri: "anyURI",
    base64binary: "base64Binary",
    boolean: "boolean",
    byte: "byte",
    date: "date",
    datetime: "dateTime",
    decimal: "decimal",
    double: "double",
    duration: "duration",
    float: "float",
    gday: "gDay",
    gmonth: "gMonth",
    gmonthday: "gMonthDay",
    gyear: "gYear",
    gyearmonth: "gYearMonth",
    hexbinary: "hexBinary",
    int: "int",
    integer: "integer",
    langstring: "string",
    long: "long",
    negativeinteger: "negativeInteger",
    nonnegativeinteger: "nonNegativeInteger",
    nonpositiveinteger: "nonPositiveInteger",
    positiveinteger: "positiveInteger",
    short: "short",
    string: "string",
    time: "time",
    unsignedbyte: "unsignedByte",
    unsignedint: "unsignedInt",
    unsignedlong: "unsignedLong",
    unsignedshort: "unsignedShort",
};

/** Parse and migrate an AAS XML document into the application's V3 model. */
export function parseAasXmlEnvironment(content: string): Environment {
    const version = detectVersion(content);
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        textNodeName: "#text",
        parseAttributeValue: false,
        parseTagValue: false,
        removeNSPrefix: true,
        // Legacy C# deserialization preserves significant leading/trailing text.
        // The golden masters contain those values verbatim.
        trimValues: false,
    });

    const parsed = parser.parse(content);
    const root = parsed.aasenv || parsed.aasEnvironment || parsed.environment || parsed;

    return convertEnvironment(root, version);
}

function detectVersion(content: string): AasXmlVersion {
    const match = content.match(/admin-shell\.io\/aas\/(1|2|3)\/0/i);
    if (match?.[1] === "1") return "1.0";
    if (match?.[1] === "2") return "2.0";
    return "3.0";
}

function convertEnvironment(root: XmlNode, version: AasXmlVersion): Environment {
    const assets = children(root.assets, "asset");
    const assetsById = new Map<string, XmlNode>();
    for (const asset of assets) {
        const id = text(asset.identification) ?? text(asset.id);
        if (id !== undefined) assetsById.set(id, asset);
    }

    return {
        assetAdministrationShells: children(
            root.assetAdministrationShells,
            "assetAdministrationShell"
        ).map((shell) => convertShell(shell, assetsById, version)),
        submodels: children(root.submodels, "submodel").map((submodel) =>
            convertSubmodel(submodel, version)
        ),
        conceptDescriptions: children(
            root.conceptDescriptions,
            "conceptDescription"
        ).map((conceptDescription) =>
            convertConceptDescription(conceptDescription, version)
        ),
    };
}

function convertShell(
    shell: XmlNode,
    assetsById: Map<string, XmlNode>,
    version: AasXmlVersion
): any {
    const output: XmlNode = {};

    if (version !== "1.0") {
        copyText(output, "idShort", shell.idShort, true);
        const administration = convertAdministration(shell.administration);
        if (administration) output.administration = administration;
        const description = convertLangStrings(shell.description);
        if (description.length > 0) output.description = description;
    }

    copyText(output, "id", shell.id ?? shell.identification, true);

    const directAssetInformation = shell.assetInformation;
    if (isObject(directAssetInformation)) {
        output.assetInformation = {
            assetKind: text(directAssetInformation.assetKind) || "Instance",
            ...(text(directAssetInformation.globalAssetId) !== undefined
                ? { globalAssetId: text(directAssetInformation.globalAssetId) }
                : {}),
        };
    } else {
        const assetReference = convertReference(shell.assetRef, version, "model");
        const assetId = assetReference?.keys?.[0]?.value;
        const asset = assetId ? assetsById.get(assetId) : undefined;
        output.assetInformation = {
            assetKind: text(asset?.kind) || "Instance",
            ...(assetId !== undefined ? { globalAssetId: assetId } : {}),
        };
    }

    if (version !== "1.0") {
        const references = children(
            shell.submodels ?? shell.submodelRefs,
            shell.submodels ? "reference" : "submodelRef"
        )
            .map((reference) => convertReference(reference, version, "model"))
            .filter(hasReference);
        if (references.length > 0) output.submodels = references;
    }

    output.modelType = "AssetAdministrationShell";
    return output;
}

function convertSubmodel(submodel: XmlNode, version: AasXmlVersion): any {
    const output: XmlNode = {};

    copyText(output, "idShort", submodel.idShort, true);
    const administration = convertAdministration(submodel.administration);
    if (administration) output.administration = administration;
    const description = convertLangStrings(submodel.description);
    if (description.length > 0) output.description = description;
    copyText(output, "id", submodel.id ?? submodel.identification, true);
    copyText(output, "kind", submodel.kind, false);

    const semanticId = convertReference(submodel.semanticId, version, "semantic");
    if (hasReference(semanticId)) output.semanticId = semanticId;

    const qualifiers = convertQualifiers(submodel, version);
    if (qualifiers.length > 0) output.qualifiers = qualifiers;

    const elements = convertElementContainer(submodel.submodelElements, version);
    if (elements.length > 0) output.submodelElements = elements;

    output.modelType = "Submodel";
    return output;
}

function convertConceptDescription(
    conceptDescription: XmlNode,
    version: AasXmlVersion
): any {
    const output: XmlNode = {};

    if (hasOwn(conceptDescription, "idShort")) {
        copyText(output, "idShort", conceptDescription.idShort, true);
    } else {
        output.idShort = "";
    }

    const administration = convertAdministration(conceptDescription.administration);
    if (administration) output.administration = administration;
    const description = convertLangStrings(conceptDescription.description);
    if (description.length > 0) output.description = description;
    copyText(
        output,
        "id",
        conceptDescription.id ?? conceptDescription.identification,
        true
    );
    if (version === "1.0" && !hasOwn(output, "id")) output.id = "";

    if (version !== "1.0") {
        const embedded = children(
            conceptDescription.embeddedDataSpecifications ?? conceptDescription,
            "embeddedDataSpecification"
        )
            .map((value) => convertEmbeddedDataSpecification(value, version))
            .filter((value): value is XmlNode => value !== undefined);
        if (embedded.length > 0) output.embeddedDataSpecifications = embedded;
    }

    const isCaseOf = asArray(
        conceptDescription.isCaseOf?.reference ?? conceptDescription.isCaseOf
    )
        .map((reference) => convertReference(reference, version, "caseOf"))
        .filter(hasReference);
    if (isCaseOf.length > 0) output.isCaseOf = isCaseOf;

    output.modelType = "ConceptDescription";
    return output;
}

function convertEmbeddedDataSpecification(
    embedded: XmlNode,
    version: AasXmlVersion
): XmlNode | undefined {
    if (!isObject(embedded)) return undefined;

    const dataSpecification = convertReference(
        embedded.dataSpecification ?? embedded.hasDataSpecification,
        version,
        "external"
    );
    if (hasReference(dataSpecification)) {
        for (const key of dataSpecification.keys) {
            if (key.value.includes("DataSpecificationTemplates/DataSpecificationIEC61360")) {
                key.type = "GlobalReference";
                key.value =
                    "https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIec61360/3/0";
            }
        }
    }

    const contentContainer = embedded.dataSpecificationContent;
    const source =
        contentContainer?.dataSpecificationIEC61360 ??
        contentContainer?.dataSpecificationIec61360 ??
        contentContainer;
    if (!isObject(source)) return undefined;

    const content: XmlNode = {};
    addLangStrings(
        content,
        "preferredName",
        source.preferredName,
        "en",
        hasOwn(source, "preferredName")
    );
    addLangStrings(
        content,
        "shortName",
        source.shortName,
        "en",
        hasOwn(source, "shortName")
    );
    copyNonEmptyText(content, "unit", source.unit);
    const unitId = convertReference(source.unitId, version, "external");
    if (hasReference(unitId)) content.unitId = unitId;
    if (hasOwn(source, "sourceOfDefinition")) {
        copyText(content, "sourceOfDefinition", source.sourceOfDefinition, true);
    }
    copyNonEmptyText(content, "symbol", source.symbol);
    addLangStrings(
        content,
        "definition",
        source.definition,
        "en",
        hasOwn(source, "definition")
    );
    content.value = text(source.valueFormat) ?? "";
    content.modelType = "DataSpecificationIec61360";

    return {
        ...(hasReference(dataSpecification) ? { dataSpecification } : {}),
        dataSpecificationContent: content,
    };
}

function convertElementContainer(container: any, version: AasXmlVersion): any[] {
    if (!container || container === "") return [];

    const wrappers = isObject(container) && hasOwn(container, "submodelElement")
        ? asArray(container.submodelElement)
        : asArray(container);

    const result: any[] = [];
    for (const wrapper of wrappers) {
        const converted = convertElementWrapper(wrapper, version);
        if (converted) result.push(converted);
    }
    return result;
}

function convertElementWrapper(wrapper: any, version: AasXmlVersion): any | undefined {
    if (!isObject(wrapper)) return undefined;

    for (const [tagName, modelType] of Object.entries(ELEMENT_TYPES)) {
        if (hasOwn(wrapper, tagName)) {
            return convertElement(wrapper[tagName], modelType, version);
        }
    }

    const explicitType = text(wrapper.modelType);
    if (explicitType && Object.values(ELEMENT_TYPES).includes(explicitType)) {
        return convertElement(wrapper, explicitType, version);
    }

    return undefined;
}

function convertElement(node: XmlNode, modelType: string, version: AasXmlVersion): any {
    const output = convertReferable(node, version);

    switch (modelType) {
        case "Property": {
            output.valueType = normalizeDataType(text(node.valueType));
            if (hasOwn(node, "value")) output.value = text(node.value) ?? "";
            const valueId = convertReference(node.valueId, version, "external");
            if (hasReference(valueId)) output.valueId = valueId;
            break;
        }
        case "MultiLanguageProperty": {
            const value = convertLangStrings(node.value);
            if (value.length > 0) output.value = value;
            const valueId = convertReference(node.valueId, version, "external");
            if (hasReference(valueId)) output.valueId = valueId;
            break;
        }
        case "Range":
            output.valueType = normalizeDataType(text(node.valueType));
            if (hasOwn(node, "min")) output.min = text(node.min) ?? "";
            if (hasOwn(node, "max")) output.max = text(node.max) ?? "";
            break;
        case "ReferenceElement": {
            const value = convertReference(node.value, version, "auto");
            if (hasReference(value)) output.value = value;
            break;
        }
        case "Blob":
            if (hasOwn(node, "value")) output.value = text(node.value) ?? "";
            output.contentType = text(node.contentType ?? node.mimeType) ?? "";
            break;
        case "File":
            if (hasOwn(node, "value")) output.value = text(node.value) ?? "";
            output.contentType = text(node.contentType ?? node.mimeType) ?? "";
            break;
        case "SubmodelElementCollection": {
            const value = convertElementContainer(node.value, version);
            if (value.length > 0) output.value = value;
            break;
        }
        case "SubmodelElementList": {
            copyText(output, "orderRelevant", node.orderRelevant, false);
            const semanticIdListElement = convertReference(
                node.semanticIdListElement,
                version,
                "semantic"
            );
            if (hasReference(semanticIdListElement)) {
                output.semanticIdListElement = semanticIdListElement;
            }
            copyText(output, "typeValueListElement", node.typeValueListElement, false);
            if (hasOwn(node, "valueTypeListElement")) {
                output.valueTypeListElement = normalizeDataType(
                    text(node.valueTypeListElement)
                );
            }
            const value = convertElementContainer(node.value, version);
            if (value.length > 0) output.value = value;
            break;
        }
        case "RelationshipElement":
        case "AnnotatedRelationshipElement": {
            const first = convertReference(node.first, version, "model");
            const second = convertReference(node.second, version, "model");
            if (hasReference(first)) output.first = first;
            if (hasReference(second)) output.second = second;
            if (modelType === "AnnotatedRelationshipElement") {
                const annotations = convertElementContainer(
                    node.annotations ?? node.annotation,
                    version
                );
                if (annotations.length > 0) output.annotations = annotations;
            }
            break;
        }
        case "Entity": {
            const statements = convertElementContainer(node.statements, version);
            if (statements.length > 0) output.statements = statements;
            output.entityType = text(node.entityType) || "CoManagedEntity";
            const globalAssetId = firstReferenceValue(node.assetRef ?? node.globalAssetId);
            if (globalAssetId !== undefined) output.globalAssetId = globalAssetId;
            break;
        }
        case "Operation":
            addOperationVariables(output, "inputVariables", node.inputVariables, version);
            addOperationVariables(output, "outputVariables", node.outputVariables, version);
            addOperationVariables(output, "inoutputVariables", node.inoutputVariables, version);
            break;
        case "BasicEventElement": {
            const observed = convertReference(node.observed, version, "model");
            if (hasReference(observed)) output.observed = observed;
            output.direction = text(node.direction) || "input";
            output.state = text(node.state) || "off";
            copyNonEmptyText(output, "messageTopic", node.messageTopic);
            const broker = convertReference(node.messageBroker, version, "external");
            if (hasReference(broker)) output.messageBroker = broker;
            copyNonEmptyText(output, "lastUpdate", node.lastUpdate);
            copyNonEmptyText(output, "minInterval", node.minInterval);
            copyNonEmptyText(output, "maxInterval", node.maxInterval);
            break;
        }
    }

    output.modelType = modelType;
    return output;
}

function convertReferable(node: XmlNode, version: AasXmlVersion): XmlNode {
    const output: XmlNode = {};
    copyNonEmptyText(output, "category", node.category);
    copyText(output, "idShort", node.idShort, true);

    const description = convertLangStrings(node.description);
    if (description.length > 0) output.description = description;

    const extensions = convertExtensions(node.extensions, version);

    const semanticId = convertReference(node.semanticId, version, "semantic");
    if (hasReference(semanticId)) output.semanticId = semanticId;

    const qualifiers = convertQualifiers(node, version);
    const migratedExtensions =
        version === "2.0"
            ? qualifiers
                  .filter((qualifier) => qualifier.type.endsWith(".Args"))
                  .map(({ type, ...qualifier }) => ({ name: type, ...qualifier }))
            : [];
    if (extensions.length > 0 || migratedExtensions.length > 0) {
        output.extensions = [...extensions, ...migratedExtensions];
    }

    const remainingQualifiers = qualifiers.filter(
        (qualifier) =>
            version !== "2.0" || !qualifier.type.endsWith(".Args")
    );
    if (remainingQualifiers.length > 0) {
        output.qualifiers = remainingQualifiers;
    } else if (migratedExtensions.length > 0) {
        // The C# V2 converter moves these legacy qualifier payloads to
        // extensions but preserves the now-empty qualifier collection.
        output.qualifiers = [];
    }

    return output;
}

function convertAdministration(value: any): XmlNode | undefined {
    if (!isObject(value)) return undefined;
    const output: XmlNode = {};
    if (hasOwn(value, "version")) output.version = text(value.version) ?? "";
    if (hasOwn(value, "revision")) output.revision = text(value.revision) ?? "";
    return Object.keys(output).length > 0 ? output : undefined;
}

function convertQualifiers(node: XmlNode, version: AasXmlVersion): XmlNode[] {
    const values =
        node.qualifiers?.qualifier ?? node.qualifier?.qualifier ?? node.qualifier;
    return asArray(values)
        .filter(isObject)
        .map((qualifier) => {
            const output: XmlNode = {
                type: text(qualifier.type) ?? text(qualifier["@_type"]) ?? "",
                valueType: normalizeDataType(text(qualifier.valueType)),
            };
            if (hasOwn(qualifier, "value") && text(qualifier.value) !== "") {
                output.value = text(qualifier.value) ?? "";
            }
            const valueId = convertReference(qualifier.valueId, version, "auto");
            if (hasReference(valueId)) output.valueId = valueId;
            const semanticId = convertReference(qualifier.semanticId, version, "semantic");
            if (hasReference(semanticId)) output.semanticId = semanticId;
            return output;
        })
        .filter((qualifier) => qualifier.type !== "");
}

function convertExtensions(value: any, version: AasXmlVersion): XmlNode[] {
    const extensions = value?.extension ?? value;
    return asArray(extensions)
        .filter(isObject)
        .map((extension) => {
            const output: XmlNode = {};
            copyText(output, "name", extension.name, true);
            if (hasOwn(extension, "valueType")) {
                output.valueType = normalizeDataType(text(extension.valueType));
            }
            copyText(output, "value", extension.value, true);
            const refersTo = asArray(extension.refersTo?.reference ?? extension.refersTo)
                .map((reference) => convertReference(reference, version, "model"))
                .filter(hasReference);
            if (refersTo.length > 0) output.refersTo = refersTo;
            const semanticId = convertReference(extension.semanticId, version, "semantic");
            if (hasReference(semanticId)) output.semanticId = semanticId;
            return output;
        })
        .filter((extension) => Object.keys(extension).length > 0);
}

function convertReference(
    value: any,
    version: AasXmlVersion,
    mode: ReferenceMode
): any | undefined {
    if (!value || value === "") return undefined;

    let reference = value;
    if (isObject(reference.reference)) reference = reference.reference;
    if (isObject(reference.modelReference)) reference = reference.modelReference;
    if (isObject(reference.externalReference)) reference = reference.externalReference;

    const keyValues = reference.keys?.key ?? reference.keys ?? reference.key;
    const sourceKeys = asArray(keyValues).filter(
        (key) => isObject(key) || typeof key === "string"
    );
    const keys = sourceKeys
        .map((key) => {
            const source = isObject(key) ? key : { "#text": key };
            const valueText = text(source.value ?? source);
            const allowsEmptyValue =
                version === "1.0" || mode === "semantic";
            if (
                (valueText === undefined || valueText === "") &&
                !allowsEmptyValue
            ) {
                return undefined;
            }
            const rawType = text(source.type ?? source["@_type"]) || "GlobalReference";
            return {
                type: normalizeKeyType(rawType, version, mode),
                value: valueText ?? "",
                local: text(source["@_local"]),
            };
        })
        .filter((key): key is MigratedKey => key !== undefined);

    if (keys.length === 0) return undefined;

    const explicitType = text(reference.type);
    let type: string;
    if (explicitType === "ModelReference" || explicitType === "ExternalReference") {
        type = explicitType;
    } else if (mode === "semantic" || mode === "external") {
        type = "ExternalReference";
    } else if (mode === "model" || mode === "caseOf") {
        type = "ModelReference";
    } else {
        type = keys.some((key) => key.local?.toLowerCase() === "true")
            ? "ModelReference"
            : "ExternalReference";
    }

    return {
        type,
        keys: keys.map(({ type: keyType, value: keyValue }) => ({
            type: keyType,
            value: keyValue,
        })),
    };
}

function normalizeKeyType(
    rawType: string,
    version: AasXmlVersion,
    mode: ReferenceMode
): string {
    if (rawType === "AssetAdministrationShell" || rawType === "AAS") {
        return "AssetAdministrationShell";
    }
    if (rawType === "Asset") return "GlobalReference";
    if (
        version === "2.0" &&
        mode === "semantic" &&
        rawType === "ConceptDescription"
    ) {
        return "GlobalReference";
    }
    return rawType;
}

function convertLangStrings(
    value: any,
    defaultLanguage?: string,
    includeEmpty: boolean = false
): XmlNode[] {
    if (value === null || value === undefined) return [];

    if (typeof value === "string") {
        if (value === "" && !includeEmpty) return [];
        return [{ language: defaultLanguage ?? "", text: value }];
    }

    let values: any[] = [];
    if (isObject(value)) {
        if (hasOwn(value, "langString")) {
            values = asArray(value.langString);
        } else {
            const languageKey = Object.keys(value).find((key) =>
                key.toLowerCase().startsWith("langstring")
            );
            if (languageKey) values = asArray(value[languageKey]);
        }
    }

    return values
        .filter((entry) => isObject(entry) || typeof entry === "string")
        .map((entry) => {
            const source = isObject(entry) ? entry : { "#text": entry };
            const language =
                text(source.language ?? source["@_lang"] ?? source["@_language"]) ??
                defaultLanguage ??
                "";
            return {
                language: language.replace(/\?+$/, ""),
                text: text(source.text ?? source) ?? "",
            };
        })
        .filter(
            (entry) => includeEmpty || entry.language !== "" || entry.text !== ""
        );
}

function addLangStrings(
    target: XmlNode,
    field: string,
    value: any,
    defaultLanguage?: string,
    includeEmpty: boolean = false
): void {
    const converted = convertLangStrings(value, defaultLanguage, includeEmpty);
    if (converted.length > 0) target[field] = converted;
}

function addOperationVariables(
    target: XmlNode,
    field: string,
    value: any,
    version: AasXmlVersion
): void {
    const variables = children(value, "operationVariable")
        .map((variable) => {
            const converted = convertElementWrapper(variable.value ?? variable, version);
            return converted ? { value: converted } : undefined;
        })
        .filter((variable): variable is { value: any } => variable !== undefined);
    if (variables.length > 0) target[field] = variables;
}

function normalizeDataType(value: string | undefined): string {
    const raw = (value || "string").replace(/^xsd:/i, "xs:");
    const name = raw.replace(/^xs:/i, "");
    return `xs:${DATA_TYPE_NAMES[name.toLowerCase()] || name}`;
}

function firstReferenceValue(value: any): string | undefined {
    const reference = convertReference(value, "3.0", "model");
    return reference?.keys?.[0]?.value ?? text(value);
}

function children(value: any, childName: string): XmlNode[] {
    if (!value || value === "") return [];
    const child = isObject(value) && hasOwn(value, childName) ? value[childName] : value;
    return asArray(child).filter(isObject);
}

function asArray<T>(value: T | T[] | null | undefined): T[] {
    if (value === null || value === undefined || value === "") return [];
    return Array.isArray(value) ? value : [value];
}

function text(value: any): string | undefined {
    if (value === null || value === undefined) return undefined;
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (isObject(value) && hasOwn(value, "#text")) return text(value["#text"]);
    return undefined;
}

function copyText(
    target: XmlNode,
    field: string,
    value: any,
    includeEmpty: boolean
): void {
    const converted = text(value);
    if (converted !== undefined && (includeEmpty || converted !== "")) {
        target[field] = converted;
    }
}

function copyNonEmptyText(target: XmlNode, field: string, value: any): void {
    copyText(target, field, value, false);
}

function hasReference(value: any): value is { type: string; keys: any[] } {
    return Boolean(value && Array.isArray(value.keys) && value.keys.length > 0);
}

function hasOwn(value: any, key: string): boolean {
    return isObject(value) && Object.prototype.hasOwnProperty.call(value, key);
}

function isObject(value: any): value is XmlNode {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
