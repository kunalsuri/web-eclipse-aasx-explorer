/**
 * Dictionary Configuration Loader
 * Loads configuration from environment variables and config file
 */

import fs from 'fs';
import path from 'path';

export interface DictionaryConfig {
  eclass: {
    apiUrl: string;
    apiKey?: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    defaultSearchPath: string;
  };
  ieccdd: {
    apiUrl: string;
    apiKey?: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    defaultSearchPath: string;
  };
  cache: {
    serverTTL: number;
    clientTTL: number;
    maxSize: number;
    maxEntries: number;
  };
}

let cachedConfig: DictionaryConfig | null = null;

/**
 * Loads dictionary configuration from environment variables and config file
 */
export function loadDictionaryConfig(): DictionaryConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  // Load base configuration from file
  const configPath = path.join(process.cwd(), 'config', 'dictionary-config.json');
  let fileConfig: Partial<DictionaryConfig> = {};

  if (fs.existsSync(configPath)) {
    try {
      const fileContent = fs.readFileSync(configPath, 'utf-8');
      fileConfig = JSON.parse(fileContent);
    } catch (error) {
      console.warn(`Failed to load dictionary config from ${configPath}:`, error);
    }
  }

  // Merge with environment variables (env vars take precedence)
  cachedConfig = {
    eclass: {
      apiUrl: process.env.ECLASS_API_URL || fileConfig.eclass?.apiUrl || 'https://eclass-cdp.com/xmlapi/v1',
      apiKey: process.env.ECLASS_API_KEY,
      timeout: parseInt(process.env.ECLASS_API_TIMEOUT || '') || fileConfig.eclass?.timeout || 30000,
      retryAttempts: fileConfig.eclass?.retryAttempts || 3,
      retryDelay: fileConfig.eclass?.retryDelay || 1000,
      defaultSearchPath: fileConfig.eclass?.defaultSearchPath || 'eclass',
    },
    ieccdd: {
      apiUrl: process.env.IECCDD_API_URL || fileConfig.ieccdd?.apiUrl || 'https://cdd.iec.ch/api/v1',
      apiKey: process.env.IECCDD_API_KEY,
      timeout: parseInt(process.env.IECCDD_API_TIMEOUT || '') || fileConfig.ieccdd?.timeout || 30000,
      retryAttempts: fileConfig.ieccdd?.retryAttempts || 3,
      retryDelay: fileConfig.ieccdd?.retryDelay || 1000,
      defaultSearchPath: fileConfig.ieccdd?.defaultSearchPath || 'iec-cdd',
    },
    cache: {
      serverTTL: parseInt(process.env.DICTIONARY_CACHE_TTL || '') || fileConfig.cache?.serverTTL || 86400,
      clientTTL: fileConfig.cache?.clientTTL || 604800,
      maxSize: parseInt(process.env.DICTIONARY_CACHE_MAX_SIZE || '') || fileConfig.cache?.maxSize || 52428800,
      maxEntries: fileConfig.cache?.maxEntries || 1000,
    },
  };

  // Validate configuration
  validateConfig(cachedConfig);

  return cachedConfig;
}

/**
 * Validates the dictionary configuration
 */
function validateConfig(config: DictionaryConfig): void {
  const warnings: string[] = [];

  // Check API URLs
  if (!config.eclass.apiUrl) {
    warnings.push('ECLASS API URL is not configured');
  }
  if (!config.ieccdd.apiUrl) {
    warnings.push('IEC CDD API URL is not configured');
  }

  // Check API keys
  if (!config.eclass.apiKey) {
    warnings.push('ECLASS API key is not configured - API calls may fail');
  }
  if (!config.ieccdd.apiKey) {
    warnings.push('IEC CDD API key is not configured - API calls may fail');
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('Dictionary configuration warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
}

/**
 * Clears the cached configuration (useful for testing)
 */
export function clearConfigCache(): void {
  cachedConfig = null;
}
