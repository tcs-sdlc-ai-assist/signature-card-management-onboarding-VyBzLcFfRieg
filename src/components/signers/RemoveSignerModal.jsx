/**
 * Signer removal confirmation modal component.
 *
 * Displays a confirmation dialog when a user requests to remove an
 * authorized signer from an account. Shows the signer's name and role,
 * warns about the action consequences, provides an optional reason
 * input, and displays an error if attempting to remove the last signer.
 *
 * Integrates with {@link AccountContext} for the removal action and
 * uses the {@link Modal} component for the dialog shell. Accessible
 * with proper focus management and ARIA attributes.
 *
 * Uses HB CSS framework classes for styling consistency.
 *
 * @module RemoveSignerModal
 */

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAccount } from '../../context/AccountContext.jsx';
import { Modal } from '../common/Modal.jsx';
import { Alert } from '../common/Alert.jsx';
import { LoadingSpinner } from '../common/LoadingSpinner.jsx';
import { ALERT_TYPES, SIGNER_STATUSES } from '../../constants/constants.js';

/**
 * Warning icon SVG for the removal confirmation.
 *
 * @returns {React.ReactElement} An SVG warning icon.
 */
function WarningIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ color: 'var(--hb-secondary-red)', flexShrink: 0 }}
    >
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Person icon SVG for the signer display.
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
 * Maps signer role identifiers to human-readable labels.
 *
 * @param {string} role - The signer role identifier.
 * @returns {string} A human-readable role label.
 */
function getRoleLabel(role) {
  if (role === 'authorized_signer') {
    return 'Authorized Signer';
  }
  return role || 'Unknown Role';
}

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
 * Signer removal confirmation modal component.
 *
 * Renders a modal dialog that confirms the removal of an authorized
 * signer from the selected account. Displays the signer's name, role,
 * and status, warns about the consequences of removal, and provides
 * an optional reason input field.
 *
 * Integrates with {@link AccountContext} for the `removeSigner` action.
 * Displays an error alert if the removal fails (e.g. attempting to
 * remove the last signer on an account).
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is currently visible.
 * @param {function} props.onClose - Callback invoked when the modal should
 *   close (cancel, overlay click, escape key, or successful removal).
 * @param {Object|null} [props.signer=null] - The signer object to remove.
 *   When `null`, the modal body shows a generic message.
 * @param {function} [props.onRemoveSuccess] - Optional callback invoked
 *   when the signer removal succeeds. Receives the result object.
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the modal dialog panel.
 * @returns {React.ReactElement|null} The rendered modal, or `null` when closed.
 */
