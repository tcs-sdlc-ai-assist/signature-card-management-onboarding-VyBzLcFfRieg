/**
 * Stubbed notification service for MVP.
 *
 * Provides email and notification stubs that log to the console and
 * audit log instead of sending real messages. Designed with an interface
 * ready for future real email/notification integration (e.g. SendGrid,
 * AWS SES, or a backend notification microservice).
 *
 * Exports:
 *   - {@link sendConfirmationEmail} — logs a confirmation email event
 *   - {@link sendInvitationEmail} — logs an invitation email event
 *   - {@link sendPinResendNotification} — logs a PIN resend notification event
 *   - {@link sendCardActionNotification} — logs a card action notification event
 *   - {@link getNotificationHistory} — retrieves logged notification history
 *   - {@link clearNotificationHistory} — clears notification history (testing/admin)
 *
 * @module notificationService
 */

import { v4 as uuidv4 } from 'uuid';
import { logEvent, AUDIT_EVENT_TYPES } from './auditLogger.js';
import { getItem, setItem } from '../utils/storageUtils.js';
import { sanitizeForLog } from '../utils/maskingUtils.js';

// ---- Constants ----

/** localStorage key for notification history */
const NOTIFICATION_HISTORY_KEY = 'scm_notification_history';

/** Maximum number of notification history entries retained */
const MAX_NOTIFICATION_ENTRIES = 200;

/**
 * Supported notification types.
 * @enum {string}
 */
export const NOTIFICATION_TYPES = {
  CONFIRMATION_EMAIL: 'confirmation_email',
  INVITATION_EMAIL: 'invitation_email',
  PIN_RESEND: 'pin_resend',
  CARD_ACTION: 'card_action',
};

/**
 * Supported notification statuses.
 * @enum {string}
 */
export const NOTIFICATION_STATUSES = {
  SENT: 'sent',
  FAILED: 'failed',
  STUBBED: 'stubbed',
};

// ---- Internal Helpers ----

/**
 * Reads the notification history array from localStorage.
 *
 * @returns {Array<Object>} The current notification history entries.
 */
function readHistory() {
  const history = getItem(NOTIFICATION_HISTORY_KEY, []);
  if (!Array.isArray(history)) {
    return [];
  }
  return history;
}

/**
 * Persists a notification entry to the history in localStorage.
 * Trims the oldest entries when the history exceeds {@link MAX_NOTIFICATION_ENTRIES}.
 *
 * @param {Object} entry - The notification entry to persist.
 * @returns {boolean} `true` if the write succeeded.
 */
function writeHistoryEntry(entry) {
  try {
    const history = readHistory();
    history.push(entry);

    const trimmed = history.length > MAX_NOTIFICATION_ENTRIES
      ? history.slice(history.length - MAX_NOTIFICATION_ENTRIES)
      : history;

    return setItem(NOTIFICATION_HISTORY_KEY, trimmed);
  } catch {
    return false;
  }
}

/**
 * Builds a notification record with common fields populated.
 *
 * @param {Object} params
 * @param {string} params.type - One of {@link NOTIFICATION_TYPES}.
 * @param {string} params.recipient - The recipient identifier (email, name, etc.).
 * @param {string} params.subject - The notification subject line.
 * @param {string} [params.body] - The notification body content.
 * @param {Object} [params.metadata] - Additional metadata for the notification.
 * @returns {Object} The notification record.
 */
function buildNotificationRecord({ type, recipient, subject, body = '', metadata = {} }) {
  return {
    id: uuidv4(),
    type,
    recipient: recipient || '',
    subject: subject || '',
    body: body || '',
    metadata: metadata || {},
    status: NOTIFICATION_STATUSES.STUBBED,
    sentAt: new Date().toISOString(),
  };
}

// ---- Public API ----

