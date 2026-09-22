# Volume-Backed SEO Expansion Design

## Goal

Expand VirtualAssistant.com.ph into uncovered AU, US, and PH search demand while preserving one canonical owner per intent and leaving the homepage unchanged.

## Source data

The September 22 keyword workbooks are the decision source:

- `virtual-assistant_all-keywords_au_2026-09-22.xlsx`
- `virtual-assistant_all-keywords_us_2026-09-22.xlsx`
- `virtual-assistant_broad-match_ph_2026-09-22.xlsx`

The eight role clusters already added on this branch have measurable demand and existing canonical service owners: General, Small Business, Payroll, Operations, Calendar Management, Airbnb, Pinterest, and Content Writing Virtual Assistants. Each service page remains the commercial owner. Its generated resource pages cover definition, tasks, hiring, interviews, costs, and tools without creating another money page.

## Canonical ownership decisions

| Demand family | Evidence | Canonical decision |
| --- | ---: | --- |
| Virtual Assistant services | 11,880 combined volume, KD 16 minimum | Strengthen `/services` |
| Hire a Virtual Assistant | 10,320 combined volume | Strengthen `/hire` |
| Virtual Assistant pricing and cost | Multiple commercial variants, including 650 for `virtual assistant cost` and 410 for `virtual assistant pricing` | Strengthen `/pricing` and keep existing cost guides separate |
| Virtual Assistant companies and agencies | 3,050 combined volume for `virtual assistant companies` plus strong variants | Keep `/virtual-assistant-companies-philippines` as provider-comparison owner |
| Outsource or offshore Virtual Assistant | Commercial variants including `outsource virtual assistant` at 1,180, `virtual assistant outsourcing` at 790, and `offshore virtual assistant` at 420 | Strengthen `/outsourcing-philippines-virtual-assistant`; do not add synonym pages |
| Browse or find talent | Commercial variants including `find a virtual assistant` at 330 | Strengthen `/find-talent` without exposing private candidate data |
| Email Management Virtual Assistant | 710 for the head term plus related variants, KD 10 to 15, commercial CPC | Add `/service/email-management-virtual-assistant`; keep `/service/admin-inbox` focused on broad administrative support |
| Event Planning Virtual Assistant | At least 160 combined across close variants, low KD, commercial CPC | Add `/service/event-planning-virtual-assistant` |
| HR, project management, call center, BPO, 24/7, offshore, city, and price adjectives | Demand exists but intent is already owned or is a delivery model, synonym, or modifier | Deepen existing pages only; no new URL |
| Squarespace, trucking, cleaning business, and other small gaps | Isolated low-volume terms without enough corroborating demand for this pass | Defer until more evidence appears |

## Page and linking architecture

- `/services` acts as the complete service-discovery hub and links to the new and newly deepened role pages.
- `/hire` owns the transactional hiring brief and links to services, pricing, provider comparison, outsourcing guidance, and approved talent.
- `/pricing` owns service-model pricing and links to cost research, role-cost resources, outsourcing guidance, and hiring.
- `/find-talent` owns the recruiter-reviewed directory experience and adds static explanatory content and links that remain useful even when live profile data is unavailable.
- `/outsourcing-philippines-virtual-assistant` owns outsourcing, offshore, BPO-model comparison, and delegation guidance.
- Service pages link to distinct supporting resources and related services. Resources link back to their canonical service owner.
- Candidate resources remain separate from client commercial pages.

## Quality and release rules

- Do not modify `src/app/page.tsx` or homepage copy.
- Every new indexable URL needs a self-canonical, unique metadata, one H1, sitemap inclusion, and at least two relevant internal-link paths.
- No zero-volume city or job-category pages.
- Metadata must remain within the repository's SEO checks and avoid unsupported claims.
- Editorial copy must use plain language, concrete workflow details, and no generic template filler.
- Release validation must include tests, SEO expansion checks, service checks, content-cluster checks, editorial checks, intent-overlap audit, typecheck, lint, security audit, and production build.
