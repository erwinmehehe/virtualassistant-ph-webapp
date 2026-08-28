# VirtualAssistant.com.ph v4.12.0 — Marketplace Build & QA Report

Date: 2026-08-28

## Executive summary

This release consolidates the recruiter-access fixes and implements/hardens the 20 requested marketplace recommendations. The highest-risk controls (candidate privacy, recruiter access, paid client access, authentication abuse resistance, and public profile eligibility) are enforced server-side or at the database view/RLS layer rather than only in the UI.

## 1. Client onboarding after registration
- Added/retained `/workspace/client/onboarding` with company name, timezone, hiring needs, location and budget range.
- Brand-new clients with no completed onboarding and no jobs are redirected from the generic client dashboard into onboarding.
- Completion redirects directly to `/workspace/client/jobs/new?onboarded=1`.

## 2. VA profile completeness score
- Existing weighted profile-completeness scoring retained for headline, bio, category, skills, tools, experience, availability, rate, resume, portfolio/LinkedIn and schedule.
- Public directory is additionally database-gated to require a real profile photo, quality headline/bio, 5+ skills, availability, USD 5+ rate, resume and approved/bench vetting stage.
- This prevents incomplete VAs from surfacing even if a UI bug incorrectly toggles visibility.

## 3. Better job-post quality controls
- Four-step wizard retained with preview/review step.
- Required/validated: title, category, summary, 2+ skills, description, responsibilities, hours/week, timezone, overlap, minimum rate, onboarding plan.
- Rate range and service model retained.
- Added `experience_level` (entry/intermediate/senior/expert) through UI, server action and database migration.

## 4. Application management for clients
- Existing applicant counts and role-level applicant management retained.
- Pipeline remains: New/Applied -> Reviewing -> Shortlisted -> Interview -> Hired / Rejected (plus Withdrawn for VA).
- Hiring remains a separate confirmation flow requiring final rate, start date and schedule.
- Status history remains auditable.

## 5. Clear paid-access UX
- Existing CandidateAccessGate retained and verified.
- Locked state explicitly says identity, profile, resume, contact links, messages, comparison and hiring controls are protected.
- Shows applicant and released-match counts plus access fee/status where available.
- Server actions block client messaging/hiring/profile access until status is paid or comped.

## 6. Profile trust signals
- Existing approved-profile, vetted, certification and verified-placement-review signals retained.
- Public directory now also renders Email verified, Identity verified and recent activity when those trust fields exist.
- Public profile continues to explain the vetting stages completed.

## 7. Search and filtering
- Existing query, category, experience, availability, tools and overlap filters retained.
- Added min/max hourly rate filters.
- Added timezone/schedule keyword filter.
- Added portfolio-only filter.
- Added newest-profile sort alongside recommended, experience, availability and rate.

## 8. Saved VAs and saved jobs
- Client Saved VAs retained with RLS-backed `saved_vas` table and `/workspace/client/saved`.
- VA Saved Jobs retained with `/workspace/va/saved`.
- Saved state never bypasses paid candidate-access protections.

## 9. Email notifications
- New application email retained.
- Application-stage update email retained.
- New private-message email retained (with protected generic wording when candidate access is locked).
- Added job-published confirmation email.
- Added job-closed confirmation email.
- Added payment-success receipt emails from both Stripe and PayMongo webhooks.
- Password-change security email retained.
- Email failures are best-effort and do not roll back marketplace actions.

## 10. Messaging improvements
- Existing timestamps, unread/read handling and protected conversation routing retained.
- Existing private attachments support retained (PDF/JPG/PNG/WEBP/TXT/DOCX, max 10 MB) through signed delivery.
- Conversation status field added by migration for active/archived/closed lifecycle.
- Client sending is server-blocked until candidate access is active.

## 11. Admin moderation
- Existing admin moderation, users, jobs, payments, vetting and operational pages retained.
- Existing message-flag workflow for suspected off-platform/circumvention language retained.
- Recruiter talent directory remains recruiter-only and exposes private candidate data only after role checks.
- Moderation/status fields added for launch hardening.

## 12. Anti-spam and abuse protections
- Cloudflare Turnstile UI already existed; server-side Turnstile verification is now wired for login and signup.
- Persistent database-backed rate limiting is now wired to login, signup, password reset, message sending and job applications.
- Supabase email-confirmation flow retained.
- Duplicate-email behavior remains handled by Supabase Auth without account enumeration.
- Circumvention detection remains human-review based rather than auto-punitive.

