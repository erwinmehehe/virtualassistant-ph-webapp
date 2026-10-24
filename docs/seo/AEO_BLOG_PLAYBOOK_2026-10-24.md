# VAPH AEO / GEO blog playbook and October 2026 content batch

**Website:** https://virtualassistant.com.ph  
**Editorial system:** Next.js `BlogPost` data, `BlogArticle` renderer, and existing JSON-LD output  
**Review status:** Staged for editorial review. Do not merge before verifying links, accuracy, and publication dates.

## Reusable article template

Use the existing `src/lib/blog-types.ts` schema; do **not** build a second visual AEO template.

| Article field | What the writer or editor must supply |
| --- | --- |
| `slug`, `title`, `metaTitle`, `description` | One clear search intent; concise title (aim for under 60 characters); a truthful 120-160 character meta description; no duplicate commercial page targets |
| `quickAnswerQuestion` and `quickAnswer` | A direct, independently useful response early in the article. Write a complete answer, usually around 40-75 words when that length suits the question. Do not manufacture statistics or force a fixed word count |
| `excerpt`, `clusterLabel`, `intent`, `topic` | Identify whether the article helps a buyer compare, test, manage, or hire. Topic must map to an existing VAPH blog hub |
| `keyTakeaways` | Three to five true, specific outcomes; avoid generic marketing statements |
| `sections` | Topic-specific H2/H3 headings, preferably questions with `questionHeading` overrides; steps, examples, verifiable claims, and a comparison table only where it helps the reader |
| `faqs` | Answer distinct adjacent questions without repeating the article verbatim. Use the existing FAQ rendering and markup, which do not guarantee a rich result |
| `sources`, `reviewNote` | Prefer primary or official references for consequential claims, describe what is a sample or hypothetical example, and flag regulated or privacy-related limits |
| `internalLinks` | Link to the topic hub, at least two relevant articles when possible, one appropriate service/hiring destination, and helpful downloadable templates where applicable |
| `author`, `reviewedBy`, `publishedAt`, `updatedAt` | Use actual editorial ownership and accurate publication/revision dates; do not create fictional authors, reviewers, or updates |

### Recommended editorial reading flow

1. Begin with the searcher's question and a direct, self-contained answer.
2. Clarify the scope and who the guidance is for.
3. Show a practical comparison, workflow, example, or decision table.
4. Describe steps or a checklist the reader can apply.
5. Explain limitations, approvals, errors, costs, or risk where relevant.
6. Provide a specific, non-pushy next step linked to the correct hiring/service page.
7. Answer only useful remaining FAQs. Avoid repeated keyword-stuffed question headings.

### What the existing code already does

- Renders the answer block as readable server-rendered HTML: `src/components/answer-first.tsx`.
- Displays the editorial `quickAnswer` and question-aware headings: `src/lib/answer-first.ts` and `src/components/blog-article.tsx`.
- Generates Article, WebPage, Breadcrumb and visible-FAQ JSON-LD where applicable: `src/app/blog/[slug]/page.tsx`.
- Builds related reading, topic hubs, contextual internal links and hiring next steps.
- Runs an article quality and intent-overlap gate via `scripts/check-blog-quality.mjs`.

Structured data supports accurate interpretation; it does not ensure AI Overviews inclusion, cited answers, or PAA visibility. Do not add redundant markup only to imply a ranking benefit.

## New October AEO buyer guides staged in this branch

| Article | Canonical intended URL | Search intent | Conversion step |
| --- | --- | --- | --- |
| AI vs Human Virtual Assistant | `/blog/ai-vs-human-virtual-assistant` | Comparison / operational decision | `/hire` and service selection |
| Virtual Assistant Skills Tests and Paid Trial | `/blog/virtual-assistant-paid-trial-tasks` | Screening / evidence | `/hire` |
| Virtual Assistant KPI Scorecard | `/blog/virtual-assistant-kpi-scorecard` | Management / evaluation | Onboarding and `/hire` |
| Virtual Assistant SOP Template | `/blog/virtual-assistant-sop-template` | Process documentation | Trial tasks, onboarding, and `/hire` |

