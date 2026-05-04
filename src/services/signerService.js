/**
 * Signer management service.
 *
 * Provides CRUD operations for authorized signers, staged change tracking,
 * and batch submission with confirmation ID generation and audit logging.
 *
 * All mutations are staged in localStorage until explicitly submitted via
 * {@link submitChanges}. This supports a review-before-commit workflow.
 *
 * Exports:
 *   - {@link getSigners} — list signers for an account with sorting/filtering
 *   - {@link getSignerById} — retrieve a single signer by ID
 *   - {@link addSigner} — stage a new signer (pending)
 *   - {@link editSigner} — stage edits to an existing signer
 *   - {@link removeSigner} — stage a signer for removal
 *   - {@link unlockSigner} — unlock a locked signer (rate-limited)
 *   - {@link resendInvitation} — resend invitation to a signer (rate-limited)
 *   - {@link getStagedChanges} — retrieve all pending staged changes
 *   - {@link submitChanges} — finalize all staged changes
 *   - {@link getSubmissionStatus} — retrieve status of a past submission
 *   - {@link clearStagedChanges} — discard all staged changes
 *
 * @module signerService
 */

import { v4 as uuidv4 } from 'uuid';
import {
  MOCK_SIGNERS,
  getSignersByAccountId as getMockSignersByAccountId,
  getSignerById as getMockSignerById,
  getCardsBySignerId,
} from '../data/mockData.js';
import { getItem, setItem, removeItem } from '../utils/storageUtils.js';
import { logEvent, AUDIT_EVENT_TYPES } from './auditLogger.js';
import {
  getRateLimitStatus,
  incrementAttempt,
  RATE_LIMIT_ACTIONS,
} from './rateLimiter.js';
import { generateConfirmationId } from '../utils/idGenerator.js';
import { generateTokenId } from '../utils/idGenerator.js';
import { SIGNER_STATUSES, DEFAULT_PAGE_SIZE } from '../constants/constants.js';
import { UNLOCK_MESSAGES, RESEND_MESSAGES } from '../constants/messages.js';

// ---- localStorage Keys ----

/** localStorage key for staged additions */
const STAGED_ADDITIONS_KEY = 'scm_staged_additions';

/** localStorage key for staged edits */
const STAGED_EDITS_KEY = 'scm_staged_edits';

/** localStorage key for staged removals */
const STAGED_REMOVALS_KEY = 'scm_staged_removals';

/** localStorage key for submission history */
const SUBMISSION_HISTORY_KEY = 'scm_submission_history';

// ---- Internal Helpers ----

/**
 * Reads staged additions from localStorage.
 *
 * @returns {Array<Object>} Array of staged signer additions.
 */
function readStagedAdditions() {
  const additions = getItem(STAGED_ADDITIONS_KEY, []);
  return Array.isArray(additions) ? additions : [];
}

/**
 * Persists staged additions to localStorage.
 *
 * @param {Array<Object>} additions - The staged additions array.
 * @returns {boolean} `true` if the write succeeded.
 */
function writeStagedAdditions(additions) {
  return setItem(STAGED_ADDITIONS_KEY, additions);
}

/**
 * Reads staged edits from localStorage.
 *
 * @returns {Array<Object>} Array of staged signer edits.
 */
function readStagedEdits() {
  const edits = getItem(STAGED_EDITS_KEY, []);
  return Array.isArray(edits) ? edits : [];
}

/**
 * Persists staged edits to localStorage.
 *
 * @param {Array<Object>} edits - The staged edits array.
 * @returns {boolean} `true` if the write succeeded.
 */
function writeStagedEdits(edits) {
  return setItem(STAGED_EDITS_KEY, edits);
}

/**
 * Reads staged removals from localStorage.
 *
 * @returns {Array<Object>} Array of staged signer removals.
 */
function readStagedRemovals() {
  const removals = getItem(STAGED_REMOVALS_KEY, []);
  return Array.isArray(removals) ? removals : [];
}

/**
 * Persists staged removals to localStorage.
 *
 * @param {Array<Object>} removals - The staged removals array.
 * @returns {boolean} `true` if the write succeeded.
 */
function writeStagedRemovals(removals) {
  return setItem(STAGED_REMOVALS_KEY, removals);
}

