/** Relationship-aware OPC/AASX package access. */
import JSZip from "jszip";
import type { Environment } from "./aas-v3-types";

/**
 * `shared/` is imported by both the Node server and the browser client (via
 * the `shared/index.ts` barrel), but Vite externalizes Node's `path` module
 * for the browser and throws on any property access — so this file cannot
 * import `path`/`path.posix`, even though every path here is already a
 * forward-slash OPC package part name. Reimplemented minimally, matching
 * `path.posix` semantics for the join/dirname/basename/extname/normalize
 * calls this file actually makes.
 */
const posix = {
  normalize(p: string): string {
    if (p === "") return ".";
    const isAbsolute = p.startsWith("/");
    const trailingSlash = p.endsWith("/") && p !== "/";
    const resolved: string[] = [];
    for (const segment of p.split("/")) {
      if (segment === "" || segment === ".") continue;
      if (segment === "..") {
        if (resolved.length > 0 && resolved[resolved.length - 1] !== "..") resolved.pop();
        else if (!isAbsolute) resolved.push("..");
      } else {
        resolved.push(segment);
      }
    }
    let result = resolved.join("/");
    if (isAbsolute) result = "/" + result;
    if (!result) result = isAbsolute ? "/" : ".";
    if (trailingSlash && !result.endsWith("/")) result += "/";
    return result;
  },
  join(...parts: string[]): string {
    const joined = parts.filter((p) => p.length > 0).join("/");
    return joined === "" ? "." : posix.normalize(joined);
  },
  dirname(p: string): string {
    if (p === "") return ".";
    let end = p.length;
    while (end > 1 && p[end - 1] === "/") end--;
    const trimmed = p.slice(0, end);
    const lastSlash = trimmed.lastIndexOf("/");
    if (lastSlash === -1) return ".";
    if (lastSlash === 0) return "/";
    return trimmed.slice(0, lastSlash);
  },
  basename(p: string): string {
    let end = p.length;
    while (end > 0 && p[end - 1] === "/") end--;
    const trimmed = p.slice(0, end);
    const lastSlash = trimmed.lastIndexOf("/");
    return lastSlash === -1 ? trimmed : trimmed.slice(lastSlash + 1);
  },
  extname(p: string): string {
    const base = posix.basename(p);
    const lastDot = base.lastIndexOf(".");
    return lastDot <= 0 ? "" : base.slice(lastDot);
  },
};
export const AASX_RELATIONSHIPS = {
  origin: "http://www.admin-shell.io/aasx/relationships/aasx-origin",
  specification: "http://www.admin-shell.io/aasx/relationships/aas-spec",
  supplementary: "http://www.admin-shell.io/aasx/relationships/aas-suppl",
  thumbnail: "http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail",
} as const;

export interface OpcRelationship { id: string; type: string; target: string; targetMode?: string; source: string; resolvedTarget?: string; }
export interface AasxPackageManifest {
  environmentPart: string;
  environmentFormat: "json" | "xml";
  parts: Array<{ path: string; contentType: string; bytes: Uint8Array }>;
  relationships: OpcRelationship[];
  supplementaryParts: string[];
  thumbnailParts: string[];
}
interface ContentTypes { defaults: Map<string, string>; overrides: Map<string, string>; }

function attributes(fragment: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const match of fragment.matchAll(/([\w:.-]+)\s*=\s*["']([^"']*)["']/g)) {
    result[match[1]] = match[2].replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  }
  return result;
}
function normalizePart(part: string): string { return posix.normalize(part.replace(/\\/g, "/").replace(/^\/+/, "")); }
function relationshipsPath(source: string): string {
  if (!source) return "_rels/.rels";
  const normalized = normalizePart(source);
  return posix.join(posix.dirname(normalized), "_rels", `${posix.basename(normalized)}.rels`);
}
function resolveTarget(source: string, target: string): string | undefined {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return undefined;
  if (target.startsWith("/")) return normalizePart(target);
  return normalizePart(posix.join(source ? posix.dirname(normalizePart(source)) : "", target));
}
async function readRelationships(zip: JSZip, source: string): Promise<OpcRelationship[]> {
  const file = zip.file(relationshipsPath(source));
  if (!file) return [];
  const xml = await file.async("string");
  return Array.from(xml.matchAll(/<(?:\w+:)?Relationship\b([^>]*)\/?\s*>/gi), (match) => {
    const attrs = attributes(match[1]);
    return { id: attrs.Id ?? "", type: attrs.Type ?? "", target: attrs.Target ?? "", targetMode: attrs.TargetMode, source,
      resolvedTarget: attrs.TargetMode === "External" ? undefined : resolveTarget(source, attrs.Target ?? "") };
  });
}
async function readAllRelationships(zip: JSZip): Promise<OpcRelationship[]> {
  const sources = [""];
  for (const name of Object.keys(zip.files)) {
    const match = name.match(/^(?:(.*)\/)?_rels\/([^/]+)\.rels$/i);
    if (match && name !== "_rels/.rels") sources.push(posix.join(match[1] ?? "", match[2]));
  }
  return (await Promise.all(sources.map((source) => readRelationships(zip, source)))).flat();
}
async function readContentTypes(zip: JSZip): Promise<ContentTypes> {
  const defaults = new Map<string, string>(); const overrides = new Map<string, string>();
  const file = zip.file("[Content_Types].xml");
  if (!file) return { defaults, overrides };
  const xml = await file.async("string");
  for (const match of xml.matchAll(/<(?:\w+:)?Default\b([^>]*)\/?\s*>/gi)) { const a = attributes(match[1]); if (a.Extension && a.ContentType) defaults.set(a.Extension.toLowerCase(), a.ContentType); }
  for (const match of xml.matchAll(/<(?:\w+:)?Override\b([^>]*)\/?\s*>/gi)) { const a = attributes(match[1]); if (a.PartName && a.ContentType) overrides.set(normalizePart(a.PartName), a.ContentType); }
  return { defaults, overrides };
}
function contentTypeFor(part: string, types: ContentTypes): string {
  return types.overrides.get(normalizePart(part)) ?? types.defaults.get(posix.extname(part).slice(1).toLowerCase()) ?? "application/octet-stream";
}
function relationshipKind(type: string): keyof typeof AASX_RELATIONSHIPS | undefined {
  const value = type.toLowerCase();
  if (value.includes("relationships/aasx-origin")) return "origin";
  if (value.includes("relationships/aas-spec")) return "specification";
  if (value.includes("relationships/aas-suppl")) return "supplementary";
  if (value.endsWith("/relationships/metadata/thumbnail")) return "thumbnail";
  return undefined;
}

