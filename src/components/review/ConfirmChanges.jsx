/**
 * Staged changes confirmation summary component.
 *
 * Displays a summary of all staged changes: signers added (with details),
 * signers edited (with before/after comparison), and signers removed
 * (with name/role). Shows change counts and provides navigation buttons
 * to go back to signer management or continue to the review step.
 *
 * Integrates with {@link AccountContext} for staged changes data and
 * uses HB CSS framework classes for styling consistency.
 *
 * @module ConfirmChanges
 */

import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAccount } from '../../context/AccountContext.jsx';
import { Alert } from '../common/Alert.jsx';
import { Button } from '../common/Button.jsx';
import { LoadingSpinner } from '../common/LoadingSpinner.jsx';
import { ALERT_TYPES, SIGNER_STATUSES } from '../../constants/constants.js';

/**
 * Plus SVG icon for the additions section.
 *
 * @returns {React.ReactElement} An SVG plus icon.
 */
function PlusIcon() {
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
        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Pencil SVG icon for the edits section.
 *
 * @returns {React.ReactElement} An SVG pencil icon.
 */
function EditIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ color: 'var(--hb-secondary-orange)', flexShrink: 0 }}
    >
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  );
}

/**
 * Trash SVG icon for the removals section.
 *
 * @returns {React.ReactElement} An SVG trash icon.
 */
function TrashIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ color: 'var(--hb-secondary-red)', flexShrink: 0 }}
    >
      <path
        fillRule="evenodd"
        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Person SVG icon for signer display.
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
 * Arrow right SVG icon for before/after display.
 *
 * @returns {React.ReactElement} An SVG arrow right icon.
 */
