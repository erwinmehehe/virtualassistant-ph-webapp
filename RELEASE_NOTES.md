# v4.12.3 - canonical and VA profile routing repair

- Standardized canonical URLs and sitemap URLs to the site's no-trailing-slash format.
- Kept service/software/industry titles absolute so the brand is not appended to those meta titles.
- Public VA profile routes now resolve legacy UUID links and redirect `/talent/<slug>` to the current `/va/<slug>` route.
- Public/service talent cards ignore records without a usable slug instead of generating broken links.
- Recruiter VA directory now includes VA accounts even when their structured `va_profiles` row is incomplete.
- Recruiter candidate pages show an incomplete-profile state instead of returning 404 when the account exists but its VA profile row is missing.
- Added `20260828_v4123_va_profile_repair.sql` to create missing VA profile/vetting rows and backfill stable profile slugs.

# v4.12.2 — Full `/service/` SEO editorial pass

- Applied the direct, brand-free meta-title format across all 74 `/service/` pages, not only Real Estate.
- Expanded standalone `VA` abbreviations in service meta titles to `Virtual Assistant` for clearer search intent and more natural SERP copy.
- Reworked all service meta descriptions to stay at or below 160 characters and lead with the hiring intent instead of the brand.
- Rewrote service intros around the actual role tasks and operating context rather than a repeated generic SEO paragraph.
- Added role-aware long-form sections covering operating setup, first-30-day onboarding, interview evidence, common hiring mistakes, quality controls, handoff boundaries, and a practical management scorecard.
- Added group-specific guidance for healthcare, legal, finance, lending, insurance, ecommerce, sales/CRM, real estate, home services, creative, technology, hospitality, executive support, recruitment, and other service families.
- Added a permanent `npm run service:check` QA guard for title pattern, brand removal, title abbreviations, meta-description length, service-data depth, and common AI-cliche phrases.
- Source-level content-depth audit estimates roughly 1,980–2,240 words of useful page copy before dynamic talent cards and supporting guide excerpts, depending on the role.

# v4.12.1 — SEO, content depth, Industries UX, and no-VA-fee cleanup

- Rewrote all 74 service-page meta titles to the direct, brand-free pattern `Hire [Service Name] Philippines`.
- Real Estate service title is now exactly `Hire Real Estate Virtual Assistant Philippines`.
- Rewrote all 20 software-page titles to the same direct, brand-free hiring pattern.
- Expanded software landing pages with long-form role design, onboarding, quality-control, security, staffing, and interview guidance; the simPRO page now clears the intended 1,500-word content floor.
- Redesigned `/industries` with stronger hierarchy, clearer client CTAs, cleaner cards, grouped specializations, and responsive mobile layouts.
- Removed the legacy backend model that deducted a platform percentage from VA compensation. VA work invoices now pay the full compensation amount; platform recruiting/placement/managed-service fees remain client-side and separate.
- Updated Terms and Pricing copy to state explicitly that VAs are not charged to join, apply, be vetted, be placed, or receive their agreed compensation.

# v4.10.3 — collision-proof React list keys

- Hardened dynamic category, skill, tool, workflow, and tag rendering so repeated database labels can never produce duplicate React keys.
- This specifically covers repeated labels such as `Administrative Support`, `Lead Generation & Sales`, and `Marketing & Social Media`.
- Existing de-duplication remains in place, while rendered keys now include the sibling index as a final collision guard.
- No database migration is required.

# v4.10.2

React list-key stability hotfix.

- Fixed the homepage duplicate-key warning caused when a VA primary specialty also appeared in the secondary `categories` array.
- Added shared case-insensitive string de-duplication for profile categories, skills, tools, industries, job categories, responsibilities, and review chips before rendering keyed React lists.
- Namespaced JobCard category and skill keys so the same label can safely exist in both groups without colliding.
- Applied the same defensive rendering to public VA/job pages and client, VA, recruiter, and admin workspace views.
- No database migration is required.

# v4.10.1

Review visibility and verified placement feedback.

- Added a server-validated review flow to Client and VA workrooms.
- Added explicit review visibility cards before save and persistent status badges after save.
- Added **Public now**, **Public when profile is live**, and **Contract only** states so users know exactly when a review can appear outside the workroom.
- Public client reviews appear on a VA profile only while that VA is present in the published public directory.
- Reviews written by VAs about clients remain contract-only.
- Added a public-safe `public_va_reviews` view that exposes no client identity, company, job, or workroom data.
- Added verified client-review cards and aggregate rating markup to public VA profiles.

