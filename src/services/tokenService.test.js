import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  validateESignToken,
  getTokenStatus,
  updateTokenStatus,
  getTokenValidationAttempts,
  resetTokenState,
  TOKEN_STATUSES,
} from './tokenService.js';
import {
  MOCK_ESIGN_TOKEN_VALID,
  MOCK_ESIGN_TOKEN_EXPIRED,
  MOCK_USER_PROFILE,
} from '../data/mockData.js';
import { TOKEN_MESSAGES } from '../constants/messages.js';

describe('tokenService', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTokenState();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ---- validateESignToken ----

  describe('validateESignToken', () => {
    it('returns success for a valid token associated with the correct user', () => {
      const result = validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: MOCK_ESIGN_TOKEN_VALID.token,
      });

      expect(result.status).toBe('success');
      expect(result.tokenStatus).toBe(TOKEN_STATUSES.CONFIRMED);
      expect(result.message).toBeDefined();
      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
      expect(result.attemptsUsed).toBeDefined();
      expect(typeof result.attemptsUsed).toBe('number');
      expect(result.attemptsUsed).toBe(1);
      expect(result.attemptsRemaining).toBeDefined();
      expect(typeof result.attemptsRemaining).toBe('number');
      expect(result.attemptsRemaining).toBe(2);
    });

    it('rejects an expired token', () => {
      const result = validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: MOCK_ESIGN_TOKEN_EXPIRED.token,
      });

      expect(result.status).toBe('error');
      expect(result.tokenStatus).toBe(TOKEN_STATUSES.EXPIRED);
      expect(result.errorCode).toBe('TOKEN_EXPIRED');
      expect(result.message).toBe(TOKEN_MESSAGES.TOKEN_EXPIRED);
      expect(result.attemptsUsed).toBe(1);
      expect(result.attemptsRemaining).toBe(2);
    });

    it('rejects a token not associated with the requesting user', () => {
      const result = validateESignToken({
        userId: 'usr-999-wrong-user',
        token: MOCK_ESIGN_TOKEN_VALID.token,
      });

      expect(result.status).toBe('error');
      expect(result.tokenStatus).toBe(TOKEN_STATUSES.INVALID);
      expect(result.errorCode).toBe('TOKEN_INVALID');
      expect(result.message).toBe(TOKEN_MESSAGES.TOKEN_INVALID);
      expect(result.attemptsUsed).toBe(1);
    });

    it('rejects a token that does not exist in mock data', () => {
      const result = validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: 'completely-invalid-token-string',
      });

      expect(result.status).toBe('error');
      expect(result.tokenStatus).toBe(TOKEN_STATUSES.INVALID);
      expect(result.errorCode).toBe('TOKEN_INVALID');
      expect(result.message).toBe(TOKEN_MESSAGES.TOKEN_INVALID);
      expect(result.attemptsUsed).toBe(1);
      expect(result.attemptsRemaining).toBe(2);
    });

    it('rejects an empty token string', () => {
      const result = validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: '',
      });

      expect(result.status).toBe('error');
      expect(result.errorCode).toBe('TOKEN_INVALID');
      expect(result.message).toBe(TOKEN_MESSAGES.TOKEN_INVALID);
      expect(result.attemptsUsed).toBe(1);
    });

    it('rejects a null token', () => {
      const result = validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: null,
      });

      expect(result.status).toBe('error');
      expect(result.errorCode).toBe('TOKEN_INVALID');
      expect(result.message).toBe(TOKEN_MESSAGES.TOKEN_INVALID);
      expect(result.attemptsUsed).toBe(1);
    });

    it('rejects an undefined token', () => {
      const result = validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: undefined,
      });

      expect(result.status).toBe('error');
      expect(result.errorCode).toBe('TOKEN_INVALID');
      expect(result.message).toBe(TOKEN_MESSAGES.TOKEN_INVALID);
    });

    it('rejects a whitespace-only token', () => {
      const result = validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: '   ',
      });

      expect(result.status).toBe('error');
      expect(result.errorCode).toBe('TOKEN_INVALID');
      expect(result.message).toBe(TOKEN_MESSAGES.TOKEN_INVALID);
    });

    it('rejects when userId is missing', () => {
      const result = validateESignToken({
        userId: null,
        token: MOCK_ESIGN_TOKEN_VALID.token,
      });

      expect(result.status).toBe('error');
      expect(result.errorCode).toBe('INVALID_REQUEST');
      expect(result.message).toBe(TOKEN_MESSAGES.TOKEN_INVALID);
    });

    it('rejects when userId is undefined', () => {
      const result = validateESignToken({
        token: MOCK_ESIGN_TOKEN_VALID.token,
      });

      expect(result.status).toBe('error');
      expect(result.errorCode).toBe('INVALID_REQUEST');
      expect(result.message).toBe(TOKEN_MESSAGES.TOKEN_INVALID);
    });

    it('handles empty params gracefully', () => {
      const result = validateESignToken();

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('handles no params gracefully', () => {
      const result = validateESignToken({});

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });
  });

  // ---- Rate limiting ----

  describe('rate limiting', () => {
    it('tracks attempt count across multiple validation calls', () => {
      const result1 = validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: 'invalid-token-1',
      });
      expect(result1.attemptsUsed).toBe(1);
      expect(result1.attemptsRemaining).toBe(2);

      const result2 = validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: 'invalid-token-2',
      });
      expect(result2.attemptsUsed).toBe(2);
      expect(result2.attemptsRemaining).toBe(1);

      const result3 = validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: 'invalid-token-3',
      });
      expect(result3.attemptsUsed).toBe(3);
      expect(result3.attemptsRemaining).toBe(0);
    });

    it('rejects validation after max attempts are exhausted', () => {
      // Exhaust all 3 attempts
      validateESignToken({ userId: MOCK_USER_PROFILE.id, token: 'bad-1' });
      validateESignToken({ userId: MOCK_USER_PROFILE.id, token: 'bad-2' });
      validateESignToken({ userId: MOCK_USER_PROFILE.id, token: 'bad-3' });

      // Fourth attempt should be rejected due to rate limit
      const result = validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: MOCK_ESIGN_TOKEN_VALID.token,
      });

      expect(result.status).toBe('error');
      expect(result.errorCode).toBe('RATE_LIMIT_EXCEEDED');
      expect(result.message).toBe(TOKEN_MESSAGES.TOKEN_REFRESH_FAILED);
      expect(result.attemptsUsed).toBe(3);
      expect(result.attemptsRemaining).toBe(0);
    });

    it('counts successful validations toward the attempt limit', () => {
      const result1 = validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: MOCK_ESIGN_TOKEN_VALID.token,
      });
      expect(result1.status).toBe('success');
      expect(result1.attemptsUsed).toBe(1);

      const result2 = validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: 'invalid-token',
      });
      expect(result2.attemptsUsed).toBe(2);
    });

    it('resets attempts after calling resetTokenState', () => {
      validateESignToken({ userId: MOCK_USER_PROFILE.id, token: 'bad-1' });
      validateESignToken({ userId: MOCK_USER_PROFILE.id, token: 'bad-2' });

      const attemptsBefore = getTokenValidationAttempts();
      expect(attemptsBefore.attemptsUsed).toBe(2);

      resetTokenState();

      const attemptsAfter = getTokenValidationAttempts();
      expect(attemptsAfter.attemptsUsed).toBe(0);
      expect(attemptsAfter.attemptsRemaining).toBe(3);
      expect(attemptsAfter.isExhausted).toBe(false);
    });
  });

  // ---- getTokenValidationAttempts ----

  describe('getTokenValidationAttempts', () => {
    it('returns 0 attempts used on fresh state', () => {
      const attempts = getTokenValidationAttempts();

      expect(attempts.attemptsUsed).toBe(0);
      expect(attempts.maxAttempts).toBe(3);
      expect(attempts.attemptsRemaining).toBe(3);
      expect(attempts.isExhausted).toBe(false);
    });

    it('returns correct counts after one attempt', () => {
      validateESignToken({ userId: MOCK_USER_PROFILE.id, token: 'bad' });

      const attempts = getTokenValidationAttempts();

      expect(attempts.attemptsUsed).toBe(1);
      expect(attempts.attemptsRemaining).toBe(2);
      expect(attempts.isExhausted).toBe(false);
    });

    it('returns exhausted state after max attempts', () => {
      validateESignToken({ userId: MOCK_USER_PROFILE.id, token: 'bad-1' });
      validateESignToken({ userId: MOCK_USER_PROFILE.id, token: 'bad-2' });
      validateESignToken({ userId: MOCK_USER_PROFILE.id, token: 'bad-3' });

      const attempts = getTokenValidationAttempts();

      expect(attempts.attemptsUsed).toBe(3);
      expect(attempts.attemptsRemaining).toBe(0);
      expect(attempts.isExhausted).toBe(true);
    });

    it('attemptsRemaining is never negative', () => {
      validateESignToken({ userId: MOCK_USER_PROFILE.id, token: 'bad-1' });
      validateESignToken({ userId: MOCK_USER_PROFILE.id, token: 'bad-2' });
      validateESignToken({ userId: MOCK_USER_PROFILE.id, token: 'bad-3' });

      const attempts = getTokenValidationAttempts();

      expect(attempts.attemptsRemaining).toBe(0);
      expect(attempts.attemptsRemaining).toBeGreaterThanOrEqual(0);
    });
  });

  // ---- getTokenStatus ----

  describe('getTokenStatus', () => {
    it('returns pending status for a valid unvalidated token', () => {
      const status = getTokenStatus(MOCK_ESIGN_TOKEN_VALID.token);

      expect(status.tokenStatus).toBe(TOKEN_STATUSES.PENDING);
      expect(status.userId).toBe(MOCK_USER_PROFILE.id);
      expect(status.validatedAt).toBeNull();
    });

    it('returns expired status for an expired token', () => {
      const status = getTokenStatus(MOCK_ESIGN_TOKEN_EXPIRED.token);

      expect(status.tokenStatus).toBe(TOKEN_STATUSES.EXPIRED);
      expect(status.userId).toBe(MOCK_USER_PROFILE.id);
      expect(status.validatedAt).toBeNull();
    });

    it('returns confirmed status after successful validation', () => {
      validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: MOCK_ESIGN_TOKEN_VALID.token,
      });

      const status = getTokenStatus(MOCK_ESIGN_TOKEN_VALID.token);

      expect(status.tokenStatus).toBe(TOKEN_STATUSES.CONFIRMED);
      expect(status.userId).toBe(MOCK_USER_PROFILE.id);
      expect(status.validatedAt).toBeDefined();
      expect(typeof status.validatedAt).toBe('string');
      expect(status.validatedAt.length).toBeGreaterThan(0);
    });

    it('returns expired status after failed validation of expired token', () => {
      validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: MOCK_ESIGN_TOKEN_EXPIRED.token,
      });

      const status = getTokenStatus(MOCK_ESIGN_TOKEN_EXPIRED.token);

      expect(status.tokenStatus).toBe(TOKEN_STATUSES.EXPIRED);
      expect(status.userId).toBe(MOCK_USER_PROFILE.id);
      expect(status.validatedAt).toBeDefined();
    });

    it('returns invalid status for an unknown token', () => {
      const status = getTokenStatus('completely-unknown-token');

      expect(status.tokenStatus).toBe(TOKEN_STATUSES.INVALID);
      expect(status.userId).toBeNull();
      expect(status.validatedAt).toBeNull();
    });

    it('returns invalid status for null token', () => {
      const status = getTokenStatus(null);

      expect(status.tokenStatus).toBe(TOKEN_STATUSES.INVALID);
      expect(status.userId).toBeNull();
      expect(status.validatedAt).toBeNull();
    });

    it('returns invalid status for undefined token', () => {
      const status = getTokenStatus(undefined);

      expect(status.tokenStatus).toBe(TOKEN_STATUSES.INVALID);
      expect(status.userId).toBeNull();
      expect(status.validatedAt).toBeNull();
    });

    it('returns invalid status for empty string token', () => {
      const status = getTokenStatus('');

      expect(status.tokenStatus).toBe(TOKEN_STATUSES.INVALID);
      expect(status.userId).toBeNull();
      expect(status.validatedAt).toBeNull();
    });
  });

  // ---- updateTokenStatus ----

  describe('updateTokenStatus', () => {
    it('updates token status from pending to confirmed', () => {
      const result = updateTokenStatus({
        token: MOCK_ESIGN_TOKEN_VALID.token,
        userId: MOCK_USER_PROFILE.id,
        newStatus: TOKEN_STATUSES.CONFIRMED,
      });

      expect(result.status).toBe('success');
      expect(result.tokenStatus).toBe(TOKEN_STATUSES.CONFIRMED);
      expect(result.message).toBeDefined();
      expect(typeof result.message).toBe('string');

      // Verify the status was persisted
      const status = getTokenStatus(MOCK_ESIGN_TOKEN_VALID.token);
      expect(status.tokenStatus).toBe(TOKEN_STATUSES.CONFIRMED);
      expect(status.userId).toBe(MOCK_USER_PROFILE.id);
      expect(status.validatedAt).toBeDefined();
    });

    it('rejects invalid status transition from expired to confirmed', () => {
      // First, validate the expired token to set its status to expired
      validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: MOCK_ESIGN_TOKEN_EXPIRED.token,
      });

      const result = updateTokenStatus({
        token: MOCK_ESIGN_TOKEN_EXPIRED.token,
        userId: MOCK_USER_PROFILE.id,
        newStatus: TOKEN_STATUSES.CONFIRMED,
      });

      expect(result.status).toBe('error');
      expect(result.errorCode).toBe('INVALID_TRANSITION');
      expect(result.message).toBeDefined();
    });

    it('rejects update with missing token', () => {
      const result = updateTokenStatus({
        token: '',
        userId: MOCK_USER_PROFILE.id,
        newStatus: TOKEN_STATUSES.CONFIRMED,
      });

      expect(result.status).toBe('error');
      expect(result.errorCode).toBe('INVALID_REQUEST');
      expect(result.message).toBe(TOKEN_MESSAGES.TOKEN_INVALID);
    });

    it('rejects update with null token', () => {
      const result = updateTokenStatus({
        token: null,
        userId: MOCK_USER_PROFILE.id,
        newStatus: TOKEN_STATUSES.CONFIRMED,
      });

      expect(result.status).toBe('error');
      expect(result.errorCode).toBe('INVALID_REQUEST');
    });

    it('rejects update with missing userId', () => {
      const result = updateTokenStatus({
        token: MOCK_ESIGN_TOKEN_VALID.token,
        userId: null,
        newStatus: TOKEN_STATUSES.CONFIRMED,
      });

      expect(result.status).toBe('error');
      expect(result.errorCode).toBe('INVALID_REQUEST');
    });

    it('rejects update with invalid status value', () => {
      const result = updateTokenStatus({
        token: MOCK_ESIGN_TOKEN_VALID.token,
        userId: MOCK_USER_PROFILE.id,
        newStatus: 'not_a_valid_status',
      });

      expect(result.status).toBe('error');
      expect(result.errorCode).toBe('INVALID_STATUS');
      expect(result.message).toBeDefined();
    });

    it('rejects update with missing newStatus', () => {
      const result = updateTokenStatus({
        token: MOCK_ESIGN_TOKEN_VALID.token,
        userId: MOCK_USER_PROFILE.id,
      });

      expect(result.status).toBe('error');
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('allows updating an already confirmed token to confirmed (idempotent)', () => {
      // First confirm the token
      updateTokenStatus({
        token: MOCK_ESIGN_TOKEN_VALID.token,
        userId: MOCK_USER_PROFILE.id,
        newStatus: TOKEN_STATUSES.CONFIRMED,
      });

      // Update again to confirmed — should succeed (idempotent)
      const result = updateTokenStatus({
        token: MOCK_ESIGN_TOKEN_VALID.token,
        userId: MOCK_USER_PROFILE.id,
        newStatus: TOKEN_STATUSES.CONFIRMED,
      });

      expect(result.status).toBe('success');
      expect(result.tokenStatus).toBe(TOKEN_STATUSES.CONFIRMED);
    });

    it('handles empty params gracefully', () => {
      const result = updateTokenStatus();

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });
  });

  // ---- resetTokenState ----

  describe('resetTokenState', () => {
    it('resets attempt counters to 0', () => {
      validateESignToken({ userId: MOCK_USER_PROFILE.id, token: 'bad-1' });
      validateESignToken({ userId: MOCK_USER_PROFILE.id, token: 'bad-2' });

      expect(getTokenValidationAttempts().attemptsUsed).toBe(2);

      const result = resetTokenState();
      expect(result).toBe(true);

      const attempts = getTokenValidationAttempts();
      expect(attempts.attemptsUsed).toBe(0);
      expect(attempts.attemptsRemaining).toBe(3);
      expect(attempts.isExhausted).toBe(false);
    });

    it('clears stored token statuses', () => {
      // Validate a token to store its status
      validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: MOCK_ESIGN_TOKEN_VALID.token,
      });

      const statusBefore = getTokenStatus(MOCK_ESIGN_TOKEN_VALID.token);
      expect(statusBefore.tokenStatus).toBe(TOKEN_STATUSES.CONFIRMED);

      resetTokenState();

      // After reset, the token should revert to its mock data status (pending)
      const statusAfter = getTokenStatus(MOCK_ESIGN_TOKEN_VALID.token);
      expect(statusAfter.tokenStatus).toBe(TOKEN_STATUSES.PENDING);
    });

    it('allows new validation attempts after reset', () => {
      // Exhaust all attempts
      validateESignToken({ userId: MOCK_USER_PROFILE.id, token: 'bad-1' });
      validateESignToken({ userId: MOCK_USER_PROFILE.id, token: 'bad-2' });
      validateESignToken({ userId: MOCK_USER_PROFILE.id, token: 'bad-3' });

      expect(getTokenValidationAttempts().isExhausted).toBe(true);

      resetTokenState();

      // Should be able to validate again
      const result = validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: MOCK_ESIGN_TOKEN_VALID.token,
      });

      expect(result.status).toBe('success');
      expect(result.tokenStatus).toBe(TOKEN_STATUSES.CONFIRMED);
      expect(result.attemptsUsed).toBe(1);
    });

    it('returns true on successful reset', () => {
      const result = resetTokenState();
      expect(result).toBe(true);
    });

    it('does not throw when called on fresh state', () => {
      expect(() => {
        resetTokenState();
      }).not.toThrow();
    });
  });

  // ---- TOKEN_STATUSES constants ----

  describe('TOKEN_STATUSES', () => {
    it('has PENDING status defined', () => {
      expect(TOKEN_STATUSES.PENDING).toBe('pending');
    });

    it('has CONFIRMED status defined', () => {
      expect(TOKEN_STATUSES.CONFIRMED).toBe('confirmed');
    });

    it('has EXPIRED status defined', () => {
      expect(TOKEN_STATUSES.EXPIRED).toBe('expired');
    });

    it('has INVALID status defined', () => {
      expect(TOKEN_STATUSES.INVALID).toBe('invalid');
    });
  });

  // ---- Token status lifecycle ----

  describe('token status lifecycle', () => {
    it('transitions from pending to confirmed via validateESignToken', () => {
      // Before validation — pending
      const statusBefore = getTokenStatus(MOCK_ESIGN_TOKEN_VALID.token);
      expect(statusBefore.tokenStatus).toBe(TOKEN_STATUSES.PENDING);

      // Validate
      const result = validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: MOCK_ESIGN_TOKEN_VALID.token,
      });
      expect(result.status).toBe('success');
      expect(result.tokenStatus).toBe(TOKEN_STATUSES.CONFIRMED);

      // After validation — confirmed
      const statusAfter = getTokenStatus(MOCK_ESIGN_TOKEN_VALID.token);
      expect(statusAfter.tokenStatus).toBe(TOKEN_STATUSES.CONFIRMED);
      expect(statusAfter.validatedAt).toBeDefined();
    });

    it('transitions from pending to expired via validateESignToken for expired token', () => {
      // Before validation — expired (from mock data)
      const statusBefore = getTokenStatus(MOCK_ESIGN_TOKEN_EXPIRED.token);
      expect(statusBefore.tokenStatus).toBe(TOKEN_STATUSES.EXPIRED);

      // Validate
      const result = validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: MOCK_ESIGN_TOKEN_EXPIRED.token,
      });
      expect(result.status).toBe('error');
      expect(result.tokenStatus).toBe(TOKEN_STATUSES.EXPIRED);

      // After validation — still expired but now with validatedAt
      const statusAfter = getTokenStatus(MOCK_ESIGN_TOKEN_EXPIRED.token);
      expect(statusAfter.tokenStatus).toBe(TOKEN_STATUSES.EXPIRED);
      expect(statusAfter.validatedAt).toBeDefined();
    });

    it('transitions from pending to confirmed via updateTokenStatus', () => {
      const statusBefore = getTokenStatus(MOCK_ESIGN_TOKEN_VALID.token);
      expect(statusBefore.tokenStatus).toBe(TOKEN_STATUSES.PENDING);

      const result = updateTokenStatus({
        token: MOCK_ESIGN_TOKEN_VALID.token,
        userId: MOCK_USER_PROFILE.id,
        newStatus: TOKEN_STATUSES.CONFIRMED,
      });
      expect(result.status).toBe('success');

      const statusAfter = getTokenStatus(MOCK_ESIGN_TOKEN_VALID.token);
      expect(statusAfter.tokenStatus).toBe(TOKEN_STATUSES.CONFIRMED);
    });
  });

  // ---- Edge cases ----

  describe('edge cases', () => {
    it('handles corrupted token attempts in localStorage gracefully', () => {
      localStorage.setItem('scm_token_attempts', '"not-a-number"');

      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      localStorage.setItem('scm_token_attempts_date', JSON.stringify(todayStr));

      expect(() => {
        getTokenValidationAttempts();
      }).not.toThrow();

      const attempts = getTokenValidationAttempts();
      expect(attempts.attemptsUsed).toBe(0);
    });

    it('handles corrupted token status map in localStorage gracefully', () => {
      localStorage.setItem('scm_token_status', 'not-valid-json');

      expect(() => {
        getTokenStatus(MOCK_ESIGN_TOKEN_VALID.token);
      }).not.toThrow();
    });

    it('trims whitespace from token before validation', () => {
      const result = validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: `  ${MOCK_ESIGN_TOKEN_VALID.token}  `,
      });

      // The token should be trimmed and match the mock data
      // Note: findMockToken trims the token, so this should work
      expect(result.status).toBe('success');
      expect(result.tokenStatus).toBe(TOKEN_STATUSES.CONFIRMED);
    });

    it('does not throw when validateESignToken is called with non-string token type', () => {
      expect(() => {
        validateESignToken({
          userId: MOCK_USER_PROFILE.id,
          token: 12345,
        });
      }).not.toThrow();

      const result = validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: 12345,
      });
      expect(result.status).toBe('error');
    });

    it('resets token attempts when stored date is from a previous day', () => {
      // Manually set the stored date to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      localStorage.setItem('scm_token_attempts', JSON.stringify(3));
      localStorage.setItem('scm_token_attempts_date', JSON.stringify(yesterdayStr));

      const attempts = getTokenValidationAttempts();

      expect(attempts.attemptsUsed).toBe(0);
      expect(attempts.attemptsRemaining).toBe(3);
      expect(attempts.isExhausted).toBe(false);
    });

    it('allows validation after calendar day reset of exhausted attempts', () => {
      // Simulate exhausted state from yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      localStorage.setItem('scm_token_attempts', JSON.stringify(3));
      localStorage.setItem('scm_token_attempts_date', JSON.stringify(yesterdayStr));

      // Should be able to validate again after day reset
      const result = validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: MOCK_ESIGN_TOKEN_VALID.token,
      });

      expect(result.status).toBe('success');
      expect(result.tokenStatus).toBe(TOKEN_STATUSES.CONFIRMED);
      expect(result.attemptsUsed).toBe(1);
    });

    it('multiple successful validations of the same token all succeed', () => {
      const result1 = validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: MOCK_ESIGN_TOKEN_VALID.token,
      });
      expect(result1.status).toBe('success');
      expect(result1.attemptsUsed).toBe(1);

      const result2 = validateESignToken({
        userId: MOCK_USER_PROFILE.id,
        token: MOCK_ESIGN_TOKEN_VALID.token,
      });
      expect(result2.status).toBe('success');
      expect(result2.attemptsUsed).toBe(2);
    });
  });
});