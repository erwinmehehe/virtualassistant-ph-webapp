# Agency release readiness
Reviewed 2026-10-03 (Asia/Manila) against production runtime release `137447aa5357cc847d1ac9b08de0c2be4e2b1515`, the connected production Supabase project, Resend delivery/webhook telemetry, and the runtime checks recorded below.
Decision: HOLD final launch sign-off. Core database acceptance for both service models, live intake, primary auth and hiring email delivery, Google Meet booking, scheduler operation, daily maintenance/reminder execution, public proposal rendering, Resend webhook verification, and current-release error health are verified. Hard blockers now include recoverable off-site database backup on the Supabase Free plan and missing Cloudflare Turnstile protection on the production hiring form; browser Auth/workspace handoff, the rest of the proposal response lifecycle, Trigger.dev runtime evidence, final privacy/regression QA, and monitoring ownership also remain open.

## 2026-10-02 production refresh
- Production Vercel deployment `dpl_HjUZfp2ArGZC8vJx4wiW4zwqACkH` is READY for main SHA `634618ff1167f798c06ba4d13b0b80004d3ec013` and is aliased to `virtualassistant.com.ph` and `www.virtualassistant.com.ph`.
- The immediately previous READY production deployment `dpl_3JzTir6NYJxF3TTzYEqMviLpXn6d`, SHA `8a650d256fae343e17ef7b9989a46f44514ba91c`, is recorded by Vercel as a rollback candidate.
- Post-merge GitHub CI and CodeQL both passed for `634618ff1167f798c06ba4d13b0b80004d3ec013`.
- Production-domain smoke checks returned HTTP 200 with the expected title, canonical, and Open Graph metadata for the six software pages released in PR #759. The legacy Buildxact software URL resolved to the clean canonical.
- The production Supabase project reports ACTIVE_HEALTHY on Postgres 17.
- Production migration history contains v4144 through v4151 and now extends through `20261002051514 lock_training_notification_content`.
- `lead_proposals`, `recruiter_activity`, `recruiter_notes`, and `workflow_reminders` all have RLS enabled.
- `lead_proposals` has no direct `anon` or `authenticated` table grants and retains the deny-browser policy for those roles.
- Public VA/company/review/certification views retain both `security_invoker=true` and `security_barrier=true`.
- Proposal and workflow-reminder constraints include the current `changes_requested`, `lead`, `proposal`, `va`, `interview`, and `offer` states/types.
- The `offered` application stage exists.
- Accepted active roles missing paid/comped candidate access: 0.
- Accepted proposals missing a linked role or accepted commercials: 0.
- Production currently has 0 proposal rows, so these consistency counts do not replace a real accepted-proposal runtime test.
- Supabase Security Advisor currently reports one warning: leaked-password protection is disabled. This is a plan-level Auth protection and is recorded as a known limitation rather than silently treated as green.
- The read-only release preflight now returns one JSON document so API/MCP clients preserve every check instead of only the final SELECT result.

