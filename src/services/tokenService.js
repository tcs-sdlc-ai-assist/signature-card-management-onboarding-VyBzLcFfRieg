/**
 * eSign confirmation token validation service.
 *
 * Validates eSign tokens for authenticity, expiration, and association
 * with the authenticated user. Supports token status lifecycle
 * (pending → confirmed) and enforces rate limiting on validation attempts.
 *
 * All token validation events are recorded via {@link auditLogger}.
 * Uses {@link dateUtils} for expiry checks.
 *
 * @module tokenService
 */

import { logEvent, AUDIT_EVENT_TYPES } from './auditLogger.js';
import { getItem, setItem, removeItem } from '../utils/storageUtils.js';
import { isTokenExpired } from '../utils/dateUtils.js';
import { isCalendarDayReset, getTodayDateString } from '../utils/dateUtils.js';
import {
  MOCK_ESIGN_TOKEN_VALID,
  MOCK_ESIGN_TOKEN_EXPIRED,
} from '../data/mockData.js';
import { TOKEN_MESSAGES } from '../constants/messages.js';

// ---- Constants ----

/** localStorage key for token validation attempt counter */
const TOKEN_ATTEMPTS_KEY = 'scm_token_attempts';

/** localStorage key for token validation attempt date stamp */
const TOKEN_ATTEMPTS_DATE_KEY = 'scm_token_attempts_date';

/** localStorage key for token status store */
const TOKEN_STATUS_KEY = 'scm_token_status';

/** Maximum token validation attempts per day (default: 3) */
const MAX_TOKEN_ATTEMPTS = 3;

/**
 * Supported token statuses.
 * @enum {string}
 */
export const TOKEN_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  EXPIRED: 'expired',
  INVALID: 'invalid',
};

// ---- Internal Helpers ----

/**
 * Reads the current token validation attempt count, resetting if the
 * stored date belongs to a previous calendar day.
 *
 * @returns {number} Current attempt count for today.
 */
function readAttempts() {
  const storedDate = getItem(TOKEN_ATTEMPTS_DATE_KEY, null);

  if (isCalendarDayReset(storedDate)) {
    setItem(TOKEN_ATTEMPTS_KEY, 0);
    setItem(TOKEN_ATTEMPTS_DATE_KEY, getTodayDateString());
    return 0;
  }

  const count = getItem(TOKEN_ATTEMPTS_KEY, 0);
  return typeof count === 'number' ? count : 0;
}

/**
 * Increments the token validation attempt counter and persists it.
 *
 * @returns {number} The updated attempt count.
 */
function incrementAttempts() {
  let current = readAttempts();
  current += 1;
  setItem(TOKEN_ATTEMPTS_KEY, current);
  setItem(TOKEN_ATTEMPTS_DATE_KEY, getTodayDateString());
  return current;
}

/**
 * Reads the stored token status map from localStorage.
 *
 * @returns {Object} Map of token strings to status objects.
 */
function readTokenStatusMap() {
  const map = getItem(TOKEN_STATUS_KEY, {});
  if (!map || typeof map !== 'object' || Array.isArray(map)) {
    return {};
  }
  return map;
}

/**
 * Persists the token status map to localStorage.
 *
 * @param {Object} map - The token status map to persist.
 * @returns {boolean} `true` if the write succeeded.
 */
function writeTokenStatusMap(map) {
  return setItem(TOKEN_STATUS_KEY, map);
}

/**
 * Finds a mock token record matching the provided token string.
 *
 * @param {string} token - The token string to look up.
 * @returns {Object|null} The matching mock token record, or null.
 */
function findMockToken(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const trimmed = token.trim();

  if (trimmed === MOCK_ESIGN_TOKEN_VALID.token) {
    return { ...MOCK_ESIGN_TOKEN_VALID };
  }

  if (trimmed === MOCK_ESIGN_TOKEN_EXPIRED.token) {
    return { ...MOCK_ESIGN_TOKEN_EXPIRED };
  }

  return null;
}

// ---- Public API ----

