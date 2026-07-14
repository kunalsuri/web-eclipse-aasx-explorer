/**
 * Golden master integration tests for the AASX parser.
 *
 * Runs each .aasx fixture in tests/fixtures/golden-master/ through this
 * app's own parseAasxBuffer and diffs the result against the golden JSON
 * snapshot in tests/fixtures/golden-master/expected/, produced by the C#
 * reference implementation's AasxGoldenMasterHarness (see
 * tests/fixtures/golden-master/README.md for provenance and regeneration
 * instructions).
 *
 * These fixtures are committed occasionally, not regenerated on every
 * npm test run - diffing against them requires no .NET SDK, only the
 * checked-in JSON.
 */

import { describe, it, expect } from "vitest";
import fs from "fs/promises";
import path from "path";
import { parseAasxBuffer } from "@shared/aas-parser";

const FIXTURES_DIR = path.resolve(__dirname, "../../fixtures/golden-master");
const EXPECTED_DIR = path.join(FIXTURES_DIR, "expected");

interface GoldenSummary {
  assetAdministrationShellCount: number;
  submodelCount: number;
  conceptDescriptionCount: number;
}

interface GoldenMaster {
  sourceFile: string;
  parse: { success: boolean };
  summary: GoldenSummary | null;
}

async function listFixtures(): Promise<string[]> {
  const entries = await fs.readdir(FIXTURES_DIR);
  return entries.filter((name) => name.endsWith(".aasx")).sort();
}

async function loadGoldenMaster(aasxFileName: string): Promise<GoldenMaster> {
  const jsonFileName = aasxFileName.replace(/\.aasx$/, ".json");
  const content = await fs.readFile(
    path.join(EXPECTED_DIR, jsonFileName),
    "utf-8"
  );
  return JSON.parse(content);
}

/**
 * Under vitest's jsdom environment, ArrayBuffer/Uint8Array are jsdom's own
 * realm's constructors, not Node's - a plain `Buffer.buffer` (Node-realm
 * ArrayBuffer) fails JSZip's cross-realm instanceof checks. Re-wrapping
 * through `new Uint8Array(...)` constructs the copy with whichever
 * Uint8Array/ArrayBuffer is currently in scope, so it matches JSZip's realm.
 */
async function readFixtureAsArrayBuffer(fileName: string): Promise<ArrayBuffer> {
  const buffer = await fs.readFile(path.join(FIXTURES_DIR, fileName));
  return new Uint8Array(buffer).buffer;
}

describe("Golden Master - AASX Parser", async () => {
  const fixtures = await listFixtures();

  // Sanity check on the fixture set itself: if this ever drops to zero,
  // every test below would trivially and silently pass.
  it("has at least one golden master fixture to compare against", () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  it.each(fixtures)("parses %s without throwing", async (fileName) => {
    const golden = await loadGoldenMaster(fileName);
    const arrayBuffer = await readFixtureAsArrayBuffer(fileName);

    const result = await parseAasxBuffer(arrayBuffer, fileName);

    expect(result.success).toBe(golden.parse.success);
  });

  it.each(fixtures)(
    "extracts the same environment element counts as the C# reference for %s",
    async (fileName) => {
      const golden = await loadGoldenMaster(fileName);
      if (!golden.summary) {
        // C# reference failed to parse this fixture too - nothing to compare.
        return;
      }

      const arrayBuffer = await readFixtureAsArrayBuffer(fileName);

      const result = await parseAasxBuffer(arrayBuffer, fileName);
      expect(result.success).toBe(true);

      const env = result.package!.environment;
      expect({
        assetAdministrationShellCount: env.assetAdministrationShells?.length ?? 0,
        submodelCount: env.submodels?.length ?? 0,
        conceptDescriptionCount: env.conceptDescriptions?.length ?? 0,
      }).toEqual(golden.summary);
    }
  );
});
