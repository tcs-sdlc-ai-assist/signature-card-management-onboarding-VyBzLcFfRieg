/**
 * Consolidated authorized signer list component.
 *
 * Displays all signers for the selected account in a table/card layout
 * with columns for name, role/title, status, and contact info. Provides
 * action buttons per signer (Edit, Remove, Unlock, Resend Invitation)
 * and an "Add Signer" button. Supports sorting by name/status/role and
 * filtering by status. Shows total signer count.
 *
 * Uses {@link AccountContext} for data retrieval and mutation operations.
 * Accessible table with proper headers and ARIA attributes.
 *
 * Uses HB CSS framework classes for styling consistency.
 *
 * @module SignerList
 */

import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAccount } from '../../context/AccountContext.jsx';
import { Alert } from '../common/Alert.jsx';
import { Button } from '../common/Button.jsx';
import { LoadingSpinner } from '../common/LoadingSpinner.jsx';
import { Modal } from '../common/Modal.jsx';
import { Pagination } from '../common/Pagination.jsx';
import { ALERT_TYPES, SIGNER_STATUSES, DEFAULT_PAGE_SIZE } from '../../constants/constants.js';

/**
 * Maps signer status identifiers to human-readable labels.
 *
 * @param {string} status - The signer status identifier.
 * @returns {string} A human-readable status label.
 */
function getStatusLabel(status) {
  switch (status) {
    case SIGNER_STATUSES.ACTIVE:
      return 'Active';
    case SIGNER_STATUSES.PENDING:
      return 'Pending';
    case SIGNER_STATUSES.LOCKED:
      return 'Locked';
    default:
      return status || 'Unknown';
  }
}

/**
 * Returns the badge CSS class for a signer status.
 *
 * @param {string} status - The signer status identifier.
 * @returns {string} The HB CSS badge class name.
 */
function getStatusBadgeClass(status) {
  switch (status) {
    case SIGNER_STATUSES.ACTIVE:
      return 'hb-badge hb-badge-success';
    case SIGNER_STATUSES.PENDING:
      return 'hb-badge hb-badge-warning';
    case SIGNER_STATUSES.LOCKED:
      return 'hb-badge hb-badge-error';
    default:
      return 'hb-badge hb-badge-info';
  }
}

/**
 * Person SVG icon for signer rows.
 *
 * @returns {React.ReactElement} An SVG person icon.
 */
function PersonIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ color: 'var(--hb-primary-blue)', flexShrink: 0 }}
    >
      <path
        fillRule="evenodd"
        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Sort indicator SVG icon.
 *
 * @param {Object} props
 * @param {'asc'|'desc'|'none'} props.direction - The current sort direction.
 * @returns {React.ReactElement} An SVG sort indicator icon.
 */
function SortIcon({ direction }) {
  if (direction === 'asc') {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
        style={{ marginLeft: '4px', flexShrink: 0 }}
      >
        <path
          fillRule="evenodd"
          d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  if (direction === 'desc') {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
        style={{ marginLeft: '4px', flexShrink: 0 }}
      >
        <path
          fillRule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ marginLeft: '4px', flexShrink: 0, opacity: 0.3 }}
    >
      <path d="M7 7l3-3 3 3H7zM7 13l3 3 3-3H7z" />
    </svg>
  );
}

SortIcon.propTypes = {
  direction: PropTypes.oneOf(['asc', 'desc', 'none']).isRequired,
};

/**
 * Plus SVG icon for the Add Signer button.
 *
 * @returns {React.ReactElement} An SVG plus icon.
 */
function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0 }}
    >
      <path
        fillRule="evenodd"
        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Sortable column header fields.
 * @type {Array<{ key: string, label: string }>}
 */
const SORTABLE_COLUMNS = [
  { key: 'fullName', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
];

/**
 * Status filter options.
 * @type {Array<{ value: string, label: string }>}
 */
const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: SIGNER_STATUSES.ACTIVE, label: 'Active' },
  { value: SIGNER_STATUSES.PENDING, label: 'Pending' },
  { value: SIGNER_STATUSES.LOCKED, label: 'Locked' },
];

