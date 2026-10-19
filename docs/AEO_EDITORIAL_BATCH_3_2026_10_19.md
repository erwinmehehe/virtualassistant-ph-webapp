# VAPH AEO editorial refresh: Batch 3 (19 October 2026)

## Purpose and selection

Extend the approved answer-first editorial format from PRs #940 and #942 to **12 distinct existing articles** in the original VAPH editorial corpus. This pass prioritizes hiring evaluation, cost interpretation, and concrete customer-service, ecommerce, executive, SEO, finance and healthcare workflow handoffs. Selection is based on topical and user-intent coverage, **not** unverified rankings or Search Console traffic.

| Article slug under /blog/ | Audience | Distinctive addition |
| --- | --- | --- |
| `hire-virtual-assistant-philippines` | Employer | Three-outcome role brief and evidence-based 30-day review |
| `average-hourly-rate-virtual-assistants-philippines` | Employer | Snapshot/sample limitations and like-for-like rate budgeting |
| `onlinejobs-ph-vs-virtual-assistant-agency` | Employer | Hiring responsibility matrix and coverage handoff |
| `customer-service-tasks` | Employer | Triage sheet, refund authority and escalation limits |
| `customer-service-interview-questions` | Employer | Fictional damaged-order assessment and fair scoring |
| `executive-virtual-assistant-tasks` | Employer | Calendar approval tiers and meeting action register |
| `ecommerce-tasks` | Merchant | Order-exception checklist and margin-sensitive decisions |
| `amazon-virtual-assistant-tasks` | Merchant | Seller Central audit trail and account-owner boundaries |
| `shopify-virtual-assistant-tasks` | Merchant | Product-upload brief, permission and payment safeguards |
| `seo-interview-questions` | Employer | Fictional Search Console exercise without ranking promises |
| `bookkeeping-tasks` | Finance owner | Reconciliation handoff and qualified approval gates |
| `medical-virtual-assistant-tasks` | Practice owner | Non-clinical referral handoff and protected patient communications |

## Content changes

- Every article gets a unique editor-written 45–85-word `quickAnswer` and relevant `quickAnswerQuestion`.
- All existing sections gain contextual `questionHeading` text. Original `heading` values and canonical anchor IDs remain **unchanged**.
- Two specific, practical paragraphs per article (24 in total), one extra reader-facing FAQ per article (12), and one relevant contextual internal link per article (12).
- Removed an existing duplicate `/service/ecommerce` link from the ecommerce tasks guide.
- Preserved article titles, SEO metadata, canonical slugs, `publishedAt`, `updatedAt`, bylines, takeaways, disclosures, and existing linked sources. Dates have not been artificially refreshed.
- No new pages, invented statistics, platform-fee promises, AI-citation claims, testimonials, or new structured-data eligibility claims.

## Editorial and regulatory checks

- **Rate article:** The September 22, 2026 first-party profile sample is identified as self-reported preferred rates from 93 rate-reporting profiles, not a representative wage survey or guaranteed price. Verify the underlying research report before promoting or updating numerical findings.
- **OnlineJobs.ph comparison:** No invented subscription prices, service promises, endorsement, or replacement terms; independently verify each provider's live terms at publication.
- **Healthcare:** Non-clinical scope only. Urgent patient concerns go to the practice's authorized professionals. Check privacy, access roles, transmission and jurisdiction requirements with the practice.
- **Bookkeeping:** Evidence preparation only; tax treatment, journal approvals, filing and payment decisions remain with qualified authorized staff.
- **SEO/marketing:** Avoid guarantees of search visibility, traffic or business outcomes; high-impact publication and outreach remain subject to owner approval and applicable consent.
- **Ecommerce:** Product, account, refund and platform-policy decisions require explicit merchant authority and current marketplace-rule review.

## QA and release gates

1. Run exact-head CI, `npm test`, typecheck, content checks, production build, CodeQL, all-role and browser/database contracts. Inspect any failures; never disable guards to force a green check.
2. Render all 12 article URLs at desktop and mobile widths. Verify one H1, each visible Quick Answer, stable section anchors, complete FAQs, meta title/description, canonical and internal links.
3. Confirm visible FAQs agree with FAQ JSON-LD; do not add schema for content hidden from readers.
4. Complete a human editorial and legal/privacy read for the numerical rate sample, marketplace comparison, finance and medical copy before labeling publication final.
5. Use actual Search Console query-page exports to establish matched 28-day traffic/CTR baselines, when available. No GSC data was provided for the selection, so no performance gain is asserted.

## Measurement boundary

This is a content-quality and information-architecture change, not a guaranteed improvement in search rankings, AI answers, applicant volume, or hiring conversions. Preserve original dates and attribution; record any approved editorial re-review date separately from the original publication date.
