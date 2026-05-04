/**
 * eSign token validation page component.
 *
 * Renders the {@link TokenValidationStatus} component within the page layout.
 * Extracts the token from URL search parameters or session state. Handles
 * navigation to account selection on successful token validation. Requires
 * authenticated and verified state — redirects unauthenticated users to
 * login and unverified users to verification.
 *
 * Uses {@link AuthContext} for authentication, verification, and token
 * validation state. Uses {@link AppLayout} for the page shell.
 *
 * Uses HB CSS framework classes for styling consistency.
 *
 * @module TokenValidationPage
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext.jsx';
import { AppLayout } from '../components/layout/AppLayout.jsx';
import { TokenValidationStatus } from '../components/auth/TokenValidationStatus.jsx';
import { Alert } from '../components/common/Alert.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { ALERT_TYPES } from '../constants/constants.js';
import { LOGIN_MESSAGES, VERIFICATION_MESSAGES } from '../constants/messages.js';

/**
 * Key SVG icon for the token validation page branding area.
 *
 * @returns {React.ReactElement} An SVG key icon.
 */
function KeyIcon() {
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
        d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Lock SVG icon for the unauthenticated state.
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
      style={{ color: 'var(--hb-secondary-red)', flexShrink: 0 }}
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
 * Shield SVG icon for the unverified state.
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
      style={{ color: 'var(--hb-secondary-orange)', flexShrink: 0 }}
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
 * Extracts the token from the current URL search parameters.
 *
 * @returns {string|null} The token string, or null if not present.
 */
function getTokenFromURL() {
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token && typeof token === 'string' && token.trim().length > 0) {
      return token.trim();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * eSign token validation page component.
 *
 * Renders the token validation form within the application layout.
 * Extracts the token from URL search parameters or session state.
 * Detects successful token validation via {@link AuthContext} and invokes
 * the `onTokenValidationSuccess` callback to navigate to account selection.
 * Redirects unauthenticated users to the login page via the
 * `onLoginRedirect` callback and unverified users to the verification
 * page via the `onVerificationRedirect` callback.
 *
 * @param {Object} [props]
 * @param {function} [props.onTokenValidationSuccess] - Callback invoked when
 *   the user successfully validates their eSign token. Typically navigates
 *   to the account selection or dashboard page.
 * @param {function} [props.onLoginRedirect] - Callback invoked when the
 *   user is not authenticated and needs to be redirected to the login page.
 * @param {function} [props.onVerificationRedirect] - Callback invoked when
 *   the user is authenticated but not verified and needs to be redirected
 *   to the verification page.
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the page wrapper element.
 * @returns {React.ReactElement} The rendered token validation page.
 */
export function TokenValidationPage({
  onTokenValidationSuccess = null,
  onLoginRedirect = null,
  onVerificationRedirect = null,
  className = '',
}) {
  const { isAuthenticated, isVerified, isTokenValid, loading } = useAuth();

  /**
   * Extracts the token from URL parameters on mount.
   */
  const urlToken = useMemo(() => getTokenFromURL(), []);

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
   * Redirects authenticated but unverified users to the verification page.
   */
  useEffect(() => {
    if (!loading && isAuthenticated && !isVerified) {
      if (typeof onVerificationRedirect === 'function') {
        try {
          onVerificationRedirect();
        } catch {
          // Callback errors must not break the page flow.
        }
      }
    }
  }, [loading, isAuthenticated, isVerified, onVerificationRedirect]);

  /**
   * Navigates to the next step when the token is validated.
   * If the user already has a valid token (e.g. session restored),
   * invoke the success callback immediately.
   */
  useEffect(() => {
    if (isAuthenticated && isVerified && isTokenValid) {
      if (typeof onTokenValidationSuccess === 'function') {
        try {
          onTokenValidationSuccess();
        } catch {
          // Callback errors must not break the page flow.
        }
      }
    }
  }, [isAuthenticated, isVerified, isTokenValid, onTokenValidationSuccess]);

  /**
   * Handles successful token validation from the form component.
   */
  const handleValidationSuccess = useCallback(() => {
    if (typeof onTokenValidationSuccess === 'function') {
      try {
        onTokenValidationSuccess();
      } catch {
        // Callback errors must not break the page flow.
      }
    }
  }, [onTokenValidationSuccess]);

  /**
   * Handles the proceed action after successful validation.
   */
  const handleProceed = useCallback(() => {
    if (typeof onTokenValidationSuccess === 'function') {
      try {
        onTokenValidationSuccess();
      } catch {
        // Callback errors must not break the page flow.
      }
    }
  }, [onTokenValidationSuccess]);

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

  /**
   * Handles the verification redirect action from the unverified state.
   */
  const handleVerificationRedirect = useCallback(() => {
    if (typeof onVerificationRedirect === 'function') {
      try {
        onVerificationRedirect();
      } catch {
        // Callback errors must not break the page flow.
      }
    }
  }, [onVerificationRedirect]);

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
            <LockIcon />

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
              You must be logged in to access the token validation page. Please sign in with your credentials to continue.
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

  // Authenticated but not verified — show verification required message
  if (!isVerified) {
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
            <ShieldIcon />

            <h2
              style={{
                fontSize: 'var(--hb-font-size-h3)',
                fontWeight: 500,
                color: 'var(--hb-primary-black)',
                margin: 0,
              }}
            >
              Identity Verification Required
            </h2>

            <Alert
              type={ALERT_TYPES.WARNING}
              message={VERIFICATION_MESSAGES.VERIFICATION_REQUIRED}
            />

            <p
              style={{
                fontSize: 'var(--hb-font-size-sm)',
                color: 'var(--hb-secondary-gray)',
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Your identity must be verified before you can validate your eSign token. Please complete the verification process to continue.
            </p>

            {typeof onVerificationRedirect === 'function' && (
              <div style={{ marginTop: 'var(--hb-space-md)' }}>
                <button
                  type="button"
                  className="button-primary"
                  onClick={handleVerificationRedirect}
                  aria-label="Go to identity verification"
                >
                  Verify Identity
                </button>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Authenticated and verified — show token validation form
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
          <KeyIcon />
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
            Validate your eSign confirmation token to proceed with card management actions.
          </p>
        </div>

        {/* URL token info */}
        {urlToken && (
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              marginBottom: 'var(--hb-space-md)',
            }}
          >
            <Alert
              type={ALERT_TYPES.INFO}
              message="A token was detected from the URL. It has been pre-loaded for validation."
            />
          </div>
        )}

        {/* Token validation status component */}
        <TokenValidationStatus
          onValidationSuccess={handleValidationSuccess}
          onProceed={handleProceed}
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
          Having trouble with your eSign token? Contact your system administrator or call support at{' '}
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

TokenValidationPage.propTypes = {
  onTokenValidationSuccess: PropTypes.func,
  onLoginRedirect: PropTypes.func,
  onVerificationRedirect: PropTypes.func,
  className: PropTypes.string,
};

export default TokenValidationPage;