## 2026-10-03 production hiring-loop verification
- Production release `038f318838727e4a6f8abbb01346e0a93e2c16f1` is READY on Vercel deployment `dpl_HYMbthfBsQK3o7LPcgSMEAA6oo82` and serves both production aliases. Post-merge CI and CodeQL passed.
- The active release has 0 unresolved app errors tagged to its SHA, and Vercel reported no runtime error groups in the post-deploy observation window. Historical unresolved incidents remain visible but no longer block a clean release.
- The production Resend sending domain is verified with sending enabled. For October 2 UTC, Resend reports 29 sent, 29 delivered, 0 failed, 0 bounced, and 0 complained.
- VAPH account confirmation uses Supabase secure token generation plus the branded Resend delivery path, not Supabase's default signup email sender. A recent 100-email sample contained 41 delivered account-confirmation messages, alongside delivered hiring acknowledgements, internal lead notifications, discovery messages, and shortlist mail.
- Since the client-acknowledgement migration, production has received 3 `client_hiring` enquiries. All 3 were acknowledged, assigned to an owner, had a timezone, and had a concrete next state: 2 reached won/lost and 1 reached discovery scheduling.
- Since timezone enforcement, the current discovery sample has 1 Google Meet booking and it has all four required pieces: timezone, Calendar event ID, meeting URL, and `google_meet` provider state.
- The `discovery-reminder-sweep` scheduler is active every 15 minutes and the lead-response SLA job is active every 5 minutes. Relevant cron jobs had 0 failures in the checked seven-day window.
- Production rollback-only QA now exercises both `curated_placement` and `managed_service` through the real `accept_lead_proposal_atomic` function. Both produce the expected won lead, published recruiting role, accepted commercials, comped candidate access, recruiter activity, and lead-won analytics. The published-role trigger advances the effective hiring stage to `sourcing`.
- Repeat acceptance returns `already_accepted` without duplicate hiring state. An invalid client identity returns `client_identity_invalid` and leaves no acceptance-caused job, commercials, access, proposal, or lead handoff mutations. The earlier production expiry check returned `proposal_expired` without creating a job.
- The reusable `scripts/agency-production-runtime-qa.sql` now covers both service models, idempotent retry, invalid-client failure, audit/analytics, and rollback cleanup. It was executed successfully against production after the update.
- Public proposal rendering and expiry behavior were separately production-tested by the existing October 3 QA pass. Browser-level authenticated recruiter/client actions remain outside the connected runtime used for this verification.
- The Supabase organization is on the Free plan. Current Supabase backup guidance does not provide managed daily backup recovery for Free projects and recommends regular off-site `db dump` exports. No recoverable off-site dump or restore rehearsal is currently recorded.
- The earlier October 3 operations pass also retired the original demo workroom and closed its 10 stale check-in notifications without modifying a real client workroom.
- All synthetic acceptance-smoke records were transactionally rolled back. A residue check found 0 synthetic leads, jobs, or proposals after testing.
- A live production fetch of `/hire` returned HTTP 200 with the expected hiring form and timezone field, but no Turnstile widget or Cloudflare challenge script. The component only omits the widget when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is absent, so bot protection is currently not configured on the public hiring form. The admin health gate now treats Turnstile as a launch blocker until both site and server keys are present.
- Admin production health now applies the same strict runtime controls as the CLI preflight for Google Calendar/Meet, Turnstile, Resend webhook verification, and Trigger.dev signed automations, preventing a partially configured environment from appearing release-clear.
- Production privacy QA checked 11 client Hiring Room summaries: 0 foreign jobs were exposed, 0 non-released candidates were exposed, and 0 profile rows appeared without a released candidate. `anon` and `authenticated` cannot execute the server-only Hiring Room RPC or directly select the shortlist table.
- The acceptance runtime QA was re-run against the current production schema on October 3. Curated placement, managed service, lead conversion, published recruiting role, accepted commercials, comped candidate access, audit/analytics, idempotent retry, and invalid-client blocking all passed again; the rollback residue check remained 0 synthetic leads, jobs, and proposals.
- Resend has one enabled production webhook targeting `/api/webhooks/resend`. The latest 50 webhook deliveries were all `success`. Because the endpoint returns 503 when `RESEND_WEBHOOK_SECRET` is absent and rejects invalid Svix signatures, successful callbacks confirm the signing secret is active in production. The app's last-24-hour email-event aggregate had 56 events with 31 delivered and 0 failed, bounced, or complained.
- Production data records maintenance-only actions at approximately 09:52 UTC on October 2, including 7 `sales_follow_up_due` reminders and the training-resume reminder batch. Between 09:50 and 09:55 UTC, 7 `product_training_resume_reminder` emails were delivered and 22 low-priority reminders were `skipped_quota`, with no delivery failures. This proves the daily maintenance route executed and that quota protection shed low-priority reminder traffic safely.
- Runtime release `137447aa5357cc847d1ac9b08de0c2be4e2b1515` adds a durable `maintenance_completed` system audit entry plus a concise `[maintenance] completed` log for every future daily run, recording only success, failed task names, deployment SHA, and environment. It is READY on Vercel deployment `dpl_H7Wq5tZVMFWeBg8YjF7wH9ar6Aky`, serves both production aliases, passed post-merge CI and CodeQL, has 0 release-tagged unresolved app errors, and Vercel reported no runtime error groups in the post-deploy observation window.

