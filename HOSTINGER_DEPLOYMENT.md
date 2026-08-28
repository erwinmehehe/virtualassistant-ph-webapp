# v4.7 deployment note

If production is already on v4.6, v4.7 requires no new database migration. Confirm the new lead-notification environment variable, then run the content-quality gate before the normal type/build checks.

If production is still on v4.4, back up Supabase and run these v4.5 migrations before deploying v4.7:

1. `supabase/migrations/20260809_v45_minimum_rate.sql`
2. `supabase/migrations/20260809_v45_blog_funnel.sql`

Then install dependencies and run `npm run content:check`, `npm run typecheck`, and `npm run build` in the production build environment. Confirm `NEXT_PUBLIC_APP_URL=https://virtualassistant.com.ph`. Do not place Supabase secret/service credentials in any `NEXT_PUBLIC_*` variable or client bundle.

After deployment, verify an exact USD 5.00 job can be saved/published while USD 4.99 is rejected, then verify a blog CTA creates a lead with the originating `page_url` and `session_id`.

---

# Deploying VirtualAssistant.com.ph v4.7.0 on Hostinger

This is a full-stack Next.js application. Deploy it as a Node.js Web App, not as static files copied into `public_html`.

## 1. Back up the current production system

Before changing application code or schema:

- export/back up the Supabase database
- preserve the current environment-variable values
- preserve any existing WordPress/content deployment until redirects and SEO pages are verified

## 2. Upgrade Supabase

### Fresh database

Run:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

### Existing v3.1.0 database

Run:

`supabase/migrations/20260809_v4_product_cro.sql`

### Older v3.0.x database

Run the v3.1 migration first, then the v4 migration.

The v4 application expects the new requested-VA, workroom hire-term, analytics, application-history, time-review fields, and atomic hire function to exist. The same migration also hardens RLS so sensitive workflow/profile mutations are server-action-only; deploy the migration and application as one release.

## 3. Environment variables

Configure these in Hostinger's Node.js application settings:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
EMAIL_FROM=
LEAD_NOTIFICATION_EMAIL=
APPLICATION_CC_EMAIL=jrvsaccad@gmail.com
NEXT_PUBLIC_APP_URL=https://virtualassistant.com.ph
LEAD_INGEST_SECRET=
```

Keep `SUPABASE_SERVICE_ROLE_KEY` and `LEAD_INGEST_SECRET` server-only.

## 4. Install, verify, and build

Before production deployment run in an environment with normal npm registry access:

```bash
npm install
npm run content:check
npm run typecheck
npm run build
```

Then use:

- Build command: `npm run build`
- Start command: `npm start`

The sandbox used to prepare v4 could not complete `npm install` because its internal package mirror did not contain `@supabase/ssr@^0.6.1`; production/CI build verification is therefore required.

## 5. Domain and authentication callbacks

Attach the final HTTPS domain to the Node.js app and set `NEXT_PUBLIC_APP_URL` to that exact origin.

In Supabase Auth settings, allow the production origin and the `/auth/callback` redirect used by the app.

## 6. Email

Verify the sending domain/sender in Resend, then set `RESEND_API_KEY` and `EMAIL_FROM`.

Set `LEAD_NOTIFICATION_EMAIL` to the primary internal inbox for new leads. Keep `APPLICATION_CC_EMAIL=jrvsaccad@gmail.com`; v4.7 also guarantees that address is included on lead notifications, while avoiding duplicate delivery when it is already the primary recipient.

## 7. Admin and Recruiter access

Create the first user through normal Supabase Auth, then assign `profiles.role = 'admin'` in the Supabase SQL Editor.

Do not expose Admin or Recruiter as public signup choices.

Promote trusted Recruiters from the Admin Users screen.

## 8. Production acceptance test

Test the following before sending paid or organic traffic:

1. Desktop and mobile public navigation.
2. `/hire` role brief submission without an account.
3. Specific VA profile -> Request introduction -> signup -> client dashboard -> role creation, confirming the VA remains selected.
4. Client company profile and six-step job wizard.
5. Admin job evidence review and private service-fee quote.
6. Client fee acknowledgement and publication.
7. VA profile, test, video, recruiter review, and Admin final approval.
8. Published job application and invitation acceptance.
9. Candidate-specific messaging on desktop and mobile.
10. Pipeline stage update and status history.
11. Candidate comparison.
12. Explicit hire confirmation with final rate/start/schedule.
13. Workroom onboarding, tasks, and conversation link.
14. VA time correction and client approve/request-changes workflow.
15. Client notifications/read state.
16. Admin analytics event capture and role-brief totals.
17. Public metadata, sitemap, robots rules, JobPosting schema, and public-talent Person schema.
18. 404 and error states.

## 9. Main-domain/content migration

v4 contains core service, vetting, pricing, FAQ, legal, contact, specialty, focus-industry, and Philippines buyer-education pages. If WordPress currently owns high-performing service/blog URLs, do not remove it blindly.

Before moving the main domain, verify for every migrated URL:

- equivalent or improved content intent
- title/meta description
- canonical behavior
- heading hierarchy
- internal links
- images/alt text
- structured data where appropriate
- exact 301 redirects for changed slugs
- Search Console indexing/crawl health after launch

Blog content can remain on WordPress until equivalent Next.js pages and redirect mappings are ready.

## 10. Post-launch measurement

Use `/workspace/admin/analytics` to verify page views and tracked conversion actions are arriving.

Use `lead_intake` as the source of truth for submitted role briefs and general enquiries. Add verified business proof only after real metrics, testimonials, fees, and response-time commitments have been approved for publication.
