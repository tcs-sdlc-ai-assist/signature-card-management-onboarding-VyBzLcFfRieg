/**
 * eSign token validation status display component.
 *
 * Displays the current state of eSign token validation — loading spinner
 * during validation, success message with a proceed button on valid token,
 * and error message with actionable guidance on invalid/expired token.
 *
 * Integrates with {@link AuthContext} for token validation state and
 * actions. Uses HB CSS framework classes for styling consistency and
 * ARIA live regions for accessible status updates.
 *
 * @module TokenValidationStatus
 */

import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFormValidation } from '../../hooks/useFormValidation.js';
import { FormField } from '../common/FormField.jsx';
import { Button } from '../common/Button.jsx';
import { Alert } from '../common/Alert.jsx';
import { LoadingSpinner } from '../common/LoadingSpinner.jsx';
import { validateRequired, validateMinLength } from '../../utils/validators.js';
import { ALERT_TYPES } from '../../constants/constants.js';
import { TOKEN_MESSAGES } from '../../constants/messages.js';
import { getTokenValidationAttempts } from '../../services/tokenService.js';

/**
 * Checkmark SVG icon for the success state.
 *
 * @returns {React.ReactElement} An SVG checkmark icon.
 */
function SuccessIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ color: 'var(--hb-secondary-green)', flexShrink: 0 }}
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Error SVG icon for the failure state.
 *
 * @returns {React.ReactElement} An SVG error icon.
 */