/**
 * Sends a confirmation email for a completed card management action.
 *
 * In the MVP this is a stub that logs the event to the console and
 * audit log instead of sending a real email. The interface is designed
 * for seamless replacement with a real email provider.
 *
 * @param {Object} params
 * @param {string} params.recipientEmail - The recipient's email address.
 * @param {string} params.recipientName - The recipient's display name.
 * @param {string} params.confirmationId - The confirmation/reference ID.
 * @param {string} params.actionType - The type of action performed
 *   (e.g. 'lock_card', 'unlock_card', 'activate_card', 'replace_card', 'resend_pin').
 * @param {Object} [params.details] - Additional details to include in the email body.
 * @param {string} [params.userId] - Optional user ID for audit logging.
 * @returns {{
 *   status: 'success'|'error',
 *   notificationId?: string,
 *   message: string
 * }} The send result.
 */
export function sendConfirmationEmail({
  recipientEmail,
  recipientName,
  confirmationId,
  actionType,
  details = {},
  userId = null,
} = {}) {
  if (!recipientEmail || typeof recipientEmail !== 'string') {
    return {
      status: 'error',
      message: 'A valid recipient email is required.',
    };
  }

  if (!confirmationId || typeof confirmationId !== 'string') {
    return {
      status: 'error',
      message: 'A valid confirmation ID is required.',
    };
  }

  try {
    const subject = `Card Management Confirmation — ${confirmationId}`;
    const body = `Dear ${recipientName || 'User'},\n\nYour card management action (${actionType || 'unknown'}) has been completed successfully.\n\nConfirmation ID: ${confirmationId}\n\nThank you.`;

    const record = buildNotificationRecord({
      type: NOTIFICATION_TYPES.CONFIRMATION_EMAIL,
      recipient: recipientEmail,
      subject,
      body,
      metadata: {
        recipientName: recipientName || '',
        confirmationId,
        actionType: actionType || '',
        ...details,
      },
    });

    // Log to console (MVP stub)
    // eslint-disable-next-line no-console
    console.log(
      `[NotificationService] STUB — Confirmation email to "${recipientEmail}" | Confirmation: ${confirmationId} | Action: ${actionType || 'unknown'}`
    );

    // Persist to notification history
    writeHistoryEntry(record);

    // Audit log the notification
    try {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SUBMISSION,
        userId,
        description: `Confirmation email stub sent to ${recipientEmail} for action "${actionType || 'unknown'}". Confirmation: ${confirmationId}.`,
        details: sanitizeForLog({
          action: 'send_confirmation_email',
          notificationId: record.id,
          recipientEmail,
          confirmationId,
          actionType: actionType || '',
          status: NOTIFICATION_STATUSES.STUBBED,
        }),
      });
    } catch {
      // Audit logging must never break the calling flow.
    }

    return {
      status: 'success',
      notificationId: record.id,
      message: `Confirmation email logged for ${recipientEmail} (stub — no real email sent).`,
    };
  } catch {
    return {
      status: 'error',
      message: 'An unexpected error occurred while sending the confirmation email.',
    };
  }
}

/**
 * Sends an invitation email to an authorized signer.
 *
 * In the MVP this is a stub that logs the event to the console and
 * audit log instead of sending a real email.
 *
 * @param {Object} params
 * @param {string} params.recipientEmail - The recipient's email address.
 * @param {string} params.recipientName - The recipient's display name.
 * @param {string} params.accountId - The account the signer is being invited to.
 * @param {string} [params.tokenId] - An invitation token ID for the signer.
 * @param {string} [params.userId] - Optional user ID for audit logging.
 * @returns {{
 *   status: 'success'|'error',
 *   notificationId?: string,
 *   message: string
 * }} The send result.
 */