/**
 * Validates an eSign token for authenticity, expiration, and association
 * with the specified user.
 *
 * Enforces a maximum of {@link MAX_TOKEN_ATTEMPTS} validation attempts
 * per day. All attempts (success and failure) are recorded via the
 * audit logger.
 *
 * @param {Object} params
 * @param {string} params.userId - The ID of the authenticated user.
 * @param {string} params.token - The eSign token string to validate.
 * @returns {{
 *   status: 'success'|'error',
 *   tokenStatus?: string,
 *   errorCode?: string,
 *   message?: string,
 *   attemptsUsed?: number,
 *   attemptsRemaining?: number
 * }} The validation result.
 */
export function validateESignToken({ userId, token } = {}) {
  const currentAttempts = readAttempts();

  // Check if attempts are exhausted
  if (currentAttempts >= MAX_TOKEN_ATTEMPTS) {
    logEvent({
      eventType: AUDIT_EVENT_TYPES.TOKEN_VALIDATION,
      userId: userId ?? null,
      description: 'Token validation attempt rejected — attempts exhausted.',
      details: {
        reason: 'attempts_exhausted',
        attemptsUsed: currentAttempts,
        maxAttempts: MAX_TOKEN_ATTEMPTS,
      },
    });

    return {
      status: 'error',
      errorCode: 'RATE_LIMIT_EXCEEDED',
      message: TOKEN_MESSAGES.TOKEN_REFRESH_FAILED,
      attemptsUsed: currentAttempts,
      attemptsRemaining: 0,
    };
  }

  // Validate inputs
  if (!userId) {
    return {
      status: 'error',
      errorCode: 'INVALID_REQUEST',
      message: TOKEN_MESSAGES.TOKEN_INVALID,
    };
  }

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    const attemptsUsed = incrementAttempts();
    const attemptsRemaining = Math.max(0, MAX_TOKEN_ATTEMPTS - attemptsUsed);

    logEvent({
      eventType: AUDIT_EVENT_TYPES.TOKEN_VALIDATION,
      userId,
      description: 'Token validation failed — empty or missing token.',
      details: {
        reason: 'missing_token',
        attemptsUsed,
        attemptsRemaining,
      },
    });

    return {
      status: 'error',
      errorCode: 'TOKEN_INVALID',
      message: TOKEN_MESSAGES.TOKEN_INVALID,
      attemptsUsed,
      attemptsRemaining,
    };
  }

  // Look up the token in mock data
  const mockToken = findMockToken(token);

  // Increment attempt counter
  const attemptsUsed = incrementAttempts();
  const attemptsRemaining = Math.max(0, MAX_TOKEN_ATTEMPTS - attemptsUsed);

  // Token not found — invalid
  if (!mockToken) {
    logEvent({
      eventType: AUDIT_EVENT_TYPES.TOKEN_VALIDATION,
      userId,
      description: `Token validation failed — token not recognized. Attempt ${attemptsUsed} of ${MAX_TOKEN_ATTEMPTS}.`,
      details: {
        reason: 'token_not_found',
        attemptsUsed,
        attemptsRemaining,
      },
    });

    return {
      status: 'error',
      tokenStatus: TOKEN_STATUSES.INVALID,
      errorCode: 'TOKEN_INVALID',
      message: TOKEN_MESSAGES.TOKEN_INVALID,
      attemptsUsed,
      attemptsRemaining,
    };
  }

  // Check token-user association
  if (mockToken.userId !== userId) {
    logEvent({
      eventType: AUDIT_EVENT_TYPES.TOKEN_VALIDATION,
      userId,
      description: `Token validation failed — token does not belong to user. Attempt ${attemptsUsed} of ${MAX_TOKEN_ATTEMPTS}.`,
      details: {
        reason: 'user_mismatch',
        attemptsUsed,
        attemptsRemaining,
      },
    });

    return {
      status: 'error',
      tokenStatus: TOKEN_STATUSES.INVALID,
      errorCode: 'TOKEN_INVALID',
      message: TOKEN_MESSAGES.TOKEN_INVALID,
      attemptsUsed,
      attemptsRemaining,
    };
  }

  // Check token expiration
  const expired = isTokenExpired({
    issuedAt: mockToken.issuedAt,
    expiresAt: mockToken.expiresAt,
  });

  if (expired || !mockToken.isValid) {
    // Update stored status to expired
    const statusMap = readTokenStatusMap();
    statusMap[token.trim()] = {
      userId,
      tokenStatus: TOKEN_STATUSES.EXPIRED,
      validatedAt: new Date().toISOString(),
    };
    writeTokenStatusMap(statusMap);

    logEvent({
      eventType: AUDIT_EVENT_TYPES.TOKEN_VALIDATION,
      userId,
      description: `Token validation failed — token expired. Attempt ${attemptsUsed} of ${MAX_TOKEN_ATTEMPTS}.`,
      details: {
        reason: 'token_expired',
        issuedAt: mockToken.issuedAt,
        expiresAt: mockToken.expiresAt,
        attemptsUsed,
        attemptsRemaining,
      },
    });

    return {
      status: 'error',
      tokenStatus: TOKEN_STATUSES.EXPIRED,
      errorCode: 'TOKEN_EXPIRED',
      message: TOKEN_MESSAGES.TOKEN_EXPIRED,
      attemptsUsed,
      attemptsRemaining,
    };
  }

  // Token is valid — update status to confirmed
  const statusMap = readTokenStatusMap();
  statusMap[token.trim()] = {
    userId,
    tokenStatus: TOKEN_STATUSES.CONFIRMED,
    validatedAt: new Date().toISOString(),
  };
  writeTokenStatusMap(statusMap);

  logEvent({
    eventType: AUDIT_EVENT_TYPES.TOKEN_VALIDATION,
    userId,
    description: 'eSign token validated successfully.',
    details: {
      result: 'success',
      tokenStatus: TOKEN_STATUSES.CONFIRMED,
      attemptsUsed,
      attemptsRemaining,
    },
  });

  return {
    status: 'success',
    tokenStatus: TOKEN_STATUSES.CONFIRMED,
    message: 'eSign token validated successfully.',
    attemptsUsed,
    attemptsRemaining,
  };
}

