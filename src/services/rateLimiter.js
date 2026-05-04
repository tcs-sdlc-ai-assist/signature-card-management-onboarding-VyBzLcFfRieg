/**
 * Rate-limiting service for self-service card actions (unlock, resend PIN).
 *
 * Tracks attempts per action type per calendar day in localStorage.
 * Counters automatically reset at the midnight boundary (local time).
 *
 * Exports:
 *   - {@link getRateLimitStatus} — read current attempt count and remaining
 *   - {@link incrementAttempt} — record a new attempt
 *   - {@link resetAttempts} — manually reset counters (testing/admin)
 *   - {@link useRateLimiter} — React hook wrapping the above with state
 *
 * @module rateLimiter
 */

import { useState, useCallback, useEffect } from 'react';
import { getItem, setItem } from '../utils/storageUtils.js';
import { isCalendarDayReset, getTodayDateString } from '../utils/dateUtils.js';
import { logEvent, AUDIT_EVENT_TYPES } from './auditLogger.js';
import {
  MAX_UNLOCK_ATTEMPTS_PER_DAY,
  MAX_RESEND_ATTEMPTS_PER_DAY,
  STORAGE_KEYS,
} from '../constants/constants.js';

// ---- Action Types ----

/**
 * Supported rate-limited action types.
 * @enum {string}
 */
export const RATE_LIMIT_ACTIONS = {
  UNLOCK: 'unlock',
  RESEND: 'resend',
};

// ---- Internal Helpers ----

/**
 * Returns the localStorage key for the attempt counter of a given action.
 *
 * @param {string} action - One of {@link RATE_LIMIT_ACTIONS}.
 * @returns {string} The localStorage key.
 */
function getAttemptsKey(action) {
  if (action === RATE_LIMIT_ACTIONS.UNLOCK) {
    return STORAGE_KEYS.UNLOCK_ATTEMPTS;
  }
  return STORAGE_KEYS.RESEND_ATTEMPTS;
}

/**
 * Returns the localStorage key for the date stamp of a given action.
 *
 * @param {string} action - One of {@link RATE_LIMIT_ACTIONS}.
 * @returns {string} The localStorage key.
 */
function getDateKey(action) {
  if (action === RATE_LIMIT_ACTIONS.UNLOCK) {
    return STORAGE_KEYS.UNLOCK_ATTEMPTS_DATE;
  }
  return STORAGE_KEYS.RESEND_ATTEMPTS_DATE;
}

/**
 * Returns the configured maximum attempts per day for a given action.
 *
 * @param {string} action - One of {@link RATE_LIMIT_ACTIONS}.
 * @returns {number}
 */
function getMaxAttempts(action) {
  if (action === RATE_LIMIT_ACTIONS.UNLOCK) {
    return MAX_UNLOCK_ATTEMPTS_PER_DAY;
  }
  return MAX_RESEND_ATTEMPTS_PER_DAY;
}

/**
 * Reads the stored attempts counter, resetting it if the stored date
 * belongs to a previous calendar day.
 *
 * @param {string} action - One of {@link RATE_LIMIT_ACTIONS}.
 * @returns {number} Current attempt count for today.
 */
function readAttempts(action) {
  const dateKey = getDateKey(action);
  const attemptsKey = getAttemptsKey(action);
  const storedDate = getItem(dateKey, null);

  if (isCalendarDayReset(storedDate)) {
    setItem(attemptsKey, 0);
    setItem(dateKey, getTodayDateString());
    return 0;
  }

  const count = getItem(attemptsKey, 0);
  return typeof count === 'number' ? count : 0;
}

// ---- Public API (plain functions) ----

/**
 * Returns the current rate-limit status for a given action.
 *
 * @param {string} action - One of {@link RATE_LIMIT_ACTIONS}.
 * @returns {{
 *   attemptsUsed: number,
 *   maxAttempts: number,
 *   remaining: number,
 *   isExhausted: boolean
 * }}
 */
