/**
 * Reference suggestion environment loading tests.
 */

import fs from 'fs/promises';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  loadReferenceEnvironment,
  ReferenceEnvironmentError,
} from '../../../../server/src/api/reference-suggestion-routes';

const testDirectory = path.join(process.cwd(), 'data', 'aasx');
const testFileId = 'reference-route-test';
const testPath = path.join(testDirectory, `${testFileId}-environment.json`);

describe('reference suggestion environment loading', () => {
  afterEach(async () => {
    await fs.rm(testPath, { force: true });
  });

  it('loads the parsed environment selected by fileId', async () => {
    const environment = { submodels: [{ id: 'urn:example:submodel' }] };
    await fs.mkdir(testDirectory, { recursive: true });
    await fs.writeFile(testPath, JSON.stringify(environment), 'utf-8');

    await expect(
      loadReferenceEnvironment({ query: { fileId: testFileId }, body: {} } as any)
    ).resolves.toEqual(environment);
  });

  it('rejects missing and path-traversal file IDs', async () => {
    await expect(
      loadReferenceEnvironment({ query: {}, body: {} } as any)
    ).rejects.toMatchObject<Partial<ReferenceEnvironmentError>>({ status: 400 });

    await expect(
      loadReferenceEnvironment({ query: { fileId: '../users' }, body: {} } as any)
    ).rejects.toMatchObject<Partial<ReferenceEnvironmentError>>({ status: 400 });
  });

  it('reports a missing parsed environment as not found', async () => {
    await expect(
      loadReferenceEnvironment({ query: { fileId: 'missing-reference-file' }, body: {} } as any)
    ).rejects.toMatchObject<Partial<ReferenceEnvironmentError>>({ status: 404 });
  });
});
