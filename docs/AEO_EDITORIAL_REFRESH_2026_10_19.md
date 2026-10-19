# Editorial AEO refresh: 12 priority VAPH blog guides

**Editorial review date:** 2026-10-19. **Status:** Draft PR; not yet published or performance-validated.

## Why these URLs

This is a manual, reader-first editorial pass across the employer and Filipino candidate journeys. The articles already have substantive content and are relevant to the site's hiring, training, and job-search experience. Selection is based on search intent, internal topic coverage and practical next steps, **not** on verified Google Search Console impressions, CTR or conversions.

An attempted Semrush organic report was unavailable due to account API unit balance. No GSC query/page export was connected to this task. Do not describe the selection as the site's highest-traffic pages or assume that an AI Overview is suppressing clicks.

| URL path under /blog/ | Audience | Core search question | Specific new value |
| --- | --- | --- | --- |
| virtual-assistant-onboarding-checklist | Employer | How do I onboard a VA in 30 days? | Inbox example, review log, access boundaries and day-30 check |
| how-many-hours-hire-virtual-assistant | Employer | How many VA hours do I need? | Time-audit method, capacity/coverage distinction, backlog review |
| virtual-assistant-interview-questions | Candidate | What should I expect in a VA interview? | Truthful evidence notes, client evaluation questions |
| part-time-virtual-assistant-jobs-philippines | Candidate | How do I find part-time VA work? | Fixed hours versus live coverage, role-specific proof |
| virtual-assistant-niches | Candidate | How do I choose a VA niche? | Transferable skills comparison, tools inside workflows |
| virtual-assistant-tasks | Employer | What tasks can a VA do? | Delegation selection based on repeatability, reviewability and risk |
| how-to-create-the-best-va-profile | Candidate | What belongs in a VA profile? | Role-specific headline, five-job fit check, truthfulness |
| virtual-assistant-introduction-video | Candidate | What should I say in a VA video? | Relevant proof, sound check, recording criteria |
| virtual-assistant-proposal-sample | Candidate | How do I write a VA proposal? | Job requirement matching and an honest customizable opening |
| free-virtual-assistant-job-websites-philippines | Candidate | Which free VA job websites can I use? | Free-account versus fee distinctions, job-application tracker |
| virtual-assistant-email-management-tasks-sops | Employer | What can an inbox VA safely own? | Escalation matrix and daily decision handoff |
| digital-marketing-virtual-assistant-tasks | Employer | What can a marketing VA safely own? | Source-linked Search Console reporting, explicit ad approval gates |

## Changes made

- Each guide has an editor-written approximately 50-60 word `quickAnswer` and a natural, guide-specific `quickAnswerQuestion`, instead of reusing an automatically combined meta description.
- Each section of each of the 12 guides has an explicit, reviewed `questionHeading`. The original `heading` value remains untouched because it also determines stable section anchor IDs.
- Two substantive, practical paragraphs were added to each guide (24 total), plus one new visible FAQ question and answer per guide (12 total). Existing material, author attribution, internal links, meta titles, descriptions, dates, schema and canonical URLs are retained.
- The shared blog template already renders these editor overrides; its FAQ JSON-LD uses the same published FAQ answers displayed in the page. No new unsupported rankings, customer outcomes, platform pricing promises or fake sources have been introduced.
- `tests/aeo-editorial-priority.test.mjs` enforces the authored answers, question headings, concrete examples, distinct FAQs, internal links and metadata limits.

## Release and measurement checks

1. Run `npm test`, `npm run content:check`, `npm run typecheck`, `npm run build` and any required content-intent checks in the PR workflow. Verify that FAQ JSON-LD represents precisely the FAQs rendered in article HTML.
2. Review all 12 pages at mobile and desktop breakpoints. Inspect heading legibility, existing table formatting, full FAQ answers and section anchors; confirm the new answer does not repeat the immediately adjacent excerpt.
3. A content owner should specifically verify platform/job-board terms and job scam references before the job-sites article goes live, and review marketing claims/AI-use boundaries before approval.
4. Do not alter `updatedAt` for SEO freshness alone. On approved publication, set a truthful last-substantive-update date if the editorial workflow requires it.
5. When a GSC query+page export is available, run `npm run seo:aeo-opportunities -- /path/to/gsc-export.csv`. Add real impressions/clicks/CTR/query intent to this priority list, then choose additional pages by opportunity instead of intuition.
6. Record baseline and post-launch query-page GSC data for matched windows, qualified applications/leads, and sampled AI citation evidence separately. Do not infer causality from changes in rankings or traffic alone.

Google's [people-first content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) supports substantive answers, clear sourcing, originality and transparent authorship rather than mass production or fresh dates for appearance's sake. [AI features guidance](https://developers.google.com/search/docs/appearance/ai-features) does not promise AI visibility from headings, FAQ schema or `llms.txt`.
