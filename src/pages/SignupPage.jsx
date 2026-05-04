import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext.jsx';
import { AppLayout } from '../components/layout/AppLayout.jsx';
import { FormField } from '../components/common/FormField.jsx';
import { Button } from '../components/common/Button.jsx';
import { Alert } from '../components/common/Alert.jsx';
import { ALERT_TYPES } from '../constants/constants.js';
import { useFormValidation } from '../hooks/useFormValidation.js';
import { validateRequired, validateEmail, validateMinLength } from '../utils/validators.js';

export function SignupPage({ onSignupSuccess = null, onLoginNavigate = null }) {
  const { signup, loading: authLoading } = useAuth();
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback((values) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const result = signup(values);
      if (result.status === 'success') {
        setSubmitSuccess(result.message || 'Account created. Please log in.');
        if (typeof onSignupSuccess === 'function') {
          onSignupSuccess();
        }
      } else {
        setSubmitError(result.message || 'Unable to create account.');
      }
    } catch {
      setSubmitError('Unable to create account.');
    } finally {
      setIsSubmitting(false);
    }
  }, [signup, onSignupSuccess]);

  const { values, errors, touched, handleChange, handleBlur, handleSubmit: onFormSubmit } =
    useFormValidation({
      initialValues: {
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
      },
      validationRules: {
        firstName: [(value) => validateRequired(value, 'First name')],
        lastName: [(value) => validateRequired(value, 'Last name')],
        email: [
          (value) => validateRequired(value, 'Email'),
          validateEmail,
        ],
        username: [
          (value) => validateRequired(value, 'Username'),
          (value) => validateMinLength(value, 4),
        ],
        password: [
          (value) => validateRequired(value, 'Password'),
          (value) => validateMinLength(value, 8),
        ],
      },
      onSubmit: handleSubmit,
    });

  const isFormDisabled = isSubmitting || authLoading;

  return (
    <AppLayout>
      <div
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
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <h1
            style={{
              fontSize: 'var(--hb-font-size-h2)',
              fontWeight: 500,
              textAlign: 'center',
              marginBottom: 'var(--hb-space-md)',
            }}
          >
            Create Account
          </h1>

          <p
            style={{
              fontSize: 'var(--hb-font-size-sm)',
              color: 'var(--hb-secondary-gray)',
              textAlign: 'center',
              marginBottom: 'var(--hb-space-lg)',
            }}
          >
            This is a frontend mock sign up flow. Your account is stored locally in this browser.
          </p>

          {submitError && <Alert type={ALERT_TYPES.CRITICAL} message={submitError} />}
          {submitSuccess && <Alert type={ALERT_TYPES.SUCCESS} message={submitSuccess} />}

          <form onSubmit={onFormSubmit} noValidate aria-label="Signup form">
            <FormField
              label="First Name"
              name="firstName"
              value={values.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.firstName}
              touched={touched.firstName}
              required
              disabled={isFormDisabled}
              autoComplete="given-name"
            />
            <FormField
              label="Last Name"
              name="lastName"
              value={values.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.lastName}
              touched={touched.lastName}
              required
              disabled={isFormDisabled}
              autoComplete="family-name"
            />
            <FormField
              label="Email"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.email}
              touched={touched.email}
              required
              disabled={isFormDisabled}
              autoComplete="email"
            />
            <FormField
              label="Username"
              name="username"
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
              autoComplete="new-password"
            />
            <div style={{ marginTop: 'var(--hb-space-md)' }}>
              <Button
                type="submit"
                variant="primary"
                label="Create Account"
                loading={isFormDisabled}
                disabled={isFormDisabled}
                fullWidth
                ariaLabel="Create a new account"
              />
            </div>
          </form>

          <p
            style={{
              marginTop: 'var(--hb-space-lg)',
              textAlign: 'center',
              fontSize: 'var(--hb-font-size-sm)',
              color: 'var(--hb-secondary-gray)',
            }}
          >
            Already have an account?{' '}
            <button
              type="button"
              onClick={onLoginNavigate}
              style={{
                border: 'none',
                background: 'none',
                color: 'var(--hb-primary-blue)',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

SignupPage.propTypes = {
  onSignupSuccess: PropTypes.func,
  onLoginNavigate: PropTypes.func,
};

export default SignupPage;
