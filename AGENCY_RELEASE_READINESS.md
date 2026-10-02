# Agency release readiness
Reviewed 2026-10-02 UTC against production main `634618ff1167f798c06ba4d13b0b80004d3ec013` and the connected production Supabase project.
Decision: HOLD final launch sign-off. Database and deployment evidence are current; backup/recovery evidence, environment/Auth/email checks, and the full production hiring journey still need operator/QA evidence.

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

## Remaining release gates
| Complete | Owner | Action | Required evidence |
| --- | --- | --- | --- |
| [x] | Release operator | Record current production deployment and rollback deployment | Current READY SHA/deployment and previous rollback-candidate SHA/deployment recorded above |
| [ ] | Database owner | Confirm recoverable backup and remaining historical schema coverage | Migration coverage is current; still record backup timestamp and tested recovery procedure |
| [x] | Engineering | Harden acceptance as one consistent business operation | Atomic acceptance RPC, row locks, idempotent retry, release-safety tests and rollback-only constraint-failure coverage |
| [ ] | Engineering + QA | Verify client identity handoff end to end | Record runtime new/existing client, role conflict, Auth failure and magic-link failure evidence |
| [ ] | Release operator | Verify production environment | Supabase URL and server credentials, app URL, Auth callbacks, app email, Auth SMTP; run the strict setup check without exposing secret values |
| [x] | Release operator | Verify tested release on the production domain | Production SHA/aliases verified, smoke checks passed, rollback candidate recorded |
| [ ] | Recruiter + QA | Hiring brief and CRM | Lead persisted, acknowledgement delivered, owner/stage/follow-up saved |
| [ ] | Recruiter + QA | Discovery | Correct timezone, schedule, meeting link, completion and delivery-failure feedback |
| [ ] | Recruiter + QA | Proposals | Both service models; correct totals; send/view/revise/replace/decline/expiry; prior live proposal survives email failure |
| [ ] | Client + QA | Acceptance and workspace | One role, correct client, accepted terms, included access, CRM won, working workspace link and released shortlist |
| [ ] | Engineering + QA | Failures and retries | Core DB coverage exists; still record Auth failure and email failure behavior with no false success or duplicate role |
| [ ] | Operations | Maintenance and reminders | Quotes never publish unaccepted roles; scheduler configured; overdue reminders delivered once |
| [ ] | QA | Privacy and regression | Unrelated client denied; unreleased private candidates hidden; existing engagements work; mobile/desktop journeys and VA notifications pass |
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
Release SHA: `634618ff1167f798c06ba4d13b0b80004d3ec013`
Production deployment: `dpl_HjUZfp2ArGZC8vJx4wiW4zwqACkH` / `virtualassistant-ph-webapp-v4103-p6rzls7d0.vercel.app`
Production aliases: `virtualassistant.com.ph`, `www.virtualassistant.com.ph`
Rollback candidate: `dpl_3JzTir6NYJxF3TTzYEqMviLpXn6d` / SHA `8a650d256fae343e17ef7b9989a46f44514ba91c`
Database preflight: PASS for recorded schema/security/consistency checks; proposal sample count remains 0
Backup/recovery evidence: pending
Runtime Auth/email and full hiring-journey evidence: pending
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
| [ ] | Recruiter + QA | Hiring brief and CRM | Lead persisted, acknowledgement delivered, owner/stage/follow-up saved |
| [ ] | Recruiter + QA | Discovery | Correct timezone, schedule, meeting link, completion and delivery-failure feedback |
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
