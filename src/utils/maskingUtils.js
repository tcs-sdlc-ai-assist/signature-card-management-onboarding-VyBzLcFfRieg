/**
 * PII masking and sanitization utilities.
 *
 * Provides functions for masking sensitive data (account numbers, emails,
 * phone numbers, SSNs, card numbers) and sanitizing objects before logging.
 * Used across all UI components and the audit logger to ensure PII is never exposed.
 *
 * @module maskingUtils
 */

/**
 * Masks an account number, showing only the last 4 digits.
 * Returns the input unchanged if it is not a non-empty string.
 *
 * @param {string} accountNumber - The full or partial account number.
 * @returns {string} Masked account number (e.g. "****7821").
 */
export function maskAccountNumber(accountNumber) {
  if (!accountNumber || typeof accountNumber !== 'string') {
    return '';
  }

  const digits = accountNumber.replace(/\D/g, '');

  if (digits.length <= 4) {
    return accountNumber;
  }

  const lastFour = digits.slice(-4);
  return `****${lastFour}`;
}

/**
 * Masks a card number, showing only the last 4 digits.
 * Returns the input unchanged if it is not a non-empty string.
 *
 * @param {string} cardNumber - The full or partial card number.
 * @returns {string} Masked card number (e.g. "****4321").
 */
export function maskCardNumber(cardNumber) {
  if (!cardNumber || typeof cardNumber !== 'string') {
    return '';
  }

  const digits = cardNumber.replace(/\D/g, '');

  if (digits.length <= 4) {
    return cardNumber;
  }

  const lastFour = digits.slice(-4);
  return `****${lastFour}`;
}

/**
 * Masks an email address with partial masking of the local part.
 * Shows the first character and the last character of the local part,
 * with asterisks in between. The domain is left intact.
 *
 * @param {string} email - The full email address.
 * @returns {string} Masked email (e.g. "e***y@example.com").
 */
export function maskEmail(email) {
  if (!email || typeof email !== 'string') {
    return '';
  }

  const atIndex = email.indexOf('@');
  if (atIndex < 0) {
    return email;
  }

  const localPart = email.slice(0, atIndex);
  const domain = email.slice(atIndex);

  if (localPart.length <= 2) {
    return `${localPart[0]}***${domain}`;
  }

  const first = localPart[0];
  const last = localPart[localPart.length - 1];
  const maskedMiddle = '*'.repeat(Math.min(localPart.length - 2, 5));

  return `${first}${maskedMiddle}${last}${domain}`;
}

/**
 * Masks a phone number, showing only the last 4 digits.
 * Preserves any leading formatting hint (e.g. parentheses for area code).
 *
 * @param {string} phone - The full phone number.
 * @returns {string} Masked phone (e.g. "(***) ***-4567").
 */
export function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  const digits = phone.replace(/\D/g, '');

  if (digits.length <= 4) {
    return phone;
  }

  const lastFour = digits.slice(-4);
  return `(***) ***-${lastFour}`;
}

/**
 * Masks a Social Security Number, showing only the last 4 digits.
 *
 * @param {string} ssn - The full or partial SSN.
 * @returns {string} Masked SSN (e.g. "***-**-4589").
 */
export function maskSSN(ssn) {
  if (!ssn || typeof ssn !== 'string') {
    return '';
  }

  const digits = ssn.replace(/\D/g, '');

  if (digits.length <= 4) {
    return ssn;
  }

  const lastFour = digits.slice(-4);
  return `***-**-${lastFour}`;
}

/**
 * Set of object keys that are considered PII and should be masked or removed
 * when sanitizing objects for logging.
 *
 * @type {Object<string, function>}
 */
const PII_FIELD_MASKERS = {
  accountNumberFull: maskAccountNumber,
  accountNumber: maskAccountNumber,
  cardNumberFull: maskCardNumber,
  cardNumber: maskCardNumber,
  email: maskEmail,
  phone: maskPhone,
  ssn: maskSSN,
  lastFourSSN: (val) => (typeof val === 'string' ? val : ''),
  dateOfBirth: () => '***',
  password: () => '***',
  token: () => '***',
  refreshToken: () => '***',
};

/**
 * List of keys that should be completely removed from log output.
 *
 * @type {Set<string>}
 */
const REDACTED_KEYS = new Set([
  'password',
  'token',
  'refreshToken',
  'pin',
  'securityAnswer',
]);

/**
 * Recursively sanitizes an object by masking or removing PII fields.
 * Returns a new object — the original is never mutated.
 *
 * Handles nested objects and arrays. Primitive values that are not
 * associated with a PII key are passed through unchanged.
 *
 * @param {*} obj - The value to sanitize (object, array, or primitive).
 * @param {number} [depth=0] - Current recursion depth (internal use).
 * @returns {*} A sanitized copy of the input.
 */
export function sanitizeForLog(obj, depth = 0) {
  // Guard against excessively deep recursion
  const MAX_DEPTH = 10;
  if (depth > MAX_DEPTH) {
    return '[max depth exceeded]';
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForLog(item, depth + 1));
  }

  const sanitized = {};

  for (const key of Object.keys(obj)) {
    const value = obj[key];

    // Completely redact certain keys
    if (REDACTED_KEYS.has(key)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Apply field-specific masker if one exists
    if (PII_FIELD_MASKERS[key] && typeof value === 'string') {
      sanitized[key] = PII_FIELD_MASKERS[key](value);
      continue;
    }

    // Recurse into nested objects / arrays
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLog(value, depth + 1);
      continue;
    }

    // Pass through non-PII primitives
    sanitized[key] = value;
  }

  return sanitized;
}