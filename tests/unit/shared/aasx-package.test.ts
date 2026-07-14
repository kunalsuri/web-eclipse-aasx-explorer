import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { createAasxPackage, inspectAasxPackage, partBytes, replaceAasxEnvironment, AASX_RELATIONSHIPS } from "../../../shared/aasx-package";
import { parseAasxBuffer } from "../../../shared/aas-parser";
import type { Environment } from "../../../shared/aas-v3-types";

const empty: Environment = { assetAdministrationShells: [], submodels: [], conceptDescriptions: [] };
const bufferOf = (bytes: Uint8Array) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

async function packageWithSupplementaries(): Promise<Uint8Array> {
  const base = await createAasxPackage(empty);
  const zip = await JSZip.loadAsync(base);
  zip.file("aasx/files/manual.xml", "<manual>keep exactly</manual>");
  zip.file("aasx/files/config.json", '{"keep":true,"order":1}');
  zip.file("aasx/files/thumb.png", new Uint8Array([137, 80, 78, 71, 1, 2, 3]));
  const relPath = "aasx/aasenv-with-no-id/_rels/aasenv.json.rels";
  zip.file(relPath, `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="S1" Type="${AASX_RELATIONSHIPS.supplementary}" Target="../files/manual.xml"/><Relationship Id="S2" Type="${AASX_RELATIONSHIPS.supplementary}" Target="../files/config.json"/></Relationships>`);
  const rootRels = await zip.file("_rels/.rels")!.async("string");
  zip.file("_rels/.rels", rootRels.replace("</Relationships>", `<Relationship Id="T1" Type="${AASX_RELATIONSHIPS.thumbnail}" Target="/aasx/files/thumb.png"/></Relationships>`));
  const types = await zip.file("[Content_Types].xml")!.async("string");
  zip.file("[Content_Types].xml", types.replace("</Types>", '<Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/></Types>'));
  return zip.generateAsync({ type: "uint8array" });
}

describe("OPC AASX package writer", () => {
  it("creates, downloads, and reopens a real relationship-based AASX", async () => {
    const bytes = await createAasxPackage(empty);
    const manifest = await inspectAasxPackage(bytes);
    const parsed = await parseAasxBuffer(bufferOf(bytes), "created.aasx");
    expect(manifest.environmentPart).toBe("aasx/aasenv-with-no-id/aasenv.json");
    expect(parsed.success).toBe(true);
    expect(parsed.package?.environment).toEqual(empty);
  });

  it("preserves supplementary XML/JSON bytes, MIME types, relationships, and thumbnail", async () => {
    const input = await packageWithSupplementaries();
    const before = await inspectAasxPackage(input);
    const changed = { ...empty, submodels: [{ id: "urn:test:edited", idShort: "Edited", submodelElements: [] }] } as Environment;
    const output = await replaceAasxEnvironment(input, changed);
    const after = await inspectAasxPackage(output);
    for (const part of ["aasx/files/manual.xml", "aasx/files/config.json", "aasx/files/thumb.png"]) {
      expect(partBytes(after, part)).toEqual(partBytes(before, part));
      expect(after.parts.find((item) => item.path === part)?.contentType).toBe(before.parts.find((item) => item.path === part)?.contentType);
    }
    expect(after.relationships).toEqual(before.relationships);
    expect(after.supplementaryParts).toEqual(["aasx/files/manual.xml", "aasx/files/config.json"]);
    expect(after.thumbnailParts).toEqual(["aasx/files/thumb.png"]);
    const parsed = await parseAasxBuffer(bufferOf(output), "saved.aasx");
    expect(parsed.package?.files.map((file) => file.path)).toEqual(expect.arrayContaining(["aasx/files/manual.xml", "aasx/files/config.json"]));
    expect(parsed.package?.environment).toEqual(changed);
  });
});
