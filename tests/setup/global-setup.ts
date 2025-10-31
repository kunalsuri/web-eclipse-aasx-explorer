import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

// Global test lifecycle hooks
beforeAll(() => {
  // Setup that runs once before all tests
  // Suppress console warnings in tests unless explicitly needed
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args: any[]) => {
    // Filter out known warnings
    const message = args[0]?.toString() || '';
    if (message.includes('ReactDOM.render')) return;
    if (message.includes('act()')) return;
    originalWarn.apply(console, args);
  };
  
  console.error = (...args: any[]) => {
    // Filter out known errors
    const message = args[0]?.toString() || '';
    if (message.includes('Not implemented: HTMLFormElement.prototype.submit')) return;
    originalError.apply(console, args);
  };
});

afterAll(() => {
  // Cleanup that runs once after all tests
});

beforeEach(() => {
  // Reset state before each test
  // Clear all mocks
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks();
});
