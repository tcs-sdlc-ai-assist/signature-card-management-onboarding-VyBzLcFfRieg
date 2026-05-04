/**
 * Self-service resend invitation action component with rate-limiting UI.
 *
 * Displays the current attempt count (1–3), attempt-based messaging
 * (confirmation on attempt 1, warning on attempt 2, final warning on
 * attempt 3), and a "contact support" message when all attempts are
 * exhausted. Each resend generates a new invitation token and invalidates
 * the previous one. Integrates with {@link useRateLimitHook} for rate-limit
 * state and {@link AccountContext} for the resend action.
 *
 * All resend attempts are logged via {@link auditLogger}.
 *
 * Uses HB CSS framework classes for styling consistency.
 *
 * @module ResendInvitationAction
 */

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAccount } from '../../context/AccountContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useRateLimitHook } from '../../hooks/useRateLimitHook.js';
import { RATE_LIMIT_ACTIONS } from '../../services/rateLimiter.js';
import { logEvent, AUDIT_EVENT_TYPES } from '../../services/auditLogger.js';
import { Alert } from '../common/Alert.jsx';
import { Button } from '../common/Button.jsx';
import { LoadingSpinner } from '../common/LoadingSpinner.jsx';
import { Modal } from '../common/Modal.jsx';
import { ALERT_TYPES, SIGNER_STATUSES } from '../../constants/constants.js';
import { RESEND_MESSAGES } from '../../constants/messages.js';

/**
 * Envelope SVG icon for the resend invitation display.
 *
 * @returns {React.ReactElement} An SVG envelope icon.
 */
function EnvelopeIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ color: 'var(--hb-secondary-orange)', flexShrink: 0 }}
    >
      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
    </svg>
  );
}

/**
 * Success checkmark SVG icon for the success state.
 *
 * @returns {React.ReactElement} An SVG checkmark icon.
 */
