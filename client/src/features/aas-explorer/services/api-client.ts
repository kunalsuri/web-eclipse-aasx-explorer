/**
 * API Client
 * Centralized HTTP client for backend API communication
 * 
 * Features:
 * - Type-safe request/response handling
 * - Automatic error handling
 * - Retry logic for transient failures
 * - Request/response interceptors
 */

export interface ApiResponse<T = any> {
  readonly success: boolean;
  readonly data?: T;
  readonly message?: string;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly errors?: string[];
  };
}

export interface RequestOptions {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly headers?: Record<string, string>;
  readonly body?: any;
  readonly expectedVersion?: number;
  readonly retries?: number;
  readonly timeout?: number;
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly errors?: string[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: string[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class ApiClient {
  private readonly baseUrl: string;
  private readonly defaultTimeout = 30000; // 30 seconds
  private readonly maxRetries = 3;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  }

  /**
   * Make an API request
   */
  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      expectedVersion,
      retries = this.maxRetries,
      timeout = this.defaultTimeout,
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add version header for optimistic locking
    if (expectedVersion !== undefined) {
      requestHeaders['If-Match'] = String(expectedVersion);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data: ApiResponse<T> = await response.json();

      // Handle error responses
      if (!response.ok) {
        return this.handleErrorResponse(response.status, data, retries, endpoint, options);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle network errors with retry
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new NetworkError('Request timeout');
        }

        // Retry on network errors
        if (retries > 0) {
          await this.delay(1000); // Wait 1 second before retry
          return this.request<T>(endpoint, { ...options, retries: retries - 1 });
        }

        throw new NetworkError('Network request failed', error);
      }

      throw error;
    }
  }

  /**
   * Handle error responses
   */
  private async handleErrorResponse<T>(
    status: number,
    data: ApiResponse<T>,
    retries: number,
    endpoint: string,
    options: RequestOptions
  ): Promise<ApiResponse<T>> {
    const errorMessage = data.error?.message || 'Request failed';
    const errorCode = data.error?.code || 'UNKNOWN_ERROR';

    switch (status) {
      case 404:
        throw new NotFoundError(errorMessage);

      case 409:
        throw new ConflictError(errorMessage);

      case 400:
        if (errorCode === 'VALIDATION_ERROR' && data.error?.errors) {
          throw new ValidationError(errorMessage, data.error.errors);
        }
        throw new ApiError(errorCode, errorMessage, data.error?.errors);

      case 500:
      case 502:
      case 503:
        // Retry on server errors
        if (retries > 0) {
          await this.delay(2000); // Wait 2 seconds before retry
          return this.request<T>(endpoint, { ...options, retries: retries - 1 });
        }
        throw new ApiError(errorCode, errorMessage);

      default:
        throw new ApiError(errorCode, errorMessage, data.error?.errors);
    }
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE', body });
  }
}

export const apiClient = new ApiClient();
