# Agency release readiness
Reviewed 2026-09-11 UTC against main c49a2e5463f2b73c2492d4b133845be496d7b00d.
Decision: HOLD production sign-off. This document records verification, not deployment.
Closed PRs were not reopened or re-reviewed.

## Verified evidence
- Current main is c49a2e5463f2b73c2492d4b133845be496d7b00d.
- The earlier main e2a64e3378503e6a07ef31dddda94005bba1f5d1 Vercel status failed because of deployment rate limiting. That rate-limit failure is historical, not the current blocker.
- PR #27 head 74ea80930e9f05443aaff65d7561304b2c3121ca later received a successful Vercel deployment status. Current main c49a2e5463f2b73c2492d4b133845be496d7b00d also has a successful Vercel deployment status. These statuses do not by themselves prove which SHA the production custom domain serves.
- Production-domain SHA, known-good rollback deployment and operator evidence remain unrecorded.
- Supabase project ywkgcyilxhezrfxuwius matches the public site's Supabase asset host.
- Production migration history records v4144_sales_crm (20260909141534), v4145_discovery_proposals (20260909143444), v4146_proposal_table_hardening (20260909143540), v4147_finish_agency_sales_handoff (20260909162645), and v4148_harden_public_directory_views (20260910001124).
- v4148 public views public_va_directory, public_company_profiles, public_va_reviews and public_va_certifications report security_invoker=true and security_barrier=true.
- lead_proposals, recruiter_activity, recruiter_notes, workflow_reminders have RLS enabled.
- lead_proposals has no direct anon/authenticated table grants and a deny-browser policy with USING false and WITH CHECK false.
- Proposal constraint includes changes_requested; reminders constraint includes lead and proposal.
- Offered enum value exists. Recruiter notes/activity exist. This is partial schema evidence for v4130, not proof of every historical backfill.
- Active accepted roles missing paid/comped candidate access: 0.
- Proposal table is empty. Accepted proposals missing a linked role or accepted commercials: 0. These zero counts do NOT prove acceptance works because there is no accepted proposal sample.
- The refreshed read-only migration, view-option, catalog and aggregate checks ran successfully against production on 2026-09-11. No customer records changed, migrations reapplied, emails sent or deployments triggered manually.

## Migration prerequisite
The v4.13.1 dashboard notes explicitly require 20260828_v4130_recruiter_operations.sql.
Current main additionally depends on v4132 workflow reminders and v4143-v4148 migrations. Production records v4144-v4148, including v4148 public-directory hardening.
Do not reapply old migrations simply because their repository filenames are absent from migration history: production uses different timestamps for v4144-v4148, and older changes may have been applied outside recorded migration history.
Compare remaining v4130 objects, columns, views, indexes and backfill effects with production before claiming full historical coverage. Verify all intervening migrations required by the deployed baseline.
Do not run schema.sql or seed.sql over this existing production database.

## Remaining release gates
| Complete | Owner | Action | Required evidence |
| --- | --- | --- | --- |
| [ ] | Release operator | Record current production deployment and rollback deployment | Exact SHAs, URLs and operator |
| [ ] | Database owner | Confirm recoverable backup and remaining historical schema coverage | Backup timestamp and recovery procedure; schema comparison |
| [ ] | Engineering | Harden acceptance as one consistent business operation | Transactional core writes, concurrency/idempotency tests and failure recovery |
| [ ] | Engineering | Verify client identity handoff | New/existing clients, differing linked-account email, role conflict, Auth failure and link-write failure |
| [ ] | Release operator | Verify production environment | Supabase URL and server credentials, app URL, Auth callbacks, app email, Auth SMTP; setup:check -- --strict |
| [ ] | Release operator | Verify tested release on the production domain | Production-domain SHA verification plus a known-good rollback deployment |
| [ ] | Recruiter + QA | Hiring brief and CRM | Lead persisted, acknowledgement delivered, owner/stage/follow-up saved |
| [ ] | Recruiter + QA | Discovery | Correct timezone, schedule, meeting link, completion and delivery-failure feedback |
| [ ] | Recruiter + QA | Proposals | Both service models; correct totals; send/view/revise/replace/decline/expiry; prior live proposal survives email failure |
| [ ] | Client + QA | Acceptance and workspace | One role, correct client, accepted terms, included access, CRM won, working workspace link and released shortlist |
| [ ] | Engineering | Failures and retries | Double-click/concurrent accept, database failure at each core write, Auth failure, email failure; no false success or duplicate role |
| [ ] | Operations | Maintenance and reminders | Quotes never publish unaccepted roles; scheduler configured; overdue reminders delivered once |
| [ ] | QA | Privacy and regression | Unrelated client denied; unreleased private candidates hidden; existing engagements work; mobile/desktop journeys and VA notifications pass |
| [ ] | Release operator | Sign-off and monitoring | Updated SHA, results, owner, monitoring window and rollback decision recorded |

## Source-level acceptance blockers
src/app/actions/proposals.ts performs job, commercials, entitlement, proposal and lead updates separately.
Several database results are unchecked. A failure can leave partial state; read-before-write status checks do not serialize concurrent acceptance.
Some job-write errors claim acceptance and recruiter notification even though those steps have not completed.
src/lib/client-handoff.ts returns linked after unchecked lead/job writes. It can prefer an existing client identity while generating a magic link for the lead email. Test and bind link identity to the verified target account.
These are unresolved findings, not fixes in this documentation PR.
Do not mark acceptance ready from typecheck/build alone.

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
Acceptance test evidence: pending
Rollback deployment and rehearsal: pending
Release operator and monitoring owner: pending
Go/no-go: HOLD
