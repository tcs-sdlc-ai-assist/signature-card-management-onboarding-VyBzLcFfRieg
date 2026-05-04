import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { LoginForm } from './LoginForm.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';
import { LOGIN_MESSAGES } from '../../constants/messages.js';
import { MAX_LOGIN_ATTEMPTS } from '../../constants/constants.js';

/**
 * Builds a mock AuthContext value with sensible defaults.
 * Callers can override any property.
 *
 * @param {Object} [overrides] - Properties to override on the default context.
 * @returns {Object} A mock AuthContext value.
 */
function buildMockAuthContext(overrides = {}) {
  return {
    user: null,
    isAuthenticated: false,
    isVerified: false,
    isTokenValid: false,
    loading: false,
    error: null,
    login: vi.fn(() => ({
      status: 'success',
      user: { id: 'usr-001', username: 'cpuser01' },
    })),
    logout: vi.fn(),
    verifyIdentity: vi.fn(),
    validateToken: vi.fn(),
    clearError: vi.fn(),
    sessionWarning: {
      isVisible: false,
      timeRemaining: { totalMs: 0, minutes: 0, seconds: 0, display: '0:00' },
      dismiss: vi.fn(),
      resetTimer: vi.fn(),
    },
    ...overrides,
  };
}

/**
 * Renders the LoginForm wrapped in the AuthContext provider with the
 * given context value.
 *
 * @param {Object} [contextOverrides] - Overrides for the mock auth context.
 * @returns {{ contextValue: Object }} The mock context value for assertions.
 */
function renderLoginForm(contextOverrides = {}) {
  const contextValue = buildMockAuthContext(contextOverrides);

  render(
    <AuthContext.Provider value={contextValue}>
      <LoginForm />
    </AuthContext.Provider>
  );

  return { contextValue };
}

// Mock getLockoutStatus from authService so the component can read lockout state
vi.mock('../../services/authService.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getLockoutStatus: vi.fn(() => ({
      isLocked: false,
      lockoutUntil: null,
      failedAttempts: 0,
      maxAttempts: MAX_LOGIN_ATTEMPTS,
    })),
  };
});

// Import the mocked module so we can change return values per test
import { getLockoutStatus } from '../../services/authService.js';

