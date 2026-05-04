/**
 * Identity verification service for post-login KBA/OTP step.
 *
 * Validates KBA answers or OTP codes against mock data, enforces
 * configurable max attempts with lockout, and logs all verification
 * events via {@link auditLogger}.
 *
 * Stubbed for MVP with mock verification data — designed for seamless
 * replacement with a real backend verification endpoint.
 *
 * @module verificationService
 */

import { logEvent, AUDIT_EVENT_TYPES } from './auditLogger.js';
import { getItem, setItem, removeItem } from '../utils/storageUtils.js';
import { isCalendarDayReset, getTodayDateString } from '../utils/dateUtils.js';
import { VERIFICATION_MESSAGES } from '../constants/messages.js';

// ---- Constants ----

/** localStorage key for verification attempt counter */
const VERIFICATION_ATTEMPTS_KEY = 'scm_verification_attempts';

/** localStorage key for verification attempt date stamp */
const VERIFICATION_ATTEMPTS_DATE_KEY = 'scm_verification_attempts_date';

/** localStorage key for verification status */
const VERIFICATION_STATUS_KEY = 'scm_verification_status';

/** Maximum verification attempts per session/day (default: 3) */
const MAX_VERIFICATION_ATTEMPTS = 3;

// ---- Mock Verification Data ----

/**
 * Mock OTP code accepted by the verification service.
 * @type {string}
 */
const MOCK_VALID_OTP = '123456';

/**
 * Mock KBA answers accepted by the verification service.
 * Keys are question identifiers; values are expected answers (case-insensitive).
 * @type {Object<string, string>}
 */
const MOCK_KBA_ANSWERS = {
  mothersMaidenName: 'Smith',
  cityOfBirth: 'Springfield',
  highSchoolMascot: 'Eagles',
};

/**
 * Supported verification methods.
 * @enum {string}
 */
export const VERIFICATION_METHODS = {
  OTP: 'otp',
  KBA: 'kba',
};

// ---- Internal Helpers ----

/**
 * Reads the current verification attempt count, resetting if the
 * stored date belongs to a previous calendar day.
 *
 * @returns {number} Current attempt count for today.
 */
function readAttempts() {
  const storedDate = getItem(VERIFICATION_ATTEMPTS_DATE_KEY, null);

  if (isCalendarDayReset(storedDate)) {
    setItem(VERIFICATION_ATTEMPTS_KEY, 0);
    setItem(VERIFICATION_ATTEMPTS_DATE_KEY, getTodayDateString());
    return 0;
  }

  const count = getItem(VERIFICATION_ATTEMPTS_KEY, 0);
  return typeof count === 'number' ? count : 0;
}

/**
 * Increments the verification attempt counter and persists it.
 *
 * @returns {number} The updated attempt count.
 */
function incrementAttempts() {
  let current = readAttempts();
  current += 1;
  setItem(VERIFICATION_ATTEMPTS_KEY, current);
  setItem(VERIFICATION_ATTEMPTS_DATE_KEY, getTodayDateString());
  return current;
}

/**
 * Validates an OTP code against the mock valid code.
 *
 * @param {string} otp - The OTP code to validate.
 * @returns {boolean} `true` if the OTP matches.
 */
function validateOTP(otp) {
  if (!otp || typeof otp !== 'string') {
    return false;
  }
  return otp.trim() === MOCK_VALID_OTP;
}

/**
 * Validates KBA answers against the mock answer set.
 * All provided answers must match (case-insensitive).
 *
 * @param {Object<string, string>} answers - Map of question ID to user answer.
 * @returns {boolean} `true` if all answers are correct.
 */
function validateKBA(answers) {
  if (!answers || typeof answers !== 'object') {
    return false;
  }

  const answerKeys = Object.keys(answers);
  if (answerKeys.length === 0) {
    return false;
  }

  for (const key of answerKeys) {
    const expected = MOCK_KBA_ANSWERS[key];
    if (!expected) {
      return false;
    }

    const userAnswer = answers[key];
    if (!userAnswer || typeof userAnswer !== 'string') {
      return false;
    }

    if (userAnswer.trim().toLowerCase() !== expected.toLowerCase()) {
      return false;
    }
  }

  return true;
}

