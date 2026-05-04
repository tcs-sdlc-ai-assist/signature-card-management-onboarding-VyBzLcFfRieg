/**
 * Reusable pagination component for paginated lists.
 *
 * Renders page navigation controls including previous/next buttons,
 * numbered page buttons, and an items-per-page display. Supports
 * keyboard navigation and proper ARIA attributes for accessibility.
 *
 * Uses HB CSS framework classes for styling consistency.
 *
 * @module Pagination
 */

import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * Calculates the range of page numbers to display.
 * Shows up to `maxVisible` page buttons, centered around the current page
 * when possible, with ellipsis indicators for truncated ranges.
 *
 * @param {number} currentPage - The current active page (1-based).
 * @param {number} totalPages - The total number of pages.
 * @param {number} [maxVisible=5] - Maximum number of page buttons to show.
 * @returns {Array<number|string>} Array of page numbers and/or '...' strings.
 */
function getPageRange(currentPage, totalPages, maxVisible = 5) {
  if (totalPages <= 0) {
    return [1];
  }

  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [];
  const halfVisible = Math.floor(maxVisible / 2);

  let startPage = Math.max(1, currentPage - halfVisible);
  let endPage = Math.min(totalPages, currentPage + halfVisible);

  // Adjust range if near the beginning
  if (currentPage <= halfVisible) {
    endPage = Math.min(totalPages, maxVisible);
    startPage = 1;
  }

  // Adjust range if near the end
  if (currentPage > totalPages - halfVisible) {
    startPage = Math.max(1, totalPages - maxVisible + 1);
    endPage = totalPages;
  }

  // Add first page and ellipsis if needed
  if (startPage > 1) {
    pages.push(1);
    if (startPage > 2) {
      pages.push('start-ellipsis');
    }
  }

  // Add visible page numbers
  for (let i = startPage; i <= endPage; i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  // Add ellipsis and last page if needed
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push('end-ellipsis');
    }
    if (!pages.includes(totalPages)) {
      pages.push(totalPages);
    }
  }

  return pages;
}

/**
 * Left chevron SVG icon for the previous button.
 *
 * @returns {React.ReactElement} An SVG chevron-left icon.
 */
function ChevronLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fillRule="evenodd"
        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Right chevron SVG icon for the next button.
 *
 * @returns {React.ReactElement} An SVG chevron-right icon.
 */
function ChevronRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fillRule="evenodd"
        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Reusable pagination component for paginated lists.
 *
 * Renders a navigation bar with previous/next buttons, numbered page
 * buttons with ellipsis for large page counts, and an informational
 * display of the current item range and total items.
 *
 * Implements keyboard navigation (Enter/Space to activate buttons)
 * and proper ARIA attributes for screen reader accessibility.
 *
 * @param {Object} props
 * @param {number} [props.currentPage=1] - The current active page (1-based).
 * @param {number} [props.totalPages=1] - The total number of pages.
 * @param {function} props.onPageChange - Callback invoked when the user
 *   navigates to a different page. Receives the new page number (1-based).
 * @param {number} [props.pageSize=10] - The number of items per page.
 *   Used for the items display text.
 * @param {number} [props.totalItems=0] - The total number of items across
 *   all pages. Used for the items display text.
 * @param {number} [props.maxVisiblePages=5] - Maximum number of page
 *   buttons to display before truncating with ellipsis.
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the wrapper element.
 * @returns {React.ReactElement|null} The rendered pagination controls,
 *   or `null` if there are no pages to display.
 */