export function getRateLimitStatus(action) {
  const attemptsUsed = readAttempts(action);
  const maxAttempts = getMaxAttempts(action);
  const remaining = Math.max(0, maxAttempts - attemptsUsed);
  const isExhausted = remaining <= 0;

  return {
    attemptsUsed,
    maxAttempts,
    remaining,
    isExhausted,
  };
}

/**
 * Increments the attempt counter for a given action and persists it.
 * If the calendar day has rolled over the counter is reset first.
 *
 * @param {string} action - One of {@link RATE_LIMIT_ACTIONS}.
 * @param {string} [userId] - Optional user ID for audit logging.
 * @returns {{
 *   attemptsUsed: number,
 *   maxAttempts: number,
 *   remaining: number,
 *   isExhausted: boolean
 * }} Updated status after the increment.
 */
export function incrementAttempt(action, userId) {
  const attemptsKey = getAttemptsKey(action);
  const dateKey = getDateKey(action);

  // Ensure counter is current (resets if new day)
  let current = readAttempts(action);
  const maxAttempts = getMaxAttempts(action);

  // Only increment if not already exhausted
  if (current < maxAttempts) {
    current += 1;
    setItem(attemptsKey, current);
    setItem(dateKey, getTodayDateString());
  }

  const remaining = Math.max(0, maxAttempts - current);
  const isExhausted = remaining <= 0;

  // Audit log the attempt
  try {
    logEvent({
      eventType: AUDIT_EVENT_TYPES.SUBMISSION,
      userId: userId ?? null,
      description: `Rate-limited action "${action}" attempt ${current} of ${maxAttempts}.`,
      details: {
        action,
        attemptsUsed: current,
        maxAttempts,
        remaining,
        isExhausted,
      },
    });
  } catch {
    // Audit logging must never break the calling flow.
  }

  return {
    attemptsUsed: current,
    maxAttempts,
    remaining,
    isExhausted,
  };
}

/**
 * Resets the attempt counter for a given action.
 * Intended for testing and administrative use.
 *
 * @param {string} action - One of {@link RATE_LIMIT_ACTIONS}.
 * @returns {boolean} `true` if the reset succeeded.
 */
export function resetAttempts(action) {
  const attemptsKey = getAttemptsKey(action);
  const dateKey = getDateKey(action);
  const a = setItem(attemptsKey, 0);
  const b = setItem(dateKey, getTodayDateString());
  return a && b;
}

// ---- React Hook ----

/**
 * Custom React hook that provides rate-limit state and actions for a
 * given action type. Re-reads status on mount and after each increment.
 *
 * @param {string} action - One of {@link RATE_LIMIT_ACTIONS}.
 * @param {string} [userId] - Optional user ID for audit logging.
 * @returns {{
 *   attemptsUsed: number,
 *   maxAttempts: number,
 *   remaining: number,
 *   isExhausted: boolean,
 *   increment: function(): { attemptsUsed: number, maxAttempts: number, remaining: number, isExhausted: boolean },
 *   reset: function(): void,
 *   refresh: function(): void
 * }}
 */
export function useRateLimiter(action, userId) {
  const [status, setStatus] = useState(() => getRateLimitStatus(action));

  /**
   * Re-read the current status from localStorage.
   */
  const refresh = useCallback(() => {
    setStatus(getRateLimitStatus(action));
  }, [action]);

  /**
   * Increment the attempt counter and update local state.
   *
   * @returns {{ attemptsUsed: number, maxAttempts: number, remaining: number, isExhausted: boolean }}
   */
  const increment = useCallback(() => {
    const updated = incrementAttempt(action, userId);
    setStatus(updated);
    return updated;
  }, [action, userId]);

  /**
   * Reset the counter and update local state.
   */
  const reset = useCallback(() => {
    resetAttempts(action);
    setStatus(getRateLimitStatus(action));
  }, [action]);

  // Refresh status on mount and when action changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    attemptsUsed: status.attemptsUsed,
    maxAttempts: status.maxAttempts,
    remaining: status.remaining,
    isExhausted: status.isExhausted,
    increment,
    reset,
    refresh,
  };
}