Apply `supabase/migrations/20260810_v4101_review_visibility_ui.sql` before deploying this release.

# v4.10.0

## Marketplace UX, public profile privacy, and guided onboarding

- Public VA discovery now requires **2+ years of professional experience** in addition to approval, availability, and public opt-in. The public database view masks legal names to first name + last initial and no longer exposes portfolio/LinkedIn URLs that could reveal a legal identity outside the hiring workflow.
- Public VA profiles now use `/va/<slug>` as the canonical route; legacy `/talent/<slug>` links redirect automatically.
- Rebuilt the public VA profile layout with a clearer overview, skills, tools, industries/languages, vetted milestones, working-fit sidebar, and introduction CTA.
- Rebuilt `/find-talent` cards and compressed desktop filters into a single toolbar; Apply is intentionally one line.
- Added **Jobs** as a top-level public navigation item and rebuilt `/jobs` with compact filters and scannable role cards.
- Added readable job slugs such as `/jobs/j-executive-assistant-founder`; old UUID job URLs redirect to the canonical slug when available.
- Rebuilt public job detail pages with compensation, hours, timezone, responsibilities, skills/tools, working setup, onboarding, save, and application states.
- Added an onboarding checklist to both Client and VA workspace overviews.
- Added a weighted VA profile-strength meter on the VA overview and a live-updating version inside the profile editor.
- Reorganized the VA profile editor into five focused sections with explicit privacy/public-discovery rules.
- Replaced the client job form with a **4-step wizard**: Role & skills → Scope & schedule → Budget & support → Review. Includes skill/tool chips, budget guidance, local autosave, server-side draft saving, and a final review screen.
- Added homepage modules for experienced featured VAs, the guided client/VA workflows, and latest reviewed jobs.

## Database migration

Apply `supabase/migrations/20260810_v410_public_profiles_job_slugs.sql` before deploying this version.

---

# v4.9.2

- Added recruiter role matching for pending/published jobs at `/workspace/recruiter/matching`, using `matchAssessment` across the full approved/bench VA pool before applications exist.
- Added the same ranked VA-pool matching view to each Admin job review, including match score and assessment-confidence percentages.
- Added staff-curated internal and released shortlists that do not create fake applications.
- Added per-job candidate access controls with `locked`, `requested`, `quoted`, `invoiced`, `paid`, and `comped` states plus a configurable access fee and payment reference.
- Client applicant identity, private profile evidence, resume links, comparison, messaging, pipeline actions, and hire controls remain locked until candidate access is paid or comped.
- Client-facing locked states still show anonymized applicant counts and match scores, preserving useful hiring signals without exposing identity.
- Hardened Supabase RLS so the privacy rule is enforced at the database layer, not only hidden in the UI.
- Application notifications/emails no longer reveal the applicant name before client candidate access is active.
- VA-to-client message notifications are anonymized while access is locked, and the migration scrubs legacy application/message notification text that could reveal candidate identity.
- Existing confirmed hires/workrooms are automatically grandfathered as comped access by the migration so active relationships are not broken.
- Added a default candidate-access fee setting under Admin -> Marketplace settings.
- Requires `supabase/migrations/20260810_v492_matching_candidate_access.sql`.
- Online card checkout is not added in this release; Admin can quote/invoice/record paid or comped access, leaving a clean entitlement boundary for a later Stripe/payment integration.

# v4.8.3

- Compacted the `/hire` form to reduce visual weight and first-step friction.
- Kept the core matching inputs visible while moving name and company into an optional expandable row.
- Put hours, budget, timezone, and start timing into compact two-column rows on larger screens.
- Reduced form padding, input height, textarea height, helper copy, and button height.
- Shortened the supporting copy beside the form and reduced the trust list to the two most useful points.
- No database migration is required.

# v4.8.2

- Simplified the public desktop navigation to four primary links plus a compact Resources menu.
- Moved How vetting works, Blog, and VA jobs into Resources to reduce header crowding without removing access.
- Increased the desktop collapse breakpoint so medium-width screens switch to the compact menu before the header feels cramped.
- Kept Log in, Join, and Hire a VA as the primary conversion actions.