/**
 * Returns the current status of a specific eSign token.
 *
 * @param {string} token - The eSign token string to look up.
 * @returns {{
 *   tokenStatus: string,
 *   userId: string|null,
 *   validatedAt: string|null
 * }} The current token status.
 */
export function getTokenStatus(token) {
  if (!token || typeof token !== 'string') {
    return {
      tokenStatus: TOKEN_STATUSES.INVALID,
      userId: null,
      validatedAt: null,
    };
  }

  const trimmed = token.trim();
  const statusMap = readTokenStatusMap();
  const stored = statusMap[trimmed];

  if (!stored || typeof stored !== 'object') {
    // Check if it exists in mock data but hasn't been validated yet
    const mockToken = findMockToken(trimmed);
    if (mockToken) {
      const expired = isTokenExpired({
        issuedAt: mockToken.issuedAt,
        expiresAt: mockToken.expiresAt,
      });

      if (expired || !mockToken.isValid) {
        return {
          tokenStatus: TOKEN_STATUSES.EXPIRED,
          userId: mockToken.userId ?? null,
          validatedAt: null,
        };
      }

      return {
        tokenStatus: TOKEN_STATUSES.PENDING,
        userId: mockToken.userId ?? null,
        validatedAt: null,
      };
    }

    return {
      tokenStatus: TOKEN_STATUSES.INVALID,
      userId: null,
      validatedAt: null,
    };
  }

  return {
    tokenStatus: stored.tokenStatus ?? TOKEN_STATUSES.INVALID,
    userId: stored.userId ?? null,
    validatedAt: stored.validatedAt ?? null,
  };
}

