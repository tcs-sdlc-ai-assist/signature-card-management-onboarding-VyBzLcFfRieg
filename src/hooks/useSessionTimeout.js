/**
 * Custom React hook for session timeout management.
 *
 * Tracks user activity (mouse, keyboard, scroll events), starts an
 * inactivity timer, shows a warning modal at a configurable threshold
 * before timeout, and auto-logs out on timeout expiry.
 *
 * Integrates with {@link authService} for logout and session refresh,
 * and {@link auditLogger} for timeout events.
 *
 * @module useSessionTimeout
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logout, getSession, refreshSession } from '../services/authService.js';
import { logEvent, AUDIT_EVENT_TYPES } from '../services/auditLogger.js';
import { getTimeRemaining } from '../utils/dateUtils.js';
import { SESSION_TIMEOUT_MS } from '../constants/constants.js';

// ---- Constants ----

/** How long before session expiry to show the warning modal (default: 2 minutes) */
const WARNING_THRESHOLD_MS = 2 * 60 * 1000;

/** Interval at which the countdown display is updated (1 second) */
const COUNTDOWN_INTERVAL_MS = 1000;

/** Debounce interval for activity events to avoid excessive timer resets */
const ACTIVITY_DEBOUNCE_MS = 5000;

/** User activity events to listen for */
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

/**
 * Custom React hook for session timeout management.
 *
 * Monitors user activity and manages an inactivity timer. When the user
 * is inactive for close to the session timeout duration, a warning is
 * shown. If the user remains inactive past the timeout, the session is
 * automatically terminated.
 *
 * @param {Object} [options]
 * @param {number} [options.timeoutMs] - Session timeout in milliseconds
 *   (defaults to {@link SESSION_TIMEOUT_MS}).
 * @param {number} [options.warningThresholdMs] - Time before expiry to
 *   show the warning (defaults to {@link WARNING_THRESHOLD_MS}).
 * @param {function} [options.onTimeout] - Optional callback invoked when
 *   the session times out (after logout).
 * @param {function} [options.onWarning] - Optional callback invoked when
 *   the warning becomes visible.
 * @returns {{
 *   isWarningVisible: boolean,
 *   timeRemaining: { totalMs: number, minutes: number, seconds: number, display: string },
 *   resetTimer: function(): void,
 *   dismissWarning: function(): void
 * }}
 */