// ---- Public API ----

/**
 * Verifies a user's identity using the specified method (OTP or KBA).
 *
 * Enforces a maximum of {@link MAX_VERIFICATION_ATTEMPTS} attempts per day.
 * All attempts (success and failure) are recorded via the audit logger.
 *
 * @param {Object} params
 * @param {string} params.userId - The ID of the user being verified.
 * @param {string} params.method - One of {@link VERIFICATION_METHODS}.
 * @param {string} [params.otp] - The OTP code (required when method is 'otp').
 * @param {Object<string, string>} [params.kbaAnswers] - KBA answers map
 *   (required when method is 'kba').
 * @returns {{
 *   status: 'success'|'error',
 *   verified?: boolean,
 *   errorCode?: string,
 *   message?: string,
 *   attemptsUsed?: number,
 *   attemptsRemaining?: number
 * }} The verification result.
 */
export function verifyIdentity({ userId, method, otp, kbaAnswers } = {}) {
  const currentAttempts = readAttempts();

  // Check if attempts are exhausted
  if (currentAttempts >= MAX_VERIFICATION_ATTEMPTS) {
    logEvent({
      eventType: AUDIT_EVENT_TYPES.VERIFICATION,
      userId: userId ?? null,
      description: 'Verification attempt rejected — attempts exhausted.',
      details: {
        method: method || 'unknown',
        reason: 'attempts_exhausted',
        attemptsUsed: currentAttempts,
        maxAttempts: MAX_VERIFICATION_ATTEMPTS,
      },
    });

    return {
      status: 'error',
      errorCode: 'RATE_LIMIT_EXCEEDED',
      message: VERIFICATION_MESSAGES.VERIFICATION_FAILED,
      attemptsUsed: currentAttempts,
      attemptsRemaining: 0,
    };
  }

  // Validate inputs
  if (!userId) {
    return {
      status: 'error',
      errorCode: 'INVALID_REQUEST',
      message: VERIFICATION_MESSAGES.VERIFICATION_REQUIRED,
    };
  }

  if (!method || !Object.values(VERIFICATION_METHODS).includes(method)) {
    return {
      status: 'error',
      errorCode: 'INVALID_METHOD',
      message: VERIFICATION_MESSAGES.VERIFICATION_FAILED,
    };
  }

  // Perform verification based on method
  let isValid = false;

  if (method === VERIFICATION_METHODS.OTP) {
    isValid = validateOTP(otp);
  } else if (method === VERIFICATION_METHODS.KBA) {
    isValid = validateKBA(kbaAnswers);
  }

  // Increment attempt counter
  const attemptsUsed = incrementAttempts();
  const attemptsRemaining = Math.max(0, MAX_VERIFICATION_ATTEMPTS - attemptsUsed);

  if (isValid) {
    // Store verification status
    setItem(VERIFICATION_STATUS_KEY, {
      userId,
      verified: true,
      method,
      verifiedAt: new Date().toISOString(),
    });

    logEvent({
      eventType: AUDIT_EVENT_TYPES.VERIFICATION,
      userId,
      description: `Identity verification successful via ${method}.`,
      details: {
        method,
        result: 'success',
        attemptsUsed,
      },
    });

    return {
      status: 'success',
      verified: true,
      message: VERIFICATION_MESSAGES.VERIFICATION_SUCCESS,
      attemptsUsed,
      attemptsRemaining,
    };
  }

  // Verification failed
  const failureReason = method === VERIFICATION_METHODS.OTP
    ? 'invalid_otp'
    : 'invalid_kba_answers';

  logEvent({
    eventType: AUDIT_EVENT_TYPES.VERIFICATION,
    userId,
    description: `Identity verification failed via ${method}. Attempt ${attemptsUsed} of ${MAX_VERIFICATION_ATTEMPTS}.`,
    details: {
      method,
      result: 'failure',
      reason: failureReason,
      attemptsUsed,
      attemptsRemaining,
    },
  });

  // Determine the appropriate error message
  let message;
  if (method === VERIFICATION_METHODS.OTP) {
    message = VERIFICATION_MESSAGES.VERIFICATION_CODE_INVALID;
  } else {
    message = VERIFICATION_MESSAGES.VERIFICATION_FAILED;
  }

  return {
    status: 'error',
    verified: false,
    errorCode: failureReason === 'invalid_otp' ? 'INVALID_OTP' : 'INVALID_KBA',
    message,
    attemptsUsed,
    attemptsRemaining,
  };
}

