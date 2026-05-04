/**
 * Final review page component.
 *
 * Renders the {@link FinalReview} component within the page layout.
 * Handles navigation back to signer management (edit) or forward to
 * submission confirmation. Protected route requiring full auth chain
 * (authenticated, verified, and token validated).
 *
 * Uses {@link StepContext} for multi-step flow navigation and
 * {@link AccountContext} for staged changes awareness. Uses
 * {@link AuthContext} for authentication, verification, and token
 * validation state. Uses {@link AppLayout} for the page shell.
 *
 * Redirects unauthenticated users to login, unverified users to
 * verification, and users without valid tokens to token validation
 * via the respective callback props.
 *
 * Uses HB CSS framework classes for styling consistency.
 *
 * @module ReviewPage
 */

import React, { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext.jsx';
import { useAccount } from '../context/AccountContext.jsx';
import { AppLayout } from '../components/layout/AppLayout.jsx';
import { FinalReview } from '../components/review/FinalReview.jsx';
import { Alert } from '../components/common/Alert.jsx';
import { Button } from '../components/common/Button.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { ALERT_TYPES } from '../constants/constants.js';
import { LOGIN_MESSAGES, VERIFICATION_MESSAGES, TOKEN_MESSAGES } from '../constants/messages.js';

/**
 * Document SVG icon for the review page branding area.
 *
 * @returns {React.ReactElement} An SVG document icon.
 */
function DocumentIcon() {
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
        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
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
 * Final review page component.
 *
 * Renders the final review and submission form within the application
 * layout. Handles navigation back to signer management (edit) or forward
 * to submission confirmation. Requires full auth chain — redirects
 * unauthenticated users to login, unverified users to verification, and
 * users without valid tokens to token validation.
 *
 * @param {Object} [props]
 * @param {function} [props.onEdit] - Callback invoked when the user
 *   clicks "Edit Changes" to return to signer management.
 * @param {function} [props.onSubmitSuccess] - Callback invoked when the
 *   user successfully submits all staged changes. Typically navigates
 *   to the submission confirmation page.
 * @param {function} [props.onLoginRedirect] - Callback invoked when the
 *   user is not authenticated and needs to be redirected to the login page.
 * @param {function} [props.onVerificationRedirect] - Callback invoked when
 *   the user is authenticated but not verified and needs to be redirected
 *   to the verification page.
 * @param {function} [props.onTokenValidationRedirect] - Callback invoked when
 *   the user is authenticated and verified but has not validated their eSign
 *   token and needs to be redirected to the token validation page.
 * @param {function} [props.onNavigateToAccountSelection] - Callback invoked
 *   when the user needs to go back to account selection (no account selected).
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the page wrapper element.
 * @returns {React.ReactElement} The rendered review page.
 */
export function ReviewPage({
  onEdit = null,
  onSubmitSuccess = null,
  onLoginRedirect = null,
  onVerificationRedirect = null,
  onTokenValidationRedirect = null,
  onNavigateToAccountSelection = null,
  className = '',
}) {
  const {
    isAuthenticated,
    isVerified,
    isTokenValid,
    loading: authLoading,
  } = useAuth();

  const {
    selectedAccount,
    stagedChanges,
    loading: accountLoading,
  } = useAccount();

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
   * Handles the "Edit Changes" action from the FinalReview component.
   * Returns the user to signer management.
   */
  const handleEdit = useCallback(() => {
    if (typeof onEdit === 'function') {
      try {
        onEdit();
      } catch {
        // Callback errors must not break the page flow.
      }
    }
  }, [onEdit]);

  /**
   * Handles the "Submit" action from the FinalReview component.
   * Proceeds to the submission confirmation step.
   */
  const handleSubmitSuccess = useCallback(() => {
    if (typeof onSubmitSuccess === 'function') {
      try {
        onSubmitSuccess();
      } catch {
        // Callback errors must not break the page flow.
      }
    }
  }, [onSubmitSuccess]);

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

  /**
   * Handles the "Select Account" action when no account is selected.
   */
  const handleNavigateToAccountSelection = useCallback(() => {
    if (typeof onNavigateToAccountSelection === 'function') {
      try {
        onNavigateToAccountSelection();
      } catch {
        // Callback errors must not break the page flow.
      }
    }
  }, [onNavigateToAccountSelection]);

  const hasStagedChanges = stagedChanges && stagedChanges.hasChanges;

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
              You must be logged in to access the final review page. Please sign in with your credentials to continue.
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
              Your identity must be verified before you can access the final review page. Please complete the verification process to continue.
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

  // Authenticated and verified but token not validated
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
              Your eSign token must be validated before you can access the final review page. Please complete the token validation process to continue.
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

  // No account selected — prompt user to select an account
  if (!selectedAccount) {
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
            <DocumentIcon />

            <h2
              style={{
                fontSize: 'var(--hb-font-size-h3)',
                fontWeight: 500,
                color: 'var(--hb-primary-black)',
                margin: 0,
              }}
            >
              No Account Selected
            </h2>

            <Alert
              type={ALERT_TYPES.INFO}
              message="Please select a business banking account before reviewing and submitting changes."
            />

            {typeof onNavigateToAccountSelection === 'function' && (
              <div style={{ marginTop: 'var(--hb-space-md)' }}>
                <Button
                  variant="primary"
                  label="Select Account"
                  onClick={handleNavigateToAccountSelection}
                  ariaLabel="Go to account selection"
                />
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Fully authenticated, verified, token validated, and account selected — show final review
  return (
    <AppLayout
      hasUnsavedChanges={hasStagedChanges}
    >
      <div
        className={wrapperClassName}
        style={{
          paddingTop: 'var(--hb-space-xl)',
          paddingBottom: 'var(--hb-space-xl)',
        }}
      >
        {/* Back to confirm changes button */}
        <div
          style={{
            maxWidth: '760px',
            margin: '0 auto',
            marginBottom: 'var(--hb-space-md)',
          }}
        >
          {typeof onEdit === 'function' && (
            <Button
              variant="secondary"
              size="sm"
              label="← Back to Edit"
              onClick={handleEdit}
              ariaLabel="Go back to signer management"
            />
          )}
        </div>

        {/* Final review component */}
        <FinalReview
          onSubmit={handleSubmitSuccess}
          onEdit={handleEdit}
        />

        {/* Footer help text */}
        <p
          style={{
            fontSize: 'var(--hb-font-size-xs)',
            color: 'var(--hb-secondary-gray)',
            textAlign: 'center',
            marginTop: 'var(--hb-space-xl)',
            maxWidth: '400px',
            marginLeft: 'auto',
            marginRight: 'auto',
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

ReviewPage.propTypes = {
  onEdit: PropTypes.func,
  onSubmitSuccess: PropTypes.func,
  onLoginRedirect: PropTypes.func,
  onVerificationRedirect: PropTypes.func,
  onTokenValidationRedirect: PropTypes.func,
  onNavigateToAccountSelection: PropTypes.func,
  className: PropTypes.string,
};

export default ReviewPage;