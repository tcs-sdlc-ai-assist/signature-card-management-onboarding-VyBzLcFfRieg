/**
 * Centralized application constants and configuration.
 * All configurable values are read from environment variables with sensible defaults.
 *
 * @module constants
 */

// ---- Session & Auth ----

/** Session timeout in milliseconds (default: 15 minutes) */
export const SESSION_TIMEOUT_MS = Number(
  import.meta.env.VITE_SESSION_TIMEOUT_MS ?? 900000
);

/** Maximum login attempts before account lockout (default: 5) */
export const MAX_LOGIN_ATTEMPTS = Number(
  import.meta.env.VITE_MAX_LOGIN_ATTEMPTS ?? 5
);

/** Lockout duration in milliseconds after max login attempts exceeded (default: 30 minutes) */
export const LOCKOUT_DURATION_MS = Number(
  import.meta.env.VITE_LOCKOUT_DURATION_MS ?? 1800000
);

/** Token expiry in hours (default: 72) */
export const TOKEN_EXPIRY_HOURS = Number(
  import.meta.env.VITE_TOKEN_EXPIRY_HOURS ?? 72
);

// ---- Card Operations ----

/** Maximum card unlock attempts per day (default: 3) */
export const MAX_UNLOCK_ATTEMPTS_PER_DAY = Number(
  import.meta.env.VITE_MAX_UNLOCK_ATTEMPTS_PER_DAY ?? 3
);

/** Maximum PIN resend attempts per day (default: 3) */
export const MAX_RESEND_ATTEMPTS_PER_DAY = Number(
  import.meta.env.VITE_MAX_RESEND_ATTEMPTS_PER_DAY ?? 3
);

// ---- API ----

/** Base URL for backend API */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';

/** API endpoint paths */
export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  CARDS: '/cards',
  CARD_DETAIL: '/cards/:id',
  CARD_LOCK: '/cards/:id/lock',
  CARD_UNLOCK: '/cards/:id/unlock',
  CARD_ACTIVATE: '/cards/:id/activate',
  CARD_REPLACE: '/cards/:id/replace',
  PIN_RESEND: '/cards/:id/pin/resend',
  SIGNERS: '/signers',
  SIGNER_DETAIL: '/signers/:id',
};

// ---- localStorage Keys ----

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'sig_auth_token',
  REFRESH_TOKEN: 'sig_refresh_token',
  USER: 'sig_user',
  SESSION_EXPIRY: 'sig_session_expiry',
  LOGIN_ATTEMPTS: 'sig_login_attempts',
  LOCKOUT_UNTIL: 'sig_lockout_until',
  UNLOCK_ATTEMPTS: 'sig_unlock_attempts',
  RESEND_ATTEMPTS: 'sig_resend_attempts',
  UNLOCK_ATTEMPTS_DATE: 'sig_unlock_attempts_date',
  RESEND_ATTEMPTS_DATE: 'sig_resend_attempts_date',
};

// ---- Progress Indicator Steps ----

/** Step names used by the progress indicator component */
export const STEP_NAMES = {
  SEARCH: 'Search',
  SELECT_CARD: 'Select Card',
  VERIFY: 'Verify',
  CONFIRM: 'Confirm',
  COMPLETE: 'Complete',
};

/** Ordered list of steps for the progress indicator */
export const STEP_ORDER = [
  STEP_NAMES.SEARCH,
  STEP_NAMES.SELECT_CARD,
  STEP_NAMES.VERIFY,
  STEP_NAMES.CONFIRM,
  STEP_NAMES.COMPLETE,
];

// ---- Alert Types ----

export const ALERT_TYPES = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  SUCCESS: 'success',
  INFO: 'info',
};

// ---- Signer Statuses ----

export const SIGNER_STATUSES = {
  ACTIVE: 'active',
  PENDING: 'pending',
  LOCKED: 'locked',
};

// ---- Card Statuses ----

export const CARD_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  LOCKED: 'locked',
  EXPIRED: 'expired',
  REPLACED: 'replaced',
  PENDING_ACTIVATION: 'pending_activation',
};

// ---- Misc ----

/** Debounce delay for search inputs in milliseconds */
export const SEARCH_DEBOUNCE_MS = 300;

/** Number of items per page for paginated lists */
export const DEFAULT_PAGE_SIZE = 10;