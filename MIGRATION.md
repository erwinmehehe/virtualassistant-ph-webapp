# v4.10.1 review visibility

After the v4.10 public-profile/job-slug migration, apply:

```text
supabase/migrations/20260810_v4101_review_visibility_ui.sql
```

This creates the verified `reviews` table, contract-party RLS, server-only write posture, and the public-safe `public_va_reviews` view. Public review visibility is automatically tied to whether the reviewed VA currently has a published directory profile.

# v4.10.0 marketplace migration

Apply this migration once before deploying v4.10.0:

```text
supabase/migrations/20260810_v410_public_profiles_job_slugs.sql
```

It adds readable public job slugs and a slug trigger for every job-creation path, backfills existing jobs with clean `j-...` slugs (using numeric suffixes only for collisions), and hardens the public VA directory so only approved/bench, available, opted-in VAs with 2+ years of experience are exposed. Public names are reduced to first name + last initial, and identity-revealing external profile URLs are nulled in the anon-readable view.

Legacy `/talent/<slug>` web routes are redirected by the application to canonical `/va/<slug>` pages; no extra database migration is required for that redirect.

---

# v4.9.2 matching and candidate-access migration

Apply this migration once before deploying v4.9.2:

```text
supabase/migrations/20260810_v492_matching_candidate_access.sql
```

It adds staff-curated pre-application shortlists, a per-job candidate-access entitlement/fee record, a default candidate-access fee in Admin settings, and RLS that prevents clients from directly reading applicant identities/messages/resumes until access is `paid` or `comped`. Existing jobs with a confirmed hire/workroom are grandfathered as `comped`. It also anonymizes legacy in-app application/message notifications so old notification text cannot bypass the new gate.

After migrating, set your normal default under **Admin -> Marketplace settings -> Default candidate access fee**. Recruiters can rank/release matches, but only Admin controls candidate-access billing status.

---

# v4.8.1 authentication repair

Apply this migration once in Supabase before or with the deployment:

```text
supabase/migrations/20260810_auth_profile_repair.sql
```

It backfills workspace profiles for existing authenticated users whose Client/VA role is already present in signup metadata. The application also self-repairs these accounts on successful authentication when the service-role key is configured.

---

# Migration plan to VirtualAssistant.com.ph v4.7.0

## From v4.6.0

No database migration is required for v4.7.0. The existing `lead_intake.client_id`, `lead_intake.job_id`, `jobs.lead_id`, nullable `jobs.client_id`, analytics tables, and USD 5/hour constraints already support the new workflow.

Add or confirm these email variables in production:

```text
RESEND_API_KEY=
EMAIL_FROM=
LEAD_NOTIFICATION_EMAIL=
APPLICATION_CC_EMAIL=jrvsaccad@gmail.com
```

`LEAD_NOTIFICATION_EMAIL` is the primary internal lead inbox when configured. `jrvsaccad@gmail.com` is always copied on lead notifications; if it is also the primary recipient, the email is sent once to avoid duplicate delivery.

Then deploy normally:

```bash
npm install
npm run content:check
npm run typecheck
npm run build
```

## From v4.4.x or earlier

Apply the v4.5 database migrations before deploying v4.7:

1. `supabase/migrations/20260809_v45_minimum_rate.sql`
2. `supabase/migrations/20260809_v45_blog_funnel.sql`

The first migration establishes the USD 5.00/hour floor for new/updated hourly records. The second adds the content-funnel analytics support used by the blog CRO system.
