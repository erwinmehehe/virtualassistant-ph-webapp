# VAPH AEO editorial refresh: Batch 2 (19 October 2026)

## Scope
Manual content enhancements to 12 existing, indexable blog articles. This branch is a separate follow-on to PR #940 (12 prior guides and the shared answer-first templates); do not merge this batch ahead of the first.

| Audience | Existing article slug | User intent |
| --- | --- | --- |
| Employer | `virtual-assistant-non-phone-tasks` | Identify tasks that require no customer calls |
| Employer | `virtual-assistant-team` | Decide between one assistant and multiple roles |
| Candidate | `virtual-assistant-side-hustle-philippines` | Begin part-time VA work within realistic capacity |
| Candidate | `virtual-assistant-jobs-for-students-philippines` | Assess student-compatible tasks and schedules |
| Both | `virtual-assistant-tools` | Choose a lean software stack by workflow |
| Employer | `gohighlevel-virtual-assistant-tasks` | Delegate CRM and marketing operations with approval gates |
| Employer | `hubspot-virtual-assistant-tasks` | Organize CRM records, ownership and data protection |
| Employer | `quickbooks-virtual-assistant-tasks` | Separate financial admin from accounting approval |
| Employer | `canva-virtual-assistant-tasks` | Produce branded content using approved designs |
| Employer | `data-entry-virtual-assistant-tasks` | Set up error controls, sample QA and exception handling |
| Employer | `bookkeeping-virtual-assistant-month-end-workflow` | Prepare an evidence-backed month-end handoff |
| Employer | `real-estate-virtual-assistant-crm-listing-workflow` | Organize listing/transaction admin with licensed-agent approval |

## Exactly what was changed

- A unique, natural search question and a 52–61-word human-written Quick Answer for each guide.
- Every section heading given a distinct, editorially reviewed question; the original stored headings and anchor IDs remain unchanged.
- Two practical example or action paragraphs per article (24 paragraphs in total), placed in existing substantive sections.
- One useful, visible FAQ per guide (12 new Q&As), without duplicate FAQ questions.
- One new contextual internal link per guide (12 links) to a directly relevant existing VAPH guide.
- One month-end bookkeeping meta title clarified to a descriptive 45–65-character length.
- Preserved canonical slugs, original article dates, service/software clusters, editor attribution, article schema data, and existing disclaimer/review notes.

## QA performed

- Parsed all three JSON-shaped `BlogPost[]` modules from the committed GitHub branch.
- Confirmed all 12 records exist and have distinct 35–85-word authored answers, natural H2 question overrides, at least five FAQs, and unique relevant internal links.
- Checked 45–65 character title lengths and 130–165 character descriptions for all 12.
- Checked for duplicate slugs across the three data modules; none found.
- Added `tests/aeo-editorial-batch2.test.mjs` for permanent regression coverage of author-written answers, headings, specific examples, FAQ uniqueness, internal links and preserved heading IDs.
- Repository CI, real-device responsive screenshots, live HTML structured-data checks, and the new PR's independent security checks must pass before merge. GitHub-side content inspection alone is **not** a full production build.

## Editorial boundaries

- No fabricated GSC impressions, rankings, AI citations or other performance claims. Targets were selected from the unoptimized source inventory and user intent, *not* a GSC top-opportunity report.
- Avoid representing VA work as licensed professional services. QuickBooks/bookkeeping copy keeps finance approvals with authorized staff. Real-estate copy retains licensed/legally authorized agent decisions.
- GoHighLevel and HubSpot copy keeps outreach consent, record deletion and high-impact automations behind named approval; Canva copy retains brand/editorial approval.
- Check the current terms of third-party job marketplaces and the reader's local employment and tax obligations independently before publishing or updating year-sensitive claims.
- Keep dates unchanged until a reviewer decides whether the extent of updates warrants visible 'updated' labels based on real publication records.

## Release and measurement

1. Wait for PR #940 to be merged into `main` and its production deployment verified.
2. Change this batch's PR base to `main` if it was initially created as a stacked PR.
3. Require passing TypeScript/build/unit/content, CodeQL, mobile/desktop rendered article and browser smoke checks.
4. Spot-check the 12 published slugs for a single H1, visible Quick Answer/H2/FAQ, relevant internal links, canonical correctness, and no private workspace leakage.
5. Record GSC query-page impressions, clicks, CTR and average position for comparable 28-day windows, plus an editorial AI-answer citation check separately. Avoid attributing changes to AEO alone without evidence.
