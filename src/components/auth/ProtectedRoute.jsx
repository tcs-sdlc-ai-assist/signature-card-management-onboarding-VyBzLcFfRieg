/**
 * Authentication route guard component.
 *
 * Checks authentication, verification, and token validation status via
 * {@link AuthContext}. Redirects unauthenticated users to login,
 * unverified users to verification, and users without valid tokens to
 * token validation. Renders children only when all auth checks pass.
 *
 * Supports configurable requirement levels — callers can opt out of
 * verification or token validation checks for routes that only require
 * basic authentication.
 *
 * Uses HB CSS framework classes for styling consistency.
 *
 * @module ProtectedRoute
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext.jsx';
import { LoadingSpinner } from '../common/LoadingSpinner.jsx';
import { Alert } from '../common/Alert.jsx';
import { ALERT_TYPES } from '../../constants/constants.js';
import { LOGIN_MESSAGES, VERIFICATION_MESSAGES, TOKEN_MESSAGES } from '../../constants/messages.js';

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
 * Key SVG icon for the token validation state.
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
 * Authentication route guard component.
 *
 * Checks the current authentication, verification, and token validation
 * status from {@link AuthContext} and renders the appropriate state:
 *
 *   - **Loading** — shows a loading spinner while auth state initializes.
 *   - **Unauthenticated** — shows a login required message with a redirect
 *     prompt when the user is not logged in.
 *   - **Unverified** — shows a verification required message when the user
 *     is authenticated but has not completed identity verification.
 *     Only checked when `requireVerification` is `true`.
 *   - **Token invalid** — shows a token validation required message when
 *     the user is authenticated and verified but has not validated their
 *     eSign token. Only checked when `requireTokenValidation` is `true`.
 *   - **Authorized** — renders the children when all required checks pass.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The protected content to render
 *   when all auth checks pass.
 * @param {boolean} [props.requireVerification=true] - Whether identity
 *   verification is required to access the protected content.
 * @param {boolean} [props.requireTokenValidation=false] - Whether eSign
 *   token validation is required to access the protected content.
 * @param {function} [props.onLoginRedirect] - Optional callback invoked
 *   when the user needs to log in. Can be used to trigger navigation.
 * @param {function} [props.onVerificationRedirect] - Optional callback
 *   invoked when the user needs to complete verification.
 * @param {function} [props.onTokenValidationRedirect] - Optional callback
 *   invoked when the user needs to validate their eSign token.
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the wrapper element when rendering a guard state.
 * @returns {React.ReactElement} The rendered guard state or children.
 */
export function ProtectedRoute({
  children,
  requireVerification = true,
  requireTokenValidation = false,
  onLoginRedirect = null,
  onVerificationRedirect = null,
  onTokenValidationRedirect = null,
  className = '',
}) {
  const {
    isAuthenticated,
    isVerified,
    isTokenValid,
    loading,
  } = useAuth();

  const wrapperClassName = [className].filter(Boolean).join(' ');

  // Loading state — auth context is still initializing
  if (loading) {
    return (
      <div className={wrapperClassName}>
        <LoadingSpinner size="medium" label="Checking authentication…" />
      </div>
    );
  }

  // Unauthenticated state — user is not logged in
  if (!isAuthenticated) {
    return (
      <div
        className={wrapperClassName}
        style={{
          width: '100%',
          maxWidth: '480px',
          margin: '0 auto',
          paddingTop: 'var(--hb-space-xl)',
        }}
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
            You must be logged in to access this page. Please sign in with your credentials to continue.
          </p>

          {typeof onLoginRedirect === 'function' && (
            <div style={{ marginTop: 'var(--hb-space-md)' }}>
              <button
                type="button"
                className="button-primary"
                onClick={onLoginRedirect}
                aria-label="Go to login page"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Unverified state — user is authenticated but not verified
  if (requireVerification && !isVerified) {
    return (
      <div
        className={wrapperClassName}
        style={{
          width: '100%',
          maxWidth: '480px',
          margin: '0 auto',
          paddingTop: 'var(--hb-space-xl)',
        }}
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
            Your identity must be verified before you can access this page. Please complete the verification process to continue.
          </p>

          {typeof onVerificationRedirect === 'function' && (
            <div style={{ marginTop: 'var(--hb-space-md)' }}>
              <button
                type="button"
                className="button-primary"
                onClick={onVerificationRedirect}
                aria-label="Go to identity verification"
              >
                Verify Identity
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Token invalid state — user is authenticated and verified but token not validated
  if (requireTokenValidation && !isTokenValid) {
    return (
      <div
        className={wrapperClassName}
        style={{
          width: '100%',
          maxWidth: '480px',
          margin: '0 auto',
          paddingTop: 'var(--hb-space-xl)',
        }}
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
            Your eSign token must be validated before you can access this page. Please complete the token validation process to continue.
          </p>

          {typeof onTokenValidationRedirect === 'function' && (
            <div style={{ marginTop: 'var(--hb-space-md)' }}>
              <button
                type="button"
                className="button-primary"
                onClick={onTokenValidationRedirect}
                aria-label="Go to token validation"
              >
                Validate Token
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // All checks passed — render the protected content
  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requireVerification: PropTypes.bool,
  requireTokenValidation: PropTypes.bool,
  onLoginRedirect: PropTypes.func,
  onVerificationRedirect: PropTypes.func,
  onTokenValidationRedirect: PropTypes.func,
  className: PropTypes.string,
};

export default ProtectedRoute;