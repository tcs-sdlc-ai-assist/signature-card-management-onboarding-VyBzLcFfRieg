/**
 * Final review component with legal consent acknowledgment.
 *
 * Displays a read-only summary of the complete authorized signer list
 * after all staged changes are applied. Clearly distinguishes unchanged,
 * modified, new, and removed signers with visual indicators. Shows
 * account details and controlling party identity info.
 *
 * Includes a legal consent/acknowledgment checkbox that must be checked
 * to enable the Submit button. Provides a "Submit" button (disabled
 * until consent is given) and an "Edit" button to return to signer
 * management.
 *
 * Integrates with {@link AccountContext} for staged changes and signer
 * data, and {@link AuthContext} for controlling party identity info.
 *
 * Uses HB CSS framework classes for styling consistency.
 *
 * @module FinalReview
 */

import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAccount } from '../../context/AccountContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Alert } from '../common/Alert.jsx';
import { Button } from '../common/Button.jsx';
import { LoadingSpinner } from '../common/LoadingSpinner.jsx';
import { ALERT_TYPES, SIGNER_STATUSES } from '../../constants/constants.js';
import { LEGAL_MESSAGES } from '../../constants/messages.js';

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
 * Shield SVG icon for the legal consent section.
 *
 * @returns {React.ReactElement} An SVG shield icon.
 */
function ShieldIcon() {
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
        d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Bank building SVG icon for account details.
 *
 * @returns {React.ReactElement} An SVG bank icon.
 */
function BankIcon() {
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
        d="M10.496 2.132a1 1 0 00-.992 0l-7 4A1 1 0 003 8v1a1 1 0 001 1h1v5H4a1 1 0 100 2h12a1 1 0 100-2h-1v-5h1a1 1 0 001-1V8a1 1 0 00.496-1.868l-7-4zM14 10H6v5h2v-3a1 1 0 012 0v3h2v-3a1 1 0 012 0v3h2v-5h-2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * User SVG icon for controlling party display.
 *
 * @returns {React.ReactElement} An SVG user icon.
 */
function UserIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ color: 'var(--hb-secondary-gray)', flexShrink: 0 }}
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Plus SVG icon for the additions indicator.
 *
 * @returns {React.ReactElement} An SVG plus icon.
 */
function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
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
 * Pencil SVG icon for the edits indicator.
 *
 * @returns {React.ReactElement} An SVG pencil icon.
 */
function EditIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0 }}
    >
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  );
}

/**
 * Trash SVG icon for the removals indicator.
 *
 * @returns {React.ReactElement} An SVG trash icon.
 */
function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0 }}
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
 * Determines the change type for a signer based on staged changes.
 *
 * @param {string} signerId - The signer ID.
 * @param {Set<string>} additionIds - Set of staged addition signer IDs.
 * @param {Set<string>} editIds - Set of staged edit signer IDs.
 * @param {Set<string>} removalIds - Set of staged removal signer IDs.
 * @returns {'added'|'edited'|'removed'|'unchanged'} The change type.
 */
function getSignerChangeType(signerId, additionIds, editIds, removalIds) {
  if (removalIds.has(signerId)) {
    return 'removed';
  }
  if (additionIds.has(signerId)) {
    return 'added';
  }
  if (editIds.has(signerId)) {
    return 'edited';
  }
  return 'unchanged';
}

/**
 * Returns the visual indicator style for a signer change type.
 *
 * @param {'added'|'edited'|'removed'|'unchanged'} changeType - The change type.
 * @returns {{ borderColor: string, backgroundColor: string, badgeClass: string, badgeLabel: string, icon: React.ReactElement|null }}
 */
function getChangeIndicator(changeType) {
  switch (changeType) {
    case 'added':
      return {
        borderColor: 'var(--hb-secondary-green)',
        backgroundColor: 'var(--hb-alert-success-bg)',
        badgeClass: 'hb-badge hb-badge-success',
        badgeLabel: 'New',
        icon: <PlusIcon />,
      };
    case 'edited':
      return {
        borderColor: 'var(--hb-secondary-orange)',
        backgroundColor: 'var(--hb-alert-warning-bg)',
        badgeClass: 'hb-badge hb-badge-warning',
        badgeLabel: 'Modified',
        icon: <EditIcon />,
      };
    case 'removed':
      return {
        borderColor: 'var(--hb-secondary-red)',
        backgroundColor: 'var(--hb-alert-critical-bg)',
        badgeClass: 'hb-badge hb-badge-error',
        badgeLabel: 'Removed',
        icon: <TrashIcon />,
      };
    default:
      return {
        borderColor: 'transparent',
        backgroundColor: 'var(--hb-primary-white)',
        badgeClass: '',
        badgeLabel: '',
        icon: null,
      };
  }
}

