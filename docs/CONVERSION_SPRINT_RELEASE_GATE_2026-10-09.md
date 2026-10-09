# Conversion sprint — release and recovery gate (9 October 2026)

**Do not promote this branch to production until every blocking check is verified.**
This document is for operators; do not paste credentials, client information, or recovery keys into GitHub.

## Implemented

- Recruiter in-app follow-up reminders for uncontacted employer inquiries >2 hours old (bounded and idempotent; no SMS or employer email).
- Learner lesson progress persistence failure surfaced to the learner; course requirements are unchanged.
- Optional candidate profile opt-in for learners who completed a course, preserving the same Auth user ID and existing credentials.
- Local-only seeded acceptance and revision journeys. E2E seeding rejects non-loopback Supabase URLs. Tests assert one published linked role on proposal acceptance; revised proposals must never create a role.
- 19 existing uncontacted employer leads were given a lead-specific, urgent recruiter task in the production CRM. This is task creation, not customer communication or a completed sale.

## Blocker: off-site backup and real restore

1. In **GitHub > Settings > Secrets and variables > Actions**, store `SUPABASE_DB_URL` as a *session-mode PostgreSQL connection URI* for production. Obtain the URI in Supabase > Connect; do not publish it in a pull request. Verify connectivity and that the database user has permissions necessary to dump required data.
2. Store `BACKUP_ENCRYPTION_PASSPHRASE` as a high-entropy passphrase of at least 32 characters, generated and saved in an **independent recovery vault**. Losing it makes encrypted backup artifacts unrecoverable.
3. Under **GitHub > Actions > Encrypted production database backup**, trigger `workflow_dispatch` on the reviewed default branch.
4. The run must pass **Require backup secrets → Create encrypted production dump → Verify encrypted archive → Restore-test encrypted archive → Upload encrypted off-provider artifact**. Confirm an artifact exists and that the isolated restore logged success. A green workflow with a skipped restore is not acceptance.
5. Confirm the **Production backup health alert** reports healthy. Schedule a periodic recovery drill; GitHub Actions storage is not a substitute for independently managed long-term off-site retention.

## Blocker: bot protection on production employer and auth forms

1. Create a Cloudflare Turnstile widget restricted to `virtualassistant.com.ph` and `www.virtualassistant.com.ph`, following Cloudflare's dashboard instructions.
2. Add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` in the **Production** target of the existing Vercel project `virtualassistant-ph-webapp-v4.10.3`, without disclosing values.
3. Redeploy a verified commit so both variables are included in the runtime and client build.
4. Open `/hire`, `/auth/login` and account signup pages. Verify the widget renders and valid tokens succeed. Reject a missing token, wrong action, and a token from an untrusted hostname. If either key is missing, fail release. Avoid Cloudflare dummy keys on production.

## Pre-release checks

- GitHub CI, CodeQL, and **Browser and database contracts** must pass for the **same PR head SHA**, not an earlier successful run.
- Confirm the local E2E flow shows discovery workspace and proposal editor; accept a synthetic proposal and verify an accepted, published role with no duplicates, then log in as the synthetic client and open their role.
- Confirm a separate synthetic proposal requested for changes produces no recruiting role.
- Confirm recruiter/client permission boundaries, that no client sees private VA identity without explicit access authorization, and that no automatic match suggestion is released to clients without recruiter approval.
- Run browser smoke checks on a protected preview and real production **after** release; never seed production.
- For production, verify actual lead notification ownership, booking email, proposal email, client account acceptance, recruiter shortlist, interview scheduling, offer acceptance, and workroom activation with a consensual test account. Mark any untested stage explicitly unverified.

## Rollout and rollback

- Release only after successful backup **and** restore. Record commit SHA and live deployment ID.
- Observe production error events, lead-response queue, training engagement failures, and proposals for at least one operating cycle.
- If a regression blocks hiring or training, roll back the Vercel deployment and check database compatibility before reverting any schema changes.
- Never mark real leads contacted, qualified, won, or hired without the genuine underlying event.