/**
 * Reads submission history from localStorage.
 *
 * @returns {Array<Object>} Array of past submission records.
 */
function readSubmissionHistory() {
  const history = getItem(SUBMISSION_HISTORY_KEY, []);
  return Array.isArray(history) ? history : [];
}

/**
 * Persists submission history to localStorage.
 *
 * @param {Array<Object>} history - The submission history array.
 * @returns {boolean} `true` if the write succeeded.
 */
function writeSubmissionHistory(history) {
  return setItem(SUBMISSION_HISTORY_KEY, history);
}

/**
 * Sorts an array of signers by the specified field and direction.
 *
 * @param {Array<Object>} signers - The signers to sort.
 * @param {string} sortBy - The field name to sort by.
 * @param {string} sortDirection - 'asc' or 'desc'.
 * @returns {Array<Object>} A new sorted array.
 */
function sortSigners(signers, sortBy, sortDirection) {
  if (!sortBy) {
    return signers;
  }

  const direction = sortDirection === 'desc' ? -1 : 1;

  return [...signers].sort((a, b) => {
    const valA = a[sortBy];
    const valB = b[sortBy];

    if (valA === valB) return 0;
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;

    if (typeof valA === 'string' && typeof valB === 'string') {
      return valA.localeCompare(valB) * direction;
    }

    if (valA < valB) return -1 * direction;
    if (valA > valB) return 1 * direction;
    return 0;
  });
}

/**
 * Filters an array of signers by status.
 *
 * @param {Array<Object>} signers - The signers to filter.
 * @param {string} status - The status to filter by.
 * @returns {Array<Object>} Filtered array.
 */
function filterByStatus(signers, status) {
  if (!status) {
    return signers;
  }
  return signers.filter((s) => s.status === status);
}

/**
 * Filters an array of signers by a search query (name, email, lastFourSSN).
 *
 * @param {Array<Object>} signers - The signers to filter.
 * @param {string} query - The search query.
 * @returns {Array<Object>} Filtered array.
 */
function filterByQuery(signers, query) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return signers;
  }

  const lowerQuery = query.toLowerCase().trim();

  return signers.filter(
    (signer) =>
      (signer.fullName && signer.fullName.toLowerCase().includes(lowerQuery)) ||
      (signer.firstName && signer.firstName.toLowerCase().includes(lowerQuery)) ||
      (signer.lastName && signer.lastName.toLowerCase().includes(lowerQuery)) ||
      (signer.email && signer.email.toLowerCase().includes(lowerQuery)) ||
      (signer.lastFourSSN && signer.lastFourSSN.includes(lowerQuery))
  );
}

// ---- Public API ----

/**
 * Retrieves a paginated, sorted, and filtered list of signers for a
 * given account. Includes any staged additions and excludes staged removals.
 *
 * @param {Object} params
 * @param {string} params.accountId - The account ID to retrieve signers for.
 * @param {number} [params.page=1] - The page number (1-based).
 * @param {number} [params.pageSize] - Number of items per page.
 * @param {string} [params.sortBy='fullName'] - Field to sort by.
 * @param {string} [params.sortDirection='asc'] - Sort direction ('asc' or 'desc').
 * @param {string} [params.status] - Filter by signer status.
 * @param {string} [params.query] - Search query for name/email/SSN.
 * @param {string} [params.userId] - Optional user ID for audit logging.
 * @returns {{
 *   status: 'success'|'error',
 *   signers: Array<Object>,
 *   pagination: {
 *     page: number,
 *     pageSize: number,
 *     totalItems: number,
 *     totalPages: number
 *   },
 *   message?: string
 * }}
 */