## 2026-10-03 runtime launch verification
- Vercel production runtime over the last 24 hours showed 738 HTTP 200 responses in the sampled status rollup and no 5xx status group. The last 12 hours showed no runtime error clusters.
- An earlier service OG dynamic-font error occurred twice on an older deployment. It did not recur in the current 12-hour production error window, so it is recorded as observed but not an active blocker.
- The verified Resend domain `virtualassistant.com.ph` has sending enabled. The separate `replies.virtualassistant.com.ph` domain is verified for receiving.
- Recent production delivery evidence includes successful account-confirmation emails, password-reset emails, lead acknowledgements, internal lead notifications, discovery notifications, and training reminders. This verifies both application transactional email and Supabase Auth custom SMTP behavior without sending a synthetic test message.
- Production activity in the last seven days includes 17 leads, 16 new jobs, 501 recruiter activity records, and 145 workflow reminders. Seven client-linked jobs were created in the last 30 days.
- Production has 2 Admin profiles and 3 Recruiter profiles, satisfying the internal-access prerequisite.
- Discovery automation is active in production: the discovery-reminder endpoint returned HTTP 200 on its recent scheduled executions.
- Six discovery bookings were scheduled in the last 30 days. Five are backed by Google Calendar event IDs and Google Meet URLs; one is explicitly recorded as a manual meeting with a meeting URL and no Calendar event. This is a supported/manual booking mode, not a silent failed Google Meet record.
- Booking handoff telemetry in the last 30 days includes 15 completed booking events, 3 explicit `booking_handoff_ready` events, 2 duplicate-booking reuse events, and 0 `booking_handoff_recovery_needed` events.
- There are 0 open or recent `Fix booking role handoff` recruiter recovery tasks.
- `lead_proposals` still contains 0 production rows. Therefore proposal send/view/revise/acceptance, client identity handoff, accepted commercials, workspace access, and proposal failure/retry behavior cannot honestly be marked runtime-verified from production evidence yet.
- No synthetic lead, proposal, customer email, or production mutation was created solely for this verification.

## Remaining release gates
| Complete | Owner | Action | Required evidence |
| --- | --- | --- | --- |
| [x] | Release operator | Record current production deployment and rollback deployment | Current READY SHA/deployment and previous rollback-candidate SHA/deployment recorded above |
| [ ] | Database owner | Establish recoverable production backup | Project is on Supabase Free; create a regular off-site `db dump`, record its timestamp/location, and rehearse restore to a non-production database |
| [x] | Engineering | Harden acceptance as one consistent business operation | Atomic acceptance RPC, row locks, idempotent retry, release-safety tests and rollback-only constraint-failure coverage |
| [ ] | Engineering + QA | Verify client identity handoff end to end | Acceptance with a valid client identity and invalid-identity blocking are production-tested; still record runtime new/existing-client Auth invite/magic-link and role-conflict evidence |
| [ ] | Release operator | Verify production environment | App URL, Supabase runtime, Resend sending, signed Resend webhook callbacks, account-confirmation delivery, Google Calendar/Meet and deployment identity are live. Turnstile is currently missing on `/hire`; configure both Turnstile keys and record Trigger.dev runtime evidence without exposing secret values |
| [x] | Release operator | Verify tested release on the production domain | Production SHA/aliases verified, smoke checks passed, rollback candidate recorded |
| [x] | Recruiter + QA | Hiring brief and CRM | Current post-migration client-hiring sample is persisted, acknowledged, owner-assigned, timezone-tagged, beyond new, and has a concrete next state |
| [ ] | Recruiter + QA | Discovery | Live bookings prove scheduling plus Google Meet/Calendar creation; still record attended/completed outcome and delivery-failure feedback |
| [ ] | Recruiter + QA | Proposals | Public proposal render and expiry failure are production-tested; still record both service models plus send/view/revise/replace/decline and email-failure preservation |
| [ ] | Client + QA | Acceptance and workspace | Rollback-only production acceptance proves one role, correct client, accepted terms, included access and CRM won; still record Auth handoff, workspace login and released-shortlist runtime |
| [ ] | Engineering + QA | Failures and retries | Production rollback QA proves invalid-client blocking and idempotent repeat acceptance with no partial acceptance writes; browser Auth and provider-email failure behavior still need runtime evidence |
| [x] | Operations | Maintenance and reminders | Discovery scheduler is active and succeeding every 15 minutes; daily maintenance execution is evidenced by maintenance-only sales/training reminders, delivered reminder mail, and quota-safe skips. Future runs now write an explicit completion audit |
| [ ] | QA | Privacy and regression | Production Hiring Room checks prove client job isolation and released-only candidate visibility; still verify existing engagements, mobile/desktop journeys and VA notification behavior |
| [ ] | Release operator | Sign-off and monitoring | Record owner, monitoring window, backup/recovery evidence and rollback decision |

