/**
 * Form field validation utilities.
 *
 * Provides reusable validators for common field types (email, phone, name, etc.)
 * and a generic `validateForm` runner that applies validators to a field config.
 * Used by add/edit signer forms and login/verification forms for real-time
 * inline validation.
 *
 * @module validators
 */

import { VALIDATION_MESSAGES } from '../constants/messages.js';

/**
 * Validates that a value is not empty, null, or undefined.
 *
 * @param {*} value - The value to check.
 * @param {string} [fieldName] - Optional field name for the error message.
 * @returns {string|null} Error message string, or null if valid.
 */
export function validateRequired(value, fieldName) {
  if (value === null || value === undefined) {
    return fieldName
      ? VALIDATION_MESSAGES.REQUIRED_FIELD_NAMED(fieldName)
      : VALIDATION_MESSAGES.REQUIRED_FIELD;
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    return fieldName
      ? VALIDATION_MESSAGES.REQUIRED_FIELD_NAMED(fieldName)
      : VALIDATION_MESSAGES.REQUIRED_FIELD;
  }

  return null;
}

/**
 * Validates an email address format.
 * Returns null if the value is empty (use `validateRequired` separately for presence checks).
 *
 * @param {string} email - The email address to validate.
 * @returns {string|null} Error message string, or null if valid.
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    return null;
  }

  // RFC-5322 simplified pattern — covers the vast majority of real-world addresses
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email.trim())) {
    return VALIDATION_MESSAGES.INVALID_EMAIL;
  }

  return null;
}

/**
 * Validates a US phone number format.
 * Accepts digits, spaces, dashes, parentheses, dots, and an optional leading +1.
 * Must contain exactly 10 digits (excluding country code).
 * Returns null if the value is empty.
 *
 * @param {string} phone - The phone number to validate.
 * @returns {string|null} Error message string, or null if valid.
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
    return null;
  }

  const digits = phone.replace(/\D/g, '');

  // Allow 10 digits, or 11 digits starting with 1 (US country code)
  if (digits.length === 10) {
    return null;
  }

  if (digits.length === 11 && digits[0] === '1') {
    return null;
  }

  return VALIDATION_MESSAGES.INVALID_PHONE;
}

/**
 * Validates a name field (alphabetic characters, spaces, hyphens, and apostrophes only).
 * Returns null if the value is empty.
 *
 * @param {string} name - The name value to validate.
 * @param {string} [fieldName] - Optional field name for contextual error messages.
 * @returns {string|null} Error message string, or null if valid.
 */
export function validateName(name, fieldName) {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return null;
  }

  // Allow letters (including accented), spaces, hyphens, and apostrophes
  const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;

  if (!nameRegex.test(name.trim())) {
    return VALIDATION_MESSAGES.INVALID_FORMAT;
  }

  return null;
}

/**
 * Validates that a string meets a minimum length requirement.
 * Returns null if the value is empty.
 *
 * @param {string} value - The value to check.
 * @param {number} min - Minimum number of characters.
 * @returns {string|null} Error message string, or null if valid.
 */
export function validateMinLength(value, min) {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }

  if (value.trim().length < min) {
    return VALIDATION_MESSAGES.MIN_LENGTH(min);
  }

  return null;
}

/**
 * Validates that a string does not exceed a maximum length.
 * Returns null if the value is empty.
 *
 * @param {string} value - The value to check.
 * @param {number} max - Maximum number of characters.
 * @returns {string|null} Error message string, or null if valid.
 */
export function validateMaxLength(value, max) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  if (value.length > max) {
    return VALIDATION_MESSAGES.MAX_LENGTH(max);
  }

  return null;
}

/**
 * Validates an account number format (digits only, reasonable length).
 * Returns null if the value is empty.
 *
 * @param {string} accountNumber - The account number to validate.
 * @returns {string|null} Error message string, or null if valid.
 */
export function validateAccountNumber(accountNumber) {
  if (!accountNumber || typeof accountNumber !== 'string' || accountNumber.trim().length === 0) {
    return null;
  }

  const digits = accountNumber.replace(/\D/g, '');

  if (digits.length < 4 || digits.length > 17) {
    return VALIDATION_MESSAGES.INVALID_ACCOUNT_NUMBER;
  }

  return null;
}

/**
 * Validates a card number format (digits only, 13–19 digits per ISO/IEC 7812).
 * Returns null if the value is empty.
 *
 * @param {string} cardNumber - The card number to validate.
 * @returns {string|null} Error message string, or null if valid.
 */
export function validateCardNumber(cardNumber) {
  if (!cardNumber || typeof cardNumber !== 'string' || cardNumber.trim().length === 0) {
    return null;
  }

  const digits = cardNumber.replace(/\D/g, '');

  if (digits.length < 13 || digits.length > 19) {
    return VALIDATION_MESSAGES.INVALID_CARD_NUMBER;
  }

  return null;
}

/**
 * Validates a Social Security Number (9 digits, with or without dashes).
 * Returns null if the value is empty.
 *
 * @param {string} ssn - The SSN to validate.
 * @returns {string|null} Error message string, or null if valid.
 */
export function validateSSN(ssn) {
  if (!ssn || typeof ssn !== 'string' || ssn.trim().length === 0) {
    return null;
  }

  const digits = ssn.replace(/\D/g, '');

  if (digits.length !== 9) {
    return VALIDATION_MESSAGES.INVALID_SSN;
  }

  return null;
}

/**
 * Returns the first error message for a given field by running an array of
 * validator functions in order. Stops at the first failure.
 *
 * Each validator is a function that receives the field value and returns
 * either an error message string or null.
 *
 * @param {*} value - The current field value.
 * @param {Array<function>} validators - Ordered array of validator functions.
 * @returns {string|null} The first error message, or null if all validators pass.
 */
export function getFieldError(value, validators) {
  if (!Array.isArray(validators)) {
    return null;
  }

  for (const validator of validators) {
    if (typeof validator !== 'function') {
      continue;
    }

    const error = validator(value);

    if (error) {
      return error;
    }
  }

  return null;
}

/**
 * Runs validation across all fields described by a field configuration object.
 *
 * The `fieldConfig` is a plain object where each key is a field name and each
 * value is an object with:
 *   - `value` {*}          — the current field value
 *   - `validators` {Array} — ordered array of validator functions
 *
 * @param {Object<string, { value: *, validators: Array<function> }>} fieldConfig
 * @returns {{ isValid: boolean, errors: Object<string, string|null> }}
 *   `isValid` is true when every field passes all its validators.
 *   `errors` maps each field name to its first error message (or null).
 *
 * @example
 * const result = validateForm({
 *   email: {
 *     value: formData.email,
 *     validators: [
 *       (v) => validateRequired(v, 'Email'),
 *       validateEmail,
 *     ],
 *   },
 *   phone: {
 *     value: formData.phone,
 *     validators: [validatePhone],
 *   },
 * });
 * // result.isValid  → true | false
 * // result.errors   → { email: null, phone: 'Please enter a valid phone number.' }
 */
export function validateForm(fieldConfig) {
  if (!fieldConfig || typeof fieldConfig !== 'object') {
    return { isValid: true, errors: {} };
  }

  const errors = {};
  let isValid = true;

  for (const fieldName of Object.keys(fieldConfig)) {
    const config = fieldConfig[fieldName];

    if (!config || !Array.isArray(config.validators)) {
      errors[fieldName] = null;
      continue;
    }

    const error = getFieldError(config.value, config.validators);
    errors[fieldName] = error;

    if (error) {
      isValid = false;
    }
  }

  return { isValid, errors };
}