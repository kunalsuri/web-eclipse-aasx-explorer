/**
 * Dictionary IndexedDB Database
 * Client-side caching for dictionary concepts
 * 
 * Based on design requirements for offline operation
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { DictionaryConcept, DictionarySource } from '../../../../../shared/dictionary-types';

const DB_NAME = 'dictionary-cache';
const DB_VERSION = 1;
const CONCEPTS_STORE = 'concepts';
const METADATA_STORE = 'metadata';

/**
 * Cached concept with metadata
 */
interface CachedConcept {
  key: string; // Format: {source}:{conceptId}
  concept: DictionaryConcept;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * Cache metadata
 */
interface CacheMetadata {
  key: string;
  totalSize: number;
  entryCount: number;
  lastCleanup: number;
}

let dbInstance: IDBPDatabase | null = null;

/**
 * Initialize and open the IndexedDB database
 */
export async function initDatabase(): Promise<IDBPDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Create concepts store
      if (!db.objectStoreNames.contains(CONCEPTS_STORE)) {
        const conceptsStore = db.createObjectStore(CONCEPTS_STORE, { keyPath: 'key' });
        
        // Create indexes for efficient querying
        conceptsStore.createIndex('source', 'concept.source', { unique: false });
        conceptsStore.createIndex('timestamp', 'timestamp', { unique: false });
        conceptsStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        conceptsStore.createIndex('lastAccessed', 'lastAccessed', { unique: false });
      }

      // Create metadata store
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
      }
    },
  });

  // Initialize metadata if not exists
  const tx = dbInstance.transaction(METADATA_STORE, 'readwrite');
  const metadataStore = tx.objectStore(METADATA_STORE);
  const existingMetadata = await metadataStore.get('cache-metadata');
  
  if (!existingMetadata) {
    await metadataStore.put({
      key: 'cache-metadata',
      totalSize: 0,
      entryCount: 0,
      lastCleanup: Date.now(),
    });
  }
  
  await tx.done;

  return dbInstance;
}

/**
 * Get the database instance
 */
export async function getDatabase(): Promise<IDBPDatabase> {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

/**
 * Generate cache key
 */
export function generateCacheKey(source: DictionarySource, conceptId: string): string {
  return `${source}:${conceptId}`;
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Clear all data from the database
 */
export async function clearDatabase(): Promise<void> {
  const db = await getDatabase();
  
  const tx = db.transaction([CONCEPTS_STORE, METADATA_STORE], 'readwrite');
  await tx.objectStore(CONCEPTS_STORE).clear();
  await tx.objectStore(METADATA_STORE).clear();
  
  // Reset metadata
  await tx.objectStore(METADATA_STORE).put({
    key: 'cache-metadata',
    totalSize: 0,
    entryCount: 0,
    lastCleanup: Date.now(),
  });
  
  await tx.done;
}

/**
 * Get cache metadata
 */
export async function getCacheMetadata(): Promise<CacheMetadata> {
  const db = await getDatabase();
  const metadata = await db.get(METADATA_STORE, 'cache-metadata');
  
  if (!metadata) {
    return {
      key: 'cache-metadata',
      totalSize: 0,
      entryCount: 0,
      lastCleanup: Date.now(),
    };
  }
  
  return metadata;
}

/**
 * Update cache metadata
 */
export async function updateCacheMetadata(updates: Partial<CacheMetadata>): Promise<void> {
  const db = await getDatabase();
  const current = await getCacheMetadata();
  
  await db.put(METADATA_STORE, {
    ...current,
    ...updates,
  });
}

/**
 * Export types
 */
export type { CachedConcept, CacheMetadata };
export { CONCEPTS_STORE, METADATA_STORE };
