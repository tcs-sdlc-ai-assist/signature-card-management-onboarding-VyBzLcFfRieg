/**
 * Reusable alert/notification component.
 *
 * Renders an accessible alert banner using HB CSS framework classes.
 * Supports four severity levels (critical/error, warning, success, info),
 * optional dismiss button, and configurable ARIA live region behaviour.
 *
 * @module Alert
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { ALERT_TYPES } from '../../constants/constants.js';

/**
 * Maps the public `type` prop values to the corresponding HB CSS class names.
 * Accepts both "error" and "critical" as aliases for the critical alert style.
 *
 * @param {string} type - The alert type.
 * @returns {string} The HB CSS class name.
 */
function getAlertClassName(type) {
  switch (type) {
    case ALERT_TYPES.CRITICAL:
    case 'error':
      return 'hb-alert-critical';
    case ALERT_TYPES.WARNING:
      return 'hb-alert-warning';
    case ALERT_TYPES.SUCCESS:
      return 'hb-alert-success';
    case ALERT_TYPES.INFO:
      return 'hb-alert-info';
    default:
      return 'hb-alert-info';
  }
}

/**
 * Returns the appropriate SVG icon for the alert type.
 *
 * @param {string} type - The alert type.
 * @returns {React.ReactElement} An SVG icon element.
 */
function AlertIcon({ type }) {
  switch (type) {
    case ALERT_TYPES.CRITICAL:
    case 'error':
      return (
        <svg
          className="alert-icon"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    case ALERT_TYPES.WARNING:
      return (
        <svg
          className="alert-icon"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );
    case ALERT_TYPES.SUCCESS:
      return (
        <svg
          className="alert-icon"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    case ALERT_TYPES.INFO:
    default:
      return (
        <svg
          className="alert-icon"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
}

AlertIcon.propTypes = {
  type: PropTypes.string.isRequired,
};

/**
 * Returns the appropriate ARIA role for the alert type.
 * Critical and error alerts use "alert" for immediate announcement;
 * all others use "status" for polite announcement.
 *
 * @param {string} type - The alert type.
 * @returns {string} The ARIA role.
 */
function getAriaRole(type) {
  if (type === ALERT_TYPES.CRITICAL || type === 'error') {
    return 'alert';
  }
  return 'status';
}

/**
 * Returns the default ARIA live value for the alert type.
 *
 * @param {string} type - The alert type.
 * @returns {string} The aria-live value.
 */
function getDefaultAriaLive(type) {
  if (type === ALERT_TYPES.CRITICAL || type === 'error') {
    return 'assertive';
  }
  return 'polite';
}

/**
 * Reusable alert/notification component.
 *
 * Renders an accessible alert banner with an icon, message text, and an
 * optional dismiss button. Uses HB CSS framework alert classes for styling.
 *
 * @param {Object} props
 * @param {string} props.type - The alert severity level. One of
 *   `'error'`, `'critical'`, `'warning'`, `'success'`, or `'info'`.
 * @param {string} props.message - The alert message text to display.
 * @param {function} [props.onDismiss] - Callback invoked when the dismiss
 *   button is clicked. When provided and `dismissible` is `true`, a close
 *   button is rendered.
 * @param {boolean} [props.dismissible=false] - Whether the alert can be
 *   dismissed by the user.
 * @param {string} [props.ariaLive] - Override for the `aria-live` attribute.
 *   Defaults to `'assertive'` for error/critical and `'polite'` for others.
 * @param {string} [props.className] - Additional CSS class names to apply.
 * @returns {React.ReactElement|null} The rendered alert, or `null` if no
 *   message is provided.
 */
export function Alert({
  type = ALERT_TYPES.INFO,
  message,
  onDismiss = null,
  dismissible = false,
  ariaLive,
  className = '',
}) {
  const handleDismiss = useCallback(() => {
    if (typeof onDismiss === 'function') {
      onDismiss();
    }
  }, [onDismiss]);

  // Do not render if there is no message
  if (!message || (typeof message === 'string' && message.trim().length === 0)) {
    return null;
  }

  const alertClassName = getAlertClassName(type);
  const role = getAriaRole(type);
  const liveValue = ariaLive || getDefaultAriaLive(type);
  const showDismiss = dismissible && typeof onDismiss === 'function';

  const combinedClassName = [alertClassName, className].filter(Boolean).join(' ');

  return (
    <div
      className={combinedClassName}
      role={role}
      aria-live={liveValue}
      aria-atomic="true"
    >
      <AlertIcon type={type} />
      <span style={{ flex: 1 }}>{message}</span>
      {showDismiss && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss alert"
          style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            padding: 0,
            border: 'none',
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
            borderRadius: 'var(--hb-radius-sm)',
            fontSize: 'var(--hb-font-size-lg)',
            lineHeight: 1,
            marginLeft: 'var(--hb-space-sm)',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

Alert.propTypes = {
  type: PropTypes.oneOf([
    'error',
    'critical',
    'warning',
    'success',
    'info',
    ALERT_TYPES.CRITICAL,
    ALERT_TYPES.WARNING,
    ALERT_TYPES.SUCCESS,
    ALERT_TYPES.INFO,
  ]),
  message: PropTypes.string,
  onDismiss: PropTypes.func,
  dismissible: PropTypes.bool,
  ariaLive: PropTypes.oneOf(['assertive', 'polite', 'off']),
  className: PropTypes.string,
};

export default Alert;