export function getSigners(params = {}) {
  const {
    accountId,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    sortBy = 'fullName',
    sortDirection = 'asc',
    status,
    query,
    userId = null,
  } = params;

  if (!accountId || typeof accountId !== 'string') {
    return {
      status: 'error',
      signers: [],
      pagination: { page: 1, pageSize, totalItems: 0, totalPages: 0 },
      message: 'A valid account ID is required.',
    };
  }

  try {
    // Get base signers from mock data
    let signers = getMockSignersByAccountId(accountId);

    // Include staged additions for this account
    const additions = readStagedAdditions().filter(
      (a) => a.accountId === accountId
    );
    signers = [...signers, ...additions];

    // Exclude staged removals
    const removals = readStagedRemovals();
    const removalIds = new Set(removals.map((r) => r.signerId));
    signers = signers.filter((s) => !removalIds.has(s.id));

    // Apply staged edits
    const edits = readStagedEdits();
    const editMap = new Map();
    for (const edit of edits) {
      editMap.set(edit.signerId, edit.changes);
    }
    signers = signers.map((signer) => {
      const changes = editMap.get(signer.id);
      if (changes) {
        return { ...signer, ...changes };
      }
      return signer;
    });

    // Apply filters
    if (status) {
      signers = filterByStatus(signers, status);
    }
    if (query) {
      signers = filterByQuery(signers, query);
    }

    // Sort
    signers = sortSigners(signers, sortBy, sortDirection);

    // Paginate
    const totalItems = signers.length;
    const safePage = Math.max(1, Math.floor(page));
    const safePageSize = Math.max(1, Math.floor(pageSize));
    const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
    const clampedPage = Math.min(safePage, totalPages);
    const startIndex = (clampedPage - 1) * safePageSize;
    const endIndex = Math.min(startIndex + safePageSize, totalItems);
    const pageItems = signers.slice(startIndex, endIndex);

    try {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SUBMISSION,
        userId,
        description: `Retrieved signers for account ${accountId} — page ${clampedPage} of ${totalPages}.`,
        details: {
          action: 'get_signers',
          accountId,
          page: clampedPage,
          pageSize: safePageSize,
          totalItems,
          totalPages,
          returnedItems: pageItems.length,
        },
      });
    } catch {
      // Audit logging must never break the calling flow.
    }

    return {
      status: 'success',
      signers: pageItems,
      pagination: {
        page: clampedPage,
        pageSize: safePageSize,
        totalItems,
        totalPages,
      },
    };
  } catch {
    return {
      status: 'error',
      signers: [],
      pagination: { page: 1, pageSize, totalItems: 0, totalPages: 0 },
      message: 'An unexpected error occurred while retrieving signers.',
    };
  }
}

/**
 * Retrieves a single signer by ID, applying any staged edits.
 *
 * @param {string} signerId - The signer ID to look up.
 * @param {Object} [options]
 * @param {string} [options.userId] - Optional user ID for audit logging.
 * @returns {{
 *   status: 'success'|'error',
 *   signer?: Object,
 *   message?: string
 * }}
 */
export function getSignerById(signerId, options = {}) {
  const { userId = null } = options;

  if (!signerId || typeof signerId !== 'string') {
    return {
      status: 'error',
      message: 'A valid signer ID is required.',
    };
  }

  try {
    // Check staged removals first
    const removals = readStagedRemovals();
    const isRemoved = removals.some((r) => r.signerId === signerId);
    if (isRemoved) {
      return {
        status: 'error',
        message: 'This signer has been staged for removal.',
      };
    }

    // Check mock data
    let signer = getMockSignerById(signerId);

    // Check staged additions if not found in mock data
    if (!signer) {
      const additions = readStagedAdditions();
      signer = additions.find((a) => a.id === signerId) || null;
    }

    if (!signer) {
      return {
        status: 'error',
        message: 'The requested signer was not found.',
      };
    }

    // Apply staged edits
    const edits = readStagedEdits();
    const edit = edits.find((e) => e.signerId === signerId);
    if (edit && edit.changes) {
      signer = { ...signer, ...edit.changes };
    }

    try {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SUBMISSION,
        userId,
        description: `Retrieved signer details for ${signer.fullName || signerId}.`,
        details: {
          action: 'get_signer_by_id',
          signerId,
        },
      });
    } catch {
      // Audit logging must never break the calling flow.
    }

    return {
      status: 'success',
      signer,
    };
  } catch {
    return {
      status: 'error',
      message: 'An unexpected error occurred while retrieving the signer.',
    };
  }
}

