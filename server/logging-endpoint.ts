/**
 * Server-side Logging Endpoint
 * 
 * Provides an API endpoint that browser clients can POST logs to
 * for server-side file persistence. This solves the browser file
 * access limitation while providing centralized logging.
 */

import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

/**
 * Convert LogLevel enum to string name
 */
function getLevelName(level: number | string): string {
  if (typeof level === 'string') return level;
  
  const levelMap: Record<number, string> = {
    0: 'debug',
    1: 'info', 
    2: 'warn',
    3: 'error',
    4: 'fatal'
  };
  
  return levelMap[level] || 'info';
}

interface LogEntry {
  timestamp: string;
  level: number | string; // Support both LogLevel enum and string
  levelName?: string;     // Preferred string representation
  message: string;
  component?: string;
  metadata?: any;
}

/**
 * POST /api/logs - Accept log entries from browser clients
 */
export async function handleLogSubmission(req: Request, res: Response) {
  try {
    const entries: LogEntry[] = req.body.logs || [req.body];
    
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'Invalid log entries' });
    }

    // Process each log entry
    for (const entry of entries) {
      await writeLogToFile(entry);
    }

    res.json({ 
      success: true, 
      processed: entries.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[LogEndpoint] Failed to process logs:', error);
    res.status(500).json({ error: 'Failed to write logs' });
  }
}

/**
 * Write log entry to appropriate file
 */
async function writeLogToFile(entry: LogEntry): Promise<void> {
  const logsDir = path.resolve(process.cwd(), 'logs');
  
  // Ensure logs directory exists
  try {
    await fs.mkdir(logsDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, check if it's accessible
    if (error && typeof error === 'object' && 'code' in error && error.code !== 'EEXIST') {
      throw error;
    }
  }

  // Determine file name based on level and date
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Handle both LogLevel enum (number) and string formats
  const levelName = entry.levelName || getLevelName(entry.level);
  const level = levelName.toLowerCase();
  const fileName = `${level}-${date}.log`;
  const filePath = path.join(logsDir, fileName);

  // Format log entry as JSON line
  const logLine = JSON.stringify({
    timestamp: entry.timestamp,
    level: levelName.toUpperCase(),
    message: entry.message,
    component: entry.component,
    metadata: entry.metadata,
  }) + '\n';

  // Append to file
  await fs.appendFile(filePath, logLine, 'utf8');
}

/**
 * GET /api/logs - Retrieve recent log entries (for debugging)
 */
export async function handleLogRetrieval(req: Request, res: Response) {
  try {
    const logsDir = path.resolve(process.cwd(), 'logs');
    const { level = 'all', lines = '100' } = req.query;
    
    const files = await fs.readdir(logsDir);
    const logFiles = files
      .filter(file => file.endsWith('.log'))
      .filter(file => level === 'all' || file.startsWith(level as string));

    const logs: any[] = [];
    
    for (const file of logFiles.slice(-3)) { // Last 3 files
      const filePath = path.join(logsDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      const fileLines = content.split('\n')
        .filter(Boolean)
        .slice(-parseInt(lines as string, 10))
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return { raw: line };
          }
        });
      
      logs.push(...fileLines);
    }

    // Sort by timestamp
    logs.sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());

    res.json({
      logs: logs.slice(-parseInt(lines as string, 10)),
      total: logs.length,
      files: logFiles.length,
    });
    
  } catch (error) {
    console.error('[LogEndpoint] Failed to retrieve logs:', error);
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
}