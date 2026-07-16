/**
 * AASX route authentication (T1-T3 from ai/lab/specs/SPEC_aasx_routes_auth_middleware.md).
 *
 * Boots the real `server/aasx-routes.ts` router behind a throwaway HTTP server
 * (no supertest dependency — plain `node:http` requests, matching the "zero new
 * dependencies" constraint) and exercises the representative sample the spec
 * calls out across every HTTP method: GET /files, POST /new, PUT /environment/:id,
 * PATCH /environment/:id/property, DELETE /files/:id.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import express from "express";
import http from "node:http";
import type { AddressInfo } from "node:net";
import fs from "fs/promises";
import path from "path";
import aasxRoutes from "../../server/aasx-routes";
import { generateTokenPair } from "../../server/auth/jwt-utils";
import { AasxPackageService } from "../../server/src/services/aasx-package-service";
import type { Environment } from "../../shared/aas-v3-types";

const dataDir = path.join(process.cwd(), "data", "aasx");
const metadataPath = path.join(dataDir, "metadata.json");
const MALFORMED_TOKEN = "this.is.not.a.valid.jwt";

interface FileMetadata {
  id: string;
  name: string;
  originalName: string;
  size: number;
  uploadedAt: string;
  path: string;
}

function makeAccessToken(overrides: Partial<Record<string, unknown>> = {}): string {
  const { accessToken } = generateTokenPair({
    userId: "aasx-auth-test-user",
    username: "aasx-auth-test",
    email: "aasx-auth-test@example.com",
    role: "user",
    sessionId: "aasx-auth-test-session",
    ...overrides,
  });
  return accessToken;
}

interface HttpResult {
  status: number;
  json: any;
}

function request(
  method: string,
  urlPath: string,
  options: { token?: string; body?: unknown } = {}
): Promise<HttpResult> {
  return new Promise((resolve, reject) => {
    const bodyStr = options.body !== undefined ? JSON.stringify(options.body) : undefined;
    const headers: Record<string, string> = {};
    if (options.token !== undefined) headers.Authorization = `Bearer ${options.token}`;
    if (bodyStr !== undefined) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(bodyStr).toString();
    }

    const req = http.request(`${baseUrl}${urlPath}`, { method, headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf-8");
        let json: any;
        try {
          json = text ? JSON.parse(text) : undefined;
        } catch {
          json = undefined;
        }
        resolve({ status: res.statusCode ?? 0, json });
      });
    });
    req.on("error", reject);
    if (bodyStr !== undefined) req.write(bodyStr);
    req.end();
  });
}

async function readRealMetadata(): Promise<FileMetadata[]> {
  try {
    const raw = await fs.readFile(metadataPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeRealMetadata(entries: FileMetadata[]): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(metadataPath, JSON.stringify(entries, null, 2));
}

async function listDataDir(): Promise<string[]> {
  try {
    return (await fs.readdir(dataDir)).sort();
  } catch {
    return [];
  }
}

/** Creates a real, on-disk AASX package + sidecar + metadata entry so PUT/PATCH/DELETE have something legitimate to operate on. */
async function seedFixturePackage(id: string): Promise<{ packagePath: string; envPath: string; environment: Environment }> {
  await fs.mkdir(dataDir, { recursive: true });
  const packagePath = path.join(dataDir, `${id}.aasx`);
  const envPath = path.join(dataDir, `${id}-environment.json`);
  const environment: Environment = {
    assetAdministrationShells: [],
    submodels: [{ id: "urn:auth-test:sm", idShort: "AuthTestSM", submodelElements: [] }],
    conceptDescriptions: [],
  } as Environment;
  await AasxPackageService.create(packagePath, envPath, environment);

  const stat = await fs.stat(packagePath);
  const entries = await readRealMetadata();
  entries.push({
    id,
    name: `${id}.aasx`,
    originalName: `${id}.aasx`,
    size: stat.size,
    uploadedAt: new Date().toISOString(),
    path: packagePath,
  });
  await writeRealMetadata(entries);

  return { packagePath, envPath, environment };
}

/** Removes a fixture's files and metadata entry; safe to call even if the route under test already deleted them. */
async function removeFixturePackage(id: string): Promise<void> {
  const entries = await readRealMetadata();
  const filtered = entries.filter((entry) => entry.id !== id);
  if (filtered.length !== entries.length) {
    await writeRealMetadata(filtered);
  }
  for (const suffix of [".aasx", "-environment.json", "-metadata.json", "-validation.json"]) {
    await fs.unlink(path.join(dataDir, `${id}${suffix}`)).catch(() => undefined);
  }
}

