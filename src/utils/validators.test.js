import { describe, it, expect } from 'vitest';
import {
  validateRequired,
  validateEmail,
  validatePhone,
  validateName,
  validateMinLength,
  validateMaxLength,
  validateAccountNumber,
  validateCardNumber,
  validateSSN,
  getFieldError,
  validateForm,
} from './validators.js';
import { VALIDATION_MESSAGES } from '../constants/messages.js';

describe('validators', () => {
  // ---- validateRequired ----

  describe('validateRequired', () => {
    it('returns null for a non-empty string value', () => {
      expect(validateRequired('hello')).toBeNull();
    });

    it('returns null for a non-empty string with field name', () => {
      expect(validateRequired('hello', 'Username')).toBeNull();
    });

    it('returns error message for null value', () => {
      const result = validateRequired(null);

      expect(result).toBe(VALIDATION_MESSAGES.REQUIRED_FIELD);
    });

    it('returns named error message for null value with field name', () => {
      const result = validateRequired(null, 'Email');

      expect(result).toBe(VALIDATION_MESSAGES.REQUIRED_FIELD_NAMED('Email'));
      expect(result).toContain('Email');
    });

    it('returns error message for undefined value', () => {
      const result = validateRequired(undefined);

      expect(result).toBe(VALIDATION_MESSAGES.REQUIRED_FIELD);
    });

    it('returns named error message for undefined value with field name', () => {
      const result = validateRequired(undefined, 'Password');

      expect(result).toBe(VALIDATION_MESSAGES.REQUIRED_FIELD_NAMED('Password'));
      expect(result).toContain('Password');
    });

    it('returns error message for empty string', () => {
      const result = validateRequired('');

      expect(result).toBe(VALIDATION_MESSAGES.REQUIRED_FIELD);
    });

    it('returns named error message for empty string with field name', () => {
      const result = validateRequired('', 'First Name');

      expect(result).toBe(VALIDATION_MESSAGES.REQUIRED_FIELD_NAMED('First Name'));
      expect(result).toContain('First Name');
    });

    it('returns error message for whitespace-only string', () => {
      const result = validateRequired('   ');

      expect(result).toBe(VALIDATION_MESSAGES.REQUIRED_FIELD);
    });

    it('returns named error message for whitespace-only string with field name', () => {
      const result = validateRequired('   ', 'Last Name');

      expect(result).toBe(VALIDATION_MESSAGES.REQUIRED_FIELD_NAMED('Last Name'));
    });

    it('returns null for a string with leading/trailing whitespace but content', () => {
      expect(validateRequired('  hello  ')).toBeNull();
    });

    it('returns null for a numeric value (non-string)', () => {
      expect(validateRequired(42)).toBeNull();
    });

    it('returns null for a boolean value', () => {
      expect(validateRequired(true)).toBeNull();
      expect(validateRequired(false)).toBeNull();
    });

    it('returns null for zero', () => {
      expect(validateRequired(0)).toBeNull();
    });
  });

  // ---- validateEmail ----

  describe('validateEmail', () => {
    it('returns null for a valid email address', () => {
      expect(validateEmail('user@example.com')).toBeNull();
    });

    it('returns null for a valid email with subdomain', () => {
      expect(validateEmail('user@mail.example.com')).toBeNull();
    });

    it('returns null for a valid email with plus addressing', () => {
      expect(validateEmail('user+tag@example.com')).toBeNull();
    });

    it('returns null for a valid email with dots in local part', () => {
      expect(validateEmail('first.last@example.com')).toBeNull();
    });

    it('returns null for a valid email with hyphens in domain', () => {
      expect(validateEmail('user@my-domain.com')).toBeNull();
    });

    it('returns null for empty string (presence check is separate)', () => {
      expect(validateEmail('')).toBeNull();
    });

    it('returns null for null input', () => {
      expect(validateEmail(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(validateEmail(undefined)).toBeNull();
    });

    it('returns error for email without @ symbol', () => {
      const result = validateEmail('userexample.com');

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_EMAIL);
    });

    it('returns error for email without domain', () => {
      const result = validateEmail('user@');

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_EMAIL);
    });

    it('returns error for email without local part', () => {
      const result = validateEmail('@example.com');

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_EMAIL);
    });

    it('returns error for email without TLD', () => {
      const result = validateEmail('user@example');

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_EMAIL);
    });

    it('returns error for email with spaces', () => {
      const result = validateEmail('user @example.com');

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_EMAIL);
    });

    it('returns error for email with multiple @ symbols', () => {
      const result = validateEmail('user@@example.com');

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_EMAIL);
    });

    it('returns null for non-string input', () => {
      expect(validateEmail(12345)).toBeNull();
    });

    it('accepts a complex valid email', () => {
      expect(validateEmail('emily.chen@mitchellassoc.example.com')).toBeNull();
    });
  });

  // ---- validatePhone ----

  describe('validatePhone', () => {
    it('returns null for a valid 10-digit phone number with formatting', () => {
      expect(validatePhone('(555) 234-5678')).toBeNull();
    });

    it('returns null for a valid 10-digit phone number without formatting', () => {
      expect(validatePhone('5552345678')).toBeNull();
    });

    it('returns null for a valid 10-digit phone number with dashes', () => {
      expect(validatePhone('555-234-5678')).toBeNull();
    });

    it('returns null for a valid 10-digit phone number with dots', () => {
      expect(validatePhone('555.234.5678')).toBeNull();
    });

    it('returns null for a valid 11-digit phone number with US country code', () => {
      expect(validatePhone('15552345678')).toBeNull();
    });

    it('returns null for a valid phone with +1 prefix', () => {
      expect(validatePhone('+1 (555) 234-5678')).toBeNull();
    });

    it('returns null for empty string (presence check is separate)', () => {
      expect(validatePhone('')).toBeNull();
    });

    it('returns null for null input', () => {
      expect(validatePhone(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(validatePhone(undefined)).toBeNull();
    });

    it('returns error for a phone number with too few digits', () => {
      const result = validatePhone('555-1234');

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_PHONE);
    });

    it('returns error for a phone number with too many digits', () => {
      const result = validatePhone('555234567890123');

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_PHONE);
    });

    it('returns error for a 9-digit phone number', () => {
      const result = validatePhone('555234567');

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_PHONE);
    });

    it('returns error for a 11-digit phone number not starting with 1', () => {
      const result = validatePhone('25552345678');

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_PHONE);
    });

    it('returns null for non-string input', () => {
      expect(validatePhone(12345)).toBeNull();
    });

    it('returns error for a single digit', () => {
      const result = validatePhone('5');

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_PHONE);
    });
  });

  // ---- validateName ----

  describe('validateName', () => {
    it('returns null for a valid alphabetic name', () => {
      expect(validateName('Emily')).toBeNull();
    });

    it('returns null for a name with spaces', () => {
      expect(validateName('Emily Chen')).toBeNull();
    });

    it('returns null for a hyphenated name', () => {
      expect(validateName('Mary-Jane')).toBeNull();
    });

    it('returns null for a name with apostrophe', () => {
      expect(validateName("O'Brien")).toBeNull();
    });

    it('returns null for a name with accented characters', () => {
      expect(validateName('José')).toBeNull();
      expect(validateName('François')).toBeNull();
      expect(validateName('Müller')).toBeNull();
    });

    it('returns null for empty string (presence check is separate)', () => {
      expect(validateName('')).toBeNull();
    });

    it('returns null for null input', () => {
      expect(validateName(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(validateName(undefined)).toBeNull();
    });

    it('returns error for a name with numbers', () => {
      const result = validateName('Emily123');

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_FORMAT);
    });

    it('returns error for a name with special characters', () => {
      const result = validateName('Emily@Chen');

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_FORMAT);
    });

    it('returns error for a name with underscores', () => {
      const result = validateName('Emily_Chen');

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_FORMAT);
    });

    it('returns error for a name with exclamation mark', () => {
      const result = validateName('Emily!');

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_FORMAT);
    });

    it('returns null for non-string input', () => {
      expect(validateName(12345)).toBeNull();
    });

    it('returns null for a single letter name', () => {
      expect(validateName('A')).toBeNull();
    });

    it('accepts field name parameter without affecting validation logic', () => {
      expect(validateName('Emily', 'First Name')).toBeNull();
      expect(validateName('Emily123', 'First Name')).toBe(VALIDATION_MESSAGES.INVALID_FORMAT);
    });
  });

  // ---- validateMinLength ----

  describe('validateMinLength', () => {
    it('returns null when value meets minimum length', () => {
      expect(validateMinLength('hello', 3)).toBeNull();
    });

    it('returns null when value exactly meets minimum length', () => {
      expect(validateMinLength('ab', 2)).toBeNull();
    });

    it('returns null when value exceeds minimum length', () => {
      expect(validateMinLength('hello world', 2)).toBeNull();
    });

    it('returns error when value is shorter than minimum length', () => {
      const result = validateMinLength('a', 2);

      expect(result).toBe(VALIDATION_MESSAGES.MIN_LENGTH(2));
    });

    it('returns error when trimmed value is shorter than minimum length', () => {
      const result = validateMinLength(' a ', 2);

      expect(result).toBe(VALIDATION_MESSAGES.MIN_LENGTH(2));
    });

    it('returns null for empty string (presence check is separate)', () => {
      expect(validateMinLength('', 2)).toBeNull();
    });

    it('returns null for null input', () => {
      expect(validateMinLength(null, 2)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(validateMinLength(undefined, 2)).toBeNull();
    });

    it('returns null for non-string input', () => {
      expect(validateMinLength(12345, 2)).toBeNull();
    });

    it('returns error for single character when minimum is 6', () => {
      const result = validateMinLength('a', 6);

      expect(result).toBe(VALIDATION_MESSAGES.MIN_LENGTH(6));
    });
  });

  // ---- validateMaxLength ----

  describe('validateMaxLength', () => {
    it('returns null when value is within maximum length', () => {
      expect(validateMaxLength('hello', 10)).toBeNull();
    });

    it('returns null when value exactly meets maximum length', () => {
      expect(validateMaxLength('hello', 5)).toBeNull();
    });

    it('returns error when value exceeds maximum length', () => {
      const result = validateMaxLength('hello world', 5);

      expect(result).toBe(VALIDATION_MESSAGES.MAX_LENGTH(5));
    });

    it('returns null for empty string', () => {
      expect(validateMaxLength('', 5)).toBeNull();
    });

    it('returns null for null input', () => {
      expect(validateMaxLength(null, 5)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(validateMaxLength(undefined, 5)).toBeNull();
    });

    it('returns null for non-string input', () => {
      expect(validateMaxLength(12345, 5)).toBeNull();
    });

    it('returns error for a long string exceeding max of 10', () => {
      const result = validateMaxLength('this is a very long string', 10);

      expect(result).toBe(VALIDATION_MESSAGES.MAX_LENGTH(10));
    });

    it('returns null for a single character with max of 50', () => {
      expect(validateMaxLength('a', 50)).toBeNull();
    });
  });

  // ---- validateAccountNumber ----

  describe('validateAccountNumber', () => {
    it('returns null for a valid account number', () => {
      expect(validateAccountNumber('9200004567821')).toBeNull();
    });

    it('returns null for a 4-digit account number', () => {
      expect(validateAccountNumber('1234')).toBeNull();
    });

    it('returns null for a 17-digit account number', () => {
      expect(validateAccountNumber('12345678901234567')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(validateAccountNumber('')).toBeNull();
    });

    it('returns null for null input', () => {
      expect(validateAccountNumber(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(validateAccountNumber(undefined)).toBeNull();
    });

    it('returns error for a 3-digit account number', () => {
      const result = validateAccountNumber('123');

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_ACCOUNT_NUMBER);
    });

    it('returns error for an 18-digit account number', () => {
      const result = validateAccountNumber('123456789012345678');

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_ACCOUNT_NUMBER);
    });

    it('handles account numbers with non-digit characters', () => {
      expect(validateAccountNumber('9200-0045-67821')).toBeNull();
    });

    it('returns error for a single digit', () => {
      const result = validateAccountNumber('1');

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_ACCOUNT_NUMBER);
    });
  });

  // ---- validateCardNumber ----

  describe('validateCardNumber', () => {
    it('returns null for a valid 16-digit card number', () => {
      expect(validateCardNumber('4111111111114321')).toBeNull();
    });

    it('returns null for a valid 13-digit card number', () => {
      expect(validateCardNumber('4111111111111')).toBeNull();
    });

    it('returns null for a valid 19-digit card number', () => {
      expect(validateCardNumber('4111111111111111111')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(validateCardNumber('')).toBeNull();
    });

    it('returns null for null input', () => {
      expect(validateCardNumber(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(validateCardNumber(undefined)).toBeNull();
    });

    it('returns error for a 12-digit card number', () => {
      const result = validateCardNumber('411111111111');

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_CARD_NUMBER);
    });

    it('returns error for a 20-digit card number', () => {
      const result = validateCardNumber('41111111111111111111');

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_CARD_NUMBER);
    });

    it('handles card numbers with dashes and spaces', () => {
      expect(validateCardNumber('4111-1111-1111-4321')).toBeNull();
    });

    it('returns error for a 4-digit card number', () => {
      const result = validateCardNumber('4321');

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_CARD_NUMBER);
    });
  });

  // ---- validateSSN ----

  describe('validateSSN', () => {
    it('returns null for a valid SSN with dashes', () => {
      expect(validateSSN('123-45-6789')).toBeNull();
    });

    it('returns null for a valid SSN without dashes', () => {
      expect(validateSSN('123456789')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(validateSSN('')).toBeNull();
    });

    it('returns null for null input', () => {
      expect(validateSSN(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(validateSSN(undefined)).toBeNull();
    });

    it('returns error for an SSN with too few digits', () => {
      const result = validateSSN('12345678');

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_SSN);
    });

    it('returns error for an SSN with too many digits', () => {
      const result = validateSSN('1234567890');

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_SSN);
    });

    it('returns error for a 4-digit SSN', () => {
      const result = validateSSN('4589');

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_SSN);
    });

    it('returns null for non-string input', () => {
      expect(validateSSN(123456789)).toBeNull();
    });
  });

  // ---- getFieldError ----

  describe('getFieldError', () => {
    it('returns null when all validators pass', () => {
      const validators = [
        (value) => validateRequired(value, 'Email'),
        (value) => validateEmail(value),
      ];

      const result = getFieldError('user@example.com', validators);

      expect(result).toBeNull();
    });

    it('returns the first error when the first validator fails', () => {
      const validators = [
        (value) => validateRequired(value, 'Email'),
        (value) => validateEmail(value),
      ];

      const result = getFieldError('', validators);

      expect(result).toBe(VALIDATION_MESSAGES.REQUIRED_FIELD_NAMED('Email'));
    });

    it('returns the first error when a later validator fails', () => {
      const validators = [
        (value) => validateRequired(value, 'Email'),
        (value) => validateEmail(value),
      ];

      const result = getFieldError('not-an-email', validators);

      expect(result).toBe(VALIDATION_MESSAGES.INVALID_EMAIL);
    });

    it('stops at the first error and does not run subsequent validators', () => {
      let secondValidatorCalled = false;

      const validators = [
        (value) => validateRequired(value, 'Field'),
        () => {
          secondValidatorCalled = true;
          return 'Second error';
        },
      ];

      getFieldError(null, validators);

      expect(secondValidatorCalled).toBe(false);
    });

    it('returns null for empty validators array', () => {
      const result = getFieldError('hello', []);

      expect(result).toBeNull();
    });

    it('returns null for null validators', () => {
      const result = getFieldError('hello', null);

      expect(result).toBeNull();
    });

    it('returns null for undefined validators', () => {
      const result = getFieldError('hello', undefined);

      expect(result).toBeNull();
    });

    it('skips non-function entries in the validators array', () => {
      const validators = [
        null,
        'not a function',
        (value) => validateRequired(value, 'Field'),
      ];

      const result = getFieldError('hello', validators);

      expect(result).toBeNull();
    });

    it('handles validators that return null (passing)', () => {
      const validators = [
        () => null,
        () => null,
        () => null,
      ];

      const result = getFieldError('anything', validators);

      expect(result).toBeNull();
    });

    it('handles a single validator that fails', () => {
      const validators = [
        (value) => validateRequired(value, 'Username'),
      ];

      const result = getFieldError('', validators);

      expect(result).toBe(VALIDATION_MESSAGES.REQUIRED_FIELD_NAMED('Username'));
    });

    it('handles a single validator that passes', () => {
      const validators = [
        (value) => validateRequired(value, 'Username'),
      ];

      const result = getFieldError('cpuser01', validators);

      expect(result).toBeNull();
    });
  });

  // ---- validateForm ----

  describe('validateForm', () => {
    it('returns isValid true when all fields pass validation', () => {
      const result = validateForm({
        email: {
          value: 'user@example.com',
          validators: [
            (v) => validateRequired(v, 'Email'),
            validateEmail,
          ],
        },
        phone: {
          value: '(555) 234-5678',
          validators: [
            (v) => validateRequired(v, 'Phone'),
            validatePhone,
          ],
        },
      });

      expect(result.isValid).toBe(true);
      expect(result.errors.email).toBeNull();
      expect(result.errors.phone).toBeNull();
    });

    it('returns isValid false when one field fails validation', () => {
      const result = validateForm({
        email: {
          value: 'not-an-email',
          validators: [
            (v) => validateRequired(v, 'Email'),
            validateEmail,
          ],
        },
        phone: {
          value: '(555) 234-5678',
          validators: [
            (v) => validateRequired(v, 'Phone'),
            validatePhone,
          ],
        },
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe(VALIDATION_MESSAGES.INVALID_EMAIL);
      expect(result.errors.phone).toBeNull();
    });

    it('returns isValid false when multiple fields fail validation', () => {
      const result = validateForm({
        email: {
          value: '',
          validators: [
            (v) => validateRequired(v, 'Email'),
            validateEmail,
          ],
        },
        phone: {
          value: '',
          validators: [
            (v) => validateRequired(v, 'Phone'),
            validatePhone,
          ],
        },
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe(VALIDATION_MESSAGES.REQUIRED_FIELD_NAMED('Email'));
      expect(result.errors.phone).toBe(VALIDATION_MESSAGES.REQUIRED_FIELD_NAMED('Phone'));
    });

    it('returns the first error per field', () => {
      const result = validateForm({
        email: {
          value: '',
          validators: [
            (v) => validateRequired(v, 'Email'),
            validateEmail,
          ],
        },
      });

      // Should return the required error, not the email format error
      expect(result.errors.email).toBe(VALIDATION_MESSAGES.REQUIRED_FIELD_NAMED('Email'));
    });

    it('returns isValid true and empty errors for empty config', () => {
      const result = validateForm({});

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('returns isValid true and empty errors for null config', () => {
      const result = validateForm(null);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('returns isValid true and empty errors for undefined config', () => {
      const result = validateForm(undefined);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('handles fields without validators array gracefully', () => {
      const result = validateForm({
        name: {
          value: 'Emily',
        },
      });

      expect(result.isValid).toBe(true);
      expect(result.errors.name).toBeNull();
    });

    it('handles fields with null validators gracefully', () => {
      const result = validateForm({
        name: {
          value: 'Emily',
          validators: null,
        },
      });

      expect(result.isValid).toBe(true);
      expect(result.errors.name).toBeNull();
    });

    it('validates a complex form with multiple field types', () => {
      const result = validateForm({
        firstName: {
          value: 'Emily',
          validators: [
            (v) => validateRequired(v, 'First Name'),
            (v) => validateName(v, 'First Name'),
            (v) => validateMinLength(v, 2),
            (v) => validateMaxLength(v, 50),
          ],
        },
        lastName: {
          value: 'Chen',
          validators: [
            (v) => validateRequired(v, 'Last Name'),
            (v) => validateName(v, 'Last Name'),
            (v) => validateMinLength(v, 2),
            (v) => validateMaxLength(v, 50),
          ],
        },
        email: {
          value: 'emily.chen@example.com',
          validators: [
            (v) => validateRequired(v, 'Email'),
            validateEmail,
          ],
        },
        phone: {
          value: '(555) 234-5678',
          validators: [
            (v) => validateRequired(v, 'Phone'),
            validatePhone,
          ],
        },
      });

      expect(result.isValid).toBe(true);
      expect(result.errors.firstName).toBeNull();
      expect(result.errors.lastName).toBeNull();
      expect(result.errors.email).toBeNull();
      expect(result.errors.phone).toBeNull();
    });

    it('returns errors for a complex form with invalid data', () => {
      const result = validateForm({
        firstName: {
          value: '',
          validators: [
            (v) => validateRequired(v, 'First Name'),
            (v) => validateName(v, 'First Name'),
          ],
        },
        lastName: {
          value: 'Chen123',
          validators: [
            (v) => validateRequired(v, 'Last Name'),
            (v) => validateName(v, 'Last Name'),
          ],
        },
        email: {
          value: 'not-valid',
          validators: [
            (v) => validateRequired(v, 'Email'),
            validateEmail,
          ],
        },
        phone: {
          value: '123',
          validators: [
            (v) => validateRequired(v, 'Phone'),
            validatePhone,
          ],
        },
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.firstName).toBe(VALIDATION_MESSAGES.REQUIRED_FIELD_NAMED('First Name'));
      expect(result.errors.lastName).toBe(VALIDATION_MESSAGES.INVALID_FORMAT);
      expect(result.errors.email).toBe(VALIDATION_MESSAGES.INVALID_EMAIL);
      expect(result.errors.phone).toBe(VALIDATION_MESSAGES.INVALID_PHONE);
    });

    it('handles a mix of valid and invalid fields correctly', () => {
      const result = validateForm({
        firstName: {
          value: 'Emily',
          validators: [
            (v) => validateRequired(v, 'First Name'),
            (v) => validateName(v, 'First Name'),
          ],
        },
        email: {
          value: 'bad-email',
          validators: [
            (v) => validateRequired(v, 'Email'),
            validateEmail,
          ],
        },
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.firstName).toBeNull();
      expect(result.errors.email).toBe(VALIDATION_MESSAGES.INVALID_EMAIL);
    });
  });

  // ---- Integration / combined validators ----

  describe('combined validator chains', () => {
    it('validates a required email field with all checks', () => {
      const validators = [
        (v) => validateRequired(v, 'Email'),
        (v) => validateEmail(v),
      ];

      // Valid email
      expect(getFieldError('user@example.com', validators)).toBeNull();

      // Empty — fails required
      expect(getFieldError('', validators)).toBe(VALIDATION_MESSAGES.REQUIRED_FIELD_NAMED('Email'));

      // Invalid format — fails email
      expect(getFieldError('not-an-email', validators)).toBe(VALIDATION_MESSAGES.INVALID_EMAIL);
    });

    it('validates a required phone field with all checks', () => {
      const validators = [
        (v) => validateRequired(v, 'Phone'),
        (v) => validatePhone(v),
      ];

      // Valid phone
      expect(getFieldError('(555) 234-5678', validators)).toBeNull();

      // Empty — fails required
      expect(getFieldError('', validators)).toBe(VALIDATION_MESSAGES.REQUIRED_FIELD_NAMED('Phone'));

      // Invalid format — fails phone
      expect(getFieldError('123', validators)).toBe(VALIDATION_MESSAGES.INVALID_PHONE);
    });

    it('validates a required name field with length constraints', () => {
      const validators = [
        (v) => validateRequired(v, 'First Name'),
        (v) => validateName(v, 'First Name'),
        (v) => validateMinLength(v, 2),
        (v) => validateMaxLength(v, 50),
      ];

      // Valid name
      expect(getFieldError('Emily', validators)).toBeNull();

      // Empty — fails required
      expect(getFieldError('', validators)).toBe(VALIDATION_MESSAGES.REQUIRED_FIELD_NAMED('First Name'));

      // Invalid characters — fails name
      expect(getFieldError('Emily123', validators)).toBe(VALIDATION_MESSAGES.INVALID_FORMAT);

      // Too short — fails minLength
      expect(getFieldError('A', validators)).toBe(VALIDATION_MESSAGES.MIN_LENGTH(2));
    });

    it('validates an optional field that only checks format when present', () => {
      const validators = [
        (v) => validateName(v, 'Middle Name'),
        (v) => validateMaxLength(v, 50),
      ];

      // Empty — passes (optional)
      expect(getFieldError('', validators)).toBeNull();

      // Valid name
      expect(getFieldError('Marie', validators)).toBeNull();

      // Invalid characters
      expect(getFieldError('Marie@', validators)).toBe(VALIDATION_MESSAGES.INVALID_FORMAT);
    });
  });

  // ---- Edge cases ----

  describe('edge cases', () => {
    it('validateEmail handles email with very long domain', () => {
      expect(validateEmail('user@verylongdomainname.example.com')).toBeNull();
    });

    it('validatePhone handles phone with international format', () => {
      // +1 prefix with 10 digits = 11 digits starting with 1
      expect(validatePhone('+1-555-234-5678')).toBeNull();
    });

    it('validateName handles name with multiple hyphens', () => {
      expect(validateName('Mary-Jane-Smith')).toBeNull();
    });

    it('validateName handles name with multiple apostrophes', () => {
      expect(validateName("O'Brien-O'Malley")).toBeNull();
    });

    it('validateMinLength uses trimmed length', () => {
      // '  ab  ' trimmed is 'ab' which is length 2
      expect(validateMinLength('  ab  ', 2)).toBeNull();
      expect(validateMinLength('  a  ', 2)).toBe(VALIDATION_MESSAGES.MIN_LENGTH(2));
    });

    it('validateMaxLength uses raw length (not trimmed)', () => {
      // '  ab  ' is length 6
      expect(validateMaxLength('  ab  ', 5)).toBe(VALIDATION_MESSAGES.MAX_LENGTH(5));
      expect(validateMaxLength('  ab  ', 6)).toBeNull();
    });

    it('validateForm handles non-object config gracefully', () => {
      expect(validateForm('not an object')).toEqual({ isValid: true, errors: {} });
      expect(validateForm(42)).toEqual({ isValid: true, errors: {} });
      expect(validateForm(true)).toEqual({ isValid: true, errors: {} });
    });

    it('getFieldError handles validators that return empty string (falsy)', () => {
      const validators = [
        () => '',
        () => 'actual error',
      ];

      // Empty string is falsy, so it should be treated as passing
      const result = getFieldError('value', validators);
      expect(result).toBe('actual error');
    });

    it('getFieldError handles validators that return 0 (falsy)', () => {
      const validators = [
        () => 0,
        () => 'actual error',
      ];

      // 0 is falsy, so it should be treated as passing
      const result = getFieldError('value', validators);
      expect(result).toBe('actual error');
    });

    it('validateRequired returns null for an object value', () => {
      expect(validateRequired({})).toBeNull();
      expect(validateRequired([])).toBeNull();
    });
  });
});