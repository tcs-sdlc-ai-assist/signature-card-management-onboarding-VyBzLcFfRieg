/**
 * Accessible loading spinner component.
 *
 * Renders an animated spinner with proper ARIA attributes for screen
 * reader accessibility. Supports three size variants (small, medium,
 * large) and a configurable screen reader label.
 *
 * Uses HB CSS framework classes:
 *   - `.hb-spinner` for the base spinner animation
 *   - `.hb-spinner-sm` for the small variant
 *   - `.hb-spinner-lg` for the large variant
 *
 * Used during API calls and form submissions to maintain UI
 * responsiveness and communicate loading state to all users.
 *
 * @module LoadingSpinner
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * Maps the public `size` prop to the corresponding HB CSS class name.
 *
 * @param {string} size - The spinner size variant.
 * @returns {string} The HB CSS class name string for the spinner.
 */
function getSpinnerClassName(size) {
  switch (size) {
    case 'small':
      return 'hb-spinner hb-spinner-sm';
    case 'large':
      return 'hb-spinner hb-spinner-lg';
    case 'medium':
    default:
      return 'hb-spinner';
  }
}

/**
 * Accessible loading spinner component.
 *
 * Renders an animated circular spinner with ARIA attributes for
 * accessibility. The spinner is wrapped in a container that announces
 * the loading state to screen readers via `aria-busy` and `aria-label`.
 *
 * @param {Object} props
 * @param {'small'|'medium'|'large'} [props.size='medium'] - The spinner
 *   size variant. Maps to `.hb-spinner-sm`, `.hb-spinner`, or
 *   `.hb-spinner-lg` respectively.
 * @param {string} [props.label='Loading, please wait…'] - The screen
 *   reader text announced while the spinner is visible.
 * @param {boolean} [props.overlay=false] - When `true`, renders the
 *   spinner centered within a semi-transparent overlay container.
 * @param {string} [props.className] - Additional CSS class names to
 *   apply to the wrapper element.
 * @returns {React.ReactElement} The rendered loading spinner.
 */
export function LoadingSpinner({
  size = 'medium',
  label = 'Loading, please wait…',
  overlay = false,
  className = '',
}) {
  const spinnerClassName = getSpinnerClassName(size);

  const wrapperClassName = [className].filter(Boolean).join(' ');

  if (overlay) {
    return (
      <div
        className={wrapperClassName}
        role="status"
        aria-busy="true"
        aria-label={label}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          zIndex: 'var(--hb-z-sticky)',
        }}
      >
        <span className={spinnerClassName} aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return (
    <div
      className={wrapperClassName}
      role="status"
      aria-busy="true"
      aria-label={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--hb-space-md)',
      }}
    >
      <span className={spinnerClassName} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  label: PropTypes.string,
  overlay: PropTypes.bool,
  className: PropTypes.string,
};

export default LoadingSpinner;