**Downloads:** `/downloads/virtual-assistant-paid-trial-rubric.csv`, `/downloads/virtual-assistant-kpi-scorecard.csv`, `/downloads/virtual-assistant-sop-template.txt`.

The comparison guides supplement existing `/blog/virtual-assistant-tasks`, `/blog/virtual-assistant-tools`, `/blog/virtual-assistant-onboarding-checklist`, and `/blog/how-many-hours-hire-virtual-assistant`. Do not create alternate `hire virtual assistant philippines` articles that compete with `/hire`, `/services`, or individual `/service/[slug]` pages.

## Existing pages to improve before another generic guide

The September 21, 2026 GSC snapshot in `SEO_GSC_TOP20_2026-09-21.md` is historical. Refresh with comparable current query-page data before attributing ranking or CTR changes to the edits.

- `/average-hourly-rate-virtual-assistants-philippines`: update the answer-first summary, scope the candidate-rate sample honestly, add rate definitions, compare hiring cost with total management and software cost, and avoid presenting sample asking rates as national averages.
- `/blog/general-virtual-assistant-vs-executive-virtual-assistant-which-should-you-hire-in-the-philippines`: clarify responsibilities and decision boundaries, add a short comparison matrix, improve snippet language without replacing the canonical topic.
- `/blog/do-i-need-to-pay-sss-philhealth-and-pag-ibig-for-my-filipino-va`: verify current official Philippine sources and the distinction between employee and contractor arrangements. Obtain legal review for consequential employment-law statements.
- `/blog/hourly-rates-for-filipino-virtual-project-manager` and `/blog/how-to-pay-a-filipino-virtual-assistant-directly`: review first-party or authoritative source dates and clarify actual buyer questions.
- Review the GSC quick-win queries again after recrawl rather than treating the September report as October traffic data.

## Future topic backlog: confirm distinct query demand and intent first

1. **Virtual Assistant Offboarding Checklist**: account removal, file ownership, client communication and handover. Distinct from onboarding.
2. **When Should a Small Business Hire Its First VA?**: workload signals and break-even framing. Check overlap with small-business service pages.
3. **Can Filipino VAs Work US or Australian Hours?**: overlap windows, coverage design and written availability. Check current regional authority pages.
4. **How to Avoid VA Job Scams in the Philippines**: candidate-safety intent. Avoid overlap with existing free-job-sites and application guides. Verify public scam guidance.
5. **Filipino VA: Contractor or Employee?**: legal classification and obligations. Requires jurisdiction-specific, current official sourcing and qualified legal review before publication.

These are opportunities for validation, not guaranteed search volume, verified Google People Also Ask placements, or an instruction to generate duplicate pages.

## AEO/GEO measurement

- Capture GSC clicks, impressions, position and CTR by query **and** page, not separate aggregates joined by assumption.
- Compare each canonical URL in similar periods after indexing. Track assisted conversions to `/hire` and service pages.
- Record PAA opportunities only after checking the live SERP in the target market.
- Separately test a fixed prompt set in AI search surfaces; record whether VAPH is mentioned, cited, linked, and which competing pages are used.
- Track citation sources and first-party research methodology. Treat 'AI visibility' changes as observations, not guaranteed effects of schema or a specific word count.

## Publication QA

- Run `npm run content:check`, `npm run typecheck`, `npm run build`, and appropriate repository tests.
- Verify URL ownership, sitemap inclusion, metadata/canonicals, schema and all contextual links.
- Open downloads and confirm templates are clean and editable.
- Confirm current product terms, hiring flow, real author/reviewer, date, and no unverified monetary or regulatory claims.
- Review desktop/mobile rendering before merging or publishing.