/**
 * Final review component with legal consent acknowledgment.
 *
 * Displays a read-only summary of the complete authorized signer list
 * after all staged changes are applied. Includes account details,
 * controlling party info, change summary, signer list with visual
 * indicators, legal consent checkbox, and action buttons.
 *
 * @param {Object} [props]
 * @param {function} [props.onSubmit] - Callback invoked when the "Submit"
 *   button is clicked. Receives no arguments.
 * @param {function} [props.onEdit] - Callback invoked when the "Edit"
 *   button is clicked. Returns the user to signer management.
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the wrapper element.
 * @returns {React.ReactElement} The rendered final review component.
 */
export function FinalReview({
  onSubmit = null,
  onEdit = null,
  className = '',
}) {
  const {
    selectedAccount,
    signers,
    stagedChanges,
    submissionResult,
    loading,
    error,
    submitChanges,
  } = useAccount();

  const { user } = useAuth();

  const [consentChecked, setConsentChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  const {
    additions,
    edits,
    removals,
    totalChanges,
    hasChanges,
  } = stagedChanges;

  /**
   * Computes sets of signer IDs for each change type.
   */
  const changeIdSets = useMemo(() => {
    const additionIds = new Set(
      Array.isArray(additions) ? additions.map((a) => a.id) : []
    );
    const editIds = new Set(
      Array.isArray(edits) ? edits.map((e) => e.signerId) : []
    );
    const removalIds = new Set(
      Array.isArray(removals) ? removals.map((r) => r.signerId) : []
    );
    return { additionIds, editIds, removalIds };
  }, [additions, edits, removals]);

  /**
   * Builds the complete signer list including staged additions and
   * removals for display purposes.
   */
  const completeSignerList = useMemo(() => {
    const currentSigners = Array.isArray(signers) ? [...signers] : [];

    // Add removed signers back for display (they may have been filtered out)
    if (Array.isArray(removals)) {
      for (const removal of removals) {
        const alreadyInList = currentSigners.some((s) => s.id === removal.signerId);
        if (!alreadyInList) {
          currentSigners.push({
            id: removal.signerId,
            fullName: removal.signerName || 'Unknown',
            role: 'authorized_signer',
            status: SIGNER_STATUSES.ACTIVE,
            email: '',
            phone: '',
          });
        }
      }
    }

    return currentSigners;
  }, [signers, removals]);

  /**
   * Computes the count summary for display.
   */
  const countSummary = useMemo(() => {
    const addCount = Array.isArray(additions) ? additions.length : 0;
    const editCount = Array.isArray(edits) ? edits.length : 0;
    const removeCount = Array.isArray(removals) ? removals.length : 0;
    const unchangedCount = completeSignerList.length - addCount - editCount - removeCount;

    return {
      additions: addCount,
      edits: editCount,
      removals: removeCount,
      unchanged: Math.max(0, unchangedCount),
      total: addCount + editCount + removeCount,
    };
  }, [additions, edits, removals, completeSignerList]);

  /**
   * Handles the consent checkbox change.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - The change event.
   */
  const handleConsentChange = useCallback((event) => {
    setConsentChecked(event.target.checked);
  }, []);

  /**
   * Handles the "Submit" button click.
   */
  const handleSubmit = useCallback(() => {
    if (!consentChecked || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const result = submitChanges();

      if (result.status === 'success') {
        setSubmitSuccess(result.message || 'Changes submitted successfully.');
        setSubmitError(null);

        if (typeof onSubmit === 'function') {
          try {
            onSubmit();
          } catch {
            // Callback errors must not break the submission flow.
          }
        }
      } else {
        setSubmitError(result.message || 'Failed to submit changes. Please try again.');
      }
    } catch {
      setSubmitError('An unexpected error occurred while submitting changes.');
    } finally {
      setIsSubmitting(false);
    }
  }, [consentChecked, isSubmitting, submitChanges, onSubmit]);

  /**
   * Handles the "Edit" button click.
   */
  const handleEdit = useCallback(() => {
    if (typeof onEdit === 'function') {
      try {
        onEdit();
      } catch {
        // Callback errors must not break the UI flow.
      }
    }
  }, [onEdit]);

  const accountName = selectedAccount
    ? selectedAccount.accountName || 'Selected Account'
    : 'Selected Account';

  const accountNumber = selectedAccount
    ? selectedAccount.accountNumber || ''
    : '';

  const accountType = selectedAccount
    ? selectedAccount.accountType || ''
    : '';

  const controllingPartyName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Unknown'
    : 'Unknown';

  const controllingPartyEmail = user?.email || '';
  const controllingPartyRole = user?.role === 'controlling_party' ? 'Controlling Party' : (user?.role || 'User');

  const isSubmitDisabled = !consentChecked || isSubmitting || loading || !!submitSuccess;

  const wrapperClassName = [className].filter(Boolean).join(' ');

  // Loading state
  if (loading && !hasChanges) {
    return (
      <div className={wrapperClassName}>
        <LoadingSpinner size="medium" label="Loading review data…" />
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
          maxWidth: '760px',
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
          Final Review
        </h2>

        <Alert
          type={ALERT_TYPES.INFO}
          message="No staged changes to review. Please add, edit, or remove signers before submitting."
        />

        {typeof onEdit === 'function' && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 'var(--hb-space-lg)',
            }}
          >
            <Button
              variant="secondary"
              label="Go Back to Edit"
              onClick={handleEdit}
              ariaLabel="Go back to signer management"
            />
          </div>
        )}
      </div>
    );
  }

  // Submission success state
  if (submitSuccess) {
    return (
      <div
        className={wrapperClassName}
        style={{
          width: '100%',
          maxWidth: '760px',
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
          Submission Complete
        </h2>

        <Alert
          type={ALERT_TYPES.SUCCESS}
          message={submitSuccess}
        />

        {submissionResult && submissionResult.confirmationId && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--hb-space-md)',
              padding: 'var(--hb-space-lg)',
              backgroundColor: 'var(--hb-alert-success-bg)',
              borderRadius: 'var(--hb-radius-md)',
              border: '1px solid var(--hb-alert-success-border)',
              marginBottom: 'var(--hb-space-lg)',
            }}
          >
            <p
              style={{
                fontSize: 'var(--hb-font-size-sm)',
                color: 'var(--hb-secondary-gray)',
                margin: 0,
              }}
            >
              Confirmation ID
            </p>
            <p
              style={{
                fontSize: 'var(--hb-font-size-h3)',
                fontWeight: 700,
                color: 'var(--hb-secondary-green)',
                margin: 0,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.05em',
              }}
            >
              {submissionResult.confirmationId}
            </p>
            <p
              style={{
                fontSize: 'var(--hb-font-size-sm)',
                color: 'var(--hb-secondary-gray)',
                margin: 0,
                textAlign: 'center',
              }}
            >
              Please save this confirmation ID for your records.
            </p>
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
        maxWidth: '760px',
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
        Final Review &amp; Submit
      </h2>

      <p
        style={{
          textAlign: 'center',
          fontSize: 'var(--hb-font-size-sm)',
          color: 'var(--hb-secondary-gray)',
          marginBottom: 'var(--hb-space-lg)',
        }}
      >
        Please review all changes carefully before submitting. This action cannot be undone.
      </p>

      {/* Screen reader status */}
      <div
        aria-live="polite"
        aria-atomic="true"
        role="status"
        className="sr-only"
      >
        {isSubmitting && 'Submitting changes, please wait.'}
        {submitSuccess && submitSuccess}
        {submitError && `Error: ${submitError}`}
      </div>

      {/* Error messages */}
      {submitError && (
        <Alert
          type={ALERT_TYPES.CRITICAL}
          message={submitError}
        />
      )}

      {error && (
        <Alert
          type={ALERT_TYPES.WARNING}
          message={error}
        />
      )}

      {/* Account details section */}
      <div
        style={{
          marginBottom: 'var(--hb-space-lg)',
        }}
      >
        <h3
          style={{
            fontSize: 'var(--hb-font-size-lg)',
            fontWeight: 500,
            color: 'var(--hb-primary-black)',
            marginBottom: 'var(--hb-space-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--hb-space-sm)',
          }}
        >
          <BankIcon />
          Account Details
        </h3>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--hb-space-xs)',
            padding: 'var(--hb-space-md)',
            backgroundColor: 'var(--hb-secondary-gray-lighter)',
            borderRadius: 'var(--hb-radius-md)',
            border: '1px solid var(--hb-secondary-gray-light)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--hb-space-sm)',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 'var(--hb-font-size-base)',
                fontWeight: 500,
                color: 'var(--hb-primary-black)',
              }}
            >
              {accountName}
            </span>
            {accountNumber && (
              <span
                style={{
                  fontSize: 'var(--hb-font-size-sm)',
                  color: 'var(--hb-secondary-gray)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                ({accountNumber})
              </span>
            )}
          </div>
          {accountType && (
            <span
              style={{
                fontSize: 'var(--hb-font-size-sm)',
                color: 'var(--hb-secondary-gray)',
              }}
            >
              {accountType === 'business_checking'
                ? 'Business Checking'
                : accountType === 'business_savings'
                  ? 'Business Savings'
                  : accountType === 'business_money_market'
                    ? 'Business Money Market'
                    : accountType}
            </span>
          )}
        </div>
      </div>

      {/* Controlling party section */}
      <div
        style={{
          marginBottom: 'var(--hb-space-lg)',
        }}
      >
        <h3
          style={{
            fontSize: 'var(--hb-font-size-lg)',
            fontWeight: 500,
            color: 'var(--hb-primary-black)',
            marginBottom: 'var(--hb-space-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--hb-space-sm)',
          }}
        >
          <UserIcon />
          Submitted By
        </h3>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--hb-space-xs)',
            padding: 'var(--hb-space-md)',
            backgroundColor: 'var(--hb-secondary-gray-lighter)',
            borderRadius: 'var(--hb-radius-md)',
            border: '1px solid var(--hb-secondary-gray-light)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--hb-font-size-base)',
              fontWeight: 500,
              color: 'var(--hb-primary-black)',
            }}
          >
            {controllingPartyName}
          </span>
          <span
            style={{
              fontSize: 'var(--hb-font-size-sm)',
              color: 'var(--hb-secondary-gray)',
            }}
          >
            {controllingPartyRole}
          </span>
          {controllingPartyEmail && (
            <span
              style={{
                fontSize: 'var(--hb-font-size-sm)',
                color: 'var(--hb-secondary-gray)',
              }}
            >
              {controllingPartyEmail}
            </span>
          )}
        </div>
      </div>

      {/* Change summary */}
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
            New
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
            Modified
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
              backgroundColor: 'var(--hb-primary-white)',
              color: 'var(--hb-secondary-gray)',
              fontSize: 'var(--hb-font-size-sm)',
              fontWeight: 700,
              border: '1px solid var(--hb-secondary-gray-light)',
            }}
          >
            {countSummary.unchanged}
          </span>
          <span
            style={{
              fontSize: 'var(--hb-font-size-sm)',
              color: 'var(--hb-secondary-gray)',
            }}
          >
            Unchanged
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

      {/* Complete signer list */}
      <div
        style={{
          marginBottom: 'var(--hb-space-lg)',
        }}
      >
        <h3
          style={{
            fontSize: 'var(--hb-font-size-lg)',
            fontWeight: 500,
            color: 'var(--hb-primary-black)',
            marginBottom: 'var(--hb-space-md)',
          }}
        >
          Authorized Signers ({completeSignerList.length})
        </h3>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--hb-space-sm)',
          }}
        >
          {completeSignerList.map((signer) => {
            const changeType = getSignerChangeType(
              signer.id,
              changeIdSets.additionIds,
              changeIdSets.editIds,
              changeIdSets.removalIds
            );
            const indicator = getChangeIndicator(changeType);
            const signerName = signer.fullName ||
              `${signer.firstName || ''} ${signer.lastName || ''}`.trim() ||
              'Unknown';
            const isRemoved = changeType === 'removed';

            return (
              <div
                key={signer.id}
                className="hb-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--hb-space-md)',
                  padding: 'var(--hb-space-md)',
                  borderLeft: `4px solid ${indicator.borderColor}`,
                  backgroundColor: indicator.backgroundColor,
                  opacity: isRemoved ? 0.7 : 1,
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
                        textDecoration: isRemoved ? 'line-through' : 'none',
                      }}
                    >
                      {signerName}
                    </span>
                    <span className={getStatusBadgeClass(signer.status)}>
                      {getStatusLabel(signer.status)}
                    </span>
                    {indicator.badgeLabel && (
                      <span
                        className={indicator.badgeClass}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {indicator.icon}
                        {indicator.badgeLabel}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--hb-space-lg)',
                      flexWrap: 'wrap',
                      fontSize: 'var(--hb-font-size-sm)',
                      color: 'var(--hb-secondary-gray)',
                    }}
                  >
                    <span>{getRoleLabel(signer.role)}</span>
                    {signer.email && (
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '200px',
                        }}
                        title={signer.email}
                      >
                        {signer.email}
                      </span>
                    )}
                    {signer.phone && (
                      <span>{signer.phone}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legal consent section */}
      <div
        style={{
          marginBottom: 'var(--hb-space-lg)',
          padding: 'var(--hb-space-lg)',
          backgroundColor: 'var(--hb-primary-blue-light)',
          borderRadius: 'var(--hb-radius-md)',
          border: '1px solid var(--hb-primary-blue)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--hb-space-sm)',
            marginBottom: 'var(--hb-space-md)',
          }}
        >
          <ShieldIcon />
          <h3
            style={{
              fontSize: 'var(--hb-font-size-lg)',
              fontWeight: 500,
              color: 'var(--hb-primary-black)',
              margin: 0,
            }}
          >
            Legal Acknowledgment
          </h3>
        </div>

        <p
          style={{
            fontSize: 'var(--hb-font-size-sm)',
            color: 'var(--hb-primary-black)',
            marginBottom: 'var(--hb-space-sm)',
            lineHeight: 1.6,
          }}
        >
          {LEGAL_MESSAGES.CONSENT_TEXT}
        </p>

        <p
          style={{
            fontSize: 'var(--hb-font-size-sm)',
            color: 'var(--hb-secondary-gray)',
            marginBottom: 'var(--hb-space-md)',
            lineHeight: 1.6,
          }}
        >
          {LEGAL_MESSAGES.PRIVACY_NOTICE}
        </p>

        <p
          style={{
            fontSize: 'var(--hb-font-size-sm)',
            color: 'var(--hb-secondary-gray)',
            marginBottom: 'var(--hb-space-lg)',
            lineHeight: 1.6,
          }}
        >
          {LEGAL_MESSAGES.TERMS_ACCEPTANCE}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--hb-space-sm)',
          }}
        >
          <input
            id="legal-consent-checkbox"
            type="checkbox"
            checked={consentChecked}
            onChange={handleConsentChange}
            disabled={isSubmitting || !!submitSuccess}
            style={{
              width: '20px',
              height: '20px',
              marginTop: '2px',
              flexShrink: 0,
              accentColor: 'var(--hb-primary-blue)',
              cursor: isSubmitting || !!submitSuccess ? 'not-allowed' : 'pointer',
            }}
            aria-required="true"
            aria-label="I acknowledge and consent to the terms above"
          />
          <label
            htmlFor="legal-consent-checkbox"
            style={{
              fontSize: 'var(--hb-font-size-sm)',
              fontWeight: 500,
              color: 'var(--hb-primary-black)',
              cursor: isSubmitting || !!submitSuccess ? 'not-allowed' : 'pointer',
              lineHeight: 1.5,
            }}
          >
            I have reviewed all changes and acknowledge the terms above. I confirm that I have the
            authority to make these changes on behalf of the account holder.
            <span
              aria-hidden="true"
              style={{ color: 'var(--hb-secondary-red)', marginLeft: '2px' }}
            >
              *
            </span>
          </label>
        </div>
      </div>

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
            Once submitted, these changes will be processed and cannot be reversed through this portal.
          </li>
          <li style={{ marginBottom: 'var(--hb-space-xs)' }}>
            A confirmation ID will be generated for your records.
          </li>
          <li>
            You can click &quot;Edit Changes&quot; to go back and modify your staged changes before submitting.
          </li>
        </ul>
      </div>

      {/* Loading overlay for submission */}
      {isSubmitting && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: 'var(--hb-space-md)',
          }}
        >
          <LoadingSpinner size="small" label="Submitting changes…" />
        </div>
      )}

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 'var(--hb-space-sm)',
        }}
      >
        {typeof onEdit === 'function' && (
          <Button
            variant="secondary"
            label="Edit Changes"
            onClick={handleEdit}
            disabled={isSubmitting}
            ariaLabel="Go back to edit signer changes"
          />
        )}

        <Button
          variant="primary"
          label="Submit Changes"
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitDisabled}
          ariaLabel={
            consentChecked
              ? 'Submit all staged signer changes'
              : 'You must accept the legal acknowledgment before submitting'
          }
        />
      </div>

      {/* Consent reminder */}
      {!consentChecked && !isSubmitting && !submitSuccess && (
        <p
          style={{
            textAlign: 'right',
            marginTop: 'var(--hb-space-sm)',
            fontSize: 'var(--hb-font-size-xs)',
            color: 'var(--hb-secondary-gray)',
            fontStyle: 'italic',
          }}
        >
          Please check the legal acknowledgment checkbox above to enable submission.
        </p>
      )}
    </div>
  );
}

FinalReview.propTypes = {
  onSubmit: PropTypes.func,
  onEdit: PropTypes.func,
  className: PropTypes.string,
};

export default FinalReview;