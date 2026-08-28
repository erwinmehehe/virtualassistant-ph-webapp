# QA Report — v4.12.4

## Scope

This patch addresses two workflow issues:

1. Clients could not see an obvious **Post a Job** action in the public header.
2. Recruiter role matching was noisy and harder to use than necessary for a single-recruiter operation.

## Client Post a Job flow

- Public desktop header now shows **Post a Job** as the primary CTA.
- Public mobile menu now shows **Post a Job** first.
- Logged-out users are sent to client signup with `next=/workspace/client/jobs/new` preserved.
- Existing clients can use the login link and are returned to the job wizard after authentication.
- Google/Microsoft client signup retains the same destination through the existing OAuth callback flow.
- Logged-in clients continue to link directly to `/workspace/client/jobs/new`.
- Homepage hero and sticky CTA now prioritize **Post a Job**.
- Client dashboard CTA now says **Post a Job**.
- Job wizard page explains that submitted roles go to the recruiting team for review and matching.
- Final wizard action is labeled **Post job for recruiting review**.

## Recruiter cleanup

- Role Matching defaults to **Needs matching** rather than showing every role.
- Added search by role, company, and category.
- Added views for **Needs matching**, **Already matched**, and **All roles**.
- Exact same-client/company + same-title duplicates are hidden in focused views without deleting any database records; **All roles** still shows them.
- Candidate matching shows the top 20 ranked VAs by default, with a **Show all** control.
- Shortlist actions are renamed to **Assign selected to role** and **Release selected to client**.
- Vetting queue removes the extra Claim button for the current single-recruiter workflow; opening a ready candidate is enough to begin review.

## Validation

- Syntax transpilation check passed for all 11 changed TS/TSX files.
- Service SEO gate: 74 pages checked, PASS.
- Blog content gate: 170 posts, 0 failures, 0 warnings.
- Full TypeScript typecheck could not run in this sandbox because this extracted copy does not include installed project dependencies (`node_modules`). Vercel will run the dependency install/build during deployment.

## Database

No new Supabase migration is required for v4.12.4.
