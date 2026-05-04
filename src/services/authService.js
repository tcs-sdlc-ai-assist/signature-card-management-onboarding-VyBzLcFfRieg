/**
 * Authentication and session management service.
 *
 * Handles login (credential validation against mock data, failed attempt
 * tracking, account lockout), logout (session cleanup, audit logging),
 * and session state queries.
 *
 * All auth events are recorded via {@link auditLogger}. Login attempt
 * counters are persisted in localStorage and reset after the configured
 * lockout duration.
 *
 * @module authService
 */

import { MOCK_USER_CREDENTIALS, MOCK_USER_PROFILE } from '../data/mockData.js';
import { logEvent, AUDIT_EVENT_TYPES } from './auditLogger.js';
import {
  getItem,
  setItem,
  removeItem,
  setWithExpiry,
  getWithExpiry,
} from '../utils/storageUtils.js';
import { generateSessionId, generateTokenId } from '../utils/idGenerator.js';
import {
  SESSION_TIMEOUT_MS,
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION_MS,
  STORAGE_KEYS,
} from '../constants/constants.js';
import {
  LOGIN_MESSAGES,
  TOKEN_MESSAGES,
} from '../constants/messages.js';

// ---- Internal Helpers ----

/**
 * Reads the current failed login attempt count from localStorage.
 *
 * @returns {number} The number of consecutive failed login attempts.
 */
function readFailedAttempts() {
  const count = getItem(STORAGE_KEYS.LOGIN_ATTEMPTS, 0);
  return typeof count === 'number' ? count : 0;
}

/**
 * Persists the failed login attempt count to localStorage.
 *
 * @param {number} count - The new attempt count.
 */
function writeFailedAttempts(count) {
  setItem(STORAGE_KEYS.LOGIN_ATTEMPTS, count);
}

/**
 * Reads the lockout-until timestamp from localStorage.
 *
 * @returns {number|null} Epoch milliseconds when lockout expires, or null.
 */
function readLockoutUntil() {
  const ts = getItem(STORAGE_KEYS.LOCKOUT_UNTIL, null);
  return typeof ts === 'number' ? ts : null;
}

/**
 * Persists the lockout-until timestamp to localStorage.
 *
 * @param {number} timestamp - Epoch milliseconds when lockout expires.
 */
function writeLockoutUntil(timestamp) {
  setItem(STORAGE_KEYS.LOCKOUT_UNTIL, timestamp);
}

/**
 * Clears lockout and failed attempt counters from localStorage.
 */
function clearLockoutState() {
  removeItem(STORAGE_KEYS.LOGIN_ATTEMPTS);
  removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);
}

/**
 * Determines whether the account is currently locked out.
 *
 * @returns {boolean} `true` if the account is locked.
 */
function isLockedOut() {
  const lockoutUntil = readLockoutUntil();
  if (lockoutUntil === null) {
    return false;
  }
  if (Date.now() >= lockoutUntil) {
    // Lockout period has elapsed — clear state
    clearLockoutState();
    return false;
  }
  return true;
}

/**
 * Builds a session object for the authenticated user.
 *
 * @param {Object} userProfile - The user profile from mock data.
 * @returns {Object} Session object with user info, tokens, and expiry.
 */
function buildSession(userProfile) {
  const now = Date.now();
  const expiresAt = now + SESSION_TIMEOUT_MS;
  const sessionToken = generateSessionId();
  const tokenId = generateTokenId();

  return {
    user: {
      id: userProfile.id,
      username: userProfile.username,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      email: userProfile.email,
      role: userProfile.role,
      phone: userProfile.phone,
      lastLogin: userProfile.lastLogin,
    },
    sessionToken,
    tokenId,
    createdAt: new Date(now).toISOString(),
    expiresAt,
  };
}

// ---- Public API ----

