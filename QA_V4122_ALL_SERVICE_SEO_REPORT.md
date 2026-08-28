# v4.12.2 — All `/service/` SEO and content QA

## Scope

This pass applies to the full service library, not only `/service/real-estate/`.

- Service records audited: **74**
- Unique service slugs: **74**
- Meta titles containing the site brand: **0**
- Meta titles containing standalone `VA`: **0**
- Longest meta description: **159 characters**
- Required content-depth sections: **6/6 present**

Example title pattern:

- `/service/real-estate/` → `Hire Real Estate Virtual Assistant Philippines`
- `/service/seo/` → `Hire SEO Virtual Assistant Philippines`
- `/service/dental-virtual-assistant/` → `Hire Dental Virtual Assistant Philippines`
- `/service/construction-estimating-virtual-assistant/` → `Hire Construction Estimating & Tender Desk Virtual Assistant Philippines`

## Editorial changes

The service pages no longer rely on word-count padding alone. The shared page system now combines each service's own tasks, tools, skills, best-fit businesses, and workflow focus with operating guidance specific to the service family.

Each service page includes:

1. A task-led introduction tied to the actual role.
2. Concrete responsibilities grouped by workflow.
3. Role-family operating guidance and decision boundaries.
4. A practical first-30-day onboarding plan.
5. Interview evidence to request instead of generic self-ratings.
6. Common hiring mistakes tied to the work.
7. A small management scorecard covering timeliness, accuracy, turnaround, exceptions, and documentation.
8. Tool and skill evaluation guidance.
9. Best-fit business use cases.
10. Job-brief guidance, hiring process, interview questions, FAQs, related services, and related industry guides.

Regulated role families retain explicit boundaries for legal, healthcare, finance, insurance, lending, and other controlled work.

## Content depth

A source-level rendered-copy estimate across all 74 service pages is approximately **1,983 to 2,240 words per page**, before dynamic candidate cards and supporting blog-guide excerpts. The median is approximately **2,015 words**.

The purpose of the added copy is not to repeat the target keyword. It covers the operating questions a buyer needs answered: what to delegate, what not to delegate, how to onboard, what evidence to ask for, how to measure quality, what systems matter, and where manager or licensed-professional approval remains necessary.

## Anti-slop checks

The new service QA script rejects common filler/cliche phrases such as “seamless,” “unlock,” “elevate,” “game changer,” “in today’s fast-paced…,” “revolutionize,” “effortlessly,” and “supercharge” in the service data or shared service template.

Command:

```bash
npm run service:check
```

Result:

```text
Service SEO pages checked: 74
Brand names in meta titles: 0
Standalone VA abbreviations in meta titles: 0
Longest meta description: 159 characters
Required depth sections present: 6/6
PASS
```

The existing blog-content QA also passes:

```text
posts: 170
minimumWords: 1281
averageWords: 1527
maximumWords: 1752
failures: 0
warnings: 0
```

## Build/typecheck note

`npm run typecheck` could not be used as a meaningful validation in this extracted package because `node_modules` is not present, so TypeScript reports missing Next.js, Supabase, React/JSX, Node, and other dependency types across the existing application. The new permanent service SEO check is dependency-free and passes.
