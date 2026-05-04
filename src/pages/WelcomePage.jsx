/**
 * Welcome/onboarding page component.
 *
 * Pre-login landing page that displays informational content about the
 * SIG Card Management portal. Loads content from {@link contentService}
 * and renders a title, subtitle, body paragraphs, feature highlights,
 * and a "Get Started" CTA button that navigates to the login page.
 *
 * Does not require authentication — accessible to all visitors.
 *
 * Uses HB CSS framework classes for layout and styling consistency.
 * Accessible with proper heading hierarchy and landmark roles.
 *
 * @module WelcomePage
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getWelcomeContent } from '../services/contentService.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { Alert } from '../components/common/Alert.jsx';
import { ALERT_TYPES } from '../constants/constants.js';

/**
 * Returns the appropriate SVG icon for a feature highlight based on its
 * icon identifier string.
 *
 * @param {string} icon - The icon identifier from the content data.
 * @returns {React.ReactElement} An SVG icon element.
 */
function FeatureIcon({ icon }) {
  switch (icon) {
    case 'search':
      return (
        <svg
          width="32"
          height="32"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
          style={{ color: 'var(--hb-primary-blue)', flexShrink: 0 }}
        >
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'lock':
      return (
        <svg
          width="32"
          height="32"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
          style={{ color: 'var(--hb-primary-blue)', flexShrink: 0 }}
        >
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'activate':
      return (
        <svg
          width="32"
          height="32"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
          style={{ color: 'var(--hb-primary-blue)', flexShrink: 0 }}
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'replace':
      return (
        <svg
          width="32"
          height="32"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
          style={{ color: 'var(--hb-primary-blue)', flexShrink: 0 }}
        >
          <path
            fillRule="evenodd"
            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'pin':
      return (
        <svg
          width="32"
          height="32"
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
    case 'shield':
      return (
        <svg
          width="32"
          height="32"
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
    default:
      return (
        <svg
          width="32"
          height="32"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
          style={{ color: 'var(--hb-primary-blue)', flexShrink: 0 }}
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

FeatureIcon.propTypes = {
  icon: PropTypes.string.isRequired,
};

/**
 * Welcome/onboarding page component.
 *
 * Loads content from {@link contentService} and renders the welcome
 * screen with title, subtitle, body paragraphs, feature highlights,
 * and a "Get Started" CTA button.
 *
 * @param {Object} [props]
 * @param {function} [props.onGetStarted] - Callback invoked when the
 *   "Get Started" button is clicked. Typically navigates to the login page.
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the wrapper element.
 * @returns {React.ReactElement} The rendered welcome page.
 */
export function WelcomePage({ onGetStarted = null, className = '' }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Loads welcome content from the content service on mount.
   */
  useEffect(() => {
    try {
      const welcomeContent = getWelcomeContent();
      setContent(welcomeContent);
      setError(null);
    } catch {
      setError('Failed to load welcome content. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Handles the "Get Started" button click.
   */
  const handleGetStarted = useCallback(() => {
    if (typeof onGetStarted === 'function') {
      try {
        onGetStarted();
      } catch {
        // Callback errors must not break the UI flow.
      }
    }
  }, [onGetStarted]);

  const wrapperClassName = [className].filter(Boolean).join(' ');

  // Loading state
  if (loading) {
    return (
      <div className={wrapperClassName}>
        <LoadingSpinner size="medium" label="Loading welcome content…" />
      </div>
    );
  }

  // Error state
  if (error || !content) {
    return (
      <div
        className={wrapperClassName}
        style={{
          width: '100%',
          maxWidth: '760px',
          margin: '0 auto',
          paddingTop: 'var(--hb-space-xl)',
        }}
      >
        <Alert
          type={ALERT_TYPES.CRITICAL}
          message={error || 'Unable to load welcome content.'}
        />
      </div>
    );
  }

  const {
    title,
    subtitle,
    bodyParagraphs,
    featureHighlights,
    ctaButton,
    footerNote,
  } = content;

  return (
    <div
      className={wrapperClassName}
      role="main"
      style={{
        width: '100%',
      }}
    >
      {/* Hero section */}
      <section
        aria-labelledby="welcome-title"
        style={{
          textAlign: 'center',
          paddingTop: 'var(--hb-space-xxl)',
          paddingBottom: 'var(--hb-space-xl)',
        }}
      >
        {/* Logo icon */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 'var(--hb-space-lg)',
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <rect width="64" height="64" rx="12" fill="var(--hb-primary-blue)" />
            <text
              x="32"
              y="42"
              textAnchor="middle"
              fill="var(--hb-primary-white)"
              fontSize="26"
              fontWeight="700"
              fontFamily="Roboto, Arial, sans-serif"
            >
              SIG
            </text>
          </svg>
        </div>

        <h1
          id="welcome-title"
          style={{
            fontSize: 'var(--hb-font-size-h1)',
            fontWeight: 700,
            color: 'var(--hb-primary-black)',
            marginBottom: 'var(--hb-space-sm)',
            lineHeight: 1.25,
          }}
        >
          {title || 'Welcome to SIG Card Management'}
        </h1>

        {subtitle && (
          <p
            style={{
              fontSize: 'var(--hb-font-size-lg)',
              color: 'var(--hb-secondary-gray)',
              marginBottom: 'var(--hb-space-lg)',
              maxWidth: '600px',
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </p>
        )}

        {/* Body paragraphs */}
        {Array.isArray(bodyParagraphs) && bodyParagraphs.length > 0 && (
          <div
            style={{
              maxWidth: '680px',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginBottom: 'var(--hb-space-xl)',
            }}
          >
            {bodyParagraphs.map((paragraph, index) => (
              <p
                key={index}
                style={{
                  fontSize: 'var(--hb-font-size-base)',
                  color: 'var(--hb-secondary-gray)',
                  lineHeight: 1.7,
                  marginBottom: 'var(--hb-space-md)',
                  textAlign: 'center',
                }}
              >
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </section>

      {/* Feature highlights section */}
      {Array.isArray(featureHighlights) && featureHighlights.length > 0 && (
        <section
          aria-labelledby="features-heading"
          style={{
            paddingBottom: 'var(--hb-space-xl)',
          }}
        >
          <h2
            id="features-heading"
            style={{
              fontSize: 'var(--hb-font-size-h3)',
              fontWeight: 500,
              color: 'var(--hb-primary-black)',
              textAlign: 'center',
              marginBottom: 'var(--hb-space-lg)',
            }}
          >
            What You Can Do
          </h2>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--hb-space-lg)',
              justifyContent: 'center',
              maxWidth: '960px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {featureHighlights.map((feature, index) => (
              <div
                key={index}
                className="hb-card"
                style={{
                  flex: '1 1 280px',
                  maxWidth: '360px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 'var(--hb-space-sm)',
                  padding: 'var(--hb-space-lg)',
                  transition: 'box-shadow var(--hb-transition-fast)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--hb-primary-blue-light)',
                    marginBottom: 'var(--hb-space-sm)',
                  }}
                >
                  <FeatureIcon icon={feature.icon || 'info'} />
                </div>

                <h3
                  style={{
                    fontSize: 'var(--hb-font-size-lg)',
                    fontWeight: 500,
                    color: 'var(--hb-primary-black)',
                    margin: 0,
                  }}
                >
                  {feature.title || 'Feature'}
                </h3>

                <p
                  style={{
                    fontSize: 'var(--hb-font-size-sm)',
                    color: 'var(--hb-secondary-gray)',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {feature.description || ''}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA section */}
      <section
        aria-label="Get started"
        style={{
          textAlign: 'center',
          paddingTop: 'var(--hb-space-lg)',
          paddingBottom: 'var(--hb-space-xl)',
        }}
      >
        <button
          type="button"
          className="button-primary"
          onClick={handleGetStarted}
          aria-label={ctaButton?.ariaLabel || 'Get started with card management'}
          style={{
            padding: '14px 40px',
            fontSize: 'var(--hb-font-size-lg)',
            fontWeight: 500,
          }}
        >
          {ctaButton?.text || 'Get Started'}
        </button>
      </section>

      {/* Footer note */}
      {footerNote && (
        <section
          aria-label="Help information"
          style={{
            textAlign: 'center',
            paddingBottom: 'var(--hb-space-xxl)',
          }}
        >
          <p
            style={{
              fontSize: 'var(--hb-font-size-sm)',
              color: 'var(--hb-secondary-gray)',
              maxWidth: '560px',
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.6,
            }}
          >
            {footerNote}
          </p>
        </section>
      )}
    </div>
  );
}

WelcomePage.propTypes = {
  onGetStarted: PropTypes.func,
  className: PropTypes.string,
};

export default WelcomePage;