/**
 * Consolidated authorized signer list component.
 *
 * Displays all signers for the selected account in a table layout with
 * action buttons per signer. Supports sorting, filtering, and pagination.
 *
 * @param {Object} [props]
 * @param {function} [props.onAddSigner] - Callback invoked when the
 *   "Add Signer" button is clicked.
 * @param {function} [props.onEditSigner] - Callback invoked when the
 *   "Edit" button is clicked. Receives the signer object.
 * @param {number} [props.pageSize=10] - Number of signers per page.
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the wrapper element.
 * @returns {React.ReactElement} The rendered signer list.
 */
export function SignerList({
  onAddSigner = null,
  onEditSigner = null,
  pageSize = DEFAULT_PAGE_SIZE,
  className = '',
}) {
  const {
    selectedAccount,
    signers,
    loading,
    error,
    sortConfig,
    filterConfig,
    setSortConfig,
    setFilterConfig,
    removeSigner,
    unlockSigner,
    resendInvitation,
    clearError,
  } = useAccount();

  const [currentPage, setCurrentPage] = useState(1);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionMessageType, setActionMessageType] = useState(ALERT_TYPES.SUCCESS);

  // Remove confirmation modal state
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [signerToRemove, setSignerToRemove] = useState(null);
  const [removeReason, setRemoveReason] = useState('');
  const [isPerformingAction, setIsPerformingAction] = useState(false);

  const safePageSize = Math.max(1, Math.floor(pageSize));
  const totalItems = Array.isArray(signers) ? signers.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages));

  /**
   * Computes the paginated slice of signers for the current page.
   */
  const paginatedSigners = useMemo(() => {
    if (!Array.isArray(signers) || signers.length === 0) {
      return [];
    }

    const startIndex = (safeCurrentPage - 1) * safePageSize;
    const endIndex = Math.min(startIndex + safePageSize, totalItems);
    return signers.slice(startIndex, endIndex);
  }, [signers, safeCurrentPage, safePageSize, totalItems]);

  /**
   * Handles column header click for sorting.
   *
   * @param {string} columnKey - The field key to sort by.
   */
  const handleSort = useCallback((columnKey) => {
    setSortConfig((prev) => {
      if (prev.sortBy === columnKey) {
        return {
          sortBy: columnKey,
          sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc',
        };
      }
      return {
        sortBy: columnKey,
        sortDirection: 'asc',
      };
    });
    setCurrentPage(1);
  }, [setSortConfig]);

  /**
   * Handles status filter change.
   *
   * @param {React.ChangeEvent<HTMLSelectElement>} event - The change event.
   */
  const handleFilterChange = useCallback((event) => {
    const newStatus = event.target.value;
    setFilterConfig((prev) => ({
      ...prev,
      status: newStatus,
    }));
    setCurrentPage(1);
  }, [setFilterConfig]);

  /**
   * Handles search query change.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - The change event.
   */
  const handleSearchChange = useCallback((event) => {
    const newQuery = event.target.value;
    setFilterConfig((prev) => ({
      ...prev,
      query: newQuery,
    }));
    setCurrentPage(1);
  }, [setFilterConfig]);

  /**
   * Handles page change from the Pagination component.
   *
   * @param {number} newPage - The new page number (1-based).
   */
  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
  }, []);

  /**
   * Clears the action message.
   */
  const clearActionMessage = useCallback(() => {
    setActionMessage(null);
  }, []);

  /**
   * Handles the "Add Signer" button click.
   */
  const handleAddSigner = useCallback(() => {
    if (typeof onAddSigner === 'function') {
      try {
        onAddSigner();
      } catch {
        // Callback errors must not break the UI flow.
      }
    }
  }, [onAddSigner]);

  /**
   * Handles the "Edit" button click for a signer.
   *
   * @param {Object} signer - The signer object to edit.
   */
  const handleEditSigner = useCallback((signer) => {
    if (typeof onEditSigner === 'function') {
      try {
        onEditSigner(signer);
      } catch {
        // Callback errors must not break the UI flow.
      }
    }
  }, [onEditSigner]);

  /**
   * Opens the remove confirmation modal for a signer.
   *
   * @param {Object} signer - The signer object to remove.
   */
  const handleRemoveClick = useCallback((signer) => {
    setSignerToRemove(signer);
    setRemoveReason('');
    setRemoveModalOpen(true);
  }, []);

  /**
   * Closes the remove confirmation modal.
   */
  const handleRemoveCancel = useCallback(() => {
    setRemoveModalOpen(false);
    setSignerToRemove(null);
    setRemoveReason('');
  }, []);

  /**
   * Confirms and executes the signer removal.
   */
  const handleRemoveConfirm = useCallback(() => {
    if (!signerToRemove || !signerToRemove.id) {
      return;
    }

    setIsPerformingAction(true);
    clearActionMessage();

    try {
      const result = removeSigner(signerToRemove.id, removeReason);

      if (result.status === 'success') {
        setActionMessage(result.message || `Signer "${signerToRemove.fullName || 'Unknown'}" has been staged for removal.`);
        setActionMessageType(ALERT_TYPES.SUCCESS);
      } else {
        setActionMessage(result.message || 'Failed to remove signer.');
        setActionMessageType(ALERT_TYPES.CRITICAL);
      }
    } catch {
      setActionMessage('An unexpected error occurred while removing the signer.');
      setActionMessageType(ALERT_TYPES.CRITICAL);
    } finally {
      setIsPerformingAction(false);
      setRemoveModalOpen(false);
      setSignerToRemove(null);
      setRemoveReason('');
    }
  }, [signerToRemove, removeReason, removeSigner, clearActionMessage]);

  /**
   * Handles the "Unlock" button click for a locked signer.
   *
   * @param {Object} signer - The signer object to unlock.
   */
  const handleUnlockSigner = useCallback((signer) => {
    if (!signer || !signer.id) {
      return;
    }

    setIsPerformingAction(true);
    clearActionMessage();

    try {
      const result = unlockSigner(signer.id);

      if (result.status === 'success') {
        setActionMessage(result.message || `Signer "${signer.fullName || 'Unknown'}" has been unlocked.`);
        setActionMessageType(ALERT_TYPES.SUCCESS);
      } else {
        setActionMessage(result.message || 'Failed to unlock signer.');
        setActionMessageType(ALERT_TYPES.CRITICAL);
      }
    } catch {
      setActionMessage('An unexpected error occurred while unlocking the signer.');
      setActionMessageType(ALERT_TYPES.CRITICAL);
    } finally {
      setIsPerformingAction(false);
    }
  }, [unlockSigner, clearActionMessage]);

  /**
   * Handles the "Resend Invitation" button click for a pending signer.
   *
   * @param {Object} signer - The signer object.
   */
  const handleResendInvitation = useCallback((signer) => {
    if (!signer || !signer.id) {
      return;
    }

    setIsPerformingAction(true);
    clearActionMessage();

    try {
      const result = resendInvitation(signer.id);

      if (result.status === 'success') {
        setActionMessage(result.message || `Invitation resent to "${signer.fullName || 'Unknown'}".`);
        setActionMessageType(ALERT_TYPES.SUCCESS);
      } else {
        setActionMessage(result.message || 'Failed to resend invitation.');
        setActionMessageType(ALERT_TYPES.CRITICAL);
      }
    } catch {
      setActionMessage('An unexpected error occurred while resending the invitation.');
      setActionMessageType(ALERT_TYPES.CRITICAL);
    } finally {
      setIsPerformingAction(false);
    }
  }, [resendInvitation, clearActionMessage]);

  /**
   * Returns the sort direction indicator for a column.
   *
   * @param {string} columnKey - The column field key.
   * @returns {'asc'|'desc'|'none'}
   */
  const getSortDirection = useCallback((columnKey) => {
    if (sortConfig.sortBy === columnKey) {
      return sortConfig.sortDirection;
    }
    return 'none';
  }, [sortConfig]);

  const wrapperClassName = [className].filter(Boolean).join(' ');

  // No account selected state
  if (!selectedAccount) {
    return (
      <div className={wrapperClassName}>
        <Alert
          type={ALERT_TYPES.INFO}
          message="Please select an account to view its authorized signers."
        />
      </div>
    );
  }

  // Loading state
  if (loading && totalItems === 0) {
    return (
      <div className={wrapperClassName}>
        <LoadingSpinner size="medium" label="Loading signers…" />
      </div>
    );
  }

  // Error state with no data
  if (error && totalItems === 0) {
    return (
      <div className={wrapperClassName}>
        <Alert
          type={ALERT_TYPES.CRITICAL}
          message={error}
          dismissible
          onDismiss={clearError}
        />
      </div>
    );
  }

  return (
    <div
      className={wrapperClassName}
      style={{ width: '100%' }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--hb-space-md)',
          marginBottom: 'var(--hb-space-md)',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 'var(--hb-font-size-h3)',
              fontWeight: 500,
              marginBottom: 'var(--hb-space-xs)',
              color: 'var(--hb-primary-black)',
            }}
          >
            Authorized Signers
          </h2>
          <p
            style={{
              fontSize: 'var(--hb-font-size-sm)',
              color: 'var(--hb-secondary-gray)',
              margin: 0,
            }}
          >
            {totalItems} signer{totalItems !== 1 ? 's' : ''} for{' '}
            <strong>{selectedAccount.accountName || 'Selected Account'}</strong>
            {selectedAccount.accountNumber ? ` (${selectedAccount.accountNumber})` : ''}
          </p>
        </div>

        {typeof onAddSigner === 'function' && (
          <Button
            variant="primary"
            label="Add Signer"
            onClick={handleAddSigner}
            disabled={isPerformingAction}
            ariaLabel="Add a new authorized signer"
          />
        )}
      </div>

      {/* Action message */}
      {actionMessage && (
        <Alert
          type={actionMessageType}
          message={actionMessage}
          dismissible
          onDismiss={clearActionMessage}
        />
      )}

      {/* Error message from context */}
      {error && totalItems > 0 && (
        <Alert
          type={ALERT_TYPES.WARNING}
          message={error}
          dismissible
          onDismiss={clearError}
        />
      )}

      {/* Filters and search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--hb-space-md)',
          flexWrap: 'wrap',
          marginBottom: 'var(--hb-space-lg)',
        }}
      >
        {/* Search input */}
        <div style={{ flex: '1 1 200px', minWidth: '200px', maxWidth: '320px' }}>
          <label htmlFor="signer-search" className="sr-only">
            Search signers
          </label>
          <input
            id="signer-search"
            type="text"
            placeholder="Search by name, email, or SSN…"
            value={filterConfig.query || ''}
            onChange={handleSearchChange}
            disabled={isPerformingAction}
            className="hb-form-control"
            style={{ padding: '8px 12px' }}
            aria-label="Search signers by name, email, or last four SSN"
          />
        </div>

        {/* Status filter */}
        <div style={{ flex: '0 0 auto' }}>
          <label htmlFor="signer-status-filter" className="sr-only">
            Filter by status
          </label>
          <select
            id="signer-status-filter"
            value={filterConfig.status || ''}
            onChange={handleFilterChange}
            disabled={isPerformingAction}
            className="hb-form-control"
            style={{
              padding: '8px 12px',
              minWidth: '150px',
              appearance: 'auto',
            }}
            aria-label="Filter signers by status"
          >
            {STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Screen reader status */}
      <div
        aria-live="polite"
        aria-atomic="true"
        role="status"
        className="sr-only"
      >
        {loading && 'Loading signers, please wait.'}
        {!loading && totalItems > 0 && `${totalItems} signer${totalItems !== 1 ? 's' : ''} found.`}
        {!loading && totalItems === 0 && 'No signers found matching your criteria.'}
      </div>

      {/* Empty state */}
      {!loading && totalItems === 0 && (
        <Alert
          type={ALERT_TYPES.INFO}
          message="No signers found matching your criteria. Try adjusting your search or filter."
        />
      )}

      {/* Signer table */}
      {totalItems > 0 && (
        <div
          style={{
            overflowX: 'auto',
            borderRadius: 'var(--hb-radius-md)',
            boxShadow: 'var(--hb-shadow-sm)',
            backgroundColor: 'var(--hb-primary-white)',
          }}
        >
          <table
            role="table"
            aria-label="Authorized signers list"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 'var(--hb-font-size-sm)',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '2px solid var(--hb-secondary-gray-light)',
                  backgroundColor: 'var(--hb-secondary-gray-lighter)',
                }}
              >
                {SORTABLE_COLUMNS.map((column) => {
                  const direction = getSortDirection(column.key);
                  const ariaSort = direction === 'none'
                    ? 'none'
                    : direction === 'asc'
                      ? 'ascending'
                      : 'descending';

                  return (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={ariaSort}
                      style={{
                        padding: 'var(--hb-space-md)',
                        textAlign: 'left',
                        fontWeight: 500,
                        color: 'var(--hb-primary-black)',
                        cursor: 'pointer',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                      }}
                      onClick={() => handleSort(column.key)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleSort(column.key);
                        }
                      }}
                      tabIndex={0}
                      role="columnheader"
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        {column.label}
                        <SortIcon direction={direction} />
                      </span>
                    </th>
                  );
                })}
                <th
                  scope="col"
                  style={{
                    padding: 'var(--hb-space-md)',
                    textAlign: 'left',
                    fontWeight: 500,
                    color: 'var(--hb-primary-black)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Contact
                </th>
                <th
                  scope="col"
                  style={{
                    padding: 'var(--hb-space-md)',
                    textAlign: 'right',
                    fontWeight: 500,
                    color: 'var(--hb-primary-black)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedSigners.map((signer) => {
                const statusLabel = getStatusLabel(signer.status);
                const badgeClass = getStatusBadgeClass(signer.status);
                const isLocked = signer.status === SIGNER_STATUSES.LOCKED;
                const isPending = signer.status === SIGNER_STATUSES.PENDING;

                return (
                  <tr
                    key={signer.id}
                    style={{
                      borderBottom: '1px solid var(--hb-secondary-gray-light)',
                      transition: 'background-color var(--hb-transition-fast)',
                    }}
                  >
                    {/* Name */}
                    <td
                      style={{
                        padding: 'var(--hb-space-md)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--hb-space-sm)',
                        }}
                      >
                        <PersonIcon />
                        <span
                          style={{
                            fontWeight: 500,
                            color: 'var(--hb-primary-black)',
                          }}
                        >
                          {signer.fullName || `${signer.firstName || ''} ${signer.lastName || ''}`.trim() || 'Unknown'}
                        </span>
                      </div>
                    </td>

                    {/* Role */}
                    <td
                      style={{
                        padding: 'var(--hb-space-md)',
                        color: 'var(--hb-secondary-gray)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {signer.role === 'authorized_signer'
                        ? 'Authorized Signer'
                        : signer.role || 'N/A'}
                    </td>

                    {/* Status */}
                    <td
                      style={{
                        padding: 'var(--hb-space-md)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span className={badgeClass}>
                        {statusLabel}
                      </span>
                    </td>

                    {/* Contact */}
                    <td
                      style={{
                        padding: 'var(--hb-space-md)',
                        color: 'var(--hb-secondary-gray)',
                        maxWidth: '220px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div>
                        {signer.email && (
                          <span
                            style={{
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={signer.email}
                          >
                            {signer.email}
                          </span>
                        )}
                        {signer.phone && (
                          <span
                            style={{
                              display: 'block',
                              fontSize: 'var(--hb-font-size-xs)',
                              color: 'var(--hb-secondary-gray)',
                            }}
                          >
                            {signer.phone}
                          </span>
                        )}
                        {!signer.email && !signer.phone && (
                          <span style={{ fontStyle: 'italic' }}>No contact info</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td
                      style={{
                        padding: 'var(--hb-space-md)',
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--hb-space-xs)',
                          flexWrap: 'wrap',
                          justifyContent: 'flex-end',
                        }}
                      >
                        {typeof onEditSigner === 'function' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            label="Edit"
                            onClick={() => handleEditSigner(signer)}
                            disabled={isPerformingAction}
                            ariaLabel={`Edit signer ${signer.fullName || 'Unknown'}`}
                          />
                        )}

                        {isLocked && (
                          <Button
                            variant="secondary"
                            size="sm"
                            label="Unlock"
                            onClick={() => handleUnlockSigner(signer)}
                            disabled={isPerformingAction}
                            ariaLabel={`Unlock signer ${signer.fullName || 'Unknown'}`}
                          />
                        )}

                        {isPending && (
                          <Button
                            variant="secondary"
                            size="sm"
                            label="Resend"
                            onClick={() => handleResendInvitation(signer)}
                            disabled={isPerformingAction}
                            ariaLabel={`Resend invitation to ${signer.fullName || 'Unknown'}`}
                          />
                        )}

                        <Button
                          variant="secondary"
                          size="sm"
                          label="Remove"
                          onClick={() => handleRemoveClick(signer)}
                          disabled={isPerformingAction}
                          ariaLabel={`Remove signer ${signer.fullName || 'Unknown'}`}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Loading overlay for subsequent loads */}
      {loading && totalItems > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: 'var(--hb-space-md)',
          }}
        >
          <LoadingSpinner size="small" label="Updating signers…" />
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

      {/* Remove confirmation modal */}
      <Modal
        isOpen={removeModalOpen}
        onClose={handleRemoveCancel}
        title="Remove Signer"
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={handleRemoveConfirm}
        onCancel={handleRemoveCancel}
        confirmDisabled={isPerformingAction}
        closeOnOverlayClick={!isPerformingAction}
        closeOnEscape={!isPerformingAction}
        ariaLabel="Confirm signer removal"
      >
        {signerToRemove && (
          <div>
            <p
              style={{
                fontSize: 'var(--hb-font-size-base)',
                color: 'var(--hb-primary-black)',
                marginBottom: 'var(--hb-space-md)',
              }}
            >
              Are you sure you want to remove{' '}
              <strong>{signerToRemove.fullName || 'this signer'}</strong> from{' '}
              <strong>{selectedAccount.accountName || 'this account'}</strong>?
            </p>

            <p
              style={{
                fontSize: 'var(--hb-font-size-sm)',
                color: 'var(--hb-secondary-gray)',
                marginBottom: 'var(--hb-space-md)',
              }}
            >
              This action will be staged for review. The signer will not be
              removed until all changes are submitted.
            </p>

            <div style={{ marginBottom: 'var(--hb-space-sm)' }}>
              <label
                htmlFor="remove-reason"
                style={{
                  display: 'block',
                  fontSize: 'var(--hb-font-size-sm)',
                  fontWeight: 500,
                  color: 'var(--hb-primary-black)',
                  marginBottom: 'var(--hb-space-xs)',
                }}
              >
                Reason for removal (optional)
              </label>
              <input
                id="remove-reason"
                type="text"
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value)}
                disabled={isPerformingAction}
                className="hb-form-control"
                style={{ padding: '8px 12px' }}
                placeholder="Enter reason…"
                autoComplete="off"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

SignerList.propTypes = {
  onAddSigner: PropTypes.func,
  onEditSigner: PropTypes.func,
  pageSize: PropTypes.number,
  className: PropTypes.string,
};

export default SignerList;