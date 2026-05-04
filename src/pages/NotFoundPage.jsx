/**
 * 404 Not Found page component.
 *
 * Displays a friendly error message when the user navigates to a route
 * that does not exist. Provides a navigation link back to the welcome
 * page. Does not require authentication — accessible to all visitors.
 *
 * Uses {@link AppLayout} for the page shell and HB CSS framework classes
 * for styling consistency.
 *
 * @module NotFoundPage
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { AppLayout } from '../components/layout/AppLayout.jsx';
import { Button } from '../components/common/Button.jsx';

/**
 * Warning SVG icon for the 404 page.
 *
 * @returns {React.ReactElement} An SVG warning icon.
 */
function WarningIcon() {
  return (
    <svg
      width="64"
      height="64"
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
 * 404 Not Found page component.
 *
 * Renders a friendly error message with a large "404" heading, a
 * descriptive message, and a button to navigate back to the welcome
 * page. Uses the application layout shell for consistent header/footer.
 *
 * @param {Object} [props]
 * @param {function} [props.onNavigateHome] - Callback invoked when the
 *   user clicks the "Go to Home" button. Typically navigates to the
 *   welcome or landing page.
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the page wrapper element.
 * @returns {React.ReactElement} The rendered 404 page.
 */
export function NotFoundPage({
  onNavigateHome = null,
  className = '',
}) {
  /**
   * Handles the "Go to Home" button click.
   */
  const handleNavigateHome = useCallback(() => {
    if (typeof onNavigateHome === 'function') {
      try {
        onNavigateHome();
      } catch {
        // Callback errors must not break the page flow.
      }
    }
  }, [onNavigateHome]);

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
        <div
          style={{
            width: '100%',
            maxWidth: '520px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 'var(--hb-space-md)',
          }}
        >
          <WarningIcon />

          <h1
            style={{
              fontSize: '72px',
              fontWeight: 700,
              color: 'var(--hb-primary-blue)',
              margin: 0,
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            404
          </h1>

          <h2
            style={{
              fontSize: 'var(--hb-font-size-h3)',
              fontWeight: 500,
              color: 'var(--hb-primary-black)',
              margin: 0,
            }}
          >
            Page Not Found
          </h2>

          <p
            style={{
              fontSize: 'var(--hb-font-size-base)',
              color: 'var(--hb-secondary-gray)',
              margin: 0,
              lineHeight: 1.6,
              maxWidth: '400px',
            }}
          >
            The page you are looking for does not exist or has been moved.
            Please check the URL or navigate back to the home page.
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--hb-space-md)',
              marginTop: 'var(--hb-space-lg)',
            }}
          >
            <Button
              variant="primary"
              label="Go to Home"
              onClick={handleNavigateHome}
              ariaLabel="Navigate back to the home page"
            />
          </div>

          {/* Help text */}
          <p
            style={{
              fontSize: 'var(--hb-font-size-xs)',
              color: 'var(--hb-secondary-gray)',
              marginTop: 'var(--hb-space-xl)',
              maxWidth: '400px',
              lineHeight: 1.6,
            }}
          >
            If you believe this is an error, contact your system administrator or call support at{' '}
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
      </div>
    </AppLayout>
  );
}

NotFoundPage.propTypes = {
  onNavigateHome: PropTypes.func,
  className: PropTypes.string,
};

export default NotFoundPage;