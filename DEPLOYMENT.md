# Deployment Guide

## SIG Card Management — Deployment Documentation

This guide covers deploying the SIG Card Management application to Vercel, configuring environment variables, SPA routing, CI/CD workflows, and troubleshooting common deployment issues.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Build Configuration](#build-configuration)
3. [Vercel Deployment](#vercel-deployment)
4. [Environment Variables](#environment-variables)
5. [SPA Routing Configuration](#spa-routing-configuration)
6. [CI/CD — Automatic Deployments](#cicd--automatic-deployments)
7. [Staging vs Production Environments](#staging-vs-production-environments)
8. [Future Backend Integration](#future-backend-integration)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x (or equivalent package manager)
- A **GitHub** (or GitLab / Bitbucket) repository containing the project source
- A **Vercel** account linked to your Git provider

---

## Build Configuration

### Build Command

```bash
npm run build
```

This runs `vite build`, which compiles the React application into optimized static assets.

### Output Directory

```
dist/
```

Vite outputs all production-ready files (HTML, JS, CSS, assets) into the `dist/` directory at the project root.

### Preview Locally

To preview the production build locally before deploying:

```bash
npm run build
npm run preview
```

The preview server starts on the port configured in `vite.config.js` (default: `http://localhost:4173`).

### Development Server

```bash
npm run dev
```

Starts the Vite development server on `http://localhost:3000` (configured in `vite.config.js`).

### Run Tests

```bash
npm run test
```

Runs the full Vitest test suite. All tests must pass before deploying.

---

## Vercel Deployment

### Step 1 — Connect Repository

1. Log in to [vercel.com](https://vercel.com) and click **Add New Project**.
2. Select your Git provider (GitHub, GitLab, or Bitbucket).
3. Authorize Vercel to access your repositories if prompted.
4. Find and select the `sig-card-mgmt` repository.
5. Click **Import**.

### Step 2 — Configure Build Settings

On the project configuration screen, set the following:

| Setting              | Value          |
|----------------------|----------------|
| **Framework Preset** | Vite           |
| **Build Command**    | `npm run build`|
| **Output Directory** | `dist`         |
| **Install Command**  | `npm install`  |
| **Node.js Version**  | 18.x           |

> **Note:** Vercel auto-detects Vite projects in most cases. Verify the settings match the table above before proceeding.

### Step 3 — Configure Environment Variables

Add all required environment variables in the Vercel dashboard under **Settings → Environment Variables**. See the [Environment Variables](#environment-variables) section below for the full list.

### Step 4 — Deploy

Click **Deploy**. Vercel will:

1. Clone the repository
2. Install dependencies (`npm install`)
3. Run the build command (`npm run build`)
4. Deploy the contents of `dist/` to the Vercel CDN

The deployment URL will be displayed upon completion (e.g., `https://sig-card-mgmt.vercel.app`).

---

## Environment Variables

All client-side environment variables **must** be prefixed with `VITE_` to be exposed to the Vite build process. Variables without the `VITE_` prefix are not included in the client bundle.

### Required Variables

| Variable                          | Description                                              | Default Value                  |
|-----------------------------------|----------------------------------------------------------|--------------------------------|
| `VITE_SESSION_TIMEOUT_MS`         | Session timeout in milliseconds                          | `1800000` (30 minutes)         |
| `VITE_MAX_LOGIN_ATTEMPTS`         | Maximum login attempts before account lockout            | `3`                            |
| `VITE_LOCKOUT_DURATION_MS`        | Lockout duration in milliseconds after max attempts      | `1800000` (30 minutes)         |
| `VITE_TOKEN_EXPIRY_HOURS`         | eSign token expiry in hours                              | `24`                           |
| `VITE_MAX_UNLOCK_ATTEMPTS_PER_DAY`| Maximum card unlock attempts per day                     | `3`                            |
| `VITE_MAX_RESEND_ATTEMPTS_PER_DAY`| Maximum PIN resend attempts per day                      | `3`                            |
| `VITE_API_BASE_URL`               | Base URL for backend API (future backend integration)    | `http://localhost:8080/api`    |

### Setting Variables in Vercel

1. Navigate to your project in the Vercel dashboard.
2. Go to **Settings → Environment Variables**.
3. For each variable, enter the **Name** and **Value**.
4. Select the target environments: **Production**, **Preview**, and/or **Development**.
5. Click **Save**.

> **Important:** After adding or changing environment variables, you must trigger a new deployment for the changes to take effect. Vercel does not hot-reload environment variables into existing deployments.

### Local Development

For local development, copy the example environment file and customize values:

```bash
cp .env.example .env
```

Edit `.env` with your local configuration. The `.env` file is listed in `.gitignore` and will not be committed to the repository.

### Environment Variable Precedence

Vite resolves environment variables in the following order (highest priority first):

1. `.env.local` — always loaded, always ignored by Git
2. `.env.[mode].local` — e.g., `.env.development.local`
3. `.env.[mode]` — e.g., `.env.production`
4. `.env` — loaded in all cases

In Vercel deployments, variables set in the Vercel dashboard override all `.env` files.

---

## SPA Routing Configuration

The application uses React Router with `createBrowserRouter` for client-side routing. All routes are defined in `src/router.jsx`. Because this is a single-page application (SPA), the server must rewrite all non-asset requests to `index.html` so that React Router can handle the routing.

### Vercel Rewrites

The `vercel.json` file at the project root configures SPA rewrites:

```json
{
  "rewrites": [
    {
      "source": "/((?!assets/).*)",
      "destination": "/index.html"
    }
  ]
}
```

This rule ensures:

- Requests to static assets in the `/assets/` directory are served directly (JS, CSS, images, fonts).
- All other requests (e.g., `/login`, `/accounts`, `/signers`) are rewritten to `/index.html`, allowing React Router to handle the route.

### Application Routes

| Path               | Page Component              | Auth Required |
|--------------------|-----------------------------|---------------|
| `/`                | WelcomePage                 | No            |
| `/login`           | LoginPage                   | No            |
| `/verify`          | VerificationPage            | Yes           |
| `/validate-token`  | TokenValidationPage         | Yes + Verified|
| `/accounts`        | AccountSelectionPage        | Full chain    |
| `/signers`         | SignerManagementPage        | Full chain    |
| `/confirm`         | ConfirmChangesPage          | Full chain    |
| `/review`          | ReviewPage                  | Full chain    |
| `/submit`          | SubmissionPage              | Full chain    |
| `*`                | NotFoundPage                | No            |

> **Full chain** = Authenticated + Identity Verified + eSign Token Validated.

---

## CI/CD — Automatic Deployments

### Auto-Deploy on Push to Main

When the repository is connected to Vercel, every push to the `main` branch automatically triggers a production deployment. No additional CI/CD configuration is required for this default behavior.

### Preview Deployments

Every push to a non-production branch (e.g., feature branches, pull requests) triggers a **Preview Deployment** on Vercel. Each preview deployment receives a unique URL for testing and review.

### Recommended Workflow

1. **Feature development** — Create a feature branch from `main`.
2. **Push to branch** — Vercel creates a preview deployment automatically.
3. **Pull request** — Review the preview deployment URL in the PR.
4. **Merge to main** — Vercel deploys to production automatically.

### Pre-Deployment Checks

Before merging to `main`, ensure:

```bash
# Run the full test suite
npm run test

# Run the linter
npm run lint

# Verify the production build succeeds
npm run build
```

### GitHub Actions (Optional)

If you want to enforce test and lint checks before deployment, add a GitHub Actions workflow:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

> **Note:** This workflow runs independently of Vercel deployments. Vercel will still deploy on push to `main` regardless of CI status unless you configure Vercel to require passing checks.

---

## Staging vs Production Environments

### Environment Separation

Use Vercel's environment variable scoping to maintain separate configurations for staging and production:

| Variable                   | Production                          | Staging / Preview                   |
|----------------------------|-------------------------------------|-------------------------------------|
| `VITE_SESSION_TIMEOUT_MS`  | `1800000` (30 min)                  | `900000` (15 min)                   |
| `VITE_MAX_LOGIN_ATTEMPTS`  | `3`                                 | `5`                                 |
| `VITE_LOCKOUT_DURATION_MS` | `1800000` (30 min)                  | `300000` (5 min)                    |
| `VITE_API_BASE_URL`        | `https://api.sigbank.example.com`   | `https://api-staging.sigbank.example.com` |

### Configuring Per-Environment Variables in Vercel

1. Navigate to **Settings → Environment Variables**.
2. When adding a variable, select the target environment:
   - **Production** — applied only to production deployments (pushes to `main`).
   - **Preview** — applied to all preview deployments (branches, PRs).
   - **Development** — applied when using `vercel dev` locally.
3. Add the same variable name with different values for each environment.

### Custom Domains

- **Production:** Assign a custom domain (e.g., `cards.sigbank.example.com`) under **Settings → Domains**.
- **Staging:** Use the default Vercel preview URLs or assign a staging subdomain (e.g., `cards-staging.sigbank.example.com`).

### Branch-Based Deployments

Vercel supports branch-based deployment targets:

- `main` → Production
- `staging` → Preview (can be assigned a custom domain for a persistent staging URL)
- Feature branches → Ephemeral preview deployments

---

## Future Backend Integration

The current MVP uses mock data fixtures (`src/data/mockData.js`) and localStorage for all data persistence. The application is designed for seamless migration to a real backend API.

### API Base URL

The `VITE_API_BASE_URL` environment variable defines the backend API endpoint. All service modules (`src/services/`) are structured to replace mock data calls with HTTP requests to this base URL.

### API Endpoint Mapping

The `src/constants/constants.js` file defines the planned API endpoint paths:

| Constant                    | Path                      | Method  |
|-----------------------------|---------------------------|---------|
| `API_ENDPOINTS.LOGIN`       | `/auth/login`             | POST    |
| `API_ENDPOINTS.LOGOUT`      | `/auth/logout`            | POST    |
| `API_ENDPOINTS.REFRESH_TOKEN`| `/auth/refresh`          | POST    |
| `API_ENDPOINTS.CARDS`       | `/cards`                  | GET     |
| `API_ENDPOINTS.CARD_DETAIL` | `/cards/:id`              | GET     |
| `API_ENDPOINTS.CARD_LOCK`   | `/cards/:id/lock`         | POST    |
| `API_ENDPOINTS.CARD_UNLOCK` | `/cards/:id/unlock`       | POST    |
| `API_ENDPOINTS.CARD_ACTIVATE`| `/cards/:id/activate`    | POST    |
| `API_ENDPOINTS.CARD_REPLACE`| `/cards/:id/replace`      | POST    |
| `API_ENDPOINTS.PIN_RESEND`  | `/cards/:id/pin/resend`   | POST    |
| `API_ENDPOINTS.SIGNERS`     | `/signers`                | GET     |
| `API_ENDPOINTS.SIGNER_DETAIL`| `/signers/:id`           | GET     |

### Migration Steps

1. **Set `VITE_API_BASE_URL`** to the real backend URL in the Vercel environment variables.
2. **Replace mock data calls** in each service module (`authService.js`, `signerService.js`, `accountService.js`, `tokenService.js`, `verificationService.js`) with `fetch` or an HTTP client calling `${API_BASE_URL}${endpoint}`.
3. **Update error handling** to process HTTP status codes and backend error response formats.
4. **Remove localStorage persistence** for data that will be managed by the backend (session tokens should use `httpOnly` cookies set by the backend).
5. **Keep audit logging** — the audit logger can be updated to POST events to a backend audit endpoint while retaining the localStorage fallback for offline resilience.

### CORS Configuration

When the frontend and backend are on different domains, the backend must include appropriate CORS headers:

```
Access-Control-Allow-Origin: https://cards.sigbank.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

---

## Troubleshooting

### Build Fails with "Module not found"

**Cause:** A missing dependency or incorrect import path.

**Solution:**
1. Verify all dependencies are listed in `package.json`.
2. Run `npm install` to ensure all packages are installed.
3. Check import paths for case sensitivity — Vercel runs on Linux where file paths are case-sensitive, unlike macOS.

```bash
# Example: This will fail on Linux if the file is named "AuthContext.jsx"
import { useAuth } from './context/authContext.jsx'; // Wrong case
import { useAuth } from './context/AuthContext.jsx'; // Correct
```

### Blank Page After Deployment

**Cause:** SPA routing is not configured, or the `vercel.json` rewrites are missing.

**Solution:**
1. Verify `vercel.json` exists at the project root with the correct rewrite rules.
2. Ensure the output directory is set to `dist` in Vercel project settings.
3. Open the browser developer console and check for 404 errors on JavaScript files.

### Environment Variables Not Available

**Cause:** Variables are not prefixed with `VITE_` or were added after the last deployment.

**Solution:**
1. Verify all client-side variables start with `VITE_`.
2. Trigger a new deployment after adding or changing variables (Vercel dashboard → **Deployments** → **Redeploy**).
3. In local development, ensure the `.env` file is in the project root (not inside `src/`).

### 404 on Direct URL Access

**Cause:** The server is not rewriting requests to `index.html` for client-side routes.

**Solution:**
1. Verify `vercel.json` contains the SPA rewrite rule.
2. If using a different hosting provider, configure equivalent rewrite rules:
   - **Nginx:** `try_files $uri $uri/ /index.html;`
   - **Apache:** Use `FallbackResource /index.html` or a `.htaccess` rewrite rule.
   - **Netlify:** Add `/* /index.html 200` to a `_redirects` file in the `public/` directory.

### Session Timeout Issues

**Cause:** `VITE_SESSION_TIMEOUT_MS` is set too low or the session timeout hook is not resetting on activity.

**Solution:**
1. Check the `VITE_SESSION_TIMEOUT_MS` value in the environment variables. The default is `1800000` (30 minutes).
2. Verify the `useSessionTimeout` hook is active — it listens for `mousedown`, `keydown`, `scroll`, `touchstart`, and `mousemove` events.
3. In development, set a longer timeout to avoid frequent logouts:
   ```
   VITE_SESSION_TIMEOUT_MS=3600000
   ```

### localStorage Quota Exceeded

**Cause:** The audit log or staged changes have grown too large for the browser's localStorage limit (typically 5–10 MB).

**Solution:**
1. The audit logger automatically trims entries beyond 1,000 records. If the issue persists, clear the audit log:
   ```javascript
   // In the browser console
   localStorage.removeItem('scm_audit_log');
   ```
2. Clear all application data:
   ```javascript
   localStorage.clear();
   ```
3. For production, plan migration of audit logs to a backend persistence layer.

### Tests Fail in CI but Pass Locally

**Cause:** Environment differences between local machine and CI runner (timezone, Node.js version, OS).

**Solution:**
1. Ensure the CI runner uses the same Node.js version as local development (18.x).
2. Calendar-day-based rate limit tests may fail around midnight UTC. The test suite uses `localStorage.clear()` in `beforeEach` to mitigate this.
3. Run tests with the `--reporter=verbose` flag for detailed output:
   ```bash
   npx vitest run --reporter=verbose
   ```

### Vercel Build Timeout

**Cause:** The build process exceeds Vercel's default timeout (typically 45 minutes for the free tier).

**Solution:**
1. The SIG Card Management build should complete in under 60 seconds. If it times out, check for infinite loops in build plugins or excessively large dependencies.
2. Verify `node_modules/` is not committed to the repository (it should be in `.gitignore`).
3. Clear the Vercel build cache: **Settings → General → Build Cache → Clear**.

### Security Headers

For production deployments, consider adding security headers via `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "no-referrer" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/((?!assets/).*)",
      "destination": "/index.html"
    }
  ]
}
```

> **Note:** The `index.html` file already includes `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy` meta tags. Server-level headers provide an additional layer of enforcement.

---

## Quick Reference

| Task                        | Command / Action                                    |
|-----------------------------|-----------------------------------------------------|
| Install dependencies        | `npm install`                                       |
| Start dev server            | `npm run dev`                                       |
| Run tests                   | `npm run test`                                      |
| Run tests in watch mode     | `npm run test:watch`                                |
| Lint code                   | `npm run lint`                                      |
| Build for production        | `npm run build`                                     |
| Preview production build    | `npm run preview`                                   |
| Deploy to Vercel            | Push to `main` branch (auto-deploy)                 |
| Trigger manual redeploy     | Vercel dashboard → Deployments → Redeploy           |
| Clear Vercel build cache    | Vercel dashboard → Settings → General → Clear Cache |