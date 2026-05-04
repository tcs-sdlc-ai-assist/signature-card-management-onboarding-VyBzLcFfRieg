# Changelog

All notable changes to the SIG Card Management project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-10

### Added

#### Welcome & Onboarding
- Pre-login welcome page with informational content loaded from `contentService`
- Feature highlights showcasing portal capabilities (search, lock/unlock, activate, replace, resend PIN, security)
- "Get Started" CTA button navigating to the login flow
- Content override support via localStorage for admin editing without code changes

#### Authentication & Session Management
- Secure login form with floating label pattern (HB CSS framework)
- Generic error messaging on failed login — does not reveal which field is incorrect
- Configurable maximum login attempts (`VITE_MAX_LOGIN_ATTEMPTS`) before account lockout
- Configurable lockout duration (`VITE_LOCKOUT_DURATION_MS`) with countdown timer display
- Remaining attempts warning after each failed login
- Session persistence in localStorage with TTL-based expiry
- Configurable session timeout (`VITE_SESSION_TIMEOUT_MS`) with inactivity monitoring
- Session timeout warning modal with countdown timer and "Stay Logged In" / "Log Out" actions
- Automatic logout on session expiry with audit logging
- Activity event tracking (mouse, keyboard, scroll, touch) with debounced timer reset