function ErrorIcon() {
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
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * eSign token validation status display component.
 *
 * Renders a token input form, validates the token via {@link AuthContext},
 * and displays the validation result with appropriate messaging and
 * actionable guidance.
 *
 * States:
 *   - **idle** — token input form is displayed, awaiting user input.
 *   - **validating** — loading spinner shown during validation.
 *   - **success** — success message with proceed button.
 *   - **error** — error message with guidance and retry option.
 *
 * @param {Object} [props]
 * @param {function} [props.onValidationSuccess] - Optional callback
 *   invoked when token validation succeeds.
 * @param {function} [props.onProceed] - Optional callback invoked when
 *   the user clicks the "Proceed" button after successful validation.
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the wrapper element.
 * @returns {React.ReactElement} The rendered token validation status component.
 */
export function TokenValidationStatus({
  onValidationSuccess = null,
  onProceed = null,
  className = '',
}) {
  const { validateToken, isTokenValid, isAuthenticated, loading: authLoading } = useAuth();

  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [validationSuccess, setValidationSuccess] = useState(null);
  const [attemptsUsed, setAttemptsUsed] = useState(() => {
    try {
      const status = getTokenValidationAttempts();
      return status.attemptsUsed;
    } catch {
      return 0;
    }
  });
  const [attemptsRemaining, setAttemptsRemaining] = useState(() => {
    try {
      const status = getTokenValidationAttempts();
      return status.attemptsRemaining;
    } catch {
      return 3;
    }
  });
  const [isExhausted, setIsExhausted] = useState(() => {
    try {
      const status = getTokenValidationAttempts();
      return status.isExhausted;
    } catch {
      return false;
    }
  });

  const initialValues = useMemo(() => ({ token: '' }), []);

  const validationRules = useMemo(() => ({
    token: [
      (value) => validateRequired(value, 'eSign token'),
      (value) => validateMinLength(value, 10),
    ],
  }), []);

  /**
   * Handles token validation form submission.
   *
   * @param {Object} formValues - The current form field values.
   */
  const handleTokenSubmit = useCallback((formValues) => {
    if (isExhausted || !isAuthenticated) {
      return;
    }

    setIsValidating(true);
    setValidationError(null);
    setValidationSuccess(null);

    try {
      const result = validateToken(formValues.token);

      if (result.status === 'success') {
        setValidationSuccess(result.message || 'eSign token validated successfully.');
        setValidationError(null);

        if (typeof result.attemptsUsed === 'number') {
          setAttemptsUsed(result.attemptsUsed);
        }
        if (typeof result.attemptsRemaining === 'number') {
          setAttemptsRemaining(result.attemptsRemaining);
        }

        if (typeof onValidationSuccess === 'function') {
          try {
            onValidationSuccess();
          } catch {
            // Callback errors must not break the validation flow.
          }
        }
      } else {
        setValidationError(result.message || TOKEN_MESSAGES.TOKEN_INVALID);

        if (typeof result.attemptsUsed === 'number') {
          setAttemptsUsed(result.attemptsUsed);
        }
        if (typeof result.attemptsRemaining === 'number') {
          setAttemptsRemaining(result.attemptsRemaining);
          setIsExhausted(result.attemptsRemaining <= 0);
        }
      }
    } catch {
      setValidationError(TOKEN_MESSAGES.TOKEN_INVALID);
    } finally {
      setIsValidating(false);
    }
  }, [validateToken, isAuthenticated, isExhausted, onValidationSuccess]);

  const tokenForm = useFormValidation({
    initialValues,
    validationRules,
    onSubmit: handleTokenSubmit,
  });

  /**
   * Handles the "Proceed" button click after successful validation.
   */
  const handleProceed = useCallback(() => {
    if (typeof onProceed === 'function') {
      try {
        onProceed();
      } catch {
        // Callback errors must not break the UI flow.
      }
    }
  }, [onProceed]);

  /**
   * Handles the "Try Again" action — resets the form and error state.
   */
  const handleRetry = useCallback(() => {
    setValidationError(null);
    setValidationSuccess(null);
    tokenForm.resetForm();
  }, [tokenForm]);

  const isFormDisabled = isValidating || authLoading || isExhausted;
  const showSuccess = validationSuccess || isTokenValid;

  /**
   * Determines the alert to display above the form.
   *
   * @returns {{ type: string, message: string }|null}
   */
  const alertInfo = (() => {
    if (validationSuccess || (isTokenValid && !validationError)) {
      return {
        type: ALERT_TYPES.SUCCESS,
        message: validationSuccess || 'eSign token validated successfully.',
      };
    }

    if (isExhausted) {
      return {
        type: ALERT_TYPES.CRITICAL,
        message: TOKEN_MESSAGES.TOKEN_REFRESH_FAILED,
      };
    }

    if (validationError) {
      return {
        type: ALERT_TYPES.CRITICAL,
        message: validationError,
      };
    }

    return null;
  })();

  const wrapperClassName = [className].filter(Boolean).join(' ');

  return (
    <div
      className={wrapperClassName}
      style={{
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      <h2
        style={{
          fontSize: 'var(--hb-font-size-h3)',
          fontWeight: 500,
          textAlign: 'center',
          marginBottom: 'var(--hb-space-md)',
          color: 'var(--hb-primary-black)',
        }}
      >
        eSign Token Validation
      </h2>

      <p
        style={{
          textAlign: 'center',
          fontSize: 'var(--hb-font-size-sm)',
          color: 'var(--hb-secondary-gray)',
          marginBottom: 'var(--hb-space-lg)',
        }}
      >
        Please enter your eSign confirmation token to proceed with the card management action.
      </p>

      {/* Status region for screen readers */}
      <div
        aria-live="polite"
        aria-atomic="true"
        role="status"
        className="sr-only"
      >
        {isValidating && 'Validating eSign token, please wait.'}
        {showSuccess && !isValidating && 'eSign token validated successfully.'}
        {validationError && !isValidating && `Token validation failed: ${validationError}`}
        {isExhausted && !isValidating && 'All validation attempts have been exhausted.'}
      </div>

      {/* Alert messages */}
      {alertInfo && !isValidating && (
        <Alert
          type={alertInfo.type}
          message={alertInfo.message}
        />
      )}

      {/* Attempt counter */}
      {attemptsUsed > 0 && !showSuccess && !isValidating && (
        <Alert
          type={isExhausted ? ALERT_TYPES.CRITICAL : ALERT_TYPES.WARNING}
          message={
            isExhausted
              ? 'All token validation attempts have been exhausted. Please try again later or contact support.'
              : `Attempt ${attemptsUsed} of ${attemptsUsed + attemptsRemaining}. You have ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining.`
          }
        />
      )}

      {/* Validating state */}
      {isValidating && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--hb-space-md)',
            padding: 'var(--hb-space-xl) 0',
          }}
        >
          <LoadingSpinner size="large" label="Validating eSign token…" />
          <p
            style={{
              fontSize: 'var(--hb-font-size-sm)',
              color: 'var(--hb-secondary-gray)',
              margin: 0,
            }}
          >
            Validating your eSign token, please wait…
          </p>
        </div>
      )}

      {/* Success state */}
      {showSuccess && !isValidating && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--hb-space-md)',
            padding: 'var(--hb-space-lg) 0',
          }}
        >
          <SuccessIcon />

          <p
            style={{
              fontSize: 'var(--hb-font-size-base)',
              fontWeight: 500,
              color: 'var(--hb-secondary-green)',
              margin: 0,
              textAlign: 'center',
            }}
          >
            Token Validated Successfully
          </p>

          <p
            style={{
              fontSize: 'var(--hb-font-size-sm)',
              color: 'var(--hb-secondary-gray)',
              margin: 0,
              textAlign: 'center',
            }}
          >
            Your eSign token has been verified. You may now proceed with the card management action.
          </p>

          {typeof onProceed === 'function' && (
            <div style={{ marginTop: 'var(--hb-space-md)' }}>
              <Button
                variant="primary"
                label="Proceed"
                onClick={handleProceed}
                ariaLabel="Proceed with card management action"
              />
            </div>
          )}
        </div>
      )}

      {/* Error state with guidance */}
      {validationError && !isValidating && !showSuccess && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--hb-space-md)',
            padding: 'var(--hb-space-lg) 0',
          }}
        >
          <ErrorIcon />

          <p
            style={{
              fontSize: 'var(--hb-font-size-base)',
              fontWeight: 500,
              color: 'var(--hb-secondary-red)',
              margin: 0,
              textAlign: 'center',
            }}
          >
            Token Validation Failed
          </p>

          <div
            style={{
              backgroundColor: 'var(--hb-secondary-gray-lighter)',
              borderRadius: 'var(--hb-radius-md)',
              padding: 'var(--hb-space-md)',
              width: '100%',
            }}
          >
            <p
              style={{
                fontSize: 'var(--hb-font-size-sm)',
                color: 'var(--hb-primary-black)',
                fontWeight: 500,
                margin: '0 0 var(--hb-space-sm) 0',
              }}
            >
              What you can do:
            </p>
            <ul
              style={{
                fontSize: 'var(--hb-font-size-sm)',
                color: 'var(--hb-secondary-gray)',
                margin: 0,
                paddingLeft: 'var(--hb-space-lg)',
                listStyle: 'disc',
              }}
            >
              <li style={{ marginBottom: 'var(--hb-space-xs)' }}>
                Double-check that you have entered the correct token.
              </li>
              <li style={{ marginBottom: 'var(--hb-space-xs)' }}>
                Ensure the token has not expired. Tokens are valid for a limited time.
              </li>
              <li style={{ marginBottom: 'var(--hb-space-xs)' }}>
                If the problem persists, contact your system administrator for a new token.
              </li>
            </ul>
          </div>

          {!isExhausted && (
            <div style={{ marginTop: 'var(--hb-space-sm)' }}>
              <Button
                variant="secondary"
                label="Try Again"
                onClick={handleRetry}
                ariaLabel="Try entering the eSign token again"
              />
            </div>
          )}
        </div>
      )}

      {/* Token input form — shown when idle (no success, no error with guidance visible, not validating) */}
      {!showSuccess && !isValidating && !validationError && (
        <form
          onSubmit={tokenForm.handleSubmit}
          noValidate
          aria-label="eSign token validation form"
        >
          <FormField
            label="eSign Token"
            name="token"
            type="text"
            value={tokenForm.values.token}
            onChange={tokenForm.handleChange}
            onBlur={tokenForm.handleBlur}
            error={tokenForm.errors.token}
            touched={tokenForm.touched.token}
            required
            disabled={isFormDisabled}
            autoComplete="off"
          />

          <div style={{ marginTop: 'var(--hb-space-md)' }}>
            <Button
              type="submit"
              variant="primary"
              label="Validate Token"
              loading={isValidating || authLoading}
              disabled={isFormDisabled}
              fullWidth
              ariaLabel="Validate eSign token"
            />
          </div>
        </form>
      )}

      {/* Exhausted state message */}
      {isExhausted && !isValidating && (
        <p
          aria-live="polite"
          aria-atomic="true"
          style={{
            textAlign: 'center',
            marginTop: 'var(--hb-space-md)',
            fontSize: 'var(--hb-font-size-sm)',
            color: 'var(--hb-secondary-red)',
            fontWeight: 500,
          }}
        >
          Token validation attempts exhausted. Please try again later or contact support.
        </p>
      )}
    </div>
  );
}

TokenValidationStatus.propTypes = {
  onValidationSuccess: PropTypes.func,
  onProceed: PropTypes.func,
  className: PropTypes.string,
};

export default TokenValidationStatus;