/**
 * Date and time utility functions.
 *
 * Provides helpers for token expiry checks, rate-limit calendar-day resets,
 * timestamp formatting for audit logs / confirmation screens, and session
 * timeout remaining-time display.
 *
 * @module dateUtils
 */

import { TOKEN_EXPIRY_HOURS } from '../constants/constants.js';

/**
 * Checks whether a token has expired based on its issued-at timestamp
 * and the configured expiry window ({@link TOKEN_EXPIRY_HOURS}).
 *
 * If `expiresAt` is provided it is used directly; otherwise expiry is
 * calculated as `issuedAt + TOKEN_EXPIRY_HOURS`.
 *
 * @param {Object} params
 * @param {string} [params.issuedAt]  - ISO-8601 issued-at timestamp.
 * @param {string} [params.expiresAt] - ISO-8601 explicit expiry timestamp.
 * @returns {boolean} `true` when the token is expired (or dates are invalid).
 */
export function isTokenExpired({ issuedAt, expiresAt } = {}) {
  const now = Date.now();

  // If an explicit expiresAt is provided, use it directly.
  if (expiresAt) {
    const expiryMs = new Date(expiresAt).getTime();
    if (Number.isNaN(expiryMs)) {
      return true;
    }
    return now >= expiryMs;
  }

  // Fall back to issuedAt + configured expiry window.
  if (issuedAt) {
    const issuedMs = new Date(issuedAt).getTime();
    if (Number.isNaN(issuedMs)) {
      return true;
    }
    const expiryMs = issuedMs + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;
    return now >= expiryMs;
  }

  // No dates supplied — treat as expired.
  return true;
}

/**
 * Determines whether a rate-limit counter should be reset because the
 * stored date string belongs to a previous calendar day (local time).
 *
 * @param {string} storedDateStr - Date string in `YYYY-MM-DD` format or any
 *   value parseable by `new Date()`. Represents the day the counter was last
 *   incremented.
 * @returns {boolean} `true` when the stored date is before today (or invalid),
 *   meaning the counter should be reset.
 */
export function isCalendarDayReset(storedDateStr) {
  if (!storedDateStr || typeof storedDateStr !== 'string') {
    return true;
  }

  const storedDate = new Date(storedDateStr);
  if (Number.isNaN(storedDate.getTime())) {
    return true;
  }

  const now = new Date();

  // Compare calendar dates in local time.
  const storedDay = new Date(
    storedDate.getFullYear(),
    storedDate.getMonth(),
    storedDate.getDate()
  );
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  return storedDay.getTime() < today.getTime();
}

/**
 * Formats an ISO-8601 timestamp into a human-readable string suitable for
 * audit logs and confirmation screens.
 *
 * Output format: `"Jan 10, 2025, 2:32 PM"` (US-English locale).
 *
 * @param {string|Date} timestamp - ISO-8601 string or Date instance.
 * @param {Object} [options] - Optional `Intl.DateTimeFormat` overrides.
 * @returns {string} Formatted date/time string, or an empty string when the
 *   input is falsy or unparseable.
 */
export function formatTimestamp(timestamp, options) {
  if (!timestamp) {
    return '';
  }

  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options,
  };

  try {
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
  } catch {
    return '';
  }
}

/**
 * Calculates the remaining time between now and a future expiry timestamp
 * and returns a human-readable string.
 *
 * Useful for displaying session-timeout countdowns.
 *
 * @param {string|number|Date} expiryTimestamp - The future point in time.
 *   Accepts an ISO-8601 string, a Unix-epoch millisecond number, or a Date.
 * @returns {{ totalMs: number, minutes: number, seconds: number, display: string }}
 *   An object with the raw remaining milliseconds, broken-down minutes/seconds,
 *   and a formatted `display` string (e.g. `"4:32"`). When the time has already
 *   passed, all numeric values are `0` and `display` is `"0:00"`.
 */
export function getTimeRemaining(expiryTimestamp) {
  const defaultResult = { totalMs: 0, minutes: 0, seconds: 0, display: '0:00' };

  if (expiryTimestamp === null || expiryTimestamp === undefined) {
    return defaultResult;
  }

  let expiryMs;

  if (expiryTimestamp instanceof Date) {
    expiryMs = expiryTimestamp.getTime();
  } else if (typeof expiryTimestamp === 'number') {
    expiryMs = expiryTimestamp;
  } else {
    expiryMs = new Date(expiryTimestamp).getTime();
  }

  if (Number.isNaN(expiryMs)) {
    return defaultResult;
  }

  const remaining = expiryMs - Date.now();

  if (remaining <= 0) {
    return defaultResult;
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const display = `${minutes}:${String(seconds).padStart(2, '0')}`;

  return { totalMs: remaining, minutes, seconds, display };
}

/**
 * Returns today's date as a `YYYY-MM-DD` string in local time.
 * Useful for stamping rate-limit counters.
 *
 * @returns {string} e.g. `"2025-01-10"`
 */
export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}