/**
 * Stages a new signer addition for the specified account.
 * The signer is created with a pending status and a generated ID.
 *
 * @param {Object} params
 * @param {string} params.accountId - The account to add the signer to.
 * @param {Object} params.signerData - The signer data fields.
 * @param {string} params.signerData.firstName - First name.
 * @param {string} params.signerData.lastName - Last name.
 * @param {string} [params.signerData.email] - Email address.
 * @param {string} [params.signerData.phone] - Phone number.
 * @param {Object} [params.signerData.address] - Mailing address.
 * @param {string} [params.signerData.lastFourSSN] - Last four of SSN.
 * @param {string} [params.signerData.dateOfBirth] - Date of birth.
 * @param {string} [params.userId] - Optional user ID for audit logging.
 * @returns {{
 *   status: 'success'|'error',
 *   signer?: Object,
 *   message?: string
 * }}
 */
export function addSigner({ accountId, signerData, userId = null } = {}) {
  if (!accountId || typeof accountId !== 'string') {
    return {
      status: 'error',
      message: 'A valid account ID is required.',
    };
  }

  if (!signerData || typeof signerData !== 'object') {
    return {
      status: 'error',
      message: 'Signer data is required.',
    };
  }

  if (
    !signerData.firstName ||
    typeof signerData.firstName !== 'string' ||
    signerData.firstName.trim().length === 0
  ) {
    return {
      status: 'error',
      message: 'First name is required.',
    };
  }

  if (
    !signerData.lastName ||
    typeof signerData.lastName !== 'string' ||
    signerData.lastName.trim().length === 0
  ) {
    return {
      status: 'error',
      message: 'Last name is required.',
    };
  }

  try {
    const newSigner = {
      id: `sig-${uuidv4().slice(0, 8)}`,
      accountId,
      firstName: signerData.firstName.trim(),
      lastName: signerData.lastName.trim(),
      fullName: `${signerData.firstName.trim()} ${signerData.lastName.trim()}`,
      role: 'authorized_signer',
      status: SIGNER_STATUSES.PENDING,
      email: signerData.email || '',
      phone: signerData.phone || '',
      address: signerData.address || {
        line1: '',
        line2: '',
        city: '',
        state: '',
        zip: '',
      },
      lastFourSSN: signerData.lastFourSSN || '',
      dateOfBirth: signerData.dateOfBirth || '',
      createdAt: new Date().toISOString(),
    };

    const additions = readStagedAdditions();
    additions.push(newSigner);
    writeStagedAdditions(additions);

    try {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SIGNER_ADD,
        userId,
        description: `Staged new signer "${newSigner.fullName}" for account ${accountId}.`,
        details: {
          action: 'add_signer',
          signerId: newSigner.id,
          accountId,
          signerName: newSigner.fullName,
        },
        after: newSigner,
      });
    } catch {
      // Audit logging must never break the calling flow.
    }

    return {
      status: 'success',
      signer: newSigner,
      message: `Signer "${newSigner.fullName}" has been staged for addition.`,
    };
  } catch {
    return {
      status: 'error',
      message: 'An unexpected error occurred while adding the signer.',
    };
  }
}

/**
 * Stages edits to an existing signer. Tracks the before/after state
 * for audit purposes and moves the signer to pending status.
 *
 * @param {Object} params
 * @param {string} params.signerId - The ID of the signer to edit.
 * @param {Object} params.changes - An object containing the fields to update.
 * @param {string} [params.userId] - Optional user ID for audit logging.
 * @returns {{
 *   status: 'success'|'error',
 *   signer?: Object,
 *   message?: string
 * }}
 */
