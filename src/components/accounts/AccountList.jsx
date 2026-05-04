/**
 * Account selection list component.
 *
 * Renders a list of business banking accounts with masked account numbers,
 * account type badges, and signer counts. Each account is a selectable
 * card/row. Auto-selects when only one account is available. Integrates
 * the {@link Pagination} component for large lists and uses
 * {@link AccountContext} for data retrieval and selection.
 *
 * Accessible with proper list roles, keyboard navigation (Enter/Space
 * to select, arrow keys to navigate), and ARIA attributes.
 *
 * Uses HB CSS framework classes for styling consistency.
 *
 * @module AccountList
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAccount } from '../../context/AccountContext.jsx';
import { Pagination } from '../common/Pagination.jsx';
import { Alert } from '../common/Alert.jsx';
import { LoadingSpinner } from '../common/LoadingSpinner.jsx';
import { ALERT_TYPES, DEFAULT_PAGE_SIZE } from '../../constants/constants.js';

/**
 * Maps account type identifiers to human-readable labels.
 *
 * @param {string} accountType - The account type identifier.
 * @returns {string} A human-readable account type label.
 */
function getAccountTypeLabel(accountType) {
  switch (accountType) {
    case 'business_checking':
      return 'Business Checking';
    case 'business_savings':
      return 'Business Savings';
    case 'business_money_market':
      return 'Business Money Market';
    default:
      return accountType || 'Account';
  }
}

/**
 * Returns the badge CSS class for an account type.
 *
 * @param {string} accountType - The account type identifier.
 * @returns {string} The HB CSS badge class name.
 */
function getAccountTypeBadgeClass(accountType) {
  switch (accountType) {
    case 'business_checking':
      return 'hb-badge hb-badge-info';
    case 'business_savings':
      return 'hb-badge hb-badge-success';
    default:
      return 'hb-badge hb-badge-info';
  }
}

/**
 * Bank building SVG icon for account cards.
 *
 * @returns {React.ReactElement} An SVG bank icon.
 */
function BankIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ color: 'var(--hb-primary-blue)', flexShrink: 0 }}
    >
      <path
        fillRule="evenodd"
        d="M10.496 2.132a1 1 0 00-.992 0l-7 4A1 1 0 003 8v1a1 1 0 001 1h1v5H4a1 1 0 100 2h12a1 1 0 100-2h-1v-5h1a1 1 0 001-1V8a1 1 0 00.496-1.868l-7-4zM14 10H6v5h2v-3a1 1 0 012 0v3h2v-3a1 1 0 012 0v3h2v-5h-2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * People SVG icon for signer count display.
 *
 * @returns {React.ReactElement} An SVG people icon.
 */
function PeopleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ color: 'var(--hb-secondary-gray)', flexShrink: 0 }}
    >
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
  );
}

/**
 * Checkmark SVG icon for the selected account indicator.
 *
 * @returns {React.ReactElement} An SVG checkmark icon.
 */
function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ color: 'var(--hb-secondary-green)', flexShrink: 0 }}
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Account selection list component.
 *
 * Renders a list of business banking accounts as selectable cards.
 * Each card displays the account name, masked account number, account
 * type badge, and signer count. Supports pagination for large lists
 * and auto-selects when only one account is available.
 *
 * Integrates with {@link AccountContext} for account data and selection.
 *
 * @param {Object} [props]
 * @param {function} [props.onAccountSelect] - Optional callback invoked
 *   when an account is selected. Receives the account object.
 * @param {number} [props.pageSize=10] - Number of accounts per page.
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the wrapper element.
 * @returns {React.ReactElement} The rendered account list.
 */
