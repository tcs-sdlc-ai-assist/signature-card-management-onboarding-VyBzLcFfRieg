import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getRateLimitStatus,
  incrementAttempt,
  resetAttempts,
  RATE_LIMIT_ACTIONS,
} from './rateLimiter.js';
import {
  STORAGE_KEYS,
  MAX_UNLOCK_ATTEMPTS_PER_DAY,
  MAX_RESEND_ATTEMPTS_PER_DAY,
} from '../constants/constants.js';

describe('rateLimiter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ---- Initial state ----

  describe('initial state', () => {
    it('returns 0 attempts used for unlock action on fresh state', () => {
      const status = getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);

      expect(status.attemptsUsed).toBe(0);
      expect(status.maxAttempts).toBe(MAX_UNLOCK_ATTEMPTS_PER_DAY);
      expect(status.remaining).toBe(MAX_UNLOCK_ATTEMPTS_PER_DAY);
      expect(status.isExhausted).toBe(false);
    });

    it('returns 0 attempts used for resend action on fresh state', () => {
      const status = getRateLimitStatus(RATE_LIMIT_ACTIONS.RESEND);

      expect(status.attemptsUsed).toBe(0);
      expect(status.maxAttempts).toBe(MAX_RESEND_ATTEMPTS_PER_DAY);
      expect(status.remaining).toBe(MAX_RESEND_ATTEMPTS_PER_DAY);
      expect(status.isExhausted).toBe(false);
    });
  });

  // ---- incrementAttempt ----

  describe('incrementAttempt', () => {
    it('increments the attempt count for unlock action', () => {
      const result = incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');

      expect(result.attemptsUsed).toBe(1);
      expect(result.maxAttempts).toBe(MAX_UNLOCK_ATTEMPTS_PER_DAY);
      expect(result.remaining).toBe(MAX_UNLOCK_ATTEMPTS_PER_DAY - 1);
      expect(result.isExhausted).toBe(false);
    });

    it('increments the attempt count for resend action', () => {
      const result = incrementAttempt(RATE_LIMIT_ACTIONS.RESEND, 'usr-001');

      expect(result.attemptsUsed).toBe(1);
      expect(result.maxAttempts).toBe(MAX_RESEND_ATTEMPTS_PER_DAY);
      expect(result.remaining).toBe(MAX_RESEND_ATTEMPTS_PER_DAY - 1);
      expect(result.isExhausted).toBe(false);
    });

    it('increments sequentially with each call', () => {
      const result1 = incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');
      expect(result1.attemptsUsed).toBe(1);

      const result2 = incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');
      expect(result2.attemptsUsed).toBe(2);

      const result3 = incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');
      expect(result3.attemptsUsed).toBe(3);
    });

    it('persists the attempt count to localStorage', () => {
      incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');
      incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');

      const status = getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);
      expect(status.attemptsUsed).toBe(2);
    });

    it('handles null userId gracefully', () => {
      const result = incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, null);

      expect(result.attemptsUsed).toBe(1);
      expect(result.remaining).toBe(MAX_UNLOCK_ATTEMPTS_PER_DAY - 1);
    });

    it('handles undefined userId gracefully', () => {
      const result = incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK);

      expect(result.attemptsUsed).toBe(1);
      expect(result.remaining).toBe(MAX_UNLOCK_ATTEMPTS_PER_DAY - 1);
    });
  });

  // ---- Max attempts enforced ----

  describe('max attempts enforced', () => {
    it('marks unlock action as exhausted after max attempts', () => {
      for (let i = 0; i < MAX_UNLOCK_ATTEMPTS_PER_DAY; i++) {
        incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');
      }

      const status = getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);
      expect(status.attemptsUsed).toBe(MAX_UNLOCK_ATTEMPTS_PER_DAY);
      expect(status.remaining).toBe(0);
      expect(status.isExhausted).toBe(true);
    });

    it('marks resend action as exhausted after max attempts', () => {
      for (let i = 0; i < MAX_RESEND_ATTEMPTS_PER_DAY; i++) {
        incrementAttempt(RATE_LIMIT_ACTIONS.RESEND, 'usr-001');
      }

      const status = getRateLimitStatus(RATE_LIMIT_ACTIONS.RESEND);
      expect(status.attemptsUsed).toBe(MAX_RESEND_ATTEMPTS_PER_DAY);
      expect(status.remaining).toBe(0);
      expect(status.isExhausted).toBe(true);
    });

    it('does not increment beyond max attempts for unlock', () => {
      for (let i = 0; i < MAX_UNLOCK_ATTEMPTS_PER_DAY; i++) {
        incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');
      }

      // Try to increment one more time
      const result = incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');

      expect(result.attemptsUsed).toBe(MAX_UNLOCK_ATTEMPTS_PER_DAY);
      expect(result.remaining).toBe(0);
      expect(result.isExhausted).toBe(true);
    });

    it('does not increment beyond max attempts for resend', () => {
      for (let i = 0; i < MAX_RESEND_ATTEMPTS_PER_DAY; i++) {
        incrementAttempt(RATE_LIMIT_ACTIONS.RESEND, 'usr-001');
      }

      // Try to increment one more time
      const result = incrementAttempt(RATE_LIMIT_ACTIONS.RESEND, 'usr-001');

      expect(result.attemptsUsed).toBe(MAX_RESEND_ATTEMPTS_PER_DAY);
      expect(result.remaining).toBe(0);
      expect(result.isExhausted).toBe(true);
    });

    it('returns isExhausted false when attempts are below max', () => {
      incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');

      const status = getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);
      expect(status.isExhausted).toBe(false);
      expect(status.remaining).toBeGreaterThan(0);
    });

    it('returns correct remaining count at each step', () => {
      for (let i = 1; i <= MAX_UNLOCK_ATTEMPTS_PER_DAY; i++) {
        const result = incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');
        expect(result.attemptsUsed).toBe(i);
        expect(result.remaining).toBe(MAX_UNLOCK_ATTEMPTS_PER_DAY - i);
      }
    });
  });

  // ---- Attempt status reporting ----

  describe('attempt status reporting', () => {
    it('reports correct status after one attempt', () => {
      incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');

      const status = getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);
      expect(status.attemptsUsed).toBe(1);
      expect(status.maxAttempts).toBe(MAX_UNLOCK_ATTEMPTS_PER_DAY);
      expect(status.remaining).toBe(MAX_UNLOCK_ATTEMPTS_PER_DAY - 1);
      expect(status.isExhausted).toBe(false);
    });

    it('reports correct status after two attempts', () => {
      incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');
      incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');

      const status = getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);
      expect(status.attemptsUsed).toBe(2);
      expect(status.remaining).toBe(MAX_UNLOCK_ATTEMPTS_PER_DAY - 2);
      expect(status.isExhausted).toBe(false);
    });

    it('reports exhausted status when all attempts are used', () => {
      for (let i = 0; i < MAX_UNLOCK_ATTEMPTS_PER_DAY; i++) {
        incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');
      }

      const status = getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);
      expect(status.attemptsUsed).toBe(MAX_UNLOCK_ATTEMPTS_PER_DAY);
      expect(status.remaining).toBe(0);
      expect(status.isExhausted).toBe(true);
    });

    it('remaining is never negative', () => {
      for (let i = 0; i < MAX_UNLOCK_ATTEMPTS_PER_DAY + 5; i++) {
        incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');
      }

      const status = getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);
      expect(status.remaining).toBe(0);
      expect(status.remaining).toBeGreaterThanOrEqual(0);
    });
  });

  // ---- Per-action isolation ----

  describe('per-action isolation', () => {
    it('unlock and resend actions have independent counters', () => {
      incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');
      incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');

      incrementAttempt(RATE_LIMIT_ACTIONS.RESEND, 'usr-001');

      const unlockStatus = getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);
      const resendStatus = getRateLimitStatus(RATE_LIMIT_ACTIONS.RESEND);

      expect(unlockStatus.attemptsUsed).toBe(2);
      expect(resendStatus.attemptsUsed).toBe(1);
    });

    it('exhausting unlock does not affect resend', () => {
      for (let i = 0; i < MAX_UNLOCK_ATTEMPTS_PER_DAY; i++) {
        incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');
      }

      const unlockStatus = getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);
      const resendStatus = getRateLimitStatus(RATE_LIMIT_ACTIONS.RESEND);

      expect(unlockStatus.isExhausted).toBe(true);
      expect(resendStatus.isExhausted).toBe(false);
      expect(resendStatus.attemptsUsed).toBe(0);
    });

    it('exhausting resend does not affect unlock', () => {
      for (let i = 0; i < MAX_RESEND_ATTEMPTS_PER_DAY; i++) {
        incrementAttempt(RATE_LIMIT_ACTIONS.RESEND, 'usr-001');
      }

      const unlockStatus = getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);
      const resendStatus = getRateLimitStatus(RATE_LIMIT_ACTIONS.RESEND);

      expect(resendStatus.isExhausted).toBe(true);
      expect(unlockStatus.isExhausted).toBe(false);
      expect(unlockStatus.attemptsUsed).toBe(0);
    });

    it('resetting unlock does not affect resend', () => {
      incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');
      incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');
      incrementAttempt(RATE_LIMIT_ACTIONS.RESEND, 'usr-001');

      resetAttempts(RATE_LIMIT_ACTIONS.UNLOCK);

      const unlockStatus = getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);
      const resendStatus = getRateLimitStatus(RATE_LIMIT_ACTIONS.RESEND);

      expect(unlockStatus.attemptsUsed).toBe(0);
      expect(resendStatus.attemptsUsed).toBe(1);
    });

    it('resetting resend does not affect unlock', () => {
      incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');
      incrementAttempt(RATE_LIMIT_ACTIONS.RESEND, 'usr-001');
      incrementAttempt(RATE_LIMIT_ACTIONS.RESEND, 'usr-001');

      resetAttempts(RATE_LIMIT_ACTIONS.RESEND);

      const unlockStatus = getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);
      const resendStatus = getRateLimitStatus(RATE_LIMIT_ACTIONS.RESEND);

      expect(unlockStatus.attemptsUsed).toBe(1);
      expect(resendStatus.attemptsUsed).toBe(0);
    });
  });

  // ---- Calendar day reset logic ----

  describe('calendar day reset logic', () => {
    it('resets unlock attempts when the stored date is from a previous day', () => {
      // Manually set the stored date to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      localStorage.setItem(STORAGE_KEYS.UNLOCK_ATTEMPTS, JSON.stringify(3));
      localStorage.setItem(STORAGE_KEYS.UNLOCK_ATTEMPTS_DATE, JSON.stringify(yesterdayStr));

      const status = getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);

      expect(status.attemptsUsed).toBe(0);
      expect(status.remaining).toBe(MAX_UNLOCK_ATTEMPTS_PER_DAY);
      expect(status.isExhausted).toBe(false);
    });

    it('resets resend attempts when the stored date is from a previous day', () => {
      // Manually set the stored date to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      localStorage.setItem(STORAGE_KEYS.RESEND_ATTEMPTS, JSON.stringify(3));
      localStorage.setItem(STORAGE_KEYS.RESEND_ATTEMPTS_DATE, JSON.stringify(yesterdayStr));

      const status = getRateLimitStatus(RATE_LIMIT_ACTIONS.RESEND);

      expect(status.attemptsUsed).toBe(0);
      expect(status.remaining).toBe(MAX_RESEND_ATTEMPTS_PER_DAY);
      expect(status.isExhausted).toBe(false);
    });

    it('does not reset attempts when the stored date is today', () => {
      // Increment some attempts (this sets today's date)
      incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');
      incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');

      const status = getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);

      expect(status.attemptsUsed).toBe(2);
    });

    it('resets attempts when the stored date is null', () => {
      localStorage.setItem(STORAGE_KEYS.UNLOCK_ATTEMPTS, JSON.stringify(2));
      // Do not set a date — simulates missing date key

      const status = getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);

      expect(status.attemptsUsed).toBe(0);
    });

    it('resets attempts when the stored date is invalid', () => {
      localStorage.setItem(STORAGE_KEYS.UNLOCK_ATTEMPTS, JSON.stringify(2));
      localStorage.setItem(STORAGE_KEYS.UNLOCK_ATTEMPTS_DATE, JSON.stringify('not-a-date'));

      const status = getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);

      expect(status.attemptsUsed).toBe(0);
    });

    it('allows new attempts after calendar day reset', () => {
      // Simulate exhausted state from yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      localStorage.setItem(STORAGE_KEYS.UNLOCK_ATTEMPTS, JSON.stringify(MAX_UNLOCK_ATTEMPTS_PER_DAY));
      localStorage.setItem(STORAGE_KEYS.UNLOCK_ATTEMPTS_DATE, JSON.stringify(yesterdayStr));

      // Should be reset and allow new attempts
      const result = incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');

      expect(result.attemptsUsed).toBe(1);
      expect(result.isExhausted).toBe(false);
    });

    it('resets from a date several days ago', () => {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastWeekStr = `${lastWeek.getFullYear()}-${String(lastWeek.getMonth() + 1).padStart(2, '0')}-${String(lastWeek.getDate()).padStart(2, '0')}`;

      localStorage.setItem(STORAGE_KEYS.RESEND_ATTEMPTS, JSON.stringify(3));
      localStorage.setItem(STORAGE_KEYS.RESEND_ATTEMPTS_DATE, JSON.stringify(lastWeekStr));

      const status = getRateLimitStatus(RATE_LIMIT_ACTIONS.RESEND);

      expect(status.attemptsUsed).toBe(0);
      expect(status.isExhausted).toBe(false);
    });
  });

  // ---- resetAttempts ----

  describe('resetAttempts', () => {
    it('resets unlock attempt counter to 0', () => {
      incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');
      incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');

      expect(getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK).attemptsUsed).toBe(2);

      const result = resetAttempts(RATE_LIMIT_ACTIONS.UNLOCK);
      expect(result).toBe(true);

      const status = getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);
      expect(status.attemptsUsed).toBe(0);
      expect(status.remaining).toBe(MAX_UNLOCK_ATTEMPTS_PER_DAY);
      expect(status.isExhausted).toBe(false);
    });

    it('resets resend attempt counter to 0', () => {
      incrementAttempt(RATE_LIMIT_ACTIONS.RESEND, 'usr-001');
      incrementAttempt(RATE_LIMIT_ACTIONS.RESEND, 'usr-001');

      expect(getRateLimitStatus(RATE_LIMIT_ACTIONS.RESEND).attemptsUsed).toBe(2);

      const result = resetAttempts(RATE_LIMIT_ACTIONS.RESEND);
      expect(result).toBe(true);

      const status = getRateLimitStatus(RATE_LIMIT_ACTIONS.RESEND);
      expect(status.attemptsUsed).toBe(0);
      expect(status.remaining).toBe(MAX_RESEND_ATTEMPTS_PER_DAY);
      expect(status.isExhausted).toBe(false);
    });

    it('resets exhausted state back to non-exhausted', () => {
      for (let i = 0; i < MAX_UNLOCK_ATTEMPTS_PER_DAY; i++) {
        incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');
      }

      expect(getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK).isExhausted).toBe(true);

      resetAttempts(RATE_LIMIT_ACTIONS.UNLOCK);

      const status = getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);
      expect(status.isExhausted).toBe(false);
      expect(status.attemptsUsed).toBe(0);
    });

    it('allows new attempts after reset', () => {
      for (let i = 0; i < MAX_UNLOCK_ATTEMPTS_PER_DAY; i++) {
        incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');
      }

      resetAttempts(RATE_LIMIT_ACTIONS.UNLOCK);

      const result = incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');
      expect(result.attemptsUsed).toBe(1);
      expect(result.isExhausted).toBe(false);
    });

    it('returns true on successful reset', () => {
      const result = resetAttempts(RATE_LIMIT_ACTIONS.UNLOCK);
      expect(result).toBe(true);
    });
  });

  // ---- RATE_LIMIT_ACTIONS constants ----

  describe('RATE_LIMIT_ACTIONS', () => {
    it('has UNLOCK action defined', () => {
      expect(RATE_LIMIT_ACTIONS.UNLOCK).toBe('unlock');
    });

    it('has RESEND action defined', () => {
      expect(RATE_LIMIT_ACTIONS.RESEND).toBe('resend');
    });
  });

  // ---- Edge cases ----

  describe('edge cases', () => {
    it('handles corrupted attempt count in localStorage gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.UNLOCK_ATTEMPTS, '"not-a-number"');

      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      localStorage.setItem(STORAGE_KEYS.UNLOCK_ATTEMPTS_DATE, JSON.stringify(todayStr));

      const status = getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);

      // Should default to 0 for non-numeric values
      expect(status.attemptsUsed).toBe(0);
    });

    it('handles corrupted date in localStorage gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.UNLOCK_ATTEMPTS, JSON.stringify(2));
      localStorage.setItem(STORAGE_KEYS.UNLOCK_ATTEMPTS_DATE, 'not-valid-json');

      // Should not throw
      expect(() => {
        getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);
      }).not.toThrow();
    });

    it('getRateLimitStatus does not throw for unknown action type', () => {
      expect(() => {
        getRateLimitStatus('unknown_action');
      }).not.toThrow();

      const status = getRateLimitStatus('unknown_action');
      expect(status.attemptsUsed).toBe(0);
    });

    it('incrementAttempt does not throw for unknown action type', () => {
      expect(() => {
        incrementAttempt('unknown_action', 'usr-001');
      }).not.toThrow();
    });

    it('maxAttempts returns correct value for unlock', () => {
      const status = getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);
      expect(status.maxAttempts).toBe(MAX_UNLOCK_ATTEMPTS_PER_DAY);
    });

    it('maxAttempts returns correct value for resend', () => {
      const status = getRateLimitStatus(RATE_LIMIT_ACTIONS.RESEND);
      expect(status.maxAttempts).toBe(MAX_RESEND_ATTEMPTS_PER_DAY);
    });

    it('multiple rapid increments are all counted', () => {
      incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');
      incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');
      incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, 'usr-001');

      const status = getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);
      expect(status.attemptsUsed).toBe(3);
    });

    it('reset on fresh state does not cause errors', () => {
      expect(() => {
        resetAttempts(RATE_LIMIT_ACTIONS.UNLOCK);
      }).not.toThrow();

      const status = getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);
      expect(status.attemptsUsed).toBe(0);
    });
  });
});