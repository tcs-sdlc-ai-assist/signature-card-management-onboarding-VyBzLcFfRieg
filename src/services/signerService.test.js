import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getSigners,
  getSignerById,
  addSigner,
  editSigner,
  removeSigner,
  unlockSigner,
  resendInvitation,
  getStagedChanges,
  submitChanges,
  getSubmissionStatus,
  clearStagedChanges,
} from './signerService.js';
import { resetAttempts, RATE_LIMIT_ACTIONS } from './rateLimiter.js';
import { clearLogs, getLogs, AUDIT_EVENT_TYPES } from './auditLogger.js';
import { SIGNER_STATUSES, MAX_UNLOCK_ATTEMPTS_PER_DAY, MAX_RESEND_ATTEMPTS_PER_DAY } from '../constants/constants.js';
import { MOCK_SIGNERS, MOCK_ACCOUNTS } from '../data/mockData.js';
import { UNLOCK_MESSAGES, RESEND_MESSAGES } from '../constants/messages.js';

describe('signerService', () => {
  beforeEach(() => {
    localStorage.clear();
    clearLogs();
    resetAttempts(RATE_LIMIT_ACTIONS.UNLOCK);
    resetAttempts(RATE_LIMIT_ACTIONS.RESEND);
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ---- getSigners ----

  describe('getSigners', () => {
    it('returns signers for a valid account ID', () => {
      const result = getSigners({ accountId: 'acct-1001' });

      expect(result.status).toBe('success');
      expect(Array.isArray(result.signers)).toBe(true);
      expect(result.signers.length).toBeGreaterThan(0);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.totalItems).toBeGreaterThan(0);
    });

    it('returns signers belonging to the specified account only', () => {
      const result = getSigners({ accountId: 'acct-1001' });

      expect(result.status).toBe('success');

      // All returned signers should belong to acct-1001
      // (Note: staged additions could also be included, but on fresh state there are none)
      const mockSignersForAccount = MOCK_SIGNERS.filter((s) => s.accountId === 'acct-1001');
      expect(result.signers.length).toBe(mockSignersForAccount.length);
    });

    it('returns error for missing account ID', () => {
      const result = getSigners({});

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
      expect(result.signers).toEqual([]);
    });

    it('returns error for null account ID', () => {
      const result = getSigners({ accountId: null });

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('returns empty list for an account with no signers', () => {
      const result = getSigners({ accountId: 'acct-nonexistent' });

      expect(result.status).toBe('success');
      expect(result.signers).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
    });

    it('includes staged additions in the signer list', () => {
      addSigner({
        accountId: 'acct-1001',
        signerData: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: '(555) 000-1111',
        },
      });

      const result = getSigners({ accountId: 'acct-1001' });

      expect(result.status).toBe('success');

      const mockCount = MOCK_SIGNERS.filter((s) => s.accountId === 'acct-1001').length;
      expect(result.signers.length).toBe(mockCount + 1);
    });

    it('excludes staged removals from the signer list', () => {
      const mockSignersForAccount = MOCK_SIGNERS.filter((s) => s.accountId === 'acct-1001');
      const signerToRemove = mockSignersForAccount[0];

      removeSigner({
        signerId: signerToRemove.id,
        accountId: 'acct-1001',
      });

      const result = getSigners({ accountId: 'acct-1001' });

      expect(result.status).toBe('success');
      expect(result.signers.length).toBe(mockSignersForAccount.length - 1);

      const removedSigner = result.signers.find((s) => s.id === signerToRemove.id);
      expect(removedSigner).toBeUndefined();
    });

    it('applies staged edits to signers in the list', () => {
      const mockSignersForAccount = MOCK_SIGNERS.filter((s) => s.accountId === 'acct-1001');
      const signerToEdit = mockSignersForAccount[0];

      editSigner({
        signerId: signerToEdit.id,
        changes: { firstName: 'UpdatedFirstName' },
      });

      const result = getSigners({ accountId: 'acct-1001' });

      expect(result.status).toBe('success');

      const editedSigner = result.signers.find((s) => s.id === signerToEdit.id);
      expect(editedSigner).toBeDefined();
      expect(editedSigner.firstName).toBe('UpdatedFirstName');
    });

    it('filters signers by status', () => {
      const result = getSigners({
        accountId: 'acct-1001',
        status: SIGNER_STATUSES.LOCKED,
      });

      expect(result.status).toBe('success');

      for (const signer of result.signers) {
        expect(signer.status).toBe(SIGNER_STATUSES.LOCKED);
      }
    });

    it('filters signers by search query', () => {
      const result = getSigners({
        accountId: 'acct-1001',
        query: 'Emily',
      });

      expect(result.status).toBe('success');
      expect(result.signers.length).toBeGreaterThan(0);

      for (const signer of result.signers) {
        const matchesQuery =
          (signer.fullName && signer.fullName.toLowerCase().includes('emily')) ||
          (signer.firstName && signer.firstName.toLowerCase().includes('emily')) ||
          (signer.lastName && signer.lastName.toLowerCase().includes('emily')) ||
          (signer.email && signer.email.toLowerCase().includes('emily'));
        expect(matchesQuery).toBe(true);
      }
    });

    it('sorts signers by fullName ascending by default', () => {
      const result = getSigners({ accountId: 'acct-1001' });

      expect(result.status).toBe('success');

      if (result.signers.length > 1) {
        for (let i = 1; i < result.signers.length; i++) {
          const prev = (result.signers[i - 1].fullName || '').toLowerCase();
          const curr = (result.signers[i].fullName || '').toLowerCase();
          expect(prev.localeCompare(curr)).toBeLessThanOrEqual(0);
        }
      }
    });

    it('sorts signers descending when specified', () => {
      const result = getSigners({
        accountId: 'acct-1001',
        sortBy: 'fullName',
        sortDirection: 'desc',
      });

      expect(result.status).toBe('success');

      if (result.signers.length > 1) {
        for (let i = 1; i < result.signers.length; i++) {
          const prev = (result.signers[i - 1].fullName || '').toLowerCase();
          const curr = (result.signers[i].fullName || '').toLowerCase();
          expect(prev.localeCompare(curr)).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('paginates results correctly', () => {
      const result = getSigners({
        accountId: 'acct-1001',
        page: 1,
        pageSize: 2,
      });

      expect(result.status).toBe('success');
      expect(result.signers.length).toBeLessThanOrEqual(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(2);
    });
  });

  // ---- getSignerById ----

  describe('getSignerById', () => {
    it('returns a signer by ID', () => {
      const result = getSignerById('sig-2001');

      expect(result.status).toBe('success');
      expect(result.signer).toBeDefined();
      expect(result.signer.id).toBe('sig-2001');
      expect(result.signer.fullName).toBe('Emily Chen');
    });

    it('returns error for non-existent signer ID', () => {
      const result = getSignerById('sig-nonexistent');

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('returns error for missing signer ID', () => {
      const result = getSignerById(null);

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('returns error for empty string signer ID', () => {
      const result = getSignerById('');

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('returns staged addition signer by ID', () => {
      const addResult = addSigner({
        accountId: 'acct-1001',
        signerData: {
          firstName: 'New',
          lastName: 'Signer',
          email: 'new@example.com',
          phone: '(555) 000-2222',
        },
      });

      expect(addResult.status).toBe('success');
      const newSignerId = addResult.signer.id;

      const result = getSignerById(newSignerId);

      expect(result.status).toBe('success');
      expect(result.signer).toBeDefined();
      expect(result.signer.id).toBe(newSignerId);
      expect(result.signer.firstName).toBe('New');
      expect(result.signer.lastName).toBe('Signer');
    });

    it('returns error for signer staged for removal', () => {
      removeSigner({
        signerId: 'sig-2001',
        accountId: 'acct-1001',
      });

      const result = getSignerById('sig-2001');

      expect(result.status).toBe('error');
      expect(result.message).toContain('removal');
    });

    it('applies staged edits when retrieving signer by ID', () => {
      editSigner({
        signerId: 'sig-2001',
        changes: { firstName: 'ModifiedEmily' },
      });

      const result = getSignerById('sig-2001');

      expect(result.status).toBe('success');
      expect(result.signer.firstName).toBe('ModifiedEmily');
    });
  });

  // ---- addSigner ----

  describe('addSigner', () => {
    it('stages a new signer with pending status', () => {
      const result = addSigner({
        accountId: 'acct-1001',
        signerData: {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane.doe@example.com',
          phone: '(555) 111-2222',
        },
      });

      expect(result.status).toBe('success');
      expect(result.signer).toBeDefined();
      expect(result.signer.firstName).toBe('Jane');
      expect(result.signer.lastName).toBe('Doe');
      expect(result.signer.fullName).toBe('Jane Doe');
      expect(result.signer.status).toBe(SIGNER_STATUSES.PENDING);
      expect(result.signer.role).toBe('authorized_signer');
      expect(result.signer.id).toBeDefined();
      expect(result.signer.id.startsWith('sig-')).toBe(true);
      expect(result.signer.accountId).toBe('acct-1001');
      expect(result.message).toBeDefined();
    });

    it('adds the signer to staged additions', () => {
      addSigner({
        accountId: 'acct-1001',
        signerData: {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane.doe@example.com',
          phone: '(555) 111-2222',
        },
      });

      const staged = getStagedChanges();
      expect(staged.additions.length).toBe(1);
      expect(staged.additions[0].firstName).toBe('Jane');
      expect(staged.additions[0].lastName).toBe('Doe');
      expect(staged.hasChanges).toBe(true);
      expect(staged.totalChanges).toBe(1);
    });

    it('returns error for missing account ID', () => {
      const result = addSigner({
        signerData: {
          firstName: 'Jane',
          lastName: 'Doe',
        },
      });

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('returns error for missing first name', () => {
      const result = addSigner({
        accountId: 'acct-1001',
        signerData: {
          lastName: 'Doe',
        },
      });

      expect(result.status).toBe('error');
      expect(result.message).toContain('First name');
    });

    it('returns error for missing last name', () => {
      const result = addSigner({
        accountId: 'acct-1001',
        signerData: {
          firstName: 'Jane',
        },
      });

      expect(result.status).toBe('error');
      expect(result.message).toContain('Last name');
    });

    it('returns error for missing signer data', () => {
      const result = addSigner({
        accountId: 'acct-1001',
      });

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('returns error for empty params', () => {
      const result = addSigner();

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('generates unique IDs for multiple additions', () => {
      const result1 = addSigner({
        accountId: 'acct-1001',
        signerData: { firstName: 'First', lastName: 'Signer' },
      });

      const result2 = addSigner({
        accountId: 'acct-1001',
        signerData: { firstName: 'Second', lastName: 'Signer' },
      });

      expect(result1.signer.id).not.toBe(result2.signer.id);
    });

    it('logs an audit event for the addition', () => {
      addSigner({
        accountId: 'acct-1001',
        signerData: {
          firstName: 'Jane',
          lastName: 'Doe',
        },
        userId: 'usr-001',
      });

      const logs = getLogs('usr-001');
      const addLogs = logs.filter((l) => l.eventType === AUDIT_EVENT_TYPES.SIGNER_ADD);
      expect(addLogs.length).toBeGreaterThan(0);
      expect(addLogs[0].description).toContain('Jane Doe');
    });
  });

  // ---- editSigner ----

  describe('editSigner', () => {
    it('stages edits for an existing signer', () => {
      const result = editSigner({
        signerId: 'sig-2001',
        changes: { firstName: 'UpdatedEmily', email: 'updated@example.com' },
      });

      expect(result.status).toBe('success');
      expect(result.signer).toBeDefined();
      expect(result.signer.firstName).toBe('UpdatedEmily');
      expect(result.signer.email).toBe('updated@example.com');
      expect(result.signer.status).toBe(SIGNER_STATUSES.PENDING);
      expect(result.message).toBeDefined();
    });

    it('tracks before/after state in staged edits', () => {
      editSigner({
        signerId: 'sig-2001',
        changes: { firstName: 'UpdatedEmily' },
      });

      const staged = getStagedChanges();
      expect(staged.edits.length).toBe(1);
      expect(staged.edits[0].signerId).toBe('sig-2001');
      expect(staged.edits[0].changes).toBeDefined();
      expect(staged.edits[0].changes.firstName).toBe('UpdatedEmily');
      expect(staged.edits[0].before).toBeDefined();
      expect(staged.edits[0].before.firstName).toBe('Emily');
    });

    it('recomputes fullName when first name changes', () => {
      const result = editSigner({
        signerId: 'sig-2001',
        changes: { firstName: 'NewFirst' },
      });

      expect(result.status).toBe('success');
      expect(result.signer.fullName).toBe('NewFirst Chen');
    });

    it('recomputes fullName when last name changes', () => {
      const result = editSigner({
        signerId: 'sig-2001',
        changes: { lastName: 'NewLast' },
      });

      expect(result.status).toBe('success');
      expect(result.signer.fullName).toBe('Emily NewLast');
    });

    it('returns error for non-existent signer', () => {
      const result = editSigner({
        signerId: 'sig-nonexistent',
        changes: { firstName: 'Test' },
      });

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('returns error for missing signer ID', () => {
      const result = editSigner({
        changes: { firstName: 'Test' },
      });

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('returns error for missing changes object', () => {
      const result = editSigner({
        signerId: 'sig-2001',
      });

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('returns error when editing a signer staged for removal', () => {
      removeSigner({
        signerId: 'sig-2001',
        accountId: 'acct-1001',
      });

      const result = editSigner({
        signerId: 'sig-2001',
        changes: { firstName: 'Test' },
      });

      expect(result.status).toBe('error');
      expect(result.message).toContain('removal');
    });

    it('merges multiple edits for the same signer', () => {
      editSigner({
        signerId: 'sig-2001',
        changes: { firstName: 'First' },
      });

      editSigner({
        signerId: 'sig-2001',
        changes: { lastName: 'Second' },
      });

      const staged = getStagedChanges();
      expect(staged.edits.length).toBe(1);
      expect(staged.edits[0].changes.firstName).toBe('First');
      expect(staged.edits[0].changes.lastName).toBe('Second');
    });

    it('logs an audit event for the edit', () => {
      editSigner({
        signerId: 'sig-2001',
        changes: { firstName: 'AuditTest' },
        userId: 'usr-001',
      });

      const logs = getLogs('usr-001');
      const editLogs = logs.filter((l) => l.eventType === AUDIT_EVENT_TYPES.SIGNER_EDIT);
      expect(editLogs.length).toBeGreaterThan(0);
    });
  });

  // ---- removeSigner ----

  describe('removeSigner', () => {
    it('stages a signer for removal', () => {
      const result = removeSigner({
        signerId: 'sig-2001',
        accountId: 'acct-1001',
        reason: 'No longer with company',
      });

      expect(result.status).toBe('success');
      expect(result.message).toBeDefined();
      expect(result.message).toContain('Emily Chen');
    });

    it('adds the removal to staged changes', () => {
      removeSigner({
        signerId: 'sig-2001',
        accountId: 'acct-1001',
        reason: 'Left company',
      });

      const staged = getStagedChanges();
      expect(staged.removals.length).toBe(1);
      expect(staged.removals[0].signerId).toBe('sig-2001');
      expect(staged.removals[0].reason).toBe('Left company');
      expect(staged.removals[0].signerName).toBe('Emily Chen');
      expect(staged.hasChanges).toBe(true);
    });

    it('prevents removal of the last signer on an account', () => {
      // acct-1003 has 2 signers: sig-2006 and sig-2007
      // Remove the first one
      const result1 = removeSigner({
        signerId: 'sig-2006',
        accountId: 'acct-1003',
      });
      expect(result1.status).toBe('success');

      // Try to remove the second one — should fail
      const result2 = removeSigner({
        signerId: 'sig-2007',
        accountId: 'acct-1003',
      });

      expect(result2.status).toBe('error');
      expect(result2.message).toContain('last signer');
    });

    it('returns error for non-existent signer', () => {
      const result = removeSigner({
        signerId: 'sig-nonexistent',
        accountId: 'acct-1001',
      });

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('returns error for missing signer ID', () => {
      const result = removeSigner({
        accountId: 'acct-1001',
      });

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('returns error for missing account ID', () => {
      const result = removeSigner({
        signerId: 'sig-2001',
      });

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('returns error when signer is already staged for removal', () => {
      removeSigner({
        signerId: 'sig-2001',
        accountId: 'acct-1001',
      });

      const result = removeSigner({
        signerId: 'sig-2001',
        accountId: 'acct-1001',
      });

      expect(result.status).toBe('error');
      expect(result.message).toContain('already staged');
    });

    it('removes staged edits for the signer being removed', () => {
      editSigner({
        signerId: 'sig-2001',
        changes: { firstName: 'Edited' },
      });

      const stagedBefore = getStagedChanges();
      expect(stagedBefore.edits.length).toBe(1);

      removeSigner({
        signerId: 'sig-2001',
        accountId: 'acct-1001',
      });

      const stagedAfter = getStagedChanges();
      expect(stagedAfter.edits.length).toBe(0);
      expect(stagedAfter.removals.length).toBe(1);
    });

    it('logs an audit event for the removal', () => {
      removeSigner({
        signerId: 'sig-2001',
        accountId: 'acct-1001',
        userId: 'usr-001',
      });

      const logs = getLogs('usr-001');
      const removeLogs = logs.filter((l) => l.eventType === AUDIT_EVENT_TYPES.SIGNER_REMOVE);
      expect(removeLogs.length).toBeGreaterThan(0);
      expect(removeLogs[0].description).toContain('Emily Chen');
    });
  });

  // ---- unlockSigner ----

  describe('unlockSigner', () => {
    it('unlocks a locked signer', () => {
      // sig-2003 is locked
      const result = unlockSigner({ signerId: 'sig-2003' });

      expect(result.status).toBe('success');
      expect(result.signer).toBeDefined();
      expect(result.signer.status).toBe(SIGNER_STATUSES.ACTIVE);
      expect(result.message).toBeDefined();
      expect(result.attemptsUsed).toBe(1);
      expect(result.remaining).toBeDefined();
    });

    it('returns error for a signer that is not locked', () => {
      // sig-2001 is active
      const result = unlockSigner({ signerId: 'sig-2001' });

      expect(result.status).toBe('error');
      expect(result.message).toContain('not currently locked');
    });

    it('returns error for non-existent signer', () => {
      const result = unlockSigner({ signerId: 'sig-nonexistent' });

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('returns error for missing signer ID', () => {
      const result = unlockSigner({});

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('respects daily rate limits for unlock attempts', () => {
      // Exhaust all unlock attempts
      for (let i = 0; i < MAX_UNLOCK_ATTEMPTS_PER_DAY; i++) {
        unlockSigner({ signerId: 'sig-2003' });
      }

      // Next attempt should be rejected
      const result = unlockSigner({ signerId: 'sig-2003' });

      expect(result.status).toBe('error');
      expect(result.message).toBe(UNLOCK_MESSAGES.ATTEMPTS_EXHAUSTED);
      expect(result.attemptsUsed).toBe(MAX_UNLOCK_ATTEMPTS_PER_DAY);
      expect(result.remaining).toBe(0);
    });

    it('returns attempt-based messaging on first attempt', () => {
      const result = unlockSigner({ signerId: 'sig-2003' });

      expect(result.status).toBe('success');
      expect(result.attemptsUsed).toBe(1);
      expect(result.message).toBe(UNLOCK_MESSAGES.ATTEMPT_1_CONFIRM);
    });

    it('returns warning message on second attempt', () => {
      unlockSigner({ signerId: 'sig-2003' });
      const result = unlockSigner({ signerId: 'sig-2003' });

      expect(result.attemptsUsed).toBe(2);
      expect(result.message).toBe(UNLOCK_MESSAGES.ATTEMPT_2_WARNING);
    });

    it('returns final warning message on third attempt', () => {
      unlockSigner({ signerId: 'sig-2003' });
      unlockSigner({ signerId: 'sig-2003' });
      const result = unlockSigner({ signerId: 'sig-2003' });

      expect(result.attemptsUsed).toBe(3);
      expect(result.message).toBe(UNLOCK_MESSAGES.ATTEMPT_3_FINAL_WARNING);
    });

    it('stages the unlock as an edit changing status to active', () => {
      unlockSigner({ signerId: 'sig-2003' });

      const staged = getStagedChanges();
      expect(staged.edits.length).toBe(1);
      expect(staged.edits[0].signerId).toBe('sig-2003');
      expect(staged.edits[0].changes.status).toBe(SIGNER_STATUSES.ACTIVE);
    });

    it('logs an audit event for the unlock', () => {
      unlockSigner({ signerId: 'sig-2003', userId: 'usr-001' });

      const logs = getLogs('usr-001');
      const unlockLogs = logs.filter((l) => l.eventType === AUDIT_EVENT_TYPES.SIGNER_UNLOCK);
      expect(unlockLogs.length).toBeGreaterThan(0);
      expect(unlockLogs[0].description).toContain('Sarah Patel');
    });
  });

  // ---- resendInvitation ----

  describe('resendInvitation', () => {
    it('resends an invitation and generates a new token', () => {
      // sig-2005 is pending
      const result = resendInvitation({ signerId: 'sig-2005' });

      expect(result.status).toBe('success');
      expect(result.tokenId).toBeDefined();
      expect(typeof result.tokenId).toBe('string');
      expect(result.tokenId.startsWith('tok-')).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.attemptsUsed).toBe(1);
      expect(result.remaining).toBeDefined();
    });

    it('generates unique tokens for each resend', () => {
      const result1 = resendInvitation({ signerId: 'sig-2005' });
      const result2 = resendInvitation({ signerId: 'sig-2005' });

      expect(result1.tokenId).not.toBe(result2.tokenId);
    });

    it('returns error for non-existent signer', () => {
      const result = resendInvitation({ signerId: 'sig-nonexistent' });

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('returns error for missing signer ID', () => {
      const result = resendInvitation({});

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('respects daily rate limits for resend attempts', () => {
      // Exhaust all resend attempts
      for (let i = 0; i < MAX_RESEND_ATTEMPTS_PER_DAY; i++) {
        resendInvitation({ signerId: 'sig-2005' });
      }

      // Next attempt should be rejected
      const result = resendInvitation({ signerId: 'sig-2005' });

      expect(result.status).toBe('error');
      expect(result.message).toBe(RESEND_MESSAGES.ATTEMPTS_EXHAUSTED);
      expect(result.attemptsUsed).toBe(MAX_RESEND_ATTEMPTS_PER_DAY);
      expect(result.remaining).toBe(0);
    });

    it('returns attempt-based messaging on first attempt', () => {
      const result = resendInvitation({ signerId: 'sig-2005' });

      expect(result.attemptsUsed).toBe(1);
      expect(result.message).toBe(RESEND_MESSAGES.ATTEMPT_1_CONFIRM);
    });

    it('returns warning message on second attempt', () => {
      resendInvitation({ signerId: 'sig-2005' });
      const result = resendInvitation({ signerId: 'sig-2005' });

      expect(result.attemptsUsed).toBe(2);
      expect(result.message).toBe(RESEND_MESSAGES.ATTEMPT_2_WARNING);
    });

    it('returns final warning message on third attempt', () => {
      resendInvitation({ signerId: 'sig-2005' });
      resendInvitation({ signerId: 'sig-2005' });
      const result = resendInvitation({ signerId: 'sig-2005' });

      expect(result.attemptsUsed).toBe(3);
      expect(result.message).toBe(RESEND_MESSAGES.ATTEMPT_3_FINAL_WARNING);
    });

    it('logs an audit event for the resend', () => {
      resendInvitation({ signerId: 'sig-2005', userId: 'usr-001' });

      const logs = getLogs('usr-001');
      const resendLogs = logs.filter((l) => l.eventType === AUDIT_EVENT_TYPES.SIGNER_RESEND);
      expect(resendLogs.length).toBeGreaterThan(0);
      expect(resendLogs[0].description).toContain('David Nguyen');
    });
  });

  // ---- getStagedChanges ----

  describe('getStagedChanges', () => {
    it('returns empty staged changes on fresh state', () => {
      const staged = getStagedChanges();

      expect(staged.additions).toEqual([]);
      expect(staged.edits).toEqual([]);
      expect(staged.removals).toEqual([]);
      expect(staged.totalChanges).toBe(0);
      expect(staged.hasChanges).toBe(false);
    });

    it('returns correct counts after multiple operations', () => {
      addSigner({
        accountId: 'acct-1001',
        signerData: { firstName: 'New', lastName: 'Signer' },
      });

      editSigner({
        signerId: 'sig-2001',
        changes: { firstName: 'Edited' },
      });

      removeSigner({
        signerId: 'sig-2002',
        accountId: 'acct-1001',
      });

      const staged = getStagedChanges();

      expect(staged.additions.length).toBe(1);
      expect(staged.edits.length).toBe(1);
      expect(staged.removals.length).toBe(1);
      expect(staged.totalChanges).toBe(3);
      expect(staged.hasChanges).toBe(true);
    });
  });

  // ---- submitChanges ----

  describe('submitChanges', () => {
    it('generates a confirmation ID on successful submission', () => {
      addSigner({
        accountId: 'acct-1001',
        signerData: { firstName: 'Submit', lastName: 'Test' },
      });

      const result = submitChanges({ userId: 'usr-001', accountId: 'acct-1001' });

      expect(result.status).toBe('success');
      expect(result.confirmationId).toBeDefined();
      expect(typeof result.confirmationId).toBe('string');
      expect(result.confirmationId.startsWith('CONF-')).toBe(true);
      expect(result.confirmationId.length).toBeGreaterThan(5);
      expect(result.submittedAt).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.message).toContain(result.confirmationId);
    });

    it('returns a summary of submitted changes', () => {
      addSigner({
        accountId: 'acct-1001',
        signerData: { firstName: 'Added', lastName: 'Signer' },
      });

      editSigner({
        signerId: 'sig-2001',
        changes: { firstName: 'Edited' },
      });

      removeSigner({
        signerId: 'sig-2002',
        accountId: 'acct-1001',
      });

      const result = submitChanges({ userId: 'usr-001', accountId: 'acct-1001' });

      expect(result.status).toBe('success');
      expect(result.summary).toBeDefined();
      expect(result.summary.additions).toBe(1);
      expect(result.summary.edits).toBe(1);
      expect(result.summary.removals).toBe(1);
      expect(result.summary.totalChanges).toBe(3);
    });

    it('clears staged changes after successful submission', () => {
      addSigner({
        accountId: 'acct-1001',
        signerData: { firstName: 'Clear', lastName: 'Test' },
      });

      const stagedBefore = getStagedChanges();
      expect(stagedBefore.hasChanges).toBe(true);

      submitChanges({ userId: 'usr-001', accountId: 'acct-1001' });

      const stagedAfter = getStagedChanges();
      expect(stagedAfter.hasChanges).toBe(false);
      expect(stagedAfter.additions).toEqual([]);
      expect(stagedAfter.edits).toEqual([]);
      expect(stagedAfter.removals).toEqual([]);
      expect(stagedAfter.totalChanges).toBe(0);
    });

    it('returns error when there are no staged changes', () => {
      const result = submitChanges({ userId: 'usr-001', accountId: 'acct-1001' });

      expect(result.status).toBe('error');
      expect(result.message).toContain('No staged changes');
    });

    it('logs an audit event for the submission', () => {
      addSigner({
        accountId: 'acct-1001',
        signerData: { firstName: 'Audit', lastName: 'Submit' },
      });

      const result = submitChanges({ userId: 'usr-001', accountId: 'acct-1001' });

      const logs = getLogs('usr-001');
      const submissionLogs = logs.filter(
        (l) => l.eventType === AUDIT_EVENT_TYPES.SUBMISSION && l.description.includes('Confirmation')
      );
      expect(submissionLogs.length).toBeGreaterThan(0);
      expect(submissionLogs[0].description).toContain(result.confirmationId);
    });

    it('generates unique confirmation IDs for each submission', () => {
      addSigner({
        accountId: 'acct-1001',
        signerData: { firstName: 'First', lastName: 'Submit' },
      });
      const result1 = submitChanges({ userId: 'usr-001', accountId: 'acct-1001' });

      addSigner({
        accountId: 'acct-1001',
        signerData: { firstName: 'Second', lastName: 'Submit' },
      });
      const result2 = submitChanges({ userId: 'usr-001', accountId: 'acct-1001' });

      expect(result1.confirmationId).not.toBe(result2.confirmationId);
    });

    it('persists submission to history for later retrieval', () => {
      addSigner({
        accountId: 'acct-1001',
        signerData: { firstName: 'History', lastName: 'Test' },
      });

      const submitResult = submitChanges({ userId: 'usr-001', accountId: 'acct-1001' });

      const statusResult = getSubmissionStatus(submitResult.confirmationId);

      expect(statusResult.status).toBe('success');
      expect(statusResult.submission).toBeDefined();
      expect(statusResult.submission.confirmationId).toBe(submitResult.confirmationId);
      expect(statusResult.submission.status).toBe('completed');
      expect(statusResult.submission.summary).toBeDefined();
    });

    it('prevents duplicate submission by clearing staged changes', () => {
      addSigner({
        accountId: 'acct-1001',
        signerData: { firstName: 'Duplicate', lastName: 'Test' },
      });

      const result1 = submitChanges({ userId: 'usr-001', accountId: 'acct-1001' });
      expect(result1.status).toBe('success');

      // Second submission should fail because staged changes were cleared
      const result2 = submitChanges({ userId: 'usr-001', accountId: 'acct-1001' });
      expect(result2.status).toBe('error');
      expect(result2.message).toContain('No staged changes');
    });
  });

  // ---- getSubmissionStatus ----

  describe('getSubmissionStatus', () => {
    it('returns submission details for a valid confirmation ID', () => {
      addSigner({
        accountId: 'acct-1001',
        signerData: { firstName: 'Status', lastName: 'Test' },
      });

      const submitResult = submitChanges({ userId: 'usr-001', accountId: 'acct-1001' });
      const result = getSubmissionStatus(submitResult.confirmationId);

      expect(result.status).toBe('success');
      expect(result.submission).toBeDefined();
      expect(result.submission.confirmationId).toBe(submitResult.confirmationId);
      expect(result.submission.submittedAt).toBeDefined();
      expect(result.submission.summary).toBeDefined();
      expect(result.submission.userId).toBe('usr-001');
      expect(result.submission.accountId).toBe('acct-1001');
    });

    it('returns error for non-existent confirmation ID', () => {
      const result = getSubmissionStatus('CONF-NONEXIST');

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('returns error for missing confirmation ID', () => {
      const result = getSubmissionStatus(null);

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('returns error for empty string confirmation ID', () => {
      const result = getSubmissionStatus('');

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });
  });

  // ---- clearStagedChanges ----

  describe('clearStagedChanges', () => {
    it('clears all staged changes', () => {
      addSigner({
        accountId: 'acct-1001',
        signerData: { firstName: 'Clear', lastName: 'Me' },
      });

      editSigner({
        signerId: 'sig-2001',
        changes: { firstName: 'Edited' },
      });

      removeSigner({
        signerId: 'sig-2002',
        accountId: 'acct-1001',
      });

      const stagedBefore = getStagedChanges();
      expect(stagedBefore.totalChanges).toBe(3);

      const result = clearStagedChanges({ userId: 'usr-001' });

      expect(result.status).toBe('success');
      expect(result.message).toBeDefined();

      const stagedAfter = getStagedChanges();
      expect(stagedAfter.additions).toEqual([]);
      expect(stagedAfter.edits).toEqual([]);
      expect(stagedAfter.removals).toEqual([]);
      expect(stagedAfter.totalChanges).toBe(0);
      expect(stagedAfter.hasChanges).toBe(false);
    });

    it('succeeds even when there are no staged changes', () => {
      const result = clearStagedChanges();

      expect(result.status).toBe('success');
    });

    it('logs an audit event for the clear', () => {
      addSigner({
        accountId: 'acct-1001',
        signerData: { firstName: 'Log', lastName: 'Clear' },
      });

      clearStagedChanges({ userId: 'usr-001' });

      const logs = getLogs('usr-001');
      const clearLogs = logs.filter(
        (l) => l.eventType === AUDIT_EVENT_TYPES.SUBMISSION && l.description.includes('Cleared')
      );
      expect(clearLogs.length).toBeGreaterThan(0);
    });
  });

  // ---- Edge cases ----

  describe('edge cases', () => {
    it('handles empty params for submitChanges gracefully', () => {
      const result = submitChanges();

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('handles corrupted localStorage for staged additions gracefully', () => {
      localStorage.setItem('scm_staged_additions', 'not-valid-json');

      expect(() => {
        getStagedChanges();
      }).not.toThrow();

      const staged = getStagedChanges();
      expect(staged.additions).toEqual([]);
    });

    it('handles corrupted localStorage for staged edits gracefully', () => {
      localStorage.setItem('scm_staged_edits', 'not-valid-json');

      expect(() => {
        getStagedChanges();
      }).not.toThrow();

      const staged = getStagedChanges();
      expect(staged.edits).toEqual([]);
    });

    it('handles corrupted localStorage for staged removals gracefully', () => {
      localStorage.setItem('scm_staged_removals', 'not-valid-json');

      expect(() => {
        getStagedChanges();
      }).not.toThrow();

      const staged = getStagedChanges();
      expect(staged.removals).toEqual([]);
    });

    it('addSigner trims whitespace from first and last name', () => {
      const result = addSigner({
        accountId: 'acct-1001',
        signerData: {
          firstName: '  Trimmed  ',
          lastName: '  Name  ',
        },
      });

      expect(result.status).toBe('success');
      expect(result.signer.firstName).toBe('Trimmed');
      expect(result.signer.lastName).toBe('Name');
      expect(result.signer.fullName).toBe('Trimmed Name');
    });

    it('removeSigner works with optional reason', () => {
      const result = removeSigner({
        signerId: 'sig-2001',
        accountId: 'acct-1001',
      });

      expect(result.status).toBe('success');

      const staged = getStagedChanges();
      expect(staged.removals[0].reason).toBe('');
    });

    it('unlockSigner does not increment beyond max attempts', () => {
      for (let i = 0; i < MAX_UNLOCK_ATTEMPTS_PER_DAY + 2; i++) {
        unlockSigner({ signerId: 'sig-2003' });
      }

      const result = unlockSigner({ signerId: 'sig-2003' });
      expect(result.status).toBe('error');
      expect(result.attemptsUsed).toBe(MAX_UNLOCK_ATTEMPTS_PER_DAY);
    });

    it('resendInvitation does not increment beyond max attempts', () => {
      for (let i = 0; i < MAX_RESEND_ATTEMPTS_PER_DAY + 2; i++) {
        resendInvitation({ signerId: 'sig-2005' });
      }

      const result = resendInvitation({ signerId: 'sig-2005' });
      expect(result.status).toBe('error');
      expect(result.attemptsUsed).toBe(MAX_RESEND_ATTEMPTS_PER_DAY);
    });

    it('editSigner ignores immutable fields like id and accountId', () => {
      const result = editSigner({
        signerId: 'sig-2001',
        changes: {
          id: 'sig-hacked',
          accountId: 'acct-hacked',
          firstName: 'Allowed',
        },
      });

      expect(result.status).toBe('success');

      const staged = getStagedChanges();
      expect(staged.edits[0].changes.id).toBeUndefined();
      expect(staged.edits[0].changes.accountId).toBeUndefined();
      expect(staged.edits[0].changes.firstName).toBe('Allowed');
    });

    it('can add a signer to a staged addition and then edit it', () => {
      const addResult = addSigner({
        accountId: 'acct-1001',
        signerData: { firstName: 'Staged', lastName: 'Addition' },
      });

      const editResult = editSigner({
        signerId: addResult.signer.id,
        changes: { firstName: 'EditedStaged' },
      });

      expect(editResult.status).toBe('success');
      expect(editResult.signer.firstName).toBe('EditedStaged');
    });

    it('submitChanges includes correct submittedAt timestamp', () => {
      addSigner({
        accountId: 'acct-1001',
        signerData: { firstName: 'Time', lastName: 'Test' },
      });

      const before = Date.now();
      const result = submitChanges({ userId: 'usr-001', accountId: 'acct-1001' });
      const after = Date.now();

      expect(result.submittedAt).toBeDefined();
      const submittedMs = new Date(result.submittedAt).getTime();
      expect(submittedMs).toBeGreaterThanOrEqual(before);
      expect(submittedMs).toBeLessThanOrEqual(after);
    });
  });
});