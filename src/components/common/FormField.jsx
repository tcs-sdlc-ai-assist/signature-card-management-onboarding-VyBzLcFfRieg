/**
 * Reusable form field component with floating label pattern.
 *
 * Renders an accessible form input with a floating label (HB CSS framework),
 * inline validation error message, and proper ARIA attributes. Supports
 * text, email, tel, and password input types.
 *
 * Uses HB CSS classes:
 *   - `.hb-form-group` for the field wrapper
 *   - `.hb-form-control` for the input element
 *   - `.hb-floating-label` for the floating label
 *   - `.invaliderr` / `.is-invalid` for validation error states
 *   - `.hb-error-message` for inline error text
 *
 * @module FormField
 */

import React, { useCallback, useId } from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable form field component with floating label and validation.
 *
 * Renders an input element wrapped in a `.hb-form-group` container with
 * a floating label that animates above the input when focused or when
 * the input has a value. Displays an inline validation error message
 * below the input when the field has been touched and has an error.
 *
 * @param {Object} props
 * @param {string} props.label - The floating label text displayed inside
 *   the input and above it when focused/filled.
 * @param {string} props.name - The input `name` attribute, used for form
 *   data binding and as the field identifier.
 * @param {'text'|'email'|'tel'|'password'} [props.type='text'] - The HTML
 *   input type attribute.
 * @param {string} [props.value=''] - The current input value.
 * @param {function} [props.onChange] - Callback invoked on input change events.
 *   Receives the native `React.ChangeEvent`.
 * @param {function} [props.onBlur] - Callback invoked on input blur events.
 *   Receives the native `React.FocusEvent`.
 * @param {string|null} [props.error=null] - The validation error message for
 *   this field. When non-null and the field is touched, the error is displayed.
 * @param {boolean} [props.touched=false] - Whether the field has been interacted
 *   with (blurred at least once). Error messages are only shown when touched.
 * @param {boolean} [props.required=false] - Whether the field is required.
 *   Adds `aria-required` and the `required` attribute.
 * @param {boolean} [props.disabled=false] - Whether the field is disabled.
 * @param {string} [props.ariaDescribedBy] - Additional `aria-describedby` ID(s)
 *   to associate with the input (appended to the auto-generated error ID).
 * @param {string} [props.className] - Additional CSS class names to apply to
 *   the `.hb-form-group` wrapper.
 * @param {string} [props.autoComplete] - The `autoComplete` attribute for the
 *   input element.
 * @returns {React.ReactElement} The rendered form field.
 */
export function FormField({
  label,
  name,
  type = 'text',
  value = '',
  onChange = null,
  onBlur = null,
  error = null,
  touched = false,
  required = false,
  disabled = false,
  ariaDescribedBy = '',
  className = '',
  autoComplete = '',
}) {
  const generatedId = useId();
  const inputId = `field-${name}-${generatedId}`;
  const errorId = `error-${name}-${generatedId}`;

  const showError = touched && error;

  const handleChange = useCallback(
    (event) => {
      if (typeof onChange === 'function') {
        onChange(event);
      }
    },
    [onChange]
  );

  const handleBlur = useCallback(
    (event) => {
      if (typeof onBlur === 'function') {
        onBlur(event);
      }
    },
    [onBlur]
  );

  // Build the input class name
  const inputClassName = [
    'hb-form-control',
    value ? 'has-value' : '',
    showError ? 'invaliderr' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Build aria-describedby
  const describedByParts = [];
  if (showError) {
    describedByParts.push(errorId);
  }
  if (ariaDescribedBy) {
    describedByParts.push(ariaDescribedBy);
  }
  const ariaDescribedByValue = describedByParts.length > 0
    ? describedByParts.join(' ')
    : undefined;

  const groupClassName = ['hb-form-group', className].filter(Boolean).join(' ');

  return (
    <div className={groupClassName}>
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={inputClassName}
        placeholder=" "
        required={required}
        disabled={disabled}
        aria-required={required ? 'true' : undefined}
        aria-invalid={showError ? 'true' : undefined}
        aria-describedby={ariaDescribedByValue}
        autoComplete={autoComplete || undefined}
      />
      <label
        htmlFor={inputId}
        className="hb-floating-label"
      >
        {label}
        {required && (
          <span aria-hidden="true" style={{ color: 'var(--hb-secondary-red)', marginLeft: '2px' }}>
            *
          </span>
        )}
      </label>
      {showError && (
        <span
          id={errorId}
          className="hb-error-message"
          role="alert"
          aria-live="polite"
        >
          {error}
        </span>
      )}
    </div>
  );
}

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['text', 'email', 'tel', 'password']),
  value: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  error: PropTypes.string,
  touched: PropTypes.bool,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  ariaDescribedBy: PropTypes.string,
  className: PropTypes.string,
  autoComplete: PropTypes.string,
};

export default FormField;