export function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  pageSize = 10,
  totalItems = 0,
  maxVisiblePages = 5,
  className = '',
}) {
  const safeTotalPages = Math.max(1, Math.floor(totalPages));
  const safeCurrentPage = Math.max(1, Math.min(Math.floor(currentPage), safeTotalPages));
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const safeTotalItems = Math.max(0, Math.floor(totalItems));

  const hasPrevious = safeCurrentPage > 1;
  const hasNext = safeCurrentPage < safeTotalPages;

  const pageRange = useMemo(
    () => getPageRange(safeCurrentPage, safeTotalPages, maxVisiblePages),
    [safeCurrentPage, safeTotalPages, maxVisiblePages]
  );

  /**
   * Calculates the display range of items on the current page.
   */
  const itemRangeStart = safeTotalItems > 0
    ? (safeCurrentPage - 1) * safePageSize + 1
    : 0;
  const itemRangeEnd = safeTotalItems > 0
    ? Math.min(safeCurrentPage * safePageSize, safeTotalItems)
    : 0;

  /**
   * Handles navigation to a specific page.
   *
   * @param {number} page - The target page number (1-based).
   */
  const handlePageChange = useCallback(
    (page) => {
      if (typeof onPageChange !== 'function') {
        return;
      }

      const targetPage = Math.max(1, Math.min(Math.floor(page), safeTotalPages));

      if (targetPage === safeCurrentPage) {
        return;
      }

      onPageChange(targetPage);
    },
    [onPageChange, safeCurrentPage, safeTotalPages]
  );

  /**
   * Handles the previous button click.
   */
  const handlePrevious = useCallback(() => {
    if (hasPrevious) {
      handlePageChange(safeCurrentPage - 1);
    }
  }, [hasPrevious, safeCurrentPage, handlePageChange]);

  /**
   * Handles the next button click.
   */
  const handleNext = useCallback(() => {
    if (hasNext) {
      handlePageChange(safeCurrentPage + 1);
    }
  }, [hasNext, safeCurrentPage, handlePageChange]);

  /**
   * Handles keyboard events on page buttons.
   *
   * @param {React.KeyboardEvent} event - The keyboard event.
   * @param {function} action - The action to perform on activation.
   */
  const handleKeyDown = useCallback((event, action) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  }, []);

  // Do not render if there is only one page and no items info to show
  if (safeTotalPages <= 1 && safeTotalItems <= safePageSize) {
    return null;
  }

  const wrapperClassName = ['hb-pagination', className].filter(Boolean).join(' ');

  return (
    <nav
      className={wrapperClassName}
      role="navigation"
      aria-label={`Pagination — Page ${safeCurrentPage} of ${safeTotalPages}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--hb-space-md)',
        marginTop: 'var(--hb-space-lg)',
      }}
    >
      {/* Items display */}
      {safeTotalItems > 0 && (
        <span
          className="text-sm text-secondary-gray"
          aria-live="polite"
          aria-atomic="true"
        >
          Showing {itemRangeStart}–{itemRangeEnd} of {safeTotalItems} item{safeTotalItems !== 1 ? 's' : ''}
        </span>
      )}

      {/* Page controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--hb-space-xs)',
        }}
        role="group"
        aria-label="Page navigation controls"
      >
        {/* Previous button */}
        <button
          type="button"
          onClick={handlePrevious}
          onKeyDown={(event) => handleKeyDown(event, handlePrevious)}
          disabled={!hasPrevious}
          aria-label="Go to previous page"
          aria-disabled={!hasPrevious ? 'true' : undefined}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            padding: 0,
            border: '1px solid var(--hb-secondary-gray-light)',
            borderRadius: 'var(--hb-radius-sm)',
            backgroundColor: hasPrevious ? 'var(--hb-primary-white)' : 'var(--hb-secondary-gray-lighter)',
            color: hasPrevious ? 'var(--hb-primary-black)' : 'var(--hb-secondary-gray)',
            cursor: hasPrevious ? 'pointer' : 'not-allowed',
            transition: 'background-color var(--hb-transition-fast), border-color var(--hb-transition-fast)',
          }}
        >
          <ChevronLeftIcon />
        </button>

        {/* Page number buttons */}
        {pageRange.map((page) => {
          if (typeof page === 'string') {
            // Ellipsis indicator
            return (
              <span
                key={page}
                aria-hidden="true"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  fontSize: 'var(--hb-font-size-sm)',
                  color: 'var(--hb-secondary-gray)',
                  userSelect: 'none',
                }}
              >
                …
              </span>
            );
          }

          const isActive = page === safeCurrentPage;

          return (
            <button
              key={page}
              type="button"
              onClick={() => handlePageChange(page)}
              onKeyDown={(event) => handleKeyDown(event, () => handlePageChange(page))}
              aria-label={`Go to page ${page}`}
              aria-current={isActive ? 'page' : undefined}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                padding: 0,
                border: isActive ? '1px solid var(--hb-primary-blue)' : '1px solid var(--hb-secondary-gray-light)',
                borderRadius: 'var(--hb-radius-sm)',
                backgroundColor: isActive ? 'var(--hb-primary-blue)' : 'var(--hb-primary-white)',
                color: isActive ? 'var(--hb-primary-white)' : 'var(--hb-primary-black)',
                fontSize: 'var(--hb-font-size-sm)',
                fontWeight: isActive ? '500' : '400',
                cursor: isActive ? 'default' : 'pointer',
                transition: 'background-color var(--hb-transition-fast), border-color var(--hb-transition-fast), color var(--hb-transition-fast)',
              }}
            >
              {page}
            </button>
          );
        })}

        {/* Next button */}
        <button
          type="button"
          onClick={handleNext}
          onKeyDown={(event) => handleKeyDown(event, handleNext)}
          disabled={!hasNext}
          aria-label="Go to next page"
          aria-disabled={!hasNext ? 'true' : undefined}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            padding: 0,
            border: '1px solid var(--hb-secondary-gray-light)',
            borderRadius: 'var(--hb-radius-sm)',
            backgroundColor: hasNext ? 'var(--hb-primary-white)' : 'var(--hb-secondary-gray-lighter)',
            color: hasNext ? 'var(--hb-primary-black)' : 'var(--hb-secondary-gray)',
            cursor: hasNext ? 'pointer' : 'not-allowed',
            transition: 'background-color var(--hb-transition-fast), border-color var(--hb-transition-fast)',
          }}
        >
          <ChevronRightIcon />
        </button>
      </div>
    </nav>
  );
}

Pagination.propTypes = {
  currentPage: PropTypes.number,
  totalPages: PropTypes.number,
  onPageChange: PropTypes.func.isRequired,
  pageSize: PropTypes.number,
  totalItems: PropTypes.number,
  maxVisiblePages: PropTypes.number,
  className: PropTypes.string,
};

export default Pagination;