/**
 * Add/Edit signer form component.
 *
 * Renders an accessible form for adding a new authorized signer or editing
 * an existing one. Required fields: First Name, Last Name, Title/Role,
 * Email Address, Phone Number. Optional fields: Middle Name, Suffix,
 * Additional Contact.
 *
 * Pre-populates fields in edit mode. Uses {@link useFormValidation} for
 * real-time inline validation and {@link FormField} components with
 * floating labels. Submits additions/edits via {@link AccountContext}.
 *
 * Uses HB CSS framework classes for styling consistency.
 *
 * @module SignerForm
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAccount } from '../../context/AccountContext.jsx';
import { useFormValidation } from '../../hooks/useFormValidation.js';
import { FormField } from '../common/FormField.jsx';
import { Button } from '../common/Button.jsx';
import { Alert } from '../common/Alert.jsx';
import {
  validateRequired,
  validateEmail,
  validatePhone,
  validateName,
  validateMinLength,
  validateMaxLength,
} from '../../utils/validators.js';
import { ALERT_TYPES } from '../../constants/constants.js';

/**
 * Builds initial form values from a signer object (edit mode) or
 * returns empty defaults (add mode).
 *
 * @param {Object|null} signer - The signer object to pre-populate from.
 * @returns {Object} Initial form values.
 */
function buildInitialValues(signer) {
  if (!signer || typeof signer !== 'object') {
    return {
      firstName: '',
      lastName: '',
      middleName: '',
      suffix: '',
      role: '',
      email: '',
      phone: '',
      additionalContact: '',
    };
  }

  return {
    firstName: signer.firstName || '',
    lastName: signer.lastName || '',
    middleName: signer.middleName || '',
    suffix: signer.suffix || '',
    role: signer.role === 'authorized_signer' ? 'Authorized Signer' : (signer.role || ''),
    email: signer.email || '',
    phone: signer.phone || '',
    additionalContact: signer.additionalContact || '',
  };
}

/**
 * Add/Edit signer form component.
 *
 * Renders a form with required and optional fields for signer management.
 * In edit mode, fields are pre-populated from the provided signer object.
 * Integrates with {@link AccountContext} for add/edit operations and
 * {@link useFormValidation} for field-level validation.
 *
 * @param {Object} [props]
 * @param {Object|null} [props.signer=null] - The signer object to edit.
 *   When `null`, the form operates in add mode.
 * @param {function} [props.onSuccess] - Optional callback invoked when
 *   the form submission succeeds. Receives the result object.
 * @param {function} [props.onCancel] - Optional callback invoked when
 *   the user clicks the Cancel button.
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the wrapper element.
 * @returns {React.ReactElement} The rendered signer form.
 */
