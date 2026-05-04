/**
 * Session timeout warning modal component.
 *
 * Displays a countdown timer showing time remaining before auto-logout.
 * Provides a "Stay Logged In" button to reset the inactivity timer and
 * a "Log Out" button for manual logout. Integrates with the session
 * timeout state exposed by {@link AuthContext}.
 *
 * Uses the {@link Modal} component for the dialog shell and HB CSS
 * framework classes for styling consistency.
 *
 * @module SessionTimeoutModal
 */

import React, { useCallback } from 'react';
import { Modal } from '../common/Modal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { ALERT_TYPES } from '../../constants/constants.js';

/**
 * Warning icon SVG for the session timeout modal.
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
      style={{ color: 'var(--hb-secondary-orange)', flexShrink: 0 }}
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
 * Session timeout warning modal component.
 *
 * Renders a modal dialog when the user's session is about to expire
 * due to inactivity. Shows a countdown timer with the remaining time
 * and provides two actions:
 *
 *   - **Stay Logged In** — resets the inactivity timer and dismisses
 *     the warning.
 *   - **Log Out** — immediately logs the user out.
 *
 * The modal is controlled by the `sessionWarning` state from
 * {@link AuthContext}, which is driven by the {@link useSessionTimeout}
 * hook.
 *
 * @returns {React.ReactElement|null} The rendered modal, or `null` when
 *   the warning is not visible.
 */
export function SessionTimeoutModal() {
  const { logout, sessionWarning } = useAuth();

  const {
    isVisible,
    timeRemaining,
    dismiss,
    resetTimer,
  } = sessionWarning;

  /**
   * Handles the "Stay Logged In" action — resets the session timer
   * and dismisses the warning modal.
   */
  const handleStayLoggedIn = useCallback(() => {
    if (typeof dismiss === 'function') {
      dismiss();
    }
  }, [dismiss]);

  /**
   * Handles the "Log Out" action — immediately logs the user out.
   */
  const handleLogOut = useCallback(() => {
    if (typeof logout === 'function') {
      logout();
    }
  }, [logout]);

  if (!isVisible) {
    return null;
  }

  const displayTime = timeRemaining?.display || '0:00';
  const minutes = timeRemaining?.minutes ?? 0;
  const seconds = timeRemaining?.seconds ?? 0;

  return (
    <Modal
      isOpen={isVisible}
      onClose={handleStayLoggedIn}
      title="Session Expiring Soon"
      closeOnOverlayClick={false}
      closeOnEscape={false}
      showFooter={false}
      ariaLabel="Session timeout warning"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 'var(--hb-space-md)',
        }}
      >
        <WarningIcon />

        <p style={{ margin: 0, fontSize: 'var(--hb-font-size-base)', color: 'var(--hb-primary-black)' }}>
          Your session is about to expire due to inactivity.
        </p>

        <div
          aria-live="polite"
          aria-atomic="true"
          role="timer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--hb-space-md) var(--hb-space-lg)',
            backgroundColor: 'var(--hb-alert-warning-bg)',
            borderRadius: 'var(--hb-radius-md)',
            border: '1px solid var(--hb-alert-warning-border)',
            minWidth: '120px',
          }}
        >
          <span
            style={{
              fontSize: 'var(--hb-font-size-h2)',
              fontWeight: 700,
              color: 'var(--hb-secondary-orange)',
              lineHeight: 1.2,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {displayTime}
          </span>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 'var(--hb-font-size-sm)',
            color: 'var(--hb-secondary-gray)',
          }}
        >
          You will be automatically logged out when the timer reaches zero.
          Click &quot;Stay Logged In&quot; to continue your session.
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--hb-space-sm)',
            width: '100%',
            marginTop: 'var(--hb-space-sm)',
          }}
        >
          <button
            type="button"
            className="button-secondary-2"
            onClick={handleLogOut}
            aria-label="Log out now"
          >
            Log Out
          </button>
          <button
            type="button"
            className="button-primary"
            onClick={handleStayLoggedIn}
            aria-label="Stay logged in and reset session timer"
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default SessionTimeoutModal;