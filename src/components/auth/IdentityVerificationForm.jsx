/**
 * Identity verification form component for KBA/OTP step.
 *
 * Renders either KBA (Knowledge-Based Authentication) questions or an
 * OTP (One-Time Password) input field based on the selected verification
 * method. Shows attempt count and remaining attempts, displays contextual
 * error/success messages, and integrates with {@link AuthContext} for
 * the verification action.
 *
 * Uses {@link useFormValidation} for inline validation and HB CSS
 * framework classes for styling consistency.
 *
 * @module IdentityVerificationForm
 */

import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFormValidation } from '../../hooks/useFormValidation.js';
import { FormField } from '../common/FormField.jsx';
import { Button } from '../common/Button.jsx';
import { Alert } from '../common/Alert.jsx';
import { validateRequired, validateMinLength } from '../../utils/validators.js';
import { VERIFICATION_METHODS } from '../../services/verificationService.js';
import { getVerificationAttempts, sendVerificationCode } from '../../services/verificationService.js';
import { ALERT_TYPES } from '../../constants/constants.js';
import { VERIFICATION_MESSAGES } from '../../constants/messages.js';

/**
 * KBA question labels mapped to their field identifiers.
 * These correspond to the mock KBA answer keys in verificationService.
 *
 * @type {Array<{ id: string, label: string }>}
 */
const KBA_QUESTIONS = [
  { id: 'mothersMaidenName', label: "What is your mother's maiden name?" },
  { id: 'cityOfBirth', label: 'In what city were you born?' },
  { id: 'highSchoolMascot', label: 'What was your high school mascot?' },
];

/**
 * Identity verification form component.
 *
 * Renders a verification form that supports two methods:
 *   - **OTP** — a single input field for a one-time password code.
 *   - **KBA** — multiple input fields for knowledge-based authentication
 *     questions.
 *
 * Integrates with {@link AuthContext} for the `verifyIdentity` action and
 * {@link useFormValidation} for field-level validation. Displays attempt
 * counts, remaining attempts, and contextual error/success messages.
 *
 * @param {Object} [props]
 * @param {string} [props.initialMethod='otp'] - The initial verification
 *   method to display. One of `'otp'` or `'kba'`.
 * @param {function} [props.onVerificationSuccess] - Optional callback
 *   invoked when verification succeeds.
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the wrapper element.
 * @returns {React.ReactElement} The rendered identity verification form.
 */
