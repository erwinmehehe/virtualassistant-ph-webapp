# Playwright all-role smoke suite (VAPH)

## Safety and scope

This suite uses only a locally bootstrapped Supabase database and the local Next.js server. It refuses remote database URLs and remote app URLs. The E2E seeder now also fails closed unless the Supabase URL is loopback-only.

Core application account roles: admin, recruiter, client, virtual assistant (VA). Additional surfaces are a shared learner workspace (tested with the local VA account), shared Client Success workspace (tested as a recruiter), and an anonymous visitor. Client Success and learner are not separate roles in the profiles table.

No real jobs, payments, emails, messages, candidate data, approvals, grades, or certificates are intentionally submitted by this smoke suite. Sign-in and page reads can still touch isolated local session/activity fields. Admin is seeded only into the local test database.

## Browser coverage

- Desktop viewport: 1440 x 900.
- Mobile viewport: 390 x 844.
- Public: homepage, hire, jobs, training, contact, booking, login, VA signup.
- Client: dashboard, jobs, new-job page, company, messages, payments.
- VA: dashboard, profile, jobs, applications, vetting, work readiness.
- Recruiter: Today, roles, talent, CRM, discovery, messages.
- Admin: Today, leads, users, jobs, training, funnel.
- Learner: signed-in training overview, Foundations course, training account.
- Client Success: placements, support, retention.
- One click-through navigation per persona/viewport, plus anonymous access denial and cross-role admin access denial.

## Failures detected

- Unexpected HTTP response or redirect, failed login, blank page or missing/duplicate visible H1.
- JavaScript exceptions, browser console errors, local HTTP 5xx responses, error overlays and crash text.
- Mobile/desktop horizontal overflow or primary heading clipped outside the viewport.
- Visible broken images, missing image alt text, and unlabeled visible form controls.
- A primary navigation link that cannot be clicked or does not reach its expected destination.

This is a functional and heuristic visual smoke check. It does not claim pixel-perfect visual-diff testing, a full accessibility audit, exhaustive forms/transactions testing, or every dynamic detail route. Review screenshots for color, spacing, overlap, typography, sticky navigation and other faults not reliably detected by DOM checks.

## Run locally against an isolated database

1. Install dependencies: npm ci.
2. Start local Supabase and replay the baseline/migrations with: bash scripts/bootstrap-e2e-local-supabase.sh.
3. Export local environment from .supabase-e2e.env to NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY and LOCAL_SUPABASE_DB_URL as the existing Browser and database contracts workflow does.
4. Seed local role accounts: node scripts/seed-e2e-users.mjs.
5. Install Chromium: npx playwright install --with-deps chromium.
6. Run: npm run smoke:roles. This uses playwright.config.ts to launch a local Next.js server when needed.

The smoke suite explicitly requires loopback HTTP for E2E_BASE_URL (defaults to http://127.0.0.1:3000) and NEXT_PUBLIC_SUPABASE_URL. It will not use a deployed URL, even with a test login. No production account provisioning or bypass endpoints are included.

## CI evidence

The existing .github/workflows/browser-db-contracts.yml executes every e2e spec against freshly bootstrapped local Supabase, including the new role smoke suite, on each pull request. It uploads the directory artifacts/all-roles-smoke even if tests fail, retaining screenshots and sanitized per-role findings for 14 days.

Artifact layout: artifacts/all-roles-smoke/<persona>/<desktop|mobile>/<route>.png and report.json. The report intentionally records paths (not query strings), short redacted error messages, viewport and findings. It does not store auth session JSON, cookies, storage state or network traces.

Run the suite again after any code or UI fix. If a route fails, inspect the matching screenshot and report.json first, fix the cause, and rerun the failed persona/viewport before the complete suite.

## Release gate

Passing isolated role smoke tests is necessary but not sufficient for production release. VAPH production backup incident #864 and its real encrypted dump plus isolated restore remain independent blockers, as do owner-controlled Vercel configuration and protected production rollout checks. Do not use local role smoke results to waive the production backup requirement.
