/**
 * Authentication context provider and hook.
 *
 * Provides global authentication, verification, and token validation
 * state to the component tree. Wraps {@link authService},
 * {@link verificationService}, and {@link tokenService}. Integrates
 * {@link useSessionTimeout} for inactivity management.
 *
 * Exports:
 *   - {@link AuthContext} — the React context object
 *   - {@link AuthProvider} — the context provider component
 *   - {@link useAuth} — custom hook for consuming auth state
 *
 * @module AuthContext
 */

import React, { createContext, useState, useCallback, useEffect, useContext, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  login as authLogin,
  signup as authSignup,
  logout as authLogout,
  getSession,
  isAuthenticated as checkIsAuthenticated,
} from '../services/authService.js';
import {
  verifyIdentity as serviceVerifyIdentity,
  getVerificationStatus,
  resetVerification,
  VERIFICATION_METHODS,
} from '../services/verificationService.js';
import {
  validateESignToken,
  getTokenStatus,
  resetTokenState,
  TOKEN_STATUSES,
} from '../services/tokenService.js';
import { useSessionTimeout } from '../hooks/useSessionTimeout.js';
import { logEvent, AUDIT_EVENT_TYPES } from '../services/auditLogger.js';
import { LOGIN_MESSAGES } from '../constants/messages.js';
import { SKIP_IDENTITY_AND_TOKEN_STEPS } from '../constants/constants.js';

/**
 * @type {React.Context}
 */
export const AuthContext = createContext(null);

