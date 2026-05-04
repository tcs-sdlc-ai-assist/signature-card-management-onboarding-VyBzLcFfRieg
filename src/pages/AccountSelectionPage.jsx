/**
 * Account selection page component.
 *
 * Renders the {@link AccountList} component within the page layout.
 * Handles navigation to signer management on account selection.
 * Protected route requiring full auth chain (authenticated, verified,
 * and token validated). Uses {@link AccountContext} for account data
 * and selection.
 *
 * Redirects unauthenticated users to login, unverified users to
 * verification, and users without valid tokens to token validation
 * via the respective callback props.
 *
 * Uses {@link AuthContext} for authentication, verification, and token
 * validation state. Uses {@link AppLayout} for the page shell.
 *
 * Uses HB CSS framework classes for styling consistency.
 *
 * @module AccountSelectionPage
 */

import React, { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext.jsx';
import { useAccount } from '../context/AccountContext.jsx';
import { AppLayout } from '../components/layout/AppLayout.jsx';
import { AccountList } from '../components/accounts/AccountList.jsx';
import { Alert } from '../components/common/Alert.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { ALERT_TYPES } from '../constants/constants.js';
import { LOGIN_MESSAGES, VERIFICATION_MESSAGES, TOKEN_MESSAGES } from '../constants/messages.js';

/**
 * Bank building SVG icon for the account selection page branding area.
 *
 * @returns {React.ReactElement} An SVG bank icon.
 */
function BankIcon() {
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
        d="M10.496 2.132a1 1 0 00-.992 0l-7 4A1 1 0 003 8v1a1 1 0 001 1h1v5H4a1 1 0 100 2h12a1 1 0 100-2h-1v-5h1a1 1 0 001-1V8a1 1 0 00.496-1.868l-7-4zM14 10H6v5h2v-3a1 1 0 012 0v3h2v-3a1 1 0 012 0v3h2v-5h-2z"
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
 * Key SVG icon for the token validation required state.
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
      style={{ color: 'var(--hb-secondary-orange)', flexShrink: 0 }}
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
 * Account selection page component.
 *
 * Renders the account list within the application layout. Detects
 * account selection via {@link AccountContext} and invokes the
 * `onAccountSelect` callback to navigate to signer management.
 * Requires full auth chain — redirects unauthenticated users to login,
 * unverified users to verification, and users without valid tokens to
 * token validation.
 *
 * @param {Object} [props]
 * @param {function} [props.onAccountSelect] - Callback invoked when the
 *   user selects an account. Typically navigates to the signer management
 *   page. Receives the selected account object.
 * @param {function} [props.onLoginRedirect] - Callback invoked when the
 *   user is not authenticated and needs to be redirected to the login page.
 * @param {function} [props.onVerificationRedirect] - Callback invoked when
 *   the user is authenticated but not verified and needs to be redirected
 *   to the verification page.
 * @param {function} [props.onTokenValidationRedirect] - Callback invoked when
 *   the user is authenticated and verified but has not validated their eSign
 *   token and needs to be redirected to the token validation page.
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the page wrapper element.
 * @returns {React.ReactElement} The rendered account selection page.
 */
export function AccountSelectionPage({
  onAccountSelect = null,
  onLoginRedirect = null,
  onVerificationRedirect = null,
  onTokenValidationRedirect = null,
  className = '',
}) {
  const { isAuthenticated, isVerified, isTokenValid, loading: authLoading } = useAuth();
  const { selectedAccount } = useAccount();

  /**
   * Redirects unauthenticated users to the login page.
   */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      if (typeof onLoginRedirect === 'function') {
        try {
          onLoginRedirect();
        } catch {
          // Callback errors must not break the page flow.
        }
      }
    }
  }, [authLoading, isAuthenticated, onLoginRedirect]);

  /**
   * Redirects authenticated but unverified users to the verification page.
   */
  useEffect(() => {
    if (!authLoading && isAuthenticated && !isVerified) {
      if (typeof onVerificationRedirect === 'function') {
        try {
          onVerificationRedirect();
        } catch {
          // Callback errors must not break the page flow.
        }
      }
    }
  }, [authLoading, isAuthenticated, isVerified, onVerificationRedirect]);

  /**
   * Redirects authenticated and verified users without a valid token
   * to the token validation page.
   */
  useEffect(() => {
    if (!authLoading && isAuthenticated && isVerified && !isTokenValid) {
      if (typeof onTokenValidationRedirect === 'function') {
        try {
          onTokenValidationRedirect();
        } catch {
          // Callback errors must not break the page flow.
        }
      }
    }
  }, [authLoading, isAuthenticated, isVerified, isTokenValid, onTokenValidationRedirect]);

  /**
   * Handles account selection from the AccountList component.
   *
   * @param {Object} account - The selected account object.
   */
  const handleAccountSelect = useCallback((account) => {
    if (typeof onAccountSelect === 'function') {
      try {
        onAccountSelect(account);
      } catch {
        // Callback errors must not break the page flow.
      }
    }
  }, [onAccountSelect]);

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

  /**
   * Handles the token validation redirect action from the token invalid state.
   */
  const handleTokenValidationRedirect = useCallback(() => {
    if (typeof onTokenValidationRedirect === 'function') {
      try {
        onTokenValidationRedirect();
      } catch {
        // Callback errors must not break the page flow.
      }
    }
  }, [onTokenValidationRedirect]);

  const wrapperClassName = [className].filter(Boolean).join(' ');

  // Loading state — auth context is still initializing
  if (authLoading) {
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
              You must be logged in to access the account selection page. Please sign in with your credentials to continue.
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
              Your identity must be verified before you can access the account selection page. Please complete the verification process to continue.
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

  // Authenticated and verified but token not validated — show token validation required message
  if (!isTokenValid) {
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
            <KeyIcon />

            <h2
              style={{
                fontSize: 'var(--hb-font-size-h3)',
                fontWeight: 500,
                color: 'var(--hb-primary-black)',
                margin: 0,
              }}
            >
              Token Validation Required
            </h2>

            <Alert
              type={ALERT_TYPES.WARNING}
              message={TOKEN_MESSAGES.TOKEN_INVALID}
            />

            <p
              style={{
                fontSize: 'var(--hb-font-size-sm)',
                color: 'var(--hb-secondary-gray)',
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Your eSign token must be validated before you can access the account selection page. Please complete the token validation process to continue.
            </p>

            {typeof onTokenValidationRedirect === 'function' && (
              <div style={{ marginTop: 'var(--hb-space-md)' }}>
                <button
                  type="button"
                  className="button-primary"
                  onClick={handleTokenValidationRedirect}
                  aria-label="Go to token validation"
                >
                  Validate Token
                </button>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Fully authenticated, verified, and token validated — show account selection
  return (
    <AppLayout>
      <div
        className={wrapperClassName}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
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
          <BankIcon />
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
            Select a business banking account to manage its authorized signers and cards.
          </p>
        </div>

        {/* Account list */}
        <div
          style={{
            width: '100%',
            maxWidth: '720px',
          }}
        >
          <AccountList
            onAccountSelect={handleAccountSelect}
          />
        </div>

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
          Don&apos;t see your account? Contact your system administrator or call support at{' '}
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

AccountSelectionPage.propTypes = {
  onAccountSelect: PropTypes.func,
  onLoginRedirect: PropTypes.func,
  onVerificationRedirect: PropTypes.func,
  onTokenValidationRedirect: PropTypes.func,
  className: PropTypes.string,
};

export default AccountSelectionPage;