# v4.8.1

- Fixed successful logins falling back to the public homepage when a workspace profile row was missing.
- Added server-side profile recovery for legacy Client and VA accounts using existing signup metadata.
- Authentication callbacks now fall back to the correct role dashboard instead of `/`.
- Workspace guards now return a clear account-role error instead of silently redirecting to the homepage.
- Added `20260810_auth_profile_repair.sql` to backfill existing authenticated users that have valid role metadata but no profile row.

# v4.7.0

- Split account creation into dedicated Client and VA signup pages.
- Added a clear two-choice `/auth/join` account selector and Join dropdown in the public header.
- Redesigned the public footer to be more compact and conversion-focused.
- Match requests and role briefs now create private pending job drafts automatically.
- New and existing client accounts can claim lead-created job drafts using the matching email address.
- Added lead notification email coverage for service/blog match requests, role briefs, contact leads, and lead API ingestion.
- `jrvsaccad@gmail.com` is included on all lead notifications when email delivery is configured.
- Preserved the USD 5/hour minimum and the entire v4.6 long-form content system.
- No new database migration is required from v4.6.0.

# v4.6.0

## Editorial quality release

- Retains all 170 v4.5 article URLs.
- Replaces runtime article-copy factories with explicit finished article bodies.
- Raises every article above the 1,000-word requirement, with a release minimum of 1,281 words before page chrome.
- Adds six FAQs to every article and FAQ structured data.
- Adds at least five curated internal links to every article, including contextual in-body next reads.
- Improves service-cluster, topic-hub, industry, tool, and conversion-path internal linking.
- Removes repeated filler notes and common robotic marketing phrases.
- Adds `npm run content:check` as an automated regression gate.
- Preserves the v4.5 USD 5/hour marketplace minimum and blog funnel analytics.
- Requires no database migration when upgrading from v4.5.0.

---

# v4.5.0

## Marketplace quality, blog SEO, CRO, and attribution

- Changed the ongoing hourly marketplace floor from USD 6.00 to **USD 5.00**. Exactly USD 5.00 is valid; USD 4.99 or lower is rejected.
- Enforced the floor in UI inputs, job server actions, publication checks, VA rates, final hire confirmation, admin defaults, database checks, and the atomic hire transaction.
- Added 170 article URLs across 10 topic hubs and 36 service-linked clusters.
- Built the requested deep SEO, Medical, and Legal/Law Firm article clusters.
- Preserved known live legacy article URLs and separated transactional homepage intent from the informational Philippines hiring guide.
- Added hero, inline, bottom, and service-match CRO modules across blog content.
- Added service-to-blog and blog-to-service internal linking.
- Added author pages, editorial review signals, and an Editorial Policy.
- Reworked high-stakes SSS/PhilHealth/Pag-IBIG, HIPAA, confidentiality, and legal-intake copy with official/primary-source references and clear scope notes.
- Added VA agency/freelancer, Upwork/agency, OnlineJobs.ph/agency, VA/employee, VA/BPO, and Philippines/India comparison guides.
- Added cost, hourly-to-monthly, job-description, and VA-role-finder tools.
- Added first-party blog-to-qualified-lead session attribution and an admin content funnel.
- Added `lead_intake.session_id` for source-to-lead continuity.
- Kept the correct public brand/domain `VirtualAssistant.com.ph` / `https://virtualassistant.com.ph`.
- Kept application source free of em dashes and en dashes.

## Required migrations from v4.4.0

1. `supabase/migrations/20260809_v45_minimum_rate.sql`
2. `supabase/migrations/20260809_v45_blog_funnel.sql`

See `IMPLEMENTATION_SUMMARY.md` and `BLOG_CONTENT_MAP.md` for the full inventory.

---

# v4.4.0

## Service-page CRO upgrade

- Added a compact free match request form inside every service-page hero.
- Added relevant approved VA profiles directly below the hero.
- Added profile and candidate-specific introduction CTAs to service talent cards.
- Added an in-place success state for service match requests.
- Connected service match requests to the existing `lead_intake` table.
- Reduced first-step form friction to four buyer inputs.
- Reworked deep-page conversion CTAs to return to the hero match request.
- Expanded analytics allowlisting for service browse, match, profile, and introduction events.
- Added responsive layouts for the new match form and talent-first section.

No new database migration is required from v4.3.0 to v4.4.0.

