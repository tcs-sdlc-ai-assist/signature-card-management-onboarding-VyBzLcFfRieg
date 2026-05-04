/**
 * Self-service unlock signer action component with rate-limiting UI.
 *
 * Displays the current attempt count (1–3), attempt-based messaging
 * (confirmation on attempt 1, warning on attempt 2, final warning on
 * attempt 3), and a "contact support" message when all attempts are
 * exhausted. Integrates with {@link useRateLimitHook} for rate-limit
 * state and {@link AccountContext} for the unlock action.
 *
 * All unlock attempts are logged via {@link auditLogger}.
 *
 * Uses HB CSS framework classes for styling consistency.
 *
 * @module UnlockSignerAction
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
import { UNLOCK_MESSAGES } from '../../constants/messages.js';

/**
 * Lock SVG icon for the unlock action display.
 *
 * @returns {React.ReactElement} An SVG lock icon.
 */
function LockIcon() {
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
      <path
        fillRule="evenodd"
        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Unlocked SVG icon for the success state.
 *
 * @returns {React.ReactElement} An SVG unlocked icon.
 */
function UnlockedIcon() {
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
      <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
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
 * Self-service unlock signer action component.
 *
 * Renders an unlock interface for a locked signer with rate-limiting
 * awareness. Shows the current attempt count, attempt-based messaging,
 * and a confirmation dialog before performing the unlock action.
 *
 * Integrates with {@link AccountContext} for the `unlockSigner` action
 * and {@link useRateLimitHook} for rate-limit state tracking.
 *
 * @param {Object} props
 * @param {Object|null} [props.signer=null] - The locked signer object
 *   to unlock. When `null`, a message is shown.
 * @param {function} [props.onUnlockSuccess] - Optional callback invoked
 *   when the unlock action succeeds. Receives the result object.
 * @param {function} [props.onCancel] - Optional callback invoked when
 *   the user cancels the unlock action.
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the wrapper element.
 * @returns {React.ReactElement} The rendered unlock signer action component.
 */
export function UnlockSignerAction({
  signer = null,
  onUnlockSuccess = null,
  onCancel = null,
  className = '',
}) {
  const { unlockSigner } = useAccount();
  const { user } = useAuth();

  const {
    attemptCount,
    remainingAttempts,
    maxAttempts,
    isExhausted,
    message: rateLimitMessage,
    performAction,
    refresh,
  } = useRateLimitHook(RATE_LIMIT_ACTIONS.UNLOCK, {
    signerId: signer?.id ?? null,
    userId: user?.id ?? null,
  });

  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState(null);
  const [unlockSuccess, setUnlockSuccess] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  /**
   * Opens the confirmation modal before performing the unlock.
   */
  const handleUnlockClick = useCallback(() => {
    if (isExhausted || !signer || !signer.id) {
      return;
    }

    setUnlockError(null);
    setUnlockSuccess(null);
    setConfirmModalOpen(true);
  }, [isExhausted, signer]);

  /**
   * Closes the confirmation modal without performing the unlock.
   */
  const handleConfirmCancel = useCallback(() => {
    setConfirmModalOpen(false);
  }, []);

  /**
   * Confirms and executes the unlock action.
   */
  const handleConfirmUnlock = useCallback(() => {
    if (!signer || !signer.id || isExhausted) {
      setConfirmModalOpen(false);
      return;
    }

    setConfirmModalOpen(false);
    setIsUnlocking(true);
    setUnlockError(null);
    setUnlockSuccess(null);

    try {
      // Log the unlock attempt
      try {
        logEvent({
          eventType: AUDIT_EVENT_TYPES.SIGNER_UNLOCK,
          userId: user?.id ?? null,
          description: `Unlock attempt for signer "${signer.fullName || 'Unknown'}" (attempt ${attemptCount + 1} of ${maxAttempts}).`,
          details: {
            action: 'unlock_signer_attempt',
            signerId: signer.id,
            signerName: signer.fullName || `${signer.firstName || ''} ${signer.lastName || ''}`.trim(),
            attemptNumber: attemptCount + 1,
            maxAttempts,
          },
        });
      } catch {
        // Audit logging must never break the unlock flow.
      }

      const result = unlockSigner(signer.id);

      // Refresh rate limit state after the action
      refresh();

      if (result.status === 'success') {
        setUnlockSuccess(
          result.message || UNLOCK_MESSAGES.UNLOCK_SUCCESS
        );
        setUnlockError(null);

        if (typeof onUnlockSuccess === 'function') {
          try {
            onUnlockSuccess(result);
          } catch {
            // Callback errors must not break the unlock flow.
          }
        }
      } else {
        setUnlockError(
          result.message || UNLOCK_MESSAGES.UNLOCK_FAILED
        );
      }
    } catch {
      setUnlockError(UNLOCK_MESSAGES.UNLOCK_FAILED);
    } finally {
      setIsUnlocking(false);
    }
  }, [signer, isExhausted, unlockSigner, user, attemptCount, maxAttempts, refresh, onUnlockSuccess]);

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
  const isLocked = signer?.status === SIGNER_STATUSES.LOCKED;
  const isActionDisabled = isUnlocking || isExhausted || !!unlockSuccess || !isLocked;

  /**
   * Determines the primary alert to display.
   *
   * @returns {{ type: string, message: string }|null}
   */
  const alertInfo = (() => {
    if (unlockSuccess) {
      return {
        type: ALERT_TYPES.SUCCESS,
        message: unlockSuccess,
      };
    }

    if (unlockError) {
      return {
        type: ALERT_TYPES.CRITICAL,
        message: unlockError,
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
        message: UNLOCK_MESSAGES.ATTEMPTS_EXHAUSTED,
      };
    }

    if (rateLimitMessage && attemptCount > 0 && !unlockSuccess) {
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
          message="No signer selected for unlock. Please select a locked signer."
        />
      </div>
    );
  }

  // Signer is not locked
  if (!isLocked && !unlockSuccess) {
    return (
      <div className={wrapperClassName}>
        <Alert
          type={ALERT_TYPES.INFO}
          message={`Signer "${signerName}" is not currently locked and does not need to be unlocked.`}
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
        Unlock Signer
      </h2>

      <p
        style={{
          textAlign: 'center',
          fontSize: 'var(--hb-font-size-sm)',
          color: 'var(--hb-secondary-gray)',
          marginBottom: 'var(--hb-space-lg)',
        }}
      >
        Unlock a locked signer to restore their access and card functionality.
      </p>

      {/* Screen reader status */}
      <div
        aria-live="polite"
        aria-atomic="true"
        role="status"
        className="sr-only"
      >
        {isUnlocking && 'Unlocking signer, please wait.'}
        {unlockSuccess && unlockSuccess}
        {unlockError && `Error: ${unlockError}`}
        {isExhausted && 'All unlock attempts have been exhausted for today.'}
      </div>

      {/* Primary alert (success/error) */}
      {alertInfo && (
        <Alert
          type={alertInfo.type}
          message={alertInfo.message}
        />
      )}

      {/* Attempt-based messaging */}
      {attemptAlertInfo && !unlockSuccess && (
        <Alert
          type={attemptAlertInfo.type}
          message={attemptAlertInfo.message}
        />
      )}

      {/* Attempt counter display */}
      {!unlockSuccess && !isExhausted && (
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
      {isUnlocking && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: 'var(--hb-space-md)',
          }}
        >
          <LoadingSpinner size="small" label="Unlocking signer…" />
        </div>
      )}

      {/* Success state */}
      {unlockSuccess && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--hb-space-md)',
            padding: 'var(--hb-space-lg) 0',
          }}
        >
          <UnlockedIcon />

          <p
            style={{
              fontSize: 'var(--hb-font-size-base)',
              fontWeight: 500,
              color: 'var(--hb-secondary-green)',
              margin: 0,
              textAlign: 'center',
            }}
          >
            Signer Unlocked Successfully
          </p>

          <p
            style={{
              fontSize: 'var(--hb-font-size-sm)',
              color: 'var(--hb-secondary-gray)',
              margin: 0,
              textAlign: 'center',
            }}
          >
            {signerName} has been unlocked and their access has been restored.
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
      {isExhausted && !unlockSuccess && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--hb-space-md)',
            padding: 'var(--hb-space-lg) 0',
          }}
        >
          <LockIcon />

          <p
            style={{
              fontSize: 'var(--hb-font-size-base)',
              fontWeight: 500,
              color: 'var(--hb-secondary-red)',
              margin: 0,
              textAlign: 'center',
            }}
          >
            Unlock Attempts Exhausted
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
                Try again tomorrow — unlock attempts reset daily.
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

      {/* Signer info and unlock action — shown when not exhausted and not yet succeeded */}
      {!unlockSuccess && !isExhausted && !isUnlocking && (
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
                <span className="hb-badge hb-badge-error">
                  Locked
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
            <LockIcon />
          </div>

          {/* Remaining attempts info */}
          {remainingAttempts > 0 && remainingAttempts < maxAttempts && (
            <Alert
              type={remainingAttempts === 1 ? ALERT_TYPES.WARNING : ALERT_TYPES.INFO}
              message={UNLOCK_MESSAGES.ATTEMPT_REMAINING(remainingAttempts)}
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
                You have a maximum of {maxAttempts} unlock attempts per day.
              </li>
              <li style={{ marginBottom: 'var(--hb-space-xs)' }}>
                Unlocking will restore the signer&apos;s access and card functionality.
              </li>
              <li>
                This action will be staged for review before final submission.
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
                disabled={isUnlocking}
                ariaLabel="Cancel unlock action"
              />
            )}

            <Button
              variant="primary"
              label="Unlock Signer"
              onClick={handleUnlockClick}
              disabled={isActionDisabled}
              ariaLabel={`Unlock signer ${signerName}`}
            />
          </div>
        </>
      )}

      {/* Confirmation modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={handleConfirmCancel}
        title="Confirm Unlock"
        confirmLabel="Unlock"
        cancelLabel="Cancel"
        onConfirm={handleConfirmUnlock}
        onCancel={handleConfirmCancel}
        closeOnOverlayClick={!isUnlocking}
        closeOnEscape={!isUnlocking}
        ariaLabel="Confirm signer unlock"
      >
        <div>
          <p
            style={{
              fontSize: 'var(--hb-font-size-base)',
              color: 'var(--hb-primary-black)',
              marginBottom: 'var(--hb-space-md)',
            }}
          >
            Are you sure you want to unlock{' '}
            <strong>{signerName}</strong>?
          </p>

          <p
            style={{
              fontSize: 'var(--hb-font-size-sm)',
              color: 'var(--hb-secondary-gray)',
              marginBottom: 'var(--hb-space-md)',
            }}
          >
            This will restore the signer&apos;s access and card functionality.
            This action will be staged for review.
          </p>

          {remainingAttempts <= 1 && (
            <Alert
              type={ALERT_TYPES.WARNING}
              message="This is your last unlock attempt for today. Please verify the signer details carefully before proceeding."
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

UnlockSignerAction.propTypes = {
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
  onUnlockSuccess: PropTypes.func,
  onCancel: PropTypes.func,
  className: PropTypes.string,
};

export default UnlockSignerAction;