export function sendInvitationEmail({
  recipientEmail,
  recipientName,
  accountId,
  tokenId = null,
  userId = null,
} = {}) {
  if (!recipientEmail || typeof recipientEmail !== 'string') {
    return {
      status: 'error',
      message: 'A valid recipient email is required.',
    };
  }

  if (!accountId || typeof accountId !== 'string') {
    return {
      status: 'error',
      message: 'A valid account ID is required.',
    };
  }

  try {
    const subject = 'You have been invited as an authorized signer';
    const body = `Dear ${recipientName || 'User'},\n\nYou have been invited as an authorized signer on a business banking account.\n\nPlease follow the instructions provided to complete your enrollment.\n\nThank you.`;

    const record = buildNotificationRecord({
      type: NOTIFICATION_TYPES.INVITATION_EMAIL,
      recipient: recipientEmail,
      subject,
      body,
      metadata: {
        recipientName: recipientName || '',
        accountId,
        tokenId: tokenId || '',
      },
    });

    // Log to console (MVP stub)
    // eslint-disable-next-line no-console
    console.log(
      `[NotificationService] STUB — Invitation email to "${recipientEmail}" | Account: ${accountId}`
    );

    // Persist to notification history
    writeHistoryEntry(record);

    // Audit log the notification
    try {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SUBMISSION,
        userId,
        description: `Invitation email stub sent to ${recipientEmail} for account ${accountId}.`,
        details: sanitizeForLog({
          action: 'send_invitation_email',
          notificationId: record.id,
          recipientEmail,
          accountId,
          tokenId: tokenId || '',
          status: NOTIFICATION_STATUSES.STUBBED,
        }),
      });
    } catch {
      // Audit logging must never break the calling flow.
    }

    return {
      status: 'success',
      notificationId: record.id,
      message: `Invitation email logged for ${recipientEmail} (stub — no real email sent).`,
    };
  } catch {
    return {
      status: 'error',
      message: 'An unexpected error occurred while sending the invitation email.',
    };
  }
}

/**
 * Sends a PIN resend notification to the cardholder.
 *
 * In the MVP this is a stub that logs the event to the console and
 * audit log instead of sending a real notification.
 *
 * @param {Object} params
 * @param {string} params.recipientEmail - The recipient's email address.
 * @param {string} params.recipientName - The recipient's display name.
 * @param {string} params.cardNumber - The masked card number (e.g. "****4321").
 * @param {string} [params.userId] - Optional user ID for audit logging.
 * @returns {{
 *   status: 'success'|'error',
 *   notificationId?: string,
 *   message: string
 * }} The send result.
 */
export function sendPinResendNotification({
  recipientEmail,
  recipientName,
  cardNumber,
  userId = null,
} = {}) {
  if (!recipientEmail || typeof recipientEmail !== 'string') {
    return {
      status: 'error',
      message: 'A valid recipient email is required.',
    };
  }

  if (!cardNumber || typeof cardNumber !== 'string') {
    return {
      status: 'error',
      message: 'A valid card number is required.',
    };
  }

  try {
    const subject = 'PIN Resend Confirmation';
    const body = `Dear ${recipientName || 'User'},\n\nA new PIN has been requested for your card ending in ${cardNumber}. The new PIN will be mailed to your registered address.\n\nThank you.`;

    const record = buildNotificationRecord({
      type: NOTIFICATION_TYPES.PIN_RESEND,
      recipient: recipientEmail,
      subject,
      body,
      metadata: {
        recipientName: recipientName || '',
        cardNumber,
      },
    });

    // Log to console (MVP stub)
    // eslint-disable-next-line no-console
    console.log(
      `[NotificationService] STUB — PIN resend notification to "${recipientEmail}" | Card: ${cardNumber}`
    );

    // Persist to notification history
    writeHistoryEntry(record);

    // Audit log the notification
    try {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SUBMISSION,
        userId,
        description: `PIN resend notification stub sent to ${recipientEmail} for card ${cardNumber}.`,
        details: sanitizeForLog({
          action: 'send_pin_resend_notification',
          notificationId: record.id,
          recipientEmail,
          cardNumber,
          status: NOTIFICATION_STATUSES.STUBBED,
        }),
      });
    } catch {
      // Audit logging must never break the calling flow.
    }

    return {
      status: 'success',
      notificationId: record.id,
      message: `PIN resend notification logged for ${recipientEmail} (stub — no real notification sent).`,
    };
  } catch {
    return {
      status: 'error',
      message: 'An unexpected error occurred while sending the PIN resend notification.',
    };
  }
}

