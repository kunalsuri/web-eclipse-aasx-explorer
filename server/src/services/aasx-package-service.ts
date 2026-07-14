/** Transactional filesystem lifecycle for OPC/AASX packages. */
import fs from "fs/promises";
import path from "path";
import type { Environment } from "../../../shared/aas-v3-types";
import { createAasxPackage, replaceAasxEnvironment } from "../../../shared/aasx-package";
import { parseAasxBuffer } from "../../../shared/aas-parser";
import { AtomicFileWriter, FileLockManager } from "./atomic-file-writer";

export interface SaveHooks { beforePackageReplace?: () => void | Promise<void>; }

export class AasxPackageService {
  static async create(packagePath: string, environmentPath: string, environment: Environment): Promise<void> {
    const bytes = await createAasxPackage(environment);
    await this.writeValidatedPackage(packagePath, bytes);
    await AtomicFileWriter.writeJSON(environmentPath, environment);
  }

  static async import(packagePath: string, environmentPath: string): Promise<Environment> {
    const bytes = await fs.readFile(packagePath);
    const result = await parseAasxBuffer(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), path.basename(packagePath));
    if (!result.success || !result.package) throw new Error(result.error ?? "Invalid AASX package");
    await AtomicFileWriter.writeJSON(environmentPath, result.package.environment);
    return result.package.environment;
  }

  static async save(packagePath: string, environmentPath: string, environment: Environment, hooks: SaveHooks = {}): Promise<void> {
    await FileLockManager.withLock(packagePath, async () => {
      const previousPackage = await fs.readFile(packagePath);
      const output = await replaceAasxEnvironment(previousPackage, environment);
      const validation = await parseAasxBuffer(output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength), path.basename(packagePath), { extractFiles: false });
      if (!validation.success) throw new Error(validation.error ?? "Generated AASX failed validation");
      await hooks.beforePackageReplace?.();
      await this.writeValidatedPackage(packagePath, output);
      try {
        await AtomicFileWriter.writeJSON(environmentPath, environment);
      } catch (error) {
        await AtomicFileWriter.writeFile(packagePath, previousPackage);
        throw error;
      }
    });
  }

  private static async writeValidatedPackage(packagePath: string, bytes: Uint8Array): Promise<void> {
    const validation = await parseAasxBuffer(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), path.basename(packagePath), { extractFiles: false });
    if (!validation.success) throw new Error(validation.error ?? "Generated AASX failed validation");
    await AtomicFileWriter.writeFile(packagePath, Buffer.from(bytes));
  }
}