function ArrowRightIcon() {
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
      <path
        fillRule="evenodd"
        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
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
 * Returns a human-readable label for a field key.
 *
 * @param {string} fieldKey - The field key.
 * @returns {string} A human-readable label.
 */
function getFieldLabel(fieldKey) {
  switch (fieldKey) {
    case 'firstName':
      return 'First Name';
    case 'lastName':
      return 'Last Name';
    case 'middleName':
      return 'Middle Name';
    case 'suffix':
      return 'Suffix';
    case 'fullName':
      return 'Full Name';
    case 'email':
      return 'Email';
    case 'phone':
      return 'Phone';
    case 'role':
      return 'Role';
    case 'status':
      return 'Status';
    case 'address':
      return 'Address';
    case 'lastFourSSN':
      return 'Last 4 SSN';
    case 'dateOfBirth':
      return 'Date of Birth';
    case 'additionalContact':
      return 'Additional Contact';
    default:
      return fieldKey;
  }
}

/**
 * Formats a field value for display, handling special cases.
 *
 * @param {string} fieldKey - The field key.
 * @param {*} value - The field value.
 * @returns {string} A display-friendly string.
 */
function formatFieldValue(fieldKey, value) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (fieldKey === 'role') {
    return getRoleLabel(value);
  }

  if (fieldKey === 'status') {
    return getStatusLabel(value);
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Staged changes confirmation summary component.
 *
 * Displays a summary of all staged changes grouped by type (additions,
 * edits, removals) with detailed information for each change. Shows
 * total change counts and provides navigation buttons.
 *
 * Integrates with {@link AccountContext} for staged changes data.
 *
 * @param {Object} [props]
 * @param {function} [props.onGoBack] - Callback invoked when the "Go Back"
 *   button is clicked. Returns the user to signer management.
 * @param {function} [props.onContinue] - Callback invoked when the
 *   "Continue to Review" button is clicked. Proceeds to the review step.
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the wrapper element.
 * @returns {React.ReactElement} The rendered confirmation summary.
 */
export function ConfirmChanges({
  onGoBack = null,
  onContinue = null,
  className = '',
}) {
  const {
    stagedChanges,
    selectedAccount,
    loading,
    error,
  } = useAccount();

  const {
    additions,
    edits,
    removals,
    totalChanges,
    hasChanges,
  } = stagedChanges;

  /**
   * Computes the count summary for display.
   */
  const countSummary = useMemo(() => {
    const addCount = Array.isArray(additions) ? additions.length : 0;
    const editCount = Array.isArray(edits) ? edits.length : 0;
    const removeCount = Array.isArray(removals) ? removals.length : 0;

    return {
      additions: addCount,
      edits: editCount,
      removals: removeCount,
      total: addCount + editCount + removeCount,
    };
  }, [additions, edits, removals]);

  /**
   * Handles the "Go Back" button click.
   */
  const handleGoBack = useCallback(() => {
    if (typeof onGoBack === 'function') {
      try {
        onGoBack();
      } catch {
        // Callback errors must not break the UI flow.
      }
    }
  }, [onGoBack]);

  /**
   * Handles the "Continue to Review" button click.
   */
  const handleContinue = useCallback(() => {
    if (typeof onContinue === 'function') {
      try {
        onContinue();
      } catch {
        // Callback errors must not break the UI flow.
      }
    }
  }, [onContinue]);

  const accountName = selectedAccount
    ? selectedAccount.accountName || 'Selected Account'
    : 'Selected Account';

  const accountNumber = selectedAccount
    ? selectedAccount.accountNumber || ''
    : '';

  const wrapperClassName = [className].filter(Boolean).join(' ');

  // Loading state
  if (loading) {
    return (
      <div className={wrapperClassName}>
        <LoadingSpinner size="medium" label="Loading staged changes…" />
      </div>
    );
  }

  // No account selected
  if (!selectedAccount) {
    return (
      <div className={wrapperClassName}>
        <Alert
          type={ALERT_TYPES.WARNING}
          message="No account selected. Please select an account first."
        />
      </div>
    );
  }

  // No changes staged
  if (!hasChanges || countSummary.total === 0) {
    return (
      <div
        className={wrapperClassName}
        style={{
          width: '100%',
          maxWidth: '720px',
          margin: '0 auto',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--hb-font-size-h3)',
            fontWeight: 500,
            textAlign: 'center',
            marginBottom: 'var(--hb-space-md)',
            color: 'var(--hb-primary-black)',
          }}
        >
          Confirm Changes
        </h2>

        <Alert
          type={ALERT_TYPES.INFO}
          message="No staged changes to review. Please add, edit, or remove signers before proceeding."
        />

        {typeof onGoBack === 'function' && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 'var(--hb-space-lg)',
            }}
          >
            <Button
              variant="secondary"
              label="Go Back"
              onClick={handleGoBack}
              ariaLabel="Go back to signer management"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={wrapperClassName}
      style={{
        width: '100%',
        maxWidth: '720px',
        margin: '0 auto',
      }}
    >
      <h2
        style={{
          fontSize: 'var(--hb-font-size-h3)',
          fontWeight: 500,
          textAlign: 'center',
          marginBottom: 'var(--hb-space-md)',
          color: 'var(--hb-primary-black)',
        }}
      >
        Confirm Changes
      </h2>

      <p
        style={{
          textAlign: 'center',
          fontSize: 'var(--hb-font-size-sm)',
          color: 'var(--hb-secondary-gray)',
          marginBottom: 'var(--hb-space-lg)',
        }}
      >
        Review the staged changes below for{' '}
        <strong>{accountName}</strong>
        {accountNumber ? ` (${accountNumber})` : ''}.
        Please verify all changes before continuing.
      </p>

      {/* Screen reader status */}
      <div
        aria-live="polite"
        aria-atomic="true"
        role="status"
        className="sr-only"
      >
        {`${countSummary.total} staged change${countSummary.total !== 1 ? 's' : ''} to review: ${countSummary.additions} addition${countSummary.additions !== 1 ? 's' : ''}, ${countSummary.edits} edit${countSummary.edits !== 1 ? 's' : ''}, ${countSummary.removals} removal${countSummary.removals !== 1 ? 's' : ''}.`}
      </div>

      {/* Error message */}
      {error && (
        <Alert
          type={ALERT_TYPES.WARNING}
          message={error}
        />
      )}

      {/* Change count summary */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--hb-space-lg)',
          flexWrap: 'wrap',
          marginBottom: 'var(--hb-space-lg)',
          padding: 'var(--hb-space-md)',
          backgroundColor: 'var(--hb-secondary-gray-lighter)',
          borderRadius: 'var(--hb-radius-md)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--hb-space-xs)',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'var(--hb-alert-success-bg)',
              color: 'var(--hb-secondary-green)',
              fontSize: 'var(--hb-font-size-sm)',
              fontWeight: 700,
            }}
          >
            {countSummary.additions}
          </span>
          <span
            style={{
              fontSize: 'var(--hb-font-size-sm)',
              color: 'var(--hb-secondary-gray)',
            }}
          >
            Added
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--hb-space-xs)',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'var(--hb-alert-warning-bg)',
              color: 'var(--hb-secondary-orange)',
              fontSize: 'var(--hb-font-size-sm)',
              fontWeight: 700,
            }}
          >
            {countSummary.edits}
          </span>
          <span
            style={{
              fontSize: 'var(--hb-font-size-sm)',
              color: 'var(--hb-secondary-gray)',
            }}
          >
            Edited
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--hb-space-xs)',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'var(--hb-alert-critical-bg)',
              color: 'var(--hb-secondary-red)',
              fontSize: 'var(--hb-font-size-sm)',
              fontWeight: 700,
            }}
          >
            {countSummary.removals}
          </span>
          <span
            style={{
              fontSize: 'var(--hb-font-size-sm)',
              color: 'var(--hb-secondary-gray)',
            }}
          >
            Removed
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--hb-space-xs)',
            borderLeft: '1px solid var(--hb-secondary-gray-light)',
            paddingLeft: 'var(--hb-space-lg)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--hb-font-size-base)',
              fontWeight: 700,
              color: 'var(--hb-primary-black)',
            }}
          >
            {countSummary.total}
          </span>
          <span
            style={{
              fontSize: 'var(--hb-font-size-sm)',
              color: 'var(--hb-secondary-gray)',
            }}
          >
            Total Change{countSummary.total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Additions section */}
      {countSummary.additions > 0 && (
        <div style={{ marginBottom: 'var(--hb-space-lg)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--hb-space-sm)',
              marginBottom: 'var(--hb-space-md)',
            }}
          >
            <PlusIcon />
            <h3
              style={{
                fontSize: 'var(--hb-font-size-lg)',
                fontWeight: 500,
                color: 'var(--hb-secondary-green)',
                margin: 0,
              }}
            >
              Signers Added ({countSummary.additions})
            </h3>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--hb-space-sm)',
            }}
          >
            {additions.map((signer) => {
              const signerName = signer.fullName ||
                `${signer.firstName || ''} ${signer.lastName || ''}`.trim() ||
                'Unknown';

              return (
                <div
                  key={signer.id}
                  className="hb-card"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--hb-space-md)',
                    padding: 'var(--hb-space-md)',
                    borderLeft: '4px solid var(--hb-secondary-green)',
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
                      <span className={getStatusBadgeClass(signer.status)}>
                        {getStatusLabel(signer.status)}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--hb-space-xs)',
                        fontSize: 'var(--hb-font-size-sm)',
                        color: 'var(--hb-secondary-gray)',
                      }}
                    >
                      <span>
                        <strong>Role:</strong> {getRoleLabel(signer.role)}
                      </span>
                      {signer.email && (
                        <span>
                          <strong>Email:</strong> {signer.email}
                        </span>
                      )}
                      {signer.phone && (
                        <span>
                          <strong>Phone:</strong> {signer.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edits section */}
      {countSummary.edits > 0 && (
        <div style={{ marginBottom: 'var(--hb-space-lg)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--hb-space-sm)',
              marginBottom: 'var(--hb-space-md)',
            }}
          >
            <EditIcon />
            <h3
              style={{
                fontSize: 'var(--hb-font-size-lg)',
                fontWeight: 500,
                color: 'var(--hb-secondary-orange)',
                margin: 0,
              }}
            >
              Signers Edited ({countSummary.edits})
            </h3>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--hb-space-sm)',
            }}
          >
            {edits.map((edit) => {
              const beforeSigner = edit.before || {};
              const changes = edit.changes || {};
              const signerName = beforeSigner.fullName ||
                `${beforeSigner.firstName || ''} ${beforeSigner.lastName || ''}`.trim() ||
                edit.signerId ||
                'Unknown';

              const changedFields = Object.keys(changes).filter(
                (key) => key !== 'fullName' && key !== 'status'
              );

              return (
                <div
                  key={edit.signerId}
                  className="hb-card"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--hb-space-md)',
                    padding: 'var(--hb-space-md)',
                    borderLeft: '4px solid var(--hb-secondary-orange)',
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
                        marginBottom: 'var(--hb-space-sm)',
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
                      <span className="hb-badge hb-badge-warning">
                        Edited
                      </span>
                    </div>

                    {/* Before/After comparison */}
                    {changedFields.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 'var(--hb-space-xs)',
                        }}
                      >
                        {changedFields.map((fieldKey) => {
                          const beforeValue = beforeSigner[fieldKey];
                          const afterValue = changes[fieldKey];

                          return (
                            <div
                              key={fieldKey}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--hb-space-sm)',
                                flexWrap: 'wrap',
                                fontSize: 'var(--hb-font-size-sm)',
                                padding: 'var(--hb-space-xs) 0',
                                borderBottom: '1px solid var(--hb-secondary-gray-lighter)',
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 500,
                                  color: 'var(--hb-primary-black)',
                                  minWidth: '100px',
                                }}
                              >
                                {getFieldLabel(fieldKey)}:
                              </span>
                              <span
                                style={{
                                  color: 'var(--hb-secondary-gray)',
                                  textDecoration: 'line-through',
                                }}
                              >
                                {formatFieldValue(fieldKey, beforeValue)}
                              </span>
                              <ArrowRightIcon />
                              <span
                                style={{
                                  color: 'var(--hb-secondary-orange)',
                                  fontWeight: 500,
                                }}
                              >
                                {formatFieldValue(fieldKey, afterValue)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {changedFields.length === 0 && (
                      <p
                        style={{
                          fontSize: 'var(--hb-font-size-sm)',
                          color: 'var(--hb-secondary-gray)',
                          fontStyle: 'italic',
                          margin: 0,
                        }}
                      >
                        Status change staged.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Removals section */}
      {countSummary.removals > 0 && (
        <div style={{ marginBottom: 'var(--hb-space-lg)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--hb-space-sm)',
              marginBottom: 'var(--hb-space-md)',
            }}
          >
            <TrashIcon />
            <h3
              style={{
                fontSize: 'var(--hb-font-size-lg)',
                fontWeight: 500,
                color: 'var(--hb-secondary-red)',
                margin: 0,
              }}
            >
              Signers Removed ({countSummary.removals})
            </h3>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--hb-space-sm)',
            }}
          >
            {removals.map((removal) => {
              const signerName = removal.signerName || 'Unknown';

              return (
                <div
                  key={removal.signerId}
                  className="hb-card"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--hb-space-md)',
                    padding: 'var(--hb-space-md)',
                    borderLeft: '4px solid var(--hb-secondary-red)',
                    backgroundColor: 'var(--hb-alert-critical-bg)',
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
                          textDecoration: 'line-through',
                        }}
                      >
                        {signerName}
                      </span>
                      <span className="hb-badge hb-badge-error">
                        Removed
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 'var(--hb-font-size-sm)',
                        color: 'var(--hb-secondary-gray)',
                      }}
                    >
                      {removal.reason && (
                        <span>
                          <strong>Reason:</strong> {removal.reason}
                        </span>
                      )}
                      {!removal.reason && (
                        <span style={{ fontStyle: 'italic' }}>
                          No reason provided.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warning notice */}
      <div
        style={{
          backgroundColor: 'var(--hb-alert-warning-bg)',
          border: '1px solid var(--hb-alert-warning-border)',
          borderRadius: 'var(--hb-radius-sm)',
          padding: 'var(--hb-space-md)',
          marginBottom: 'var(--hb-space-lg)',
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
            These changes have not been submitted yet. Continuing will take you to the final review step.
          </li>
          <li style={{ marginBottom: 'var(--hb-space-xs)' }}>
            You can go back to make additional changes before submitting.
          </li>
          <li>
            Once submitted, changes will be processed and a confirmation ID will be generated.
          </li>
        </ul>
      </div>

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 'var(--hb-space-sm)',
        }}
      >
        {typeof onGoBack === 'function' && (
          <Button
            variant="secondary"
            label="Go Back"
            onClick={handleGoBack}
            ariaLabel="Go back to signer management"
          />
        )}

        {typeof onContinue === 'function' && (
          <Button
            variant="primary"
            label="Continue to Review"
            onClick={handleContinue}
            ariaLabel="Continue to final review and submission"
          />
        )}
      </div>
    </div>
  );
}

ConfirmChanges.propTypes = {
  onGoBack: PropTypes.func,
  onContinue: PropTypes.func,
  className: PropTypes.string,
};

export default ConfirmChanges;