## Verified source-level controls
Acceptance core writes use the service-role-only `accept_lead_proposal_atomic` database function. The function locks the proposal and lead rows, makes repeat acceptance idempotent, and keeps the role, commercials, candidate access, proposal, lead, recruiter activity and lead-won analytics in one transaction.

Client handoff does not mutate the core lead/job hiring rows. Existing/resolved client identities must have the client role and an email matching the lead contact email; missing or mismatched identities block the handoff rather than silently linking another account.

These controls close the original source-level acceptance blockers. They do not substitute for runtime Auth-provider, email-delivery, backup/recovery, or full end-to-end production evidence.

## Rollback procedure
1. Use the recorded previous READY production deployment as the application rollback target while preserving compatible additive schema and new customer records.
2. If acceptance is inconsistent, pause the affected route and maintenance automation using a tested operational control or maintenance deployment.
3. Do not restore pre-v4147 status/reminder constraints while `changes_requested` or lead/proposal reminder records exist.
4. Do not blindly undo v4143 entitlements; it updates existing role access, including zeroing fees for eligible roles.
5. Never restore an old database backup over new accepted proposals without an explicit reconciliation/recovery plan.
6. Reconcile proposal, role, commercials, client, entitlement and CRM state before reopening acceptance.
7. Verify public intake, login, existing client workspaces, recruiter queues and maintenance behavior after rollback.

## Sign-off record
Runtime release SHA: `137447aa5357cc847d1ac9b08de0c2be4e2b1515`
Production runtime deployment: `dpl_H7Wq5tZVMFWeBg8YjF7wH9ar6Aky` / `virtualassistant-ph-webapp-v4103-p8pdlxg6e.vercel.app`
Production aliases: `virtualassistant.com.ph`, `www.virtualassistant.com.ph`
Rollback target: previous READY production deployment `dpl_DQSTpi6Np7MDcui8R9RTbFA82PXF` / SHA `3b879067cb57defbc5b95db101ac2afb5a4c5cfa`
Database preflight: PASS for recorded schema/security/consistency checks
Production acceptance QA: PASS for curated placement, managed service, audit/analytics, idempotent retry, invalid-client blocking, and rollback cleanup
Current-release error health: 0 release-tagged unresolved app errors for `137447aa`; no Vercel runtime error groups in the post-deploy observation window
Primary email delivery: PASS; signed Resend webhook callbacks are live, the latest 50 webhook deliveries succeeded, and the last-24-hour app aggregate has 0 failed/bounced/complained events
Backup/recovery evidence: BLOCKED; Supabase Free project has no recorded recoverable off-site dump or restore rehearsal
Turnstile bot protection: BLOCKED; production `/hire` currently renders without the Turnstile widget because the public site key is not configured
Client Hiring Room privacy boundary: PASS; 11 client summaries checked with 0 foreign jobs or unreleased candidate/profile exposure
Browser Auth/workspace and remaining proposal-response lifecycle: pending; no production smoke-account infrastructure or connected Auth-admin/browser credential path is available for a safe authenticated run
Monitoring owner/window: pending
Go/no-go: HOLD