export function AccountList({
  onAccountSelect = null,
  pageSize = DEFAULT_PAGE_SIZE,
  className = '',
}) {
  const {
    accounts,
    selectedAccount,
    selectAccount,
    loading,
    error,
  } = useAccount();

  const [currentPage, setCurrentPage] = useState(1);
  const itemRefs = useRef([]);
  const autoSelectedRef = useRef(false);

  const safePageSize = Math.max(1, Math.floor(pageSize));
  const totalItems = Array.isArray(accounts) ? accounts.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages));

  /**
   * Computes the paginated slice of accounts for the current page.
   */
  const paginatedAccounts = useMemo(() => {
    if (!Array.isArray(accounts) || accounts.length === 0) {
      return [];
    }

    const startIndex = (safeCurrentPage - 1) * safePageSize;
    const endIndex = Math.min(startIndex + safePageSize, totalItems);
    return accounts.slice(startIndex, endIndex);
  }, [accounts, safeCurrentPage, safePageSize, totalItems]);

  /**
   * Auto-selects the account when only one is available.
   */
  useEffect(() => {
    if (
      !autoSelectedRef.current &&
      Array.isArray(accounts) &&
      accounts.length === 1 &&
      !selectedAccount &&
      !loading
    ) {
      autoSelectedRef.current = true;
      const singleAccount = accounts[0];

      if (singleAccount && singleAccount.id) {
        selectAccount(singleAccount.id);

        if (typeof onAccountSelect === 'function') {
          try {
            onAccountSelect(singleAccount);
          } catch {
            // Callback errors must not break the auto-select flow.
          }
        }
      }
    }
  }, [accounts, selectedAccount, loading, selectAccount, onAccountSelect]);

  /**
   * Reset auto-select ref when accounts change significantly.
   */
  useEffect(() => {
    if (Array.isArray(accounts) && accounts.length !== 1) {
      autoSelectedRef.current = false;
    }
  }, [accounts]);

  /**
   * Handles account selection when a card is clicked.
   *
   * @param {Object} account - The account object to select.
   */
  const handleSelectAccount = useCallback((account) => {
    if (!account || !account.id) {
      return;
    }

    selectAccount(account.id);

    if (typeof onAccountSelect === 'function') {
      try {
        onAccountSelect(account);
      } catch {
        // Callback errors must not break the selection flow.
      }
    }
  }, [selectAccount, onAccountSelect]);

  /**
   * Handles keyboard navigation within the account list.
   *
   * @param {React.KeyboardEvent} event - The keyboard event.
   * @param {number} index - The index of the focused account card.
   * @param {Object} account - The account object.
   */
  const handleKeyDown = useCallback((event, index, account) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleSelectAccount(account);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (index < paginatedAccounts.length - 1 && itemRefs.current[index + 1]) {
          itemRefs.current[index + 1].focus();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (index > 0 && itemRefs.current[index - 1]) {
          itemRefs.current[index - 1].focus();
        }
        break;
      case 'Home':
        event.preventDefault();
        if (itemRefs.current[0]) {
          itemRefs.current[0].focus();
        }
        break;
      case 'End':
        event.preventDefault();
        if (itemRefs.current[paginatedAccounts.length - 1]) {
          itemRefs.current[paginatedAccounts.length - 1].focus();
        }
        break;
      default:
        break;
    }
  }, [handleSelectAccount, paginatedAccounts]);

  /**
   * Handles page change from the Pagination component.
   *
   * @param {number} newPage - The new page number (1-based).
   */
  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
  }, []);

  /**
   * Stores a ref to an account card element.
   *
   * @param {number} index - The card index.
   * @param {HTMLElement|null} el - The DOM element.
   */
  const setItemRef = useCallback((index, el) => {
    itemRefs.current[index] = el;
  }, []);

  const wrapperClassName = [className].filter(Boolean).join(' ');

  // Loading state
  if (loading && totalItems === 0) {
    return (
      <div className={wrapperClassName}>
        <LoadingSpinner size="medium" label="Loading accounts…" />
      </div>
    );
  }

  // Error state
  if (error && totalItems === 0) {
    return (
      <div className={wrapperClassName}>
        <Alert
          type={ALERT_TYPES.CRITICAL}
          message={error}
        />
      </div>
    );
  }

  // Empty state
  if (totalItems === 0) {
    return (
      <div className={wrapperClassName}>
        <Alert
          type={ALERT_TYPES.INFO}
          message="No accounts found. Please contact your administrator if you believe this is an error."
        />
      </div>
    );
  }

  return (
    <div
      className={wrapperClassName}
      style={{ width: '100%' }}
    >
      <h2
        style={{
          fontSize: 'var(--hb-font-size-h3)',
          fontWeight: 500,
          marginBottom: 'var(--hb-space-sm)',
          color: 'var(--hb-primary-black)',
        }}
      >
        Select an Account
      </h2>

      <p
        style={{
          fontSize: 'var(--hb-font-size-sm)',
          color: 'var(--hb-secondary-gray)',
          marginBottom: 'var(--hb-space-lg)',
        }}
      >
        Choose the business banking account you want to manage signers for.
      </p>

      {error && (
        <Alert
          type={ALERT_TYPES.WARNING}
          message={error}
        />
      )}

      {/* Screen reader status */}
      <div
        aria-live="polite"
        aria-atomic="true"
        role="status"
        className="sr-only"
      >
        {loading && 'Loading accounts, please wait.'}
        {!loading && totalItems > 0 && `${totalItems} account${totalItems !== 1 ? 's' : ''} available.`}
        {selectedAccount && `Selected account: ${selectedAccount.accountName || selectedAccount.accountNumber}.`}
      </div>

      {/* Account list */}
      <div
        role="listbox"
        aria-label="Business banking accounts"
        aria-activedescendant={
          selectedAccount
            ? `account-item-${selectedAccount.id}`
            : undefined
        }
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--hb-space-sm)',
        }}
      >
        {paginatedAccounts.map((account, index) => {
          const isSelected = selectedAccount && selectedAccount.id === account.id;
          const accountTypeLabel = getAccountTypeLabel(account.accountType);
          const badgeClass = getAccountTypeBadgeClass(account.accountType);
          const signerCount = typeof account.signerCount === 'number'
            ? account.signerCount
            : 0;

          return (
            <div
              key={account.id}
              id={`account-item-${account.id}`}
              ref={(el) => setItemRef(index, el)}
              role="option"
              aria-selected={isSelected ? 'true' : 'false'}
              tabIndex={index === 0 ? 0 : -1}
              onClick={() => handleSelectAccount(account)}
              onKeyDown={(event) => handleKeyDown(event, index, account)}
              className="hb-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--hb-space-md)',
                padding: 'var(--hb-space-md) var(--hb-space-lg)',
                cursor: 'pointer',
                border: isSelected
                  ? '2px solid var(--hb-primary-blue)'
                  : '2px solid transparent',
                backgroundColor: isSelected
                  ? 'var(--hb-primary-blue-light)'
                  : 'var(--hb-primary-white)',
                borderRadius: 'var(--hb-radius-md)',
                boxShadow: 'var(--hb-shadow-sm)',
                transition: 'border-color var(--hb-transition-fast), background-color var(--hb-transition-fast), box-shadow var(--hb-transition-fast)',
                outline: 'none',
              }}
            >
              {/* Bank icon */}
              <BankIcon />

              {/* Account details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--hb-space-sm)',
                    flexWrap: 'wrap',
                    marginBottom: 'var(--hb-space-xs)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--hb-font-size-base)',
                      fontWeight: 500,
                      color: 'var(--hb-primary-black)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {account.accountName || 'Unnamed Account'}
                  </span>
                  <span className={badgeClass}>
                    {accountTypeLabel}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--hb-space-lg)',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--hb-font-size-sm)',
                      color: 'var(--hb-secondary-gray)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {account.accountNumber || '****'}
                  </span>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--hb-space-xs)',
                      fontSize: 'var(--hb-font-size-sm)',
                      color: 'var(--hb-secondary-gray)',
                    }}
                  >
                    <PeopleIcon />
                    {signerCount} signer{signerCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <CheckIcon />
              )}
            </div>
          );
        })}
      </div>

      {/* Loading overlay for subsequent loads */}
      {loading && totalItems > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: 'var(--hb-space-md)',
          }}
        >
          <LoadingSpinner size="small" label="Updating accounts…" />
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        pageSize={safePageSize}
        totalItems={totalItems}
        maxVisiblePages={5}
      />
    </div>
  );
}

AccountList.propTypes = {
  onAccountSelect: PropTypes.func,
  pageSize: PropTypes.number,
  className: PropTypes.string,
};

export default AccountList;