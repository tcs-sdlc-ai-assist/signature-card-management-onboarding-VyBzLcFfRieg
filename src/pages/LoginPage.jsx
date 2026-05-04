/**
 * Login page component.
 *
 * Renders the {@link LoginForm} within the page layout. Handles navigation
 * to the verification page on successful login. Shows a session expired
 * message if the user was redirected from a session timeout.
 *
 * Uses {@link AuthContext} for authentication state and {@link AppLayout}
 * for the page shell. Does not require authentication — accessible to
 * unauthenticated visitors.
 *
 * Uses HB CSS framework classes for styling consistency.
 *
 * @module LoginPage
 */

import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext.jsx';
import { AppLayout } from '../components/layout/AppLayout.jsx';
import { LoginForm } from '../components/auth/LoginForm.jsx';
import { Alert } from '../components/common/Alert.jsx';
import { ALERT_TYPES } from '../constants/constants.js';
import { LOGIN_MESSAGES } from '../constants/messages.js';

/**
 * Shield SVG icon for the login page branding area.
 *
 * @returns {React.ReactElement} An SVG shield icon.
 */
function ShieldIcon() {
  return (
    <svg
      width="48"
      height="48"
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
 * Login page component.
 *
 * Renders the login form within the application layout. Detects
 * successful authentication via {@link AuthContext} and invokes the
 * `onLoginSuccess` callback to navigate to the verification page.
 * Displays a session expired alert when the `sessionExpired` prop
 * is `true` (e.g. when redirected from a session timeout).
 *
 * @param {Object} [props]
 * @param {function} [props.onLoginSuccess] - Callback invoked when the
 *   user successfully logs in. Typically navigates to the verification
 *   or dashboard page.
 * @param {boolean} [props.sessionExpired=false] - Whether the user was
 *   redirected due to a session timeout. When `true`, a session expired
 *   alert is displayed above the login form.
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the page wrapper element.
 * @returns {React.ReactElement} The rendered login page.
 */
export function LoginPage({
  onLoginSuccess = null,
  sessionExpired = false,
  className = '',
}) {
  const { isAuthenticated, isVerified } = useAuth();

  const [showSessionExpired, setShowSessionExpired] = useState(sessionExpired);

  /**
   * Dismisses the session expired alert.
   */
  const handleDismissSessionExpired = useCallback(() => {
    setShowSessionExpired(false);
  }, []);

  /**
   * Navigates to the next step when the user is authenticated.
   * If the user is already authenticated (e.g. session restored),
   * invoke the success callback immediately.
   */
  useEffect(() => {
    if (isAuthenticated) {
      if (typeof onLoginSuccess === 'function') {
        try {
          onLoginSuccess();
        } catch {
          // Callback errors must not break the page flow.
        }
      }
    }
  }, [isAuthenticated, onLoginSuccess]);

  /**
   * Sync the sessionExpired prop with local state when it changes.
   */
  useEffect(() => {
    if (sessionExpired) {
      setShowSessionExpired(true);
    }
  }, [sessionExpired]);

  const wrapperClassName = [className].filter(Boolean).join(' ');

  return (
    <AppLayout>
      <div
        className={wrapperClassName}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 200px)',
          paddingTop: 'var(--hb-space-xl)',
          paddingBottom: 'var(--hb-space-xl)',
        }}
      >
        {/* Branding area */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--hb-space-sm)',
            marginBottom: 'var(--hb-space-xl)',
          }}
        >
          <ShieldIcon />
          <p
            style={{
              fontSize: 'var(--hb-font-size-sm)',
              color: 'var(--hb-secondary-gray)',
              textAlign: 'center',
              margin: 0,
              maxWidth: '360px',
              lineHeight: 1.6,
            }}
          >
            Sign in to access the secure card management portal.
          </p>
        </div>

        {/* Session expired alert */}
        {showSessionExpired && (
          <div
            style={{
              width: '100%',
              maxWidth: '400px',
            }}
          >
            <Alert
              type={ALERT_TYPES.WARNING}
              message={LOGIN_MESSAGES.SESSION_EXPIRED}
              dismissible
              onDismiss={handleDismissSessionExpired}
            />
          </div>
        )}

        {/* Login form */}
        <LoginForm />

        {/* Footer help text */}
        <p
          style={{
            fontSize: 'var(--hb-font-size-xs)',
            color: 'var(--hb-secondary-gray)',
            textAlign: 'center',
            marginTop: 'var(--hb-space-xl)',
            maxWidth: '400px',
            lineHeight: 1.6,
          }}
        >
          Need help? Contact your system administrator or call support at{' '}
          <a
            href="tel:+18005551234"
            style={{
              color: 'var(--hb-primary-blue)',
              textDecoration: 'none',
            }}
            aria-label="Call support at 1-800-555-1234"
          >
            1-800-555-1234
          </a>
          .
        </p>
      </div>
    </AppLayout>
  );
}

LoginPage.propTypes = {
  onLoginSuccess: PropTypes.func,
  sessionExpired: PropTypes.bool,
  className: PropTypes.string,
};

export default LoginPage;