export function editSigner({ signerId, changes, userId = null } = {}) {
  if (!signerId || typeof signerId !== 'string') {
    return {
      status: 'error',
      message: 'A valid signer ID is required.',
    };
  }

  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
    return {
      status: 'error',
      message: 'Changes object is required.',
    };
  }

  try {
    // Find the original signer
    let originalSigner = getMockSignerById(signerId);

    if (!originalSigner) {
      const additions = readStagedAdditions();
      originalSigner = additions.find((a) => a.id === signerId) || null;
    }

    if (!originalSigner) {
      return {
        status: 'error',
        message: 'The signer to edit was not found.',
      };
    }

    // Check if already staged for removal
    const removals = readStagedRemovals();
    if (removals.some((r) => r.signerId === signerId)) {
      return {
        status: 'error',
        message: 'Cannot edit a signer that is staged for removal.',
      };
    }

    // Build the sanitized changes (exclude immutable fields)
    const allowedFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'address',
      'lastFourSSN',
      'dateOfBirth',
    ];

    const sanitizedChanges = {};
    for (const key of allowedFields) {
      if (key in changes) {
        sanitizedChanges[key] = changes[key];
      }
    }

    // Recompute fullName if first or last name changed
    if (sanitizedChanges.firstName || sanitizedChanges.lastName) {
      const firstName = (sanitizedChanges.firstName || originalSigner.firstName || '').trim();
      const lastName = (sanitizedChanges.lastName || originalSigner.lastName || '').trim();
      sanitizedChanges.fullName = `${firstName} ${lastName}`;
    }

    // Move to pending status
    sanitizedChanges.status = SIGNER_STATUSES.PENDING;

    // Check if this signer already has staged edits
    const edits = readStagedEdits();
    const existingIndex = edits.findIndex((e) => e.signerId === signerId);

    const editRecord = {
      signerId,
      accountId: originalSigner.accountId,
      changes: sanitizedChanges,
      before: { ...originalSigner },
      stagedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      // Merge with existing staged edits
      edits[existingIndex] = {
        ...edits[existingIndex],
        changes: { ...edits[existingIndex].changes, ...sanitizedChanges },
        stagedAt: editRecord.stagedAt,
      };
    } else {
      edits.push(editRecord);
    }

    writeStagedEdits(edits);

    const updatedSigner = { ...originalSigner, ...sanitizedChanges };

    try {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SIGNER_EDIT,
        userId,
        description: `Staged edits for signer "${updatedSigner.fullName || signerId}".`,
        details: {
          action: 'edit_signer',
          signerId,
          changedFields: Object.keys(sanitizedChanges),
        },
        before: originalSigner,
        after: updatedSigner,
      });
    } catch {
      // Audit logging must never break the calling flow.
    }

    return {
      status: 'success',
      signer: updatedSigner,
      message: `Edits for "${updatedSigner.fullName || signerId}" have been staged.`,
    };
  } catch {
    return {
      status: 'error',
      message: 'An unexpected error occurred while editing the signer.',
    };
  }
}

/**
 * Stages a signer for removal. Prevents removal of the last signer
 * on an account.
 *
 * @param {Object} params
 * @param {string} params.signerId - The ID of the signer to remove.
 * @param {string} params.accountId - The account the signer belongs to.
 * @param {string} [params.reason] - Optional reason for removal.
 * @param {string} [params.userId] - Optional user ID for audit logging.
 * @returns {{
 *   status: 'success'|'error',
 *   message: string
 * }}
 */
export function removeSigner({ signerId, accountId, reason = '', userId = null } = {}) {
  if (!signerId || typeof signerId !== 'string') {
    return {
      status: 'error',
      message: 'A valid signer ID is required.',
    };
  }

  if (!accountId || typeof accountId !== 'string') {
    return {
      status: 'error',
      message: 'A valid account ID is required.',
    };
  }

  try {
    // Get all signers for the account (mock + staged additions - staged removals)
    let accountSigners = getMockSignersByAccountId(accountId);
    const additions = readStagedAdditions().filter((a) => a.accountId === accountId);
    accountSigners = [...accountSigners, ...additions];

    const removals = readStagedRemovals();
    const existingRemovalIds = new Set(removals.map((r) => r.signerId));
    const activeSigners = accountSigners.filter((s) => !existingRemovalIds.has(s.id));

    // Prevent removal of the last signer
    if (activeSigners.length <= 1) {
      return {
        status: 'error',
        message: 'Cannot remove the last signer on an account. At least one signer must remain.',
      };
    }

    // Verify the signer exists in the active list
    const signerToRemove = activeSigners.find((s) => s.id === signerId);
    if (!signerToRemove) {
      return {
        status: 'error',
        message: 'The signer to remove was not found on this account.',
      };
    }

    // Check if already staged for removal
    if (existingRemovalIds.has(signerId)) {
      return {
        status: 'error',
        message: 'This signer is already staged for removal.',
      };
    }

    // Stage the removal
    const removalRecord = {
      signerId,
      accountId,
      signerName: signerToRemove.fullName || `${signerToRemove.firstName} ${signerToRemove.lastName}`,
      reason: reason || '',
      stagedAt: new Date().toISOString(),
    };

    removals.push(removalRecord);
    writeStagedRemovals(removals);

    // Also remove any staged edits for this signer
    const edits = readStagedEdits();
    const filteredEdits = edits.filter((e) => e.signerId !== signerId);
    if (filteredEdits.length !== edits.length) {
      writeStagedEdits(filteredEdits);
    }

    try {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SIGNER_REMOVE,
        userId,
        description: `Staged removal of signer "${removalRecord.signerName}" from account ${accountId}.`,
        details: {
          action: 'remove_signer',
          signerId,
          accountId,
          signerName: removalRecord.signerName,
          reason: reason || 'none provided',
        },
        before: signerToRemove,
      });
    } catch {
      // Audit logging must never break the calling flow.
    }

    return {
      status: 'success',
      message: `Signer "${removalRecord.signerName}" has been staged for removal.`,
    };
  } catch {
    return {
      status: 'error',
      message: 'An unexpected error occurred while removing the signer.',
    };
  }
}

