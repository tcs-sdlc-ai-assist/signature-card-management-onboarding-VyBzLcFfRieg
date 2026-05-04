/**
 * Reusable styled button component.
 *
 * Renders an accessible button using HB CSS framework classes
 * (.button-primary, .button-secondary-2). Supports loading state
 * with spinner, disabled state styling, full-width mode, and
 * proper ARIA attributes.
 *
 * @module Button
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Maps the public `variant` prop to the corresponding HB CSS class name.
 *
 * @param {string} variant - The button variant.
 * @returns {string} The HB CSS class name.
 */
function getButtonClassName(variant) {
  switch (variant) {
    case 'secondary':
      return 'button-secondary-2';
    case 'primary':
    default:
      return 'button-primary';
  }
}

/**
 * Reusable styled button component.
 *
 * Renders an accessible button with support for primary and secondary
 * variants, loading state with an inline spinner, disabled state, and
 * full-width layout. Uses HB CSS framework button classes for styling.
 *
 * @param {Object} props
 * @param {'primary'|'secondary'} [props.variant='primary'] - The button
 *   style variant. Maps to `.button-primary` or `.button-secondary-2`.
 * @param {string} props.label - The button label text to display.
 * @param {function} [props.onClick] - Callback invoked when the button
 *   is clicked. Not invoked when the button is disabled or loading.
 * @param {boolean} [props.disabled=false] - Whether the button is disabled.
 * @param {boolean} [props.loading=false] - Whether the button is in a
 *   loading state. When `true`, a spinner is shown and clicks are ignored.
 * @param {'button'|'submit'|'reset'} [props.type='button'] - The HTML
 *   button type attribute.
 * @param {string} [props.ariaLabel] - Accessible label for the button.
 *   When omitted, the `label` prop is used as the accessible name.
 * @param {boolean} [props.fullWidth=false] - Whether the button should
 *   stretch to fill its container width.
 * @param {string} [props.className] - Additional CSS class names to apply.
 * @param {string} [props.size] - Optional size variant. Pass `'sm'` for
 *   the small button style (`.button-sm`).
 * @returns {React.ReactElement} The rendered button element.
 */
export function Button({
  variant = 'primary',
  label,
  onClick = null,
  disabled = false,
  loading = false,
  type = 'button',
  ariaLabel = '',
  fullWidth = false,
  className = '',
  size = '',
}) {
  const handleClick = useCallback(
    (event) => {
      if (disabled || loading) {
        event.preventDefault();
        return;
      }

      if (typeof onClick === 'function') {
        onClick(event);
      }
    },
    [onClick, disabled, loading]
  );

  const isDisabled = disabled || loading;
  const baseClassName = getButtonClassName(variant);

  const combinedClassName = [
    baseClassName,
    size === 'sm' ? 'button-sm' : '',
    fullWidth ? 'button-block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={combinedClassName}
      onClick={handleClick}
      disabled={isDisabled}
      aria-disabled={isDisabled ? 'true' : undefined}
      aria-label={ariaLabel || undefined}
      aria-busy={loading ? 'true' : undefined}
    >
      {loading && (
        <span
          className="hb-spinner hb-spinner-sm"
          aria-hidden="true"
          style={{ marginRight: 'var(--hb-space-sm)' }}
        />
      )}
      {label}
    </button>
  );
}

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary']),
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  ariaLabel: PropTypes.string,
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
  size: PropTypes.oneOf(['', 'sm']),
};

export default Button;