export function SignerForm({
  signer = null,
  onSuccess = null,
  onCancel = null,
  className = '',
}) {
  const { addSigner, editSigner, selectedAccount } = useAccount();

  const isEditMode = signer !== null && signer !== undefined && typeof signer === 'object' && signer.id;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  const initialValues = useMemo(() => buildInitialValues(signer), [signer]);

  const validationRules = useMemo(() => ({
    firstName: [
      (value) => validateRequired(value, 'First Name'),
      (value) => validateName(value, 'First Name'),
      (value) => validateMinLength(value, 2),
      (value) => validateMaxLength(value, 50),
    ],
    lastName: [
      (value) => validateRequired(value, 'Last Name'),
      (value) => validateName(value, 'Last Name'),
      (value) => validateMinLength(value, 2),
      (value) => validateMaxLength(value, 50),
    ],
    middleName: [
      (value) => validateName(value, 'Middle Name'),
      (value) => validateMaxLength(value, 50),
    ],
    suffix: [
      (value) => validateMaxLength(value, 10),
    ],
    role: [
      (value) => validateRequired(value, 'Title/Role'),
      (value) => validateMinLength(value, 2),
      (value) => validateMaxLength(value, 100),
    ],
    email: [
      (value) => validateRequired(value, 'Email Address'),
      (value) => validateEmail(value),
    ],
    phone: [
      (value) => validateRequired(value, 'Phone Number'),
      (value) => validatePhone(value),
    ],
    additionalContact: [
      (value) => validateMaxLength(value, 200),
    ],
  }), []);

  /**
   * Handles form submission — validates fields and calls the appropriate
   * context action (add or edit).
   *
   * @param {Object} formValues - The current form field values.
   */
  const handleFormSubmit = useCallback((formValues) => {
    if (!selectedAccount) {
      setSubmitError('No account selected. Please select an account first.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      let result;

      if (isEditMode) {
        const changes = {};

        if (formValues.firstName !== (signer.firstName || '')) {
          changes.firstName = formValues.firstName.trim();
        }
        if (formValues.lastName !== (signer.lastName || '')) {
          changes.lastName = formValues.lastName.trim();
        }
        if (formValues.email !== (signer.email || '')) {
          changes.email = formValues.email.trim();
        }
        if (formValues.phone !== (signer.phone || '')) {
          changes.phone = formValues.phone.trim();
        }

        // Always include these fields if they have values
        if (formValues.middleName !== (signer.middleName || '')) {
          changes.middleName = formValues.middleName.trim();
        }
        if (formValues.suffix !== (signer.suffix || '')) {
          changes.suffix = formValues.suffix.trim();
        }
        if (formValues.additionalContact !== (signer.additionalContact || '')) {
          changes.additionalContact = formValues.additionalContact.trim();
        }

        // Map role back to internal format
        const roleValue = formValues.role.trim();
        const internalRole = roleValue === 'Authorized Signer' ? 'authorized_signer' : roleValue;
        const originalRole = signer.role || '';
        if (internalRole !== originalRole) {
          changes.role = internalRole;
        }

        if (Object.keys(changes).length === 0) {
          setSubmitError('No changes detected. Please modify at least one field.');
          setIsSubmitting(false);
          return;
        }

        result = editSigner(signer.id, changes);
      } else {
        const roleValue = formValues.role.trim();
        const internalRole = roleValue === 'Authorized Signer' ? 'authorized_signer' : roleValue;

        const signerData = {
          firstName: formValues.firstName.trim(),
          lastName: formValues.lastName.trim(),
          email: formValues.email.trim(),
          phone: formValues.phone.trim(),
          role: internalRole,
        };

        if (formValues.middleName && formValues.middleName.trim().length > 0) {
          signerData.middleName = formValues.middleName.trim();
        }
        if (formValues.suffix && formValues.suffix.trim().length > 0) {
          signerData.suffix = formValues.suffix.trim();
        }
        if (formValues.additionalContact && formValues.additionalContact.trim().length > 0) {
          signerData.additionalContact = formValues.additionalContact.trim();
        }

        result = addSigner(signerData);
      }

      if (result.status === 'success') {
        const successMessage = isEditMode
          ? result.message || 'Signer edits have been staged successfully.'
          : result.message || 'New signer has been staged for addition.';

        setSubmitSuccess(successMessage);
        setSubmitError(null);

        if (typeof onSuccess === 'function') {
          try {
            onSuccess(result);
          } catch {
            // Callback errors must not break the submission flow.
          }
        }
      } else {
        setSubmitError(result.message || 'An error occurred while saving the signer.');
      }
    } catch {
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isEditMode, signer, selectedAccount, addSigner, editSigner, onSuccess]);

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
  } = useFormValidation({
    initialValues,
    validationRules,
    onSubmit: handleFormSubmit,
  });

  /**
   * Handles the Cancel button click.
   */
  const handleCancel = useCallback(() => {
    setSubmitError(null);
    setSubmitSuccess(null);
    resetForm();

    if (typeof onCancel === 'function') {
      try {
        onCancel();
      } catch {
        // Callback errors must not break the UI flow.
      }
    }
  }, [onCancel, resetForm]);

  const isFormDisabled = isSubmitting || !!submitSuccess;

  /**
   * Determines the alert to display above the form.
   *
   * @returns {{ type: string, message: string }|null}
   */
  const alertInfo = (() => {
    if (submitSuccess) {
      return {
        type: ALERT_TYPES.SUCCESS,
        message: submitSuccess,
      };
    }

    if (submitError) {
      return {
        type: ALERT_TYPES.CRITICAL,
        message: submitError,
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
        maxWidth: '560px',
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
        {isEditMode ? 'Edit Signer' : 'Add New Signer'}
      </h2>

      <p
        style={{
          textAlign: 'center',
          fontSize: 'var(--hb-font-size-sm)',
          color: 'var(--hb-secondary-gray)',
          marginBottom: 'var(--hb-space-lg)',
        }}
      >
        {isEditMode
          ? 'Update the signer\'s information below. Changes will be staged for review before submission.'
          : 'Enter the new signer\'s information below. The signer will be added with a pending status.'}
      </p>

      {/* Screen reader status */}
      <div
        aria-live="polite"
        aria-atomic="true"
        role="status"
        className="sr-only"
      >
        {isSubmitting && 'Saving signer information, please wait.'}
        {submitSuccess && submitSuccess}
        {submitError && `Error: ${submitError}`}
      </div>

      {/* Alert messages */}
      {alertInfo && (
        <Alert
          type={alertInfo.type}
          message={alertInfo.message}
        />
      )}

      {!selectedAccount && (
        <Alert
          type={ALERT_TYPES.WARNING}
          message="No account selected. Please select an account before adding or editing signers."
        />
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-label={isEditMode ? 'Edit signer form' : 'Add new signer form'}
      >
        {/* Required fields section */}
        <fieldset
          style={{
            border: 'none',
            padding: 0,
            margin: 0,
            marginBottom: 'var(--hb-space-md)',
          }}
        >
          <legend
            style={{
              fontSize: 'var(--hb-font-size-base)',
              fontWeight: 500,
              color: 'var(--hb-primary-black)',
              marginBottom: 'var(--hb-space-md)',
            }}
          >
            Required Information
          </legend>

          <div
            style={{
              display: 'flex',
              gap: 'var(--hb-space-md)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
              <FormField
                label="First Name"
                name="firstName"
                type="text"
                value={values.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.firstName}
                touched={touched.firstName}
                required
                disabled={isFormDisabled || !selectedAccount}
                autoComplete="given-name"
              />
            </div>
            <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
              <FormField
                label="Last Name"
                name="lastName"
                type="text"
                value={values.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.lastName}
                touched={touched.lastName}
                required
                disabled={isFormDisabled || !selectedAccount}
                autoComplete="family-name"
              />
            </div>
          </div>

          <FormField
            label="Title/Role"
            name="role"
            type="text"
            value={values.role}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.role}
            touched={touched.role}
            required
            disabled={isFormDisabled || !selectedAccount}
            autoComplete="organization-title"
          />

          <FormField
            label="Email Address"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.email}
            touched={touched.email}
            required
            disabled={isFormDisabled || !selectedAccount}
            autoComplete="email"
          />

          <FormField
            label="Phone Number"
            name="phone"
            type="tel"
            value={values.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.phone}
            touched={touched.phone}
            required
            disabled={isFormDisabled || !selectedAccount}
            autoComplete="tel"
          />
        </fieldset>

        {/* Optional fields section */}
        <fieldset
          style={{
            border: 'none',
            padding: 0,
            margin: 0,
            marginBottom: 'var(--hb-space-md)',
          }}
        >
          <legend
            style={{
              fontSize: 'var(--hb-font-size-base)',
              fontWeight: 500,
              color: 'var(--hb-primary-black)',
              marginBottom: 'var(--hb-space-md)',
            }}
          >
            Optional Information
          </legend>

          <div
            style={{
              display: 'flex',
              gap: 'var(--hb-space-md)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
              <FormField
                label="Middle Name"
                name="middleName"
                type="text"
                value={values.middleName}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.middleName}
                touched={touched.middleName}
                disabled={isFormDisabled || !selectedAccount}
                autoComplete="additional-name"
              />
            </div>
            <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
              <FormField
                label="Suffix"
                name="suffix"
                type="text"
                value={values.suffix}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.suffix}
                touched={touched.suffix}
                disabled={isFormDisabled || !selectedAccount}
                autoComplete="honorific-suffix"
              />
            </div>
          </div>

          <FormField
            label="Additional Contact"
            name="additionalContact"
            type="text"
            value={values.additionalContact}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.additionalContact}
            touched={touched.additionalContact}
            disabled={isFormDisabled || !selectedAccount}
            autoComplete="off"
          />
        </fieldset>

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 'var(--hb-space-sm)',
            marginTop: 'var(--hb-space-lg)',
          }}
        >
          {typeof onCancel === 'function' && (
            <Button
              variant="secondary"
              label="Cancel"
              onClick={handleCancel}
              disabled={isSubmitting}
              ariaLabel={isEditMode ? 'Cancel editing signer' : 'Cancel adding signer'}
            />
          )}

          {!submitSuccess && (
            <Button
              type="submit"
              variant="primary"
              label={isEditMode ? 'Save Changes' : 'Add Signer'}
              loading={isSubmitting}
              disabled={isFormDisabled || !selectedAccount}
              ariaLabel={isEditMode ? 'Save signer changes' : 'Add new signer'}
            />
          )}
        </div>
      </form>
    </div>
  );
}

SignerForm.propTypes = {
  signer: PropTypes.shape({
    id: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    middleName: PropTypes.string,
    suffix: PropTypes.string,
    role: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    additionalContact: PropTypes.string,
    fullName: PropTypes.string,
    accountId: PropTypes.string,
    status: PropTypes.string,
  }),
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func,
  className: PropTypes.string,
};

export default SignerForm;