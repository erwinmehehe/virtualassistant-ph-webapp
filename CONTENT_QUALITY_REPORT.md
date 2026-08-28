# Blog Content Quality Report - v4.7.0

Word counts in this report cover the article body plus on-page FAQs. Metadata, navigation, CTAs, and other page chrome are excluded.

## Release gate

- Article URLs checked: **170**
- Legacy/root-level article paths preserved: **5**
- Minimum article length: **1,281 words**
- Average article length: **1,527 words**
- Maximum article length: **1,752 words**
- Minimum FAQs per article: **6**
- Minimum curated internal links per article: **5**
- Articles with cited source blocks: **4**
- Articles with explicit reviewer metadata: **5**
- Duplicate long paragraphs allowed by QA: **0**
- Duplicate FAQ answers allowed by QA: **0**
- Large-scale reused editorial sentences allowed by QA: **0 above the configured reuse threshold, except an allowlisted marketplace-policy sentence**
- Em dash / en dash characters allowed in blog corpus: **0**
- Banned robotic/cliche phrase hits allowed: **0**

## What changed

The v4.5 runtime article factories were removed. `src/lib/blog-content.ts` now contains the finished article copy as explicit editorial content. Shared code is limited to rendering, FAQ presentation, structured data, CRO modules, author/reviewer treatment, and internal-link components.

Each article now includes a key-takeaway block, substantial topic-specific body sections, six on-page FAQs, contextual links inside the reading flow, a broader related-reading module, author/reviewer treatment, and a service or hiring CTA that preserves attribution. Service-cluster articles must link to their canonical `/service/[slug]/` page and every article must link to its topic hub and at least two other articles.

The quality pass also removes awkward generated phrasing, repeated long paragraphs, repeated FAQ answers, article-factory filler, and common AI-marketing cliches. A sentence-reuse guard catches large-scale boilerplate reuse across the corpus while allowing a small number of deliberate policy statements to remain consistent.

## Regression check

Run:

```bash
npm run content:check
```

The check fails on article bodies below 1,000 words, fewer than six FAQs, fewer than five internal links, missing topic/service links, fewer than two contextual article links, duplicate titles/meta titles, duplicate long paragraphs, duplicate FAQ answers, excessive long-sentence reuse, unresolved content links, em/en dashes, and a maintained list of robotic marketing phrases.
