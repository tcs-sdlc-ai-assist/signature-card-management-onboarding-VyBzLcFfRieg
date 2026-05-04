/**
 * Custom React hook for form validation.
 *
 * Accepts a field configuration with validation rules and provides
 * real-time inline validation on blur and change events. Returns
 * form state, error messages, touched fields, and handlers.
 *
 * Used by login, verification, and signer add/edit forms.
 *
 * @module useFormValidation
 */

import { useState, useCallback, useRef } from 'react';
import { getFieldError } from '../utils/validators.js';

/**
 * Custom React hook for form validation.
 *
 * @param {Object} params
 * @param {Object<string, *>} params.initialValues - Initial form field values
 *   keyed by field name.
 * @param {Object<string, Array<function>>} params.validationRules - Validation
 *   rules keyed by field name. Each value is an ordered array of validator
 *   functions that receive the field value and return an error message string
 *   or null.
 * @param {function} [params.onSubmit] - Callback invoked with the current
 *   form values when the form is submitted and all fields are valid.
 * @param {boolean} [params.validateOnChange=false] - When `true`, validation
 *   runs on every change event (not just blur). Defaults to `false`.
 * @returns {{
 *   values: Object<string, *>,
 *   errors: Object<string, string|null>,
 *   touched: Object<string, boolean>,
 *   handleChange: function(React.ChangeEvent|{name: string, value: *}): void,
 *   handleBlur: function(React.ChangeEvent|{name: string}): void,
 *   handleSubmit: function(React.FormEvent=): void,
 *   isValid: boolean,
 *   resetForm: function(Object<string, *>=): void,
 *   setFieldValue: function(string, *): void,
 *   setFieldError: function(string, string|null): void,
 *   setFieldTouched: function(string, boolean=): void,
 *   validateField: function(string, *=): string|null,
 *   validateAllFields: function(): boolean
 * }}
 */
