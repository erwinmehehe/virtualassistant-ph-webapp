# v4.7 architecture additions

v4.7 adds a lead-to-private-job bridge on top of the v4.6 content system. Public service/blog match requests and the full role brief create a `lead_intake` row and a linked non-public `jobs` row with `client_id = null`. Client signup/login can claim those records only when the authenticated email matches the lead email. The existing admin publication rules still prevent an unclaimed anonymous job from going live.

Account creation is now split into dedicated Client and VA routes. `/auth/join` is a selector/backwards-compatibility route, not a mixed-role form.

Lead email notifications are centralized in `src/lib/email.ts`; all lead-ingest paths use the same notification helper when Resend is configured.

# v4.6 architecture additions

## Static editorial corpus

The blog content model is split into:

- `src/lib/blog-types.ts`: article/content types
- `src/lib/blog-content.ts`: explicit finished editorial copy for all article URLs
- `src/lib/blog.ts`: lookup, route, topic, and related-content helpers only
- `src/components/blog-article.tsx`: presentation, CRO, FAQ, internal-link, author, reviewer, and source UI

v4.6 intentionally removes the runtime article-copy factories used in v4.5. Shared logic may decide how content is rendered, but it does not synthesize article body copy at request/build time.

## Article SEO and UX

Each article supports:

- unique title and metadata
- key takeaways
- substantial body sections
- contextual internal-link cards inside the reading flow
- six FAQs
- FAQPage structured data in the article graph
- breadcrumb and Article structured data
- service or general hiring CTA
- source blocks and reviewer notes where needed
- related-reading paths

## Content-quality gate

`scripts/check-blog-quality.mjs` reads the explicit corpus and fails when editorial constraints regress. `npm run content:check` validates the 1,000-word floor, FAQs, internal links, duplicates, route resolution, punctuation policy, and maintained anti-cliche rules.

## Existing application architecture

All marketplace, Supabase, $5/hour minimum-rate, lead-intake, blog-funnel analytics, service-page, industry-page, and role-based workspace architecture from v4.5 remains in place.
