/**
 * Build the browser application and production server bundle.
 */

import fs from 'fs/promises';
import path from 'path';
import { build as buildServer } from 'esbuild';
import { build as buildClient } from 'vite';

const repoRoot = process.cwd();
const distDir = path.join(repoRoot, 'dist');

await fs.rm(distDir, { recursive: true, force: true });

await buildClient({
  configFile: path.join(repoRoot, 'vite.config.ts'),
});

await buildServer({
  absWorkingDir: repoRoot,
  entryPoints: ['./server/index.ts'],
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'esm',
  outfile: './dist/server.js',
  minify: false,
  treeShaking: true,
  target: 'node18',
  sourcemap: process.env.NODE_ENV === 'development',
  logLevel: 'info',
});