/**
 * Updates the status of a specific eSign token.
 *
 * Supports transitioning from pending to confirmed. Logs the status
 * change via the audit logger.
 *
 * @param {Object} params
 * @param {string} params.token - The eSign token string.
 * @param {string} params.userId - The ID of the user performing the update.
 * @param {string} params.newStatus - The new status to set (one of {@link TOKEN_STATUSES}).
 * @returns {{
 *   status: 'success'|'error',
 *   tokenStatus?: string,
 *   errorCode?: string,
 *   message?: string
 * }} The update result.
 */
export function updateTokenStatus({ token, userId, newStatus } = {}) {
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return {
      status: 'error',
      errorCode: 'INVALID_REQUEST',
      message: TOKEN_MESSAGES.TOKEN_INVALID,
    };
  }

  if (!userId) {
    return {
      status: 'error',
      errorCode: 'INVALID_REQUEST',
      message: TOKEN_MESSAGES.TOKEN_INVALID,
    };
  }

  if (!newStatus || !Object.values(TOKEN_STATUSES).includes(newStatus)) {
    return {
      status: 'error',
      errorCode: 'INVALID_STATUS',
      message: 'Invalid token status provided.',
    };
  }

  const trimmed = token.trim();
  const currentStatus = getTokenStatus(trimmed);

  // Validate transition: only pending → confirmed is allowed
  if (
    newStatus === TOKEN_STATUSES.CONFIRMED &&
    currentStatus.tokenStatus !== TOKEN_STATUSES.PENDING &&
    currentStatus.tokenStatus !== TOKEN_STATUSES.CONFIRMED
  ) {
    logEvent({
      eventType: AUDIT_EVENT_TYPES.TOKEN_VALIDATION,
      userId,
      description: `Token status update rejected — invalid transition from "${currentStatus.tokenStatus}" to "${newStatus}".`,
      details: {
        currentStatus: currentStatus.tokenStatus,
        requestedStatus: newStatus,
        reason: 'invalid_transition',
      },
    });

    return {
      status: 'error',
      tokenStatus: currentStatus.tokenStatus,
      errorCode: 'INVALID_TRANSITION',
      message: `Cannot transition token from "${currentStatus.tokenStatus}" to "${newStatus}".`,
    };
  }

  const statusMap = readTokenStatusMap();
  const previousStatus = statusMap[trimmed] ? { ...statusMap[trimmed] } : null;

  statusMap[trimmed] = {
    userId,
    tokenStatus: newStatus,
    validatedAt: new Date().toISOString(),
  };
  writeTokenStatusMap(statusMap);

  logEvent({
    eventType: AUDIT_EVENT_TYPES.TOKEN_VALIDATION,
    userId,
    description: `Token status updated from "${currentStatus.tokenStatus}" to "${newStatus}".`,
    details: {
      previousStatus: currentStatus.tokenStatus,
      newStatus,
    },
    before: previousStatus,
    after: statusMap[trimmed],
  });

  return {
    status: 'success',
    tokenStatus: newStatus,
    message: `Token status updated to "${newStatus}".`,
  };
}

/**
 * Returns the current token validation attempt counters.
 *
 * @returns {{
 *   attemptsUsed: number,
 *   maxAttempts: number,
 *   attemptsRemaining: number,
 *   isExhausted: boolean
 * }}
 */
export function getTokenValidationAttempts() {
  const attemptsUsed = readAttempts();
  const attemptsRemaining = Math.max(0, MAX_TOKEN_ATTEMPTS - attemptsUsed);
  const isExhausted = attemptsRemaining <= 0;

  return {
    attemptsUsed,
    maxAttempts: MAX_TOKEN_ATTEMPTS,
    attemptsRemaining,
    isExhausted,
  };
}

/**
 * Resets the token validation attempt counters and clears all stored
 * token statuses. Intended for logout, session expiry, testing, and
 * administrative use.
 *
 * @returns {boolean} `true` if the reset succeeded.
 */
export function resetTokenState() {
  const a = setItem(TOKEN_ATTEMPTS_KEY, 0);
  const b = setItem(TOKEN_ATTEMPTS_DATE_KEY, getTodayDateString());
  const c = removeItem(TOKEN_STATUS_KEY);
  return a && b && c;
}