/**
 * Signer management page component.
 *
 * Renders the {@link SignerList} as the main view with modal/panel display
 * for {@link SignerForm} (add/edit), {@link RemoveSignerModal},
 * {@link UnlockSignerAction}, and {@link ResendInvitationAction} based on
 * user actions. Provides navigation to {@link ConfirmChanges} when the user
 * is ready to review staged changes.
 *
 * Protected route requiring full auth chain (authenticated, verified,
 * and token validated). Uses {@link AccountContext} for account and signer
 * data, and {@link StepContext} for multi-step flow navigation.
 *
 * Redirects unauthenticated users to login, unverified users to
 * verification, and users without valid tokens to token validation
 * via the respective callback props.
 *
 * Uses HB CSS framework classes for styling consistency.
 *
 * @module SignerManagementPage
 */

import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext.jsx';
import { useAccount } from '../context/AccountContext.jsx';
import { AppLayout } from '../components/layout/AppLayout.jsx';
import { SignerList } from '../components/signers/SignerList.jsx';
import { SignerForm } from '../components/signers/SignerForm.jsx';
import { RemoveSignerModal } from '../components/signers/RemoveSignerModal.jsx';
import { UnlockSignerAction } from '../components/signers/UnlockSignerAction.jsx';
import { ResendInvitationAction } from '../components/signers/ResendInvitationAction.jsx';
import { ConfirmChanges } from '../components/review/ConfirmChanges.jsx';
import { Alert } from '../components/common/Alert.jsx';
import { Button } from '../components/common/Button.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { ALERT_TYPES, SIGNER_STATUSES } from '../constants/constants.js';
import { LOGIN_MESSAGES, VERIFICATION_MESSAGES, TOKEN_MESSAGES } from '../constants/messages.js';

/**
 * Active view states for the signer management page.
 * @enum {string}
 */
const VIEWS = {
  LIST: 'list',
  ADD: 'add',
  EDIT: 'edit',
  UNLOCK: 'unlock',
  RESEND: 'resend',
  CONFIRM: 'confirm',
};

/**
 * People SVG icon for the signer management page branding area.
 *
 * @returns {React.ReactElement} An SVG people icon.
 */