---

## Historical review: 2026-09-12
Reviewed 2026-09-12 UTC against main c956999c5e6a0fbe4db1a4a58dd85a0ae99748b0 and PR #35 head eaa08ecc150c6b252ba5cf4bab3c0e073f1f0d73.
Decision: HOLD production sign-off. This document records verification, not deployment.
Closed PRs were not reopened or re-reviewed except where their merged evidence is required to resolve a current documented blocker.

## Verified evidence
- Current main is c956999c5e6a0fbe4db1a4a58dd85a0ae99748b0 and includes merged PR #37, `Harden proposal acceptance and production release safety`.
- PR #35 now contains current main as a parent, so its dashboard redesign no longer sits behind the proposal-acceptance and client-handoff safety changes.
- PR #37 records that production database migrations v4149-v4151 were applied and verified before that PR was opened. This document does not substitute for an independent production schema query.
- PR #37 records rollback-only database tests for successful acceptance, idempotent repeat acceptance, and rollback on a forced constraint failure, with no test rows retained.
- GitHub CI on the updated PR #35 head passed the release-safety contract tests and TypeScript type-check. The production build is tracked separately by CI/deployment status.
- The earlier main e2a64e3378503e6a07ef31dddda94005bba1f5d1 Vercel status failed because of deployment rate limiting. That rate-limit failure is historical, not evidence of a source-code acceptance failure.
- Production-domain SHA, known-good rollback deployment and operator evidence remain unrecorded.
- Supabase project ywkgcyilxhezrfxuwius matches the public site's Supabase asset host.
- Production migration history previously recorded v4144_sales_crm (20260909141534), v4145_discovery_proposals (20260909143444), v4146_proposal_table_hardening (20260909143540), v4147_finish_agency_sales_handoff (20260909162645), and v4148_harden_public_directory_views (20260910001124).
- v4148 public views public_va_directory, public_company_profiles, public_va_reviews and public_va_certifications report security_invoker=true and security_barrier=true.
- lead_proposals, recruiter_activity, recruiter_notes, workflow_reminders have RLS enabled.
- lead_proposals has no direct anon/authenticated table grants and a deny-browser policy with USING false and WITH CHECK false.
- Proposal constraint includes changes_requested; reminders constraint includes lead and proposal.
- Offered enum value exists. Recruiter notes/activity exist. This is partial schema evidence for v4130, not proof of every historical backfill.
- Active accepted roles missing paid/comped candidate access: 0.
- Proposal table was empty at the earlier production check. Accepted proposals missing a linked role or accepted commercials: 0. Those zero counts did not prove acceptance worked because there was no accepted proposal sample.
- The refreshed read-only migration, view-option, catalog and aggregate checks ran successfully against production on 2026-09-11. No customer records changed, migrations reapplied, emails sent or deployments triggered manually.

## Migration prerequisite
The v4.13.1 dashboard notes explicitly require 20260828_v4130_recruiter_operations.sql.
Current main additionally depends on v4132 workflow reminders and v4143-v4151 migrations. Production previously recorded v4144-v4148 with alternate timestamps; PR #37 records v4149-v4151 as applied and verified before merge.
Do not reapply old migrations simply because their repository filenames are absent from migration history: production uses different timestamps for v4144-v4148, and older changes may have been applied outside recorded migration history.
Compare remaining v4130 objects, columns, views, indexes and backfill effects with production before claiming full historical coverage. Verify all intervening migrations required by the deployed baseline.
Do not run schema.sql or seed.sql over this existing production database.

