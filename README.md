# SIG Card Management

Signature Card Management portal for business banking — a secure, self-service web application that enables controlling parties to manage authorized signers, debit cards, and related operations across their business banking accounts.

---

## Table of Contents

1. [Project Description](#project-description)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Folder Structure](#folder-structure)
5. [Getting Started](#getting-started)
6. [Available Scripts](#available-scripts)
7. [Environment Variables](#environment-variables)
8. [Screen Flow](#screen-flow)
9. [Accessibility](#accessibility)
10. [Mock Data](#mock-data)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [License](#license)

---

## Project Description

SIG Card Management provides controlling parties at business banking institutions with a streamlined, secure interface to manage authorized signer debit cards across all linked business accounts. The portal supports the full signer lifecycle — adding, editing, removing, unlocking, and resending invitations — with a staged review-before-commit workflow, legal consent acknowledgment, and comprehensive audit logging.

Every action is identity-verified, rate-limited where appropriate, and recorded in an immutable audit trail. The application enforces session timeouts, account lockout after failed login attempts, and daily attempt limits on sensitive operations (unlock, resend PIN).

This is an MVP release using mock data fixtures and localStorage for persistence. The architecture is designed for seamless migration to a real backend API.

---

## Features

### Welcome & Onboarding
- Pre-login welcome page with informational content loaded from `contentService`
- Feature highlights showcasing portal capabilities
- "Get Started" CTA button navigating to the login flow
- Content override support via localStorage for admin editing without code changes

### Authentication & Session Management
- Secure login form with floating label pattern (HB CSS framework)
- Generic error messaging on failed login — does not reveal which field is incorrect
- Configurable maximum login attempts before account lockout
- Configurable lockout duration with countdown timer display
- Session persistence in localStorage with TTL-based expiry
- Configurable session timeout with inactivity monitoring
- Session timeout warning modal with countdown timer and "Stay Logged In" / "Log Out" actions
- Automatic logout on session expiry with audit logging

### Identity Verification (KBA/OTP Stub)
- Post-login identity verification step with two methods: OTP and KBA
- OTP method with "Send Code" action and 6-digit code input (mock valid code: `123456`)
- KBA method with three security questions
- Tab-based method selector for switching between OTP and KBA
- Attempt tracking with remaining attempts display and exhaustion handling

### eSign Token Validation
- Token input form with inline validation (minimum 10 characters)
- Token validation against mock data with user association check
- Token expiry detection with appropriate error messaging
- Daily rate-limited validation attempts (maximum 3 per day)

### Account Selection
- Business banking account list with masked account numbers (`****XXXX` format)
- Account type badges (Business Checking, Business Savings, Business Money Market)
- Signer count display per account
- Auto-selection when only one account is available
- Keyboard navigation and pagination support

### Signer Management
- Consolidated authorized signer list in table layout with sortable columns (Name, Role, Status)
- Status badges: Active (green), Pending (orange), Locked (red)
- Search filtering by name, email, or last four SSN
- Status dropdown filter (All, Active, Pending, Locked)
- Per-signer action buttons: Edit, Remove, Unlock (locked only), Resend Invitation (pending only)
- Add/Edit Signer forms with required and optional fields
- Remove Signer confirmation modal with optional reason input and last-signer prevention
- Staged change tracking with review-before-commit workflow

### Self-Service Unlock (Rate-Limited)
- Daily rate limit of 3 unlock attempts per day
- Attempt-based messaging with visual dot indicators
- "Contact support" guidance when all attempts are exhausted

### Self-Service Resend Invitation (Rate-Limited)
- New invitation token generation with previous token invalidation
- Daily rate limit of 3 resend attempts per day
- Attempt-based messaging with visual dot indicators

### Change Confirmation & Final Review
- Staged changes summary with grouped display: additions, edits (with before/after comparison), removals
- Change count summary badges
- Complete authorized signer list with visual change indicators (New, Modified, Removed, Unchanged)
- Legal consent/acknowledgment checkbox requirement
- Submit button disabled until legal consent is given

### Submission & Confirmation
- Batch submission with confirmation ID generation (`CONF-XXXXXXXX` format)
- Confirmation page with confirmation ID, change summary, timestamp, and next steps
- Print/save confirmation support via browser print dialog
- Disabled submit button to prevent duplicate submissions

### Multi-Step Progress Navigation
- Step-based progress indicator with numbered circles, labels, and connector lines
- Sequential forward progression enforcement with backward navigation support
- Keyboard navigation between steps

### Error Handling & User Feedback
- React ErrorBoundary component with fallback UI and retry button
- Reusable Alert component with four severity levels: critical/error, warning, success, info
- Inline form validation with real-time error messages
- Loading spinners with screen reader announcements
- Unsaved changes exit confirmation modal with browser `beforeunload` interception

### Audit Logging
- Centralized immutable audit log service with append-only localStorage persistence
- Automatic PII sanitization before persistence
- Unique event IDs (UUID v4) and ISO-8601 timestamps
- Maximum 1,000 log entries with automatic oldest-entry trimming

### Notification Service (Stubbed)
- Confirmation, invitation, PIN resend, and card action notification stubs
- Console logging and audit trail for all notification events

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | UI component library |
| **Vite 5** | Build tooling and development server |
| **React Router v6** | Client-side routing with `createBrowserRouter` |
| **HB CSS Framework** | Custom CSS framework with design tokens, responsive grid, and component styles |
| **localStorage** | MVP data persistence (session, staged changes, audit log, rate limits) |
| **uuid** | Unique ID generation (UUID v4) |
| **prop-types** | Runtime prop type checking |
| **Vitest** | Test framework with jsdom environment |
| **Testing Library** | React component testing utilities |

---

## Folder Structure

```
sig-card-mgmt/
├── public/                          # Static assets
├── src/
│   ├── components/                  # Reusable UI components
│   │   ├── accounts/                # Account selection components
│   │   │   └── AccountList.jsx
│   │   ├── auth/                    # Authentication components
│   │   │   ├── IdentityVerificationForm.jsx
│   │   │   ├── LoginForm.jsx
│   │   │   ├── LoginForm.test.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── SessionTimeoutModal.jsx
│   │   │   └── TokenValidationStatus.jsx
│   │   ├── common/                  # Shared/generic components
│   │   │   ├── Alert.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── ExitConfirmationModal.jsx
│   │   │   ├── FormField.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Pagination.jsx
│   │   │   └── ProgressIndicator.jsx
│   │   ├── layout/                  # Layout components
│   │   │   ├── AppLayout.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Header.jsx
│   │   ├── review/                  # Review and submission components
│   │   │   ├── ConfirmChanges.jsx
│   │   │   ├── FinalReview.jsx
│   │   │   └── SubmissionConfirmation.jsx
│   │   └── signers/                 # Signer management components
│   │       ├── RemoveSignerModal.jsx
│   │       ├── ResendInvitationAction.jsx
│   │       ├── SignerForm.jsx
│   │       ├── SignerList.jsx
│   │       ├── SignerList.test.jsx
│   │       └── UnlockSignerAction.jsx
│   ├── constants/                   # Application constants and messages
│   │   ├── constants.js
│   │   └── messages.js
│   ├── context/                     # React context providers
│   │   ├── AccountContext.jsx
│   │   ├── AuthContext.jsx
│   │   └── StepContext.jsx
│   ├── data/                        # Mock data fixtures and content
│   │   ├── mockData.js
│   │   └── welcomeContent.json
│   ├── hooks/                       # Custom React hooks
│   │   ├── useFormValidation.js
│   │   ├── useRateLimitHook.js
│   │   └── useSessionTimeout.js
│   ├── pages/                       # Route-level page components
│   │   ├── AccountSelectionPage.jsx
│   │   ├── ConfirmChangesPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── NotFoundPage.jsx
│   │   ├── ReviewPage.jsx
│   │   ├── SignerManagementPage.jsx
│   │   ├── SubmissionPage.jsx
│   │   ├── TokenValidationPage.jsx
│   │   ├── VerificationPage.jsx
│   │   ├── WelcomePage.jsx
│   │   └── WelcomePage.test.jsx
│   ├── services/                    # Business logic and data services
│   │   ├── accountService.js
│   │   ├── auditLogger.js
│   │   ├── auditLogger.test.js
│   │   ├── authService.js
│   │   ├── authService.test.js
│   │   ├── contentService.js
│   │   ├── notificationService.js
│   │   ├── rateLimiter.js
│   │   ├── rateLimiter.test.js
│   │   ├── signerService.js
│   │   ├── signerService.test.js
│   │   ├── tokenService.js
│   │   ├── tokenService.test.js
│   │   └── verificationService.js
│   ├── utils/                       # Utility functions
│   │   ├── dateUtils.js
│   │   ├── idGenerator.js
│   │   ├── maskingUtils.js
│   │   ├── maskingUtils.test.js
│   │   ├── storageUtils.js
│   │   ├── validators.js
│   │   └── validators.test.js
│   ├── App.jsx                      # Root application component
│   ├── index.css                    # HB CSS framework global styles
│   ├── main.jsx                     # Application entry point
│   └── router.jsx                   # React Router configuration
├── .env.example                     # Environment variable template
├── .gitignore
├── CHANGELOG.md
├── DEPLOYMENT.md
├── README.md
├── index.html                       # HTML entry point
├── package.json
├── vercel.json                      # Vercel SPA rewrite configuration
├── vite.config.js                   # Vite build configuration
└── vitest.config.js                 # Vitest test configuration
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd sig-card-mgmt
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your local configuration. See [Environment Variables](#environment-variables) for details.

4. **Start the development server:**

   ```bash
   npm run dev
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000).

### Mock Credentials

For local development and demos, use the following credentials:

| Field | Value |
|---|---|
| **Username** | `cpuser01` |
| **Password** | `SecurePass123!` |
| **OTP Code** | `123456` |
| **KBA Answers** | Mother's maiden name: `Smith`, City of birth: `Springfield`, High school mascot: `Eagles` |
| **Valid eSign Token** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-valid-token` |

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| **dev** | `npm run dev` | Starts the Vite development server on `http://localhost:3000` |
| **build** | `npm run build` | Compiles the application into optimized static assets in `dist/` |
| **preview** | `npm run preview` | Previews the production build locally |
| **test** | `npm run test` | Runs the full Vitest test suite |
| **test:watch** | `npm run test:watch` | Runs Vitest in watch mode for development |
| **lint** | `npm run lint` | Runs ESLint across all `.js` and `.jsx` files |

---

## Environment Variables

All client-side environment variables **must** be prefixed with `VITE_` to be exposed to the Vite build process.

| Variable | Description | Default |
|---|---|---|
| `VITE_SESSION_TIMEOUT_MS` | Session timeout in milliseconds | `1800000` (30 min) |
| `VITE_MAX_LOGIN_ATTEMPTS` | Maximum login attempts before account lockout | `3` |
| `VITE_LOCKOUT_DURATION_MS` | Lockout duration in milliseconds after max attempts | `1800000` (30 min) |
| `VITE_TOKEN_EXPIRY_HOURS` | eSign token expiry in hours | `24` |
| `VITE_MAX_UNLOCK_ATTEMPTS_PER_DAY` | Maximum card unlock attempts per day | `3` |
| `VITE_MAX_RESEND_ATTEMPTS_PER_DAY` | Maximum PIN resend attempts per day | `3` |
| `VITE_API_BASE_URL` | Base URL for backend API (future integration) | `http://localhost:8080/api` |

Copy `.env.example` to `.env` for local development. The `.env` file is listed in `.gitignore` and will not be committed.

---

## Screen Flow

The application follows a sequential multi-step flow with authentication gates at each stage:

```
┌─────────────┐     ┌───────────┐     ┌──────────┐     ┌─────────────────┐
│   Welcome    │────▶│   Login   │────▶│  Verify  │────▶│ Validate Token  │
│   (Public)   │     │  (Public) │     │ (Auth)   │     │ (Auth+Verified) │
└─────────────┘     └───────────┘     └──────────┘     └─────────────────┘
                                                                │
                    ┌───────────────────────────────────────────┘
                    ▼
        ┌───────────────────┐     ┌──────────────────┐     ┌──────────────┐
        │ Account Selection │────▶│ Signer Management│────▶│   Confirm    │
        │  (Full Chain)     │     │  (Full Chain)    │     │  (Full Chain)│
        └───────────────────┘     └──────────────────┘     └──────────────┘
                                                                │
                    ┌───────────────────────────────────────────┘
                    ▼
            ┌──────────────┐     ┌──────────────────┐
            │    Review    │────▶│    Submission     │
            │ (Full Chain) │     │  (Full Chain)     │
            └──────────────┘     └──────────────────┘
```

| Path | Page | Auth Required |
|---|---|---|
| `/` | WelcomePage | No |
| `/login` | LoginPage | No |
| `/verify` | VerificationPage | Yes |
| `/validate-token` | TokenValidationPage | Yes + Verified |
| `/accounts` | AccountSelectionPage | Full chain |
| `/signers` | SignerManagementPage | Full chain |
| `/confirm` | ConfirmChangesPage | Full chain |
| `/review` | ReviewPage | Full chain |
| `/submit` | SubmissionPage | Full chain |
| `*` | NotFoundPage | No |

> **Full chain** = Authenticated + Identity Verified + eSign Token Validated.

---

## Accessibility

This application targets **WCAG 2.1 AA** compliance with the following implementations:

- **ARIA landmarks:** `banner`, `navigation`, `main`, `contentinfo` roles on layout regions
- **ARIA live regions:** `aria-live="polite"` and `aria-live="assertive"` for dynamic content updates
- **Screen reader text:** `.sr-only` class for status announcements invisible to sighted users
- **Focus management:** `focus-visible` outlines on all interactive elements; focus trapping in modals
- **Keyboard navigation:** Full keyboard support throughout — Enter/Space to activate, arrow keys to navigate lists and tabs, Escape to close modals
- **Form accessibility:** `aria-invalid`, `aria-required`, `aria-describedby` on form fields; `role="alert"` on error messages
- **Table accessibility:** `role="table"` with proper column headers and `aria-sort` on sortable columns
- **Progress indicator:** `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- **Modal dialogs:** `role="dialog"`, `aria-modal="true"`, focus trapping, Escape key close
- **Timer displays:** `role="timer"` on countdown elements (session timeout, lockout)
- **Color contrast:** All text meets 4.5:1 contrast ratio against backgrounds
- **Responsive design:** Fully functional from 320px to 1200px+ viewports

---

## Mock Data

The MVP uses mock data fixtures defined in `src/data/mockData.js` for all data operations. No real backend API calls are made.

### Mock Data Includes

- **1 controlling party user** with credentials and profile
- **2 eSign tokens** (1 valid, 1 expired)
- **4 business banking accounts** across checking and savings types
- **11 authorized signers** across accounts with Active, Pending, and Locked statuses
- **11 debit cards** with Active, Locked, Expired, Replaced, and Pending Activation statuses
- **Rate limit counter fixtures** (fresh, warning threshold, exhausted)
- **Audit log seed data** with sample events

### Helper Functions

The mock data module exports lookup functions for convenience:

- `getSignersByAccountId(accountId)` — signers for an account
- `getCardsBySignerId(signerId)` — cards for a signer
- `getCardsByAccountId(accountId)` — cards for an account
- `getSignerById(signerId)` — single signer by ID
- `getCardById(cardId)` — single card by ID
- `getAccountById(accountId)` — single account by ID
- `searchSigners(query)` — search signers by name, email, or SSN
- `searchCards(query)` — search cards by number or cardholder name

### Data Persistence

All mutable state is persisted in localStorage:

| Key | Purpose |
|---|---|
| `sig_auth_token` | Session token with TTL envelope |
| `sig_user` | Authenticated user profile |
| `sig_session_expiry` | Session expiry timestamp |
| `sig_login_attempts` | Failed login attempt counter |
| `sig_lockout_until` | Account lockout expiry timestamp |
| `sig_unlock_attempts` | Daily unlock attempt counter |
| `sig_resend_attempts` | Daily resend attempt counter |
| `scm_audit_log` | Immutable audit log (max 1,000 entries) |
| `scm_staged_additions` | Staged signer additions |
| `scm_staged_edits` | Staged signer edits |
| `scm_staged_removals` | Staged signer removals |
| `scm_submission_history` | Past submission records |
| `scm_welcome_content` | Welcome page content override |
| `scm_notification_history` | Notification stub history |

---

## Testing

The project uses **Vitest** with **jsdom** environment and **Testing Library** for component tests.

### Running Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with verbose output
npx vitest run --reporter=verbose
```

### Test Coverage

Test suites cover:

- **Services:** `authService`, `auditLogger`, `rateLimiter`, `signerService`, `tokenService`
- **Utilities:** `validators`, `maskingUtils`
- **Components:** `LoginForm`, `SignerList`, `WelcomePage`

### Test Conventions

- Test files are co-located with their source files (e.g., `LoginForm.test.jsx` next to `LoginForm.jsx`)
- Each test file uses `describe`/`it` blocks with descriptive names
- `localStorage.clear()` is called in `beforeEach` to ensure test isolation
- Mock data and context providers are used for component tests
- External services are mocked via `vi.mock()` where needed

---

## Deployment

The application is configured for deployment on **Vercel** with SPA rewrites. See [DEPLOYMENT.md](./DEPLOYMENT.md) for the complete deployment guide including:

- Vercel project configuration
- Environment variable setup per environment
- SPA routing configuration
- CI/CD automatic deployments
- Staging vs production environments
- Future backend integration steps
- Troubleshooting common issues

### Quick Deploy

1. Push to the `main` branch — Vercel auto-deploys to production.
2. Push to any other branch — Vercel creates a preview deployment.

---

## License

This project is private and proprietary. All rights reserved. Unauthorized copying, distribution, or modification of this software is strictly prohibited.