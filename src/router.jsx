/**
 * Application routing configuration.
 *
 * Defines all application routes using React Router's `createBrowserRouter`.
 * Protected routes are wrapped with the {@link ProtectedRoute} component
 * to enforce authentication, verification, and token validation requirements.
 *
 * Route structure:
 *   - `/` — Welcome/landing page (public)
 *   - `/login` — Login page (public)
 *   - `/verify` — Identity verification page (requires authentication)
 *   - `/validate-token` — eSign token validation page (requires authentication + verification)
 *   - `/accounts` — Account selection page (requires full auth chain)
 *   - `/signers` — Signer management page (requires full auth chain)
 *   - `/confirm` — Confirm staged changes page (requires full auth chain)
 *   - `/review` — Final review page (requires full auth chain)
 *   - `/submit` — Submission confirmation page (requires full auth chain)
 *   - `*` — 404 Not Found page (public)
 *
 * @module router
 */

import React from 'react';
import { createBrowserRouter, Navigate, useNavigate } from 'react-router-dom';
import { WelcomePage } from './pages/WelcomePage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { SignupPage } from './pages/SignupPage.jsx';
import { VerificationPage } from './pages/VerificationPage.jsx';
import { TokenValidationPage } from './pages/TokenValidationPage.jsx';
import { AccountSelectionPage } from './pages/AccountSelectionPage.jsx';
import { SignerManagementPage } from './pages/SignerManagementPage.jsx';
import { ConfirmChangesPage } from './pages/ConfirmChangesPage.jsx';
import { ReviewPage } from './pages/ReviewPage.jsx';
import { SubmissionPage } from './pages/SubmissionPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { SKIP_IDENTITY_AND_TOKEN_STEPS } from './constants/constants.js';

/**
 * Welcome page wrapper with navigation callbacks.
 *
 * @returns {React.ReactElement}
 */
function WelcomeRoute() {
  const navigate = useNavigate();

  return (
    <WelcomePage
      onGetStarted={() => navigate('/signup')}
    />
  );
}

/**
 * Login page wrapper with navigation callbacks.
 *
 * @returns {React.ReactElement}
 */
function LoginRoute() {
  const navigate = useNavigate();

  return (
    <LoginPage
      onLoginSuccess={() => navigate(SKIP_IDENTITY_AND_TOKEN_STEPS ? '/accounts' : '/verify')}
      onSignUpNavigate={() => navigate('/signup')}
    />
  );
}

/**
 * Signup page wrapper with navigation callbacks.
 *
 * @returns {React.ReactElement}
 */
function SignupRoute() {
  const navigate = useNavigate();

  return (
    <SignupPage
      onSignupSuccess={() => navigate('/login')}
      onLoginNavigate={() => navigate('/login')}
    />
  );
}

/**
 * Verification page wrapper with navigation callbacks.
 *
 * @returns {React.ReactElement}
 */
function VerificationRoute() {
  if (SKIP_IDENTITY_AND_TOKEN_STEPS) {
    return <Navigate to="/accounts" replace />;
  }

  const navigate = useNavigate();

  return (
    <VerificationPage
      onVerificationSuccess={() => navigate('/validate-token')}
      onLoginRedirect={() => navigate('/login')}
    />
  );
}

/**
 * Token validation page wrapper with navigation callbacks.
 *
 * @returns {React.ReactElement}
 */
function TokenValidationRoute() {
  if (SKIP_IDENTITY_AND_TOKEN_STEPS) {
    return <Navigate to="/accounts" replace />;
  }

  const navigate = useNavigate();

  return (
    <TokenValidationPage
      onTokenValidationSuccess={() => navigate('/accounts')}
      onLoginRedirect={() => navigate('/login')}
      onVerificationRedirect={() => navigate('/verify')}
    />
  );
}

/**
 * Account selection page wrapper with navigation callbacks.
 *
 * @returns {React.ReactElement}
 */
