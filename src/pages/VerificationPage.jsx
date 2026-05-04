/**
 * Identity verification page component.
 *
 * Renders the {@link IdentityVerificationForm} within the page layout.
 * Handles navigation to the token validation page on successful verification.
 * Requires authenticated state — redirects to login if the user is not
 * authenticated.
 *
 * Uses {@link AuthContext} for authentication and verification state and
 * {@link AppLayout} for the page shell.
 *
 * Uses HB CSS framework classes for styling consistency.
 *
 * @module VerificationPage
 */

import React, { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext.jsx';
import { AppLayout } from '../components/layout/AppLayout.jsx';
import { IdentityVerificationForm } from '../components/auth/IdentityVerificationForm.jsx';
import { Alert } from '../components/common/Alert.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { ALERT_TYPES } from '../constants/constants.js';
import { LOGIN_MESSAGES } from '../constants/messages.js';

/**
 * Shield SVG icon for the verification page branding area.
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
 * Identity verification page component.
 *
 * Renders the identity verification form within the application layout.
 * Detects successful verification via {@link AuthContext} and invokes the
 * `onVerificationSuccess` callback to navigate to the token validation
 * page. Redirects unauthenticated users to the login page via the
 * `onLoginRedirect` callback.
 *
 * @param {Object} [props]
 * @param {function} [props.onVerificationSuccess] - Callback invoked when
 *   the user successfully completes identity verification. Typically
 *   navigates to the token validation or dashboard page.
 * @param {function} [props.onLoginRedirect] - Callback invoked when the
 *   user is not authenticated and needs to be redirected to the login page.
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the page wrapper element.
 * @returns {React.ReactElement} The rendered verification page.
 */
export function VerificationPage({
  onVerificationSuccess = null,
  onLoginRedirect = null,
  className = '',
}) {
  const { isAuthenticated, isVerified, loading } = useAuth();

  /**
   * Redirects unauthenticated users to the login page.
   */
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      if (typeof onLoginRedirect === 'function') {
        try {
          onLoginRedirect();
        } catch {
          // Callback errors must not break the page flow.
        }
      }
    }
  }, [loading, isAuthenticated, onLoginRedirect]);

  /**
   * Navigates to the next step when the user is verified.
   * If the user is already verified (e.g. session restored),
   * invoke the success callback immediately.
   */
  useEffect(() => {
    if (isAuthenticated && isVerified) {
      if (typeof onVerificationSuccess === 'function') {
        try {
          onVerificationSuccess();
        } catch {
          // Callback errors must not break the page flow.
        }
      }
    }
  }, [isAuthenticated, isVerified, onVerificationSuccess]);

  /**
   * Handles successful verification from the form component.
   */
  const handleVerificationSuccess = useCallback(() => {
    if (typeof onVerificationSuccess === 'function') {
      try {
        onVerificationSuccess();
      } catch {
        // Callback errors must not break the page flow.
      }
    }
  }, [onVerificationSuccess]);

  /**
   * Handles the login redirect action from the unauthenticated state.
   */
  const handleLoginRedirect = useCallback(() => {
    if (typeof onLoginRedirect === 'function') {
      try {
        onLoginRedirect();
      } catch {
        // Callback errors must not break the page flow.
      }
    }
  }, [onLoginRedirect]);

  const wrapperClassName = [className].filter(Boolean).join(' ');

  // Loading state — auth context is still initializing
  if (loading) {
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
          <LoadingSpinner size="medium" label="Checking authentication…" />
        </div>
      </AppLayout>
    );
  }

  // Unauthenticated state — show login required message
  if (!isAuthenticated) {
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
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 'var(--hb-space-md)',
            }}
          >
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
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>

            <h2
              style={{
                fontSize: 'var(--hb-font-size-h3)',
                fontWeight: 500,
                color: 'var(--hb-primary-black)',
                margin: 0,
              }}
            >
              Authentication Required
            </h2>

            <Alert
              type={ALERT_TYPES.CRITICAL}
              message={LOGIN_MESSAGES.LOGIN_REQUIRED}
            />

            <p
              style={{
                fontSize: 'var(--hb-font-size-sm)',
                color: 'var(--hb-secondary-gray)',
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              You must be logged in to access the identity verification page. Please sign in with your credentials to continue.
            </p>

            {typeof onLoginRedirect === 'function' && (
              <div style={{ marginTop: 'var(--hb-space-md)' }}>
                <button
                  type="button"
                  className="button-primary"
                  onClick={handleLoginRedirect}
                  aria-label="Go to login page"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

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
              maxWidth: '420px',
              lineHeight: 1.6,
            }}
          >
            Verify your identity to continue to the secure card management portal.
          </p>
        </div>

        {/* Identity verification form */}
        <IdentityVerificationForm
          onVerificationSuccess={handleVerificationSuccess}
        />

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
          Having trouble verifying your identity? Contact your system administrator or call support at{' '}
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

VerificationPage.propTypes = {
  onVerificationSuccess: PropTypes.func,
  onLoginRedirect: PropTypes.func,
  className: PropTypes.string,
};

export default VerificationPage;