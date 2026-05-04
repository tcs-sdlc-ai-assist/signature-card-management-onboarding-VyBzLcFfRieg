/**
 * Account and signer management context provider.
 *
 * Provides global account, signer, and staged-change state to the
 * component tree. Wraps {@link accountService} and {@link signerService}
 * for data retrieval and mutation operations.
 *
 * Exports:
 *   - {@link AccountContext} — the React context object
 *   - {@link AccountProvider} — the context provider component
 *   - {@link useAccount} — custom hook for consuming account state
 *
 * @module AccountContext
 */

import React, { createContext, useState, useCallback, useEffect, useContext, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { getAccounts, getAccountById, getAllAccounts } from '../services/accountService.js';
import {
  getSigners,
  getSignerById as fetchSignerById,
  addSigner as serviceAddSigner,
  editSigner as serviceEditSigner,
  removeSigner as serviceRemoveSigner,
  unlockSigner as serviceUnlockSigner,
  resendInvitation as serviceResendInvitation,
  getStagedChanges,
  submitChanges as serviceSubmitChanges,
  clearStagedChanges as serviceClearStagedChanges,
} from '../services/signerService.js';
import { useAuth } from './AuthContext.jsx';
import { logEvent, AUDIT_EVENT_TYPES } from '../services/auditLogger.js';

/**
 * @type {React.Context}
 */
export const AccountContext = createContext(null);

/**
 * Account and signer management context provider component.
 *
 * Manages account selection, signer listing with sort/filter, staged
 * change tracking, and submission lifecycle. Integrates with the
 * authenticated user from {@link AuthContext} for audit logging.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components.
 * @returns {React.ReactElement}
 */
export function AccountProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [signers, setSigners] = useState([]);
  const [stagedChanges, setStagedChanges] = useState({
    additions: [],
    edits: [],
    removals: [],
    totalChanges: 0,
    hasChanges: false,
  });
  const [submissionResult, setSubmissionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [sortConfig, setSortConfig] = useState({
    sortBy: 'fullName',
    sortDirection: 'asc',
  });

  const [filterConfig, setFilterConfig] = useState({
    status: '',
    query: '',
  });

  const selectedAccountRef = useRef(null);

  /**
   * Returns the current user ID for audit logging, or null.
   * @returns {string|null}
   */
  const getUserId = useCallback(() => {
    return user?.id ?? null;
  }, [user]);

  /**
   * Refreshes the staged changes state from the signer service.
   */
  const refreshStagedChanges = useCallback(() => {
    try {
      const staged = getStagedChanges();
      setStagedChanges(staged);
    } catch {
      // Staged changes read failure should not break the UI.
    }
  }, []);

  /**
   * Loads the list of signers for the currently selected account,
   * applying the current sort and filter configuration.
   */
  const loadSigners = useCallback(() => {
    const accountId = selectedAccountRef.current;
    if (!accountId) {
      setSigners([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = getSigners({
        accountId,
        sortBy: sortConfig.sortBy,
        sortDirection: sortConfig.sortDirection,
        status: filterConfig.status || undefined,
        query: filterConfig.query || undefined,
        userId: getUserId(),
      });

      if (result.status === 'success') {
        setSigners(result.signers);
      } else {
        setSigners([]);
        setError(result.message || 'Failed to load signers.');
      }
    } catch {
      setSigners([]);
      setError('An unexpected error occurred while loading signers.');
    } finally {
      setLoading(false);
    }
  }, [sortConfig, filterConfig, getUserId]);

  /**
   * Loads the list of accounts for the authenticated user.
   */
  const loadAccounts = useCallback(() => {
    if (!isAuthenticated) {
      setAccounts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allAccounts = getAllAccounts({ userId: getUserId() });
      setAccounts(allAccounts);
    } catch {
      setAccounts([]);
      setError('An unexpected error occurred while loading accounts.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getUserId]);

  /**
   * Selects an account by ID and loads its signers.
   *
   * @param {string} accountId - The account ID to select.
   */
  const selectAccount = useCallback((accountId) => {
    if (!accountId || typeof accountId !== 'string') {
      setSelectedAccount(null);
      selectedAccountRef.current = null;
      setSigners([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = getAccountById(accountId, { userId: getUserId() });

      if (result.status === 'success' && result.account) {
        setSelectedAccount(result.account);
        selectedAccountRef.current = accountId;

        try {
          logEvent({
            eventType: AUDIT_EVENT_TYPES.SUBMISSION,
            userId: getUserId(),
            description: `Selected account ${result.account.accountNumber}.`,
            details: {
              action: 'select_account',
              accountId,
            },
          });
        } catch {
          // Audit logging must never break the calling flow.
        }
      } else {
        setSelectedAccount(null);
        selectedAccountRef.current = null;
        setSigners([]);
        setError(result.message || 'Account not found.');
        setLoading(false);
        return;
      }
    } catch {
      setSelectedAccount(null);
      selectedAccountRef.current = null;
      setSigners([]);
      setError('An unexpected error occurred while selecting the account.');
      setLoading(false);
      return;
    }

    // Load signers for the selected account
    try {
      const signersResult = getSigners({
        accountId,
        sortBy: sortConfig.sortBy,
        sortDirection: sortConfig.sortDirection,
        status: filterConfig.status || undefined,
        query: filterConfig.query || undefined,
        userId: getUserId(),
      });

      if (signersResult.status === 'success') {
        setSigners(signersResult.signers);
      } else {
        setSigners([]);
        setError(signersResult.message || 'Failed to load signers.');
      }
    } catch {
      setSigners([]);
      setError('An unexpected error occurred while loading signers.');
    } finally {
      setLoading(false);
    }

    refreshStagedChanges();
  }, [sortConfig, filterConfig, getUserId, refreshStagedChanges]);

  /**
   * Stages a new signer addition for the selected account.
   *
   * @param {Object} signerData - The signer data fields.
   * @returns {{
   *   status: 'success'|'error',
   *   signer?: Object,
   *   message?: string
   * }}
   */
  const addSigner = useCallback((signerData) => {
    if (!selectedAccountRef.current) {
      return {
        status: 'error',
        message: 'No account selected. Please select an account first.',
      };
    }

    setError(null);

    try {
      const result = serviceAddSigner({
        accountId: selectedAccountRef.current,
        signerData,
        userId: getUserId(),
      });

      if (result.status === 'success') {
        loadSigners();
        refreshStagedChanges();
      } else {
        setError(result.message || 'Failed to add signer.');
      }

      return result;
    } catch {
      const message = 'An unexpected error occurred while adding the signer.';
      setError(message);
      return {
        status: 'error',
        message,
      };
    }
  }, [getUserId, loadSigners, refreshStagedChanges]);

  /**
   * Stages edits to an existing signer.
   *
   * @param {string} signerId - The ID of the signer to edit.
   * @param {Object} changes - The fields to update.
   * @returns {{
   *   status: 'success'|'error',
   *   signer?: Object,
   *   message?: string
   * }}
   */
  const editSigner = useCallback((signerId, changes) => {
    setError(null);

    try {
      const result = serviceEditSigner({
        signerId,
        changes,
        userId: getUserId(),
      });

      if (result.status === 'success') {
        loadSigners();
        refreshStagedChanges();
      } else {
        setError(result.message || 'Failed to edit signer.');
      }

      return result;
    } catch {
      const message = 'An unexpected error occurred while editing the signer.';
      setError(message);
      return {
        status: 'error',
        message,
      };
    }
  }, [getUserId, loadSigners, refreshStagedChanges]);

  /**
   * Stages a signer for removal.
   *
   * @param {string} signerId - The ID of the signer to remove.
   * @param {string} [reason] - Optional reason for removal.
   * @returns {{
   *   status: 'success'|'error',
   *   message: string
   * }}
   */
  const removeSigner = useCallback((signerId, reason = '') => {
    if (!selectedAccountRef.current) {
      return {
        status: 'error',
        message: 'No account selected. Please select an account first.',
      };
    }

    setError(null);

    try {
      const result = serviceRemoveSigner({
        signerId,
        accountId: selectedAccountRef.current,
        reason,
        userId: getUserId(),
      });

      if (result.status === 'success') {
        loadSigners();
        refreshStagedChanges();
      } else {
        setError(result.message || 'Failed to remove signer.');
      }

      return result;
    } catch {
      const message = 'An unexpected error occurred while removing the signer.';
      setError(message);
      return {
        status: 'error',
        message,
      };
    }
  }, [getUserId, loadSigners, refreshStagedChanges]);

  /**
   * Unlocks a locked signer. Enforces daily rate limits.
   *
   * @param {string} signerId - The ID of the signer to unlock.
   * @returns {{
   *   status: 'success'|'error',
   *   signer?: Object,
   *   message: string,
   *   attemptsUsed?: number,
   *   remaining?: number
   * }}
   */
  const unlockSigner = useCallback((signerId) => {
    setError(null);

    try {
      const result = serviceUnlockSigner({
        signerId,
        userId: getUserId(),
      });

      if (result.status === 'success') {
        loadSigners();
        refreshStagedChanges();
      } else {
        setError(result.message || 'Failed to unlock signer.');
      }

      return result;
    } catch {
      const message = 'An unexpected error occurred while unlocking the signer.';
      setError(message);
      return {
        status: 'error',
        message,
      };
    }
  }, [getUserId, loadSigners, refreshStagedChanges]);

  /**
   * Resends an invitation to a signer. Enforces daily rate limits.
   *
   * @param {string} signerId - The ID of the signer.
   * @returns {{
   *   status: 'success'|'error',
   *   tokenId?: string,
   *   message: string,
   *   attemptsUsed?: number,
   *   remaining?: number
   * }}
   */
  const resendInvitation = useCallback((signerId) => {
    setError(null);

    try {
      const result = serviceResendInvitation({
        signerId,
        userId: getUserId(),
      });

      if (result.status !== 'success') {
        setError(result.message || 'Failed to resend invitation.');
      }

      return result;
    } catch {
      const message = 'An unexpected error occurred while resending the invitation.';
      setError(message);
      return {
        status: 'error',
        message,
      };
    }
  }, [getUserId]);

  /**
   * Finalizes all staged changes and generates a confirmation ID.
   *
   * @returns {{
   *   status: 'success'|'error',
   *   confirmationId?: string,
   *   summary?: Object,
   *   submittedAt?: string,
   *   message: string
   * }}
   */
  const submitChanges = useCallback(() => {
    setLoading(true);
    setError(null);
    setSubmissionResult(null);

    try {
      const result = serviceSubmitChanges({
        userId: getUserId(),
        accountId: selectedAccountRef.current,
      });

      if (result.status === 'success') {
        setSubmissionResult(result);
        loadSigners();
        refreshStagedChanges();
      } else {
        setError(result.message || 'Failed to submit changes.');
      }

      setLoading(false);
      return result;
    } catch {
      const message = 'An unexpected error occurred while submitting changes.';
      setError(message);
      setLoading(false);
      return {
        status: 'error',
        message,
      };
    }
  }, [getUserId, loadSigners, refreshStagedChanges]);

  /**
   * Clears all staged changes without submitting.
   *
   * @returns {{
   *   status: 'success',
   *   message: string
   * }}
   */
  const clearChanges = useCallback(() => {
    setError(null);

    try {
      const result = serviceClearStagedChanges({ userId: getUserId() });
      loadSigners();
      refreshStagedChanges();
      return result;
    } catch {
      return {
        status: 'success',
        message: 'Staged changes cleared.',
      };
    }
  }, [getUserId, loadSigners, refreshStagedChanges]);

  /**
   * Clears the current error state.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clears the submission result state.
   */
  const clearSubmissionResult = useCallback(() => {
    setSubmissionResult(null);
  }, []);

  // Load accounts when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      loadAccounts();
      refreshStagedChanges();
    } else {
      setAccounts([]);
      setSelectedAccount(null);
      selectedAccountRef.current = null;
      setSigners([]);
      setStagedChanges({
        additions: [],
        edits: [],
        removals: [],
        totalChanges: 0,
        hasChanges: false,
      });
      setSubmissionResult(null);
      setError(null);
    }
  }, [isAuthenticated, loadAccounts, refreshStagedChanges]);

  // Reload signers when sort or filter config changes (only if an account is selected)
  useEffect(() => {
    if (selectedAccountRef.current) {
      loadSigners();
    }
  }, [sortConfig, filterConfig, loadSigners]);

  const contextValue = useMemo(() => ({
    accounts,
    selectedAccount,
    signers,
    stagedChanges,
    submissionResult,
    loading,
    error,
    sortConfig,
    filterConfig,
    selectAccount,
    addSigner,
    editSigner,
    removeSigner,
    unlockSigner,
    resendInvitation,
    submitChanges,
    clearChanges,
    clearError,
    clearSubmissionResult,
    setSortConfig,
    setFilterConfig,
    refreshSigners: loadSigners,
  }), [
    accounts,
    selectedAccount,
    signers,
    stagedChanges,
    submissionResult,
    loading,
    error,
    sortConfig,
    filterConfig,
    selectAccount,
    addSigner,
    editSigner,
    removeSigner,
    unlockSigner,
    resendInvitation,
    submitChanges,
    clearChanges,
    clearError,
    clearSubmissionResult,
    loadSigners,
  ]);

  return (
    <AccountContext.Provider value={contextValue}>
      {children}
    </AccountContext.Provider>
  );
}

AccountProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook for consuming the account management context.
 *
 * Must be used within an {@link AccountProvider}. Throws if used outside
 * the provider tree.
 *
 * @returns {{
 *   accounts: Array<Object>,
 *   selectedAccount: Object|null,
 *   signers: Array<Object>,
 *   stagedChanges: {
 *     additions: Array<Object>,
 *     edits: Array<Object>,
 *     removals: Array<Object>,
 *     totalChanges: number,
 *     hasChanges: boolean
 *   },
 *   submissionResult: Object|null,
 *   loading: boolean,
 *   error: string|null,
 *   sortConfig: { sortBy: string, sortDirection: string },
 *   filterConfig: { status: string, query: string },
 *   selectAccount: function(string): void,
 *   addSigner: function(Object): Object,
 *   editSigner: function(string, Object): Object,
 *   removeSigner: function(string, string=): Object,
 *   unlockSigner: function(string): Object,
 *   resendInvitation: function(string): Object,
 *   submitChanges: function(): Object,
 *   clearChanges: function(): Object,
 *   clearError: function(): void,
 *   clearSubmissionResult: function(): void,
 *   setSortConfig: function(Object): void,
 *   setFilterConfig: function(Object): void,
 *   refreshSigners: function(): void
 * }}
 */
export function useAccount() {
  const context = useContext(AccountContext);

  if (context === null) {
    throw new Error(
      'useAccount must be used within an AccountProvider. ' +
      'Wrap your component tree with <AccountProvider>.'
    );
  }

  return context;
}