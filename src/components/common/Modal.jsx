/**
 * Reusable accessible modal dialog component.
 *
 * Renders a modal overlay with focus trapping, escape key close,
 * overlay click close, and proper ARIA attributes. Uses HB CSS
 * framework classes (.hb-modal, .hb-modal-dialog-centered).
 *
 * Used for confirmation dialogs, session timeout warning, unsaved
 * changes warning, and signer removal confirmation.
 *
 * @module Modal
 */

import React, { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Selects all focusable elements within a container.
 *
 * @param {HTMLElement} container - The container element to search within.
 * @returns {Array<HTMLElement>} Array of focusable elements.
 */
function getFocusableElements(container) {
  if (!container) {
    return [];
  }

  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll(selector));
}

/**
 * Reusable accessible modal dialog component.
 *
 * Renders a modal overlay with a centered dialog panel containing an
 * optional header (title + close button), a body (children), and an
 * optional footer with confirm/cancel buttons.
 *
 * Implements:
 *   - Focus trapping within the modal while open
 *   - Escape key to close
 *   - Overlay (backdrop) click to close
 *   - Proper ARIA attributes (role="dialog", aria-modal, aria-labelledby)
 *   - Body scroll lock while open
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is currently visible.
 * @param {function} props.onClose - Callback invoked when the modal should
 *   close (escape key, overlay click, close button, or cancel button).
 * @param {string} [props.title] - The modal title displayed in the header.
 * @param {React.ReactNode} [props.children] - The modal body content.
 * @param {string} [props.confirmLabel='Confirm'] - Label for the confirm button.
 * @param {string} [props.cancelLabel='Cancel'] - Label for the cancel button.
 * @param {function} [props.onConfirm] - Callback invoked when the confirm
 *   button is clicked. When provided, a confirm button is rendered.
 * @param {function} [props.onCancel] - Callback invoked when the cancel
 *   button is clicked. Falls back to `onClose` if not provided.
 * @param {string} [props.ariaLabel] - Accessible label for the dialog.
 *   Used as `aria-label` when no `title` is provided.
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the dialog panel.
 * @param {boolean} [props.showFooter=true] - Whether to render the footer
 *   with action buttons. Defaults to `true` when `onConfirm` is provided.
 * @param {boolean} [props.closeOnOverlayClick=true] - Whether clicking the
 *   overlay backdrop closes the modal.
 * @param {boolean} [props.closeOnEscape=true] - Whether pressing Escape
 *   closes the modal.
 * @param {boolean} [props.confirmDisabled=false] - Whether the confirm
 *   button is disabled.
 * @returns {React.ReactElement|null} The rendered modal, or `null` when closed.
 */
export function Modal({
  isOpen = false,
  onClose,
  title = '',
  children = null,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm = null,
  onCancel = null,
  ariaLabel = '',
  className = '',
  showFooter,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  confirmDisabled = false,
}) {
  const dialogRef = useRef(null);
  const previousActiveElementRef = useRef(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`);

  // Determine whether to show the footer
  const shouldShowFooter = showFooter !== undefined
    ? showFooter
    : typeof onConfirm === 'function';

  /**
   * Handles cancel action — delegates to onCancel if provided, otherwise onClose.
   */
  const handleCancel = useCallback(() => {
    if (typeof onCancel === 'function') {
      onCancel();
    } else if (typeof onClose === 'function') {
      onClose();
    }
  }, [onCancel, onClose]);

  /**
   * Handles confirm action.
   */
  const handleConfirm = useCallback(() => {
    if (typeof onConfirm === 'function') {
      onConfirm();
    }
  }, [onConfirm]);

  /**
   * Handles overlay (backdrop) click.
   */
  const handleOverlayClick = useCallback((event) => {
    if (!closeOnOverlayClick) {
      return;
    }

    // Only close if the click target is the overlay itself, not the dialog
    if (event.target === event.currentTarget) {
      if (typeof onClose === 'function') {
        onClose();
      }
    }
  }, [closeOnOverlayClick, onClose]);

  /**
   * Handles keydown events for escape key close and focus trapping.
   */
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape' && closeOnEscape) {
      event.stopPropagation();
      if (typeof onClose === 'function') {
        onClose();
      }
      return;
    }

    // Focus trapping
    if (event.key === 'Tab') {
      const focusableElements = getFocusableElements(dialogRef.current);

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift+Tab — wrap to last element if at the first
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab — wrap to first element if at the last
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [closeOnEscape, onClose]);

  // Store the previously focused element and manage focus on open/close
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element to restore later
      previousActiveElementRef.current = document.activeElement;

      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Focus the dialog after a short delay to allow rendering
      const focusTimer = setTimeout(() => {
        if (dialogRef.current) {
          const focusableElements = getFocusableElements(dialogRef.current);
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          } else {
            dialogRef.current.focus();
          }
        }
      }, 0);

      return () => {
        clearTimeout(focusTimer);
        document.body.style.overflow = originalOverflow;

        // Restore focus to the previously focused element
        if (
          previousActiveElementRef.current &&
          typeof previousActiveElementRef.current.focus === 'function'
        ) {
          try {
            previousActiveElementRef.current.focus();
          } catch {
            // Focus restoration must not throw.
          }
        }
      };
    }
  }, [isOpen]);

  // Do not render when closed
  if (!isOpen) {
    return null;
  }

  // Determine aria-labelledby or aria-label
  const ariaProps = {};
  if (title) {
    ariaProps['aria-labelledby'] = titleId.current;
  } else if (ariaLabel) {
    ariaProps['aria-label'] = ariaLabel;
  }

  const dialogClassName = ['hb-modal-dialog-centered', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className="hb-modal"
      role="presentation"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        className={dialogClassName}
        role="dialog"
        aria-modal="true"
        {...ariaProps}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || typeof onClose === 'function') && (
          <div className="hb-modal-header">
            {title && (
              <h2 id={titleId.current}>{title}</h2>
            )}
            {typeof onClose === 'function' && (
              <button
                type="button"
                className="hb-modal-close"
                onClick={onClose}
                aria-label="Close modal"
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="hb-modal-body">
          {children}
        </div>

        {/* Footer */}
        {shouldShowFooter && (
          <div className="hb-modal-footer">
            <button
              type="button"
              className="button-secondary-2"
              onClick={handleCancel}
            >
              {cancelLabel}
            </button>
            {typeof onConfirm === 'function' && (
              <button
                type="button"
                className="button-primary"
                onClick={handleConfirm}
                disabled={confirmDisabled}
                aria-disabled={confirmDisabled ? 'true' : undefined}
              >
                {confirmLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
  showFooter: PropTypes.bool,
  closeOnOverlayClick: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
  confirmDisabled: PropTypes.bool,
};

export default Modal;