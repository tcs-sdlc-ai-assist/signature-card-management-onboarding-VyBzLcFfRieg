/**
 * Centralized immutable audit logging service.
 *
 * Records all security-relevant and business events to an append-only log
 * stored in localStorage (MVP). Every entry is sanitized of PII before
 * persistence via {@link sanitizeForLog}.
 *
 * Supported event types:
 *   LOGIN, LOGOUT, VERIFICATION, TOKEN_VALIDATION,
 *   SIGNER_ADD, SIGNER_EDIT, SIGNER_REMOVE, SIGNER_UNLOCK,
 *   SIGNER_RESEND, SUBMISSION, SESSION_TIMEOUT, ERROR
 *
 * @module auditLogger
 */

import { v4 as uuidv4 } from 'uuid';
import { sanitizeForLog } from '../utils/maskingUtils.js';
import { getItem, setItem } from '../utils/storageUtils.js';

// ---- Constants ----

/** localStorage key for the audit log */
const AUDIT_LOG_KEY = 'scm_audit_log';

/** Maximum number of log entries retained (prevents unbounded growth) */
const MAX_LOG_ENTRIES = 1000;

/**
 * Supported audit event types.
 * @enum {string}
 */
export const AUDIT_EVENT_TYPES = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  VERIFICATION: 'VERIFICATION',
  TOKEN_VALIDATION: 'TOKEN_VALIDATION',
  SIGNER_ADD: 'SIGNER_ADD',
  SIGNER_EDIT: 'SIGNER_EDIT',
  SIGNER_REMOVE: 'SIGNER_REMOVE',
  SIGNER_UNLOCK: 'SIGNER_UNLOCK',
  SIGNER_RESEND: 'SIGNER_RESEND',
  SUBMISSION: 'SUBMISSION',
  SESSION_TIMEOUT: 'SESSION_TIMEOUT',
  ERROR: 'ERROR',
};

// ---- Internal Helpers ----

/**
 * Reads the current audit log array from localStorage.
 *
 * @returns {Array<Object>} The current log entries (empty array if none).
 */
function readLog() {
  const log = getItem(AUDIT_LOG_KEY, []);
  if (!Array.isArray(log)) {
    return [];
  }
  return log;
}

/**
 * Persists the audit log array to localStorage.
 * Trims the oldest entries when the log exceeds {@link MAX_LOG_ENTRIES}.
 *
 * @param {Array<Object>} log - The full log array to persist.
 * @returns {boolean} `true` if the write succeeded.
 */
function writeLog(log) {
  const trimmed = log.length > MAX_LOG_ENTRIES
    ? log.slice(log.length - MAX_LOG_ENTRIES)
    : log;
  return setItem(AUDIT_LOG_KEY, trimmed);
}

// ---- Public API ----

/**
 * Appends an immutable audit event to the log.
 *
 * All `details`, `before`, and `after` values are sanitized of PII before
 * storage. The entry receives a unique `eventId` and an ISO-8601 `timestamp`.
 *
 * @param {Object} params
 * @param {string} params.eventType - One of {@link AUDIT_EVENT_TYPES}.
 * @param {string} [params.userId]  - The ID of the acting user (may be absent
 *   for pre-authentication events such as failed logins).
 * @param {string} [params.description] - Human-readable description of the event.
 * @param {Object} [params.details] - Arbitrary event metadata (will be sanitized).
 * @param {Object} [params.before]  - State before the change (will be sanitized).
 * @param {Object} [params.after]   - State after the change (will be sanitized).
 * @returns {{ eventId: string, timestamp: string }} The generated event ID and
 *   timestamp for the caller's reference.
 */
export function logEvent({
  eventType,
  userId = null,
  description = '',
  details = {},
  before = null,
  after = null,
} = {}) {
  const eventId = uuidv4();
  const timestamp = new Date().toISOString();

  const entry = {
    eventId,
    userId: userId ?? null,
    eventType: eventType || 'UNKNOWN',
    timestamp,
    description,
    details: sanitizeForLog(details),
    before: before !== null ? sanitizeForLog(before) : null,
    after: after !== null ? sanitizeForLog(after) : null,
  };

  try {
    const log = readLog();
    log.push(entry);
    writeLog(log);
  } catch {
    // Audit logging must never throw and break the calling flow.
    // In production this would forward to a remote logging endpoint.
  }

  return { eventId, timestamp };
}

/**
 * Retrieves all audit log entries, optionally filtered by user ID.
 *
 * @param {string} [userId] - When provided, only entries for this user are returned.
 * @returns {Array<Object>} Matching log entries (newest last).
 */
export function getLogs(userId) {
  try {
    const log = readLog();
    if (userId) {
      return log.filter((entry) => entry.userId === userId);
    }
    return log;
  } catch {
    return [];
  }
}

/**
 * Retrieves audit log entries filtered by event type.
 *
 * @param {string} eventType - One of {@link AUDIT_EVENT_TYPES}.
 * @returns {Array<Object>} Matching log entries (newest last).
 */
export function getLogsByEventType(eventType) {
  try {
    const log = readLog();
    return log.filter((entry) => entry.eventType === eventType);
  } catch {
    return [];
  }
}

/**
 * Returns the total number of entries currently in the audit log.
 *
 * @returns {number}
 */
export function getLogCount() {
  try {
    return readLog().length;
  } catch {
    return 0;
  }
}

/**
 * Clears the entire audit log.
 *
 * **Use with caution** — intended only for development/testing or
 * administrative purge operations. In production the log should be
 * immutable and archived rather than deleted.
 *
 * @returns {boolean} `true` if the clear succeeded.
 */
export function clearLogs() {
  return setItem(AUDIT_LOG_KEY, []);
}