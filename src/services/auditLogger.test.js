import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  logEvent,
  getLogs,
  getLogsByEventType,
  getLogCount,
  clearLogs,
  AUDIT_EVENT_TYPES,
} from './auditLogger.js';

/**
 * Helpers to directly read/write localStorage for assertions.
 */
const AUDIT_LOG_KEY = 'scm_audit_log';

function readLogFromStorage() {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    if (raw === null) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

describe('auditLogger', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ---- logEvent ----

  describe('logEvent', () => {
    it('writes an event to localStorage with correct structure', () => {
      const result = logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGIN,
        userId: 'usr-001',
        description: 'User logged in successfully.',
        details: { username: 'cpuser01' },
      });

      expect(result).toBeDefined();
      expect(result.eventId).toBeDefined();
      expect(typeof result.eventId).toBe('string');
      expect(result.eventId.length).toBeGreaterThan(0);
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('string');

      const logs = readLogFromStorage();
      expect(logs).toHaveLength(1);

      const entry = logs[0];
      expect(entry.eventId).toBe(result.eventId);
      expect(entry.userId).toBe('usr-001');
      expect(entry.eventType).toBe('LOGIN');
      expect(entry.description).toBe('User logged in successfully.');
      expect(entry.timestamp).toBe(result.timestamp);
      expect(entry.details).toBeDefined();
      expect(entry.details.username).toBe('cpuser01');
      expect(entry.before).toBeNull();
      expect(entry.after).toBeNull();
    });

    it('generates a valid ISO-8601 timestamp', () => {
      const result = logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGOUT,
        userId: 'usr-001',
        description: 'User logged out.',
      });

      const parsed = new Date(result.timestamp);
      expect(Number.isNaN(parsed.getTime())).toBe(false);

      const logs = readLogFromStorage();
      const entryParsed = new Date(logs[0].timestamp);
      expect(Number.isNaN(entryParsed.getTime())).toBe(false);
    });

    it('generates unique event IDs for each call', () => {
      const result1 = logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGIN,
        userId: 'usr-001',
        description: 'First event.',
      });

      const result2 = logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGOUT,
        userId: 'usr-001',
        description: 'Second event.',
      });

      expect(result1.eventId).not.toBe(result2.eventId);
    });

    it('records before and after state when provided', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SIGNER_EDIT,
        userId: 'usr-001',
        description: 'Edited signer.',
        details: { signerId: 'sig-2001' },
        before: { firstName: 'Emily', lastName: 'Chen' },
        after: { firstName: 'Emily', lastName: 'Smith' },
      });

      const logs = readLogFromStorage();
      expect(logs).toHaveLength(1);
      expect(logs[0].before).toBeDefined();
      expect(logs[0].before.firstName).toBe('Emily');
      expect(logs[0].before.lastName).toBe('Chen');
      expect(logs[0].after).toBeDefined();
      expect(logs[0].after.firstName).toBe('Emily');
      expect(logs[0].after.lastName).toBe('Smith');
    });

    it('handles null userId for pre-authentication events', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGIN,
        userId: null,
        description: 'Failed login attempt.',
        details: { reason: 'invalid_credentials' },
      });

      const logs = readLogFromStorage();
      expect(logs).toHaveLength(1);
      expect(logs[0].userId).toBeNull();
    });

    it('handles missing userId (defaults to null)', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.ERROR,
        description: 'An error occurred.',
      });

      const logs = readLogFromStorage();
      expect(logs).toHaveLength(1);
      expect(logs[0].userId).toBeNull();
    });

    it('defaults eventType to UNKNOWN when not provided', () => {
      logEvent({
        description: 'No event type.',
      });

      const logs = readLogFromStorage();
      expect(logs).toHaveLength(1);
      expect(logs[0].eventType).toBe('UNKNOWN');
    });

    it('handles empty params gracefully', () => {
      const result = logEvent();

      expect(result).toBeDefined();
      expect(result.eventId).toBeDefined();

      const logs = readLogFromStorage();
      expect(logs).toHaveLength(1);
      expect(logs[0].eventType).toBe('UNKNOWN');
      expect(logs[0].userId).toBeNull();
      expect(logs[0].description).toBe('');
    });
  });

  // ---- PII Sanitization ----

  describe('PII sanitization', () => {
    it('sanitizes email addresses in details', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SIGNER_ADD,
        userId: 'usr-001',
        description: 'Added signer.',
        details: {
          email: 'emily.chen@mitchellassoc.example.com',
          action: 'add_signer',
        },
      });

      const logs = readLogFromStorage();
      const entry = logs[0];

      // Email should be masked — not the original value
      expect(entry.details.email).not.toBe('emily.chen@mitchellassoc.example.com');
      // Should still contain the domain
      expect(entry.details.email).toContain('@mitchellassoc.example.com');
      // Non-PII fields should be unchanged
      expect(entry.details.action).toBe('add_signer');
    });

    it('sanitizes phone numbers in details', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SIGNER_ADD,
        userId: 'usr-001',
        description: 'Added signer.',
        details: {
          phone: '(555) 234-5678',
        },
      });

      const logs = readLogFromStorage();
      const entry = logs[0];

      expect(entry.details.phone).not.toBe('(555) 234-5678');
      expect(entry.details.phone).toContain('5678');
    });

    it('sanitizes account numbers in details', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SUBMISSION,
        userId: 'usr-001',
        description: 'Submission.',
        details: {
          accountNumber: '9200004567821',
        },
      });

      const logs = readLogFromStorage();
      const entry = logs[0];

      expect(entry.details.accountNumber).not.toBe('9200004567821');
      expect(entry.details.accountNumber).toContain('7821');
    });

    it('redacts password fields in details', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGIN,
        userId: null,
        description: 'Login attempt.',
        details: {
          password: 'SecurePass123!',
          username: 'cpuser01',
        },
      });

      const logs = readLogFromStorage();
      const entry = logs[0];

      expect(entry.details.password).toBe('[REDACTED]');
      expect(entry.details.username).toBe('cpuser01');
    });

    it('redacts token fields in details', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.TOKEN_VALIDATION,
        userId: 'usr-001',
        description: 'Token validation.',
        details: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-valid-token',
          result: 'success',
        },
      });

      const logs = readLogFromStorage();
      const entry = logs[0];

      expect(entry.details.token).toBe('[REDACTED]');
      expect(entry.details.result).toBe('success');
    });

    it('sanitizes PII in before/after state objects', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SIGNER_EDIT,
        userId: 'usr-001',
        description: 'Edited signer.',
        before: {
          email: 'old@example.com',
          phone: '(555) 111-2222',
          firstName: 'Emily',
        },
        after: {
          email: 'new@example.com',
          phone: '(555) 333-4444',
          firstName: 'Emily',
        },
      });

      const logs = readLogFromStorage();
      const entry = logs[0];

      // Before state
      expect(entry.before.email).not.toBe('old@example.com');
      expect(entry.before.phone).not.toBe('(555) 111-2222');
      expect(entry.before.firstName).toBe('Emily');

      // After state
      expect(entry.after.email).not.toBe('new@example.com');
      expect(entry.after.phone).not.toBe('(555) 333-4444');
      expect(entry.after.firstName).toBe('Emily');
    });

    it('sanitizes nested objects in details', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SIGNER_ADD,
        userId: 'usr-001',
        description: 'Added signer with nested data.',
        details: {
          signer: {
            email: 'nested@example.com',
            phone: '(555) 999-8888',
            name: 'Test User',
          },
        },
      });

      const logs = readLogFromStorage();
      const entry = logs[0];

      expect(entry.details.signer.email).not.toBe('nested@example.com');
      expect(entry.details.signer.phone).not.toBe('(555) 999-8888');
      expect(entry.details.signer.name).toBe('Test User');
    });
  });

  // ---- Event Types ----

  describe('event types', () => {
    it('correctly records LOGIN event type', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGIN,
        userId: 'usr-001',
        description: 'Login.',
      });

      const logs = readLogFromStorage();
      expect(logs[0].eventType).toBe('LOGIN');
    });

    it('correctly records LOGOUT event type', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGOUT,
        userId: 'usr-001',
        description: 'Logout.',
      });

      const logs = readLogFromStorage();
      expect(logs[0].eventType).toBe('LOGOUT');
    });

    it('correctly records VERIFICATION event type', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.VERIFICATION,
        userId: 'usr-001',
        description: 'Verification.',
      });

      const logs = readLogFromStorage();
      expect(logs[0].eventType).toBe('VERIFICATION');
    });

    it('correctly records TOKEN_VALIDATION event type', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.TOKEN_VALIDATION,
        userId: 'usr-001',
        description: 'Token validation.',
      });

      const logs = readLogFromStorage();
      expect(logs[0].eventType).toBe('TOKEN_VALIDATION');
    });

    it('correctly records SIGNER_ADD event type', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SIGNER_ADD,
        userId: 'usr-001',
        description: 'Signer add.',
      });

      const logs = readLogFromStorage();
      expect(logs[0].eventType).toBe('SIGNER_ADD');
    });

    it('correctly records SIGNER_EDIT event type', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SIGNER_EDIT,
        userId: 'usr-001',
        description: 'Signer edit.',
      });

      const logs = readLogFromStorage();
      expect(logs[0].eventType).toBe('SIGNER_EDIT');
    });

    it('correctly records SIGNER_REMOVE event type', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SIGNER_REMOVE,
        userId: 'usr-001',
        description: 'Signer remove.',
      });

      const logs = readLogFromStorage();
      expect(logs[0].eventType).toBe('SIGNER_REMOVE');
    });

    it('correctly records SIGNER_UNLOCK event type', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SIGNER_UNLOCK,
        userId: 'usr-001',
        description: 'Signer unlock.',
      });

      const logs = readLogFromStorage();
      expect(logs[0].eventType).toBe('SIGNER_UNLOCK');
    });

    it('correctly records SIGNER_RESEND event type', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SIGNER_RESEND,
        userId: 'usr-001',
        description: 'Signer resend.',
      });

      const logs = readLogFromStorage();
      expect(logs[0].eventType).toBe('SIGNER_RESEND');
    });

    it('correctly records SUBMISSION event type', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SUBMISSION,
        userId: 'usr-001',
        description: 'Submission.',
      });

      const logs = readLogFromStorage();
      expect(logs[0].eventType).toBe('SUBMISSION');
    });

    it('correctly records SESSION_TIMEOUT event type', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SESSION_TIMEOUT,
        userId: 'usr-001',
        description: 'Session timeout.',
      });

      const logs = readLogFromStorage();
      expect(logs[0].eventType).toBe('SESSION_TIMEOUT');
    });

    it('correctly records ERROR event type', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.ERROR,
        userId: null,
        description: 'Error occurred.',
      });

      const logs = readLogFromStorage();
      expect(logs[0].eventType).toBe('ERROR');
    });
  });

  // ---- Append-only (immutable) ----

  describe('append-only behavior', () => {
    it('appends new entries without overwriting existing ones', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGIN,
        userId: 'usr-001',
        description: 'First event.',
      });

      logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGOUT,
        userId: 'usr-001',
        description: 'Second event.',
      });

      logEvent({
        eventType: AUDIT_EVENT_TYPES.VERIFICATION,
        userId: 'usr-001',
        description: 'Third event.',
      });

      const logs = readLogFromStorage();
      expect(logs).toHaveLength(3);
      expect(logs[0].eventType).toBe('LOGIN');
      expect(logs[0].description).toBe('First event.');
      expect(logs[1].eventType).toBe('LOGOUT');
      expect(logs[1].description).toBe('Second event.');
      expect(logs[2].eventType).toBe('VERIFICATION');
      expect(logs[2].description).toBe('Third event.');
    });

    it('preserves chronological order of entries', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGIN,
        userId: 'usr-001',
        description: 'Login.',
      });

      logEvent({
        eventType: AUDIT_EVENT_TYPES.VERIFICATION,
        userId: 'usr-001',
        description: 'Verification.',
      });

      const logs = readLogFromStorage();
      expect(logs).toHaveLength(2);

      const ts1 = new Date(logs[0].timestamp).getTime();
      const ts2 = new Date(logs[1].timestamp).getTime();
      expect(ts1).toBeLessThanOrEqual(ts2);
    });

    it('does not modify previously written entries when new entries are added', () => {
      const result1 = logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGIN,
        userId: 'usr-001',
        description: 'First.',
        details: { action: 'login' },
      });

      const logsAfterFirst = readLogFromStorage();
      const firstEntrySnapshot = JSON.parse(JSON.stringify(logsAfterFirst[0]));

      logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGOUT,
        userId: 'usr-001',
        description: 'Second.',
        details: { action: 'logout' },
      });

      const logsAfterSecond = readLogFromStorage();
      expect(logsAfterSecond).toHaveLength(2);

      // First entry should be identical to the snapshot
      expect(logsAfterSecond[0].eventId).toBe(firstEntrySnapshot.eventId);
      expect(logsAfterSecond[0].timestamp).toBe(firstEntrySnapshot.timestamp);
      expect(logsAfterSecond[0].description).toBe(firstEntrySnapshot.description);
      expect(logsAfterSecond[0].eventType).toBe(firstEntrySnapshot.eventType);
    });
  });

  // ---- getLogs ----

  describe('getLogs', () => {
    it('returns all log entries when no userId is provided', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGIN,
        userId: 'usr-001',
        description: 'Login.',
      });

      logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGIN,
        userId: 'usr-002',
        description: 'Another login.',
      });

      const logs = getLogs();
      expect(logs).toHaveLength(2);
    });

    it('filters log entries by userId when provided', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGIN,
        userId: 'usr-001',
        description: 'User 1 login.',
      });

      logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGIN,
        userId: 'usr-002',
        description: 'User 2 login.',
      });

      logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGOUT,
        userId: 'usr-001',
        description: 'User 1 logout.',
      });

      const user1Logs = getLogs('usr-001');
      expect(user1Logs).toHaveLength(2);
      expect(user1Logs[0].userId).toBe('usr-001');
      expect(user1Logs[1].userId).toBe('usr-001');

      const user2Logs = getLogs('usr-002');
      expect(user2Logs).toHaveLength(1);
      expect(user2Logs[0].userId).toBe('usr-002');
    });

    it('returns empty array when no logs exist', () => {
      const logs = getLogs();
      expect(logs).toEqual([]);
    });

    it('returns empty array when no logs match the userId', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGIN,
        userId: 'usr-001',
        description: 'Login.',
      });

      const logs = getLogs('usr-999');
      expect(logs).toEqual([]);
    });
  });

  // ---- getLogsByEventType ----

  describe('getLogsByEventType', () => {
    it('filters log entries by event type', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGIN,
        userId: 'usr-001',
        description: 'Login.',
      });

      logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGOUT,
        userId: 'usr-001',
        description: 'Logout.',
      });

      logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGIN,
        userId: 'usr-002',
        description: 'Another login.',
      });

      const loginLogs = getLogsByEventType(AUDIT_EVENT_TYPES.LOGIN);
      expect(loginLogs).toHaveLength(2);
      expect(loginLogs[0].eventType).toBe('LOGIN');
      expect(loginLogs[1].eventType).toBe('LOGIN');

      const logoutLogs = getLogsByEventType(AUDIT_EVENT_TYPES.LOGOUT);
      expect(logoutLogs).toHaveLength(1);
      expect(logoutLogs[0].eventType).toBe('LOGOUT');
    });

    it('returns empty array when no logs match the event type', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGIN,
        userId: 'usr-001',
        description: 'Login.',
      });

      const logs = getLogsByEventType(AUDIT_EVENT_TYPES.ERROR);
      expect(logs).toEqual([]);
    });
  });

  // ---- getLogCount ----

  describe('getLogCount', () => {
    it('returns 0 when no logs exist', () => {
      expect(getLogCount()).toBe(0);
    });

    it('returns the correct count after multiple events', () => {
      logEvent({ eventType: AUDIT_EVENT_TYPES.LOGIN, description: 'One.' });
      logEvent({ eventType: AUDIT_EVENT_TYPES.LOGOUT, description: 'Two.' });
      logEvent({ eventType: AUDIT_EVENT_TYPES.ERROR, description: 'Three.' });

      expect(getLogCount()).toBe(3);
    });
  });

  // ---- clearLogs ----

  describe('clearLogs', () => {
    it('removes all log entries', () => {
      logEvent({ eventType: AUDIT_EVENT_TYPES.LOGIN, description: 'Login.' });
      logEvent({ eventType: AUDIT_EVENT_TYPES.LOGOUT, description: 'Logout.' });

      expect(getLogCount()).toBe(2);

      const result = clearLogs();
      expect(result).toBe(true);
      expect(getLogCount()).toBe(0);

      const logs = getLogs();
      expect(logs).toEqual([]);
    });
  });

  // ---- Edge cases ----

  describe('edge cases', () => {
    it('handles corrupted localStorage data gracefully', () => {
      localStorage.setItem(AUDIT_LOG_KEY, 'not-valid-json');

      // logEvent should not throw — it should recover and write a new log
      const result = logEvent({
        eventType: AUDIT_EVENT_TYPES.ERROR,
        description: 'After corruption.',
      });

      expect(result).toBeDefined();
      expect(result.eventId).toBeDefined();
    });

    it('handles non-array localStorage data gracefully', () => {
      localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify({ not: 'an array' }));

      const logs = getLogs();
      expect(logs).toEqual([]);
    });

    it('does not throw when localStorage is full', () => {
      // Mock localStorage.setItem to throw a QuotaExceededError
      const originalSetItem = localStorage.setItem.bind(localStorage);
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
        if (key === AUDIT_LOG_KEY) {
          throw new DOMException('QuotaExceededError', 'QuotaExceededError');
        }
        return originalSetItem(key, value);
      });

      // logEvent should not throw
      expect(() => {
        logEvent({
          eventType: AUDIT_EVENT_TYPES.ERROR,
          description: 'Storage full.',
        });
      }).not.toThrow();

      setItemSpy.mockRestore();
    });

    it('sanitizes details with empty object', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGIN,
        userId: 'usr-001',
        description: 'Login.',
        details: {},
      });

      const logs = readLogFromStorage();
      expect(logs).toHaveLength(1);
      expect(logs[0].details).toEqual({});
    });

    it('handles null details gracefully', () => {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGIN,
        userId: 'usr-001',
        description: 'Login.',
        details: null,
      });

      const logs = readLogFromStorage();
      expect(logs).toHaveLength(1);
      // sanitizeForLog(null) returns null
      expect(logs[0].details).toBeNull();
    });
  });

  // ---- Log trimming ----

  describe('log trimming', () => {
    it('trims oldest entries when exceeding max log entries', () => {
      // Pre-populate localStorage with entries close to the max
      const maxEntries = 1000;
      const existingEntries = [];
      for (let i = 0; i < maxEntries; i++) {
        existingEntries.push({
          eventId: `existing-${i}`,
          userId: 'usr-001',
          eventType: 'LOGIN',
          timestamp: new Date().toISOString(),
          description: `Entry ${i}`,
          details: {},
          before: null,
          after: null,
        });
      }
      localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(existingEntries));

      // Add one more entry — should trigger trimming
      logEvent({
        eventType: AUDIT_EVENT_TYPES.LOGOUT,
        userId: 'usr-001',
        description: 'New entry after max.',
      });

      const logs = readLogFromStorage();
      // Should not exceed maxEntries
      expect(logs.length).toBeLessThanOrEqual(maxEntries);

      // The newest entry should be the one we just added
      const lastEntry = logs[logs.length - 1];
      expect(lastEntry.eventType).toBe('LOGOUT');
      expect(lastEntry.description).toBe('New entry after max.');

      // The oldest existing entry should have been trimmed
      expect(logs[0].eventId).not.toBe('existing-0');
    });
  });
});