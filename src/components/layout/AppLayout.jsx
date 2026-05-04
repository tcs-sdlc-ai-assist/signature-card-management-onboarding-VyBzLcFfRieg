/**
 * Main application layout wrapper component.
 *
 * Wraps the application content with the {@link Header}, main content area
 * (with optional {@link ProgressIndicator} when in an authenticated flow),
 * and {@link Footer}. Includes the {@link SessionTimeoutModal} for inactivity
 * warnings and the {@link ExitConfirmationModal} for unsaved changes protection.
 *
 * Uses HB CSS grid classes (`.fluid-wrapper`, `.hb-row`, `.hb-col`) for
 * responsive layout. Renders children in the main content area.
 *
 * @module AppLayout
 */

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Header } from './Header.jsx';
import { Footer } from './Footer.jsx';
import { ProgressIndicator } from '../common/ProgressIndicator.jsx';
import { SessionTimeoutModal } from '../auth/SessionTimeoutModal.jsx';
import { ExitConfirmationModal } from '../common/ExitConfirmationModal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Main application layout component.
 *
 * Provides the top-level page structure with a sticky header, a scrollable
 * main content area, and a footer pinned to the bottom. When the user is
 * authenticated, the {@link SessionTimeoutModal} is rendered to handle
 * inactivity warnings.
 *
 * Optionally displays a {@link ProgressIndicator} above the main content
 * when `showProgress` is `true` and the user is authenticated.
 *
 * Supports an unsaved-changes exit confirmation modal controlled via the
 * `hasUnsavedChanges` prop and the `onExitConfirm` / `onExitCancel`
 * callbacks.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The main content to render
 *   inside the layout.
 * @param {boolean} [props.showProgress=false] - Whether to display the
 *   progress indicator above the main content area.
 * @param {Array<string>} [props.steps] - Ordered list of step names for
 *   the progress indicator. Passed through to {@link ProgressIndicator}.
 * @param {number} [props.currentStep=0] - The 0-based index of the
 *   currently active step. Passed through to {@link ProgressIndicator}.
 * @param {Array<string>|Set<string>} [props.completedSteps] - The set or
 *   array of completed step names. Passed through to {@link ProgressIndicator}.
 * @param {function} [props.onStepClick] - Callback invoked when a step is
 *   clicked in the progress indicator. Passed through to {@link ProgressIndicator}.
 * @param {boolean} [props.hasUnsavedChanges=false] - Whether there are
 *   unsaved changes that should trigger an exit confirmation modal.
 * @param {boolean} [props.showExitModal=false] - Whether the exit
 *   confirmation modal is currently visible.
 * @param {function} [props.onExitConfirm] - Callback invoked when the user
 *   confirms they want to exit and discard unsaved changes.
 * @param {function} [props.onExitCancel] - Callback invoked when the user
 *   cancels the exit and stays on the current page.
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the outermost wrapper element.
 * @returns {React.ReactElement} The rendered application layout.
 */
export function AppLayout({
  children,
  showProgress = false,
  steps,
  currentStep = 0,
  completedSteps = [],
  onStepClick = null,
  hasUnsavedChanges = false,
  showExitModal = false,
  onExitConfirm = null,
  onExitCancel = null,
  className = '',
}) {
  const { isAuthenticated } = useAuth();

  /**
   * Handles the exit confirmation — delegates to onExitConfirm callback.
   */
  const handleExitConfirm = useCallback(() => {
    if (typeof onExitConfirm === 'function') {
      try {
        onExitConfirm();
      } catch {
        // Callback errors must not break the layout flow.
      }
    }
  }, [onExitConfirm]);

  /**
   * Handles the exit cancellation — delegates to onExitCancel callback.
   */
  const handleExitCancel = useCallback(() => {
    if (typeof onExitCancel === 'function') {
      try {
        onExitCancel();
      } catch {
        // Callback errors must not break the layout flow.
      }
    }
  }, [onExitCancel]);

  const wrapperClassName = [className].filter(Boolean).join(' ');

  return (
    <div
      className={wrapperClassName}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
      }}
    >
      {/* Application header */}
      <Header />

      {/* Main content area */}
      <main
        role="main"
        style={{
          flex: 1,
          width: '100%',
        }}
      >
        <div
          className="fluid-wrapper"
          style={{
            paddingTop: 'var(--hb-space-lg)',
            paddingBottom: 'var(--hb-space-lg)',
          }}
        >
          {/* Progress indicator — shown when authenticated and enabled */}
          {isAuthenticated && showProgress && (
            <div
              style={{
                marginBottom: 'var(--hb-space-lg)',
              }}
            >
              <ProgressIndicator
                steps={steps}
                currentStep={currentStep}
                completedSteps={completedSteps}
                onStepClick={onStepClick}
              />
            </div>
          )}

          {/* Page content */}
          <div className="hb-row">
            <div className="hb-col-12">
              {children}
            </div>
          </div>
        </div>
      </main>

      {/* Application footer */}
      <Footer />

      {/* Session timeout modal — only rendered when authenticated */}
      {isAuthenticated && (
        <SessionTimeoutModal />
      )}

      {/* Exit confirmation modal for unsaved changes */}
      <ExitConfirmationModal
        isOpen={showExitModal}
        onStay={handleExitCancel}
        onExit={handleExitConfirm}
        hasUnsavedChanges={hasUnsavedChanges}
        interceptBrowserNav={hasUnsavedChanges}
      />
    </div>
  );
}

AppLayout.propTypes = {
  children: PropTypes.node.isRequired,
  showProgress: PropTypes.bool,
  steps: PropTypes.arrayOf(PropTypes.string),
  currentStep: PropTypes.number,
  completedSteps: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.instanceOf(Set),
  ]),
  onStepClick: PropTypes.func,
  hasUnsavedChanges: PropTypes.bool,
  showExitModal: PropTypes.bool,
  onExitConfirm: PropTypes.func,
  onExitCancel: PropTypes.func,
  className: PropTypes.string,
};

export default AppLayout;