/**
 * Account data retrieval and masking service.
 *
 * Provides functions for retrieving business banking accounts associated
 * with the authenticated user, with automatic PII masking of account
 * numbers. Supports pagination for large account lists.
 *
 * Loads from mock data fixtures for MVP — designed for seamless
 * replacement with a real backend API endpoint.
 *
 * @module accountService
 */

import {
  MOCK_ACCOUNTS,
  getSignersByAccountId,
  getAccountById as getMockAccountById,
} from '../data/mockData.js';
import { maskAccountNumber } from '../utils/maskingUtils.js';
import { logEvent, AUDIT_EVENT_TYPES } from './auditLogger.js';
import { DEFAULT_PAGE_SIZE } from '../constants/constants.js';

// ---- Internal Helpers ----

/**
 * Applies account number masking to a single account object.
 * Returns a new object — the original is never mutated.
 *
 * @param {Object} account - The raw account object.
 * @returns {Object} A copy of the account with masked account numbers.
 */
function maskAccountFields(account) {
  if (!account || typeof account !== 'object') {
    return account;
  }

  return {
    ...account,
    accountNumber: maskAccountNumber(account.accountNumberFull || account.accountNumber),
    accountNumberFull: undefined,
  };
}

/**
 * Applies account number masking to an array of account objects.
 *
 * @param {Array<Object>} accounts - The raw account array.
 * @returns {Array<Object>} A new array of masked account objects.
 */
function maskAccountList(accounts) {
  if (!Array.isArray(accounts)) {
    return [];
  }
  return accounts.map(maskAccountFields);
}

// ---- Public API ----

/**
 * Retrieves a paginated list of accounts for the authenticated user
 * with masked account numbers.
 *
 * @param {Object} [params]
 * @param {number} [params.page=1] - The page number (1-based).
 * @param {number} [params.pageSize] - Number of items per page
 *   (defaults to {@link DEFAULT_PAGE_SIZE}).
 * @param {string} [params.userId] - Optional user ID for audit logging.
 * @returns {{
 *   status: 'success'|'error',
 *   accounts: Array<Object>,
 *   pagination: {
 *     page: number,
 *     pageSize: number,
 *     totalItems: number,
 *     totalPages: number
 *   },
 *   message?: string
 * }} The paginated account list result.
 */
export function getAccounts(params = {}) {
  const {
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    userId = null,
  } = params;

  try {
    const allAccounts = [...MOCK_ACCOUNTS];
    const totalItems = allAccounts.length;

    const safePage = Math.max(1, Math.floor(page));
    const safePageSize = Math.max(1, Math.floor(pageSize));
    const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
    const clampedPage = Math.min(safePage, totalPages);

    const startIndex = (clampedPage - 1) * safePageSize;
    const endIndex = Math.min(startIndex + safePageSize, totalItems);
    const pageItems = allAccounts.slice(startIndex, endIndex);

    const maskedAccounts = maskAccountList(pageItems);

    try {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SUBMISSION,
        userId,
        description: `Retrieved accounts list — page ${clampedPage} of ${totalPages}.`,
        details: {
          action: 'get_accounts',
          page: clampedPage,
          pageSize: safePageSize,
          totalItems,
          totalPages,
          returnedItems: maskedAccounts.length,
        },
      });
    } catch {
      // Audit logging must never break the calling flow.
    }

    return {
      status: 'success',
      accounts: maskedAccounts,
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
      accounts: [],
      pagination: {
        page: 1,
        pageSize: pageSize || DEFAULT_PAGE_SIZE,
        totalItems: 0,
        totalPages: 0,
      },
      message: 'An unexpected error occurred while retrieving accounts.',
    };
  }
}

/**
 * Retrieves a single account by its ID with masked account numbers.
 *
 * @param {string} accountId - The account ID to look up.
 * @param {Object} [options]
 * @param {string} [options.userId] - Optional user ID for audit logging.
 * @returns {{
 *   status: 'success'|'error',
 *   account?: Object,
 *   message?: string
 * }} The account lookup result.
 */
export function getAccountById(accountId, options = {}) {
  const { userId = null } = options;

  if (!accountId || typeof accountId !== 'string') {
    return {
      status: 'error',
      message: 'A valid account ID is required.',
    };
  }

  try {
    const account = getMockAccountById(accountId);

    if (!account) {
      return {
        status: 'error',
        message: 'The requested account was not found.',
      };
    }

    const maskedAccount = maskAccountFields(account);

    try {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SUBMISSION,
        userId,
        description: `Retrieved account details for account ${maskedAccount.accountNumber}.`,
        details: {
          action: 'get_account_by_id',
          accountId,
        },
      });
    } catch {
      // Audit logging must never break the calling flow.
    }

    return {
      status: 'success',
      account: maskedAccount,
    };
  } catch {
    return {
      status: 'error',
      message: 'An unexpected error occurred while retrieving the account.',
    };
  }
}

/**
 * Returns the number of authorized signers associated with a given account.
 *
 * @param {string} accountId - The account ID to look up.
 * @returns {number} The number of signers for the account, or 0 if the
 *   account is not found or an error occurs.
 */
export function getSignerCount(accountId) {
  if (!accountId || typeof accountId !== 'string') {
    return 0;
  }

  try {
    const signers = getSignersByAccountId(accountId);
    return Array.isArray(signers) ? signers.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Retrieves all accounts without pagination, with masked account numbers.
 * Useful for dropdowns and selection lists where all accounts are needed.
 *
 * @param {Object} [options]
 * @param {string} [options.userId] - Optional user ID for audit logging.
 * @returns {Array<Object>} Array of masked account objects.
 */
export function getAllAccounts(options = {}) {
  const { userId = null } = options;

  try {
    const allAccounts = [...MOCK_ACCOUNTS];
    const maskedAccounts = maskAccountList(allAccounts);

    try {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SUBMISSION,
        userId,
        description: `Retrieved all accounts — ${maskedAccounts.length} total.`,
        details: {
          action: 'get_all_accounts',
          totalItems: maskedAccounts.length,
        },
      });
    } catch {
      // Audit logging must never break the calling flow.
    }

    return maskedAccounts;
  } catch {
    return [];
  }
}