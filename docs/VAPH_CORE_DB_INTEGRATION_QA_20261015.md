# Isolated integration QA: #888 + #889 + #867

## Purpose
This **non-production** branch tests consent-based automatic job publishing (#888),
training activation and completion improvements (#889), and the employer conversion,
recruiter workflows, and hiring/placement journey (#867) together.

Original source heads:
- #888: `8230b2e88efc5d1e281cc83329146a17fa8e544d`
- #889: `d892a7122aec54b1f55606c789dff7a35b2fa9b1`
- #867: `b915bb2d8cbbff45cbc70d7d96c25a95c30cf5e4`

## Controlled reconciliation
The #867 diff contains 40 files. Of the overlapping training files, 22 are
byte-identical to #889. The only existing baseline conflict is
`scripts/seed-e2e-users.mjs`, which now uses #867's local-only recruiter,
client, VA, admin, separate training-access probe, and fictional hiring proposal
fixtures while preserving the current client's
`onboarding_completed_at` field. All fixture writes are limited to
loopback Supabase; **nothing is seeded in production**.

The #867 local bootstrap also mirrors the production authenticated SELECT
grants on client-owned jobs/commercial terms while preserving RLS. The branch
replays the local test schema and migrations on a disposable Supabase instance.

## Verification before feature release
- [ ] Verify full CI: unit, lint, typecheck, build
- [ ] Verify CodeQL
- [ ] Run dedicated local-only job/publication and hiring conversion scenarios
- [ ] Verify consented job publishing with and without required fields
- [ ] Verify roles/permissions for employer, VA, recruiter and admin
- [ ] Verify training reporting for an enrolled/unenrolled learner
- [ ] Verify synthetic paid-access rule enforcement and full fictional placement
- [ ] Verify no schema migration differences from main on this branch

## Release limitations
Local browser tests **do not** verify production Stripe/payment settlement,
real external email/calendar delivery, Vercel runtime, Turnstile or real
customer consent. Do not use a production database for fixtures, or deploy
this integration branch as the live site. Do not merge this integration PR.
When QA is complete, review original PRs separately.

Production release is blocked until encrypted production database backup and
isolated restore #864 are successful, main protection issue #895 is resolved,
and actual VAPH release configuration is verified.
