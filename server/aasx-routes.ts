import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { ExcelExportService } from "./src/services/excel-export-service.js";
import { CsvExportService } from "./src/services/csv-export-service.js";
import { ExcelImportService } from "./src/services/excel-import-service.js";
import { AasxPackageService } from "./src/services/aasx-package-service.js";

const router = Router();

// ============================================================================
// Create New Package Endpoint
// ============================================================================

// POST /api/aasx/new - Create a new empty AASX package
router.post("/new", async (req: Request, res: Response) => {
  try {
    const { packageName, includeDefaultAAS, includeDefaultSubmodel, template } = req.body;

    // Import the package creator service
    const { AasPackageCreator } = await import("./src/services/aas-package-creator.js");

    // Validate options
    const validation = AasPackageCreator.validatePackageOptions({
      packageName,
      includeDefaultAAS,
      includeDefaultSubmodel,
    });

    if (!validation.valid) {
      res.status(400).json({
        error: "Invalid package options",
        details: validation.errors,
      });
      return;
    }

    // Create package
    let result;
    if (template) {
      result = AasPackageCreator.createFromTemplate(template);
    } else {
      result = AasPackageCreator.createNewPackage({
        packageName,
        includeDefaultAAS,
        includeDefaultSubmodel,
      });
    }

    if (!result.success) {
      res.status(500).json({ error: result.error });
      return;
    }

    await fs.mkdir(path.join(process.cwd(), "data", "aasx"), { recursive: true });
    const envPath = path.join(
      process.cwd(),
      "data",
      "aasx",
      `${result.packageId}-environment.json`
    );
    const packagePath = path.join(process.cwd(), "data", "aasx", `${result.packageId}.aasx`);
    await AasxPackageService.create(packagePath, envPath, result.environment);

    // Save metadata
    const metadataPath = path.join(
      process.cwd(),
      "data",
      "aasx",
      `${result.packageId}-metadata.json`
    );
    await fs.writeFile(
      metadataPath,
      JSON.stringify(result.metadata, null, 2)
    );

    // Add to file list
    const allMetadata = await readMetadata();
    allMetadata.push({
      id: result.packageId,
      name: result.metadata.name + ".aasx",
      originalName: result.metadata.name + ".aasx",
      size: (await fs.stat(packagePath)).size,
      uploadedAt: result.metadata.createdAt,
      path: packagePath,
    });
    await writeMetadata(allMetadata);

    res.json({
      success: true,
      packageId: result.packageId,
      environment: result.environment,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error("Create new package error:", error);
    res.status(500).json({ error: "Failed to create new package" });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), "data", "aasx");
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (_req, file, cb) => {
    const fileId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${fileId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB
  },
  fileFilter: (_req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== ".aasx") {
      cb(new Error("Only .aasx files are allowed"));
      return;
    }
    cb(null, true);
  },
});

interface FileMetadata {
  id: string;
  name: string;
  originalName: string;
  size: number;
  uploadedAt: string;
  path: string;
}

// Helper to read/write metadata
async function getMetadataFilePath(): Promise<string> {
  const metadataDir = path.join(process.cwd(), "data", "aasx");
  await fs.mkdir(metadataDir, { recursive: true });
  return path.join(metadataDir, "metadata.json");
}

async function readMetadata(): Promise<FileMetadata[]> {
  try {
    const metadataPath = await getMetadataFilePath();
    const data = await fs.readFile(metadataPath, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeMetadata(metadata: FileMetadata[]): Promise<void> {
  const metadataPath = await getMetadataFilePath();
  const tempPath = `${metadataPath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(metadata, null, 2));
  await fs.rename(tempPath, metadataPath);
}

async function saveEnvironment(id: string, environment: unknown): Promise<void> {
  const metadata = await readMetadata();
  const file = metadata.find((item) => item.id === id);
  if (!file) throw new Error(`Package metadata not found: ${id}`);
  const envPath = path.join(process.cwd(), "data", "aasx", `${id}-environment.json`);
  await AasxPackageService.save(file.path, envPath, environment as never);
  file.size = (await fs.stat(file.path)).size;
  await writeMetadata(metadata);
}

// POST /api/aasx/upload - Upload AASX file
router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const fileId = path.parse(req.file.filename).name;
    const metadata: FileMetadata = {
      id: fileId,
      name: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
      path: req.file.path,
    };

    const envPath = path.join(process.cwd(), "data", "aasx", `${fileId}-environment.json`);
    try {
      await AasxPackageService.import(req.file.path, envPath);
    } catch (error) {
      await fs.unlink(req.file.path).catch(() => undefined);
      throw error;
    }

    // Save metadata
    const allMetadata = await readMetadata();
    allMetadata.push(metadata);
    await writeMetadata(allMetadata);

    res.json({
      success: true,
      fileId: metadata.id,
      file: {
        id: metadata.id,
        name: metadata.originalName,
        size: metadata.size,
        uploadedAt: metadata.uploadedAt,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

// POST /api/aasx/parse/:id - Parse an uploaded AASX file
router.post("/parse/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const metadata = await readMetadata();
    const file = metadata.find((m) => m.id === id);

    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    // Read file
    const buffer = await fs.readFile(file.path);

    // Parse AASX (dynamic import to avoid bundling issues)
    const { parseAasxBuffer } = await import("../shared/aas-parser.js");
    const result = await parseAasxBuffer(buffer.buffer as ArrayBuffer, file.originalName);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    // Debug: Log what was parsed
    console.log("Parsed environment:", JSON.stringify(result.package?.environment, null, 2));
    console.log("AAS count:", result.package?.environment?.assetAdministrationShells?.length || 0);
    console.log("Submodel count:", result.package?.environment?.submodels?.length || 0);

    // Save parsed environment
    const envPath = path.join(
      process.cwd(),
      "data",
      "aasx",
      `${id}-environment.json`
    );
    await fs.writeFile(
      envPath,
      JSON.stringify(result.package?.environment, null, 2)
    );

    res.json({
      success: true,
      environment: result.package?.environment,
      metadata: result.package?.metadata,
      fileCount: result.package?.files.length || 0,
    });
  } catch (error) {
    console.error("Parse error:", error);
    res.status(500).json({ error: "Parse failed" });
  }
});

// GET /api/aasx/environment/:id - Get parsed environment
router.get("/environment/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const envPath = path.join(
      process.cwd(),
      "data",
      "aasx",
      `${id}-environment.json`
    );

    try {
      const data = await fs.readFile(envPath, "utf-8");
      const environment = JSON.parse(data);
      res.json({ environment });
    } catch {
      res.status(404).json({ error: "Environment not found. File may not be parsed yet." });
    }
  } catch (error) {
    console.error("Get environment error:", error);
    res.status(500).json({ error: "Failed to get environment" });
  }
});

// GET /api/aasx/files - List all AASX files
router.get("/files", async (_req: Request, res: Response) => {
  try {
    const metadata = await readMetadata();
    const files = metadata.map((m) => ({
      id: m.id,
      name: m.originalName,
      size: m.size,
      uploadedAt: m.uploadedAt,
    }));
    res.json({ files });
  } catch (error) {
    console.error("List files error:", error);
    res.status(500).json({ error: "Failed to list files" });
  }
});

// GET /api/aasx/files/:id - Get file metadata
router.get("/files/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const metadata = await readMetadata();
    const file = metadata.find((m) => m.id === id);

    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    res.json({
      id: file.id,
      name: file.originalName,
      size: file.size,
      uploadedAt: file.uploadedAt,
    });
  } catch (error) {
    console.error("Get file error:", error);
    res.status(500).json({ error: "Failed to get file" });
  }
});

// GET /api/aasx/download/:id - Download AASX file
router.get("/download/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const metadata = await readMetadata();
    const file = metadata.find((m) => m.id === id);

    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    res.download(file.path, file.originalName);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Download failed" });
  }
});

// DELETE /api/aasx/files/:id - Delete AASX file
router.delete("/files/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const metadata = await readMetadata();
    const fileIndex = metadata.findIndex((m) => m.id === id);

    if (fileIndex === -1) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const file = metadata[fileIndex];

    // Delete physical file
    try {
      await fs.unlink(file.path);
    } catch (error) {
      console.error("Failed to delete physical file:", error);
    }

    // Remove from metadata
    metadata.splice(fileIndex, 1);
    await writeMetadata(metadata);

    res.json({ success: true, message: "File deleted" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Delete failed" });
  }
});

// PATCH /api/aasx/environment/:id/property - Update a property value
router.patch("/environment/:id/property", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { propertyPath, value } = req.body;

    if (!propertyPath) {
      res.status(400).json({ error: "Property path is required" });
      return;
    }

    const envPath = path.join(process.cwd(), "data", "aasx", `${id}-environment.json`);

    // Read current environment
    let environment;
    try {
      const data = await fs.readFile(envPath, "utf-8");
      environment = JSON.parse(data);
    } catch {
      res.status(404).json({ error: "Environment not found" });
      return;
    }

    // Update property value
    // propertyPath format: "submodels[0].submodelElements[2].value"
    const pathParts = propertyPath.split('.');
    let current = environment;

    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      const arrayMatch = part.match(/(\w+)\[(\d+)\]/);

      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        current = current[key][parseInt(index)];
      } else {
        current = current[part];
      }
    }

    // Set the final value
    const lastPart = pathParts[pathParts.length - 1];
    current[lastPart] = value;

    await saveEnvironment(id, environment);

    res.json({
      success: true,
      message: "Property updated successfully",
      value,
    });
  } catch (error) {
    console.error("Update property error:", error);
    res.status(500).json({ error: "Failed to update property" });
  }
});

// PUT /api/aasx/environment/:id - Replace entire environment
router.put("/environment/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { environment } = req.body;

    if (!environment) {
      res.status(400).json({ error: "Environment data is required" });
      return;
    }

    const envPath = path.join(process.cwd(), "data", "aasx", `${id}-environment.json`);

    await saveEnvironment(id, environment);

    res.json({
      success: true,
      message: "Environment updated successfully",
    });
  } catch (error) {
    console.error("Update environment error:", error);
    res.status(500).json({ error: "Failed to update environment" });
  }
});

// POST /api/aasx/:id/validate - Validate an AASX environment
router.post("/:id/validate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { preset, rules } = req.body;

    // Read environment
    const envPath = path.join(process.cwd(), "data", "aasx", `${id}-environment.json`);
    let environment;
    try {
      const data = await fs.readFile(envPath, "utf-8");
      environment = JSON.parse(data);
    } catch {
      res.status(404).json({ error: "Environment not found. File may not be parsed yet." });
      return;
    }

    // Validate using the validation engine
    const { validateEnvironmentAdvanced, validationEngine } = await import("../shared/aas-validation-engine.js");

    let validationResult;
    if (preset) {
      // Validate with preset
      validationResult = validationEngine.validateWithPreset(environment, preset);
    } else if (rules && Array.isArray(rules)) {
      // Validate with specific rules
      validationResult = validationEngine.validateWithRules(environment, rules);
    } else {
      // Validate with all rules
      validationResult = validateEnvironmentAdvanced(environment);
    }

    // Save validation result
    const validationPath = path.join(process.cwd(), "data", "aasx", `${id}-validation.json`);
    await fs.writeFile(validationPath, JSON.stringify(validationResult, null, 2));

    res.json({
      success: true,
      validation: validationResult,
    });
  } catch (error) {
    console.error("Validation error:", error);
    res.status(500).json({ error: "Validation failed" });
  }
});

// GET /api/aasx/:id/validation - Get cached validation result
router.get("/:id/validation", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validationPath = path.join(process.cwd(), "data", "aasx", `${id}-validation.json`);

    try {
      const data = await fs.readFile(validationPath, "utf-8");
      const validation = JSON.parse(data);
      res.json({ validation });
    } catch {
      res.status(404).json({ error: "Validation result not found. Run validation first." });
    }
  } catch (error) {
    console.error("Get validation error:", error);
    res.status(500).json({ error: "Failed to get validation result" });
  }
});

// GET /api/aasx/:id/validation-report - Generate validation report
router.get("/:id/validation-report", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { format = "json" } = req.query;

    // Read validation result
    const validationPath = path.join(process.cwd(), "data", "aasx", `${id}-validation.json`);
    let validation;
    try {
      const data = await fs.readFile(validationPath, "utf-8");
      validation = JSON.parse(data);
    } catch {
      res.status(404).json({ error: "Validation result not found. Run validation first." });
      return;
    }

    // Generate report based on format
    if (format === "json") {
      res.json(validation);
    } else if (format === "csv") {
      // Generate CSV report
      const allErrors = [...validation.errors, ...validation.warnings, ...validation.infos];
      let csv = "Severity,Code,Message,Path,Suggestion\n";
      allErrors.forEach((error: any) => {
        const row = [
          error.severity,
          error.code,
          `"${error.message.replace(/"/g, '""')}"`,
          error.path || "",
          error.suggestion ? `"${error.suggestion.replace(/"/g, '""')}"` : "",
        ];
        csv += row.join(",") + "\n";
      });
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="validation-report-${id}.csv"`);
      res.send(csv);
    } else if (format === "text") {
      // Generate text report
      let text = `AAS Validation Report\n`;
      text += `======================\n\n`;
      text += `Status: ${validation.isValid ? "Valid" : "Invalid"}\n`;
      text += `Errors: ${validation.errors.length}\n`;
      text += `Warnings: ${validation.warnings.length}\n`;
      text += `Info: ${validation.infos.length}\n`;
      text += `Duration: ${validation.duration}ms\n`;
      text += `Timestamp: ${new Date(validation.timestamp).toLocaleString()}\n\n`;

      if (validation.errors.length > 0) {
        text += `ERRORS:\n`;
        text += `-------\n`;
        validation.errors.forEach((error: any, idx: number) => {
          text += `${idx + 1}. [${error.code}] ${error.message}\n`;
          if (error.path) text += `   Path: ${error.path}\n`;
          if (error.suggestion) text += `   Suggestion: ${error.suggestion}\n`;
          text += `\n`;
        });
      }

      if (validation.warnings.length > 0) {
        text += `WARNINGS:\n`;
        text += `---------\n`;
        validation.warnings.forEach((warning: any, idx: number) => {
          text += `${idx + 1}. [${warning.code}] ${warning.message}\n`;
          if (warning.path) text += `   Path: ${warning.path}\n`;
          if (warning.suggestion) text += `   Suggestion: ${warning.suggestion}\n`;
          text += `\n`;
        });
      }

      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", `attachment; filename="validation-report-${id}.txt"`);
      res.send(text);
    } else {
      res.status(400).json({ error: "Unsupported format. Use json, csv, or text." });
    }
  } catch (error) {
    console.error("Generate report error:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// GET /api/aasx/validation/presets - List available validation presets
router.get("/validation/presets", async (_req: Request, res: Response) => {
  try {
    const { validationEngine } = await import("../shared/aas-validation-engine.js");
    const presets = validationEngine.getPresets();
    res.json({ presets });
  } catch (error) {
    console.error("Get presets error:", error);
    res.status(500).json({ error: "Failed to get presets" });
  }
});

// GET /api/aasx/validation/rules - List available validation rules
router.get("/validation/rules", async (_req: Request, res: Response) => {
  try {
    const { validationEngine } = await import("../shared/aas-validation-engine.js");
    const rules = validationEngine.getRules();
    res.json({ rules });
  } catch (error) {
    console.error("Get rules error:", error);
    res.status(500).json({ error: "Failed to get rules" });
  }
});

// POST /api/aasx/validation/presets - Create custom preset
router.post("/validation/presets", async (req: Request, res: Response) => {
  try {
    const { preset } = req.body;

    if (!preset || !preset.id || !preset.name || !Array.isArray(preset.rules)) {
      res.status(400).json({ error: "Invalid preset data. Required: id, name, rules[]" });
      return;
    }

    const { presetManager } = await import("./src/services/validation-preset-manager.js");
    await presetManager.initialize();
    await presetManager.savePreset(preset);

    res.json({
      success: true,
      message: "Preset saved successfully",
      preset,
    });
  } catch (error) {
    console.error("Save preset error:", error);
    res.status(500).json({ error: "Failed to save preset" });
  }
});

// GET /api/aasx/validation/presets/:id - Get custom preset
router.get("/validation/presets/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { presetManager } = await import("./src/services/validation-preset-manager.js");
    await presetManager.initialize();

    const preset = await presetManager.getPreset(id);
    if (!preset) {
      res.status(404).json({ error: "Preset not found" });
      return;
    }

    res.json({ preset });
  } catch (error) {
    console.error("Get preset error:", error);
    res.status(500).json({ error: "Failed to get preset" });
  }
});

// DELETE /api/aasx/validation/presets/:id - Delete custom preset
router.delete("/validation/presets/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { presetManager } = await import("./src/services/validation-preset-manager.js");
    await presetManager.initialize();

    const deleted = await presetManager.deletePreset(id);
    if (!deleted) {
      res.status(404).json({ error: "Preset not found" });
      return;
    }

    res.json({
      success: true,
      message: "Preset deleted successfully",
    });
  } catch (error) {
    console.error("Delete preset error:", error);
    res.status(500).json({ error: "Failed to delete preset" });
  }
});

// GET /api/aasx/validation/presets/custom/list - List custom presets
router.get("/validation/presets/custom/list", async (_req: Request, res: Response) => {
  try {
    const { presetManager } = await import("./src/services/validation-preset-manager.js");
    await presetManager.initialize();

    const customPresets = await presetManager.loadPresets();
    res.json({ presets: customPresets });
  } catch (error) {
    console.error("List custom presets error:", error);
    res.status(500).json({ error: "Failed to list custom presets" });
  }
});

// ============================================================================
// Search Endpoints
// ============================================================================

// POST /api/aasx/:id/search/index - Index an environment for searching
router.post("/:id/search/index", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Load environment
    const envPath = path.join(process.cwd(), "data", "aasx", `${id}-environment.json`);
    const envData = await fs.readFile(envPath, "utf-8");
    const environment = JSON.parse(envData);

    // Index the environment
    const { aasSearchService } = await import("./src/services/aas-search-service.js");
    aasSearchService.indexEnvironment(id, environment);

    const indexSize = aasSearchService.getIndexSize(id);

    res.json({
      success: true,
      message: "Environment indexed successfully",
      indexSize,
    });
  } catch (error) {
    console.error("Index error:", error);
    res.status(500).json({ error: "Failed to index environment" });
  }
});

// POST /api/aasx/:id/search - Search within an indexed environment
router.post("/:id/search", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { filters, ...searchOptions } = req.body;

    if (!searchOptions.query) {
      res.status(400).json({ error: "Search query is required" });
      return;
    }

    const { aasSearchService } = await import("./src/services/aas-search-service.js");

    // Auto-index if not already indexed
    if (!aasSearchService.isIndexed(id)) {
      const envPath = path.join(process.cwd(), "data", "aasx", `${id}-environment.json`);
      const envData = await fs.readFile(envPath, "utf-8");
      const environment = JSON.parse(envData);
      aasSearchService.indexEnvironment(id, environment);
    }

    const startTime = performance.now();
    const results = aasSearchService.search(id, searchOptions, filters);
    const endTime = performance.now();

    const statistics = aasSearchService.getStatistics(id, searchOptions.query, results);
    statistics.searchTime = endTime - startTime;

    res.json({
      success: true,
      results,
      statistics,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

// GET /api/aasx/:id/search/status - Get search index status
router.get("/:id/search/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { aasSearchService } = await import("./src/services/aas-search-service.js");

    const isIndexed = aasSearchService.isIndexed(id);
    const indexSize = isIndexed ? aasSearchService.getIndexSize(id) : 0;

    res.json({
      success: true,
      isIndexed,
      indexSize,
    });
  } catch (error) {
    console.error("Search status error:", error);
    res.status(500).json({ error: "Failed to get search status" });
  }
});

// DELETE /api/aasx/:id/search/index - Clear search index for a file
router.delete("/:id/search/index", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { aasSearchService } = await import("./src/services/aas-search-service.js");

    aasSearchService.clearIndex(id);

    res.json({
      success: true,
      message: "Search index cleared successfully",
    });
  } catch (error) {
    console.error("Clear index error:", error);
    res.status(500).json({ error: "Failed to clear search index" });
  }
});

// POST /api/aasx/:id/search/by-value - Search by property value
router.post("/:id/search/by-value", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { value, ...options } = req.body;

    if (!value) {
      res.status(400).json({ error: "Value is required" });
      return;
    }

    const { aasSearchService } = await import("./src/services/aas-search-service.js");

    // Auto-index if not already indexed
    if (!aasSearchService.isIndexed(id)) {
      const envPath = path.join(process.cwd(), "data", "aasx", `${id}-environment.json`);
      const envData = await fs.readFile(envPath, "utf-8");
      const environment = JSON.parse(envData);
      aasSearchService.indexEnvironment(id, environment);
    }

    const startTime = performance.now();
    const results = aasSearchService.searchByPropertyValue(id, value, options);
    const endTime = performance.now();

    res.json({
      success: true,
      results,
      searchTime: endTime - startTime,
    });
  } catch (error) {
    console.error("Search by value error:", error);
    res.status(500).json({ error: "Search by value failed" });
  }
});

// POST /api/aasx/:id/search/by-id - Search by ID or idShort
router.post("/:id/search/by-id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { searchId, ...options } = req.body;

    if (!searchId) {
      res.status(400).json({ error: "Search ID is required" });
      return;
    }

    const { aasSearchService } = await import("./src/services/aas-search-service.js");

    // Auto-index if not already indexed
    if (!aasSearchService.isIndexed(id)) {
      const envPath = path.join(process.cwd(), "data", "aasx", `${id}-environment.json`);
      const envData = await fs.readFile(envPath, "utf-8");
      const environment = JSON.parse(envData);
      aasSearchService.indexEnvironment(id, environment);
    }

    const startTime = performance.now();
    const results = aasSearchService.searchById(id, searchId, options);
    const endTime = performance.now();

    res.json({
      success: true,
      results,
      searchTime: endTime - startTime,
    });
  } catch (error) {
    console.error("Search by ID error:", error);
    res.status(500).json({ error: "Search by ID failed" });
  }
});

// POST /api/aasx/:id/search/by-semantic-id - Search by semantic ID
router.post("/:id/search/by-semantic-id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { semanticId, ...options } = req.body;

    if (!semanticId) {
      res.status(400).json({ error: "Semantic ID is required" });
      return;
    }

    const { aasSearchService } = await import("./src/services/aas-search-service.js");

    // Auto-index if not already indexed
    if (!aasSearchService.isIndexed(id)) {
      const envPath = path.join(process.cwd(), "data", "aasx", `${id}-environment.json`);
      const envData = await fs.readFile(envPath, "utf-8");
      const environment = JSON.parse(envData);
      aasSearchService.indexEnvironment(id, environment);
    }

    const startTime = performance.now();
    const results = aasSearchService.searchBySemanticId(id, semanticId, options);
    const endTime = performance.now();

    res.json({
      success: true,
      results,
      searchTime: endTime - startTime,
    });
  } catch (error) {
    console.error("Search by semantic ID error:", error);
    res.status(500).json({ error: "Search by semantic ID failed" });
  }
});

// POST /api/aasx/:id/search/by-description - Search by description
router.post("/:id/search/by-description", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description, ...options } = req.body;

    if (!description) {
      res.status(400).json({ error: "Description is required" });
      return;
    }

    const { aasSearchService } = await import("./src/services/aas-search-service.js");

    // Auto-index if not already indexed
    if (!aasSearchService.isIndexed(id)) {
      const envPath = path.join(process.cwd(), "data", "aasx", `${id}-environment.json`);
      const envData = await fs.readFile(envPath, "utf-8");
      const environment = JSON.parse(envData);
      aasSearchService.indexEnvironment(id, environment);
    }

    const startTime = performance.now();
    const results = aasSearchService.searchByDescription(id, description, options);
    const endTime = performance.now();

    res.json({
      success: true,
      results,
      searchTime: endTime - startTime,
    });
  } catch (error) {
    console.error("Search by description error:", error);
    res.status(500).json({ error: "Search by description failed" });
  }
});

// ============================================================================
// Document Shelf Endpoint (VDI 2770 / IDTA Handover Documentation)
// ============================================================================

// GET /api/aasx/:id/documents - Parse VDI 2770 documents from the environment
router.get("/:id/documents", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Load environment
    const envPath = path.join(process.cwd(), "data", "aasx", `${id}-environment.json`);
    let environment;
    try {
      const data = await fs.readFile(envPath, "utf-8");
      environment = JSON.parse(data);
    } catch {
      res.status(404).json({ error: "Environment not found. File may not be parsed yet." });
      return;
    }

    const { defaultLang } = req.query;
    const lang = typeof defaultLang === "string" && defaultLang ? defaultLang : "en";

    const { DocumentEntityList } = await import("./src/models/document-entity.js");

    // Resolve which AAS references a given submodel (fallback: first AAS)
    const shells: any[] = environment.assetAdministrationShells || [];
    const resolveAasId = (submodelId: string): string => {
      for (const aas of shells) {
        const refs: any[] = aas.submodels || [];
        if (refs.some((ref) => ref?.keys?.some((k: any) => k.value === submodelId))) {
          return aas.id || "";
        }
      }
      return shells[0]?.id || "";
    };

    // A submodel may follow any VDI 2770 version; run each parser and de-duplicate
    const seen = new Set<string>();
    const documents: unknown[] = [];

    for (const submodel of environment.submodels || []) {
      const aasId = resolveAasId(submodel.id);
      const parsed = [
        ...DocumentEntityList.parseSubmodelForV10(id, aasId, submodel, lang),
        ...DocumentEntityList.parseSubmodelForV11(id, aasId, submodel, lang),
        ...DocumentEntityList.parseSubmodelForV12(id, aasId, submodel, lang),
      ];

      for (const entity of parsed) {
        if (entity.referableHash && seen.has(entity.referableHash)) {
          continue;
        }
        if (entity.referableHash) {
          seen.add(entity.referableHash);
        }
        // Return only the presentation fields the client shelf needs
        // (omit the heavy sourceElements* subtrees carried for C# parity).
        documents.push({
          smVersion: entity.smVersion,
          title: entity.title,
          organization: entity.organization,
          furtherInfo: entity.furtherInfo,
          countryCodes: entity.countryCodes,
          digitalFile: entity.digitalFile,
          previewFile: entity.previewFile,
          referableHash: entity.referableHash,
        });
      }
    }

    res.json({ documents });
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({ error: "Failed to parse documents" });
  }
});

// ============================================================================
// Element Management Endpoints
// ============================================================================

// POST /api/aasx/:id/submodel - Create new submodel
router.post("/:id/submodel", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const submodel = req.body;

    // Load environment
    const envPath = path.join(process.cwd(), "data", "aasx", `${id}-environment.json`);
    const envData = await fs.readFile(envPath, "utf-8");
    const environment = JSON.parse(envData);

    // Add submodel
    if (!environment.submodels) {
      environment.submodels = [];
    }
    environment.submodels.push(submodel);

    // Save environment
    await saveEnvironment(id, environment);

    res.json({
      success: true,
      submodel,
    });
  } catch (error) {
    console.error("Create submodel error:", error);
    res.status(500).json({ error: "Failed to create submodel" });
  }
});

// POST /api/aasx/:id/submodel/:submodelId/element - Create new element in submodel
router.post("/:id/submodel/:submodelId/element", async (req: Request, res: Response) => {
  try {
    const { id, submodelId } = req.params;
    const element = req.body;

    // Load environment
    const envPath = path.join(process.cwd(), "data", "aasx", `${id}-environment.json`);
    const envData = await fs.readFile(envPath, "utf-8");
    const environment = JSON.parse(envData);

    // Find submodel
    const submodel = environment.submodels?.find((sm: any) => sm.id === submodelId);
    if (!submodel) {
      res.status(404).json({ error: "Submodel not found" });
      return;
    }

    // Add element
    if (!submodel.submodelElements) {
      submodel.submodelElements = [];
    }
    submodel.submodelElements.push(element);

    // Save environment
    await saveEnvironment(id, environment);

    res.json({
      success: true,
      element,
    });
  } catch (error) {
    console.error("Create element error:", error);
    res.status(500).json({ error: "Failed to create element" });
  }
});

// DELETE /api/aasx/:id/submodel/:submodelId - Delete submodel
router.delete("/:id/submodel/:submodelId", async (req: Request, res: Response) => {
  try {
    const { id, submodelId } = req.params;

    // Load environment
    const envPath = path.join(process.cwd(), "data", "aasx", `${id}-environment.json`);
    const envData = await fs.readFile(envPath, "utf-8");
    const environment = JSON.parse(envData);

    // Find and remove submodel
    const index = environment.submodels?.findIndex((sm: any) => sm.id === submodelId);
    if (index === undefined || index === -1) {
      res.status(404).json({ error: "Submodel not found" });
      return;
    }

    environment.submodels.splice(index, 1);

    // Save environment
    await saveEnvironment(id, environment);

    res.json({
      success: true,
      message: "Submodel deleted successfully",
    });
  } catch (error) {
    console.error("Delete submodel error:", error);
    res.status(500).json({ error: "Failed to delete submodel" });
  }
});

// DELETE /api/aasx/:id/submodel/:submodelId/element/:elementIdShort - Delete element
router.delete("/:id/submodel/:submodelId/element/:elementIdShort", async (req: Request, res: Response) => {
  try {
    const { id, submodelId, elementIdShort } = req.params;

    // Load environment
    const envPath = path.join(process.cwd(), "data", "aasx", `${id}-environment.json`);
    const envData = await fs.readFile(envPath, "utf-8");
    const environment = JSON.parse(envData);

    // Find submodel
    const submodel = environment.submodels?.find((sm: any) => sm.id === submodelId);
    if (!submodel) {
      res.status(404).json({ error: "Submodel not found" });
      return;
    }

    // Find and remove element
    const index = submodel.submodelElements?.findIndex((el: any) => el.idShort === elementIdShort);
    if (index === undefined || index === -1) {
      res.status(404).json({ error: "Element not found" });
      return;
    }

    submodel.submodelElements.splice(index, 1);

    // Save environment
    await saveEnvironment(id, environment);

    res.json({
      success: true,
      message: "Element deleted successfully",
    });
  } catch (error) {
    console.error("Delete element error:", error);
    res.status(500).json({ error: "Failed to delete element" });
  }
});

// POST /api/aasx/:id/element/duplicate - Duplicate an element
router.post("/:id/element/duplicate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { submodelId, elementIdShort } = req.body;

    // Load environment
    const envPath = path.join(process.cwd(), "data", "aasx", `${id}-environment.json`);
    const envData = await fs.readFile(envPath, "utf-8");
    const environment = JSON.parse(envData);

    // Find submodel
    const submodel = environment.submodels?.find((sm: any) => sm.id === submodelId);
    if (!submodel) {
      res.status(404).json({ error: "Submodel not found" });
      return;
    }

    // Find element
    const element = submodel.submodelElements?.find((el: any) => el.idShort === elementIdShort);
    if (!element) {
      res.status(404).json({ error: "Element not found" });
      return;
    }

    // Duplicate element
    const duplicate = JSON.parse(JSON.stringify(element));
    duplicate.idShort = `${element.idShort}_copy`;

    // Add duplicate
    submodel.submodelElements.push(duplicate);

    // Save environment
    await saveEnvironment(id, environment);

    res.json({
      success: true,
      element: duplicate,
    });
  } catch (error) {
    console.error("Duplicate element error:", error);
    res.status(500).json({ error: "Failed to duplicate element" });
  }
});

// ============================================================================
// Export Endpoints
// ============================================================================

// GET /api/aasx/:id/export/json - Export to JSON
router.get("/:id/export/json", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pretty } = req.query;

    // Load environment
    const envPath = path.join(process.cwd(), "data", "aasx", `${id}-environment.json`);
    const envData = await fs.readFile(envPath, "utf-8");
    const environment = JSON.parse(envData);

    const { exportService } = await import("./src/services/export-service.js");
    const json = exportService.exportToJSON(environment, pretty === "true");

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${id}.json"`);
    res.send(json);
  } catch (error) {
    console.error("Export JSON error:", error);
    res.status(500).json({ error: "Failed to export JSON" });
  }
});

