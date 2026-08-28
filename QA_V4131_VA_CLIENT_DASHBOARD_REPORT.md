# v4.13.1 VA + Client Dashboard QA Report

Date: 2026-08-28

## Scope

This release builds on v4.13.0 recruiter operations and focuses on making the VA and client workspaces action-oriented rather than generic dashboards.

## VA dashboard changes

- Added a single **Next best action** panel that prioritizes, in order, recruiter profile requests, incomplete profile work, unfinished vetting, client invitations, active offers, unread messages, interviews, and job matching.
- Added four high-signal status cards: profile readiness, vetting status, public profile visibility, and unread updates.
- Added an application pipeline summary for Applied, Shortlisted, Interview, Offered, and Hired, with rejected applications kept outside the active pipeline.
- Added recruiter-request surfacing directly on the dashboard.
- Added a new VA Notifications page so recruiter requests and hiring status changes are not buried in messages.
- Notification read/mark-all-read server actions now support both client and VA roles.
- Added availability, weekly-hours/schedule context, pending invitations, unread messages, and certification summaries.
- Hides the onboarding checklist once all onboarding steps are complete.
- Keeps the top three job matches visible without loading private client/candidate data.

## Client dashboard changes

- Made **Post a Job** the dominant hiring action and explains that the platform recruits from the submitted role brief.
- Added a **Needs your attention** queue that surfaces only actionable items: first job, new applicants, interviews, offers, unread messages, and roles with applicants whose private candidate access is still locked.
- Added a combined hiring pipeline for Applied, Shortlisted, Interview, Offered, and Hired.
- Upgraded role cards with applicant, shortlist, interview, offer, and hire counts.
- Candidate-access UX now explicitly lists what access unlocks instead of making missing information appear broken.
- Hides the onboarding checklist once the hiring setup is complete.
- Retains Saved VAs, Messages, Hires, and Active Jobs as quick-access cards, with Post a Job first.

## Responsive / accessibility checks

- New dashboard sections collapse to one-column layouts on small screens.
- Pipeline stages collapse to two columns on mobile.
- Primary dashboard CTAs become full-width where appropriate.
- New status and action surfaces use semantic links/buttons and existing focus styles.
- Private candidate details are not fetched for the client dashboard; only application IDs/status/match scores and access entitlements are queried.

## Validation

- `npm run typecheck`: **PASS**
- Source parse audit: **190 TS/TSX files, 0 syntax errors**
- `npm run service:check`: **PASS** (74 service pages; 0 brand names in service meta titles; longest meta description 159 chars)
- `npm run content:check`: **PASS** (170 posts; 0 failures; 0 warnings)
- `npm run build`: **BLOCKED BY SANDBOX NETWORK**, not an application compile failure. The supplied dependency archive contains the Windows Next.js SWC binary only; Next.js attempted to download `@next/swc-linux-x64-gnu` from npm, but outbound registry DNS/network access is unavailable in this environment.

## Database requirement

v4.13.1 itself adds no new migration, but this package includes the v4.13.0 recruiter-operations features. Production must have:

`supabase/migrations/20260828_v4130_recruiter_operations.sql`

applied before using the new recruiter operations / Offered-stage workflow. This migration does not recreate `public_va_directory`; it avoids the view-column-order issue encountered in the earlier v4.12 migration.

## Deployment smoke test

After Vercel deploys, verify:

1. VA login → Overview shows Next best action, profile readiness, application pipeline, recruiter requests, and Notifications.
2. VA Notifications → mark one notification read and mark all read.
3. Client login → Overview shows Post a Job first and Needs your attention.
4. Client with applications → role cards show pipeline counts.
5. Client with locked candidate access → locked-access card explains what payment unlocks without exposing VA email/resume.
6. Recruiter login → v4.13.0 control center and master VA directory still load after the migration.
