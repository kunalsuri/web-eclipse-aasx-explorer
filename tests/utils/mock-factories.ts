import { vi } from 'vitest';
import type { Request, Response } from 'express';

/**
 * Create a mock file system for testing
 */
export function createMockFileSystem() {
  return {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    unlink: vi.fn(),
    mkdir: vi.fn(),
    readdir: vi.fn(),
    access: vi.fn(),
    stat: vi.fn(),
    rm: vi.fn(),
  };
}

/**
 * Create a mock HTTP request
 */
export function createMockRequest(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    params: {},
    query: {},
    body: {},
    headers: {},
    method: 'GET',
    url: '/',
    path: '/',
    ...overrides,
  };
}

/**
 * Create a mock HTTP response
 */
export function createMockResponse(): Partial<Response> {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
    sendStatus: vi.fn().mockReturnThis(),
  };
  return res;
}

/**
 * Create a mock Express next function
 */
export function createMockNext() {
  return vi.fn();
}

/**
 * Create a mock React component
 */
export function createMockComponent(name: string) {
  const component = vi.fn(() => null);
  component.mockName(name);
  return component;
}

/**
 * Create a mock logger
 */
export function createMockLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

/**
 * Create a mock validation result
 */
export function createMockValidationResult(isValid: boolean = true, errors: any[] = []) {
  return {
    isValid,
    errors,
    warnings: [],
  };
}

/**
 * Create a mock environment data
 */
export function createMockEnvironmentData() {
  return {
    assetAdministrationShells: [],
    submodels: [],
    conceptDescriptions: [],
  };
}

/**
 * Create a mock file upload (multer)
 */
export function createMockFile(overrides: Partial<Express.Multer.File> = {}): Partial<Express.Multer.File> {
  return {
    fieldname: 'file',
    originalname: 'test.aasx',
    encoding: '7bit',
    mimetype: 'application/octet-stream',
    size: 1024,
    buffer: Buffer.from('test'),
    ...overrides,
  } as any;
}

/**
 * Create a mock WebSocket
 */
export function createMockWebSocket() {
  return {
    send: vi.fn(),
    close: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    readyState: 1, // OPEN
  };
}

/**
 * Create a mock query client (React Query)
 */
export function createMockQueryClient() {
  return {
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    refetchQueries: vi.fn(),
  };
}

/**
 * Create a mock store (Zustand)
 */
export function createMockStore<T>(initialState: T) {
  const state = { ...initialState };
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    setState: (partial: Partial<T>) => {
      Object.assign(state, partial);
      listeners.forEach(listener => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/**
 * Create a mock router (wouter)
 */
export function createMockRouter() {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    location: '/',
  };
}

/**
 * Create a mock toast
 */
export function createMockToast() {
  return {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  };
}