/**
 * Unlocks a locked signer. Enforces daily rate limits via the
 * rate limiter service.
 *
 * @param {Object} params
 * @param {string} params.signerId - The ID of the signer to unlock.
 * @param {string} [params.userId] - Optional user ID for audit logging.
 * @returns {{
 *   status: 'success'|'error',
 *   signer?: Object,
 *   message: string,
 *   attemptsUsed?: number,
 *   remaining?: number
 * }}
 */
export function unlockSigner({ signerId, userId = null } = {}) {
  if (!signerId || typeof signerId !== 'string') {
    return {
      status: 'error',
      message: 'A valid signer ID is required.',
    };
  }

  try {
    // Check rate limit before proceeding
    const rateLimitStatus = getRateLimitStatus(RATE_LIMIT_ACTIONS.UNLOCK);

    if (rateLimitStatus.isExhausted) {
      return {
        status: 'error',
        message: UNLOCK_MESSAGES.ATTEMPTS_EXHAUSTED,
        attemptsUsed: rateLimitStatus.attemptsUsed,
        remaining: 0,
      };
    }

    // Find the signer
    const signer = getMockSignerById(signerId);

    if (!signer) {
      return {
        status: 'error',
        message: 'The signer to unlock was not found.',
      };
    }

    if (signer.status !== SIGNER_STATUSES.LOCKED) {
      return {
        status: 'error',
        message: 'This signer is not currently locked.',
      };
    }

    // Increment the rate limit counter
    const updated = incrementAttempt(RATE_LIMIT_ACTIONS.UNLOCK, userId);

    // Determine the appropriate message based on attempts used
    let message;
    if (updated.attemptsUsed === 1) {
      message = UNLOCK_MESSAGES.ATTEMPT_1_CONFIRM;
    } else if (updated.attemptsUsed === 2) {
      message = UNLOCK_MESSAGES.ATTEMPT_2_WARNING;
    } else if (updated.attemptsUsed >= 3) {
      message = UNLOCK_MESSAGES.ATTEMPT_3_FINAL_WARNING;
    } else {
      message = UNLOCK_MESSAGES.UNLOCK_SUCCESS;
    }

    // Stage the unlock as an edit (change status to active)
    const edits = readStagedEdits();
    const existingIndex = edits.findIndex((e) => e.signerId === signerId);

    const unlockChanges = { status: SIGNER_STATUSES.ACTIVE };

    if (existingIndex >= 0) {
      edits[existingIndex] = {
        ...edits[existingIndex],
        changes: { ...edits[existingIndex].changes, ...unlockChanges },
        stagedAt: new Date().toISOString(),
      };
    } else {
      edits.push({
        signerId,
        accountId: signer.accountId,
        changes: unlockChanges,
        before: { ...signer },
        stagedAt: new Date().toISOString(),
      });
    }

    writeStagedEdits(edits);

    const unlockedSigner = { ...signer, ...unlockChanges };

    try {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SIGNER_UNLOCK,
        userId,
        description: `Unlocked signer "${signer.fullName}" (attempt ${updated.attemptsUsed} of ${updated.maxAttempts}).`,
        details: {
          action: 'unlock_signer',
          signerId,
          attemptsUsed: updated.attemptsUsed,
          remaining: updated.remaining,
        },
        before: signer,
        after: unlockedSigner,
      });
    } catch {
      // Audit logging must never break the calling flow.
    }

    return {
      status: 'success',
      signer: unlockedSigner,
      message,
      attemptsUsed: updated.attemptsUsed,
      remaining: updated.remaining,
    };
  } catch {
    return {
      status: 'error',
      message: UNLOCK_MESSAGES.UNLOCK_FAILED,
    };
  }
}