export function RemoveSignerModal({
  isOpen = false,
  onClose,
  signer = null,
  onRemoveSuccess = null,
  className = '',
}) {
  const { removeSigner, selectedAccount } = useAccount();

  const [reason, setReason] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState(null);
  const [removeSuccess, setRemoveSuccess] = useState(null);

  /**
   * Resets the modal's internal state. Called when the modal opens
   * or when the user cancels.
   */
  const resetState = useCallback(() => {
    setReason('');
    setIsRemoving(false);
    setRemoveError(null);
    setRemoveSuccess(null);
  }, []);

  /**
   * Handles the cancel/close action — resets state and invokes onClose.
   */
  const handleClose = useCallback(() => {
    resetState();

    if (typeof onClose === 'function') {
      onClose();
    }
  }, [onClose, resetState]);

  /**
   * Handles the confirm removal action — calls removeSigner via
   * AccountContext and processes the result.
   */
  const handleConfirmRemove = useCallback(() => {
    if (!signer || !signer.id) {
      setRemoveError('No signer selected for removal.');
      return;
    }

    setIsRemoving(true);
    setRemoveError(null);
    setRemoveSuccess(null);

    try {
      const result = removeSigner(signer.id, reason.trim());

      if (result.status === 'success') {
        setRemoveSuccess(
          result.message ||
          `Signer "${signer.fullName || 'Unknown'}" has been staged for removal.`
        );
        setRemoveError(null);

        if (typeof onRemoveSuccess === 'function') {
          try {
            onRemoveSuccess(result);
          } catch {
            // Callback errors must not break the removal flow.
          }
        }

        // Auto-close after a brief delay to show success message
        setTimeout(() => {
          resetState();

          if (typeof onClose === 'function') {
            onClose();
          }
        }, 1500);
      } else {
        setRemoveError(
          result.message || 'Failed to remove signer. Please try again.'
        );
      }
    } catch {
      setRemoveError('An unexpected error occurred while removing the signer.');
    } finally {
      setIsRemoving(false);
    }
  }, [signer, reason, removeSigner, onRemoveSuccess, onClose, resetState]);

  /**
   * Handles reason input change.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - The change event.
   */
  const handleReasonChange = useCallback((event) => {
    setReason(event.target.value);
  }, []);

  const signerName = signer
    ? signer.fullName || `${signer.firstName || ''} ${signer.lastName || ''}`.trim() || 'Unknown'
    : 'Unknown';

  const signerRole = signer ? getRoleLabel(signer.role) : 'Unknown Role';
  const signerStatus = signer ? getStatusLabel(signer.status) : 'Unknown';
  const statusBadgeClass = signer ? getStatusBadgeClass(signer.status) : 'hb-badge hb-badge-info';

  const accountName = selectedAccount
    ? selectedAccount.accountName || 'Selected Account'
    : 'Selected Account';

  const accountNumber = selectedAccount
    ? selectedAccount.accountNumber || ''
    : '';

  const isConfirmDisabled = isRemoving || !!removeSuccess;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Remove Signer"
      showFooter={false}
      closeOnOverlayClick={!isRemoving}
      closeOnEscape={!isRemoving}
      ariaLabel="Confirm signer removal"
      className={className}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--hb-space-md)',
        }}
      >
        {/* Screen reader status */}
        <div
          aria-live="polite"
          aria-atomic="true"
          role="status"
          className="sr-only"
        >
          {isRemoving && 'Removing signer, please wait.'}
          {removeSuccess && removeSuccess}
          {removeError && `Error: ${removeError}`}
        </div>

        {/* Success message */}
        {removeSuccess && (
          <Alert
            type={ALERT_TYPES.SUCCESS}
            message={removeSuccess}
          />
        )}

        {/* Error message */}
        {removeError && (
          <Alert
            type={ALERT_TYPES.CRITICAL}
            message={removeError}
          />
        )}

        {/* Loading state */}
        {isRemoving && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: 'var(--hb-space-sm)',
            }}
          >
            <LoadingSpinner size="small" label="Removing signer…" />
          </div>
        )}

        {/* Signer info and warning — hidden after success */}
        {!removeSuccess && signer && (
          <>
            {/* Warning icon and message */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 'var(--hb-space-sm)',
              }}
            >
              <WarningIcon />
              <p
                style={{
                  fontSize: 'var(--hb-font-size-base)',
                  fontWeight: 500,
                  color: 'var(--hb-primary-black)',
                  margin: 0,
                }}
              >
                Are you sure you want to remove this signer?
              </p>
            </div>

            {/* Signer details card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--hb-space-md)',
                padding: 'var(--hb-space-md)',
                backgroundColor: 'var(--hb-secondary-gray-lighter)',
                borderRadius: 'var(--hb-radius-md)',
                border: '1px solid var(--hb-secondary-gray-light)',
              }}
            >
              <PersonIcon />
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
                    }}
                  >
                    {signerName}
                  </span>
                  <span className={statusBadgeClass}>
                    {signerStatus}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 'var(--hb-font-size-sm)',
                    color: 'var(--hb-secondary-gray)',
                  }}
                >
                  {signerRole}
                </span>
                {signer.email && (
                  <span
                    style={{
                      display: 'block',
                      fontSize: 'var(--hb-font-size-sm)',
                      color: 'var(--hb-secondary-gray)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={signer.email}
                  >
                    {signer.email}
                  </span>
                )}
              </div>
            </div>

            {/* Account context */}
            <p
              style={{
                fontSize: 'var(--hb-font-size-sm)',
                color: 'var(--hb-secondary-gray)',
                margin: 0,
              }}
            >
              This signer will be removed from{' '}
              <strong>{accountName}</strong>
              {accountNumber ? ` (${accountNumber})` : ''}.
            </p>

            {/* Warning notice */}
            <div
              style={{
                backgroundColor: 'var(--hb-alert-warning-bg)',
                border: '1px solid var(--hb-alert-warning-border)',
                borderRadius: 'var(--hb-radius-sm)',
                padding: 'var(--hb-space-md)',
              }}
            >
              <p
                style={{
                  fontSize: 'var(--hb-font-size-sm)',
                  color: 'var(--hb-alert-warning-text)',
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                Important:
              </p>
              <ul
                style={{
                  fontSize: 'var(--hb-font-size-sm)',
                  color: 'var(--hb-alert-warning-text)',
                  margin: 'var(--hb-space-xs) 0 0 0',
                  paddingLeft: 'var(--hb-space-lg)',
                  listStyle: 'disc',
                }}
              >
                <li style={{ marginBottom: 'var(--hb-space-xs)' }}>
                  This action will be staged for review. The signer will not be
                  removed until all changes are submitted.
                </li>
                <li style={{ marginBottom: 'var(--hb-space-xs)' }}>
                  Any cards associated with this signer may be affected.
                </li>
                <li>
                  At least one signer must remain on the account at all times.
                </li>
              </ul>
            </div>

            {/* Reason input */}
            <div>
              <label
                htmlFor="remove-signer-reason"
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
                id="remove-signer-reason"
                type="text"
                value={reason}
                onChange={handleReasonChange}
                disabled={isRemoving}
                className="hb-form-control"
                style={{ padding: '8px 12px' }}
                placeholder="Enter reason…"
                autoComplete="off"
                aria-label="Reason for removing this signer"
              />
            </div>

            {/* Action buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 'var(--hb-space-sm)',
                marginTop: 'var(--hb-space-sm)',
              }}
            >
              <button
                type="button"
                className="button-secondary-2"
                onClick={handleClose}
                disabled={isRemoving}
                aria-label="Cancel signer removal"
              >
                Cancel
              </button>
              <button
                type="button"
                className="button-primary"
                onClick={handleConfirmRemove}
                disabled={isConfirmDisabled}
                aria-disabled={isConfirmDisabled ? 'true' : undefined}
                aria-label={`Confirm removal of signer ${signerName}`}
                style={{
                  backgroundColor: isConfirmDisabled
                    ? 'var(--hb-secondary-gray-light)'
                    : 'var(--hb-secondary-red)',
                  borderColor: isConfirmDisabled
                    ? 'var(--hb-secondary-gray-light)'
                    : 'var(--hb-secondary-red)',
                }}
              >
                {isRemoving ? 'Removing…' : 'Remove Signer'}
              </button>
            </div>
          </>
        )}

        {/* No signer provided */}
        {!removeSuccess && !signer && (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--hb-space-lg)',
            }}
          >
            <Alert
              type={ALERT_TYPES.WARNING}
              message="No signer selected for removal."
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: 'var(--hb-space-md)',
              }}
            >
              <button
                type="button"
                className="button-secondary-2"
                onClick={handleClose}
                aria-label="Close removal modal"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

RemoveSignerModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  signer: PropTypes.shape({
    id: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    fullName: PropTypes.string,
    role: PropTypes.string,
    status: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    accountId: PropTypes.string,
  }),
  onRemoveSuccess: PropTypes.func,
  className: PropTypes.string,
};

export default RemoveSignerModal;