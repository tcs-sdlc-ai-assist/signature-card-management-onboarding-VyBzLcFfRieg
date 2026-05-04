/**
 * Unsaved changes exit confirmation modal component.
 *
 * Warns the user about unsaved changes when attempting to leave the
 * current flow (cancel button, navigation, or browser back button).
 * Provides "Stay" and "Exit" action buttons. Uses the {@link Modal}
 * component for the dialog shell.
 *
 * Integrates with {@link AccountContext} for staged changes awareness
 * and uses HB CSS framework classes for styling consistency.
 *
 * @module ExitConfirmationModal
 */

import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal } from './Modal.jsx';
import { Alert } from './Alert.jsx';
import { ALERT_TYPES } from '../../constants/constants.js';
import { CONFIRMATION_MESSAGES } from '../../constants/messages.js';

/**
 * Warning icon SVG for the exit confirmation modal.
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
 * Unsaved changes exit confirmation modal component.
 *
 * Renders a modal dialog that warns the user about unsaved changes
 * when they attempt to leave the current flow. Provides two actions:
 *
 *   - **Stay** — dismisses the modal and keeps the user on the current
 *     page/step.
 *   - **Exit** — confirms the exit, discarding any unsaved changes.
 *
 * Optionally listens for the browser `beforeunload` event to warn
 * users when closing or refreshing the browser tab while unsaved
 * changes exist.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is currently visible.
 * @param {function} props.onStay - Callback invoked when the user clicks
 *   "Stay" to remain on the current page/step.
 * @param {function} props.onExit - Callback invoked when the user confirms
 *   they want to exit and discard unsaved changes.
 * @param {boolean} [props.hasUnsavedChanges=false] - Whether there are
 *   unsaved changes to warn about. When `true` and `interceptBrowserNav`
 *   is also `true`, the browser `beforeunload` event is intercepted.
 * @param {boolean} [props.interceptBrowserNav=false] - Whether to intercept
 *   the browser's `beforeunload` event when unsaved changes exist.
 * @param {string} [props.title='Unsaved Changes'] - The modal title.
 * @param {string} [props.message] - Custom warning message. When omitted,
 *   the default unsaved changes message from {@link CONFIRMATION_MESSAGES}
 *   is used.
 * @param {string} [props.stayLabel='Stay'] - Label for the stay button.
 * @param {string} [props.exitLabel='Exit'] - Label for the exit button.
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the modal dialog panel.
 * @returns {React.ReactElement|null} The rendered modal, or `null` when closed.
 */
export function ExitConfirmationModal({
  isOpen = false,
  onStay,
  onExit,
  hasUnsavedChanges = false,
  interceptBrowserNav = false,
  title = 'Unsaved Changes',
  message = '',
  stayLabel = 'Stay',
  exitLabel = 'Exit',
  className = '',
}) {
  const displayMessage = message || CONFIRMATION_MESSAGES.CANCEL_ACTION;

  /**
   * Handles the "Stay" action — dismisses the modal and keeps the user
   * on the current page/step.
   */
  const handleStay = useCallback(() => {
    if (typeof onStay === 'function') {
      onStay();
    }
  }, [onStay]);

  /**
   * Handles the "Exit" action — confirms the exit and discards unsaved
   * changes.
   */
  const handleExit = useCallback(() => {
    if (typeof onExit === 'function') {
      onExit();
    }
  }, [onExit]);

  /**
   * Intercepts the browser `beforeunload` event to warn the user about
   * unsaved changes when they attempt to close or refresh the tab.
   */
  useEffect(() => {
    if (!interceptBrowserNav || !hasUnsavedChanges) {
      return;
    }

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      // Modern browsers require returnValue to be set for the prompt to show.
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [interceptBrowserNav, hasUnsavedChanges]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleStay}
      title={title}
      showFooter={false}
      closeOnOverlayClick={true}
      closeOnEscape={true}
      ariaLabel="Unsaved changes confirmation"
      className={className}
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

        <p
          style={{
            margin: 0,
            fontSize: 'var(--hb-font-size-base)',
            fontWeight: 500,
            color: 'var(--hb-primary-black)',
          }}
        >
          You have unsaved changes
        </p>

        <p
          style={{
            margin: 0,
            fontSize: 'var(--hb-font-size-sm)',
            color: 'var(--hb-secondary-gray)',
            lineHeight: 1.6,
          }}
        >
          {displayMessage}
        </p>

        {hasUnsavedChanges && (
          <Alert
            type={ALERT_TYPES.WARNING}
            message="Any staged changes that have not been submitted will be lost if you exit now."
          />
        )}

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
            What would you like to do?
          </p>
          <ul
            style={{
              fontSize: 'var(--hb-font-size-sm)',
              color: 'var(--hb-secondary-gray)',
              margin: 0,
              paddingLeft: 'var(--hb-space-lg)',
              listStyle: 'disc',
              textAlign: 'left',
            }}
          >
            <li style={{ marginBottom: 'var(--hb-space-xs)' }}>
              Click <strong>&quot;{stayLabel}&quot;</strong> to return to your current work and keep your changes.
            </li>
            <li>
              Click <strong>&quot;{exitLabel}&quot;</strong> to leave and discard all unsaved changes.
            </li>
          </ul>
        </div>

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
            onClick={handleExit}
            aria-label="Exit and discard unsaved changes"
            style={{
              backgroundColor: 'var(--hb-primary-white)',
              color: 'var(--hb-secondary-red)',
              borderColor: 'var(--hb-secondary-red)',
            }}
          >
            {exitLabel}
          </button>
          <button
            type="button"
            className="button-primary"
            onClick={handleStay}
            aria-label="Stay and keep unsaved changes"
          >
            {stayLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

ExitConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onStay: PropTypes.func.isRequired,
  onExit: PropTypes.func.isRequired,
  hasUnsavedChanges: PropTypes.bool,
  interceptBrowserNav: PropTypes.bool,
  title: PropTypes.string,
  message: PropTypes.string,
  stayLabel: PropTypes.string,
  exitLabel: PropTypes.string,
  className: PropTypes.string,
};

export default ExitConfirmationModal;