/**
 * Authenticates a user with the provided credentials.
 *
 * Validates against mock data, enforces lockout after
 * {@link MAX_LOGIN_ATTEMPTS} consecutive failures, and records all
 * attempts via the audit logger.
 *
 * @param {string} username - The username to authenticate.
 * @param {string} password - The password to authenticate.
 * @returns {{
 *   status: 'success'|'error',
 *   user?: Object,
 *   sessionToken?: string,
 *   expiresAt?: number,
 *   errorCode?: string,
 *   message?: string,
 *   remainingAttempts?: number
 * }} The authentication result.
 */
export function login(username, password) {
  // Check lockout first
  if (isLockedOut()) {
    logEvent({
      eventType: AUDIT_EVENT_TYPES.LOGIN,
      userId: null,
      description: 'Login attempt rejected — account is locked.',
      details: { username: username || '', reason: 'account_locked' },
    });

    return {
      status: 'error',
      errorCode: 'ACCOUNT_LOCKED',
      message: LOGIN_MESSAGES.ACCOUNT_LOCKED,
    };
  }

  // Validate inputs
  if (!username || !password) {
    return {
      status: 'error',
      errorCode: 'INVALID_CREDENTIALS',
      message: LOGIN_MESSAGES.INVALID_CREDENTIALS,
    };
  }

  const trimmedUsername = username.trim();
  const trimmedPassword = password;

  // Validate credentials against mock data
  const credentialsValid =
    trimmedUsername === MOCK_USER_CREDENTIALS.username &&
    trimmedPassword === MOCK_USER_CREDENTIALS.password;

  if (credentialsValid) {
    // Successful login — clear any failed attempt counters
    clearLockoutState();

    const session = buildSession(MOCK_USER_PROFILE);

    // Persist session with TTL
    setWithExpiry(STORAGE_KEYS.AUTH_TOKEN, session.sessionToken, SESSION_TIMEOUT_MS);
    setItem(STORAGE_KEYS.USER, session.user);
    setItem(STORAGE_KEYS.SESSION_EXPIRY, session.expiresAt);

    logEvent({
      eventType: AUDIT_EVENT_TYPES.LOGIN,
      userId: session.user.id,
      description: 'User logged in successfully.',
      details: { username: trimmedUsername },
    });

    return {
      status: 'success',
      user: session.user,
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
    };
  }

  // Failed login — increment counter
  const failedAttempts = readFailedAttempts() + 1;
  writeFailedAttempts(failedAttempts);

  const remaining = Math.max(0, MAX_LOGIN_ATTEMPTS - failedAttempts);

  // Check if we should lock the account
  if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
    const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
    writeLockoutUntil(lockoutUntil);

    logEvent({
      eventType: AUDIT_EVENT_TYPES.LOGIN,
      userId: null,
      description: `Account locked after ${failedAttempts} failed login attempts.`,
      details: {
        username: trimmedUsername,
        reason: 'max_attempts_exceeded',
        failedAttempts,
        lockoutUntil: new Date(lockoutUntil).toISOString(),
      },
    });

    return {
      status: 'error',
      errorCode: 'ACCOUNT_LOCKED',
      message: LOGIN_MESSAGES.ACCOUNT_LOCKED,
      remainingAttempts: 0,
    };
  }

  logEvent({
    eventType: AUDIT_EVENT_TYPES.LOGIN,
    userId: null,
    description: `Failed login attempt ${failedAttempts} of ${MAX_LOGIN_ATTEMPTS}.`,
    details: {
      username: trimmedUsername,
      reason: 'invalid_credentials',
      failedAttempts,
      remaining,
    },
  });

  // Determine the appropriate warning message
  let message;
  if (remaining === 1) {
    message = LOGIN_MESSAGES.LAST_ATTEMPT_WARNING;
  } else if (remaining < MAX_LOGIN_ATTEMPTS) {
    message = LOGIN_MESSAGES.ATTEMPT_WARNING(remaining);
  } else {
    message = LOGIN_MESSAGES.INVALID_CREDENTIALS;
  }

  return {
    status: 'error',
    errorCode: 'INVALID_CREDENTIALS',
    message,
    remainingAttempts: remaining,
  };
}

/**
 * Logs out the current user by clearing all session data from localStorage
 * and recording the event in the audit log.
 *
 * @returns {{ status: 'success', message: string }}
 */
