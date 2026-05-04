/**
 * Submission confirmation display component.
 *
 * Displays the confirmation number/reference ID, a summary of all changes
 * made, the submission timestamp, and next steps messaging. Shows a success
 * alert and provides an option to print/save the confirmation. The submit
 * button is disabled to prevent duplicate submissions.
 *
 * Integrates with {@link AccountContext} for submission result data and
 * {@link AuthContext} for controlling party identity info.
 *
 * Uses HB CSS framework classes for styling consistency.
 *
 * @module SubmissionConfirmation
 */

import React, { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useAccount } from '../../context/AccountContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Alert } from '../common/Alert.jsx';
import { Button } from '../common/Button.jsx';
import { LoadingSpinner } from '../common/LoadingSpinner.jsx';
import { ALERT_TYPES } from '../../constants/constants.js';
import { formatTimestamp } from '../../utils/dateUtils.js';

/**
 * Checkmark SVG icon for the success state.
 *
 * @returns {React.ReactElement} An SVG checkmark icon.
 */
function SuccessIcon() {
  return (
    <svg
      width="64"
      height="64"
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
 * Printer SVG icon for the print button.
 *
 * @returns {React.ReactElement} An SVG printer icon.
 */
function PrintIcon() {
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
        d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
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
 * Clock SVG icon for the timestamp display.
 *
 * @returns {React.ReactElement} An SVG clock icon.
 */
function ClockIcon() {
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
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Document SVG icon for the summary section.
 *
 * @returns {React.ReactElement} An SVG document icon.
 */
function DocumentIcon() {
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
        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Submission confirmation display component.
 *
 * Displays the confirmation number, change summary, submission timestamp,
 * account details, controlling party info, and next steps messaging.
 * Provides a print/save option and prevents duplicate submissions by
 * disabling the submit button.
 *
 * @param {Object} [props]
 * @param {function} [props.onDone] - Optional callback invoked when the
 *   user clicks the "Done" button. Returns the user to the starting state.
 * @param {function} [props.onStartNew] - Optional callback invoked when
 *   the user clicks the "Start New" button to begin a new workflow.
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the wrapper element.
 * @returns {React.ReactElement} The rendered submission confirmation component.
 */
export function SubmissionConfirmation({
  onDone = null,
  onStartNew = null,
  className = '',
}) {
  const {
    submissionResult,
    selectedAccount,
    stagedChanges,
    loading,
    error,
  } = useAccount();

  const { user } = useAuth();

  const confirmationRef = useRef(null);

  /**
   * Handles the "Print Confirmation" button click.
   * Opens the browser print dialog for the confirmation section.
   */
  const handlePrint = useCallback(() => {
    try {
      window.print();
    } catch {
      // Print must not break the UI flow.
    }
  }, []);

  /**
   * Handles the "Done" button click.
   */
  const handleDone = useCallback(() => {
    if (typeof onDone === 'function') {
      try {
        onDone();
      } catch {
        // Callback errors must not break the UI flow.
      }
    }
  }, [onDone]);

  /**
   * Handles the "Start New" button click.
   */
  const handleStartNew = useCallback(() => {
    if (typeof onStartNew === 'function') {
      try {
        onStartNew();
      } catch {
        // Callback errors must not break the UI flow.
      }
    }
  }, [onStartNew]);

  const confirmationId = submissionResult?.confirmationId || null;
  const submittedAt = submissionResult?.submittedAt || null;
  const summary = submissionResult?.summary || null;

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
  const controllingPartyRole = user?.role === 'controlling_party'
    ? 'Controlling Party'
    : (user?.role || 'User');

  const formattedTimestamp = submittedAt
    ? formatTimestamp(submittedAt)
    : '';

  const wrapperClassName = [className].filter(Boolean).join(' ');

  // Loading state
  if (loading) {
    return (
      <div className={wrapperClassName}>
        <LoadingSpinner size="medium" label="Loading confirmation details…" />
      </div>
    );
  }

  // No submission result available
  if (!submissionResult || !confirmationId) {
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
          Submission Confirmation
        </h2>

        <Alert
          type={ALERT_TYPES.WARNING}
          message="No submission result available. Please complete the review and submit your changes first."
        />

        {typeof onDone === 'function' && (
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
              onClick={handleDone}
              ariaLabel="Go back to the previous step"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={wrapperClassName}
      ref={confirmationRef}
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
        Submission Confirmed
      </h2>

      {/* Screen reader status */}
      <div
        aria-live="polite"
        aria-atomic="true"
        role="status"
        className="sr-only"
      >
        {`Changes submitted successfully. Confirmation ID: ${confirmationId}.`}
      </div>

      {/* Success alert */}
      <Alert
        type={ALERT_TYPES.SUCCESS}
        message={`Your changes have been submitted successfully. Confirmation ID: ${confirmationId}.`}
      />

      {/* Error message if any */}
      {error && (
        <Alert
          type={ALERT_TYPES.WARNING}
          message={error}
        />
      )}

      {/* Success icon and confirmation ID */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--hb-space-md)',
          padding: 'var(--hb-space-xl) 0',
        }}
      >
        <SuccessIcon />

        <p
          style={{
            fontSize: 'var(--hb-font-size-lg)',
            fontWeight: 500,
            color: 'var(--hb-secondary-green)',
            margin: 0,
            textAlign: 'center',
          }}
        >
          Changes Submitted Successfully
        </p>

        {/* Confirmation ID display */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--hb-space-sm)',
            padding: 'var(--hb-space-lg)',
            backgroundColor: 'var(--hb-alert-success-bg)',
            borderRadius: 'var(--hb-radius-md)',
            border: '1px solid var(--hb-alert-success-border)',
            width: '100%',
            maxWidth: '400px',
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
            {confirmationId}
          </p>
          <p
            style={{
              fontSize: 'var(--hb-font-size-xs)',
              color: 'var(--hb-secondary-gray)',
              margin: 0,
              textAlign: 'center',
            }}
          >
            Please save this confirmation ID for your records.
          </p>
        </div>
      </div>

      {/* Submission timestamp */}
      {formattedTimestamp && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--hb-space-sm)',
            marginBottom: 'var(--hb-space-lg)',
          }}
        >
          <ClockIcon />
          <span
            style={{
              fontSize: 'var(--hb-font-size-sm)',
              color: 'var(--hb-secondary-gray)',
            }}
          >
            Submitted on {formattedTimestamp}
          </span>
        </div>
      )}

      {/* Change summary section */}
      {summary && (
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
            <DocumentIcon />
            Change Summary
          </h3>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--hb-space-lg)',
              flexWrap: 'wrap',
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
                {summary.additions || 0}
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
                {summary.edits || 0}
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
                {summary.removals || 0}
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
                {summary.totalChanges || 0}
              </span>
              <span
                style={{
                  fontSize: 'var(--hb-font-size-sm)',
                  color: 'var(--hb-secondary-gray)',
                }}
              >
                Total Change{(summary.totalChanges || 0) !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Account details section */}
      {selectedAccount && (
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
      )}

      {/* Controlling party section */}
      {user && (
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
      )}

      {/* Next steps section */}
      <div
        style={{
          marginBottom: 'var(--hb-space-lg)',
          padding: 'var(--hb-space-lg)',
          backgroundColor: 'var(--hb-alert-info-bg)',
          borderRadius: 'var(--hb-radius-md)',
          border: '1px solid var(--hb-alert-info-border)',
        }}
      >
        <h3
          style={{
            fontSize: 'var(--hb-font-size-base)',
            fontWeight: 500,
            color: 'var(--hb-alert-info-text)',
            marginBottom: 'var(--hb-space-md)',
          }}
        >
          Next Steps
        </h3>

        <ul
          style={{
            fontSize: 'var(--hb-font-size-sm)',
            color: 'var(--hb-alert-info-text)',
            margin: 0,
            paddingLeft: 'var(--hb-space-lg)',
            listStyle: 'disc',
            lineHeight: 1.6,
          }}
        >
          <li style={{ marginBottom: 'var(--hb-space-xs)' }}>
            Your changes have been recorded and are being processed. No further action is required at this time.
          </li>
          <li style={{ marginBottom: 'var(--hb-space-xs)' }}>
            Save or print this confirmation for your records. The confirmation ID above can be used to reference this submission.
          </li>
          <li style={{ marginBottom: 'var(--hb-space-xs)' }}>
            Newly added signers will receive an invitation email at their registered email address with instructions to complete enrollment.
          </li>
          <li style={{ marginBottom: 'var(--hb-space-xs)' }}>
            Removed signers will have their access revoked and any associated cards will be deactivated.
          </li>
          <li>
            If you need to make additional changes, you can start a new submission from the signer management screen.
          </li>
        </ul>
      </div>

      {/* Important notice */}
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
            This submission has been finalized and cannot be modified through this portal.
          </li>
          <li style={{ marginBottom: 'var(--hb-space-xs)' }}>
            If you need to reverse or modify any changes, please contact your system administrator.
          </li>
          <li>
            All actions have been recorded in the audit log for compliance purposes.
          </li>
        </ul>
      </div>

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--hb-space-sm)',
        }}
      >
        {/* Print button */}
        <Button
          variant="secondary"
          label="Print Confirmation"
          onClick={handlePrint}
          ariaLabel="Print or save this confirmation"
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--hb-space-sm)',
          }}
        >
          {/* Submit button — disabled to prevent duplicate submissions */}
          <Button
            variant="primary"
            label="Submit Changes"
            disabled
            ariaLabel="Changes have already been submitted"
          />

          {typeof onStartNew === 'function' && (
            <Button
              variant="secondary"
              label="Start New"
              onClick={handleStartNew}
              ariaLabel="Start a new signer management workflow"
            />
          )}

          {typeof onDone === 'function' && (
            <Button
              variant="primary"
              label="Done"
              onClick={handleDone}
              ariaLabel="Return to the main screen"
            />
          )}
        </div>
      </div>
    </div>
  );
}

SubmissionConfirmation.propTypes = {
  onDone: PropTypes.func,
  onStartNew: PropTypes.func,
  className: PropTypes.string,
};

export default SubmissionConfirmation;