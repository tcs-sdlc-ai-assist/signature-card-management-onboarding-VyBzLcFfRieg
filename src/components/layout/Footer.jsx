/**
 * Application footer component with copyright, privacy policy link,
 * and support contact info.
 *
 * Renders a responsive footer bar with the application copyright notice,
 * a privacy policy link, and support contact information. Uses HB CSS
 * framework classes for styling consistency and proper ARIA contentinfo
 * landmark role for accessibility.
 *
 * @module Footer
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * Shield SVG icon for the privacy policy link.
 *
 * @returns {React.ReactElement} An SVG shield icon.
 */
function ShieldIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0 }}
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
 * Envelope SVG icon for the support email link.
 *
 * @returns {React.ReactElement} An SVG envelope icon.
 */
function EnvelopeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0 }}
    >
      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
    </svg>
  );
}

/**
 * Phone SVG icon for the support phone link.
 *
 * @returns {React.ReactElement} An SVG phone icon.
 */
function PhoneIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0 }}
    >
      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
    </svg>
  );
}

/**
 * Application footer component.
 *
 * Renders a responsive footer with copyright notice, privacy policy
 * link, and support contact information. Uses the `contentinfo` ARIA
 * landmark role for accessibility.
 *
 * @param {Object} [props]
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the footer element.
 * @returns {React.ReactElement} The rendered footer component.
 */
export function Footer({ className = '' }) {
  const currentYear = new Date().getFullYear();

  const footerClassName = [className].filter(Boolean).join(' ');

  return (
    <footer
      className={footerClassName}
      role="contentinfo"
      style={{
        width: '100%',
        backgroundColor: 'var(--hb-secondary-gray-lighter)',
        borderTop: '1px solid var(--hb-secondary-gray-light)',
        marginTop: 'auto',
      }}
    >
      <div
        className="fluid-wrapper"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--hb-space-md)',
          paddingTop: 'var(--hb-space-md)',
          paddingBottom: 'var(--hb-space-md)',
        }}
      >
        {/* Copyright notice */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--hb-space-sm)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--hb-font-size-xs)',
              color: 'var(--hb-secondary-gray)',
            }}
          >
            &copy; {currentYear} SIG Card Management. All rights reserved.
          </span>
        </div>

        {/* Links and contact info */}
        <nav
          aria-label="Footer navigation"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--hb-space-lg)',
            flexWrap: 'wrap',
          }}
        >
          {/* Privacy policy link */}
          <a
            href="#privacy-policy"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--hb-space-xs)',
              fontSize: 'var(--hb-font-size-xs)',
              color: 'var(--hb-primary-blue)',
              textDecoration: 'none',
            }}
            aria-label="Privacy Policy"
          >
            <ShieldIcon />
            Privacy Policy
          </a>

          {/* Support email */}
          <a
            href="mailto:support@sigbank.example.com"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--hb-space-xs)',
              fontSize: 'var(--hb-font-size-xs)',
              color: 'var(--hb-secondary-gray)',
              textDecoration: 'none',
            }}
            aria-label="Email support at support@sigbank.example.com"
          >
            <EnvelopeIcon />
            support@sigbank.example.com
          </a>

          {/* Support phone */}
          <a
            href="tel:+18005551234"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--hb-space-xs)',
              fontSize: 'var(--hb-font-size-xs)',
              color: 'var(--hb-secondary-gray)',
              textDecoration: 'none',
            }}
            aria-label="Call support at 1-800-555-1234"
          >
            <PhoneIcon />
            1-800-555-1234
          </a>
        </nav>
      </div>
    </footer>
  );
}

Footer.propTypes = {
  className: PropTypes.string,
};

export default Footer;