function PeopleIcon() {
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
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
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
 * Signer management page component.
 *
 * Renders the signer list within the application layout. Handles modal/panel
 * display for add/edit signer forms, remove signer confirmation, unlock
 * signer action, and resend invitation action. Provides navigation to the
 * confirm changes view when the user is ready to review staged changes.
 *
 * Requires full auth chain — redirects unauthenticated users to login,
 * unverified users to verification, and users without valid tokens to
 * token validation.
 *
 * @param {Object} [props]
 * @param {function} [props.onNavigateToConfirm] - Callback invoked when the
 *   user clicks "Review Changes" to navigate to the confirm changes step.
 * @param {function} [props.onNavigateToAccountSelection] - Callback invoked
 *   when the user wants to go back to account selection.
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
 * @returns {React.ReactElement} The rendered signer management page.
 */
export function SignerManagementPage({
  onNavigateToConfirm = null,
  onNavigateToAccountSelection = null,
  onLoginRedirect = null,
  onVerificationRedirect = null,
  onTokenValidationRedirect = null,
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

  const [activeView, setActiveView] = useState(VIEWS.LIST);
  const [selectedSigner, setSelectedSigner] = useState(null);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [signerToRemove, setSignerToRemove] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  /**
   * Determines whether there are staged changes to review.
   */
  const hasStagedChanges = stagedChanges && stagedChanges.hasChanges;

  /**
   * Handles the "Add Signer" button click — switches to the add form view.
   */
  const handleAddSigner = useCallback(() => {
    setSelectedSigner(null);
    setActiveView(VIEWS.ADD);
  }, []);

  /**
   * Handles the "Edit" button click for a signer — switches to the edit form view.
   *
   * @param {Object} signer - The signer object to edit.
   */
  const handleEditSigner = useCallback((signer) => {
    if (!signer || !signer.id) {
      return;
    }
    setSelectedSigner(signer);
    setActiveView(VIEWS.EDIT);
  }, []);

  /**
   * Handles successful signer form submission (add or edit).
   * Returns to the list view.
   */
  const handleFormSuccess = useCallback(() => {
    setSelectedSigner(null);
    setActiveView(VIEWS.LIST);
    setHasUnsavedChanges(true);
  }, []);

  /**
   * Handles form cancel — returns to the list view.
   */
  const handleFormCancel = useCallback(() => {
    setSelectedSigner(null);
    setActiveView(VIEWS.LIST);
  }, []);

  /**
   * Handles the "Remove" action for a signer — opens the remove modal.
   *
   * @param {Object} signer - The signer object to remove.
   */
  const handleRemoveClick = useCallback((signer) => {
    if (!signer || !signer.id) {
      return;
    }
    setSignerToRemove(signer);
    setRemoveModalOpen(true);
  }, []);

  /**
   * Handles the remove modal close.
   */
  const handleRemoveModalClose = useCallback(() => {
    setRemoveModalOpen(false);
    setSignerToRemove(null);
  }, []);

  /**
   * Handles successful signer removal.
   */
  const handleRemoveSuccess = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  /**
   * Handles the "Unlock" action for a locked signer — switches to unlock view.
   *
   * @param {Object} signer - The signer object to unlock.
   */
  const handleUnlockSigner = useCallback((signer) => {
    if (!signer || !signer.id) {
      return;
    }
    setSelectedSigner(signer);
    setActiveView(VIEWS.UNLOCK);
  }, []);

  /**
   * Handles successful signer unlock — returns to the list view.
   */
  const handleUnlockSuccess = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  /**
   * Handles the unlock cancel — returns to the list view.
   */
  const handleUnlockCancel = useCallback(() => {
    setSelectedSigner(null);
    setActiveView(VIEWS.LIST);
  }, []);

  /**
   * Handles the "Resend Invitation" action for a pending signer —
   * switches to resend view.
   *
   * @param {Object} signer - The signer object.
   */
  const handleResendInvitation = useCallback((signer) => {
    if (!signer || !signer.id) {
      return;
    }
    setSelectedSigner(signer);
    setActiveView(VIEWS.RESEND);
  }, []);

  /**
   * Handles successful invitation resend — returns to the list view.
   */
  const handleResendSuccess = useCallback(() => {
    // No staged changes for resend — it's an immediate action
  }, []);

  /**
   * Handles the resend cancel — returns to the list view.
   */
  const handleResendCancel = useCallback(() => {
    setSelectedSigner(null);
    setActiveView(VIEWS.LIST);
  }, []);

  /**
   * Handles the "Review Changes" button click — switches to confirm view.
   */
  const handleReviewChanges = useCallback(() => {
    setActiveView(VIEWS.CONFIRM);
  }, []);

  /**
   * Handles the "Go Back" action from the confirm changes view —
   * returns to the list view.
   */
  const handleConfirmGoBack = useCallback(() => {
    setActiveView(VIEWS.LIST);
  }, []);

  /**
   * Handles the "Continue to Review" action from the confirm changes view.
   */
  const handleConfirmContinue = useCallback(() => {
    if (typeof onNavigateToConfirm === 'function') {
      try {
        onNavigateToConfirm();
      } catch {
        // Callback errors must not break the page flow.
      }
    }
  }, [onNavigateToConfirm]);

  /**
   * Handles the "Back to Accounts" button click.
   */
  const handleBackToAccounts = useCallback(() => {
    if (hasUnsavedChanges || hasStagedChanges) {
      setShowExitModal(true);
      return;
    }

    if (typeof onNavigateToAccountSelection === 'function') {
      try {
        onNavigateToAccountSelection();
      } catch {
        // Callback errors must not break the page flow.
      }
    }
  }, [hasUnsavedChanges, hasStagedChanges, onNavigateToAccountSelection]);

  /**
   * Handles the exit confirmation — navigates back to account selection.
   */
  const handleExitConfirm = useCallback(() => {
    setShowExitModal(false);
    setHasUnsavedChanges(false);

    if (typeof onNavigateToAccountSelection === 'function') {
      try {
        onNavigateToAccountSelection();
      } catch {
        // Callback errors must not break the page flow.
      }
    }
  }, [onNavigateToAccountSelection]);

  /**
   * Handles the exit cancellation — stays on the current page.
   */
  const handleExitCancel = useCallback(() => {
    setShowExitModal(false);
  }, []);

  /**
   * Handles the login redirect action.
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
   * Handles the verification redirect action.
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
   * Handles the token validation redirect action.
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
   * Custom edit signer handler that routes to the appropriate action
   * based on signer status.
   *
   * @param {Object} signer - The signer object.
   */
  const handleSignerAction = useCallback((signer) => {
    if (!signer || !signer.id) {
      return;
    }

    setSelectedSigner(signer);
    setActiveView(VIEWS.EDIT);
  }, []);

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
              You must be logged in to access the signer management page. Please sign in with your credentials to continue.
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
              Your identity must be verified before you can access the signer management page. Please complete the verification process to continue.
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
              Your eSign token must be validated before you can access the signer management page. Please complete the token validation process to continue.
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
      <AppLayout
        hasUnsavedChanges={false}
        showExitModal={false}
      >
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
            <PeopleIcon />

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
              message="Please select a business banking account to manage its authorized signers."
            />

            {typeof onNavigateToAccountSelection === 'function' && (
              <div style={{ marginTop: 'var(--hb-space-md)' }}>
                <Button
                  variant="primary"
                  label="Select Account"
                  onClick={onNavigateToAccountSelection}
                  ariaLabel="Go to account selection"
                />
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Confirm changes view
  if (activeView === VIEWS.CONFIRM) {
    return (
      <AppLayout
        hasUnsavedChanges={hasUnsavedChanges || hasStagedChanges}
        showExitModal={showExitModal}
        onExitConfirm={handleExitConfirm}
        onExitCancel={handleExitCancel}
      >
        <div
          className={wrapperClassName}
          style={{
            paddingTop: 'var(--hb-space-xl)',
            paddingBottom: 'var(--hb-space-xl)',
          }}
        >
          <ConfirmChanges
            onGoBack={handleConfirmGoBack}
            onContinue={handleConfirmContinue}
          />
        </div>
      </AppLayout>
    );
  }

  // Add signer view
  if (activeView === VIEWS.ADD) {
    return (
      <AppLayout
        hasUnsavedChanges={hasUnsavedChanges || hasStagedChanges}
        showExitModal={showExitModal}
        onExitConfirm={handleExitConfirm}
        onExitCancel={handleExitCancel}
      >
        <div
          className={wrapperClassName}
          style={{
            paddingTop: 'var(--hb-space-xl)',
            paddingBottom: 'var(--hb-space-xl)',
          }}
        >
          {/* Back to list button */}
          <div
            style={{
              maxWidth: '560px',
              margin: '0 auto',
              marginBottom: 'var(--hb-space-md)',
            }}
          >
            <Button
              variant="secondary"
              size="sm"
              label="← Back to Signers"
              onClick={handleFormCancel}
              ariaLabel="Go back to signer list"
            />
          </div>

          <SignerForm
            signer={null}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      </AppLayout>
    );
  }

  // Edit signer view
  if (activeView === VIEWS.EDIT && selectedSigner) {
    return (
      <AppLayout
        hasUnsavedChanges={hasUnsavedChanges || hasStagedChanges}
        showExitModal={showExitModal}
        onExitConfirm={handleExitConfirm}
        onExitCancel={handleExitCancel}
      >
        <div
          className={wrapperClassName}
          style={{
            paddingTop: 'var(--hb-space-xl)',
            paddingBottom: 'var(--hb-space-xl)',
          }}
        >
          {/* Back to list button */}
          <div
            style={{
              maxWidth: '560px',
              margin: '0 auto',
              marginBottom: 'var(--hb-space-md)',
            }}
          >
            <Button
              variant="secondary"
              size="sm"
              label="← Back to Signers"
              onClick={handleFormCancel}
              ariaLabel="Go back to signer list"
            />
          </div>

          <SignerForm
            signer={selectedSigner}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      </AppLayout>
    );
  }

  // Unlock signer view
  if (activeView === VIEWS.UNLOCK && selectedSigner) {
    return (
      <AppLayout
        hasUnsavedChanges={hasUnsavedChanges || hasStagedChanges}
        showExitModal={showExitModal}
        onExitConfirm={handleExitConfirm}
        onExitCancel={handleExitCancel}
      >
        <div
          className={wrapperClassName}
          style={{
            paddingTop: 'var(--hb-space-xl)',
            paddingBottom: 'var(--hb-space-xl)',
          }}
        >
          {/* Back to list button */}
          <div
            style={{
              maxWidth: '520px',
              margin: '0 auto',
              marginBottom: 'var(--hb-space-md)',
            }}
          >
            <Button
              variant="secondary"
              size="sm"
              label="← Back to Signers"
              onClick={handleUnlockCancel}
              ariaLabel="Go back to signer list"
            />
          </div>

          <UnlockSignerAction
            signer={selectedSigner}
            onUnlockSuccess={handleUnlockSuccess}
            onCancel={handleUnlockCancel}
          />
        </div>
      </AppLayout>
    );
  }

  // Resend invitation view
  if (activeView === VIEWS.RESEND && selectedSigner) {
    return (
      <AppLayout
        hasUnsavedChanges={hasUnsavedChanges || hasStagedChanges}
        showExitModal={showExitModal}
        onExitConfirm={handleExitConfirm}
        onExitCancel={handleExitCancel}
      >
        <div
          className={wrapperClassName}
          style={{
            paddingTop: 'var(--hb-space-xl)',
            paddingBottom: 'var(--hb-space-xl)',
          }}
        >
          {/* Back to list button */}
          <div
            style={{
              maxWidth: '520px',
              margin: '0 auto',
              marginBottom: 'var(--hb-space-md)',
            }}
          >
            <Button
              variant="secondary"
              size="sm"
              label="← Back to Signers"
              onClick={handleResendCancel}
              ariaLabel="Go back to signer list"
            />
          </div>

          <ResendInvitationAction
            signer={selectedSigner}
            onResendSuccess={handleResendSuccess}
            onCancel={handleResendCancel}
          />
        </div>
      </AppLayout>
    );
  }

  // Default: Signer list view
  return (
    <AppLayout
      hasUnsavedChanges={hasUnsavedChanges || hasStagedChanges}
      showExitModal={showExitModal}
      onExitConfirm={handleExitConfirm}
      onExitCancel={handleExitCancel}
    >
      <div
        className={wrapperClassName}
        style={{
          paddingTop: 'var(--hb-space-xl)',
          paddingBottom: 'var(--hb-space-xl)',
        }}
      >
        {/* Page header with back button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--hb-space-md)',
            marginBottom: 'var(--hb-space-lg)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--hb-space-sm)',
            }}
          >
            {typeof onNavigateToAccountSelection === 'function' && (
              <Button
                variant="secondary"
                size="sm"
                label="← Accounts"
                onClick={handleBackToAccounts}
                ariaLabel="Go back to account selection"
              />
            )}
          </div>

          {hasStagedChanges && (
            <Button
              variant="primary"
              label="Review Changes"
              onClick={handleReviewChanges}
              ariaLabel="Review staged signer changes"
            />
          )}
        </div>

        {/* Staged changes indicator */}
        {hasStagedChanges && (
          <div
            style={{
              marginBottom: 'var(--hb-space-lg)',
            }}
          >
            <Alert
              type={ALERT_TYPES.INFO}
              message={`You have ${stagedChanges.totalChanges} staged change${stagedChanges.totalChanges !== 1 ? 's' : ''} pending review. Click "Review Changes" to proceed.`}
            />
          </div>
        )}

        {/* Signer list */}
        <SignerList
          onAddSigner={handleAddSigner}
          onEditSigner={handleSignerAction}
        />

        {/* Remove signer modal */}
        <RemoveSignerModal
          isOpen={removeModalOpen}
          onClose={handleRemoveModalClose}
          signer={signerToRemove}
          onRemoveSuccess={handleRemoveSuccess}
        />
      </div>
    </AppLayout>
  );
}

SignerManagementPage.propTypes = {
  onNavigateToConfirm: PropTypes.func,
  onNavigateToAccountSelection: PropTypes.func,
  onLoginRedirect: PropTypes.func,
  onVerificationRedirect: PropTypes.func,
  onTokenValidationRedirect: PropTypes.func,
  className: PropTypes.string,
};

export default SignerManagementPage;