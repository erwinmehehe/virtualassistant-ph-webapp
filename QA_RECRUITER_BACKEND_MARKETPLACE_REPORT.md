# Recruiter backend + marketplace improvement QA

Date: 2026-08-28

## Recruiter access fix

- Added `/workspace/recruiter/talent` as a recruiter-only VA directory.
- Recruiters can now open **every VA account**, not only VAs currently in `recruiter_review`.
- Recruiter profile detail no longer 404s when a VA has no `va_vetting` row yet.
- Recruiter detail shows full internal name, account email, structured VA profile, skills/tools, vetting stage, skills-test evidence, prior scorecards, private resume link, and public profile link when available.
- Scorecard controls remain restricted to the correct `recruiter_review` workflow and assignment rules.
- Added direct profile links from the recruiter talent pool and recruiter dashboard.
- The recruiter detail route still requires the authenticated `recruiter` role server-side. Private resume delivery also accepts only `admin` or `recruiter`.

## Marketplace recommendations implemented / verified

The earlier recommendation list was audited against the current application. Many items already existed in v4.10.3; this pass kept them and filled the main gaps.

- Client onboarding checklist: existing and verified on the client dashboard.
- VA profile completeness / publication quality: existing, including required profile photo and vetting thresholds.
- Job-post quality controls and guided wizard: existing at `/workspace/client/jobs/new`.
- Applicant pipeline: existing statuses include new, reviewing, shortlisted, interview, hired, rejected and withdrawn.
- Paid candidate-access UX: existing and server-enforced for identity, resume, messaging and hiring actions.
- Trust signals: existing public approval, certifications, verified-placement reviews and vetting explanation.
- Talent search and filters: existing category, experience, availability, tool, overlap and sorting filters.
- Saved items: VA saved jobs already existed; **client Saved VAs** was added in this pass.
- Notifications: in-app notifications already existed; **VA application-status email notifications** were added in this pass.
- Messaging: unread/read support, protected pre-payment identity and anti-circumvention review already exist.
- Admin moderation: existing message flags, ban/unban controls and user/admin operational pages verified.
- Company profiles: existing client company profile verified.
- Role-aware CTAs: client Post a job and VA-oriented workspace navigation retained.
- Mobile navigation: role-specific mobile workspace navigation exists; recruiter VA directory was added to the recruiter mobile primary set.
- Accessibility: current forms use labels, aria labels/sr-only labels in key interactive tables and routes remain keyboard-addressable.
- Performance/privacy: public VA directory uses a privacy-safe database view; private candidate data remains fetched only in authorized workspace flows.
- Analytics: analytics route/admin analytics already exist.
- SEO: public VA profile metadata, canonical URLs, JSON-LD, sitemap/robots structure already exist.
- Terms/privacy: public Terms and Privacy pages already exist.

## New Saved VAs feature

- Added `saved_vas` table with client-owned RLS policy.
- Added migration: `supabase/migrations/20260828_v4113_saved_vas.sql`.
- Added `/workspace/client/saved` and client navigation item.
- Logged-in clients can save/remove a VA from the public VA profile page.
- Saving a VA does **not** unlock contact information or private candidate evidence.

## Email notification improvement

- Added `sendApplicationStatusEmail` via the existing Resend integration.
- When a paid-access client changes an application status, the VA receives both the existing in-app notification and an email when Resend is configured.
- Email delivery failure does not roll back the marketplace status update.

## QA

- `npm run typecheck`: PASS.
- `npm run build`: cannot complete in this Linux sandbox because the Next.js SWC Linux native/wasm package is not installed in the supplied dependency cache. This is an environment/compiler dependency issue, not a TypeScript error.

## Deployment notes

1. Apply the new Supabase migration before using Saved VAs.
2. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and configured in production; recruiter internal directory queries use the service-role client after the recruiter role guard.
3. Keep `RESEND_API_KEY`, verified `EMAIL_FROM`, and `NEXT_PUBLIC_APP_URL` configured for status emails.
4. Google/Microsoft social login still requires the provider credentials and redirect URLs to be enabled in Supabase Auth.
5. Run a production build in the deployment environment where Next.js can install/load its platform SWC package.
