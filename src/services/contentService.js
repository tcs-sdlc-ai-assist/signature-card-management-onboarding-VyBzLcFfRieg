/**
 * Content management service for the welcome screen.
 *
 * Loads welcome screen content from the bundled JSON file or from a
 * localStorage override (for admin content editing without code changes).
 *
 * Exports:
 *   - {@link getWelcomeContent} — retrieves the current welcome content
 *   - {@link updateWelcomeContent} — persists updated content to localStorage
 *   - {@link resetWelcomeContent} — clears the localStorage override
 *   - {@link hasCustomContent} — checks if a localStorage override exists
 *
 * @module contentService
 */

import defaultContent from '../data/welcomeContent.json';
import { getItem, setItem, removeItem } from '../utils/storageUtils.js';
import { logEvent, AUDIT_EVENT_TYPES } from './auditLogger.js';

// ---- Constants ----

/** localStorage key for welcome content override */
const WELCOME_CONTENT_KEY = 'scm_welcome_content';

// ---- Internal Helpers ----

/**
 * Validates that a content object has the expected shape.
 * Does not require every field — only checks that the value is a
 * non-null object with at least a `title` string property.
 *
 * @param {*} content - The value to validate.
 * @returns {boolean} `true` if the content has a valid shape.
 */
function isValidContent(content) {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return false;
  }

  if (typeof content.title !== 'string' || content.title.trim().length === 0) {
    return false;
  }

  return true;
}

/**
 * Deep-merges a partial content update into the base content object.
 * Only top-level keys present in the update are replaced; all other
 * keys retain their base values. Arrays are replaced wholesale (not merged).
 *
 * @param {Object} base - The base content object.
 * @param {Object} updates - The partial update object.
 * @returns {Object} A new merged content object.
 */
function mergeContent(base, updates) {
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return { ...base };
  }

  const merged = { ...base };

  for (const key of Object.keys(updates)) {
    const updateValue = updates[key];

    if (updateValue === null || updateValue === undefined) {
      continue;
    }

    // For nested plain objects (not arrays), merge one level deep
    if (
      typeof updateValue === 'object' &&
      !Array.isArray(updateValue) &&
      typeof merged[key] === 'object' &&
      !Array.isArray(merged[key]) &&
      merged[key] !== null
    ) {
      merged[key] = { ...merged[key], ...updateValue };
    } else {
      merged[key] = updateValue;
    }
  }

  return merged;
}

// ---- Public API ----

/**
 * Retrieves the current welcome screen content.
 *
 * If a localStorage override exists and is valid, it is returned.
 * Otherwise the bundled default content from `welcomeContent.json`
 * is returned.
 *
 * @returns {Object} The welcome screen content object.
 */
export function getWelcomeContent() {
  try {
    const customContent = getItem(WELCOME_CONTENT_KEY, null);

    if (customContent && isValidContent(customContent)) {
      return customContent;
    }
  } catch {
    // Fall through to default content on any read error.
  }

  return { ...defaultContent };
}

/**
 * Persists updated welcome screen content to localStorage.
 *
 * Accepts a full or partial content object. When partial, the update
 * is merged with the current content (localStorage override if present,
 * otherwise the bundled default).
 *
 * @param {Object} content - The content object (full or partial) to persist.
 * @param {Object} [options]
 * @param {boolean} [options.merge=true] - When `true` (default), the
 *   provided content is merged with the current content. When `false`,
 *   the provided content replaces the stored content entirely.
 * @param {string} [options.userId] - Optional user ID for audit logging.
 * @returns {{
 *   status: 'success'|'error',
 *   content?: Object,
 *   message?: string
 * }} The result of the update operation.
 */
export function updateWelcomeContent(content, options = {}) {
  const { merge = true, userId = null } = options;

  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return {
      status: 'error',
      message: 'Invalid content provided. Expected a non-null object.',
    };
  }

  try {
    let updatedContent;

    if (merge) {
      const currentContent = getWelcomeContent();
      updatedContent = mergeContent(currentContent, content);
    } else {
      updatedContent = { ...content };
    }

    if (!isValidContent(updatedContent)) {
      return {
        status: 'error',
        message: 'Updated content is invalid. A non-empty "title" field is required.',
      };
    }

    const writeSuccess = setItem(WELCOME_CONTENT_KEY, updatedContent);

    if (!writeSuccess) {
      return {
        status: 'error',
        message: 'Failed to persist content to localStorage.',
      };
    }

    try {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SUBMISSION,
        userId,
        description: 'Welcome screen content updated.',
        details: {
          action: 'update_welcome_content',
          merge,
        },
      });
    } catch {
      // Audit logging must never break the calling flow.
    }

    return {
      status: 'success',
      content: updatedContent,
      message: 'Welcome content updated successfully.',
    };
  } catch {
    return {
      status: 'error',
      message: 'An unexpected error occurred while updating content.',
    };
  }
}

/**
 * Clears the localStorage content override, reverting the welcome
 * screen to the bundled default content.
 *
 * @param {Object} [options]
 * @param {string} [options.userId] - Optional user ID for audit logging.
 * @returns {{
 *   status: 'success'|'error',
 *   message: string
 * }} The result of the reset operation.
 */
export function resetWelcomeContent(options = {}) {
  const { userId = null } = options;

  try {
    const removeSuccess = removeItem(WELCOME_CONTENT_KEY);

    if (!removeSuccess) {
      return {
        status: 'error',
        message: 'Failed to remove content override from localStorage.',
      };
    }

    try {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.SUBMISSION,
        userId,
        description: 'Welcome screen content reset to default.',
        details: {
          action: 'reset_welcome_content',
        },
      });
    } catch {
      // Audit logging must never break the calling flow.
    }

    return {
      status: 'success',
      message: 'Welcome content has been reset to default.',
    };
  } catch {
    return {
      status: 'error',
      message: 'An unexpected error occurred while resetting content.',
    };
  }
}

/**
 * Checks whether a custom content override exists in localStorage.
 *
 * @returns {boolean} `true` if a valid localStorage override is present.
 */
export function hasCustomContent() {
  try {
    const customContent = getItem(WELCOME_CONTENT_KEY, null);
    return customContent !== null && isValidContent(customContent);
  } catch {
    return false;
  }
}

/**
 * Returns the bundled default welcome content without checking
 * localStorage. Useful for comparison or reset previews.
 *
 * @returns {Object} The default welcome screen content object.
 */
export function getDefaultWelcomeContent() {
  return { ...defaultContent };
}