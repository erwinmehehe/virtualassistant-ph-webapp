# Authenticated production smoke QA

This workflow uses dedicated non-production identities against the production application. Never use an owner, employee, client, or real Virtual Assistant account.

## Dedicated identities

- `smoke-admin@virtualassistant.com.ph` -> Admin
- `smoke-recruiter@virtualassistant.com.ph` -> Recruiter
- `smoke-client@virtualassistant.com.ph` -> Client
- `smoke-va@virtualassistant.com.ph` -> primary VA login
- `smoke-va-2@virtualassistant.com.ph` -> hidden shortlist fixture
- `smoke-va-3@virtualassistant.com.ph` -> hidden shortlist fixture

The three VA fixtures must remain `directory_visible = false`. The QA role must be titled exactly `[SMOKE QA] Admin Support`, use `status = published` for authenticated client-flow testing, and `moderation_status = blocked` so it cannot appear on the public jobs marketplace.

## GitHub Actions configuration

Repository Actions secrets:

- `SMOKE_SUPABASE_URL`
- `SMOKE_SUPABASE_ANON_KEY` (legacy anon or current publishable key)
- `SMOKE_ADMIN_EMAIL`
- `SMOKE_ADMIN_PASSWORD`
- `SMOKE_RECRUITER_EMAIL`
- `SMOKE_RECRUITER_PASSWORD`
- `SMOKE_CLIENT_EMAIL`
- `SMOKE_CLIENT_PASSWORD`
- `SMOKE_VA_EMAIL`
- `SMOKE_VA_PASSWORD`

Repository Actions variable:

- `SMOKE_JOB_ID` -> UUID of the protected smoke QA role

Never add the Supabase service-role/secret key to the dashboard visual workflow.

## What the visual workflow verifies

For Admin, Recruiter, Client, and VA it authenticates and captures desktop, tablet, and mobile dashboards. It also captures every Account Center tab with a recruiter session.

When `SMOKE_JOB_ID` is configured, it additionally verifies the protected end-to-end hiring path:

1. open the exact recruiter Role Control Center;
2. select the three named smoke VAs;
3. preview the client shortlist;
4. reorder the shortlist to VA Three, VA One, VA Two;
5. send exactly three candidates to the smoke client;
6. verify the client sees the same order and no recruiter-only match scoring;
7. request an interview for Smoke VA Three;
8. verify the recruiter Role Control Center records that interview request.

The script refuses to run these mutations unless the target role H1 contains the exact smoke-role title.

## Public safety rule

Both the public jobs index and public job detail route require:

- `status = published`
- `moderation_status = clear`
- a linked client

This keeps the published-but-blocked smoke role and any other moderated role out of public discovery.