export function useSessionTimeout(options = {}) {
  const {
    timeoutMs = SESSION_TIMEOUT_MS,
    warningThresholdMs = WARNING_THRESHOLD_MS,
    onTimeout = null,
    onWarning = null,
  } = options;

  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState({
    totalMs: 0,
    minutes: 0,
    seconds: 0,
    display: '0:00',
  });

  // Refs for timers and state that should not trigger re-renders
  const warningTimerRef = useRef(null);
  const timeoutTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const expiresAtRef = useRef(Date.now() + timeoutMs);
  const isWarningVisibleRef = useRef(false);
  const hasTimedOutRef = useRef(false);
  const onTimeoutRef = useRef(onTimeout);
  const onWarningRef = useRef(onWarning);

  // Keep callback refs current
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    onWarningRef.current = onWarning;
  }, [onWarning]);

  /**
   * Clears all active timers and intervals.
   */
  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current !== null) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (timeoutTimerRef.current !== null) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    if (countdownIntervalRef.current !== null) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  /**
   * Handles session timeout — logs out the user and records the event.
   */
  const handleTimeout = useCallback(() => {
    if (hasTimedOutRef.current) {
      return;
    }
    hasTimedOutRef.current = true;

    clearAllTimers();
    setIsWarningVisible(false);
    isWarningVisibleRef.current = false;

    // Get session info before logout for audit logging
    const session = getSession();
    const userId = session?.user?.id ?? null;

    try {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SESSION_TIMEOUT,
        userId,
        description: 'Session timed out due to inactivity.',
        details: {
          action: 'session_timeout',
          timeoutMs,
        },
      });
    } catch {
      // Audit logging must never break the calling flow.
    }

    logout();

    if (typeof onTimeoutRef.current === 'function') {
      try {
        onTimeoutRef.current();
      } catch {
        // Callback errors must not break the timeout flow.
      }
    }
  }, [clearAllTimers, timeoutMs]);

  /**
   * Shows the warning modal and starts the countdown interval.
   */
  const showWarning = useCallback(() => {
    if (hasTimedOutRef.current) {
      return;
    }

    setIsWarningVisible(true);
    isWarningVisibleRef.current = true;

    // Start countdown interval
    if (countdownIntervalRef.current !== null) {
      clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = setInterval(() => {
      const remaining = getTimeRemaining(expiresAtRef.current);
      setTimeRemaining(remaining);

      if (remaining.totalMs <= 0) {
        handleTimeout();
      }
    }, COUNTDOWN_INTERVAL_MS);

    // Update immediately
    setTimeRemaining(getTimeRemaining(expiresAtRef.current));

    if (typeof onWarningRef.current === 'function') {
      try {
        onWarningRef.current();
      } catch {
        // Callback errors must not break the warning flow.
      }
    }
  }, [handleTimeout]);

  /**
   * Starts (or restarts) the inactivity timers.
   */
  const startTimers = useCallback(() => {
    if (hasTimedOutRef.current) {
      return;
    }

    clearAllTimers();

    const now = Date.now();
    expiresAtRef.current = now + timeoutMs;

    // Calculate delay until warning should appear
    const warningDelay = Math.max(0, timeoutMs - warningThresholdMs);

    // Set warning timer
    warningTimerRef.current = setTimeout(() => {
      showWarning();
    }, warningDelay);

    // Set timeout timer
    timeoutTimerRef.current = setTimeout(() => {
      handleTimeout();
    }, timeoutMs);

    // Update time remaining display
    setTimeRemaining(getTimeRemaining(expiresAtRef.current));
  }, [clearAllTimers, timeoutMs, warningThresholdMs, showWarning, handleTimeout]);

  /**
   * Resets the inactivity timer. Called on user activity or when the
   * user dismisses the warning modal.
   */
  const resetTimer = useCallback(() => {
    if (hasTimedOutRef.current) {
      return;
    }

    lastActivityRef.current = Date.now();

    // Hide warning if visible
    if (isWarningVisibleRef.current) {
      setIsWarningVisible(false);
      isWarningVisibleRef.current = false;
    }

    // Refresh the session expiry in storage
    refreshSession();

    // Restart timers
    startTimers();
  }, [startTimers]);

  /**
   * Dismisses the warning modal and resets the timer.
   */
  const dismissWarning = useCallback(() => {
    if (hasTimedOutRef.current) {
      return;
    }

    setIsWarningVisible(false);
    isWarningVisibleRef.current = false;

    // Reset the timer since the user is actively dismissing the warning
    resetTimer();

    try {
      const session = getSession();
      const userId = session?.user?.id ?? null;

      logEvent({
        eventType: AUDIT_EVENT_TYPES.SESSION_TIMEOUT,
        userId,
        description: 'Session timeout warning dismissed by user.',
        details: {
          action: 'warning_dismissed',
        },
      });
    } catch {
      // Audit logging must never break the calling flow.
    }
  }, [resetTimer]);

  // Set up activity event listeners and initial timers
  useEffect(() => {
    // Only run if there is an active session
    const session = getSession();
    if (!session) {
      return;
    }

    hasTimedOutRef.current = false;

    // Debounced activity handler
    let activityDebounceTimer = null;

    const handleActivity = () => {
      // Don't reset if warning is visible — user must explicitly dismiss
      if (isWarningVisibleRef.current || hasTimedOutRef.current) {
        return;
      }

      const now = Date.now();
      if (now - lastActivityRef.current < ACTIVITY_DEBOUNCE_MS) {
        return;
      }

      lastActivityRef.current = now;

      // Debounce the timer reset
      if (activityDebounceTimer !== null) {
        clearTimeout(activityDebounceTimer);
      }

      activityDebounceTimer = setTimeout(() => {
        resetTimer();
      }, 100);
    };

    // Attach activity listeners
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    // Start initial timers
    startTimers();

    // Cleanup
    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }

      if (activityDebounceTimer !== null) {
        clearTimeout(activityDebounceTimer);
      }

      clearAllTimers();
    };
  }, [startTimers, resetTimer, clearAllTimers]);

  return {
    isWarningVisible,
    timeRemaining,
    resetTimer,
    dismissWarning,
  };
}