## Remaining release gates
| Complete | Owner | Action | Required evidence |
| --- | --- | --- | --- |
| [ ] | Release operator | Record current production deployment and rollback deployment | Exact SHAs, URLs and operator |
| [ ] | Database owner | Confirm recoverable backup and remaining historical schema coverage | Backup timestamp and recovery procedure; schema comparison |
| [x] | Engineering | Harden acceptance as one consistent business operation | PR #37 atomic service-role RPC, row locks, idempotent retry, release-safety tests and rollback-only constraint-failure test |
| [ ] | Engineering | Verify client identity handoff end to end | Source guards are implemented; still record runtime new/existing client, role conflict, Auth failure and magic-link failure evidence |
| [ ] | Release operator | Verify production environment | Supabase URL and server credentials, app URL, Auth callbacks, app email, Auth SMTP; setup:check -- --strict |
| [ ] | Release operator | Verify tested release on the production domain | Production-domain SHA verification plus a known-good rollback deployment |
| [x] | Recruiter + QA | Hiring brief and CRM | Recent production leads/jobs, delivered lead acknowledgements/internal notifications, recruiter activity and workflow reminders provide live evidence |
| [x] | Recruiter + QA | Discovery | Recent production bookings, Google Meet/Calendar records, delivered discovery notifications and running reminder endpoint provide live evidence; one recent booking is explicitly manual |
| [ ] | Recruiter + QA | Proposals | Both service models; correct totals; send/view/revise/replace/decline/expiry; prior live proposal survives email failure |
| [ ] | Client + QA | Acceptance and workspace | One role, correct client, accepted terms, included access, CRM won, working workspace link and released shortlist |
| [ ] | Engineering | Failures and retries | Core DB double-click/concurrency/rollback coverage exists; still record Auth failure and email failure behavior with no false success or duplicate role |
| [ ] | Operations | Maintenance and reminders | Quotes never publish unaccepted roles; scheduler configured; overdue reminders delivered once |
| [ ] | QA | Privacy and regression | Unrelated client denied; unreleased private candidates hidden; existing engagements work; mobile/desktop journeys and VA notifications pass |
| [ ] | Release operator | Sign-off and monitoring | Updated SHA, results, owner, monitoring window and rollback decision recorded |

## Source-level acceptance hardening
The source-level blockers previously documented here were resolved on main by PR #37 and are present unchanged on the updated PR #35 branch.

`src/app/actions/proposals.ts` delegates acceptance core writes to the service-role-only `accept_lead_proposal_atomic` database function and checks both the RPC error and returned acceptance payload before continuing. The database function locks the proposal and lead rows, makes an already accepted proposal idempotent, and commits or rolls back the job, commercials, candidate access, proposal, lead, recruiter activity and lead-won analytics together.

`src/lib/client-handoff.ts` no longer mutates the core lead/job hiring rows. Existing and resolved client identities must have the client role and an email matching the lead contact email; missing or mismatched identities are blocking results rather than silently linking another account. Magic-link generation uses the resolved verified identity.

The release-safety contract tests assert the atomic RPC boundary, row locks, service-role-only execution, identity mismatch guards, and the absence of direct core hiring writes in the handoff helper. PR #37 additionally records rollback-only database tests for success, idempotent retry and forced-constraint rollback.

These fixes close the original source-level acceptance blockers. They do not by themselves complete production-domain, Auth-provider, email-delivery, backup, rollback or full end-to-end release sign-off.

## Rollback procedure
1. Record a known-good deployment that preserves approval-before-publication. Rehearse rollback on a non-production environment with the upgraded schema.
2. If acceptance is inconsistent, pause the affected route and maintenance automation using a tested operational control or maintenance deployment. A feature flag is not assumed to exist.
3. Prefer application rollback while retaining compatible additive schema and new customer records.
4. Do not restore pre-v4147 status/reminder constraints while changes_requested or lead/proposal reminder records exist.
5. Do not blindly undo v4143 entitlements: it updates existing role access, including zeroing fees for eligible roles.
6. Never restore an old database backup over new accepted proposals without an explicit reconciliation/recovery plan.
7. Reconcile proposal, role, commercials, client, entitlement and CRM state before reopening acceptance.
8. Verify public intake, login, existing client workspaces, recruiter queues and maintenance behavior after rollback.

## Sign-off record
Release SHA: pending
Production deployment URL/SHA: pending
Backup/recovery evidence: pending
Acceptance test evidence: PR #37 rollback-only DB tests plus PR #35 release-safety CI; runtime Auth/email evidence still pending
Rollback deployment and rehearsal: pending
Release operator and monitoring owner: pending
Go/no-go: HOLD