/**
 * Authentication context provider component.
 *
 * Manages the full auth lifecycle: login → identity verification →
 * eSign token validation. Integrates session timeout monitoring and
 * provides all auth-related state and actions to descendants.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components.
 * @returns {React.ReactElement}
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initializedRef = useRef(false);

  /**
   * Handles session timeout by clearing all auth state.
   */
  const handleSessionTimeout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setIsVerified(false);
    setIsTokenValid(false);
    setError(LOGIN_MESSAGES.SESSION_EXPIRED);

    // Reset verification and token state
    try {
      resetVerification();
    } catch {
      // Must not break the timeout flow.
    }
    try {
      resetTokenState();
    } catch {
      // Must not break the timeout flow.
    }
  }, []);

  const { isWarningVisible, timeRemaining, resetTimer, dismissWarning } =
    useSessionTimeout({
      onTimeout: handleSessionTimeout,
    });

  /**
   * Restores session state from localStorage on mount.
   */
  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;

    try {
      const session = getSession();

      if (session && session.user) {
        setUser(session.user);
        setIsAuthenticated(true);

        if (SKIP_IDENTITY_AND_TOKEN_STEPS) {
          setIsVerified(true);
          setIsTokenValid(true);
          return;
        }

        // Restore verification status
        const verificationStatus = getVerificationStatus();
        if (verificationStatus.isVerified && verificationStatus.userId === session.user.id) {
          setIsVerified(true);
        }

        // Restore token validation status
        // We don't have the token string stored in context, but we check
        // if the user has a confirmed token in the status map
        // For MVP, we rely on the verification + token flow being re-done
        // if the page is refreshed mid-flow. Token valid state is session-scoped.
      }
    } catch {
      // Silently fail — user will need to log in again.
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Authenticates a user with the provided credentials.
   *
   * @param {string} username - The username.
   * @param {string} password - The password.
   * @returns {{
   *   status: 'success'|'error',
   *   user?: Object,
   *   message?: string,
   *   remainingAttempts?: number
   * }} The login result.
   */
  const login = useCallback((username, password) => {
    setLoading(true);
    setError(null);

    try {
      const result = authLogin(username, password);

      if (result.status === 'success') {
        setUser(result.user);
        setIsAuthenticated(true);
        setIsVerified(SKIP_IDENTITY_AND_TOKEN_STEPS);
        setIsTokenValid(SKIP_IDENTITY_AND_TOKEN_STEPS);
        setError(null);

        // Reset verification and token state for new session
        try {
          resetVerification();
        } catch {
          // Must not break the login flow.
        }
        try {
          resetTokenState();
        } catch {
          // Must not break the login flow.
        }

        setLoading(false);
        return {
          status: 'success',
          user: result.user,
        };
      }

      setError(result.message || LOGIN_MESSAGES.INVALID_CREDENTIALS);
      setLoading(false);
      return {
        status: 'error',
        message: result.message || LOGIN_MESSAGES.INVALID_CREDENTIALS,
        remainingAttempts: result.remainingAttempts,
      };
    } catch {
      const message = LOGIN_MESSAGES.INVALID_CREDENTIALS;
      setError(message);
      setLoading(false);
      return {
        status: 'error',
        message,
      };
    }
  }, []);

  /**
   * Creates a mock frontend user account.
   *
   * @param {{
   *   firstName: string,
   *   lastName: string,
   *   email: string,
   *   username: string,
   *   password: string
   * }} payload - Registration data.
   * @returns {{ status: 'success'|'error', message?: string, user?: Object }} Signup result.
   */
  const signup = useCallback((payload) => {
    setLoading(true);
    setError(null);

    try {
      const result = authSignup(payload);
      if (result.status === 'success') {
        setError(null);
      } else {
        setError(result.message || 'Unable to create account.');
      }
      setLoading(false);
      return result;
    } catch {
      const message = 'Unable to create account.';
      setError(message);
      setLoading(false);
      return {
        status: 'error',
        message,
      };
    }
  }, []);

  /**
   * Logs out the current user and clears all auth state.
   */
  const logout = useCallback(() => {
    try {
      authLogout();
    } catch {
      // Must not break the logout flow.
    }

    try {
      resetVerification();
    } catch {
      // Must not break the logout flow.
    }

    try {
      resetTokenState();
    } catch {
      // Must not break the logout flow.
    }

    setUser(null);
    setIsAuthenticated(false);
    setIsVerified(false);
    setIsTokenValid(false);
    setError(null);
  }, []);

  /**
   * Verifies the user's identity using the specified method.
   *
   * @param {Object} params
   * @param {string} params.method - One of 'otp' or 'kba'.
   * @param {string} [params.otp] - The OTP code (required when method is 'otp').
   * @param {Object} [params.kbaAnswers] - KBA answers map (required when method is 'kba').
   * @returns {{
   *   status: 'success'|'error',
   *   verified?: boolean,
   *   message?: string,
   *   attemptsUsed?: number,
   *   attemptsRemaining?: number
   * }} The verification result.
   */
  const verifyIdentity = useCallback((params = {}) => {
    if (SKIP_IDENTITY_AND_TOKEN_STEPS) {
      setIsVerified(true);
      return {
        status: 'success',
        verified: true,
        message: 'Identity verification skipped in mock mode.',
      };
    }

    const { method, otp, kbaAnswers } = params;

    if (!user || !isAuthenticated) {
      return {
        status: 'error',
        message: LOGIN_MESSAGES.LOGIN_REQUIRED,
      };
    }

    setLoading(true);
    setError(null);

    try {
      const result = serviceVerifyIdentity({
        userId: user.id,
        method,
        otp,
        kbaAnswers,
      });

      if (result.status === 'success' && result.verified) {
        setIsVerified(true);
        setError(null);
        setLoading(false);
        return {
          status: 'success',
          verified: true,
          message: result.message,
          attemptsUsed: result.attemptsUsed,
          attemptsRemaining: result.attemptsRemaining,
        };
      }

      setError(result.message || null);
      setLoading(false);
      return {
        status: 'error',
        verified: false,
        message: result.message,
        attemptsUsed: result.attemptsUsed,
        attemptsRemaining: result.attemptsRemaining,
      };
    } catch {
      setError('An unexpected error occurred during verification.');
      setLoading(false);
      return {
        status: 'error',
        verified: false,
        message: 'An unexpected error occurred during verification.',
      };
    }
  }, [user, isAuthenticated]);

  /**
   * Validates an eSign token for the authenticated user.
   *
   * @param {string} token - The eSign token string to validate.
   * @returns {{
   *   status: 'success'|'error',
   *   tokenStatus?: string,
   *   message?: string,
   *   attemptsUsed?: number,
   *   attemptsRemaining?: number
   * }} The validation result.
   */
  const validateToken = useCallback((token) => {
    if (SKIP_IDENTITY_AND_TOKEN_STEPS) {
      setIsTokenValid(true);
      return {
        status: 'success',
        tokenStatus: TOKEN_STATUSES.CONFIRMED,
        message: 'Token validation skipped in mock mode.',
      };
    }

    if (!user || !isAuthenticated) {
      return {
        status: 'error',
        message: LOGIN_MESSAGES.LOGIN_REQUIRED,
      };
    }

    setLoading(true);
    setError(null);

    try {
      const result = validateESignToken({
        userId: user.id,
        token,
      });

      if (result.status === 'success' && result.tokenStatus === TOKEN_STATUSES.CONFIRMED) {
        setIsTokenValid(true);
        setError(null);
        setLoading(false);
        return {
          status: 'success',
          tokenStatus: result.tokenStatus,
          message: result.message,
          attemptsUsed: result.attemptsUsed,
          attemptsRemaining: result.attemptsRemaining,
        };
      }

      setError(result.message || null);
      setLoading(false);
      return {
        status: 'error',
        tokenStatus: result.tokenStatus,
        message: result.message,
        attemptsUsed: result.attemptsUsed,
        attemptsRemaining: result.attemptsRemaining,
      };
    } catch {
      setError('An unexpected error occurred during token validation.');
      setLoading(false);
      return {
        status: 'error',
        message: 'An unexpected error occurred during token validation.',
      };
    }
  }, [user, isAuthenticated]);

  /**
   * Clears the current error state.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const contextValue = useMemo(() => ({
    user,
    isAuthenticated,
    isVerified,
    isTokenValid,
    loading,
    error,
    login,
    signup,
    logout,
    verifyIdentity,
    validateToken,
    clearError,
    sessionWarning: {
      isVisible: isWarningVisible,
      timeRemaining,
      dismiss: dismissWarning,
      resetTimer,
    },
  }), [
    user,
    isAuthenticated,
    isVerified,
    isTokenValid,
    loading,
    error,
    login,
    signup,
    logout,
    verifyIdentity,
    validateToken,
    clearError,
    isWarningVisible,
    timeRemaining,
    dismissWarning,
    resetTimer,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook for consuming the authentication context.
 *
 * Must be used within an {@link AuthProvider}. Throws if used outside
 * the provider tree.
 *
 * @returns {{
 *   user: Object|null,
 *   isAuthenticated: boolean,
 *   isVerified: boolean,
 *   isTokenValid: boolean,
 *   loading: boolean,
 *   error: string|null,
 *   login: function(string, string): Object,
 *   logout: function(): void,
 *   verifyIdentity: function(Object): Object,
 *   validateToken: function(string): Object,
 *   clearError: function(): void,
 *   sessionWarning: {
 *     isVisible: boolean,
 *     timeRemaining: Object,
 *     dismiss: function(): void,
 *     resetTimer: function(): void
 *   }
 * }}
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Wrap your component tree with <AuthProvider>.'
    );
  }

  return context;
}