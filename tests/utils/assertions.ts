import { expect } from 'vitest';
import type { ValidationResult, ValidationError } from '@shared/aas-validation';

/**
 * Assert that validation result has no errors
 */
export function expectNoValidationErrors(result: ValidationResult) {
  if (result.errors.length > 0) {
    const errorMessages = result.errors.map(e => `${e.path}: ${e.message}`).join('\n');
    throw new Error(`Expected no validation errors but got:\n${errorMessages}`);
  }
  expect(result.errors).toHaveLength(0);
  expect(result.isValid).toBe(true);
}

/**
 * Assert that validation result has specific error
 */
export function expectValidationError(
  result: ValidationResult,
  errorCode: string,
  path?: string
) {
  const error = result.errors.find(e => e.code === errorCode);
  
  if (!error) {
    const availableErrors = result.errors.map(e => e.code || 'no-code').join(', ');
    throw new Error(
      `Expected validation error with code "${errorCode}" but found: ${availableErrors || 'none'}`
    );
  }
  
  expect(error).toBeDefined();
  
  if (path) {
    expect(error.path).toBe(path);
  }
}

/**
 * Assert that validation result has error at specific path
 */
export function expectValidationErrorAtPath(
  result: ValidationResult,
  path: string
) {
  const error = result.errors.find(e => e.path === path);
  
  if (!error) {
    const availablePaths = result.errors.map(e => e.path).join(', ');
    throw new Error(
      `Expected validation error at path "${path}" but found errors at: ${availablePaths || 'none'}`
    );
  }
  
  expect(error).toBeDefined();
}

/**
 * Assert that validation result has specific number of errors
 */
export function expectValidationErrorCount(
  result: ValidationResult,
  count: number
) {
  expect(result.errors).toHaveLength(count);
}

/**
 * Assert that validation result has warnings
 */
export function expectValidationWarnings(result: ValidationResult) {
  expect(result.warnings.length).toBeGreaterThan(0);
}

/**
 * Assert that validation result has no warnings
 */
export function expectNoValidationWarnings(result: ValidationResult) {
  if (result.warnings.length > 0) {
    const warningMessages = result.warnings.map(w => `${w.path}: ${w.message}`).join('\n');
    throw new Error(`Expected no validation warnings but got:\n${warningMessages}`);
  }
  expect(result.warnings).toHaveLength(0);
}

/**
 * Assert that array contains element with property
 */
export function expectArrayContainsWhere<T>(
  array: T[],
  predicate: (item: T) => boolean,
  message?: string
) {
  const found = array.some(predicate);
  if (!found) {
    throw new Error(message || 'Expected array to contain element matching predicate');
  }
  expect(found).toBe(true);
}

/**
 * Assert that array does not contain element with property
 */
export function expectArrayNotContainsWhere<T>(
  array: T[],
  predicate: (item: T) => boolean,
  message?: string
) {
  const found = array.some(predicate);
  if (found) {
    throw new Error(message || 'Expected array to not contain element matching predicate');
  }
  expect(found).toBe(false);
}

/**
 * Assert that execution time is within limit
 */
export function expectPerformance(duration: number, maxMs: number) {
  if (duration >= maxMs) {
    throw new Error(
      `Expected execution time to be less than ${maxMs}ms but was ${duration.toFixed(2)}ms`
    );
  }
  expect(duration).toBeLessThan(maxMs);
}

/**
 * Assert that execution time is at least a minimum
 */
export function expectMinimumDuration(duration: number, minMs: number) {
  expect(duration).toBeGreaterThanOrEqual(minMs);
}

/**
 * Assert that object has all required properties
 */
export function expectRequiredProperties<T extends object>(
  obj: T,
  properties: (keyof T)[]
) {
  properties.forEach(prop => {
    if (!(prop in obj)) {
      throw new Error(`Expected object to have property "${String(prop)}"`);
    }
    expect(obj).toHaveProperty(prop);
  });
}

/**
 * Assert that object matches partial structure
 */
export function expectPartialMatch<T extends object>(
  actual: T,
  expected: Partial<T>
) {
  Object.keys(expected).forEach(key => {
    expect(actual).toHaveProperty(key);
    expect((actual as any)[key]).toEqual((expected as any)[key]);
  });
}

/**
 * Assert that string matches pattern
 */
export function expectStringMatches(
  actual: string,
  pattern: RegExp,
  message?: string
) {
  if (!pattern.test(actual)) {
    throw new Error(
      message || `Expected "${actual}" to match pattern ${pattern}`
    );
  }
  expect(actual).toMatch(pattern);
}

/**
 * Assert that value is within range
 */
export function expectInRange(
  value: number,
  min: number,
  max: number
) {
  if (value < min || value > max) {
    throw new Error(
      `Expected ${value} to be between ${min} and ${max}`
    );
  }
  expect(value).toBeGreaterThanOrEqual(min);
  expect(value).toBeLessThanOrEqual(max);
}

/**
 * Assert that async function throws specific error
 */
export async function expectAsyncError(
  fn: () => Promise<any>,
  errorMessage?: string | RegExp
) {
  try {
    await fn();
    throw new Error('Expected function to throw but it did not');
  } catch (error: any) {
    if (errorMessage) {
      if (typeof errorMessage === 'string') {
        expect(error.message).toContain(errorMessage);
      } else {
        expect(error.message).toMatch(errorMessage);
      }
    }
  }
}

/**
 * Assert that value is defined (not null or undefined)
 */
export function expectDefined<T>(value: T | null | undefined): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error('Expected value to be defined but got null or undefined');
  }
  expect(value).toBeDefined();
}

/**
 * Assert that arrays have same elements (order independent)
 */
export function expectSameElements<T>(
  actual: T[],
  expected: T[]
) {
  expect(actual).toHaveLength(expected.length);
  expected.forEach(item => {
    expect(actual).toContain(item);
  });
}
