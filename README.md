# VirtualAssistant.com.ph Web Application v4.10.2

VirtualAssistant.com.ph is a Next.js and Supabase marketplace for matching businesses with vetted Philippines-based virtual assistants.

## v4.10.2 React key hotfix

- De-duplicates database-backed tag arrays before rendering them as React keyed lists.
- Prevents the homepage `Administrative Support` duplicate-key overlay and the same class of warning on job/profile/workspace screens.
- No database migration is required.

## v4.10.1 review visibility

- Added verified placement reviews inside both Client and VA workrooms.
- Client reviews can be explicitly marked **Public on the VA profile** or **Contract parties only**.
- The UI now shows three unambiguous states: **Public now**, **Public when profile is live**, and **Contract only**.
- VA-to-client reviews are contract-only because there is no public client review surface in this release.
- Public VA profiles show only client reviews from confirmed workrooms, and only while the reviewed VA has a published public profile.
- Public review rows intentionally omit client names, company data, job details, and workroom identifiers.

### Required v4.10.1 database migration

Run `supabase/migrations/20260810_v4101_review_visibility_ui.sql` after the v4.10 migration.

v4.10.0 focuses on the public marketplace experience and guided workspace onboarding while preserving the v4.9.2 staff matching and candidate-access controls.

## v4.10.0 highlights

- Experienced-only public VA discovery (2+ years) with first-name + last-initial identity masking.
- Canonical `/va/<slug>` profile pages and readable `/jobs/j-...` public job URLs.
- Rebuilt VA profile, talent directory, public jobs list/detail, and one-line desktop filter controls.
- Client + VA onboarding checklists and VA profile-strength meters, including live profile-editor feedback.
- Four-step client role wizard with chips, budget guidance, review, local autosave, and server draft saving.
- Homepage now surfaces experienced talent, workspace workflow improvements, and latest reviewed jobs.

### Required v4.10 database migration

```text
supabase/migrations/20260810_v410_public_profiles_job_slugs.sql
```

## v4.9.2 highlights

- recruiter/admin job matching runs `matchAssessment` against the full approved/bench VA pool before applications arrive
- staff can save internal shortlists or release curated matches without creating fake applications
- client applicant identity, resume, private profile evidence, comparison, messaging, and hire actions require paid/comped candidate access
- candidate access can be requested, quoted, invoiced, marked paid, or comped per job
- Admin Marketplace settings includes a default candidate-access fee
- separate Client and VA signup pages
- `/auth/join` is now an account-type chooser rather than a mixed role form
- every public match request creates a private pending job draft automatically
- new client signup can claim the matching job draft using the same email address
- existing clients can log in and claim a lead-created job draft
- service/blog match forms and full role briefs feed the same private job workflow
- contact, role-brief, service-match, blog-match, and API lead submissions send internal lead notifications when Resend is configured
- `jrvsaccad@gmail.com` is always included as the internal lead copy address; when it is also the primary recipient the message is sent once rather than duplicated in To and CC
- compact conversion-focused footer and clearer Join navigation
- USD 5.00/hour marketplace floor remains unchanged
- all 170 long-form blog URLs and v4.6 content-quality checks remain intact

Run the content gate and application checks with:

```bash
npm install
npm run content:check
npm run typecheck
npm run build
```

See `IMPLEMENTATION_SUMMARY.md`, `BLOG_CONTENT_MAP.md`, and `CONTENT_QUALITY_REPORT.md` for content details.

## Windows PowerShell local run

If PowerShell reports that `npm.ps1` cannot be loaded because script execution is disabled, you do not need to weaken the machine-wide execution policy. Run the Windows command shim directly:

```powershell
npm.cmd -v
npm.cmd install
npm.cmd run content:check
npm.cmd run typecheck
npm.cmd run dev
```

Then open `http://localhost:3000`.

You can also run the same `npm` commands from Command Prompt instead of PowerShell.
