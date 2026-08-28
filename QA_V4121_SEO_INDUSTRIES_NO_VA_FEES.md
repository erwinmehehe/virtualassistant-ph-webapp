# QA Report — v4.12.1 SEO / Industries / Software Content / No VA Fees

## Requested changes

### Service meta titles
- Updated all **74** service-page meta titles.
- New pattern: `Hire [Full Service Name] Philippines`.
- Brand name removed from service meta titles.
- `/service/real-estate/` is now exactly: **Hire Real Estate Virtual Assistant Philippines**.
- “VA” abbreviations in titles are expanded through each page's canonical full service name.

### Thin service/software content
- Existing service pages already use the expanded long-form service template; the template plus role-specific page data is designed to land around the requested 1,500–2,000-word range.
- Expanded **all 20 software pages**, not only simPRO, with substantive sections covering:
  - what the software VA should own,
  - process handoffs,
  - a four-week onboarding plan,
  - quality-control metrics,
  - communication and escalation,
  - access/security,
  - part-time vs full-time staffing,
  - fit / non-fit criteria,
  - interview evaluation,
  - a direct hiring CTA.
- Rough lower-bound content estimate for the simPRO page is **1,500+ words** once the shared long-form copy, simPRO-specific data, workflow lists, FAQ content, and fixed template content are rendered.
- simPRO meta title is now **Hire simPRO Virtual Assistant Philippines**.

### Industries page redesign
- Rebuilt `/industries` as a marketplace landing page instead of a plain card directory.
- Added:
  - stronger two-column hero,
  - direct **Hire a Virtual Assistant** CTA,
  - direct **Post a Job** CTA,
  - trust/proof row,
  - industry directory stats,
  - cleaner cards with workflow chips,
  - specialized-guide grouping,
  - secondary conversion section,
  - responsive tablet/mobile styles.
- Removed the oversized repeated “View industry guide” button treatment; cards now use lighter text-link navigation so the CTA hierarchy stays focused on hiring/posting a job.

### VA fee cleanup — content and backend
- Removed the legacy payout deduction behavior.
- `createInvoiceAction` now records `platform_cut_percent: 0` and no longer accepts a platform-cut field from the admin form.
- Admin payment UI now shows the full invoice amount as the VA payout and explicitly says **No platform deduction**.
- Added migration `20260828_v4121_no_va_fees.sql`:
  - changes the legacy `platform_cut_percent` default to `0`,
  - normalizes existing rows to `0`,
  - changes `va_payout_view` so `payout_amount = amount_total`.
- Terms now state that VAs are **not charged** to:
  - create a profile,
  - apply for jobs,
  - be vetted,
  - accept a placement,
  - receive their agreed compensation.
- Client recruiting, candidate-access, placement, and managed-service fees remain separate client-side charges.
- Pricing page now states the same model clearly.

## Automated checks

- `npm run typecheck` — **PASS**
- `npm run content:check` — **PASS**
  - 170 blog posts
  - 0 failures
  - 0 warnings
  - average article length: 1,527 words

## Deployment note

Apply the new migration after the previous v4.12 migrations:

`supabase/migrations/20260828_v4121_no_va_fees.sql`

The project package intentionally excludes `node_modules` and local secret files.