export function logout() {
  const user = getItem(STORAGE_KEYS.USER, null);
  const userId = user?.id ?? null;

  // Clear session data
  removeItem(STORAGE_KEYS.AUTH_TOKEN);
  removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  removeItem(STORAGE_KEYS.USER);
  removeItem(STORAGE_KEYS.SESSION_EXPIRY);

  logEvent({
    eventType: AUDIT_EVENT_TYPES.LOGOUT,
    userId,
    description: 'User logged out.',
    details: {},
  });

  return {
    status: 'success',
    message: LOGIN_MESSAGES.LOGOUT_SUCCESS,
  };
}

/**
 * Retrieves the current session if one exists and is still valid.
 *
 * @returns {{
 *   user: Object,
 *   sessionToken: string,
 *   expiresAt: number
 * }|null} The current session, or `null` if no valid session exists.
 */
export function getSession() {
  const sessionToken = getWithExpiry(STORAGE_KEYS.AUTH_TOKEN, null);
  if (!sessionToken) {
    return null;
  }

  const user = getItem(STORAGE_KEYS.USER, null);
  if (!user) {
    return null;
  }

  const expiresAt = getItem(STORAGE_KEYS.SESSION_EXPIRY, null);
  if (typeof expiresAt !== 'number' || Date.now() >= expiresAt) {
    // Session has expired — clean up
    removeItem(STORAGE_KEYS.AUTH_TOKEN);
    removeItem(STORAGE_KEYS.USER);
    removeItem(STORAGE_KEYS.SESSION_EXPIRY);

    logEvent({
      eventType: AUDIT_EVENT_TYPES.SESSION_TIMEOUT,
      userId: user.id ?? null,
      description: 'Session expired.',
      details: {},
    });

    return null;
  }

  return {
    user,
    sessionToken,
    expiresAt,
  };
}

/**
 * Checks whether a valid, non-expired session exists.
 *
 * @returns {boolean} `true` if the user is currently authenticated.
 */
export function isAuthenticated() {
  return getSession() !== null;
}

/**
 * Refreshes the session expiry timer, extending it by the configured
 * {@link SESSION_TIMEOUT_MS} from the current time.
 *
 * @returns {boolean} `true` if the session was successfully refreshed,
 *   `false` if no valid session exists.
 */
export function refreshSession() {
  const session = getSession();
  if (!session) {
    return false;
  }

  const newExpiresAt = Date.now() + SESSION_TIMEOUT_MS;

  setWithExpiry(STORAGE_KEYS.AUTH_TOKEN, session.sessionToken, SESSION_TIMEOUT_MS);
  setItem(STORAGE_KEYS.SESSION_EXPIRY, newExpiresAt);

  return true;
}

/**
 * Returns the number of consecutive failed login attempts.
 *
 * @returns {number} The current failed attempt count.
 */
export function getFailedAttempts() {
  return readFailedAttempts();
}

/**
 * Returns the current lockout status.
 *
 * @returns {{
 *   isLocked: boolean,
 *   lockoutUntil: number|null,
 *   failedAttempts: number,
 *   maxAttempts: number
 * }}
 */
export function getLockoutStatus() {
  const locked = isLockedOut();
  const lockoutUntil = locked ? readLockoutUntil() : null;
  const failedAttempts = readFailedAttempts();

  return {
    isLocked: locked,
    lockoutUntil,
    failedAttempts,
    maxAttempts: MAX_LOGIN_ATTEMPTS,
  };
}

/**
 * Clears all authentication state including session, lockout, and
 * failed attempt counters. Intended for testing and administrative use.
 *
 * @returns {boolean} `true` if the clear succeeded.
 */
export function clearAuthState() {
  removeItem(STORAGE_KEYS.AUTH_TOKEN);
  removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  removeItem(STORAGE_KEYS.USER);
  removeItem(STORAGE_KEYS.SESSION_EXPIRY);
  removeItem(STORAGE_KEYS.LOGIN_ATTEMPTS);
  removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);
  return true;
}