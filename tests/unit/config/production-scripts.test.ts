/**
 * Production package-script contract tests.
 */

import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('production package scripts', () => {
  it('builds and starts the same server artifact', () => {
    const workspaceRoot = process.cwd();
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(workspaceRoot, 'package.json'), 'utf-8')
    ) as { scripts: Record<string, string> };

    expect(packageJson.scripts.build).toBe('node scripts/build.mjs');
    expect(packageJson.scripts.start).toContain('node dist/server.js');
    expect(fs.existsSync(path.join(workspaceRoot, 'scripts/build.mjs'))).toBe(true);

    const sessionManager = fs.readFileSync(
      path.join(workspaceRoot, 'server/auth/session-manager.ts'),
      'utf-8'
    );
    expect(sessionManager).not.toContain("from '../index'");
  });
});