export function useFormValidation({
  initialValues = {},
  validationRules = {},
  onSubmit = null,
  validateOnChange = false,
} = {}) {
  const [values, setValues] = useState({ ...initialValues });
  const [errors, setErrors] = useState(() => {
    const initial = {};
    for (const key of Object.keys(initialValues)) {
      initial[key] = null;
    }
    return initial;
  });
  const [touched, setTouched] = useState(() => {
    const initial = {};
    for (const key of Object.keys(initialValues)) {
      initial[key] = false;
    }
    return initial;
  });

  const validationRulesRef = useRef(validationRules);
  validationRulesRef.current = validationRules;

  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  /**
   * Validates a single field against its configured validators.
   *
   * @param {string} fieldName - The field name to validate.
   * @param {*} [value] - The value to validate. If omitted, the current
   *   value from state is used.
   * @returns {string|null} The first error message, or null if valid.
   */
  const validateField = useCallback((fieldName, value) => {
    const rules = validationRulesRef.current[fieldName];
    if (!rules || !Array.isArray(rules)) {
      return null;
    }

    const fieldValue = value !== undefined ? value : null;
    return getFieldError(fieldValue, rules);
  }, []);

  /**
   * Validates all fields and updates the errors state.
   *
   * @returns {boolean} `true` if all fields are valid.
   */
  const validateAllFields = useCallback(() => {
    const newErrors = {};
    let allValid = true;

    setValues((currentValues) => {
      for (const fieldName of Object.keys(currentValues)) {
        const error = validateField(fieldName, currentValues[fieldName]);
        newErrors[fieldName] = error;
        if (error) {
          allValid = false;
        }
      }
      return currentValues;
    });

    // Also check fields that exist in validation rules but not in values
    const ruleKeys = Object.keys(validationRulesRef.current);
    for (const fieldName of ruleKeys) {
      if (!(fieldName in newErrors)) {
        const error = validateField(fieldName, undefined);
        newErrors[fieldName] = error;
        if (error) {
          allValid = false;
        }
      }
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return allValid;
  }, [validateField]);

  /**
   * Handles input change events. Extracts the field name and value from
   * the event target or from a plain object `{ name, value }`.
   *
   * @param {React.ChangeEvent|{name: string, value: *}} eventOrField
   */
  const handleChange = useCallback((eventOrField) => {
    let fieldName;
    let fieldValue;

    if (eventOrField && eventOrField.target) {
      const { name, value, type, checked } = eventOrField.target;
      fieldName = name;
      fieldValue = type === 'checkbox' ? checked : value;
    } else if (eventOrField && typeof eventOrField === 'object') {
      fieldName = eventOrField.name;
      fieldValue = eventOrField.value;
    } else {
      return;
    }

    if (!fieldName) {
      return;
    }

    setValues((prev) => ({ ...prev, [fieldName]: fieldValue }));

    if (validateOnChange) {
      const error = validateField(fieldName, fieldValue);
      setErrors((prev) => ({ ...prev, [fieldName]: error }));
    } else {
      // Clear error on change if the field was previously touched and had an error
      setTouched((currentTouched) => {
        if (currentTouched[fieldName]) {
          const error = validateField(fieldName, fieldValue);
          setErrors((prev) => ({ ...prev, [fieldName]: error }));
        }
        return currentTouched;
      });
    }
  }, [validateField, validateOnChange]);

  /**
   * Handles input blur events. Marks the field as touched and runs
   * validation for the field.
   *
   * @param {React.ChangeEvent|{name: string}} eventOrField
   */
  const handleBlur = useCallback((eventOrField) => {
    let fieldName;

    if (eventOrField && eventOrField.target) {
      fieldName = eventOrField.target.name;
    } else if (eventOrField && typeof eventOrField === 'object') {
      fieldName = eventOrField.name;
    } else {
      return;
    }

    if (!fieldName) {
      return;
    }

    setTouched((prev) => ({ ...prev, [fieldName]: true }));

    setValues((currentValues) => {
      const error = validateField(fieldName, currentValues[fieldName]);
      setErrors((prev) => ({ ...prev, [fieldName]: error }));
      return currentValues;
    });
  }, [validateField]);

  /**
   * Handles form submission. Validates all fields, marks all as touched,
   * and invokes the `onSubmit` callback if all fields are valid.
   *
   * @param {React.FormEvent} [event] - Optional form event (will be
   *   prevented from default behavior).
   */
  const handleSubmit = useCallback((event) => {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    // Mark all fields as touched
    setTouched((prev) => {
      const allTouched = { ...prev };
      for (const key of Object.keys(allTouched)) {
        allTouched[key] = true;
      }
      // Also mark fields from validation rules
      for (const key of Object.keys(validationRulesRef.current)) {
        allTouched[key] = true;
      }
      return allTouched;
    });

    // Validate all fields synchronously using current values
    setValues((currentValues) => {
      const newErrors = {};
      let allValid = true;

      const allFieldNames = new Set([
        ...Object.keys(currentValues),
        ...Object.keys(validationRulesRef.current),
      ]);

      for (const fieldName of allFieldNames) {
        const error = validateField(fieldName, currentValues[fieldName]);
        newErrors[fieldName] = error;
        if (error) {
          allValid = false;
        }
      }

      setErrors((prev) => ({ ...prev, ...newErrors }));

      if (allValid && typeof onSubmitRef.current === 'function') {
        try {
          onSubmitRef.current({ ...currentValues });
        } catch {
          // onSubmit callback errors must not break the form flow.
        }
      }

      return currentValues;
    });
  }, [validateField]);

  /**
   * Resets the form to its initial state or to the provided values.
   *
   * @param {Object<string, *>} [newValues] - Optional new initial values.
   *   If omitted, the original `initialValues` are used.
   */
  const resetForm = useCallback((newValues) => {
    const resetValues = newValues || { ...initialValues };
    setValues(resetValues);

    const resetErrors = {};
    const resetTouched = {};
    for (const key of Object.keys(resetValues)) {
      resetErrors[key] = null;
      resetTouched[key] = false;
    }

    setErrors(resetErrors);
    setTouched(resetTouched);
  }, [initialValues]);

  /**
   * Sets the value of a single field programmatically.
   *
   * @param {string} fieldName - The field name.
   * @param {*} value - The new value.
   */
  const setFieldValue = useCallback((fieldName, value) => {
    if (!fieldName || typeof fieldName !== 'string') {
      return;
    }

    setValues((prev) => ({ ...prev, [fieldName]: value }));
  }, []);

  /**
   * Sets the error message for a single field programmatically.
   *
   * @param {string} fieldName - The field name.
   * @param {string|null} error - The error message, or null to clear.
   */
  const setFieldError = useCallback((fieldName, error) => {
    if (!fieldName || typeof fieldName !== 'string') {
      return;
    }

    setErrors((prev) => ({ ...prev, [fieldName]: error }));
  }, []);

  /**
   * Sets the touched state of a single field programmatically.
   *
   * @param {string} fieldName - The field name.
   * @param {boolean} [isTouched=true] - Whether the field is touched.
   */
  const setFieldTouched = useCallback((fieldName, isTouched = true) => {
    if (!fieldName || typeof fieldName !== 'string') {
      return;
    }

    setTouched((prev) => ({ ...prev, [fieldName]: isTouched }));
  }, []);

  // Compute isValid: all error values must be null
  const isValid = Object.values(errors).every((error) => error === null);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isValid,
    resetForm,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    validateField,
    validateAllFields,
  };
}