# v4.3.0

## Service landing-page CRO, copy, and UX refresh

- Corrected the public brand and structured-data provider name to `VirtualAssistant.com.ph`.
- Kept canonical URLs on `https://virtualassistant.com.ph` and aligned public metadata with the correct domain.
- Rebuilt the shared `/service/[slug]/` template so all 62 service pages inherit the improved hierarchy and conversion flow.
- Upgraded the hero from a generic outcomes card to a concrete delegation panel with role tasks, best-fit business types, scope guidance, and stronger CTA context.
- Added a sticky in-page navigation for Talent, Responsibilities, Tools & Skills, Hiring Process, Interview Guide, and FAQs.
- Added a three-part hiring safeguards strip covering approved profiles, private role briefs, and confirmed terms before hire.
- Improved responsibility cards, tool/skills presentation, best-fit team cards, role-brief guidance, compliance callouts, cost guidance, and final CTAs.
- Added bespoke law-firm copy around intake, matter setup, calendars, document organization, billing administration, case-management updates, client follow-up, confidentiality, supervision, and legal decision boundaries.
- Removed em dashes from product and public-facing source copy.
- Kept service SEO titles at 60 characters or fewer after correcting the brand.
- No database migration is required when upgrading from v4.2.0.

## Verification

- All TypeScript and TSX source files parse with zero syntax errors.
- No legacy brand references remain in application source.
- No em dash characters remain in application source.
- The existing 62 service pages and 21 industry pages are preserved.

---

# v4.2.0

## Service and industry SEO expansion

- Added the 38 exact `/service/.../` URLs supplied for the current VirtualAssistant.com.ph service taxonomy.
- Added 24 additional niche service pages informed by Semrush commercial-intent research, including Credit Repair, Insurance, Medical Billing, Mortgage, Roofing, Financial Advisor, Payroll, Law Firm, Paralegal, eBay, Sales, Appointment Setter, Cold Calling, Google Ads, QuickBooks, Medical Scribe, Mental Health, HVAC, Construction, Podcast, Short-Term Rental, Dental Billing, Content Marketing, and Web Developer virtual assistants.
- Expanded the service SEO layer to 62 unique landing pages total.
- Added 21 industry pages, including focused pages for small businesses, doctors/medical practices, law firms, real estate agents, financial advisors, startups, construction companies, insurance agencies, property managers, accountants/CPAs, coaches, dental practices, photographers/creatives, entrepreneurs, real estate investors, ecommerce stores, therapists, and banking/financial services.
- Clustered close keyword variants on one industry URL to reduce cannibalization (for example lawyers/attorneys/law firms and doctors/medical office/medical practice).
- Added role-specific metadata, canonical URLs, Service + FAQPage + BreadcrumbList JSON-LD, long-form hiring copy, task coverage, tools, skills, interview questions, cost guidance, FAQs, approved-talent blocks, and conversion CTAs.
- Added bidirectional internal linking between service pages and relevant industry guides.
- Rebuilt `/services` as a grouped 60+ role directory and `/industries` as an industry-intent directory.
- Updated the sitemap to include canonical `/service/` and `/industries/` URLs.
- Added permanent redirects from the temporary v4.1 `/virtual-assistant-services/...` URLs to the corresponding `/service/...` canonical pages.
- Added Industries to the primary public navigation.
- No database migration is required when upgrading from v4.1.0.

## Verification

- All 38 supplied service slugs are present exactly.
- All Semrush-added service slugs and all related-page references resolve.
- 108 TypeScript/TSX source files parse with zero syntax errors.
- Service title tags are <= 60 characters; service meta descriptions are approximately 139-165 characters.
- Industry title tags are <= 58 characters; industry meta descriptions are approximately 143-165 characters.
- Full `tsc`/Next build still requires project dependencies to be installed; the sandbox archive does not contain `node_modules`.

---

# v4.1.0

