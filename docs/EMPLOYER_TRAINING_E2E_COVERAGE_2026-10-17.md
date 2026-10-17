# VAPH employer and training E2E coverage — 17 October 2026

Tracks [issue #916](https://github.com/erwinmehehe/virtualassistant-ph-webapp/issues/916). The old [PR #867](https://github.com/erwinmehehe/virtualassistant-ph-webapp/pull/867) must not be merged: its source and schema predate smaller released fixes (#911, #914, #915). The following maps its four legacy Playwright paths to the **current protected main**.

| Former test | Coverage before this PR | What this PR tests against current code |
| --- | --- | --- |
| `agency-proposal-to-recruiting.spec.ts` | Recruiter discovery triage and private job visibility existed, but public proposal acceptance and atomic client/job handoff were not exercised end-to-end. | Accept a fictional proposal through the UI; assert one accepted proposal, CRM won, existing client ownership, a linked role and commercial record, reload/idempotency, and client access. Separately request changes and assert no job creation. |
| `agency-shortlist-to-placement.spec.ts` | Route availability and role-level smoke existed. There was no connected release → interview → offer → hire Playwright journey. | Fictional vetted/available VA, candidate access guard, authorized shortlist release, interview request and decision, recruiter offer, VA terms acceptance, **required client consent**, accepted placement, exactly one workroom and hired application. |
| `training-account-activation.spec.ts` | Admin-only route and metrics helpers existed; current training transactional checks the wider admin training view. | Actual admin activation page renders first-week and overlap metrics; recruiter role is denied/redirected. |
| `admin-training-completion-health.spec.ts` | Existing training transactional suite covered some aggregated reports and client restrictions. | Regression for course-level and next-lesson bottleneck diagnostics, no learner identities, and client isolation. |

## Fixture and isolation policy

- The **ordinary** isolated identity seeder remains unchanged. Only the existing **Browser and database contracts** workflow invokes `scripts/seed-e2e-hiring-fixtures.mjs` immediately afterward.
- Fixture writer requires **both** a loopback HTTP app URL and a loopback HTTP Supabase URL; fails closed without a service-role key. It cannot seed a remote Preview or Production project.
- Six independent fictional lead/proposal pairs avoid job-title collisions on retry. All email addresses use `example.test`. Synthetic VA profile, vetting, availability and lead records exist only in the disposable local database.
- Synthetic candidate-access settlement is a **local manual payment row** used to exercise downstream app checks; it is **not** a payment-provider/webhook acceptance test and moves no money.
- Calendar/Google Meet provider exchange is represented by a **local-only, already-ended meeting fixture** before invoking the real in-app client decision. It is not a verified Calendar API integration.
- No test sends live proposal emails, publishes real employer data, creates a paid staging branch or copies customer data. Private fixture tokens are ignored by Git.
- Exact-head CI, CodeQL, all-role smoke and browser/database contract workflows remain required before release. **Do not call these scenarios independently accepted until their Playwright results are green.**

## Independent UAT that remains

After isolated automation passes, a human operator must still complete a real, consenting employer pilot end-to-end: brief intake, recruiter qualification, shortlist preparation, employer interview, verified fee handling, mutually accepted terms and workroom. Observe client/VA mobile experiences and external Calendar/payment integration separately. Do not use fictional production leads or assert that a simulated payment demonstrates real settlement.
