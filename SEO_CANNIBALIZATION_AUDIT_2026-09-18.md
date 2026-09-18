# Service / Blog Cannibalization Audit — 2026-09-18

## Scope

This audit separates the canonical service money pages from supporting editorial content. Current structured blog posts are allowed to target adjacent intents such as cost, interview questions, tasks, job descriptions, tools, comparisons and hiring education, but they must not reuse the exact service-page title.

## Current structured corpus

- Canonical service pages remain the primary commercial landing pages for role + Philippines queries.
- Service-linked blog posts keep explicit informational modifiers such as **Cost**, **Interview Questions**, **Hiring Guide**, **Tasks**, **Job Description**, **Tools**, **What Does**, or comparison language.
- The legacy-path ecommerce hiring guide now uses **Ecommerce VA Hiring Guide | Philippines** instead of a money-page-style title.
- CI now fails if a structured blog meta title exactly duplicates a service meta title.

## High-risk legacy/archive overlaps

Do not redirect these blindly. Check Google Search Console impressions, clicks, top queries, backlinks and conversions first.

| Legacy/archive URL | Main overlap | Recommended decision after GSC |
|---|---|---|
| /blog/seo-virtual-assistant-philippines-guide | /service/seo plus newer SEO guides | Likely merge/301 if the archive has no unique rankings or links |
| /blog/medical-virtual-assistant-philippines-guide | /service/medical-virtual-assistant plus newer medical guides | Likely merge/301 after GSC/backlink review |
| /blog/hiring-real-estate-virtual-assistant-philippines | /service/real-estate plus newer real-estate hiring content | Likely merge/301 if the newer cluster owns the same queries |
| /blog/how-to-hire-ecommerce-virtual-assistant | /hire-ecommerce-virtual-assistant-philippines and /service/ecommerce | Consolidate to one informational hiring guide if both target the same queries |
| /blog/virtual-assistant-hourly-rate-philippines | /average-hourly-rate-virtual-assistants-philippines | Strong merge candidate if the newer rate guide has equal or better performance |
| /blog/virtual-assistant-outsourcing-guide | /outsourcing-philippines-virtual-assistant | Strong merge candidate if query sets overlap |
| /blog/how-to-hire-a-virtual-assistant-philippines | /blog/hire-virtual-assistant-philippines | Strong merge candidate if the newer guide has replaced the old intent |
| /blog/filipino-vs-indian-virtual-assistant | /blog/philippines-vs-india-virtual-assistants | Near-duplicate comparison intent; keep one primary URL after GSC/backlink review |
| /blog/how-much-to-pay-a-filipino-virtual-assistant-2026-guide | current pricing/rate guides | Merge if it has no unique compensation queries |
| /blog/hire-healthcare-virtual-assistant-philippines | healthcare industry and medical service pages | Reposition or merge if it competes for the same hiring query |
| /blog/virtual-assistant-services-philippines-guide | homepage/services hub and broad hiring guides | Keep only if it has a clearly distinct informational query set |

## Decision rule

For an older archive article, prefer **merge + 301** when it has near-zero clicks/impressions, no meaningful referring domains, no conversions and the same query intent is already covered by a stronger canonical page. Keep or improve pages that still rank for distinct useful queries.

The August 9, 2026 structured content batch should not be removed solely for low impressions yet; it has not had a long enough observation window for a fair pruning decision.
