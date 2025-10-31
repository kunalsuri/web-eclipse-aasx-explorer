/**
 * Atomic File Writer Service
 * Ensures safe file writes using temp-file rename pattern
 */

import fs from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';

export class AtomicFileWriter {
  /**
   * Write data to file atomically
   * Uses temp file + rename to ensure atomicity
   */
  static async writeFile(filePath: string, data: string | Buffer): Promise<void> {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const tempPath = path.join(dir, `.tmp-${nanoid()}${ext}`);

    try {
      // Ensure directory exists
      await fs.mkdir(dir, { recursive: true });

      // Write to temp file
      await fs.writeFile(tempPath, data, 'utf-8');

      // Atomic rename
      await fs.rename(tempPath, filePath);
    } catch (error) {
      // Clean up temp file on error
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  /**
   * Write JSON data atomically
   */
  static async writeJSON(filePath: string, data: any): Promise<void> {
    const jsonString = JSON.stringify(data, null, 2);
    await this.writeFile(filePath, jsonString);
  }

  /**
   * Read and update file atomically
   */
  static async updateFile<T>(
    filePath: string,
    updater: (data: T) => T | Promise<T>
  ): Promise<void> {
    // Read current data
    const currentData = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(currentData) as T;

    // Apply update
    const updated = await updater(parsed);

    // Write atomically
    await this.writeJSON(filePath, updated);
  }

  /**
   * Create backup before writing
   */
  static async writeWithBackup(filePath: string, data: string | Buffer): Promise<void> {
    const backupPath = `${filePath}.backup`;

    try {
      // Create backup if file exists
      try {
        await fs.copyFile(filePath, backupPath);
      } catch {
        // File doesn't exist, no backup needed
      }

      // Write new data
      await this.writeFile(filePath, data);

      // Remove backup on success
      try {
        await fs.unlink(backupPath);
      } catch {
        // Ignore cleanup errors
      }
    } catch (error) {
      // Restore from backup on error
      try {
        await fs.copyFile(backupPath, filePath);
        await fs.unlink(backupPath);
      } catch {
        // Ignore restore errors
      }
      throw error;
    }
  }
}

/**
 * File Lock Manager
 * Prevents concurrent writes to the same file
 */
export class FileLockManager {
  private static readonly locks = new Map<string, Promise<void>>();

  /**
   * Acquire lock for a file
   */
  static async withLock<T>(filePath: string, operation: () => Promise<T>): Promise<T> {
    // Wait for existing lock
    const existingLock = this.locks.get(filePath);
    if (existingLock) {
      await existingLock;
    }

    // Create new lock
    const lockPromise = (async () => {
      try {
        return await operation();
      } finally {
        // Release lock
        this.locks.delete(filePath);
      }
    })();

    this.locks.set(filePath, lockPromise as Promise<void>);
    return lockPromise;
  }

  /**
   * Check if file is locked
   */
  static isLocked(filePath: string): boolean {
    return this.locks.has(filePath);
  }
}
