# Agency release readiness
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
