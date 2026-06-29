// src/utils/apiCache.js
/**
 * Lightweight in-memory API cache
 */
class APICache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Get data from cache if it exists and has not expired
   * @param {string} key - The cache key
   * @returns {any|null} The cached data or null if expired/not found
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Set data in cache with a time-to-live
   * @param {string} key - The cache key
   * @param {any} data - The data to cache
   * @param {number} ttlMs - Time to live in milliseconds (default 5 minutes)
   */
  set(key, data, ttlMs = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    });
  }

  /**
   * Invalidate a specific cache key
   * @param {string} key - The cache key
   */
  invalidate(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cached data
   */
  clear() {
    this.cache.clear();
  }
}

// Export a singleton instance
export const apiCache = new APICache();
