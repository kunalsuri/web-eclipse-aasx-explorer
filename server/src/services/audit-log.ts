/**
 * Audit Log Service
 * Tracks all edit operations for compliance and history
 */

import fs from 'fs/promises';
import path from 'path';

export interface AuditLogEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly userId: string;
  readonly userName?: string;
  readonly action: 'create' | 'update' | 'delete';
  readonly resourceType: 'property' | 'submodel' | 'aas' | 'environment';
  readonly resourceId: string;
  readonly changes?: {
    readonly field: string;
    readonly oldValue: any;
    readonly newValue: any;
  }[];
  readonly metadata?: Record<string, any>;
}

export class AuditLogService {
  private readonly logDir: string;

  constructor(logDir: string = './data/logs/audit') {
    this.logDir = logDir;
  }

  /**
   * Log an edit operation
   */
  async logEdit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const logEntry: AuditLogEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };

    const logFile = this.getLogFilePath(new Date());
    await this.appendToLog(logFile, logEntry);
  }

  /**
   * Get edit history for a resource
   */
  async getHistory(resourceId: string, limit = 50): Promise<AuditLogEntry[]> {
    const entries: AuditLogEntry[] = [];
    const files = await this.getLogFiles();

    // Read log files in reverse chronological order
    for (const file of files.reverse()) {
      const fileEntries = await this.readLogFile(file);
      const matching = fileEntries.filter((e) => e.resourceId === resourceId);
      entries.push(...matching);

      if (entries.length >= limit) {
        break;
      }
    }

    return entries.slice(0, limit);
  }

  /**
   * Get all edits by a user
   */
  async getUserHistory(userId: string, limit = 50): Promise<AuditLogEntry[]> {
    const entries: AuditLogEntry[] = [];
    const files = await this.getLogFiles();

    for (const file of files.reverse()) {
      const fileEntries = await this.readLogFile(file);
      const matching = fileEntries.filter((e) => e.userId === userId);
      entries.push(...matching);

      if (entries.length >= limit) {
        break;
      }
    }

    return entries.slice(0, limit);
  }

  /**
   * Get edits within a time range
   */
  async getHistoryByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<AuditLogEntry[]> {
    const entries: AuditLogEntry[] = [];
    const files = await this.getLogFiles();

    for (const file of files) {
      const fileDate = this.extractDateFromFilename(file);
      if (fileDate >= startDate && fileDate <= endDate) {
        const fileEntries = await this.readLogFile(file);
        entries.push(...fileEntries);
      }
    }

    return entries.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Revert to a previous version
   */
  async revertToVersion(resourceId: string, versionTimestamp: string): Promise<AuditLogEntry | null> {
    const history = await this.getHistory(resourceId, 1000);
    return history.find((e) => e.timestamp === versionTimestamp) || null;
  }

  /**
   * Generate unique ID for log entry
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get log file path for a date
   */
  private getLogFilePath(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return path.join(this.logDir, `${year}-${month}-${day}.jsonl`);
  }

  /**
   * Append entry to log file (JSONL format)
   */
  private async appendToLog(filePath: string, entry: AuditLogEntry): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    const line = JSON.stringify(entry) + '\n';
    await fs.appendFile(filePath, line, 'utf-8');
  }

  /**
   * Read all entries from a log file
   */
  private async readLogFile(filePath: string): Promise<AuditLogEntry[]> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      return lines.map((line) => JSON.parse(line) as AuditLogEntry);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get all log files
   */
  private async getLogFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.logDir);
      return files
        .filter((f) => f.endsWith('.jsonl'))
        .map((f) => path.join(this.logDir, f))
        .sort();
    } catch (error) {
      return [];
    }
  }

  /**
   * Extract date from log filename
   */
  private extractDateFromFilename(filename: string): Date {
    const basename = path.basename(filename, '.jsonl');
    return new Date(basename);
  }
}

// Singleton instance
export const auditLog = new AuditLogService();