export function IdentityVerificationForm({
  initialMethod = VERIFICATION_METHODS.OTP,
  onVerificationSuccess = null,
  className = '',
}) {
  const { verifyIdentity, user, isAuthenticated, loading: authLoading } = useAuth();

  const [method, setMethod] = useState(() => {
    if (
      initialMethod === VERIFICATION_METHODS.OTP ||
      initialMethod === VERIFICATION_METHODS.KBA
    ) {
      return initialMethod;
    }
    return VERIFICATION_METHODS.OTP;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [verificationSuccess, setVerificationSuccess] = useState(null);
  const [attemptsUsed, setAttemptsUsed] = useState(() => {
    try {
      const status = getVerificationAttempts();
      return status.attemptsUsed;
    } catch {
      return 0;
    }
  });
  const [attemptsRemaining, setAttemptsRemaining] = useState(() => {
    try {
      const status = getVerificationAttempts();
      return status.attemptsRemaining;
    } catch {
      return 3;
    }
  });
  const [isExhausted, setIsExhausted] = useState(() => {
    try {
      const status = getVerificationAttempts();
      return status.isExhausted;
    } catch {
      return false;
    }
  });
  const [codeSent, setCodeSent] = useState(false);

  /**
   * Builds the initial values and validation rules based on the current
   * verification method.
   */
  const otpInitialValues = useMemo(() => ({ otp: '' }), []);
  const kbaInitialValues = useMemo(() => ({
    mothersMaidenName: '',
    cityOfBirth: '',
    highSchoolMascot: '',
  }), []);

  const otpValidationRules = useMemo(() => ({
    otp: [
      (value) => validateRequired(value, 'Verification code'),
      (value) => validateMinLength(value, 6),
    ],
  }), []);

  const kbaValidationRules = useMemo(() => ({
    mothersMaidenName: [
      (value) => validateRequired(value, 'Answer'),
    ],
    cityOfBirth: [
      (value) => validateRequired(value, 'Answer'),
    ],
    highSchoolMascot: [
      (value) => validateRequired(value, 'Answer'),
    ],
  }), []);

  /**
   * Handles OTP form submission.
   *
   * @param {Object} formValues - The current form field values.
   */
  const handleOtpSubmit = useCallback((formValues) => {
    if (isExhausted || !isAuthenticated) {
      return;
    }

    setIsSubmitting(true);
    setVerificationError(null);
    setVerificationSuccess(null);

    try {
      const result = verifyIdentity({
        method: VERIFICATION_METHODS.OTP,
        otp: formValues.otp,
      });

      if (result.status === 'success' && result.verified) {
        setVerificationSuccess(result.message || VERIFICATION_MESSAGES.VERIFICATION_SUCCESS);
        setVerificationError(null);

        if (typeof result.attemptsUsed === 'number') {
          setAttemptsUsed(result.attemptsUsed);
        }
        if (typeof result.attemptsRemaining === 'number') {
          setAttemptsRemaining(result.attemptsRemaining);
        }

        if (typeof onVerificationSuccess === 'function') {
          try {
            onVerificationSuccess();
          } catch {
            // Callback errors must not break the verification flow.
          }
        }
      } else {
        setVerificationError(result.message || VERIFICATION_MESSAGES.VERIFICATION_FAILED);

        if (typeof result.attemptsUsed === 'number') {
          setAttemptsUsed(result.attemptsUsed);
        }
        if (typeof result.attemptsRemaining === 'number') {
          setAttemptsRemaining(result.attemptsRemaining);
          setIsExhausted(result.attemptsRemaining <= 0);
        }
      }
    } catch {
      setVerificationError(VERIFICATION_MESSAGES.VERIFICATION_FAILED);
    } finally {
      setIsSubmitting(false);
    }
  }, [verifyIdentity, isAuthenticated, isExhausted, onVerificationSuccess]);

  /**
   * Handles KBA form submission.
   *
   * @param {Object} formValues - The current form field values.
   */
  const handleKbaSubmit = useCallback((formValues) => {
    if (isExhausted || !isAuthenticated) {
      return;
    }

    setIsSubmitting(true);
    setVerificationError(null);
    setVerificationSuccess(null);

    try {
      const result = verifyIdentity({
        method: VERIFICATION_METHODS.KBA,
        kbaAnswers: {
          mothersMaidenName: formValues.mothersMaidenName,
          cityOfBirth: formValues.cityOfBirth,
          highSchoolMascot: formValues.highSchoolMascot,
        },
      });

      if (result.status === 'success' && result.verified) {
        setVerificationSuccess(result.message || VERIFICATION_MESSAGES.VERIFICATION_SUCCESS);
        setVerificationError(null);

        if (typeof result.attemptsUsed === 'number') {
          setAttemptsUsed(result.attemptsUsed);
        }
        if (typeof result.attemptsRemaining === 'number') {
          setAttemptsRemaining(result.attemptsRemaining);
        }

        if (typeof onVerificationSuccess === 'function') {
          try {
            onVerificationSuccess();
          } catch {
            // Callback errors must not break the verification flow.
          }
        }
      } else {
        setVerificationError(result.message || VERIFICATION_MESSAGES.VERIFICATION_FAILED);

        if (typeof result.attemptsUsed === 'number') {
          setAttemptsUsed(result.attemptsUsed);
        }
        if (typeof result.attemptsRemaining === 'number') {
          setAttemptsRemaining(result.attemptsRemaining);
          setIsExhausted(result.attemptsRemaining <= 0);
        }
      }
    } catch {
      setVerificationError(VERIFICATION_MESSAGES.VERIFICATION_FAILED);
    } finally {
      setIsSubmitting(false);
    }
  }, [verifyIdentity, isAuthenticated, isExhausted, onVerificationSuccess]);

  const otpForm = useFormValidation({
    initialValues: otpInitialValues,
    validationRules: otpValidationRules,
    onSubmit: handleOtpSubmit,
  });

  const kbaForm = useFormValidation({
    initialValues: kbaInitialValues,
    validationRules: kbaValidationRules,
    onSubmit: handleKbaSubmit,
  });

  /**
   * Switches the verification method and clears any existing messages.
   *
   * @param {string} newMethod - The method to switch to.
   */
  const handleMethodSwitch = useCallback((newMethod) => {
    if (newMethod === method) {
      return;
    }

    setMethod(newMethod);
    setVerificationError(null);
    setVerificationSuccess(null);
    otpForm.resetForm();
    kbaForm.resetForm();
  }, [method, otpForm, kbaForm]);

  /**
   * Handles the "Send Code" action for OTP verification.
   */
  const handleSendCode = useCallback(() => {
    if (!user || !isAuthenticated) {
      return;
    }

    try {
      const result = sendVerificationCode({ userId: user.id });

      if (result.status === 'success') {
        setCodeSent(true);
        setVerificationSuccess(result.message || VERIFICATION_MESSAGES.VERIFICATION_CODE_SENT);
        setVerificationError(null);
      } else {
        setVerificationError(result.message || 'Failed to send verification code.');
      }
    } catch {
      setVerificationError('An unexpected error occurred while sending the verification code.');
    }
  }, [user, isAuthenticated]);

  const isFormDisabled = isSubmitting || authLoading || isExhausted;

  /**
   * Determines the alert to display above the form.
   *
   * @returns {{ type: string, message: string }|null}
   */
  const alertInfo = (() => {
    if (verificationSuccess) {
      return {
        type: ALERT_TYPES.SUCCESS,
        message: verificationSuccess,
      };
    }

    if (isExhausted) {
      return {
        type: ALERT_TYPES.CRITICAL,
        message: VERIFICATION_MESSAGES.VERIFICATION_FAILED,
      };
    }

    if (verificationError) {
      return {
        type: ALERT_TYPES.CRITICAL,
        message: verificationError,
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
        Identity Verification
      </h2>

      <p
        style={{
          textAlign: 'center',
          fontSize: 'var(--hb-font-size-sm)',
          color: 'var(--hb-secondary-gray)',
          marginBottom: 'var(--hb-space-lg)',
        }}
      >
        {VERIFICATION_MESSAGES.VERIFICATION_REQUIRED}
      </p>

      {/* Method selector */}
      <div
        role="tablist"
        aria-label="Verification method"
        style={{
          display: 'flex',
          gap: 'var(--hb-space-sm)',
          marginBottom: 'var(--hb-space-lg)',
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={method === VERIFICATION_METHODS.OTP ? 'true' : 'false'}
          aria-controls="verification-panel-otp"
          id="verification-tab-otp"
          onClick={() => handleMethodSwitch(VERIFICATION_METHODS.OTP)}
          disabled={isFormDisabled}
          className={method === VERIFICATION_METHODS.OTP ? 'button-primary' : 'button-secondary-2'}
          style={{ flex: 1 }}
        >
          One-Time Code
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={method === VERIFICATION_METHODS.KBA ? 'true' : 'false'}
          aria-controls="verification-panel-kba"
          id="verification-tab-kba"
          onClick={() => handleMethodSwitch(VERIFICATION_METHODS.KBA)}
          disabled={isFormDisabled}
          className={method === VERIFICATION_METHODS.KBA ? 'button-primary' : 'button-secondary-2'}
          style={{ flex: 1 }}
        >
          Security Questions
        </button>
      </div>

      {/* Alert messages */}
      {alertInfo && (
        <Alert
          type={alertInfo.type}
          message={alertInfo.message}
        />
      )}

      {/* Attempt counter */}
      {attemptsUsed > 0 && !verificationSuccess && (
        <Alert
          type={isExhausted ? ALERT_TYPES.CRITICAL : ALERT_TYPES.WARNING}
          message={
            isExhausted
              ? 'All verification attempts have been exhausted. Please try again later.'
              : `Attempt ${attemptsUsed} of ${attemptsUsed + attemptsRemaining}. You have ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining.`
          }
        />
      )}

      {/* OTP Panel */}
      {method === VERIFICATION_METHODS.OTP && (
        <div
          id="verification-panel-otp"
          role="tabpanel"
          aria-labelledby="verification-tab-otp"
        >
          {!codeSent && (
            <div
              style={{
                textAlign: 'center',
                marginBottom: 'var(--hb-space-lg)',
              }}
            >
              <p
                style={{
                  fontSize: 'var(--hb-font-size-sm)',
                  color: 'var(--hb-secondary-gray)',
                  marginBottom: 'var(--hb-space-md)',
                }}
              >
                Click the button below to receive a one-time verification code.
              </p>
              <Button
                variant="secondary"
                label="Send Verification Code"
                onClick={handleSendCode}
                disabled={isFormDisabled}
                ariaLabel="Send a one-time verification code"
              />
            </div>
          )}

          {codeSent && (
            <form
              onSubmit={otpForm.handleSubmit}
              noValidate
              aria-label="OTP verification form"
            >
              <p
                style={{
                  fontSize: 'var(--hb-font-size-sm)',
                  color: 'var(--hb-secondary-gray)',
                  marginBottom: 'var(--hb-space-md)',
                }}
              >
                Enter the 6-digit verification code sent to your registered contact.
              </p>

              <FormField
                label="Verification Code"
                name="otp"
                type="text"
                value={otpForm.values.otp}
                onChange={otpForm.handleChange}
                onBlur={otpForm.handleBlur}
                error={otpForm.errors.otp}
                touched={otpForm.touched.otp}
                required
                disabled={isFormDisabled}
                autoComplete="one-time-code"
              />

              <div
                style={{
                  display: 'flex',
                  gap: 'var(--hb-space-sm)',
                  marginTop: 'var(--hb-space-md)',
                }}
              >
                <Button
                  variant="secondary"
                  label="Resend Code"
                  onClick={handleSendCode}
                  disabled={isFormDisabled}
                  ariaLabel="Resend verification code"
                />
                <Button
                  type="submit"
                  variant="primary"
                  label="Verify"
                  loading={isSubmitting || authLoading}
                  disabled={isFormDisabled}
                  ariaLabel="Submit verification code"
                />
              </div>
            </form>
          )}
        </div>
      )}

      {/* KBA Panel */}
      {method === VERIFICATION_METHODS.KBA && (
        <div
          id="verification-panel-kba"
          role="tabpanel"
          aria-labelledby="verification-tab-kba"
        >
          <form
            onSubmit={kbaForm.handleSubmit}
            noValidate
            aria-label="Security questions verification form"
          >
            <p
              style={{
                fontSize: 'var(--hb-font-size-sm)',
                color: 'var(--hb-secondary-gray)',
                marginBottom: 'var(--hb-space-md)',
              }}
            >
              Please answer the following security questions to verify your identity.
            </p>

            {KBA_QUESTIONS.map((question) => (
              <div key={question.id} style={{ marginBottom: 'var(--hb-space-sm)' }}>
                <p
                  style={{
                    fontSize: 'var(--hb-font-size-sm)',
                    fontWeight: 500,
                    color: 'var(--hb-primary-black)',
                    marginBottom: 'var(--hb-space-xs)',
                  }}
                >
                  {question.label}
                </p>
                <FormField
                  label="Your Answer"
                  name={question.id}
                  type="text"
                  value={kbaForm.values[question.id]}
                  onChange={kbaForm.handleChange}
                  onBlur={kbaForm.handleBlur}
                  error={kbaForm.errors[question.id]}
                  touched={kbaForm.touched[question.id]}
                  required
                  disabled={isFormDisabled}
                  autoComplete="off"
                />
              </div>
            ))}

            <div style={{ marginTop: 'var(--hb-space-md)' }}>
              <Button
                type="submit"
                variant="primary"
                label="Verify Identity"
                loading={isSubmitting || authLoading}
                disabled={isFormDisabled}
                fullWidth
                ariaLabel="Submit security question answers for verification"
              />
            </div>
          </form>
        </div>
      )}

      {/* Exhausted state message */}
      {isExhausted && (
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
          Verification attempts exhausted. Please try again later or contact support.
        </p>
      )}
    </div>
  );
}

IdentityVerificationForm.propTypes = {
  initialMethod: PropTypes.oneOf([VERIFICATION_METHODS.OTP, VERIFICATION_METHODS.KBA]),
  onVerificationSuccess: PropTypes.func,
  className: PropTypes.string,
};

export default IdentityVerificationForm;