// GET /api/aasx/:id/export/csv - Export to CSV
router.get("/:id/export/csv", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    // Load environment
    const envPath = path.join(process.cwd(), "data", "aasx", `${id}-environment.json`);
    const envData = await fs.readFile(envPath, "utf-8");
    const environment = JSON.parse(envData);

    const { exportService } = await import("./src/services/export-service.js");
    const csv =
      type === "properties"
        ? exportService.exportPropertiesToCSV(environment)
        : exportService.exportToCSV(environment);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${id}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error("Export CSV error:", error);
    res.status(500).json({ error: "Failed to export CSV" });
  }
});

// GET /api/aasx/:id/export/metadata - Get export metadata
router.get("/:id/export/metadata", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Load environment
    const envPath = path.join(process.cwd(), "data", "aasx", `${id}-environment.json`);
    const envData = await fs.readFile(envPath, "utf-8");
    const environment = JSON.parse(envData);

    const { exportService } = await import("./src/services/export-service.js");
    const metadata = exportService.createExportMetadata(environment);

    res.json({
      success: true,
      metadata,
    });
  } catch (error) {
    console.error("Export metadata error:", error);
    res.status(500).json({ error: "Failed to get export metadata" });
  }
});

// ============================================================================
// Excel Export/Import Endpoints
// ============================================================================

