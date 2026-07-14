/**
 * AtomicFileWriter platform reliability tests.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { AtomicFileWriter } from '../../../../server/src/services/atomic-file-writer';

const testFile = path.join(
  process.cwd(),
  'data',
  'aasx',
  'test-atomic-file-writer-retry.json'
);

describe('AtomicFileWriter', () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(testFile, { force: true });
  });

  it('retries a transient EPERM while replacing a file', async () => {
    await fs.mkdir(path.dirname(testFile), { recursive: true });
    await fs.writeFile(testFile, 'old content', 'utf-8');

    const realRename = fs.rename.bind(fs);
    let attempts = 0;
    vi.spyOn(fs, 'rename').mockImplementation(async (oldPath, newPath) => {
      attempts += 1;
      if (attempts === 1) {
        throw Object.assign(new Error('transient Windows replacement lock'), {
          code: 'EPERM',
        });
      }
      return realRename(oldPath, newPath);
    });

    await AtomicFileWriter.writeFile(testFile, 'new content');

    expect(attempts).toBe(2);
    await expect(fs.readFile(testFile, 'utf-8')).resolves.toBe('new content');
  });
});