## 13. Client company profiles
- Existing company name, website, industry, timezone and team size retained.
- Added/confirmed company description, location and current hiring needs fields.
- Added company logo URL support through migration/action/UI.

## 14. Better homepage/header CTAs
- Logged-in client header CTA: `Post a job`.
- Logged-in VA header CTA: `Browse jobs`.
- Public employer and VA paths remain structurally separated in navigation.
- Homepage public VA showcase remains photo-only via public directory eligibility.

## 15. Mobile QA
- Existing role-specific mobile account navigation retained.
- Client Post a job and VA Browse jobs actions are present in mobile menus.
- Applicant tables use the existing responsive-table patterns; message pages include mobile conversation-back controls.
- No new fixed-width layouts were introduced in this pass.

## 16. Accessibility
- Existing labelled form fields, sr-only labels on compact controls, aria labels on navigation and role/status messaging retained.
- Job wizard uses `aria-invalid` and role=alert for validation.
- Primary new fields are native labeled inputs/selects/checkboxes and remain keyboard accessible.

## 17. Performance/privacy
- Public VA discovery continues to query the privacy-safe `public_va_directory` view, not full private candidate records.
- Private candidate information is fetched only inside role-gated workspace routes.
- Results remain bounded; public discovery currently caps at 200 rows before in-memory filtering.
- No private email/resume/legal-name fields are present in the public directory view.

## 18. Analytics and funnel tracking
- Existing public acquisition analytics retained.
- Server-side marketplace funnel events now include: client onboarding completion, job created/updated/published/closed, application submitted, shortlisted/interview/rejected, hire, candidate viewed, candidate unlock initiated, and payment completed.
- Account-created analytics already records client/VA role; OAuth entry points remain distinguishable by the provider action/UI.
- Analytics failures are non-blocking.

## 19. SEO for public marketplace pages
- Existing public VA metadata/JSON-LD/canonical/sitemap behavior retained.
- Public job pages and public VA profiles remain separate from private workspace/contact data.
- Public VA directory view enforces contact-safe fields at the database layer.

## 20. Terms, privacy and marketplace rules
- Existing `/terms` and `/privacy` retained.
- Signup explicitly links to Terms and Privacy.
- Existing minimum-rate, private-candidate-access, payment/dispute and moderation rules remain enforced in product flows.

## Recruiter backend access
- `/workspace/recruiter/talent` remains the recruiter-wide VA directory.
- Recruiters can open any VA internal profile, including VAs without a current recruiter-review queue row.
- Recruiter route access and private resume delivery remain role-gated server-side.

## Database migration required
Apply these migrations in order if they are not already applied:
1. `20260828_v4113_saved_vas.sql`
2. `20260828_v412_launch_hardening.sql`

The v4.12 migration adds trust/activity fields, client onboarding/profile fields, VA timezone, job experience/moderation fields, message attachment/conversation lifecycle fields, persistent rate-limit storage, private attachment storage, and the stricter public VA directory view.

## Environment/configuration required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- Google OAuth provider configured in Supabase (optional social login)
- Microsoft/Azure OAuth provider configured in Supabase (optional social login)
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` for bot protection
- `RESEND_API_KEY` + verified `EMAIL_FROM` for transactional email
- Stripe/PayMongo webhook secrets if those payment providers are enabled

## QA results
- `npm run typecheck`: PASS
- `npm run content:check`: PASS (170 posts, 0 failures, 0 warnings)
- `npm run build`: BLOCKED BY SANDBOX ENVIRONMENT. The supplied dependency cache contains Windows SWC but not the Linux SWC/wasm package required by Next.js. The failure occurs before application compilation. Run `npm ci && npm run build` in the deployment environment with registry access/Linux SWC available.

## Security/privacy observations
- Candidate email remains unavailable to unpaid clients and available to recruiters/authorized paid clients only.
- Client messaging is server-blocked before candidate access.
- Public VA discovery cannot expose email, private resume, legal name or private links because those columns are absent from the public directory view.
- Rate-limit table is revoked from anon/authenticated users and is accessed through the service-role server client only.