// GET /api/aasx/:id/export/excel - Export environment to Excel
router.get("/:id/export/excel", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { includeMetadata, multiLanguage } = req.query;

    // Load environment
    const envPath = path.join(process.cwd(), "data", "aasx", `${id}-environment.json`);
    const envData = await fs.readFile(envPath, "utf-8");
    const environment = JSON.parse(envData);

    const excelService = new ExcelExportService();
    const buffer = await excelService.exportEnvironment(environment, {
      includeMetadata: includeMetadata === 'true',
      multiLanguage: multiLanguage === 'true',
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${id}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error("Excel export error:", error);
    res.status(500).json({ error: "Failed to export to Excel" });
  }
});

// GET /api/aasx/:id/submodel/:submodelId/export/csv - Export submodel to CSV
router.get("/:id/submodel/:submodelId/export/csv", async (req: Request, res: Response) => {
  try {
    const { id, submodelId } = req.params;
    const { delimiter } = req.query;

    // Load environment
    const envPath = path.join(process.cwd(), "data", "aasx", `${id}-environment.json`);
    const envData = await fs.readFile(envPath, "utf-8");
    const environment = JSON.parse(envData);

    // Find submodel
    const submodel = environment.submodels?.find((sm: any) => sm.id === submodelId);
    if (!submodel) {
      res.status(404).json({ error: "Submodel not found" });
      return;
    }

    const csvService = new CsvExportService();
    const csv = csvService.exportSubmodel(submodel, {
      delimiter: delimiter as ',' | ';' | '\t' || ',',
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${submodel.idShort || submodelId}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error("CSV export error:", error);
    res.status(500).json({ error: "Failed to export to CSV" });
  }
});

// POST /api/aasx/:id/import/excel - Import properties from Excel
router.post("/:id/import/excel", upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const importService = new ExcelImportService();
    const result = await importService.importProperties(file.buffer);

    if (!result.success) {
      res.status(400).json({ 
        error: "Import validation failed",
        errors: result.errors 
      });
      return;
    }

    // Load environment
    const envPath = path.join(process.cwd(), "data", "aasx", `${id}-environment.json`);
    const envData = await fs.readFile(envPath, "utf-8");
    const environment = JSON.parse(envData);

    // Apply updates (this would need to be implemented in update-service)
    // For now, return the updates for preview
    res.json({
      success: true,
      updatesCount: result.updates?.length || 0,
      updates: result.updates,
      message: "Import validated successfully. Apply updates to save changes."
    });
  } catch (error) {
    console.error("Excel import error:", error);
    res.status(500).json({ error: "Failed to import from Excel" });
  }
});

export default router;
