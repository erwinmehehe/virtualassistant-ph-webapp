# VAPH AEO/GEO follow-up content and GSC page refresh

**Date:** October 24, 2026  
**Repository:** `erwinmehehe/virtualassistant-ph-webapp`  
**Review status:** Draft branch; first-wave AEO PR #969 must be reviewed before this stacked change is merged.  
**Live publication:** Not performed. Preserve review status and confirm accurate dates before deployment.

## New distinct-intent resources

| Proposed canonical | Intent | Topic hub | Additional asset |
| --- | --- | --- | --- |
| `/blog/virtual-assistant-offboarding-checklist` | Departing worker access and handoff | Managing | `/downloads/virtual-assistant-offboarding-checklist.csv` |
| `/blog/when-to-hire-first-virtual-assistant` | First-hire readiness and scope | Hiring | `/downloads/first-virtual-assistant-task-audit.csv` |
| `/blog/filipino-virtual-assistant-us-australia-hours` | Client time-zone coverage and scheduling | Philippines | Daylight-saving examples in article |
| `/blog/virtual-assistant-job-scams-philippines` | Candidate-facing scam prevention | Philippines | Verify government and employer guidance |
| `/blog/filipino-va-contractor-vs-employee` | Worker classification and cross-border compliance questions | Philippines | **Qualified legal review required before publication** |

These articles provide information or decision tools and point readers back to existing hiring, tasks, schedule, onboarding, service and candidate application owners. Do not create new commercial landing pages for synonyms.

### Source review

- Time zones: NIST US daylight-saving rules `https://www.nist.gov/pml/time-and-frequency-division/popular-links/daylight-saving-time-dst`, NIST local time FAQ, timeanddate Australian state rules. Sample conversions should be rechecked each year. US time changes in 2026 on March 8 and November 1; Australian participating jurisdictions change on October 4, 2026 and April 5, 2026 for the prior season.
- Candidate scams: Philippine Information Agency 2025 work-from-home scam warning, DOLE public warning on fake jobs, and DOLE-CAR impersonation guidance. Distinguish online work in the Philippines from overseas deployment.
- Worker classification: Philippine Supreme Court summary of the four-fold test and Lawphil Supreme Court decisions. Contract labels alone do not decide status; control of the manner and means of work, and sometimes economic dependence, may matter.
- Account closure: NIST small-business MFA and access practices and CISA Cybersecurity Performance Goals. Preserve client-owned work, then remove permission and address shared secrets.

These sources support the context, not promises of outcomes, rankings, legal clearance, or hiring results.

## Six historical GSC-priority article enhancements

The original September 21 GSC opportunity report is historical. It is not October search volume or proof of current ranking/CTR movement. Refresh query-plus-page GSC performance before making outcome claims.

| Existing canonical | Decision and reason |
| --- | --- |
| `/average-hourly-rate-virtual-assistants-philippines` | **Structured blog:** Tighten SERP title and description around the actual 93-profile, September 2026 asking-rate dataset. Existing article already explains the historical $5 median, current platform $6 minimum, and that it is not a national pay survey. Do not add redundant sections or pretend the historical sample is a current national rate. |
| `/blog/do-i-need-to-pay-sss-philhealth-and-pag-ibig-for-my-filipino-va` | **Structured blog:** Add a direct answer, an evidence/checklist table, official SSS links, and a contextual bridge to the distinct worker-classification guide. Benefits and classification remain review-required. |
| `/blog/hourly-rates-for-filipino-virtual-project-manager` | **Retained archive:** Add an evidence-based paid exercise and clearer budget-specific SERP metadata. The project's narrow rate sample is too small for a defensible standalone benchmark. Verify the exact production path, redirect and indexability: a non-www live fetch returned 404 during research while a www-indexed version was discoverable. Do not assert a confirmed production defect without a direct crawl. |
| `/blog/get-paid-virtual-assistant-philippines` | **Retained archive:** Add safer account and transaction verification steps for candidates. Point to the new job-scam safety guide; keep candidate intent distinct from employer direct-payment guidance. |
| `/blog/general-virtual-assistant-vs-executive-virtual-assistant-which-should-you-hire-in-the-philippines` | **Retained archive:** Existing comparison matrix is useful; add a role-specific paid-trial work sample and scoring decision rather than duplicating the original comparison. |
| `/blog/how-to-pay-a-filipino-virtual-assistant-directly` | **Retained archive:** Add an illustrative payment reconciliation case, owner-approved transfer controls and classification link. Do not recommend one processor as universally cheaper. |

The four retained articles are updated in `src/lib/archive-posts.ts`, which also preserves article slugs. The two structured guides use `src/lib/blog-gsc-editorial-refreshes.ts` to apply narrow editorial patches without reformatting the 2.5 MB legacy blog corpus.

## Review and QA gates

1. `node --test tests/blog-aeo-followup.test.mjs` (new test file), then `npm test`.
2. `npm run content:check`, `npm run typecheck`, `npm run build`, and the repository's SEO overlap checks.
3. Verify the two CSV assets have consistent columns and open in ordinary spreadsheet programs.
4. Confirm no existing canonical service/hiring URL is displaced or duplicated.
5. Compare the merged UI on desktop and mobile; inspect structured Article/FAQ schema and answer-first blocks.
6. For the compliance article, **request qualified Philippine legal review before taking the PR out of draft or publishing**. Review benefits content at the same time.
7. Recheck clocks for current year and official sources before publication. Confirm working hours and pay terms are candidate-specific.
8. Confirm article dates and current platform minimum and client fee language immediately before release.
9. Run a fresh live crawl of the project-manager article, including trailing slash and www/non-www host canonical/redirect variants.
10. Measure comparable GSC query-page performance and qualified conversions after indexation. Separately audit AI citations and PAA features; do not infer them from low CTR.

## Monitoring prompts (not verified current PAA placements)

- How do I offboard a Filipino virtual assistant securely?
- When should my small business hire its first virtual assistant?
- Can a Philippine virtual assistant work 9 to 5 in New York or Sydney?
- How can I identify a fake Filipino virtual assistant job offer?
- Are Filipino virtual assistants legally independent contractors?
- Do international clients pay SSS, PhilHealth and Pag-IBIG?
- What is an average Filipino VA hourly rate from actual research?
- How can a client reconcile a direct international VA payment?

Check current search results and assistant citations with a consistent market, date and prompt before claiming visibility gains.

## Deployment plan

This is a **stacked draft PR** based on `content/aeo-va-guides-oct-2026`, not an independent production release. Once first-wave PR #969 is reviewed and merged, update the base of this second PR as appropriate, run CI again, and then decide on publication after editor and legal sign-off.
