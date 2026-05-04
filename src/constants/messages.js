/**
 * Centralized UI message strings for all user-facing text.
 * Externalizing all strings here supports future i18n / localization.
 *
 * @module messages
 */

// ---- Login & Authentication ----

export const LOGIN_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid username or password. Please try again.',
  ACCOUNT_LOCKED:
    'Your account has been locked due to too many failed login attempts. Please try again after 30 minutes.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  LOGOUT_SUCCESS: 'You have been successfully logged out.',
  LOGIN_REQUIRED: 'Please log in to access this page.',
  ATTEMPT_WARNING: (remaining) =>
    `Invalid credentials. You have ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before your account is locked.`,
  LAST_ATTEMPT_WARNING:
    'Warning: This is your last login attempt. Your account will be locked after one more failed attempt.',
};

// ---- Token Validation ----

export const TOKEN_MESSAGES = {
  TOKEN_INVALID: 'Your authentication token is invalid. Please log in again.',
  TOKEN_EXPIRED: 'Your authentication token has expired. Please log in again.',
  TOKEN_REFRESH_FAILED:
    'Unable to refresh your session. Please log in again.',
};

// ---- Verification ----

export const VERIFICATION_MESSAGES = {
  VERIFICATION_REQUIRED:
    'Please verify your identity before proceeding.',
  VERIFICATION_SUCCESS: 'Identity verification successful.',
  VERIFICATION_FAILED:
    'Identity verification failed. Please check your information and try again.',
  VERIFICATION_CODE_SENT:
    'A verification code has been sent to your registered contact.',
  VERIFICATION_CODE_EXPIRED:
    'Your verification code has expired. Please request a new one.',
  VERIFICATION_CODE_INVALID:
    'The verification code you entered is invalid. Please try again.',
};

// ---- Unlock Attempts ----

export const UNLOCK_MESSAGES = {
  ATTEMPT_1_CONFIRM:
    'Card unlock request submitted successfully.',
  ATTEMPT_2_WARNING:
    'Warning: You have used 2 of your 3 daily unlock attempts. Please verify the card details carefully before proceeding.',
  ATTEMPT_3_FINAL_WARNING:
    'Final warning: This is your last unlock attempt for today. If this attempt fails, you will need to wait until tomorrow to try again.',
  ATTEMPTS_EXHAUSTED:
    'You have exhausted all unlock attempts for today. Please try again tomorrow or contact support for assistance.',
  UNLOCK_SUCCESS: 'The card has been successfully unlocked.',
  UNLOCK_FAILED:
    'Unable to unlock the card. Please try again or contact support.',
  ATTEMPT_REMAINING: (remaining) =>
    `You have ${remaining} unlock attempt${remaining !== 1 ? 's' : ''} remaining today.`,
};

// ---- Resend PIN Attempts ----

export const RESEND_MESSAGES = {
  ATTEMPT_1_CONFIRM:
    'PIN resend request submitted successfully. The new PIN will be delivered to the registered address.',
  ATTEMPT_2_WARNING:
    'Warning: You have used 2 of your 3 daily PIN resend attempts. Please confirm the mailing address before proceeding.',
  ATTEMPT_3_FINAL_WARNING:
    'Final warning: This is your last PIN resend attempt for today. If you need further assistance, please contact support.',
  ATTEMPTS_EXHAUSTED:
    'You have exhausted all PIN resend attempts for today. Please try again tomorrow or contact support for assistance.',
  RESEND_SUCCESS: 'PIN resend request has been processed successfully.',
  RESEND_FAILED:
    'Unable to process the PIN resend request. Please try again or contact support.',
  ATTEMPT_REMAINING: (remaining) =>
    `You have ${remaining} PIN resend attempt${remaining !== 1 ? 's' : ''} remaining today.`,
};

// ---- Form Validation ----

