/**
 * Validation Preset Manager
 * Manages custom validation presets with file-based persistence
 */

import fs from "fs/promises";
import path from "path";
import type { ValidationPreset } from "../../../shared/aas-validation-engine";

export class ValidationPresetManager {
  private readonly presetsPath: string;

  constructor() {
    this.presetsPath = path.join(process.cwd(), "data", "validation-presets.json");
  }

  /**
   * Initialize presets file if it doesn't exist
   */
  async initialize(): Promise<void> {
    try {
      await fs.access(this.presetsPath);
    } catch {
      // File doesn't exist, create with default presets
      await this.savePresets([]);
    }
  }

  /**
   * Load all custom presets
   */
  async loadPresets(): Promise<ValidationPreset[]> {
    try {
      const data = await fs.readFile(this.presetsPath, "utf-8");
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  /**
   * Save presets to file
   */
  async savePresets(presets: ValidationPreset[]): Promise<void> {
    const tempPath = `${this.presetsPath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(presets, null, 2));
    await fs.rename(tempPath, this.presetsPath);
  }

  /**
   * Get preset by ID
   */
  async getPreset(presetId: string): Promise<ValidationPreset | null> {
    const presets = await this.loadPresets();
    return presets.find((p) => p.id === presetId) || null;
  }

  /**
   * Save a custom preset
   */
  async savePreset(preset: ValidationPreset): Promise<void> {
    const presets = await this.loadPresets();
    const existingIndex = presets.findIndex((p) => p.id === preset.id);

    if (existingIndex >= 0) {
      // Update existing preset
      presets[existingIndex] = preset;
    } else {
      // Add new preset
      presets.push(preset);
    }

    await this.savePresets(presets);
  }

  /**
   * Delete a custom preset
   */
  async deletePreset(presetId: string): Promise<boolean> {
    const presets = await this.loadPresets();
    const filteredPresets = presets.filter((p) => p.id !== presetId);

    if (filteredPresets.length === presets.length) {
      return false; // Preset not found
    }

    await this.savePresets(filteredPresets);
    return true;
  }

  /**
   * Check if preset exists
   */
  async presetExists(presetId: string): Promise<boolean> {
    const preset = await this.getPreset(presetId);
    return preset !== null;
  }
}

// Singleton instance
export const presetManager = new ValidationPresetManager();