/**
 * Returns the current verification status for the session.
 *
 * @returns {{
 *   isVerified: boolean,
 *   userId: string|null,
 *   method: string|null,
 *   verifiedAt: string|null
 * }} The current verification state.
 */
export function getVerificationStatus() {
  const status = getItem(VERIFICATION_STATUS_KEY, null);

  if (!status || typeof status !== 'object' || !status.verified) {
    return {
      isVerified: false,
      userId: null,
      method: null,
      verifiedAt: null,
    };
  }

  return {
    isVerified: true,
    userId: status.userId ?? null,
    method: status.method ?? null,
    verifiedAt: status.verifiedAt ?? null,
  };
}

/**
 * Returns the current verification attempt counters.
 *
 * @returns {{
 *   attemptsUsed: number,
 *   maxAttempts: number,
 *   attemptsRemaining: number,
 *   isExhausted: boolean
 * }}
 */
export function getVerificationAttempts() {
  const attemptsUsed = readAttempts();
  const attemptsRemaining = Math.max(0, MAX_VERIFICATION_ATTEMPTS - attemptsUsed);
  const isExhausted = attemptsRemaining <= 0;

  return {
    attemptsUsed,
    maxAttempts: MAX_VERIFICATION_ATTEMPTS,
    attemptsRemaining,
    isExhausted,
  };
}

/**
 * Simulates sending a verification code (OTP) to the user's registered
 * contact method. In the MVP this is a no-op that always succeeds.
 *
 * @param {Object} params
 * @param {string} params.userId - The ID of the user.
 * @param {string} [params.contactMethod='email'] - The delivery channel
 *   ('email' or 'sms').
 * @returns {{
 *   status: 'success'|'error',
 *   message: string
 * }}
 */
export function sendVerificationCode({ userId, contactMethod = 'email' } = {}) {
  if (!userId) {
    return {
      status: 'error',
      message: VERIFICATION_MESSAGES.VERIFICATION_REQUIRED,
    };
  }

  logEvent({
    eventType: AUDIT_EVENT_TYPES.VERIFICATION,
    userId,
    description: `Verification code sent via ${contactMethod}.`,
    details: {
      contactMethod,
      action: 'send_code',
    },
  });

  return {
    status: 'success',
    message: VERIFICATION_MESSAGES.VERIFICATION_CODE_SENT,
  };
}

/**
 * Resets the verification status and attempt counters.
 * Intended for logout, session expiry, testing, and administrative use.
 *
 * @returns {boolean} `true` if the reset succeeded.
 */
export function resetVerification() {
  const a = removeItem(VERIFICATION_STATUS_KEY);
  const b = setItem(VERIFICATION_ATTEMPTS_KEY, 0);
  const c = setItem(VERIFICATION_ATTEMPTS_DATE_KEY, getTodayDateString());
  return a && b && c;
}

/**
 * Clears only the verification status (not the attempt counters).
 * Useful when the user needs to re-verify without resetting rate limits.
 *
 * @returns {boolean} `true` if the clear succeeded.
 */
export function clearVerificationStatus() {
  return removeItem(VERIFICATION_STATUS_KEY);
}