export async function inspectAasxPackage(input: ArrayBuffer | Uint8Array | Buffer): Promise<AasxPackageManifest> {
  const zip = await JSZip.loadAsync(input); const types = await readContentTypes(zip); const relationships = await readAllRelationships(zip);
  const origin = relationships.find((rel) => rel.source === "" && relationshipKind(rel.type) === "origin");
  const specification = origin?.resolvedTarget ? relationships.find((rel) => rel.source === origin.resolvedTarget && relationshipKind(rel.type) === "specification") : undefined;
  const environmentPart = specification?.resolvedTarget;
  if (!environmentPart || !zip.file(environmentPart)) throw new Error("AASX package does not contain a resolvable origin/specification environment relationship");
  const type = contentTypeFor(environmentPart, types).toLowerCase();
  const environmentFormat = type.includes("json") || posix.extname(environmentPart).toLowerCase() === ".json" ? "json" : "xml";
  const parts = await Promise.all(Object.keys(zip.files).filter((name) => !zip.files[name].dir && name !== "[Content_Types].xml" && !/(^|\/)\_rels\//.test(name)).map(async (name) => ({ path: normalizePart(name), contentType: contentTypeFor(name, types), bytes: await zip.file(name)!.async("uint8array") })));
  const supplementaryParts = relationships.filter((rel) => relationshipKind(rel.type) === "supplementary" && rel.resolvedTarget).map((rel) => rel.resolvedTarget!);
  const thumbnailParts = relationships.filter((rel) => relationshipKind(rel.type) === "thumbnail" && rel.resolvedTarget).map((rel) => rel.resolvedTarget!);
  return { environmentPart, environmentFormat, parts, relationships, supplementaryParts, thumbnailParts };
}

export async function createAasxPackage(environment: Environment): Promise<Uint8Array> {
  const zip = new JSZip(); const origin = "aasx/aasx-origin"; const env = "aasx/aasenv-with-no-id/aasenv.json";
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="utf-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="json" ContentType="application/json"/><Override PartName="/${origin}" ContentType="application/octet-stream"/><Override PartName="/${env}" ContentType="application/asset-administration-shell-package+json"/></Types>`);
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="utf-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="Rorigin" Type="${AASX_RELATIONSHIPS.origin}" Target="/${origin}"/></Relationships>`);
  zip.file(origin, "");
  zip.file(relationshipsPath(origin), `<?xml version="1.0" encoding="utf-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="Rspec" Type="${AASX_RELATIONSHIPS.specification}" Target="/${env}"/></Relationships>`);
  zip.file(env, JSON.stringify(environment, null, 2));
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 9 } });
}
export async function replaceAasxEnvironment(input: ArrayBuffer | Uint8Array | Buffer, environment: Environment): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(input); const manifest = await inspectAasxPackage(input);
  if (manifest.environmentFormat !== "json") throw new Error("Saving XML-backed AASX environments requires a canonical XML serializer");
  zip.file(manifest.environmentPart, JSON.stringify(environment, null, 2));
  const output = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 9 } });
  await inspectAasxPackage(output); return output;
}
export function partBytes(manifest: AasxPackageManifest, partPath: string): Uint8Array | undefined { return manifest.parts.find((part) => part.path === normalizePart(partPath))?.bytes; }