/**
 * Sends a card action notification (lock, unlock, activate, replace).
 *
 * In the MVP this is a stub that logs the event to the console and
 * audit log instead of sending a real notification.
 *
 * @param {Object} params
 * @param {string} params.recipientEmail - The recipient's email address.
 * @param {string} params.recipientName - The recipient's display name.
 * @param {string} params.cardNumber - The masked card number (e.g. "****4321").
 * @param {string} params.actionType - The action performed
 *   (e.g. 'lock_card', 'unlock_card', 'activate_card', 'replace_card').
 * @param {string} [params.userId] - Optional user ID for audit logging.
 * @returns {{
 *   status: 'success'|'error',
 *   notificationId?: string,
 *   message: string
 * }} The send result.
 */
export function sendCardActionNotification({
  recipientEmail,
  recipientName,
  cardNumber,
  actionType,
  userId = null,
} = {}) {
  if (!recipientEmail || typeof recipientEmail !== 'string') {
    return {
      status: 'error',
      message: 'A valid recipient email is required.',
    };
  }

  if (!cardNumber || typeof cardNumber !== 'string') {
    return {
      status: 'error',
      message: 'A valid card number is required.',
    };
  }

  if (!actionType || typeof actionType !== 'string') {
    return {
      status: 'error',
      message: 'A valid action type is required.',
    };
  }

  try {
    const subject = `Card Action Notification — ${actionType}`;
    const body = `Dear ${recipientName || 'User'},\n\nA card management action (${actionType}) has been performed on your card ending in ${cardNumber}.\n\nIf you did not authorize this action, please contact support immediately.\n\nThank you.`;

    const record = buildNotificationRecord({
      type: NOTIFICATION_TYPES.CARD_ACTION,
      recipient: recipientEmail,
      subject,
      body,
      metadata: {
        recipientName: recipientName || '',
        cardNumber,
        actionType,
      },
    });

    // Log to console (MVP stub)
    // eslint-disable-next-line no-console
    console.log(
      `[NotificationService] STUB — Card action notification to "${recipientEmail}" | Card: ${cardNumber} | Action: ${actionType}`
    );

    // Persist to notification history
    writeHistoryEntry(record);

    // Audit log the notification
    try {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SUBMISSION,
        userId,
        description: `Card action notification stub sent to ${recipientEmail} for card ${cardNumber} — action: ${actionType}.`,
        details: sanitizeForLog({
          action: 'send_card_action_notification',
          notificationId: record.id,
          recipientEmail,
          cardNumber,
          actionType,
          status: NOTIFICATION_STATUSES.STUBBED,
        }),
      });
    } catch {
      // Audit logging must never break the calling flow.
    }

    return {
      status: 'success',
      notificationId: record.id,
      message: `Card action notification logged for ${recipientEmail} (stub — no real notification sent).`,
    };
  } catch {
    return {
      status: 'error',
      message: 'An unexpected error occurred while sending the card action notification.',
    };
  }
}

/**
 * Retrieves the notification history, optionally filtered by type.
 *
 * @param {Object} [options]
 * @param {string} [options.type] - Filter by notification type (one of {@link NOTIFICATION_TYPES}).
 * @returns {Array<Object>} Array of notification history entries (newest last).
 */
export function getNotificationHistory(options = {}) {
  const { type = null } = options;

  try {
    const history = readHistory();

    if (type && typeof type === 'string') {
      return history.filter((entry) => entry.type === type);
    }

    return history;
  } catch {
    return [];
  }
}

/**
 * Clears the notification history.
 *
 * Intended for testing and administrative use.
 *
 * @returns {boolean} `true` if the clear succeeded.
 */
export function clearNotificationHistory() {
  return setItem(NOTIFICATION_HISTORY_KEY, []);
}