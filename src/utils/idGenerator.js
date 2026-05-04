/**
 * Unique ID generation utilities.
 *
 * Provides helpers for generating unique identifiers used across the
 * application — confirmation/reference numbers for card operations,
 * session identifiers, and token identifiers.
 *
 * Uses the `uuid` library (v4) for RFC 4122 compliant unique identifiers.
 *
 * @module idGenerator
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a human-readable confirmation ID suitable for display on
 * submission confirmation screens and audit logs.
 *
 * Format: `"CONF-XXXXXXXX"` where `XXXXXXXX` is an 8-character uppercase
 * hex string derived from a UUID v4.
 *
 * @returns {string} A unique confirmation ID (e.g. `"CONF-A3F8B2C1"`).
 */
export function generateConfirmationId() {
  const uuid = uuidv4();
  const shortId = uuid.replace(/-/g, '').slice(0, 8).toUpperCase();
  return `CONF-${shortId}`;
}

/**
 * Generates a unique session identifier.
 *
 * Format: `"sess-<uuid-v4>"` — a full UUID v4 prefixed with `sess-` for
 * easy identification in logs and storage keys.
 *
 * @returns {string} A unique session ID (e.g. `"sess-550e8400-e29b-41d4-a716-446655440000"`).
 */
export function generateSessionId() {
  return `sess-${uuidv4()}`;
}

/**
 * Generates a unique token identifier.
 *
 * Format: `"tok-<uuid-v4>"` — a full UUID v4 prefixed with `tok-` for
 * easy identification in logs and storage keys.
 *
 * @returns {string} A unique token ID (e.g. `"tok-550e8400-e29b-41d4-a716-446655440000"`).
 */
export function generateTokenId() {
  return `tok-${uuidv4()}`;
}