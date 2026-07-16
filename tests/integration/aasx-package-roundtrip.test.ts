import { afterEach, describe, expect, it } from "vitest";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { AasxPackageService } from "../../server/src/services/aasx-package-service";
import { parseAasxBuffer } from "../../shared/aas-parser";
import type { Environment } from "../../shared/aas-v3-types";

const roots: string[] = [];
const empty: Environment = { assetAdministrationShells: [], submodels: [], conceptDescriptions: [] };
const arrayBufferOf = (bytes: Uint8Array): ArrayBuffer => Uint8Array.from(bytes).buffer;
afterEach(async () => Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true }))));

async function workspace() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "f01-aasx-")); roots.push(root);
  return { packagePath: path.join(root, "package.aasx"), environmentPath: path.join(root, "environment.json") };
}

describe("F01 package lifecycle", () => {
  it("create -> download -> reopen preserves the complete environment", async () => {
    const files = await workspace(); await AasxPackageService.create(files.packagePath, files.environmentPath, empty);
    const download = await fs.readFile(files.packagePath);
    const parsed = await parseAasxBuffer(arrayBufferOf(download), "download.aasx");
    expect(parsed.package?.environment).toEqual(empty);
  });

  it("upload -> edit Property -> save -> download -> reopen preserves the edit", async () => {
    const files = await workspace();
    const environment = { ...empty, submodels: [{ id: "urn:sm", idShort: "SM", submodelElements: [{ modelType: "Property", idShort: "P", valueType: "xs:string", value: "before" }] }] } as Environment;
    await AasxPackageService.create(files.packagePath, files.environmentPath, environment);
    environment.submodels![0].submodelElements![0] = { ...environment.submodels![0].submodelElements![0], value: "after" } as never;
    await AasxPackageService.save(files.packagePath, files.environmentPath, environment);
    const saved = await fs.readFile(files.packagePath);
    const parsed = await parseAasxBuffer(arrayBufferOf(saved), "saved.aasx");
    expect((parsed.package?.environment.submodels?.[0].submodelElements?.[0] as { value?: string }).value).toBe("after");
  });

  it("add submodel -> save -> download -> reopen includes the new submodel", async () => {
    const files = await workspace();
    await AasxPackageService.create(files.packagePath, files.environmentPath, empty);
    const environment = { ...empty, submodels: [{ id: "urn:sm", idShort: "SM", submodelElements: [] }] } as Environment;
    await AasxPackageService.save(files.packagePath, files.environmentPath, environment);
    const saved = await fs.readFile(files.packagePath);
    const parsed = await parseAasxBuffer(arrayBufferOf(saved), "saved.aasx");
    expect(parsed.package?.environment.submodels?.map((sm) => sm.id)).toEqual(["urn:sm"]);
  });

  it("delete element -> save -> download -> reopen no longer contains it", async () => {
    const files = await workspace();
    const environment = { ...empty, submodels: [{ id: "urn:sm", idShort: "SM", submodelElements: [{ modelType: "Property", idShort: "P", valueType: "xs:string", value: "v" }] }] } as Environment;
    await AasxPackageService.create(files.packagePath, files.environmentPath, environment);
    environment.submodels![0].submodelElements = [];
    await AasxPackageService.save(files.packagePath, files.environmentPath, environment);
    const saved = await fs.readFile(files.packagePath);
    const parsed = await parseAasxBuffer(arrayBufferOf(saved), "saved.aasx");
    expect(parsed.package?.environment.submodels?.[0].submodelElements).toEqual([]);
  });

  it("a failed write leaves the previous package and sidecar byte-identical", async () => {
    const files = await workspace(); await AasxPackageService.create(files.packagePath, files.environmentPath, empty);
    const packageBefore = await fs.readFile(files.packagePath); const environmentBefore = await fs.readFile(files.environmentPath);
    await expect(AasxPackageService.save(files.packagePath, files.environmentPath, { ...empty, submodels: [] }, { beforePackageReplace: () => { throw new Error("injected failure"); } })).rejects.toThrow("injected failure");
    expect(await fs.readFile(files.packagePath)).toEqual(packageBefore);
    expect(await fs.readFile(files.environmentPath)).toEqual(environmentBefore);
  });
});