## SEO service landing pages
- Rebuilt all 13 virtual-assistant specialty pages as long-form transactional SEO landing pages.
- Added exact-intent metadata such as `Hire SEO Virtual Assistant Philippines`, natural-language H1s, canonical URLs, Open Graph/Twitter metadata, and hourly ISR caching.
- Added role-specific responsibilities, tool lists, skills, hiring levels, business use cases, job-description guidance, interview questions, cost factors, FAQs, and related-service internal links.
- Added `Service`, `FAQPage`, and `BreadcrumbList` JSON-LD to every specialty page.
- Added approved specialty talent cards when public directory data is available, with graceful static fallback when Supabase is unavailable during rendering.
- Upgraded the `/services` index with richer category copy, task tags, and direct internal links to every long-form service page.
- Added responsive styles for long-form service layouts, tools, FAQ, interview, role-type, related-service, and CTA sections.
- No database migration is required for v4.1.0 when upgrading from v4.0.

---

# v4.0.0

Conversion, product-safety, responsive UX, content, and measurement release.

## CRO and buyer journey

- Repositioned the homepage around the buyer outcome: hiring vetted virtual assistants from the Philippines.
- Added a no-account two-minute role brief at `/hire`.
- Preserved a selected VA from public profile -> role brief -> signup -> client job creation.
- Replaced the ambiguous public `Join` CTA with explicit buyer and VA paths.
- Reworked Pricing and Services to explain the service model without fabricating public fee amounts.
- Added privacy-focused first-party CTA/page-view tracking, server-side completed-signup events, and a private Admin analytics screen.
- Added explicit success feedback to major conversion and pipeline actions.

## Public UI, UX, and accessibility

- Added functional mobile navigation instead of hiding all public nav links below 960px.
- Added global focus-visible treatment and a skip-to-content link.
- Increased primary button contrast.
- Added responsive table behavior for compact screens.
- Preserved wizard labels on tablet/mobile.
- Improved empty states, status language, and information hierarchy.

## Talent discovery

- Added directory search, category, tool, experience, hours, overlap, and sort controls.
- Secondary categories now participate in filtering.
- Expanded public talent profiles with safe vetted evidence.
- Reworked matching so missing availability does not receive match points.
- Added match-confidence context and replaced percentage-style fit claims with score labels.
- Requested VAs are prioritized and labeled in client recommendations.

## Signup and onboarding

- Public account creation requires an explicit Client or VA choice unless intent is already known.
- Auth redirects preserve the visitor's intended destination.
- Client signup from a selected VA preserves that selection.
- Rebuilt the job wizard with validation, local autosave, draft support, explicit service-model context, and requested-VA support.

## Candidate review and hiring safety

- Candidate message buttons now open the correct application conversation.
- Added persisted application stage history.
- Added 2-to-4 candidate comparison view.
- Removed `Hired` from normal pipeline status menus.
- Hiring now requires a separate confirmation with final hourly rate, start date, agreed schedule, and acknowledgement, committed atomically with workroom/onboarding creation.
- Past start dates are rejected.
- Workrooms are populated with confirmed hire terms.

## Messaging and notifications

- Rebuilt mobile messaging as a conversation-list/detail flow.
- Users can switch conversations on mobile instead of losing the thread list.
- Added thread read-state updates and client notification controls.
- Invitations and stage changes create clearer notifications.

## Vetting and Admin review

- Admin final approval moved from a summary-row action to a full evidence review page.
- Final evidence includes profile, private resume, skills-test answers/scores, private video, recruiter scorecard, and first-pass interview record.
- Final approval, return, or rejection requires a written review note.
- Added detailed client-job review before fee quote or return-for-edits actions.

## Post-hire workroom

- Added confirmed hourly rate, start date, and agreed schedule to the workroom.
- VAs can edit or delete unapproved time entries.
- Clients can approve time or request changes with a note.
- Approved time is protected from normal VA deletion.

## Content and SEO

- Replaced the old specialty-list Services page with a true service-model page.
- Added `/how-vetting-works`, `/pricing`, `/faq`, `/about`, `/contact`, `/privacy`, and `/terms`.
- Added 13 specialty landing pages under `/virtual-assistant-services/[slug]`, three focus-industry guides under `/industries/[slug]`, and a stereotype-resistant `/why-philippines` hiring guide.
- Added richer metadata, dynamic talent/job metadata, sitemap, robots rules, JobPosting structured data, and Person structured data for public talent profiles.
- Expanded footer navigation and reduced internal marketplace jargon in client-facing copy.

## Security and workflow integrity