describe('LoginForm', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    getLockoutStatus.mockReturnValue({
      isLocked: false,
      lockoutUntil: null,
      failedAttempts: 0,
      maxAttempts: MAX_LOGIN_ATTEMPTS,
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // ---- Rendering ----

  describe('rendering', () => {
    it('renders the Sign In heading', () => {
      renderLoginForm();

      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders a username input field', () => {
      renderLoginForm();

      const usernameInput = screen.getByLabelText(/username/i);
      expect(usernameInput).toBeInTheDocument();
      expect(usernameInput).toHaveAttribute('type', 'text');
      expect(usernameInput).toHaveAttribute('name', 'username');
    });

    it('renders a password input field', () => {
      renderLoginForm();

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('name', 'password');
    });

    it('renders a Sign In submit button', () => {
      renderLoginForm();

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('renders the login form with accessible label', () => {
      renderLoginForm();

      const form = screen.getByRole('form', { name: /login form/i });
      expect(form).toBeInTheDocument();
    });

    it('marks username and password fields as required', () => {
      renderLoginForm();

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(usernameInput).toBeRequired();
      expect(passwordInput).toBeRequired();
    });
  });

  // ---- Successful login ----

  describe('successful login', () => {
    it('calls login with username and password on form submission', async () => {
      const user = userEvent.setup();
      const { contextValue } = renderLoginForm();

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'cpuser01');
      await user.type(passwordInput, 'SecurePass123!');
      await user.click(submitButton);

      expect(contextValue.login).toHaveBeenCalledTimes(1);
      expect(contextValue.login).toHaveBeenCalledWith('cpuser01', 'SecurePass123!');
    });

    it('clears error state on successful login', async () => {
      const user = userEvent.setup();
      const clearError = vi.fn();
      const login = vi.fn(() => ({
        status: 'success',
        user: { id: 'usr-001', username: 'cpuser01' },
      }));

      renderLoginForm({ login, clearError });

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'cpuser01');
      await user.type(passwordInput, 'SecurePass123!');
      await user.click(submitButton);

      expect(login).toHaveBeenCalledTimes(1);
      expect(clearError).toHaveBeenCalled();
    });
  });

  // ---- Failed login ----

  describe('failed login', () => {
    it('shows a generic error message on failed login', async () => {
      const user = userEvent.setup();
      const login = vi.fn(() => ({
        status: 'error',
        message: LOGIN_MESSAGES.INVALID_CREDENTIALS,
        remainingAttempts: MAX_LOGIN_ATTEMPTS - 1,
      }));

      renderLoginForm({ login });

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'wronguser');
      await user.type(passwordInput, 'WrongPass!');
      await user.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent(/invalid/i);
      });
    });

    it('does not reveal which field is incorrect in the error message', async () => {
      const user = userEvent.setup();
      const login = vi.fn(() => ({
        status: 'error',
        message: LOGIN_MESSAGES.INVALID_CREDENTIALS,
        remainingAttempts: MAX_LOGIN_ATTEMPTS - 1,
      }));

      renderLoginForm({ login });

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'wronguser');
      await user.type(passwordInput, 'WrongPass!');
      await user.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.textContent.toLowerCase()).not.toContain('username is incorrect');
        expect(alert.textContent.toLowerCase()).not.toContain('password is incorrect');
        expect(alert.textContent.toLowerCase()).not.toContain('user not found');
      });
    });

    it('displays remaining attempts warning after a failed login', async () => {
      const user = userEvent.setup();
      const remaining = MAX_LOGIN_ATTEMPTS - 1;
      const login = vi.fn(() => ({
        status: 'error',
        message: LOGIN_MESSAGES.ATTEMPT_WARNING(remaining),
        remainingAttempts: remaining,
      }));

      renderLoginForm({ login });

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'wronguser');
      await user.type(passwordInput, 'WrongPass!');
      await user.click(submitButton);

      await waitFor(() => {
        const warningText = screen.getByText(new RegExp(`${remaining} attempt`, 'i'));
        expect(warningText).toBeInTheDocument();
      });
    });
  });

  // ---- Lockout ----

  describe('lockout behavior', () => {
    it('disables the form when the account is locked out', () => {
      const lockoutUntil = Date.now() + 30 * 60 * 1000; // 30 minutes from now
      getLockoutStatus.mockReturnValue({
        isLocked: true,
        lockoutUntil,
        failedAttempts: MAX_LOGIN_ATTEMPTS,
        maxAttempts: MAX_LOGIN_ATTEMPTS,
      });

      renderLoginForm();

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      expect(usernameInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });

    it('displays the lockout message when the account is locked', () => {
      const lockoutUntil = Date.now() + 30 * 60 * 1000;
      getLockoutStatus.mockReturnValue({
        isLocked: true,
        lockoutUntil,
        failedAttempts: MAX_LOGIN_ATTEMPTS,
        maxAttempts: MAX_LOGIN_ATTEMPTS,
      });

      renderLoginForm();

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toContain(LOGIN_MESSAGES.ACCOUNT_LOCKED);
    });

    it('shows a countdown timer when the account is locked', () => {
      const lockoutUntil = Date.now() + 5 * 60 * 1000; // 5 minutes from now
      getLockoutStatus.mockReturnValue({
        isLocked: true,
        lockoutUntil,
        failedAttempts: MAX_LOGIN_ATTEMPTS,
        maxAttempts: MAX_LOGIN_ATTEMPTS,
      });

      renderLoginForm();

      const timer = screen.getByRole('timer');
      expect(timer).toBeInTheDocument();
      expect(timer).toHaveTextContent(/\d+:\d{2}/);
    });
  });

  // ---- Inline validation ----

  describe('inline validation', () => {
    it('shows a required error when username is left empty and blurred', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const usernameInput = screen.getByLabelText(/username/i);

      await user.click(usernameInput);
      await user.tab(); // blur

      await waitFor(() => {
        const errorMessage = screen.getByText(/username is required/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('shows a required error when password is left empty and blurred', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const passwordInput = screen.getByLabelText(/password/i);

      await user.click(passwordInput);
      await user.tab(); // blur

      await waitFor(() => {
        const errorMessage = screen.getByText(/password is required/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('does not submit the form when required fields are empty', async () => {
      const user = userEvent.setup();
      const { contextValue } = renderLoginForm();

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      expect(contextValue.login).not.toHaveBeenCalled();
    });

    it('does not submit the form when only username is provided', async () => {
      const user = userEvent.setup();
      const { contextValue } = renderLoginForm();

      const usernameInput = screen.getByLabelText(/username/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'cpuser01');
      await user.click(submitButton);

      expect(contextValue.login).not.toHaveBeenCalled();
    });

    it('does not submit the form when only password is provided', async () => {
      const user = userEvent.setup();
      const { contextValue } = renderLoginForm();

      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(passwordInput, 'SecurePass123!');
      await user.click(submitButton);

      expect(contextValue.login).not.toHaveBeenCalled();
    });
  });

  // ---- Accessibility ----

  describe('accessibility', () => {
    it('has accessible labels for username and password fields', () => {
      renderLoginForm();

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(usernameInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });

    it('sets aria-invalid on username field when validation fails', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const usernameInput = screen.getByLabelText(/username/i);

      await user.click(usernameInput);
      await user.tab();

      await waitFor(() => {
        expect(usernameInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('sets aria-invalid on password field when validation fails', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const passwordInput = screen.getByLabelText(/password/i);

      await user.click(passwordInput);
      await user.tab();

      await waitFor(() => {
        expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('error messages have role="alert" for screen reader announcement', async () => {
      const user = userEvent.setup();
      const login = vi.fn(() => ({
        status: 'error',
        message: LOGIN_MESSAGES.INVALID_CREDENTIALS,
        remainingAttempts: MAX_LOGIN_ATTEMPTS - 1,
      }));

      renderLoginForm({ login });

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'wronguser');
      await user.type(passwordInput, 'WrongPass!');
      await user.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
      });
    });

    it('submit button has an accessible aria-label', () => {
      renderLoginForm();

      const submitButton = screen.getByRole('button', { name: /sign in to your account/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('username field has autocomplete attribute set to username', () => {
      renderLoginForm();

      const usernameInput = screen.getByLabelText(/username/i);
      expect(usernameInput).toHaveAttribute('autocomplete', 'username');
    });

    it('password field has autocomplete attribute set to current-password', () => {
      renderLoginForm();

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });
  });

  // ---- Loading state ----

  describe('loading state', () => {
    it('disables the form while auth is loading', () => {
      renderLoginForm({ loading: true });

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      expect(usernameInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  // ---- Auth context error ----

  describe('auth context error', () => {
    it('displays an error from the auth context when no local login error exists', () => {
      renderLoginForm({ error: 'Session expired. Please log in again.' });

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/session expired/i);
    });
  });

  // ---- Edge cases ----

  describe('edge cases', () => {
    it('handles login function throwing an exception gracefully', async () => {
      const user = userEvent.setup();
      const login = vi.fn(() => {
        throw new Error('Unexpected error');
      });

      renderLoginForm({ login });

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'cpuser01');
      await user.type(passwordInput, 'SecurePass123!');
      await user.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
      });
    });

    it('calls clearError on form submission', async () => {
      const user = userEvent.setup();
      const clearError = vi.fn();
      const login = vi.fn(() => ({
        status: 'success',
        user: { id: 'usr-001' },
      }));

      renderLoginForm({ login, clearError });

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'cpuser01');
      await user.type(passwordInput, 'SecurePass123!');
      await user.click(submitButton);

      expect(clearError).toHaveBeenCalled();
    });
  });
});