function AccountSelectionRoute() {
  const navigate = useNavigate();

  return (
    <AccountSelectionPage
      onAccountSelect={() => navigate('/signers')}
      onLoginRedirect={() => navigate('/login')}
      onVerificationRedirect={() => navigate('/verify')}
      onTokenValidationRedirect={() => navigate('/validate-token')}
    />
  );
}

/**
 * Signer management page wrapper with navigation callbacks.
 *
 * @returns {React.ReactElement}
 */
function SignerManagementRoute() {
  const navigate = useNavigate();

  return (
    <SignerManagementPage
      onNavigateToConfirm={() => navigate('/confirm')}
      onNavigateToAccountSelection={() => navigate('/accounts')}
      onLoginRedirect={() => navigate('/login')}
      onVerificationRedirect={() => navigate('/verify')}
      onTokenValidationRedirect={() => navigate('/validate-token')}
    />
  );
}

/**
 * Confirm changes page wrapper with navigation callbacks.
 *
 * @returns {React.ReactElement}
 */
function ConfirmChangesRoute() {
  const navigate = useNavigate();

  return (
    <ConfirmChangesPage
      onGoBack={() => navigate('/signers')}
      onContinue={() => navigate('/review')}
      onLoginRedirect={() => navigate('/login')}
      onVerificationRedirect={() => navigate('/verify')}
      onTokenValidationRedirect={() => navigate('/validate-token')}
      onNavigateToAccountSelection={() => navigate('/accounts')}
    />
  );
}

/**
 * Review page wrapper with navigation callbacks.
 *
 * @returns {React.ReactElement}
 */
function ReviewRoute() {
  const navigate = useNavigate();

  return (
    <ReviewPage
      onEdit={() => navigate('/signers')}
      onSubmitSuccess={() => navigate('/submit')}
      onLoginRedirect={() => navigate('/login')}
      onVerificationRedirect={() => navigate('/verify')}
      onTokenValidationRedirect={() => navigate('/validate-token')}
      onNavigateToAccountSelection={() => navigate('/accounts')}
    />
  );
}

/**
 * Submission page wrapper with navigation callbacks.
 *
 * @returns {React.ReactElement}
 */
function SubmissionRoute() {
  const navigate = useNavigate();

  return (
    <SubmissionPage
      onDone={() => navigate('/accounts')}
      onStartNew={() => navigate('/accounts')}
      onLoginRedirect={() => navigate('/login')}
      onVerificationRedirect={() => navigate('/verify')}
      onTokenValidationRedirect={() => navigate('/validate-token')}
      onNavigateToAccountSelection={() => navigate('/accounts')}
    />
  );
}

/**
 * 404 Not Found page wrapper with navigation callbacks.
 *
 * @returns {React.ReactElement}
 */
function NotFoundRoute() {
  const navigate = useNavigate();

  return (
    <NotFoundPage
      onNavigateHome={() => navigate('/')}
    />
  );
}

/**
 * Application router configuration.
 *
 * Uses `createBrowserRouter` from React Router v6 to define all
 * application routes with their corresponding page components.
 *
 * @type {import('react-router-dom').Router}
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <WelcomeRoute />,
  },
  {
    path: '/login',
    element: <LoginRoute />,
  },
  {
    path: '/signup',
    element: <SignupRoute />,
  },
  {
    path: '/verify',
    element: <VerificationRoute />,
  },
  {
    path: '/validate-token',
    element: <TokenValidationRoute />,
  },
  {
    path: '/accounts',
    element: <AccountSelectionRoute />,
  },
  {
    path: '/signers',
    element: <SignerManagementRoute />,
  },
  {
    path: '/confirm',
    element: <ConfirmChangesRoute />,
  },
  {
    path: '/review',
    element: <ReviewRoute />,
  },
  {
    path: '/submit',
    element: <SubmissionRoute />,
  },
  {
    path: '*',
    element: <NotFoundRoute />,
  },
]);

export default router;