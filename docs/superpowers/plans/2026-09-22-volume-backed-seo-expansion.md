# Volume-Backed SEO Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the September 22 SEO expansion, add only two justified service URLs, strengthen the main non-homepage commercial hubs, and ship a collision-safe branch.

**Architecture:** Existing `SERVICE_PAGES`, `SEO_RESOURCE_PAGES`, authority-page data, and shared App Router templates remain the sources of truth. New commercial intents become service entries, while synonym and modifier demand is assigned to existing canonical pages through copy and internal links. Repository checks enforce canonical, metadata, sitemap, orphan, and overlap expectations.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Node test runner, ESLint, repository SEO scripts.

**Spec:** `docs/superpowers/specs/2026-09-22-volume-backed-seo-expansion-design.md`

## Global Constraints

- Do not modify `src/app/page.tsx` or homepage content.
- Use the September 22 AU, US, and PH keyword files as the source of truth.
- Create no zero-volume city or job-category pages.
- Preserve one canonical commercial owner per intent.
- Use plain human copy and no em dash.

## Review Focus

- A generated resource must point back to its exact canonical service page and never become a competing commercial page.
- A new service must be in static params, sitemap output, the services hub, and related-service paths.
- Dynamic profile availability must not remove the static SEO content from `/find-talent`.
- Outsourcing synonyms must resolve to one authority URL rather than duplicate pages.
- No change may touch `src/app/page.tsx`.

---

### Task 1: Lock the canonical map in automated checks

**Files:**
- Modify: `scripts/check-seo-expansion.mjs`
- Create: `tests/volume-backed-seo-expansion.test.mjs`

**Interfaces:**
- Consumes: `SERVICE_PAGES`, `SEO_RESOURCE_PAGES`, hub source files, sitemap source.
- Produces: release checks for 25 role clusters, 167 current resources, required hub links, two new service slugs, canonical metadata, sitemap inclusion, and homepage immutability.

- [ ] Write assertions that fail because the branch checker still expects 17 role clusters and the two new services and hub links do not exist.
- [ ] Run `node --test tests/volume-backed-seo-expansion.test.mjs` and `npm run seo:expansion-check`; confirm the expected failures.
- [ ] Update only the checker constants and source assertions required by the approved design.
- [ ] Re-run the focused checks and confirm they pass.

### Task 2: Finish and validate the eight started resource clusters

**Files:**
- Modify: `src/lib/seo-resource-pages.ts`
- Modify: `scripts/check-seo-expansion.mjs`

**Interfaces:**
- Consumes: existing shared resource generators and the eight branch-added `RoleCluster` records.
- Produces: 48 distinct supporting resources with service backlinks and valid metadata.

- [ ] Add tests for all eight cluster slugs, six intent families per cluster, service mappings, unique generated slugs, title and description limits, and internal links.
- [ ] Run the focused test and confirm it fails on the incomplete validation.
- [ ] Correct formatting, grammar, metadata, or mapping defects found in the eight records.
- [ ] Run the focused test and SEO expansion checker until green.

### Task 3: Add the two justified commercial service pages

**Files:**
- Modify: `src/lib/service-pages.ts`
- Modify: `src/app/services/page.tsx`
- Test: `tests/volume-backed-seo-expansion.test.mjs`

**Interfaces:**
- Produces: `email-management-virtual-assistant` and `event-planning-virtual-assistant` service records consumed by the existing service template, static params, and sitemap.

- [ ] Add failing assertions for the two slugs, unique primary keywords, related-service links, service-hub discovery, and metadata length.
- [ ] Run the focused test and confirm it fails because the pages are absent.
- [ ] Add original service records with workflow-specific tasks, tools, skills, outcomes, boundaries, and related slugs.
- [ ] Add contextual service-hub discovery links without creating a separate synonym hub.
- [ ] Re-run focused tests, service checks, and the SEO expansion checker.

### Task 4: Strengthen the non-homepage commercial hubs

**Files:**
- Modify: `src/app/services/page.tsx`
- Modify: `src/app/hire/page.tsx`
- Modify: `src/app/pricing/page.tsx`
- Modify: `src/app/find-talent/page.tsx`
- Modify: `src/lib/blog-content.ts`
- Modify: `src/lib/service-pages.ts`
- Test: `tests/volume-backed-seo-expansion.test.mjs`

**Interfaces:**
- Consumes: canonical service, authority, pricing, resource, and talent routes.
- Produces: contextual internal links and expanded copy for services, hire, pricing, talent discovery, email management, HR, project management, and outsourcing synonyms.

- [ ] Add failing source-level tests for each hub's required canonical bridges and static SEO content.
- [ ] Run the focused test and confirm the links or sections are absent.
- [ ] Add concise sections and links that assign broad demand to the correct owner.
- [ ] Expand the existing outsourcing guide for offshore, BPO, 24/7, handoff, and provider-model intent without changing its canonical URL.
- [ ] Deepen existing service pages for secondary email-management, HR, and project-management queries without creating duplicates.
- [ ] Re-run focused tests and intent-overlap audit.

### Task 5: Verify indexability, collisions, and release readiness

**Files:**
- Modify only files implicated by concrete failures.

**Interfaces:**
- Produces: a clean branch ready for pull request review.

- [ ] Run `npm test`.
- [ ] Run `npm run service:check`, `npm run cluster:check`, `npm run content:check`, `npm run archive:check`, `npm run content:intent-audit`, and `npm run seo:expansion-check`.
- [ ] Run `npm run typecheck`, `npm run lint`, `npm run format:check`, and `npm audit --audit-level=high`.
- [ ] Run `npm run build` and inspect generated-route output for the new service and resource routes.
- [ ] Confirm `git diff -- src/app/page.tsx` is empty.
- [ ] Review the final diff, fix concrete failures, commit, push `seo/volume-backed-expansion-sep22`, and create a PR with test evidence.