#### Identity Verification (KBA/OTP Stub)
- Post-login identity verification step with two methods: OTP and KBA
- OTP method with "Send Code" action and 6-digit code input (mock valid code: `123456`)
- KBA method with three security questions (mother's maiden name, city of birth, high school mascot)
- Tab-based method selector for switching between OTP and KBA
- Attempt tracking with remaining attempts display and exhaustion handling
- Verification status persistence in localStorage with calendar-day reset

#### eSign Token Validation
- Token input form with inline validation (minimum 10 characters)
- Token validation against mock data with user association check
- Token expiry detection with appropriate error messaging
- Token status lifecycle: pending → confirmed (or expired/invalid)
- Daily rate-limited validation attempts (maximum 3 per day)
- Success state with "Proceed" button and error state with actionable guidance
- Token state reset on logout and session expiry

#### Account Selection
- Business banking account list with masked account numbers (`****XXXX` format)
- Account type badges (Business Checking, Business Savings, Business Money Market)
- Signer count display per account
- Auto-selection when only one account is available
- Keyboard navigation (Enter/Space to select, arrow keys to navigate)
- Pagination support for large account lists
- Protected route requiring full auth chain (authenticated + verified + token validated)

#### Signer Management
- Consolidated authorized signer list in table layout with sortable columns (Name, Role, Status)
- Status badges: Active (green), Pending (orange), Locked (red)
- Search filtering by name, email, or last four SSN
- Status dropdown filter (All, Active, Pending, Locked)
- Per-signer action buttons based on status:
  - **Edit** — available for all signers
  - **Remove** — available for all signers (with last-signer protection)
  - **Unlock** — available for locked signers only
  - **Resend Invitation** — available for pending signers only
- Add Signer form with required fields (First Name, Last Name, Title/Role, Email, Phone) and optional fields (Middle Name, Suffix, Additional Contact)
- Edit Signer form pre-populated with existing signer data and change detection
- Remove Signer confirmation modal with optional reason input and last-signer prevention
- Staged change tracking in localStorage (additions, edits, removals) with review-before-commit workflow

#### Self-Service Unlock (Rate-Limited)
- Unlock action for locked signers with confirmation modal
- Daily rate limit of 3 unlock attempts (`VITE_MAX_UNLOCK_ATTEMPTS_PER_DAY`)
- Attempt-based messaging: confirmation on attempt 1, warning on attempt 2, final warning on attempt 3
- "Contact support" guidance when all attempts are exhausted
- Visual attempt counter with dot indicators
- All unlock attempts logged via audit logger

#### Self-Service Resend Invitation (Rate-Limited)
- Resend invitation action for pending signers with confirmation modal
- New invitation token generation with previous token invalidation
- Daily rate limit of 3 resend attempts (`VITE_MAX_RESEND_ATTEMPTS_PER_DAY`)
- Attempt-based messaging: confirmation on attempt 1, warning on attempt 2, final warning on attempt 3
- "Contact support" guidance when all attempts are exhausted
- Visual attempt counter with dot indicators
- All resend attempts logged via audit logger

#### Change Confirmation & Final Review
- Staged changes summary with grouped display: additions, edits (with before/after comparison), removals
- Change count summary badges (Added, Edited, Removed, Total)
- Final review page with complete authorized signer list showing visual change indicators (New, Modified, Removed, Unchanged)
- Account details and controlling party identity display
- Legal consent/acknowledgment section with checkbox requirement
- Submit button disabled until legal consent is given
- Warning notices about submission finality

#### Submission & Confirmation
- Batch submission of all staged changes with confirmation ID generation (`CONF-XXXXXXXX` format)
- Submission confirmation page with confirmation ID, change summary, timestamp, and next steps
- Print/save confirmation support via browser print dialog
- Disabled submit button to prevent duplicate submissions
- Submission history persistence in localStorage for later retrieval via confirmation ID

#### Multi-Step Progress Navigation
- Step-based progress indicator with numbered circles, labels, and connector lines
- Step states: active (blue), completed (green with checkmark), disabled (gray)
- Sequential forward progression enforcement (no forward skipping)
- Backward navigation to any previously completed step
- Keyboard navigation between steps (arrow keys, Home, End, Enter/Space)
- ARIA progressbar semantics for accessibility

#### Error Handling & User Feedback
- React ErrorBoundary component catching unhandled rendering errors with fallback UI and retry button
- Reusable Alert component with four severity levels: critical/error, warning, success, info
- Inline form validation with real-time error messages on blur and change
- Loading spinners (small, medium, large) with screen reader announcements
- Unsaved changes exit confirmation modal with browser `beforeunload` interception
- Contextual error messages throughout all forms and actions

#### Audit Logging
- Centralized immutable audit log service with append-only localStorage persistence
- Supported event types: LOGIN, LOGOUT, VERIFICATION, TOKEN_VALIDATION, SIGNER_ADD, SIGNER_EDIT, SIGNER_REMOVE, SIGNER_UNLOCK, SIGNER_RESEND, SUBMISSION, SESSION_TIMEOUT, ERROR
- Automatic PII sanitization before persistence (email masking, phone masking, account number masking, password/token redaction)
- Unique event IDs (UUID v4) and ISO-8601 timestamps for every entry
- Maximum 1000 log entries with automatic oldest-entry trimming
- Before/after state tracking for edit operations

#### Notification Service (Stubbed)
- Confirmation email stub with console logging and audit trail
- Invitation email stub with console logging and audit trail
- PIN resend notification stub with console logging and audit trail
- Card action notification stub with console logging and audit trail
- Notification history persistence in localStorage

#### HB CSS Framework Integration
- Complete custom CSS framework with design tokens (colors, spacing, typography, shadows, transitions)
- Responsive grid system (12-column) with breakpoints at 320px, 640px, 1024px, 1200px
- Button styles: primary (`.button-primary`), secondary (`.button-secondary-2`), small (`.button-sm`), full-width (`.button-block`)
- Alert styles: critical, warning, success, info with icons
- Modal dialog with centered layout, focus trapping, and backdrop
- Floating label form inputs with validation error states
- Progress indicator with step circles, labels, and connectors
- Badge styles: success, error, warning, info
- Loading spinner animations (small, medium, large)
- Card component with elevation variants
- Utility classes for spacing, text, display, flex, and background
- Print styles hiding interactive elements
- CSS animations: fade-in, slide-up, spin, shake

#### WCAG 2.1 AA Accessibility
- Proper ARIA landmarks: banner, navigation, main, contentinfo
- ARIA live regions for dynamic content updates (polite and assertive)
- Screen reader-only text (`.sr-only`) for status announcements
- Focus-visible outlines on all interactive elements
- Keyboard navigation support throughout all components
- `aria-invalid`, `aria-required`, `aria-describedby` on form fields
- `aria-selected`, `aria-current` on list and tab selections
- `role="dialog"`, `aria-modal` on modal dialogs with focus trapping
- `role="alert"` on error messages for immediate screen reader announcement
- `role="progressbar"` with `aria-valuenow`/`aria-valuemin`/`aria-valuemax` on progress indicator
- `role="table"` with proper column headers and `aria-sort` on sortable columns
- `role="timer"` on countdown displays

#### Mock Data Fixtures
- Mock controlling party user credentials and profile
- Mock eSign tokens (valid and expired)
- 4 business banking accounts across checking and savings types
- 11 authorized signers across accounts with Active, Pending, and Locked statuses
- 11 debit cards with Active, Locked, Expired, Replaced, and Pending Activation statuses
- Rate limit counter fixtures (fresh, warning threshold, exhausted)
- Audit log seed data with sample events
- Helper lookup functions for signers, cards, and accounts by ID or association

#### Application Infrastructure
- React 18 with Vite 5 build tooling
- React Router v6 with `createBrowserRouter` and route-level page components
- Context providers: AuthContext, AccountContext, StepContext
- Custom hooks: `useFormValidation`, `useSessionTimeout`, `useRateLimitHook`
- Utility modules: validators, masking, date/time, storage abstraction, ID generation
- Environment variable configuration via `.env` with sensible defaults
- Vercel deployment configuration with SPA rewrites
- Vitest test framework with jsdom environment and Testing Library integration
- Comprehensive test suites for services, utilities, and components