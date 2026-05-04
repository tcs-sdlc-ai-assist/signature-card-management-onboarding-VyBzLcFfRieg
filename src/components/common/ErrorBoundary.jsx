/**
 * React error boundary component for graceful error handling.
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs them via {@link auditLogger}, and displays a fallback UI
 * with an error message and retry button using HB CSS alert styling.
 *
 * React error boundaries must be class components — functional
 * components cannot implement `componentDidCatch` or
 * `getDerivedStateFromError`.
 *
 * @module ErrorBoundary
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { logEvent, AUDIT_EVENT_TYPES } from '../../services/auditLogger.js';

/**
 * Default fallback UI rendered when an error is caught.
 *
 * Displays an HB CSS critical alert with the error message and a
 * retry button that resets the error boundary state.
 *
 * @param {Object} props
 * @param {Error} props.error - The caught error object.
 * @param {function} props.onReset - Callback to reset the error boundary.
 * @returns {React.ReactElement} The fallback UI.
 */
function DefaultFallback({ error, onReset }) {
  return (
    <div
      className="hb-alert-critical"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{ margin: 'var(--hb-space-lg)' }}
    >
      <svg
        className="alert-icon"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontWeight: 500 }}>
          Something went wrong
        </p>
        <p style={{ margin: 'var(--hb-space-xs) 0 0', fontSize: 'var(--hb-font-size-sm)' }}>
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          type="button"
          className="button-secondary-2 button-sm"
          onClick={onReset}
          style={{ marginTop: 'var(--hb-space-md)' }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

DefaultFallback.propTypes = {
  error: PropTypes.instanceOf(Error),
  onReset: PropTypes.func.isRequired,
};

/**
 * React error boundary component.
 *
 * Catches JavaScript errors in the child component tree, logs them
 * via the audit logger, and renders a fallback UI. Supports an
 * optional custom fallback component or element.
 *
 * @example
 * // With default fallback
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * @example
 * // With custom fallback component
 * <ErrorBoundary fallback={<CustomErrorPage />}>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * @example
 * // With custom fallback render function
 * <ErrorBoundary fallback={(error, onReset) => <div>Error: {error.message} <button onClick={onReset}>Retry</button></div>}>
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
    this.handleReset = this.handleReset.bind(this);
  }

  /**
   * Derives error state from a caught error.
   *
   * @param {Error} error - The caught error.
   * @returns {{ hasError: boolean, error: Error }} Updated state.
   */
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Logs the caught error and component stack via the audit logger.
   *
   * @param {Error} error - The caught error.
   * @param {Object} errorInfo - React error info with componentStack.
   */
  componentDidCatch(error, errorInfo) {
    try {
      logEvent({
        eventType: AUDIT_EVENT_TYPES.ERROR,
        userId: null,
        description: `Unhandled error caught by ErrorBoundary: ${error?.message || 'Unknown error'}`,
        details: {
          action: 'error_boundary_catch',
          errorMessage: error?.message || 'Unknown error',
          errorName: error?.name || 'Error',
          componentStack: errorInfo?.componentStack || '',
        },
      });
    } catch {
      // Audit logging must never break the error boundary flow.
    }
  }

  /**
   * Resets the error boundary state, allowing the child tree to
   * attempt re-rendering.
   */
  handleReset() {
    this.setState({
      hasError: false,
      error: null,
    });
  }

  render() {
    const { hasError, error } = this.state;
    const { fallback, children } = this.props;

    if (hasError) {
      // Custom fallback as a render function
      if (typeof fallback === 'function') {
        return fallback(error, this.handleReset);
      }

      // Custom fallback as a React element
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <DefaultFallback
          error={error}
          onReset={this.handleReset}
        />
      );
    }

    return children;
  }
}

ErrorBoundary.propTypes = {
  /** Optional custom fallback UI. Can be a React element or a render function receiving (error, onReset). */
  fallback: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.func,
  ]),
  /** Child components to render when no error is present. */
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;