function SuccessIcon() {
  return (
    <svg
      width="48"
      height="48"
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
 * Person SVG icon for the signer display.
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
 * Returns the alert type for the current attempt-based message.
 *
 * @param {number} attemptCount - The number of attempts used.
 * @param {boolean} isExhausted - Whether all attempts are exhausted.
 * @returns {string} The alert type constant.
 */
function getAttemptAlertType(attemptCount, isExhausted) {
  if (isExhausted) {
    return ALERT_TYPES.CRITICAL;
  }

  if (attemptCount >= 2) {
    return ALERT_TYPES.WARNING;
  }

  if (attemptCount === 1) {
    return ALERT_TYPES.SUCCESS;
  }

  return ALERT_TYPES.INFO;
}

/**
 * Self-service resend invitation action component.
 *
 * Renders a resend invitation interface for a pending signer with
 * rate-limiting awareness. Shows the current attempt count, attempt-based
 * messaging, and a confirmation dialog before performing the resend action.
 * Each resend generates a new invitation token and invalidates the previous.
 *
 * Integrates with {@link AccountContext} for the `resendInvitation` action
 * and {@link useRateLimitHook} for rate-limit state tracking.
 *
 * @param {Object} props
 * @param {Object|null} [props.signer=null] - The pending signer object
 *   to resend the invitation to. When `null`, a message is shown.
 * @param {function} [props.onResendSuccess] - Optional callback invoked
 *   when the resend action succeeds. Receives the result object.
 * @param {function} [props.onCancel] - Optional callback invoked when
 *   the user cancels the resend action.
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the wrapper element.
 * @returns {React.ReactElement} The rendered resend invitation action component.
 */
export function ResendInvitationAction({
  signer = null,
  onResendSuccess = null,
  onCancel = null,
  className = '',
}) {
  const { resendInvitation } = useAccount();
  const { user } = useAuth();

  const {
    attemptCount,
    remainingAttempts,
    maxAttempts,
    isExhausted,
    message: rateLimitMessage,
    performAction,
    refresh,
  } = useRateLimitHook(RATE_LIMIT_ACTIONS.RESEND, {
    signerId: signer?.id ?? null,
    userId: user?.id ?? null,
  });

  const [isResending, setIsResending] = useState(false);
  const [resendError, setResendError] = useState(null);
  const [resendSuccess, setResendSuccess] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  /**
   * Opens the confirmation modal before performing the resend.
   */
  const handleResendClick = useCallback(() => {
    if (isExhausted || !signer || !signer.id) {
      return;
    }

    setResendError(null);
    setResendSuccess(null);
    setConfirmModalOpen(true);
  }, [isExhausted, signer]);

  /**
   * Closes the confirmation modal without performing the resend.
   */
  const handleConfirmCancel = useCallback(() => {
    setConfirmModalOpen(false);
  }, []);

  /**
   * Confirms and executes the resend invitation action.
   */
  const handleConfirmResend = useCallback(() => {
    if (!signer || !signer.id || isExhausted) {
      setConfirmModalOpen(false);
      return;
    }

    setConfirmModalOpen(false);
    setIsResending(true);
    setResendError(null);
    setResendSuccess(null);

    try {
      // Log the resend attempt
      try {
        logEvent({
          eventType: AUDIT_EVENT_TYPES.SIGNER_RESEND,
          userId: user?.id ?? null,
          description: `Resend invitation attempt for signer "${signer.fullName || 'Unknown'}" (attempt ${attemptCount + 1} of ${maxAttempts}).`,
          details: {
            action: 'resend_invitation_attempt',
            signerId: signer.id,
            signerName: signer.fullName || `${signer.firstName || ''} ${signer.lastName || ''}`.trim(),
            attemptNumber: attemptCount + 1,
            maxAttempts,
          },
        });
      } catch {
        // Audit logging must never break the resend flow.
      }

      const result = resendInvitation(signer.id);

      // Refresh rate limit state after the action
      refresh();

      if (result.status === 'success') {
        setResendSuccess(
          result.message || RESEND_MESSAGES.RESEND_SUCCESS
        );
        setResendError(null);

        if (typeof onResendSuccess === 'function') {
          try {
            onResendSuccess(result);
          } catch {
            // Callback errors must not break the resend flow.
          }
        }
      } else {
        setResendError(
          result.message || RESEND_MESSAGES.RESEND_FAILED
        );
      }
    } catch {
      setResendError(RESEND_MESSAGES.RESEND_FAILED);
    } finally {
      setIsResending(false);
    }
  }, [signer, isExhausted, resendInvitation, user, attemptCount, maxAttempts, refresh, onResendSuccess]);

  /**
   * Handles the cancel button click.
   */
  const handleCancel = useCallback(() => {
    if (typeof onCancel === 'function') {
      try {
        onCancel();
      } catch {
        // Callback errors must not break the UI flow.
      }
    }
  }, [onCancel]);

  const signerName = signer
    ? signer.fullName || `${signer.firstName || ''} ${signer.lastName || ''}`.trim() || 'Unknown'
    : 'Unknown';

  const signerEmail = signer?.email || '';
  const isPending = signer?.status === SIGNER_STATUSES.PENDING;
  const isActionDisabled = isResending || isExhausted || !!resendSuccess || !isPending;

  /**
   * Determines the primary alert to display.
   *
   * @returns {{ type: string, message: string }|null}
   */
  const alertInfo = (() => {
    if (resendSuccess) {
      return {
        type: ALERT_TYPES.SUCCESS,
        message: resendSuccess,
      };
    }

    if (resendError) {
      return {
        type: ALERT_TYPES.CRITICAL,
        message: resendError,
      };
    }

    return null;
  })();

  /**
   * Determines the attempt-based message alert to display.
   *
   * @returns {{ type: string, message: string }|null}
   */
  const attemptAlertInfo = (() => {
    if (isExhausted) {
      return {
        type: ALERT_TYPES.CRITICAL,
        message: RESEND_MESSAGES.ATTEMPTS_EXHAUSTED,
      };
    }

    if (rateLimitMessage && attemptCount > 0 && !resendSuccess) {
      return {
        type: getAttemptAlertType(attemptCount, isExhausted),
        message: rateLimitMessage,
      };
    }

    return null;
  })();

  const wrapperClassName = [className].filter(Boolean).join(' ');

  // No signer provided
  if (!signer) {
    return (
      <div className={wrapperClassName}>
        <Alert
          type={ALERT_TYPES.WARNING}
          message="No signer selected for invitation resend. Please select a pending signer."
        />
      </div>
    );
  }

  // Signer is not pending
  if (!isPending && !resendSuccess) {
    return (
      <div className={wrapperClassName}>
        <Alert
          type={ALERT_TYPES.INFO}
          message={`Signer "${signerName}" is not in a pending status and does not need an invitation resend.`}
        />
        {typeof onCancel === 'function' && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 'var(--hb-space-md)',
            }}
          >
            <Button
              variant="secondary"
              label="Go Back"
              onClick={handleCancel}
              ariaLabel="Go back"
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
        maxWidth: '520px',
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
        Resend Invitation
      </h2>

      <p
        style={{
          textAlign: 'center',
          fontSize: 'var(--hb-font-size-sm)',
          color: 'var(--hb-secondary-gray)',
          marginBottom: 'var(--hb-space-lg)',
        }}
      >
        Resend the invitation to a pending signer. A new invitation token will be generated and the previous one will be invalidated.
      </p>

      {/* Screen reader status */}
      <div
        aria-live="polite"
        aria-atomic="true"
        role="status"
        className="sr-only"
      >
        {isResending && 'Resending invitation, please wait.'}
        {resendSuccess && resendSuccess}
        {resendError && `Error: ${resendError}`}
        {isExhausted && 'All resend attempts have been exhausted for today.'}
      </div>

      {/* Primary alert (success/error) */}
      {alertInfo && (
        <Alert
          type={alertInfo.type}
          message={alertInfo.message}
        />
      )}

      {/* Attempt-based messaging */}
      {attemptAlertInfo && !resendSuccess && (
        <Alert
          type={attemptAlertInfo.type}
          message={attemptAlertInfo.message}
        />
      )}

      {/* Attempt counter display */}
      {!resendSuccess && !isExhausted && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--hb-space-sm)',
            marginBottom: 'var(--hb-space-lg)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--hb-font-size-sm)',
              color: 'var(--hb-secondary-gray)',
            }}
          >
            Attempts used:
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--hb-space-xs)',
            }}
          >
            {Array.from({ length: maxAttempts }, (_, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor:
                    i < attemptCount
                      ? 'var(--hb-secondary-orange)'
                      : 'var(--hb-secondary-gray-light)',
                  transition: 'background-color var(--hb-transition-fast)',
                }}
                aria-hidden="true"
              />
            ))}
          </div>
          <span
            style={{
              fontSize: 'var(--hb-font-size-sm)',
              fontWeight: 500,
              color:
                remainingAttempts <= 1
                  ? 'var(--hb-secondary-red)'
                  : 'var(--hb-secondary-gray)',
            }}
          >
            {attemptCount} / {maxAttempts}
          </span>
        </div>
      )}

      {/* Loading state */}
      {isResending && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: 'var(--hb-space-md)',
          }}
        >
          <LoadingSpinner size="small" label="Resending invitation…" />
        </div>
      )}

      {/* Success state */}
      {resendSuccess && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--hb-space-md)',
            padding: 'var(--hb-space-lg) 0',
          }}
        >
          <SuccessIcon />

          <p
            style={{
              fontSize: 'var(--hb-font-size-base)',
              fontWeight: 500,
              color: 'var(--hb-secondary-green)',
              margin: 0,
              textAlign: 'center',
            }}
          >
            Invitation Resent Successfully
          </p>

          <p
            style={{
              fontSize: 'var(--hb-font-size-sm)',
              color: 'var(--hb-secondary-gray)',
              margin: 0,
              textAlign: 'center',
            }}
          >
            A new invitation has been sent to {signerName}. The previous invitation token has been invalidated.
          </p>

          {typeof onCancel === 'function' && (
            <div style={{ marginTop: 'var(--hb-space-md)' }}>
              <Button
                variant="secondary"
                label="Done"
                onClick={handleCancel}
                ariaLabel="Return to signer list"
              />
            </div>
          )}
        </div>
      )}

      {/* Exhausted state */}
      {isExhausted && !resendSuccess && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--hb-space-md)',
            padding: 'var(--hb-space-lg) 0',
          }}
        >
          <EnvelopeIcon />

          <p
            style={{
              fontSize: 'var(--hb-font-size-base)',
              fontWeight: 500,
              color: 'var(--hb-secondary-red)',
              margin: 0,
              textAlign: 'center',
            }}
          >
            Resend Attempts Exhausted
          </p>

          <div
            style={{
              backgroundColor: 'var(--hb-secondary-gray-lighter)',
              borderRadius: 'var(--hb-radius-md)',
              padding: 'var(--hb-space-md)',
              width: '100%',
            }}
          >
            <p
              style={{
                fontSize: 'var(--hb-font-size-sm)',
                color: 'var(--hb-primary-black)',
                fontWeight: 500,
                margin: '0 0 var(--hb-space-sm) 0',
              }}
            >
              What you can do:
            </p>
            <ul
              style={{
                fontSize: 'var(--hb-font-size-sm)',
                color: 'var(--hb-secondary-gray)',
                margin: 0,
                paddingLeft: 'var(--hb-space-lg)',
                listStyle: 'disc',
              }}
            >
              <li style={{ marginBottom: 'var(--hb-space-xs)' }}>
                Try again tomorrow — resend attempts reset daily.
              </li>
              <li style={{ marginBottom: 'var(--hb-space-xs)' }}>
                Contact your system administrator for immediate assistance.
              </li>
              <li>
                Call support at your institution&apos;s help desk for urgent requests.
              </li>
            </ul>
          </div>

          {typeof onCancel === 'function' && (
            <div style={{ marginTop: 'var(--hb-space-md)' }}>
              <Button
                variant="secondary"
                label="Go Back"
                onClick={handleCancel}
                ariaLabel="Return to signer list"
              />
            </div>
          )}
        </div>
      )}

      {/* Signer info and resend action — shown when not exhausted and not yet succeeded */}
      {!resendSuccess && !isExhausted && !isResending && (
        <>
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
              marginBottom: 'var(--hb-space-lg)',
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
                <span className="hb-badge hb-badge-warning">
                  Pending
                </span>
              </div>
              {signerEmail && (
                <span
                  style={{
                    display: 'block',
                    fontSize: 'var(--hb-font-size-sm)',
                    color: 'var(--hb-secondary-gray)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={signerEmail}
                >
                  {signerEmail}
                </span>
              )}
            </div>
            <EnvelopeIcon />
          </div>

          {/* Remaining attempts info */}
          {remainingAttempts > 0 && remainingAttempts < maxAttempts && (
            <Alert
              type={remainingAttempts === 1 ? ALERT_TYPES.WARNING : ALERT_TYPES.INFO}
              message={RESEND_MESSAGES.ATTEMPT_REMAINING(remainingAttempts)}
            />
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
                You have a maximum of {maxAttempts} resend attempts per day.
              </li>
              <li style={{ marginBottom: 'var(--hb-space-xs)' }}>
                A new invitation token will be generated and the previous one will be invalidated.
              </li>
              <li>
                The signer will receive a new invitation at their registered email address.
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
            {typeof onCancel === 'function' && (
              <Button
                variant="secondary"
                label="Cancel"
                onClick={handleCancel}
                disabled={isResending}
                ariaLabel="Cancel resend invitation action"
              />
            )}

            <Button
              variant="primary"
              label="Resend Invitation"
              onClick={handleResendClick}
              disabled={isActionDisabled}
              ariaLabel={`Resend invitation to ${signerName}`}
            />
          </div>
        </>
      )}

      {/* Confirmation modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={handleConfirmCancel}
        title="Confirm Resend Invitation"
        confirmLabel="Resend"
        cancelLabel="Cancel"
        onConfirm={handleConfirmResend}
        onCancel={handleConfirmCancel}
        closeOnOverlayClick={!isResending}
        closeOnEscape={!isResending}
        ariaLabel="Confirm resend invitation"
      >
        <div>
          <p
            style={{
              fontSize: 'var(--hb-font-size-base)',
              color: 'var(--hb-primary-black)',
              marginBottom: 'var(--hb-space-md)',
            }}
          >
            Are you sure you want to resend the invitation to{' '}
            <strong>{signerName}</strong>?
          </p>

          <p
            style={{
              fontSize: 'var(--hb-font-size-sm)',
              color: 'var(--hb-secondary-gray)',
              marginBottom: 'var(--hb-space-md)',
            }}
          >
            A new invitation token will be generated and sent to the signer&apos;s
            registered email address. The previous invitation token will be invalidated.
          </p>

          {remainingAttempts <= 1 && (
            <Alert
              type={ALERT_TYPES.WARNING}
              message="This is your last resend attempt for today. Please verify the signer details carefully before proceeding."
            />
          )}

          <p
            style={{
              fontSize: 'var(--hb-font-size-sm)',
              color: 'var(--hb-secondary-gray)',
              margin: 0,
            }}
          >
            Attempt {attemptCount + 1} of {maxAttempts}.
          </p>
        </div>
      </Modal>
    </div>
  );
}

ResendInvitationAction.propTypes = {
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
  onResendSuccess: PropTypes.func,
  onCancel: PropTypes.func,
  className: PropTypes.string,
};

export default ResendInvitationAction;