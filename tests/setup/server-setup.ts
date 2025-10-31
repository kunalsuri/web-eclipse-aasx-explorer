import { vi } from 'vitest';
import path from 'path';

// Mock file system operations for server tests
// This can be extended as needed for specific test requirements

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.DATA_DIR = path.join(process.cwd(), 'data', 'aasx');

// Mock console methods for cleaner test output
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;

// Suppress logs in tests unless explicitly needed
console.log = (...args: any[]) => {
  if (process.env.DEBUG_TESTS) {
    originalConsoleLog.apply(console, args);
  }
};

console.info = (...args: any[]) => {
  if (process.env.DEBUG_TESTS) {
    originalConsoleInfo.apply(console, args);
  }
};