export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'This field is required.',
  REQUIRED_FIELD_NAMED: (fieldName) => `${fieldName} is required.`,
  INVALID_FORMAT: 'Please enter a valid format.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  INVALID_ACCOUNT_NUMBER: 'Please enter a valid account number.',
  INVALID_CARD_NUMBER: 'Please enter a valid card number.',
  INVALID_SSN: 'Please enter a valid Social Security Number.',
  MIN_LENGTH: (min) =>
    `Must be at least ${min} character${min !== 1 ? 's' : ''} long.`,
  MAX_LENGTH: (max) =>
    `Must be no more than ${max} character${max !== 1 ? 's' : ''} long.`,
  FIELD_MISMATCH: (fieldName) => `${fieldName} values do not match.`,
  NO_RESULTS_FOUND: 'No results found. Please adjust your search criteria.',
  SEARCH_MIN_LENGTH:
    'Please enter at least 2 characters to search.',
};

// ---- Confirmation ----

export const CONFIRMATION_MESSAGES = {
  LOCK_CARD:
    'Are you sure you want to lock this card? The cardholder will not be able to use it until it is unlocked.',
  UNLOCK_CARD:
    'Are you sure you want to unlock this card? The cardholder will be able to resume using it.',
  ACTIVATE_CARD:
    'Are you sure you want to activate this card? This action cannot be undone.',
  REPLACE_CARD:
    'Are you sure you want to replace this card? The current card will be deactivated and a new card will be issued.',
  RESEND_PIN:
    'Are you sure you want to resend the PIN? A new PIN will be generated and mailed to the cardholder\'s registered address.',
  CANCEL_ACTION:
    'Are you sure you want to cancel? Any unsaved changes will be lost.',
};

// ---- Legal / Consent ----

export const LEGAL_MESSAGES = {
  CONSENT_TEXT:
    'By proceeding, I confirm that I have verified the identity of the cardholder and have obtained the necessary authorization to perform this action.',
  PRIVACY_NOTICE:
    'Cardholder information is confidential and must be handled in accordance with applicable privacy regulations.',
  TERMS_ACCEPTANCE:
    'By using this system, you agree to comply with all applicable policies and procedures for card management operations.',
};

// ---- Alert / Notification ----

export const ALERT_MESSAGES = {
  // Success
  OPERATION_SUCCESS: 'Operation completed successfully.',
  CARD_LOCKED_SUCCESS: 'The card has been successfully locked.',
  CARD_UNLOCKED_SUCCESS: 'The card has been successfully unlocked.',
  CARD_ACTIVATED_SUCCESS: 'The card has been successfully activated.',
  CARD_REPLACED_SUCCESS:
    'The card replacement request has been submitted successfully. A new card will be issued.',
  PIN_RESENT_SUCCESS:
    'The PIN resend request has been processed. The new PIN will be delivered to the registered address.',

  // Error
  GENERIC_ERROR:
    'An unexpected error occurred. Please try again later.',
  NETWORK_ERROR:
    'Unable to connect to the server. Please check your network connection and try again.',
  SERVER_ERROR:
    'A server error occurred. Please try again later or contact support.',
  PERMISSION_DENIED:
    'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  TIMEOUT_ERROR:
    'The request timed out. Please try again.',

  // Warning
  UNSAVED_CHANGES:
    'You have unsaved changes. Are you sure you want to leave this page?',
  SESSION_EXPIRING_SOON:
    'Your session will expire soon. Please save your work.',
  CARD_ALREADY_LOCKED: 'This card is already locked.',
  CARD_ALREADY_ACTIVE: 'This card is already active.',
  CARD_EXPIRED:
    'This card has expired and cannot be modified. Please issue a replacement.',

  // Info
  LOADING: 'Loading, please wait...',
  PROCESSING: 'Processing your request...',
  NO_CARDS_FOUND: 'No cards found for this signer.',
  NO_SIGNERS_FOUND: 'No signers found matching your search criteria.',
};

// ---- Progress / Step ----

export const STEP_MESSAGES = {
  SEARCH_DESCRIPTION: 'Search for a signer by name, account number, or card number.',
  SELECT_CARD_DESCRIPTION: 'Select the card you want to manage.',
  VERIFY_DESCRIPTION: 'Verify the cardholder\'s identity.',
  CONFIRM_DESCRIPTION: 'Review and confirm the action.',
  COMPLETE_DESCRIPTION: 'The action has been completed.',
};