let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/aasx", aasxRoutes);
  server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

const cleanupIds: string[] = [];
afterEach(async () => {
  while (cleanupIds.length > 0) {
    const id = cleanupIds.pop()!;
    await removeFixturePackage(id);
  }
});

describe("AASX routes require authentication (SPEC_aasx_routes_auth_middleware)", () => {
  describe("T1 — unauthenticated requests are rejected with no side effects", () => {
    it("GET /api/aasx/files -> 401 MISSING_TOKEN", async () => {
      const res = await request("GET", "/api/aasx/files");
      expect(res.status).toBe(401);
      expect(res.json?.code).toBe("MISSING_TOKEN");
    });

    it("POST /api/aasx/new -> 401 MISSING_TOKEN, no package/metadata created", async () => {
      const before = await listDataDir();
      const beforeMeta = await readRealMetadata();

      const res = await request("POST", "/api/aasx/new", { body: {} });

      expect(res.status).toBe(401);
      expect(res.json?.code).toBe("MISSING_TOKEN");
      expect(await listDataDir()).toEqual(before);
      expect(await readRealMetadata()).toEqual(beforeMeta);
    });

    it("PUT /api/aasx/environment/:id -> 401 MISSING_TOKEN, environment untouched", async () => {
      const id = `auth-t1-put-${Date.now()}`;
      cleanupIds.push(id);
      const { envPath } = await seedFixturePackage(id);
      const beforeEnv = await fs.readFile(envPath, "utf-8");
      const beforeMeta = await readRealMetadata();

      const res = await request("PUT", `/api/aasx/environment/${id}`, {
        body: { environment: { assetAdministrationShells: [], submodels: [], conceptDescriptions: [] } },
      });

      expect(res.status).toBe(401);
      expect(res.json?.code).toBe("MISSING_TOKEN");
      expect(await fs.readFile(envPath, "utf-8")).toBe(beforeEnv);
      expect(await readRealMetadata()).toEqual(beforeMeta);
    });

    it("PATCH /api/aasx/environment/:id/property -> 401 MISSING_TOKEN, environment untouched", async () => {
      const id = `auth-t1-patch-${Date.now()}`;
      cleanupIds.push(id);
      const { envPath } = await seedFixturePackage(id);
      const beforeEnv = await fs.readFile(envPath, "utf-8");

      const res = await request("PATCH", `/api/aasx/environment/${id}/property`, {
        body: { propertyPath: "submodels[0].idShort", value: "ShouldNotApply" },
      });

      expect(res.status).toBe(401);
      expect(res.json?.code).toBe("MISSING_TOKEN");
      expect(await fs.readFile(envPath, "utf-8")).toBe(beforeEnv);
    });

    it("DELETE /api/aasx/files/:id -> 401 MISSING_TOKEN, file and metadata entry untouched", async () => {
      const id = `auth-t1-delete-${Date.now()}`;
      cleanupIds.push(id);
      const { packagePath } = await seedFixturePackage(id);
      const beforeMeta = await readRealMetadata();

      const res = await request("DELETE", `/api/aasx/files/${id}`);

      expect(res.status).toBe(401);
      expect(res.json?.code).toBe("MISSING_TOKEN");
      expect(await readRealMetadata()).toEqual(beforeMeta);
      await expect(fs.stat(packagePath)).resolves.toBeTruthy();
    });
  });

  describe("T2 — malformed bearer token is rejected", () => {
    it("GET /api/aasx/files -> 401 INVALID_TOKEN", async () => {
      const res = await request("GET", "/api/aasx/files", { token: MALFORMED_TOKEN });
      expect(res.status).toBe(401);
      expect(res.json?.code).toBe("INVALID_TOKEN");
    });

    it("POST /api/aasx/new -> 401 INVALID_TOKEN", async () => {
      const res = await request("POST", "/api/aasx/new", { token: MALFORMED_TOKEN, body: {} });
      expect(res.status).toBe(401);
      expect(res.json?.code).toBe("INVALID_TOKEN");
    });

    it("PUT /api/aasx/environment/:id -> 401 INVALID_TOKEN", async () => {
      const id = `auth-t2-put-${Date.now()}`;
      cleanupIds.push(id);
      await seedFixturePackage(id);

      const res = await request("PUT", `/api/aasx/environment/${id}`, {
        token: MALFORMED_TOKEN,
        body: { environment: { assetAdministrationShells: [], submodels: [], conceptDescriptions: [] } },
      });

      expect(res.status).toBe(401);
      expect(res.json?.code).toBe("INVALID_TOKEN");
    });

    it("PATCH /api/aasx/environment/:id/property -> 401 INVALID_TOKEN", async () => {
      const id = `auth-t2-patch-${Date.now()}`;
      cleanupIds.push(id);
      await seedFixturePackage(id);

      const res = await request("PATCH", `/api/aasx/environment/${id}/property`, {
        token: MALFORMED_TOKEN,
        body: { propertyPath: "submodels[0].idShort", value: "ShouldNotApply" },
      });

      expect(res.status).toBe(401);
      expect(res.json?.code).toBe("INVALID_TOKEN");
    });

    it("DELETE /api/aasx/files/:id -> 401 INVALID_TOKEN", async () => {
      const id = `auth-t2-delete-${Date.now()}`;
      cleanupIds.push(id);
      await seedFixturePackage(id);

      const res = await request("DELETE", `/api/aasx/files/${id}`, { token: MALFORMED_TOKEN });

      expect(res.status).toBe(401);
      expect(res.json?.code).toBe("INVALID_TOKEN");
    });
  });

  describe("T3 — a valid access token behaves exactly as before this change", () => {
    it("GET /api/aasx/files -> 200 with the file list", async () => {
      const token = makeAccessToken();
      const res = await request("GET", "/api/aasx/files", { token });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.json?.files)).toBe(true);
    });

    it("POST /api/aasx/new -> 200, creates the package as before", async () => {
      const token = makeAccessToken();
      const res = await request("POST", "/api/aasx/new", { token, body: {} });

      expect(res.status).toBe(200);
      expect(res.json?.success).toBe(true);
      expect(typeof res.json?.packageId).toBe("string");
      cleanupIds.push(res.json.packageId);

      const entries = await readRealMetadata();
      expect(entries.some((entry) => entry.id === res.json.packageId)).toBe(true);
    });

    it("PUT /api/aasx/environment/:id -> 200, replaces the environment as before", async () => {
      const id = `auth-t3-put-${Date.now()}`;
      cleanupIds.push(id);
      const { envPath } = await seedFixturePackage(id);
      const token = makeAccessToken();

      const newEnvironment: Environment = {
        assetAdministrationShells: [],
        submodels: [{ id: "urn:auth-test:sm2", idShort: "ReplacedSM", submodelElements: [] }],
        conceptDescriptions: [],
      } as Environment;

      const res = await request("PUT", `/api/aasx/environment/${id}`, {
        token,
        body: { environment: newEnvironment },
      });

      expect(res.status).toBe(200);
      expect(res.json?.success).toBe(true);
      const saved = JSON.parse(await fs.readFile(envPath, "utf-8"));
      expect(saved.submodels?.[0]?.idShort).toBe("ReplacedSM");
    });

    it("PATCH /api/aasx/environment/:id/property -> 200, updates the property as before", async () => {
      const id = `auth-t3-patch-${Date.now()}`;
      cleanupIds.push(id);
      const { envPath } = await seedFixturePackage(id);
      const token = makeAccessToken();

      const res = await request("PATCH", `/api/aasx/environment/${id}/property`, {
        token,
        body: { propertyPath: "submodels[0].idShort", value: "PatchedSM" },
      });

      expect(res.status).toBe(200);
      expect(res.json?.success).toBe(true);
      const saved = JSON.parse(await fs.readFile(envPath, "utf-8"));
      expect(saved.submodels?.[0]?.idShort).toBe("PatchedSM");
    });

    it("DELETE /api/aasx/files/:id -> 200, deletes the package as before", async () => {
      const id = `auth-t3-delete-${Date.now()}`;
      // The route only unlinks the metadata-referenced `.aasx`; it does not
      // remove the `-environment.json` sidecar, so cleanup must too.
      cleanupIds.push(id);
      const { packagePath } = await seedFixturePackage(id);
      const token = makeAccessToken();

      const res = await request("DELETE", `/api/aasx/files/${id}`, { token });

      expect(res.status).toBe(200);
      expect(res.json?.success).toBe(true);
      const entries = await readRealMetadata();
      expect(entries.some((entry) => entry.id === id)).toBe(false);
      await expect(fs.stat(packagePath)).rejects.toThrow();
    });
  });
});
