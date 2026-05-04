/**
 * Custom React hook for rate-limited UI actions.
 *
 * Wraps the {@link rateLimiter} service to provide React state and
 * attempt-based messaging for rate-limited card management actions
 * (unlock, resend PIN). Returns current attempt counts, exhaustion
 * status, an action performer, and a message getter.
 *
 * @module useRateLimitHook
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getRateLimitStatus,
  incrementAttempt,
  resetAttempts,
  RATE_LIMIT_ACTIONS,
} from '../services/rateLimiter.js';
import { UNLOCK_MESSAGES, RESEND_MESSAGES } from '../constants/messages.js';

/**
 * Returns the appropriate message constants for a given action type.
 *
 * @param {string} actionType - One of {@link RATE_LIMIT_ACTIONS}.
 * @returns {Object} The message constants object.
 */
function getMessagesForAction(actionType) {
  if (actionType === RATE_LIMIT_ACTIONS.UNLOCK) {
    return UNLOCK_MESSAGES;
  }
  return RESEND_MESSAGES;
}

/**
 * Returns the appropriate user-facing message based on the action type
 * and the current number of attempts used.
 *
 * @param {string} actionType - One of {@link RATE_LIMIT_ACTIONS}.
 * @param {number} attemptsUsed - The number of attempts used so far.
 * @param {number} remaining - The number of attempts remaining.
 * @param {boolean} isExhausted - Whether all attempts have been used.
 * @returns {string} The user-facing message.
 */
function resolveMessage(actionType, attemptsUsed, remaining, isExhausted) {
  const messages = getMessagesForAction(actionType);

  if (isExhausted) {
    return messages.ATTEMPTS_EXHAUSTED;
  }

  if (attemptsUsed === 0) {
    return '';
  }

  if (attemptsUsed === 1) {
    return messages.ATTEMPT_1_CONFIRM;
  }

  if (attemptsUsed === 2) {
    return messages.ATTEMPT_2_WARNING;
  }

  if (attemptsUsed >= 3) {
    return messages.ATTEMPT_3_FINAL_WARNING;
  }

  return messages.ATTEMPT_REMAINING
    ? messages.ATTEMPT_REMAINING(remaining)
    : '';
}

/**
 * Custom React hook for rate-limited UI actions.
 *
 * Provides React state tracking for rate-limited operations such as
 * card unlock and PIN resend. Reads the current status from the
 * rate limiter service on mount and after each action, and provides
 * attempt-based messaging from the centralized message constants.
 *
 * @param {string} actionType - One of {@link RATE_LIMIT_ACTIONS}
 *   (`'unlock'` or `'resend'`).
 * @param {Object} [options]
 * @param {string} [options.signerId] - The signer ID associated with
 *   the action (used for contextual logging).
 * @param {string} [options.userId] - Optional user ID for audit logging.
 * @returns {{
 *   attemptCount: number,
 *   remainingAttempts: number,
 *   maxAttempts: number,
 *   isExhausted: boolean,
 *   message: string,
 *   performAction: function(): { attemptsUsed: number, maxAttempts: number, remaining: number, isExhausted: boolean },
 *   getMessage: function(number=): string,
 *   refresh: function(): void,
 *   reset: function(): void
 * }}
 */
export function useRateLimitHook(actionType, options = {}) {
  const { signerId = null, userId = null } = options;

  const [status, setStatus] = useState(() => getRateLimitStatus(actionType));
  const [message, setMessage] = useState('');

  const actionTypeRef = useRef(actionType);
  actionTypeRef.current = actionType;

  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  /**
   * Re-reads the current rate-limit status from localStorage and
   * updates local state.
   */
  const refresh = useCallback(() => {
    const current = getRateLimitStatus(actionTypeRef.current);
    setStatus(current);
    setMessage(
      resolveMessage(
        actionTypeRef.current,
        current.attemptsUsed,
        current.remaining,
        current.isExhausted
      )
    );
  }, []);

  /**
   * Performs the rate-limited action by incrementing the attempt counter.
   * Updates local state and returns the updated status.
   *
   * @returns {{ attemptsUsed: number, maxAttempts: number, remaining: number, isExhausted: boolean }}
   *   The updated rate-limit status after the increment.
   */
  const performAction = useCallback(() => {
    const updated = incrementAttempt(actionTypeRef.current, userIdRef.current);
    setStatus(updated);

    const msg = resolveMessage(
      actionTypeRef.current,
      updated.attemptsUsed,
      updated.remaining,
      updated.isExhausted
    );
    setMessage(msg);

    return updated;
  }, []);

  /**
   * Returns the appropriate message for a given attempt count without
   * modifying state. Useful for previewing messages before performing
   * an action.
   *
   * @param {number} [attemptsUsed] - The attempt count to get a message
   *   for. If omitted, uses the current attempt count from state.
   * @returns {string} The user-facing message.
   */
  const getMessage = useCallback((attemptsUsed) => {
    const currentStatus = getRateLimitStatus(actionTypeRef.current);
    const count = attemptsUsed !== undefined ? attemptsUsed : currentStatus.attemptsUsed;
    const max = currentStatus.maxAttempts;
    const remaining = Math.max(0, max - count);
    const exhausted = remaining <= 0;

    return resolveMessage(actionTypeRef.current, count, remaining, exhausted);
  }, []);

  /**
   * Resets the attempt counter for the current action type and updates
   * local state.
   */
  const reset = useCallback(() => {
    resetAttempts(actionTypeRef.current);
    const current = getRateLimitStatus(actionTypeRef.current);
    setStatus(current);
    setMessage('');
  }, []);

  // Refresh status on mount and when actionType or signerId changes
  useEffect(() => {
    refresh();
  }, [actionType, signerId, refresh]);

  return {
    attemptCount: status.attemptsUsed,
    remainingAttempts: status.remaining,
    maxAttempts: status.maxAttempts,
    isExhausted: status.isExhausted,
    message,
    performAction,
    getMessage,
    refresh,
    reset,
  };
}