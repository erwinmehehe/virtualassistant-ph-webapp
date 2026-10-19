# Public-page answer-first / AEO implementation

This implementation supports helpful, indexable answers for **blogs (including retained articles), service and industry detail pages and hubs, the training catalogue, the jobs directory, and published job details**. It reuses existing Next.js SSR, canonical URLs, sitemap, robots.txt, /llms.txt, and organization IDs. Nothing here promises inclusion in Google AI Overviews, ChatGPT, or Perplexity.

## Rendering and editorial rules

- `AnswerFirst` renders visible, server-side HTML close to the main heading. Prefer roughly **40-60 words** for a clear answer, but never truncate a sentence or invent supporting claims solely to meet a word count. Keep copy factual and useful to the person reading.
- Blog summaries draw from the existing reviewed `description` and `keyTakeaways`. An editor can add `quickAnswer` and `quickAnswerQuestion` to a `BlogPost` for a more natural answer to the article's real search intent.
- The question-heading helper converts informational blog sections to scannable questions. `questionHeading` on an individual `BlogSection` is the editorial override. **Manually review** the generated headings on priority articles; automatic rewrites are not intrinsically better for ranking.
- Keep a single canonical commercial page per role/industry; use blogs for distinct informational, comparison, or evaluation questions. Do not bulk-publish near-duplicate Q&A pages.
- FAQ schema is derived from the same FAQs shown in the page HTML (including job details). **Never add FAQPage for content that is not visible.** Google's FAQ rich results are generally restricted to authoritative government and health sites; markup does not make AI systems cite a page.
- The public training `ItemList` includes **published** LMS courses only, with `Course` markup anchored to visible catalogue cards. Private lessons, unpublished courses, learner results, and authenticated dashboards are not exposed.
- Job details retain their existing `JobPosting`, expiry, compensation, remote-work, and candidate-country data. The jobs directory remains a `CollectionPage` and **must never** mark the entire list as one `JobPosting`. Expired/removed jobs should stop publishing `JobPosting` markup.
- The About page connects `AboutPage`, canonical `Organization`, and the **named founder already visible on the page**. Do not add invented Person profiles or fabricated customer/placement evidence.

## Technical indexability

- Next.js public pages already render content on the server: **no SPA/SSR rewrite is needed**.
- `src/app/robots.ts` and `src/app/llms.txt/route.ts` already exist. Keep crawler access to public content while continuing to block `/workspace/`, `/auth/`, and `/api/`. Avoid public links to private account/candidate evidence.
- `llms.txt` is a supplementary navigation convention; Google does **not** require it or use it for AI Overview eligibility. Do not use it as a substitute for internal links, crawlable text, or the XML sitemap.
- Structured data must match visible content. Validate representative URL types after deployment via Google's Rich Results Test (Course list and Job posting in particular) and Schema.org validation. Check rendered HTML as a logged-out visitor.
- Review mobile LCP, layout shift, core web vitals, and crawl results **with measured data** before claiming performance gains.

## GSC-led content workflow

1. Export Google Search Console **query + page** performance data for a comparable date range. A query-only CSV can still identify zero-click opportunities, but not URL overlaps.
2. Run `npm run seo:aeo-opportunities -- /path/to/gsc-query-page.csv`. This reads local data and prints a Markdown review; it does not upload raw GSC rows.
3. Prioritize high-impression/zero-click position 1-3 query-page rows; separately investigate low CTR in the top 10 and multiple-URL overlaps. **Neither pattern proves an AI Overview is stealing clicks or that cannibalization is occurring.**
4. For each target, inspect search intent, existing snippet, SERP layout, and article evidence. Decide whether to update the existing canonical page, improve an answer/FAQ, or add a distinct guide.
5. Track changes with a URL, query, GSC date range, updated-answer text, launch date, and review date. Re-evaluate clicks, impressions, CTR, position, engaged sessions and qualified leads on comparable windows.
6. Sample and record AI engine citations separately (engine, prompt, region, date, cited URL and screenshot). Treat citations as observations, not guaranteed or directly attributable to markup.

Google reference: [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features), [Search Central guidance for AI](https://developers.google.com/search/blog/2025/05/succeeding-in-ai-search/), [Course list markup](https://developers.google.com/search/docs/appearance/structured-data/course), [JobPosting markup](https://developers.google.com/search/docs/appearance/structured-data/job-posting), [FAQ rich result restrictions](https://developers.google.com/search/blog/2023/08/howto-faq-changes).

## Deployment acceptance

- [ ] Run `npm run typecheck`, `npm test`, and `npm run build` on the PR with required runtime configuration.
- [ ] Verify one live blog, service, industry, training, jobs directory, live job and About page with View Source / rendered HTML.
- [ ] Validate JSON-LD syntax, correct canonical hostname, and actual visible FAQ answers.
- [ ] Verify a job expires cleanly and unpublished training courses remain absent from schema.
- [ ] Review question headings on at least five high-traffic articles; add manual overrides where wording is unnatural.
- [ ] Confirm no noindex/private route appears in the XML sitemap or llms.txt.
- [ ] Compare visual layouts at mobile and desktop sizes and ensure CTAs remain usable.