- Moved sensitive job, application, invitation, hiring, workroom, and read-state mutations behind server-side role/ownership checks.
- Removed broad authenticated update policies that could otherwise bypass product workflow rules through direct API calls, including profile mutations that now pass through validated server actions.
- Invitations now require a published role and a currently approved public-directory VA.
- Material changes to an approved VA public profile remove it from discovery and trigger re-review; a primary-specialty change also requires the current category test and a fresh recruiter scorecard.
- Time-entry insert policy forces new VA logs into `pending`; approval/review remains client-controlled through server actions.

## Database changes

Run `supabase/migrations/20260809_v4_product_cro.sql` when upgrading an existing v3.1 database.

The migration adds:

- `jobs.requested_va_id`
- confirmed hire fields on `workrooms`
- `analytics_events`
- `application_status_history`
- time-entry review fields/status constraint
- workflow-integrity RLS hardening that keeps sensitive state mutations behind verified server actions

## Verification note

The source was statically reviewed after the implementation. A normal `npm install` / Next.js production build could not be completed in the audit sandbox because its internal package mirror does not contain `@supabase/ssr@^0.6.1`. Run `npm install`, `npm run typecheck`, and `npm run build` in the production/CI environment before deployment.

# v3.1.0

Recruiting operations and vetting foundation release.

- Structured VA profile and private resume gating.
- Category-specific skills tests and server-side objective scoring.
- Required private video introduction.
- Recruiter claiming, first-pass interview, and five-part scorecard.
- Separate Admin final approval.
- Approved talent pool and category coverage tracking.
- Curated Placement and Managed VA Service models.
- Private service-fee review before publication.
- Client applications, messaging, and workrooms.

## v4.9.0 — UX/CRO and workspace polish

- Reworked the VA and client Messages empty state so zero-thread accounts no longer render a large blank two-pane inbox. Added compact guidance, useful next actions, and a proper conversation count badge.
- Aligned workspace topbar and page content to the same inner grid, tightened authenticated-page spacing, and reduced the desktop sidebar footprint.
- Simplified the public navigation to Find VAs, Services, Pricing, and Resources, with one primary Get matched action and no separate desktop Join decision.
- Removed the redundant homepage proof strip and repeated vetting section. The homepage now moves from hero to live approved talent, process, service choice, FAQ, and the supply-side VA CTA.
- Standardized public conversion language around Get matched and Browse VAs.
- Tightened global section, hero, card, and mobile spacing tokens so spacing changes remain consistent across pages.
- Reorganized Services into eight workload categories with jump navigation and a Not sure which role fits? path instead of presenting one long undifferentiated directory.
- Made Pricing expose configured placement and managed-service defaults when available, while keeping VA compensation separate and retaining the existing cost calculator. No fee numbers are invented when settings are not configured.
- Added compact industry-specific lead forms with workflow chips, a clearer post-submit promise, realistic interview scenarios, tools, access boundaries, and hiring mistakes.
- Removed SEO-internal language from the Industries index and replaced it with buyer-facing workflow guidance.
- Larger product additions such as third-party calendar sync and invoicing/payment processing remain intentionally out of this release because they require integration credentials and commercial workflow decisions.

## v4.12.0 — Marketplace launch hardening

- Guided first-login client onboarding now routes brand-new clients through company, hiring-needs and budget setup before the first job post.
- VA public eligibility is quality-gated through the privacy-safe public directory view (photo, headline, summary, skills, availability, rate, resume and approved vetting).
- Job wizard now includes experience level in addition to rate range, hours, timezone, skills, category, description, onboarding plan and final preview.
- Client applicant pipeline, saved VAs/jobs, paid candidate-access controls, protected messaging and recruiter/admin moderation are retained and hardened.
- Talent search adds rate, timezone/schedule, portfolio-only and newest-profile filtering/sorting.
- Public directory trust signals now include email verification, identity verification and recent activity when available.
- Client company profiles now support company description, location, hiring needs and logo URL.
- Google/Microsoft social login, Turnstile support and server-side action rate limits improve authentication and abuse resistance.
- Message attachments, unread states, conversation protections and transactional message email notifications are enabled.
- Added server-side product funnel events for applications, shortlist/interview decisions, hires, candidate views, unlock requests, job lifecycle and payment completion.
- Stripe and PayMongo payment webhooks now emit payment-completed analytics and best-effort receipt emails.
- Role-aware header CTAs: clients see Post a job; VAs see Browse jobs.
- Launch migration: `supabase/migrations/20260828_v412_launch_hardening.sql`.
