import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { AccountProvider } from './context/AccountContext.jsx';
import { StepProvider } from './context/StepContext.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import router from './router.jsx';

/**
 * Root application component.
 *
 * Wraps the entire application with context providers and an error
 * boundary. Renders the {@link RouterProvider} with the router
 * configuration from {@link router}.
 *
 * Provider nesting order (outermost → innermost):
 *   1. {@link ErrorBoundary} — catches unhandled rendering errors
 *   2. {@link AuthProvider} — authentication, verification, token state
 *   3. {@link AccountProvider} — account, signer, staged changes state
 *   4. {@link StepProvider} — multi-step flow navigation state
 *   5. {@link RouterProvider} — React Router route rendering
 *
 * @returns {React.ReactElement} The root application element.
 */
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AccountProvider>
          <StepProvider>
            <RouterProvider router={router} />
          </StepProvider>
        </AccountProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;