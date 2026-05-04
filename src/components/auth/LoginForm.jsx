/**
 * Login form component with username and password fields.
 *
 * Renders an accessible login form using the floating label pattern
 * (HB CSS framework). Displays a generic error message on failed login
 * (does not reveal which field is incorrect). Shows remaining attempts
 * before lockout and disables the form during lockout periods with a
 * countdown timer.
 *
 * Uses {@link useFormValidation} for inline validation and
 * {@link AuthContext} for the login action.
 *
 * @module LoginForm
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFormValidation } from '../../hooks/useFormValidation.js';
import { FormField } from '../common/FormField.jsx';
import { Button } from '../common/Button.jsx';
import { Alert } from '../common/Alert.jsx';
import { validateRequired } from '../../utils/validators.js';
import { getLockoutStatus } from '../../services/authService.js';
import { ALERT_TYPES } from '../../constants/constants.js';
import { LOGIN_MESSAGES } from '../../constants/messages.js';

/**
 * Formats a remaining lockout duration in milliseconds into a human-readable
 * countdown string (e.g. "4:32").
 *
 * @param {number} ms - Remaining milliseconds.
 * @returns {string} Formatted countdown string.
 */
function formatLockoutCountdown(ms) {
  if (!ms || ms <= 0) {
    return '0:00';
  }

  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Login form component.
 *
 * Renders a username/password form with floating labels, inline validation,
 * generic error messaging on failure, remaining attempt warnings, and
 * lockout countdown. Integrates with {@link AuthContext} for authentication
 * and {@link useFormValidation} for field-level validation.
 *
 * @returns {React.ReactElement} The rendered login form.
 */
export function LoginForm() {
  const { login, loading: authLoading, error: authError, clearError } = useAuth();

  const [loginError, setLoginError] = useState(null);
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  const lockoutIntervalRef = useRef(null);
  const lockoutUntilRef = useRef(null);

  /**
   * Checks the current lockout status and updates local state accordingly.
   */
  const checkLockoutStatus = useCallback(() => {
    try {
      const status = getLockoutStatus();

      if (status.isLocked && status.lockoutUntil) {
        setIsLockedOut(true);
        lockoutUntilRef.current = status.lockoutUntil;

        const remaining = status.lockoutUntil - Date.now();
        setLockoutRemaining(Math.max(0, remaining));
      } else {
        setIsLockedOut(false);
        lockoutUntilRef.current = null;
        setLockoutRemaining(0);
      }
    } catch {
      // Lockout status check must not break the form.
    }
  }, []);

  /**
   * Starts a countdown interval for the lockout timer.
   */
  const startLockoutCountdown = useCallback(() => {
    // Clear any existing interval
    if (lockoutIntervalRef.current !== null) {
      clearInterval(lockoutIntervalRef.current);
      lockoutIntervalRef.current = null;
    }

    lockoutIntervalRef.current = setInterval(() => {
      if (!lockoutUntilRef.current) {
        clearInterval(lockoutIntervalRef.current);
        lockoutIntervalRef.current = null;
        setIsLockedOut(false);
        setLockoutRemaining(0);
        return;
      }

      const remaining = lockoutUntilRef.current - Date.now();

      if (remaining <= 0) {
        clearInterval(lockoutIntervalRef.current);
        lockoutIntervalRef.current = null;
        setIsLockedOut(false);
        setLockoutRemaining(0);
        lockoutUntilRef.current = null;
        setLoginError(null);
        setRemainingAttempts(null);
      } else {
        setLockoutRemaining(remaining);
      }
    }, 1000);
  }, []);

  // Check lockout status on mount
  useEffect(() => {
    checkLockoutStatus();
  }, [checkLockoutStatus]);

  // Start/stop lockout countdown when lockout state changes
  useEffect(() => {
    if (isLockedOut && lockoutRemaining > 0) {
      startLockoutCountdown();
    }

    return () => {
      if (lockoutIntervalRef.current !== null) {
        clearInterval(lockoutIntervalRef.current);
        lockoutIntervalRef.current = null;
      }
    };
  }, [isLockedOut, startLockoutCountdown]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Handles form submission — validates fields and calls the login action.
   *
   * @param {Object} formValues - The current form field values.
   */
  const handleLoginSubmit = useCallback((formValues) => {
    if (isLockedOut) {
      return;
    }

    setIsSubmitting(true);
    setLoginError(null);
    setRemainingAttempts(null);

    try {
      if (typeof clearError === 'function') {
        clearError();
      }

      const result = login(formValues.username, formValues.password);

      if (result.status === 'success') {
        // Login succeeded — AuthContext handles state updates
        setLoginError(null);
        setRemainingAttempts(null);
      } else {
        setLoginError(result.message || LOGIN_MESSAGES.INVALID_CREDENTIALS);

        if (typeof result.remainingAttempts === 'number') {
          setRemainingAttempts(result.remainingAttempts);
        }

        // Check if account is now locked
        checkLockoutStatus();
      }
    } catch {
      setLoginError(LOGIN_MESSAGES.INVALID_CREDENTIALS);
    } finally {
      setIsSubmitting(false);
    }
  }, [login, clearError, isLockedOut, checkLockoutStatus]);

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useFormValidation({
    initialValues: {
      username: '',
      password: '',
    },
    validationRules: {
      username: [
        (value) => validateRequired(value, 'Username'),
      ],
      password: [
        (value) => validateRequired(value, 'Password'),
      ],
    },
    onSubmit: handleLoginSubmit,
  });

  const isFormDisabled = isSubmitting || authLoading || isLockedOut;

  /**
   * Determines the alert message to display above the form.
   *
   * @returns {{ type: string, message: string }|null}
   */
  const alertInfo = (() => {
    if (isLockedOut) {
      const countdown = formatLockoutCountdown(lockoutRemaining);
      return {
        type: ALERT_TYPES.CRITICAL,
        message: `${LOGIN_MESSAGES.ACCOUNT_LOCKED} Time remaining: ${countdown}.`,
      };
    }

    if (loginError) {
      return {
        type: ALERT_TYPES.CRITICAL,
        message: loginError,
      };
    }

    if (authError && !loginError) {
      return {
        type: ALERT_TYPES.CRITICAL,
        message: authError,
      };
    }

    return null;
  })();

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto',
      }}
    >
      <h1
        style={{
          fontSize: 'var(--hb-font-size-h2)',
          fontWeight: 500,
          textAlign: 'center',
          marginBottom: 'var(--hb-space-lg)',
          color: 'var(--hb-primary-black)',
        }}
      >
        Sign In
      </h1>

      {alertInfo && (
        <Alert
          type={alertInfo.type}
          message={alertInfo.message}
        />
      )}

      {remainingAttempts !== null && remainingAttempts > 0 && !isLockedOut && (
        <Alert
          type={ALERT_TYPES.WARNING}
          message={LOGIN_MESSAGES.ATTEMPT_WARNING(remainingAttempts)}
        />
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-label="Login form"
      >
        <FormField
          label="Username"
          name="username"
          type="text"
          value={values.username}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.username}
          touched={touched.username}
          required
          disabled={isFormDisabled}
          autoComplete="username"
        />

        <FormField
          label="Password"
          name="password"
          type="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.password}
          touched={touched.password}
          required
          disabled={isFormDisabled}
          autoComplete="current-password"
        />

        <div style={{ marginTop: 'var(--hb-space-md)' }}>
          <Button
            type="submit"
            variant="primary"
            label="Sign In"
            loading={isSubmitting || authLoading}
            disabled={isFormDisabled}
            fullWidth
            ariaLabel="Sign in to your account"
          />
        </div>
      </form>

      {isLockedOut && (
        <p
          aria-live="polite"
          aria-atomic="true"
          role="timer"
          style={{
            textAlign: 'center',
            marginTop: 'var(--hb-space-md)',
            fontSize: 'var(--hb-font-size-sm)',
            color: 'var(--hb-secondary-gray)',
          }}
        >
          Account locked. Try again in{' '}
          <span
            style={{
              fontWeight: 700,
              color: 'var(--hb-secondary-red)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatLockoutCountdown(lockoutRemaining)}
          </span>
        </p>
      )}
    </div>
  );
}

export default LoginForm;