/**
 * Resends an invitation to a signer. Enforces daily rate limits via
 * the rate limiter service and generates a new token.
 *
 * @param {Object} params
 * @param {string} params.signerId - The ID of the signer.
 * @param {string} [params.userId] - Optional user ID for audit logging.
 * @returns {{
 *   status: 'success'|'error',
 *   tokenId?: string,
 *   message: string,
 *   attemptsUsed?: number,
 *   remaining?: number
 * }}
 */
export function resendInvitation({ signerId, userId = null } = {}) {
  if (!signerId || typeof signerId !== 'string') {
    return {
      status: 'error',
      message: 'A valid signer ID is required.',
    };
  }

  try {
    // Check rate limit before proceeding
    const rateLimitStatus = getRateLimitStatus(RATE_LIMIT_ACTIONS.RESEND);

    if (rateLimitStatus.isExhausted) {
      return {
        status: 'error',
        message: RESEND_MESSAGES.ATTEMPTS_EXHAUSTED,
        attemptsUsed: rateLimitStatus.attemptsUsed,
        remaining: 0,
      };
    }

    // Find the signer
    let signer = getMockSignerById(signerId);

    if (!signer) {
      const additions = readStagedAdditions();
      signer = additions.find((a) => a.id === signerId) || null;
    }

    if (!signer) {
      return {
        status: 'error',
        message: 'The signer was not found.',
      };
    }

    // Increment the rate limit counter
    const updated = incrementAttempt(RATE_LIMIT_ACTIONS.RESEND, userId);

    // Generate a new token for the invitation
    const newTokenId = generateTokenId();

    // Determine the appropriate message based on attempts used
    let message;
    if (updated.attemptsUsed === 1) {
      message = RESEND_MESSAGES.ATTEMPT_1_CONFIRM;
    } else if (updated.attemptsUsed === 2) {
      message = RESEND_MESSAGES.ATTEMPT_2_WARNING;
    } else if (updated.attemptsUsed >= 3) {
      message = RESEND_MESSAGES.ATTEMPT_3_FINAL_WARNING;
    } else {
      message = RESEND_MESSAGES.RESEND_SUCCESS;
    }

    try {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SIGNER_RESEND,
        userId,
        description: `Resent invitation to signer "${signer.fullName}" (attempt ${updated.attemptsUsed} of ${updated.maxAttempts}).`,
        details: {
          action: 'resend_invitation',
          signerId,
          tokenId: newTokenId,
          attemptsUsed: updated.attemptsUsed,
          remaining: updated.remaining,
        },
      });
    } catch {
      // Audit logging must never break the calling flow.
    }

    return {
      status: 'success',
      tokenId: newTokenId,
      message,
      attemptsUsed: updated.attemptsUsed,
      remaining: updated.remaining,
    };
  } catch {
    return {
      status: 'error',
      message: RESEND_MESSAGES.RESEND_FAILED,
    };
  }
}

/**
 * Retrieves all currently staged changes (additions, edits, removals).
 *
 * @returns {{
 *   additions: Array<Object>,
 *   edits: Array<Object>,
 *   removals: Array<Object>,
 *   totalChanges: number,
 *   hasChanges: boolean
 * }}
 */
export function getStagedChanges() {
  try {
    const additions = readStagedAdditions();
    const edits = readStagedEdits();
    const removals = readStagedRemovals();
    const totalChanges = additions.length + edits.length + removals.length;

    return {
      additions,
      edits,
      removals,
      totalChanges,
      hasChanges: totalChanges > 0,
    };
  } catch {
    return {
      additions: [],
      edits: [],
      removals: [],
      totalChanges: 0,
      hasChanges: false,
    };
  }
}

/**
 * Finalizes all staged changes, generates a confirmation ID, logs the
 * audit trail, and clears the staged changes.
 *
 * @param {Object} [options]
 * @param {string} [options.userId] - Optional user ID for audit logging.
 * @param {string} [options.accountId] - Optional account ID for scoping.
 * @returns {{
 *   status: 'success'|'error',
 *   confirmationId?: string,
 *   summary?: {
 *     additions: number,
 *     edits: number,
 *     removals: number,
 *     totalChanges: number
 *   },
 *   submittedAt?: string,
 *   message: string
 * }}
 */
