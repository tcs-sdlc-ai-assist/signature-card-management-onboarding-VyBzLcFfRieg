/**
 * localStorage abstraction layer for MVP persistence.
 *
 * Provides a clean wrapper over `localStorage` with JSON serialization,
 * TTL-based expiry support, and safe error handling. Designed to be easily
 * replaceable with API calls in production.
 *
 * @module storageUtils
 */

/**
 * Retrieves a value from localStorage and parses it as JSON.
 * Returns `defaultValue` if the key does not exist, the stored value
 * is not valid JSON, or localStorage is unavailable.
 *
 * @param {string} key - The localStorage key.
 * @param {*} [defaultValue=null] - Value to return when the key is missing or invalid.
 * @returns {*} The parsed value, or `defaultValue`.
 */
export function getItem(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return defaultValue;
    }
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

/**
 * Stores a value in localStorage after JSON-stringifying it.
 * Silently fails if localStorage is unavailable or the value cannot be serialized.
 *
 * @param {string} key - The localStorage key.
 * @param {*} value - The value to store (must be JSON-serializable).
 * @returns {boolean} `true` if the write succeeded, `false` otherwise.
 */
export function setItem(key, value) {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes a single key from localStorage.
 * Silently fails if localStorage is unavailable.
 *
 * @param {string} key - The localStorage key to remove.
 * @returns {boolean} `true` if the removal succeeded, `false` otherwise.
 */
export function removeItem(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clears all keys from localStorage.
 * Silently fails if localStorage is unavailable.
 *
 * @returns {boolean} `true` if the clear succeeded, `false` otherwise.
 */
export function clearAll() {
  try {
    localStorage.clear();
    return true;
  } catch {
    return false;
  }
}

/**
 * Stores a value in localStorage with a time-to-live (TTL).
 * The stored envelope includes the value and an expiry timestamp.
 *
 * @param {string} key - The localStorage key.
 * @param {*} value - The value to store (must be JSON-serializable).
 * @param {number} ttlMs - Time-to-live in milliseconds.
 * @returns {boolean} `true` if the write succeeded, `false` otherwise.
 */
export function setWithExpiry(key, value, ttlMs) {
  try {
    const envelope = {
      value,
      expiry: Date.now() + ttlMs,
    };
    const serialized = JSON.stringify(envelope);
    localStorage.setItem(key, serialized);
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieves a value that was stored with {@link setWithExpiry}.
 * If the TTL has elapsed, the key is automatically removed and
 * `defaultValue` is returned.
 *
 * @param {string} key - The localStorage key.
 * @param {*} [defaultValue=null] - Value to return when the key is missing,
 *   expired, or invalid.
 * @returns {*} The stored value if still within TTL, or `defaultValue`.
 */
export function getWithExpiry(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return defaultValue;
    }

    const envelope = JSON.parse(raw);

    // If the stored data doesn't have the expected envelope shape, return default
    if (
      !envelope ||
      typeof envelope !== 'object' ||
      !('value' in envelope) ||
      !('expiry' in envelope)
    ) {
      return defaultValue;
    }

    if (typeof envelope.expiry !== 'number' || Date.now() >= envelope.expiry) {
      // TTL has elapsed — clean up and return default
      localStorage.removeItem(key);
      return defaultValue;
    }

    return envelope.value;
  } catch {
    return defaultValue;
  }
}