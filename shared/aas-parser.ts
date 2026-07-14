/**
 * AASX Package Parser
 * Parses AASX files (ZIP format) and extracts AAS environment data
 */

import JSZip from "jszip";
import type { Environment } from "./aas-v3-types";
import { deserializeEnvironment } from "./aas-serialization";
import { parseAasXmlEnvironment } from "./aas-xml-migration";

// ============================================================================
// Types
// ============================================================================

export interface AasxPackage {
    environment: Environment;
    files: AasxFile[];
    metadata: AasxMetadata;
}

export interface AasxFile {
    path: string;
    content: Uint8Array;
    mimeType?: string;
}

export interface AasxMetadata {
    fileName: string;
    fileSize: number;
    parsedAt: string;
    hasXml: boolean;
    hasJson: boolean;
    fileCount: number;
}

export interface ParseOptions {
    validateOnParse?: boolean;
    extractFiles?: boolean;
    maxFileSize?: number; // in bytes
}

export interface ParseResult {
    success: boolean;
    package?: AasxPackage;
    error?: string;
}

// ============================================================================
// AASX Parser
// ============================================================================

/**
 * Parse an AASX file from a buffer
 */
export async function parseAasxBuffer(
    buffer: ArrayBuffer,
    fileName: string = "unknown.aasx",
    options: ParseOptions = {}
): Promise<ParseResult> {
    try {
        const {
            extractFiles = true,
            maxFileSize = 200 * 1024 * 1024, // 200MB default
        } = options;

        // Check file size
        if (buffer.byteLength > maxFileSize) {
            return {
                success: false,
                error: `File size (${buffer.byteLength} bytes) exceeds maximum allowed size (${maxFileSize} bytes)`,
            };
        }

        // Load ZIP file
        const zip = await JSZip.loadAsync(buffer);

        // Find AAS environment file (XML or JSON)
        const envFile = await findEnvironmentFile(zip);
        if (!envFile) {
            return {
                success: false,
                error: "No AAS environment file found in AASX package",
            };
        }

        // Parse environment
        const environment = await parseEnvironmentFile(zip, envFile);

        // Extract supplementary files
        const files: AasxFile[] = [];
        if (extractFiles) {
            const extractedFiles = await extractSupplementaryFiles(zip);
            files.push(...extractedFiles);
        }

        // Create metadata
        const metadata: AasxMetadata = {
            fileName,
            fileSize: buffer.byteLength,
            parsedAt: new Date().toISOString(),
            hasXml: envFile.type === "xml",
            hasJson: envFile.type === "json",
            fileCount: Object.keys(zip.files).length,
        };

        return {
            success: true,
            package: {
                environment,
                files,
                metadata,
            },
        };
    } catch (error) {
        return {
            success: false,
            error: `Failed to parse AASX: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}

/**
 * Parse an AASX file from a File object (browser)
 */
export async function parseAasxFile(
    file: File,
    options: ParseOptions = {}
): Promise<ParseResult> {
    try {
        const buffer = await file.arrayBuffer();
        return parseAasxBuffer(buffer, file.name, options);
    } catch (error) {
        return {
            success: false,
            error: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}

// ============================================================================
// Internal Functions
// ============================================================================

interface EnvironmentFileInfo {
    path: string;
    type: "xml" | "json";
}

/**
 * Find the AAS environment file in the AASX package
 */
async function findEnvironmentFile(
    zip: JSZip
): Promise<EnvironmentFileInfo | null> {
    // Common paths for actual AAS environment package parts. `aasx/aasx-origin`
    // is an OPC marker that points to relationships; it is not environment XML.
    const commonPaths = [
        "aasx/json/content.json",
        "content.json",
        "aasx/aas/aas.aas.xml",
        "aasx/xml/content.xml",
        "content.xml",
    ];

    // Check common paths first, but validate their contents rather than trusting
    // an extension or conventional name.
    for (const path of commonPaths) {
        const file = zip.file(path);
        if (file && !zip.files[path].dir) {
            const type = path.endsWith(".json") ? "json" : "xml";
            const content = await file.async("string");
            if (isEnvironmentContent(content, type)) return { path, type };
        }
    }

    const files = Object.keys(zip.files).filter((path) => !zip.files[path].dir);

    // Prefer a valid JSON environment when both representations are present.
    for (const path of files) {
        if (path.toLowerCase().endsWith(".json")) {
            const content = await zip.file(path)?.async("string");
            if (content && isEnvironmentContent(content, "json")) {
                return { path, type: "json" };
            }
        }
    }

    for (const path of files) {
        if (path.toLowerCase().endsWith(".xml")) {
            const content = await zip.file(path)?.async("string");
            if (content && isEnvironmentContent(content, "xml")) {
                return { path, type: "xml" };
            }
        }
    }

    return null;
}

function isEnvironmentContent(content: string, type: "xml" | "json"): boolean {
    if (type === "xml") {
        return /<(?:[A-Za-z_][\w.-]*:)?(?:aasenv|aasEnvironment|environment)\b/i.test(
            content
        );
    }

    try {
        const parsed = JSON.parse(content);
        const environment = parsed.environment ?? parsed;
        return Boolean(
            environment &&
            typeof environment === "object" &&
            (Array.isArray(environment.assetAdministrationShells) ||
                Array.isArray(environment.submodels) ||
                Array.isArray(environment.conceptDescriptions))
        );
    } catch {
        return false;
    }
}

/**
 * Parse the environment file (XML or JSON)
 */
async function parseEnvironmentFile(
    zip: JSZip,
    fileInfo: EnvironmentFileInfo
): Promise<Environment> {
    const file = zip.file(fileInfo.path);
    if (!file) {
        throw new Error(`Environment file not found: ${fileInfo.path}`);
    }

    const content = await file.async("string");

    if (fileInfo.type === "json") {
        return parseJsonEnvironment(content);
    } else {
        return parseXmlEnvironment(content);
    }
}

/**
 * Parse JSON environment
 */
function parseJsonEnvironment(content: string): Environment {
    try {
        return deserializeEnvironment(content);
    } catch (error) {
        throw new Error(
            `Failed to parse JSON environment: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * Parse XML environment
 */
function parseXmlEnvironment(content: string): Environment {
    try {
        return parseAasXmlEnvironment(content);
    } catch (error) {
        throw new Error(
            `Failed to parse XML environment: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * Extract supplementary files from AASX package
 */
async function extractSupplementaryFiles(zip: JSZip): Promise<AasxFile[]> {
    const files: AasxFile[] = [];

    // Get all files except the environment file
    const zipFiles = Object.keys(zip.files).filter(
        (path) =>
            !zip.files[path].dir &&
            !path.endsWith(".xml") &&
            !path.endsWith(".json") &&
            !path.includes("_rels") &&
            !path.includes("[Content_Types]")
    );

    for (const path of zipFiles) {
        try {
            const file = zip.file(path);
            if (file) {
                const content = await file.async("uint8array");
                const mimeType = guessMimeType(path);

                files.push({
                    path,
                    content,
                    mimeType,
                });
            }
        } catch (error) {
            console.warn(`Failed to extract file ${path}:`, error);
        }
    }

    return files;
}

/**
 * Guess MIME type from file extension
 */
function guessMimeType(path: string): string {
    const ext = path.split(".").pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
        pdf: "application/pdf",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
        svg: "image/svg+xml",
        txt: "text/plain",
        html: "text/html",
        css: "text/css",
        js: "application/javascript",
        json: "application/json",
        xml: "application/xml",
        zip: "application/zip",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xls: "application/vnd.ms-excel",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };

    return mimeTypes[ext || ""] || "application/octet-stream";
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a buffer is a valid AASX file (ZIP format)
 */
export async function isValidAasxBuffer(buffer: ArrayBuffer): Promise<boolean> {
    try {
        const zip = await JSZip.loadAsync(buffer);
        const envFile = await findEnvironmentFile(zip);
        return envFile !== null;
    } catch {
        return false;
    }
}

/**
 * Get AASX package info without full parsing
 */
export async function getAasxInfo(
    buffer: ArrayBuffer
): Promise<{ fileCount: number; hasXml: boolean; hasJson: boolean } | null> {
    try {
        const zip = await JSZip.loadAsync(buffer);
        const envFile = await findEnvironmentFile(zip);

        if (!envFile) {
            return null;
        }

        return {
            fileCount: Object.keys(zip.files).length,
            hasXml: envFile.type === "xml",
            hasJson: envFile.type === "json",
        };
    } catch {
        return null;
    }
}

/**
 * Extract only the environment without supplementary files
 */
export async function parseAasxEnvironmentOnly(
    buffer: ArrayBuffer
): Promise<ParseResult> {
    return parseAasxBuffer(buffer, "unknown.aasx", { extractFiles: false });
}
