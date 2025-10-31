/**
 * Dictionary Cache Operations
 * Client-side caching with IndexedDB
 */

import type { DictionaryConcept, DictionarySource } from '../../../../../shared/dictionary-types';
import {
  getDatabase,
  generateCacheKey,
  getCacheMetadata,
  updateCacheMetadata,
  CONCEPTS_STORE,
  type CachedConcept,
} from './dictionary-db';

// Cache configuration
const DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50 MB in bytes

/**
 * Get a cached concept
 */
export async function getCached(
  source: DictionarySource,
  conceptId: string
): Promise<DictionaryConcept | null> {
  try {
    const db = await getDatabase();
    const key = generateCacheKey(source, conceptId);
    const cached = await db.get(CONCEPTS_STORE, key);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      // Remove expired entry
      await db.delete(CONCEPTS_STORE, key);
      return null;
    }

    // Update access metadata
    const tx = db.transaction(CONCEPTS_STORE, 'readwrite');
    await tx.objectStore(CONCEPTS_STORE).put({
      ...cached,
      accessCount: cached.accessCount + 1,
      lastAccessed: Date.now(),
    });
    await tx.done;

    return cached.concept;
  } catch (error) {
    console.error('Error getting cached concept:', error);
    return null;
  }
}

/**
 * Set a concept in cache
 */
export async function setCached(
  source: DictionarySource,
  conceptId: string,
  concept: DictionaryConcept,
  ttl: number = DEFAULT_TTL
): Promise<void> {
  try {
    const db = await getDatabase();
    const key = generateCacheKey(source, conceptId);
    const now = Date.now();

    const cachedConcept: CachedConcept = {
      key,
      concept,
      timestamp: now,
      expiresAt: now + ttl,
      accessCount: 1,
      lastAccessed: now,
    };

    // Calculate size (approximate)
    const size = JSON.stringify(cachedConcept).length;

    // Check if we need to make space
    const metadata = await getCacheMetadata();
    if (metadata.totalSize + size > MAX_CACHE_SIZE) {
      await evictLRU(size);
    }

    // Store the concept
    await db.put(CONCEPTS_STORE, cachedConcept);

    // Update metadata
    await updateCacheMetadata({
      totalSize: metadata.totalSize + size,
      entryCount: metadata.entryCount + 1,
    });
  } catch (error) {
    console.error('Error setting cached concept:', error);
    throw error;
  }
}

/**
 * Clear cache for a specific source
 */
export async function clearCacheBySource(source: DictionarySource): Promise<void> {
  try {
    const db = await getDatabase();
    const tx = db.transaction(CONCEPTS_STORE, 'readwrite');
    const store = tx.objectStore(CONCEPTS_STORE);
    const index = store.index('source');

    // Get all keys for this source
    const keys = await index.getAllKeys(source);

    // Delete all entries
    for (const key of keys) {
      await store.delete(key);
    }

    await tx.done;

    // Recalculate metadata
    await recalculateMetadata();
  } catch (error) {
    console.error('Error clearing cache by source:', error);
    throw error;
  }
}

/**
 * Clear all cache
 */
export async function clearAllCache(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.clear(CONCEPTS_STORE);

    // Reset metadata
    await updateCacheMetadata({
      totalSize: 0,
      entryCount: 0,
      lastCleanup: Date.now(),
    });
  } catch (error) {
    console.error('Error clearing all cache:', error);
    throw error;
  }
}

/**
 * Get cache size in bytes
 */
export async function getCacheSize(): Promise<number> {
  try {
    const metadata = await getCacheMetadata();
    return metadata.totalSize;
  } catch (error) {
    console.error('Error getting cache size:', error);
    return 0;
  }
}

/**
 * Get number of cached entries
 */
export async function getCacheEntryCount(): Promise<number> {
  try {
    const metadata = await getCacheMetadata();
    return metadata.entryCount;
  } catch (error) {
    console.error('Error getting cache entry count:', error);
    return 0;
  }
}

/**
 * Remove expired entries
 */
export async function removeExpiredEntries(): Promise<number> {
  try {
    const db = await getDatabase();
    const tx = db.transaction(CONCEPTS_STORE, 'readwrite');
    const store = tx.objectStore(CONCEPTS_STORE);
    const index = store.index('expiresAt');

    const now = Date.now();
    const expiredKeys: string[] = [];

    // Find all expired entries
    let cursor = await index.openCursor();
    while (cursor) {
      if (cursor.value.expiresAt < now) {
        expiredKeys.push(cursor.value.key);
      }
      cursor = await cursor.continue();
    }

    // Delete expired entries
    for (const key of expiredKeys) {
      await store.delete(key);
    }

    await tx.done;

    // Recalculate metadata
    await recalculateMetadata();

    return expiredKeys.length;
  } catch (error) {
    console.error('Error removing expired entries:', error);
    return 0;
  }
}

/**
 * Evict least recently used entries to make space
 */
async function evictLRU(requiredSpace: number): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction(CONCEPTS_STORE, 'readwrite');
  const store = tx.objectStore(CONCEPTS_STORE);
  const index = store.index('lastAccessed');

  let freedSpace = 0;
  let cursor = await index.openCursor();

  while (cursor && freedSpace < requiredSpace) {
    const size = JSON.stringify(cursor.value).length;
    await store.delete(cursor.value.key);
    freedSpace += size;
    cursor = await cursor.continue();
  }

  await tx.done;
}

/**
 * Recalculate cache metadata
 */
async function recalculateMetadata(): Promise<void> {
  const db = await getDatabase();
  const allConcepts = await db.getAll(CONCEPTS_STORE);

  const totalSize = allConcepts.reduce((sum, cached) => {
    return sum + JSON.stringify(cached).length;
  }, 0);

  await updateCacheMetadata({
    totalSize,
    entryCount: allConcepts.length,
  });
}

/**
 * Check if a concept is cached
 */
export async function isCached(
  source: DictionarySource,
  conceptId: string
): Promise<boolean> {
  const concept = await getCached(source, conceptId);
  return concept !== null;
}