export function submitChanges(options = {}) {
  const { userId = null, accountId = null } = options;

  try {
    const staged = getStagedChanges();

    if (!staged.hasChanges) {
      return {
        status: 'error',
        message: 'No staged changes to submit.',
      };
    }

    const confirmationId = generateConfirmationId();
    const submittedAt = new Date().toISOString();

    const summary = {
      additions: staged.additions.length,
      edits: staged.edits.length,
      removals: staged.removals.length,
      totalChanges: staged.totalChanges,
    };

    // Build submission record
    const submissionRecord = {
      confirmationId,
      userId,
      accountId,
      submittedAt,
      summary,
      additions: staged.additions.map((a) => ({
        signerId: a.id,
        signerName: a.fullName,
        accountId: a.accountId,
      })),
      edits: staged.edits.map((e) => ({
        signerId: e.signerId,
        accountId: e.accountId,
        changedFields: Object.keys(e.changes),
      })),
      removals: staged.removals.map((r) => ({
        signerId: r.signerId,
        signerName: r.signerName,
        accountId: r.accountId,
        reason: r.reason,
      })),
      status: 'completed',
    };

    // Persist submission to history
    const history = readSubmissionHistory();
    history.push(submissionRecord);
    writeSubmissionHistory(history);

    // Clear all staged changes
    writeStagedAdditions([]);
    writeStagedEdits([]);
    writeStagedRemovals([]);

    try {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SUBMISSION,
        userId,
        description: `Submitted ${summary.totalChanges} signer change(s). Confirmation: ${confirmationId}.`,
        details: {
          action: 'submit_changes',
          confirmationId,
          accountId,
          summary,
        },
      });
    } catch {
      // Audit logging must never break the calling flow.
    }

    return {
      status: 'success',
      confirmationId,
      summary,
      submittedAt,
      message: `Changes submitted successfully. Confirmation ID: ${confirmationId}.`,
    };
  } catch {
    return {
      status: 'error',
      message: 'An unexpected error occurred while submitting changes.',
    };
  }
}

/**
 * Retrieves the status of a past submission by confirmation ID.
 *
 * @param {string} confirmationId - The confirmation ID to look up.
 * @returns {{
 *   status: 'success'|'error',
 *   submission?: Object,
 *   message?: string
 * }}
 */
export function getSubmissionStatus(confirmationId) {
  if (!confirmationId || typeof confirmationId !== 'string') {
    return {
      status: 'error',
      message: 'A valid confirmation ID is required.',
    };
  }

  try {
    const history = readSubmissionHistory();
    const submission = history.find(
      (s) => s.confirmationId === confirmationId
    );

    if (!submission) {
      return {
        status: 'error',
        message: 'No submission found with the provided confirmation ID.',
      };
    }

    return {
      status: 'success',
      submission,
    };
  } catch {
    return {
      status: 'error',
      message: 'An unexpected error occurred while retrieving submission status.',
    };
  }
}

/**
 * Clears all staged changes (additions, edits, removals).
 * Intended for cancel operations, testing, and administrative use.
 *
 * @param {Object} [options]
 * @param {string} [options.userId] - Optional user ID for audit logging.
 * @returns {{
 *   status: 'success',
 *   message: string
 * }}
 */
export function clearStagedChanges(options = {}) {
  const { userId = null } = options;

  try {
    const staged = getStagedChanges();

    writeStagedAdditions([]);
    writeStagedEdits([]);
    writeStagedRemovals([]);

    try {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SUBMISSION,
        userId,
        description: `Cleared ${staged.totalChanges} staged change(s).`,
        details: {
          action: 'clear_staged_changes',
          clearedAdditions: staged.additions.length,
          clearedEdits: staged.edits.length,
          clearedRemovals: staged.removals.length,
        },
      });
    } catch {
      // Audit logging must never break the calling flow.
    }

    return {
      status: 'success',
      message: 'All staged changes have been cleared.',
    };
  } catch {
    return {
      status: 'success',
      message: 'Staged changes cleared.',
    };
  }
}