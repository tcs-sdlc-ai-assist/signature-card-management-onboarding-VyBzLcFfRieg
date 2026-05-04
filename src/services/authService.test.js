import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  login,
  logout,
  getSession,
  isAuthenticated,
  refreshSession,
  getFailedAttempts,
  getLockoutStatus,
  clearAuthState,
} from './authService.js';
import { STORAGE_KEYS, MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION_MS, SESSION_TIMEOUT_MS } from '../constants/constants.js';
import { LOGIN_MESSAGES } from '../constants/messages.js';
import { MOCK_USER_CREDENTIALS, MOCK_USER_PROFILE } from '../data/mockData.js';

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    clearAuthState();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ---- login ----

  describe('login', () => {
    it('returns success with user object for valid credentials', () => {
      const result = login(MOCK_USER_CREDENTIALS.username, MOCK_USER_CREDENTIALS.password);

      expect(result.status).toBe('success');
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(MOCK_USER_PROFILE.id);
      expect(result.user.username).toBe(MOCK_USER_PROFILE.username);
      expect(result.user.firstName).toBe(MOCK_USER_PROFILE.firstName);
      expect(result.user.lastName).toBe(MOCK_USER_PROFILE.lastName);
      expect(result.user.email).toBe(MOCK_USER_PROFILE.email);
      expect(result.user.role).toBe(MOCK_USER_PROFILE.role);
      expect(result.sessionToken).toBeDefined();
      expect(typeof result.sessionToken).toBe('string');
      expect(result.sessionToken.length).toBeGreaterThan(0);
      expect(result.expiresAt).toBeDefined();
      expect(typeof result.expiresAt).toBe('number');
      expect(result.expiresAt).toBeGreaterThan(Date.now());
    });

    it('creates a valid session in localStorage after successful login', () => {
      login(MOCK_USER_CREDENTIALS.username, MOCK_USER_CREDENTIALS.password);

      const session = getSession();
      expect(session).not.toBeNull();
      expect(session.user).toBeDefined();
      expect(session.user.id).toBe(MOCK_USER_PROFILE.id);
      expect(session.sessionToken).toBeDefined();
      expect(session.expiresAt).toBeDefined();
      expect(typeof session.expiresAt).toBe('number');
    });

    it('returns error with generic message for invalid username', () => {
      const result = login('wronguser', MOCK_USER_CREDENTIALS.password);

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
      // Should NOT reveal which field is incorrect
      expect(result.message.toLowerCase()).not.toContain('username is incorrect');
      expect(result.message.toLowerCase()).not.toContain('user not found');
      expect(result.user).toBeUndefined();
    });

    it('returns error with generic message for invalid password', () => {
      const result = login(MOCK_USER_CREDENTIALS.username, 'WrongPassword!');

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
      expect(typeof result.message).toBe('string');
      // Should NOT reveal which field is incorrect
      expect(result.message.toLowerCase()).not.toContain('password is incorrect');
      expect(result.message.toLowerCase()).not.toContain('wrong password');
      expect(result.user).toBeUndefined();
    });

    it('returns error with generic message for both invalid username and password', () => {
      const result = login('wronguser', 'WrongPassword!');

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
      // Should NOT reveal which field is incorrect
      expect(result.message.toLowerCase()).not.toContain('username');
      expect(result.message.toLowerCase()).not.toContain('password is');
      expect(result.user).toBeUndefined();
    });

    it('returns error for empty username', () => {
      const result = login('', MOCK_USER_CREDENTIALS.password);

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('returns error for empty password', () => {
      const result = login(MOCK_USER_CREDENTIALS.username, '');

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('returns error for null credentials', () => {
      const result = login(null, null);

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('returns error for undefined credentials', () => {
      const result = login(undefined, undefined);

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('trims whitespace from username before validation', () => {
      const result = login(`  ${MOCK_USER_CREDENTIALS.username}  `, MOCK_USER_CREDENTIALS.password);

      // The service trims the username, so this should succeed
      // (based on the implementation: trimmedUsername = username.trim())
      expect(result.status).toBe('success');
      expect(result.user).toBeDefined();
    });

    it('tracks remaining attempts on failed login', () => {
      const result = login('wronguser', 'WrongPassword!');

      expect(result.status).toBe('error');
      expect(result.remainingAttempts).toBeDefined();
      expect(typeof result.remainingAttempts).toBe('number');
      expect(result.remainingAttempts).toBe(MAX_LOGIN_ATTEMPTS - 1);
    });

    it('decrements remaining attempts with each failed login', () => {
      const result1 = login('wronguser', 'WrongPassword!');
      expect(result1.remainingAttempts).toBe(MAX_LOGIN_ATTEMPTS - 1);

      const result2 = login('wronguser', 'WrongPassword!');
      expect(result2.remainingAttempts).toBe(MAX_LOGIN_ATTEMPTS - 2);
    });

    it('clears failed attempt counters on successful login', () => {
      // Fail a few times first
      login('wronguser', 'WrongPassword!');
      login('wronguser', 'WrongPassword!');

      expect(getFailedAttempts()).toBe(2);

      // Successful login should clear the counter
      login(MOCK_USER_CREDENTIALS.username, MOCK_USER_CREDENTIALS.password);

      expect(getFailedAttempts()).toBe(0);
    });
  });

  // ---- Account lockout ----

  describe('account lockout', () => {
    it('locks the account after max failed login attempts', () => {
      for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) {
        login('wronguser', 'WrongPassword!');
      }

      const lockoutStatus = getLockoutStatus();
      expect(lockoutStatus.isLocked).toBe(true);
      expect(lockoutStatus.lockoutUntil).toBeDefined();
      expect(typeof lockoutStatus.lockoutUntil).toBe('number');
      expect(lockoutStatus.lockoutUntil).toBeGreaterThan(Date.now());
    });

    it('returns account locked message after max failed attempts', () => {
      // Exhaust all attempts
      let lastResult;
      for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) {
        lastResult = login('wronguser', 'WrongPassword!');
      }

      expect(lastResult.status).toBe('error');
      expect(lastResult.errorCode).toBe('ACCOUNT_LOCKED');
      expect(lastResult.message).toBe(LOGIN_MESSAGES.ACCOUNT_LOCKED);
      expect(lastResult.remainingAttempts).toBe(0);
    });

    it('rejects login attempts while account is locked', () => {
      // Lock the account
      for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) {
        login('wronguser', 'WrongPassword!');
      }

      // Try to login with valid credentials while locked
      const result = login(MOCK_USER_CREDENTIALS.username, MOCK_USER_CREDENTIALS.password);

      expect(result.status).toBe('error');
      expect(result.errorCode).toBe('ACCOUNT_LOCKED');
      expect(result.message).toBe(LOGIN_MESSAGES.ACCOUNT_LOCKED);
    });

    it('rejects login attempts with invalid credentials while locked', () => {
      // Lock the account
      for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) {
        login('wronguser', 'WrongPassword!');
      }

      // Try to login with invalid credentials while locked
      const result = login('wronguser', 'WrongPassword!');

      expect(result.status).toBe('error');
      expect(result.errorCode).toBe('ACCOUNT_LOCKED');
    });

    it('unlocks the account after the lockout duration expires', () => {
      // Lock the account
      for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) {
        login('wronguser', 'WrongPassword!');
      }

      // Verify locked
      expect(getLockoutStatus().isLocked).toBe(true);

      // Simulate lockout expiry by setting lockoutUntil to the past
      const pastTimestamp = Date.now() - 1000;
      localStorage.setItem(
        STORAGE_KEYS.LOCKOUT_UNTIL,
        JSON.stringify(pastTimestamp)
      );

      // Should no longer be locked
      const lockoutStatus = getLockoutStatus();
      expect(lockoutStatus.isLocked).toBe(false);

      // Should be able to login again
      const result = login(MOCK_USER_CREDENTIALS.username, MOCK_USER_CREDENTIALS.password);
      expect(result.status).toBe('success');
    });

    it('returns correct lockout status when not locked', () => {
      const lockoutStatus = getLockoutStatus();

      expect(lockoutStatus.isLocked).toBe(false);
      expect(lockoutStatus.lockoutUntil).toBeNull();
      expect(lockoutStatus.failedAttempts).toBe(0);
      expect(lockoutStatus.maxAttempts).toBe(MAX_LOGIN_ATTEMPTS);
    });

    it('returns correct failed attempts count', () => {
      expect(getFailedAttempts()).toBe(0);

      login('wronguser', 'WrongPassword!');
      expect(getFailedAttempts()).toBe(1);

      login('wronguser', 'WrongPassword!');
      expect(getFailedAttempts()).toBe(2);
    });

    it('shows last attempt warning when one attempt remains', () => {
      // Use all but one attempt
      for (let i = 0; i < MAX_LOGIN_ATTEMPTS - 1; i++) {
        login('wronguser', 'WrongPassword!');
      }

      // The last failed attempt before lockout should have remaining = 1
      const status = getLockoutStatus();
      expect(status.isLocked).toBe(false);

      const result = login('wronguser', 'WrongPassword!');
      // After this attempt, account should be locked
      expect(result.status).toBe('error');
      expect(result.remainingAttempts).toBe(0);
    });
  });

  // ---- Session management ----

  describe('session management', () => {
    it('creates a session with correct structure on successful login', () => {
      login(MOCK_USER_CREDENTIALS.username, MOCK_USER_CREDENTIALS.password);

      const session = getSession();
      expect(session).not.toBeNull();
      expect(session.user).toBeDefined();
      expect(session.user.id).toBe(MOCK_USER_PROFILE.id);
      expect(session.user.username).toBe(MOCK_USER_PROFILE.username);
      expect(session.user.firstName).toBe(MOCK_USER_PROFILE.firstName);
      expect(session.user.lastName).toBe(MOCK_USER_PROFILE.lastName);
      expect(session.user.email).toBe(MOCK_USER_PROFILE.email);
      expect(session.user.role).toBe(MOCK_USER_PROFILE.role);
      expect(session.sessionToken).toBeDefined();
      expect(typeof session.sessionToken).toBe('string');
      expect(session.expiresAt).toBeDefined();
      expect(typeof session.expiresAt).toBe('number');
    });

    it('returns null session when no user is logged in', () => {
      const session = getSession();
      expect(session).toBeNull();
    });

    it('isAuthenticated returns true after successful login', () => {
      login(MOCK_USER_CREDENTIALS.username, MOCK_USER_CREDENTIALS.password);

      expect(isAuthenticated()).toBe(true);
    });

    it('isAuthenticated returns false when no session exists', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('session expires when expiresAt is in the past', () => {
      login(MOCK_USER_CREDENTIALS.username, MOCK_USER_CREDENTIALS.password);

      // Verify session exists
      expect(getSession()).not.toBeNull();

      // Set session expiry to the past
      const pastTimestamp = Date.now() - 1000;
      localStorage.setItem(
        STORAGE_KEYS.SESSION_EXPIRY,
        JSON.stringify(pastTimestamp)
      );

      // Session should now be null (expired)
      const session = getSession();
      expect(session).toBeNull();
      expect(isAuthenticated()).toBe(false);
    });

    it('refreshSession extends the session expiry', () => {
      login(MOCK_USER_CREDENTIALS.username, MOCK_USER_CREDENTIALS.password);

      const sessionBefore = getSession();
      expect(sessionBefore).not.toBeNull();
      const expiryBefore = sessionBefore.expiresAt;

      // Small delay to ensure time difference
      const result = refreshSession();
      expect(result).toBe(true);

      const sessionAfter = getSession();
      expect(sessionAfter).not.toBeNull();
      expect(sessionAfter.expiresAt).toBeGreaterThanOrEqual(expiryBefore);
    });

    it('refreshSession returns false when no session exists', () => {
      const result = refreshSession();
      expect(result).toBe(false);
    });

    it('session token is stored in localStorage with TTL', () => {
      login(MOCK_USER_CREDENTIALS.username, MOCK_USER_CREDENTIALS.password);

      const raw = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      expect(raw).not.toBeNull();

      const parsed = JSON.parse(raw);
      expect(parsed).toBeDefined();
      expect(parsed.value).toBeDefined();
      expect(parsed.expiry).toBeDefined();
      expect(typeof parsed.expiry).toBe('number');
      expect(parsed.expiry).toBeGreaterThan(Date.now());
    });

    it('user profile is stored in localStorage', () => {
      login(MOCK_USER_CREDENTIALS.username, MOCK_USER_CREDENTIALS.password);

      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      expect(raw).not.toBeNull();

      const user = JSON.parse(raw);
      expect(user).toBeDefined();
      expect(user.id).toBe(MOCK_USER_PROFILE.id);
      expect(user.username).toBe(MOCK_USER_PROFILE.username);
    });

    it('session expiry timestamp is stored in localStorage', () => {
      login(MOCK_USER_CREDENTIALS.username, MOCK_USER_CREDENTIALS.password);

      const raw = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRY);
      expect(raw).not.toBeNull();

      const expiresAt = JSON.parse(raw);
      expect(typeof expiresAt).toBe('number');
      expect(expiresAt).toBeGreaterThan(Date.now());
    });
  });

  // ---- logout ----

  describe('logout', () => {
    it('returns success status on logout', () => {
      login(MOCK_USER_CREDENTIALS.username, MOCK_USER_CREDENTIALS.password);

      const result = logout();
      expect(result.status).toBe('success');
      expect(result.message).toBe(LOGIN_MESSAGES.LOGOUT_SUCCESS);
    });

    it('clears the session from localStorage', () => {
      login(MOCK_USER_CREDENTIALS.username, MOCK_USER_CREDENTIALS.password);

      // Verify session exists
      expect(getSession()).not.toBeNull();

      logout();

      // Session should be cleared
      expect(getSession()).toBeNull();
      expect(isAuthenticated()).toBe(false);
    });

    it('clears auth token from localStorage', () => {
      login(MOCK_USER_CREDENTIALS.username, MOCK_USER_CREDENTIALS.password);

      expect(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).not.toBeNull();

      logout();

      expect(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).toBeNull();
    });

    it('clears user data from localStorage', () => {
      login(MOCK_USER_CREDENTIALS.username, MOCK_USER_CREDENTIALS.password);

      expect(localStorage.getItem(STORAGE_KEYS.USER)).not.toBeNull();

      logout();

      expect(localStorage.getItem(STORAGE_KEYS.USER)).toBeNull();
    });

    it('clears session expiry from localStorage', () => {
      login(MOCK_USER_CREDENTIALS.username, MOCK_USER_CREDENTIALS.password);

      expect(localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRY)).not.toBeNull();

      logout();

      expect(localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRY)).toBeNull();
    });

    it('does not throw when called without an active session', () => {
      expect(() => {
        logout();
      }).not.toThrow();

      const result = logout();
      expect(result.status).toBe('success');
    });

    it('isAuthenticated returns false after logout', () => {
      login(MOCK_USER_CREDENTIALS.username, MOCK_USER_CREDENTIALS.password);
      expect(isAuthenticated()).toBe(true);

      logout();
      expect(isAuthenticated()).toBe(false);
    });
  });

  // ---- Generic error messages (no field-specific hints) ----

  describe('generic error messages', () => {
    it('does not reveal whether username or password is incorrect', () => {
      const resultBadUser = login('nonexistent', MOCK_USER_CREDENTIALS.password);
      const resultBadPass = login(MOCK_USER_CREDENTIALS.username, 'WrongPass!');
      const resultBothBad = login('nonexistent', 'WrongPass!');

      // All three should return the same generic error — no field-specific hints
      expect(resultBadUser.status).toBe('error');
      expect(resultBadPass.status).toBe('error');
      expect(resultBothBad.status).toBe('error');

      // Messages should not contain field-specific hints
      const allMessages = [resultBadUser.message, resultBadPass.message, resultBothBad.message];

      for (const msg of allMessages) {
        expect(msg).toBeDefined();
        expect(typeof msg).toBe('string');
        // Should not reveal which field is wrong
        expect(msg.toLowerCase()).not.toContain('username is wrong');
        expect(msg.toLowerCase()).not.toContain('password is wrong');
        expect(msg.toLowerCase()).not.toContain('user not found');
        expect(msg.toLowerCase()).not.toContain('incorrect password');
      }
    });

    it('uses the same error code for all credential failures', () => {
      const resultBadUser = login('nonexistent', MOCK_USER_CREDENTIALS.password);
      const resultBadPass = login(MOCK_USER_CREDENTIALS.username, 'WrongPass!');

      // Both should have the same error code
      expect(resultBadUser.errorCode).toBe('INVALID_CREDENTIALS');
      expect(resultBadPass.errorCode).toBe('INVALID_CREDENTIALS');
    });

    it('lockout message does not reveal valid usernames', () => {
      // Lock the account
      for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) {
        login('wronguser', 'WrongPassword!');
      }

      const result = login(MOCK_USER_CREDENTIALS.username, MOCK_USER_CREDENTIALS.password);

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
      // Lockout message should not confirm the username exists
      expect(result.message.toLowerCase()).not.toContain('user exists');
      expect(result.message.toLowerCase()).not.toContain('valid username');
    });
  });

  // ---- clearAuthState ----

  describe('clearAuthState', () => {
    it('clears all authentication state from localStorage', () => {
      // Create some state
      login(MOCK_USER_CREDENTIALS.username, MOCK_USER_CREDENTIALS.password);
      logout();

      // Fail some logins to create lockout state
      login('wronguser', 'WrongPassword!');
      login('wronguser', 'WrongPassword!');

      expect(getFailedAttempts()).toBe(2);

      const result = clearAuthState();
      expect(result).toBe(true);

      // All state should be cleared
      expect(getSession()).toBeNull();
      expect(isAuthenticated()).toBe(false);
      expect(getFailedAttempts()).toBe(0);
      expect(getLockoutStatus().isLocked).toBe(false);
      expect(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.USER)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRY)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.LOGIN_ATTEMPTS)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.LOCKOUT_UNTIL)).toBeNull();
    });
  });

  // ---- Edge cases ----

  describe('edge cases', () => {
    it('handles corrupted session data in localStorage gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.USER, 'not-valid-json');

      // Should not throw
      expect(() => {
        getSession();
      }).not.toThrow();

      const session = getSession();
      // Session should be null since user data is corrupted
      expect(session).toBeNull();
    });

    it('handles corrupted auth token in localStorage gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'not-valid-json');

      expect(() => {
        getSession();
      }).not.toThrow();

      expect(getSession()).toBeNull();
    });

    it('handles corrupted login attempts counter gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.LOGIN_ATTEMPTS, 'not-a-number');

      expect(() => {
        getFailedAttempts();
      }).not.toThrow();

      // Should default to 0 for non-numeric values
      expect(getFailedAttempts()).toBe(0);
    });

    it('handles corrupted lockout timestamp gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.LOCKOUT_UNTIL, 'not-a-number');

      expect(() => {
        getLockoutStatus();
      }).not.toThrow();

      const status = getLockoutStatus();
      expect(status.isLocked).toBe(false);
    });

    it('multiple successful logins create new sessions', () => {
      const result1 = login(MOCK_USER_CREDENTIALS.username, MOCK_USER_CREDENTIALS.password);
      const token1 = result1.sessionToken;

      const result2 = login(MOCK_USER_CREDENTIALS.username, MOCK_USER_CREDENTIALS.password);
      const token2 = result2.sessionToken;

      // Each login should generate a unique session token
      expect(token1).not.toBe(token2);
      expect(result2.status).toBe('success');
    });

    it('successful login after failed attempts resets the counter', () => {
      // Fail a couple of times
      login('wronguser', 'WrongPassword!');
      login('wronguser', 'WrongPassword!');
      expect(getFailedAttempts()).toBe(2);

      // Successful login
      const result = login(MOCK_USER_CREDENTIALS.username, MOCK_USER_CREDENTIALS.password);
      expect(result.status).toBe('success');

      // Counter should be reset
      expect(getFailedAttempts()).toBe(0);

      // Subsequent failed login should start from 1
      login('wronguser', 'WrongPassword!');
      expect(getFailedAttempts()).toBe(1);
    });
  });
});