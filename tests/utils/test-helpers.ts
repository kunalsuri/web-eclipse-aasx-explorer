import fs from 'fs/promises';
import path from 'path';
import type { Environment } from '@shared/aas-v3-types';

/**
 * Create a temporary test file with environment data
 */
export async function createTestFile(
  fileId: string,
  environment: Environment,
  dataDir: string = 'data/aasx'
): Promise<string> {
  const filePath = path.join(process.cwd(), dataDir, `${fileId}-environment.json`);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(environment, null, 2));
  return filePath;
}

/**
 * Clean up test files
 */
export async function cleanupTestFile(
  fileId: string,
  dataDir: string = 'data/aasx'
): Promise<void> {
  try {
    const envPath = path.join(process.cwd(), dataDir, `${fileId}-environment.json`);
    await fs.unlink(envPath);
  } catch {
    // File might not exist, ignore error
  }

  try {
    const metaPath = path.join(process.cwd(), dataDir, `${fileId}-metadata.json`);
    await fs.unlink(metaPath);
  } catch {
    // File might not exist, ignore error
  }
}

/**
 * Clean up multiple test files
 */
export async function cleanupTestFiles(fileIds: string[], dataDir: string = 'data/aasx'): Promise<void> {
  await Promise.all(fileIds.map(id => cleanupTestFile(id, dataDir)));
}

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Measure execution time of a function
 */
export async function measureTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await fn();
  const duration = performance.now() - startTime;
  return { result, duration };
}

/**
 * Measure execution time of a synchronous function
 */
export function measureTimeSync<T>(
  fn: () => T
): { result: T; duration: number } {
  const startTime = performance.now();
  const result = fn();
  const duration = performance.now() - startTime;
  return { result, duration };
}

/**
 * Create a temporary directory for tests
 */
export async function createTempDir(prefix: string = 'test-'): Promise<string> {
  const tempDir = path.join(process.cwd(), 'data', 'temp', `${prefix}${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
}

/**
 * Clean up a temporary directory
 */
export async function cleanupTempDir(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch {
    // Directory might not exist, ignore error
  }
}

/**
 * Read JSON file
 */
export async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Write JSON file
 */
export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delay execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a unique test ID
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
