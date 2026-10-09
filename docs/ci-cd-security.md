# LexiGuide AI — CI/CD Pipeline & Application Security Architecture

## 1. Overview & Objectives

LexiGuide AI operates under a **Zero-Secret CI, Deterministic Quality Gate, and Single Deployment Engine** architecture. 

The DevSecOps pipeline ensures:
- **Comprehensive Quality Assurance:** Strict linting, typechecking, 222+ unit/integration tests, and Playwright E2E with axe-core accessibility checks.
- **Layered Security Protections:** Client bundle scanning, Gitleaks git-history secret scanning, npm dependency vulnerability audits, and GitHub CodeQL static application security testing (SAST).
- **Single Source of Truth Deployment:** Vercel manages all preview and production deployments, triggered only after mandatory GitHub Actions gates pass.
- **Free-Tier Quota & Secret Protection:** Normal automated CI tests run against synthetic, mocked provider fixtures and **never** require or burn the user's live Groq API quota.

---

## 2. GitHub Actions Workflow Architecture

The repository defines three cohesive workflows under `.github/workflows/`:

```text
.github/
├── dependabot.yml              # Weekly automated updates for npm & GitHub Actions
└── workflows/
    ├── ci.yml                  # PR & Push continuous integration (Lint, Typecheck, Tests, Build, E2E)
    ├── security.yml            # Gitleaks secret scanner, npm audit, and CodeQL SAST analysis
    └── deployment-smoke.yml    # Operator-triggered post-deployment route & health verification
```

### A. CI & Quality Assurance (`.github/workflows/ci.yml`)
- **Triggers:**
  - `pull_request` targeting `main`
  - `push` to `main`
  - `workflow_dispatch` (manual execution)
- **Concurrency:** Cancels obsolete in-progress runs on active pull request branches (`cancel-in-progress: true`), while preserving runs on `main`.
- **Permissions:** Explicit least-privilege `contents: read`.
- **Jobs:**
  1. **`lint-and-typecheck`:** Executes ESLint 9 and TypeScript `tsc --noEmit` on Node.js 20 LTS.
  2. **`unit-and-integration-tests`:** Runs the full automated test suite (222+ tests) covering document ingestion, chunking, AI schemas, source/citation validation, rate limits, truncation recovery, session isolation, and Action Center workflows.
  3. **`build`:** Restores Next.js build cache (`.next/cache`), compiles the production bundle via Next.js Turbopack, runs `security:bundle-check` to guarantee no server-only secrets leaked to `.next/static`, and packages build artifacts for downstream E2E testing.
  4. **`e2e-and-accessibility`:** Downloads the production build artifact, caches Playwright browser binaries, and executes `npx playwright test` against the local production server, validating all critical user journeys and WCAG 2.2 AA axe-core compliance.

### B. Security & Compliance (`.github/workflows/security.yml`)
- **Triggers:**
  - `pull_request` targeting `main`
  - `push` to `main`
  - `schedule`: Weekly on Monday at 06:00 UTC
  - `workflow_dispatch`
- **Permissions:** `contents: read`, `security-events: write` (for SARIF upload).
- **Jobs:**
  1. **`secret-scan`:** Executes `gitleaks/gitleaks-action` across full git commit history using rules in `.gitleaks.toml`. Detects accidental exposure of `GROQ_API_KEY`, private keys, or API tokens.
  2. **`dependency-audit`:** Performs `npm audit`, generates programmatic JSON reports, and publishes findings into the GitHub Step Summary.
  3. **`codeql-analysis`:** Runs GitHub CodeQL SAST using the `security-extended` query suite for JavaScript and TypeScript.

### C. Deployment Smoke Verification (`.github/workflows/deployment-smoke.yml`)
- **Triggers:** `workflow_dispatch` with input `deployment_url`.
- **Purpose:** Allows operators to verify any preview or production deployment URL without invoking costly live AI calls.
- **Validates:**
  - GET `/` -> HTTP 200 OK
  - GET `/analyze` -> HTTP 200 OK
  - GET `/compare` -> HTTP 200 OK
  - GET `/qa` -> HTTP 200 OK
  - GET `/action-center` -> HTTP 200 OK

---

## 3. Secret Management & Bundle Protection Policy

1. **Server-Only Isolation:** Server-side secrets (such as `GROQ_API_KEY`) must **never** be prefixed with `NEXT_PUBLIC_`.
2. **Client Bundle Scanner:** The custom tool `scripts/verify-client-secrets.mjs` scans all assets in `.next/static/` during build time to ensure zero leakage of private keys or environment variables into client bundles.
3. **Synthetic Test Keys in CI:** Workflows provide synthetic dummy credentials (`mock_ci_test_key_for_deterministic_testing`) so unit and integration tests run deterministically without internet access or real API keys.
4. **Gitleaks Allowlist:** The `.gitleaks.toml` configuration explicitly defines allowlisted test fixtures and test filenames while strictly flagging actual leaked high-entropy secrets.

---

## 4. Vercel Deployment Strategy: One Source of Truth

To prevent competing deployment triggers or race conditions:
- **GitHub Actions:** Acts exclusively as the **CI and Security Gate**.
- **Vercel GitHub App:** Acts as the **Deployment Engine**.
  - Automatically provisions **Preview Deployments** on pull requests.
  - Deploys **Production** only after the PR is merged into `main`.
- **No Competing CLI Deployments:** GitHub Actions does not execute `vercel deploy` CLI commands, keeping Vercel's native Git integration as the single source of truth.

---

## 5. Recommended GitHub Branch Protection Settings

To enforce this pipeline on GitHub:
1. Navigate to **Repository Settings** → **Branches** → **Add branch protection rule**.
2. **Branch name pattern:** `main`
3. Check **Require a pull request before merging**:
   - Require approvals: `0` (for solo maintainers) or `1` (for teams)
   - Dismiss stale pull request approvals when new commits are pushed: `Checked`
4. Check **Require status checks to pass before merging**:
   - Require branches to be up to date before merging: `Checked`
   - **Required Status Checks:**
     - `Lint & Typecheck`
     - `Unit & Integration Tests`
     - `Production Build & Client Secret Check`
     - `Playwright E2E & Accessibility`
     - `Gitleaks Secret Scanner`
     - `Dependency Vulnerability Audit`
     - `CodeQL Static Security Analysis`
5. Check **Do not allow bypassing the above settings**.
6. Check **Restrict force pushes** and **Restrict deletions**.
