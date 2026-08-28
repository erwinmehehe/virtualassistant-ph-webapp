# v4.12.3 QA - Canonicals, VA profile routing, recruiter directory, Supabase repair

## Fixes
- Standardized canonical URLs and sitemap entries to no-trailing-slash URLs, matching the site's current Next.js/Vercel routing behavior.
- Service, software, and industry pages retain absolute meta titles so the global brand title template does not append the brand.
- `/va/[slug]` can resolve both current VA slugs and legacy UUID-based links.
- `/talent/[slug]` now resolves the record first and redirects to the current canonical `/va/[slug]` URL instead of blindly redirecting a potentially stale identifier.
- Public talent listings and service candidate cards do not generate profile links when a usable VA slug is missing.
- Recruiter VA directory includes VA accounts even if `va_profiles` is missing/incomplete.
- Recruiter candidate pages no longer 404 solely because the structured `va_profiles` record is missing; recruiters can still see the account and account email.
- Removed an unused `account_status` dependency from recruiter profile queries so older databases do not blank the recruiter directory just because the moderation migration has not yet been applied.

## Supabase migration required
Apply migrations in chronological order. For a production database that has not been updated since the earlier v4.10 release, confirm/apply at least:

1. `20260810_v4105_moderation_and_bans.sql`
2. `20260810_v4106_payment_disputes.sql`
3. `20260810_v4107_avatar_uploads.sql`
4. `20260810_v4108_skill_certifications.sql`
5. `20260813_v4109_vetting_nudge_tracking.sql`
6. `20260813_v4110_paymongo_support.sql`
7. `20260816_v4111_lead_claim_nudges.sql`
8. `20260816_v4112_drop_stale_cc_email.sql`
9. `20260828_v4113_saved_vas.sql`
10. `20260828_v412_launch_hardening.sql`
11. `20260828_v4121_no_va_fees.sql`
12. `20260828_v4123_va_profile_repair.sql`

Do not re-run a migration if it was already applied and is not idempotent. The safest approach is to check Supabase migration history first. The v4.12.3 repair migration itself is intentionally idempotent for missing VA profile/vetting rows and missing slugs.

## v4.12.3 repair migration behavior
`20260828_v4123_va_profile_repair.sql`:
- creates a minimal `va_profiles` row for any `profiles.role = 'va'` account missing one;
- backfills stable VA slugs for imported/older profiles that have no slug;
- creates a default `va_vetting` row for VA profiles that do not yet have one.

This directly addresses recruiter talent-pool links that can otherwise land on a 404 when account/profile records are incomplete.

## QA
- `npm run typecheck`: PASS (using the existing dependency cache from the prior workspace)
- `npm run service:check`: PASS, 74 service pages
- `npm run content:check`: PASS, 170 posts, 0 failures, 0 warnings
