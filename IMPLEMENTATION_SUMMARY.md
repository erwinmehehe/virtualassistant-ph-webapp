# v4.10.0 implementation addendum

This pass focuses on marketplace UI/UX and onboarding: experienced-only public VA discovery, masked public identity, redesigned VA profile and talent search, readable public job URLs, rebuilt job list/detail pages, Client/VA onboarding checklists, live VA profile strength, a four-step role wizard with draft saving, and homepage exposure for the new marketplace workflows.

See `RELEASE_NOTES.md` and `MIGRATION.md` for deployment details.

---

# v4.9.2 implementation addendum

## Staff pre-application matching

- Recruiter: `/workspace/recruiter/matching` and `/workspace/recruiter/matching/[id]`.
- Admin: every `/workspace/admin/jobs/[id]` review includes the same full-pool ranking.
- Matching uses the existing `matchAssessment(job, va)` function against every VA in `approved` or `bench` vetting stages.
- Staff shortlists are persisted in `job_shortlist_candidates`; they are not applications and do not imply candidate interest.

## Client candidate access

- `job_candidate_access` stores per-job access status, optional fee, invoice/payment reference, and unlock audit fields.
- `paid` or `comped` is required for applicant identity, private snapshot fields, resumes, comparison, client messaging, stage changes, and hiring actions.
- Locked clients receive anonymized applicant counts/fit and anonymized released-shortlist scores only.
- RLS enforces the entitlement for applications, application history, conversations, and messages.
- Existing confirmed hires/workrooms are grandfathered as comped during migration.

---

# VirtualAssistant.com.ph v4.7.0 implementation summary

v4.7.0 improves the account entry, lead capture, and lead-to-job workflow without changing the v4.6 SEO/content architecture.

## Account UX

- `/auth/join/client` is the dedicated business/client signup page.
- `/auth/join/va` is the dedicated VA/candidate signup page.
- `/auth/join` is a two-choice landing screen and keeps backwards compatibility with older `?role=client` and `?role=va` links through redirects.
- Header navigation now exposes one Join menu with two explicit choices.
- Login presents separate Client and VA signup options.
- Footer account links are separated into Join as a client and Join as a VA.
- The footer was redesigned into a more compact conversion-oriented layout with a hiring CTA above the link groups.

## Match request to job automation

Service-page and blog match forms now:

1. save the private lead,
2. create a private `pending` job draft automatically,
3. link the lead to that job,
4. record the job ID in analytics metadata,
5. send an internal lead notification when Resend is configured.

The full `/hire` role brief uses the same behavior and carries the submitted budget, timezone, hours, requested VA, company, and start timing into the private job draft when available.

Lead-created jobs use `client_id = null` until a verified client account claims them. They are not public jobs. Admin approval still requires a linked client account, so an anonymous form cannot bypass the normal publication/commercial workflow.

## Client claim flow

- New Client signup can claim a lead-created job using the lead ID plus the same email address used on the request.
- Existing Client accounts can log in from the match-request success state and claim the same draft.
- Claiming also links other unclaimed hiring requests using the same email, limited to hiring-related lead source types.
- Lead IDs alone are not sufficient to claim a job; the authenticated/signup email must match the lead email.
- Existing-email signup responses are not treated as newly created accounts for automatic claim purposes.

## Lead email notifications

Internal lead notifications now cover:

- service-page match requests
- blog match requests
- full public role briefs
- talent introduction requests
- contact-form leads
- authenticated lead-ingest API submissions

`jrvsaccad@gmail.com` is always included on these notifications. If the configured primary lead recipient is the same address, it is sent once rather than duplicating the same mailbox in both To and CC.

## Existing product behavior retained

- USD 5.00/hour is accepted and USD 4.99/hour is rejected.
- 62 service pages and 21 industry pages remain intact.
- 170 long-form blog URLs remain intact.
- v4.6 content-quality rules, FAQs, internal linking, tools, structured data, and content funnel analytics remain intact.
- No new database migration is required from v4.6 to v4.7.

## Local Windows note

For Windows machines where PowerShell blocks `npm.ps1`, use `npm.cmd` directly. This avoids changing the machine-wide PowerShell execution policy:

```powershell
npm.cmd install
npm.cmd run content:check
npm.cmd run typecheck
npm.cmd run dev
```
