# Authenticated production smoke QA

The production QA flow uses dedicated non-production identities and a single protected QA role. It does not store smoke passwords or Supabase admin credentials in GitHub.

## Dedicated identities

The server-side bootstrap route creates or repairs these users when an approved GitHub Actions workflow runs on `main`:

- `smoke-admin@virtualassistant.com.ph` -> Admin
- `smoke-recruiter@virtualassistant.com.ph` -> Recruiter
- `smoke-client@virtualassistant.com.ph` -> Client
- `smoke-va@virtualassistant.com.ph` -> primary VA login
- `smoke-va-2@virtualassistant.com.ph` -> hidden shortlist fixture
- `smoke-va-3@virtualassistant.com.ph` -> hidden shortlist fixture

The accounts are passwordless. Each workflow run receives fresh one-time magic-link token hashes and exchanges them for short-lived Supabase sessions.

## Authentication boundary

`/api/internal/github-smoke-auth` accepts only a valid GitHub Actions OIDC token with all of these properties:

- audience `virtualassistant-smoke`
- repository `erwinmehehe/virtualassistant-ph-webapp`
- ref `refs/heads/main`
- workflow is either `dashboard-visual.yml` or `authenticated-production-smoke.yml`
- event is `push` or `workflow_dispatch`

The endpoint uses the existing server-only Supabase admin client. The service-role key never leaves Vercel and is never written to GitHub Actions.

## Protected fixture

The QA role has the fixed ID `00000000-0000-4000-8000-000000000240` and title `[SMOKE QA] Admin Support`.

It is deliberately:

- `status = published` so the authenticated client handoff can exercise production logic
- `moderation_status = blocked` so it cannot appear in the public jobs marketplace
- linked only to the smoke Client and smoke Recruiter
- reset before each workflow run
- paired only with the three smoke VA fixtures

All three smoke VAs remain `directory_visible = false`.

## What the visual workflow verifies

For Admin, Recruiter, Client, and VA it authenticates and captures desktop, tablet, and mobile dashboards. It also captures every Account Center tab with a recruiter session.

The protected end-to-end hiring path then:

1. opens the exact recruiter Role Control Center;
2. selects the three named smoke VAs;
3. previews the client shortlist;
4. reorders the shortlist to VA Three, VA One, VA Two;
5. sends exactly three candidates to the smoke client;
6. verifies the client sees the same order and no recruiter-only match scoring;
7. requests an interview for Smoke VA Three;
8. verifies the recruiter Role Control Center records that interview request.

The browser script refuses to perform mutations unless the target role H1 contains the exact smoke-role title.

## Public safety rule

Both the public jobs index and public job detail route require:

- `status = published`
- `moderation_status = clear`
- a linked client

This keeps the published-but-blocked smoke role and any other moderated role out of public discovery.
