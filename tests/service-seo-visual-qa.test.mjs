import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("service QA overrides load after the final site redesign", () => {
  const layout = source("src/app/layout.tsx");
  const siteFinal = layout.indexOf('import "./site-redesign-final.css"');
  const serviceFinal = layout.indexOf('import "./service-visual-qa-v2.css"');
  const matchFinal = layout.indexOf('import "./service-match-form-final.css"');
  assert.ok(siteFinal >= 0, "site-redesign-final.css must be loaded");
  assert.ok(serviceFinal > siteFinal, "service visual QA must load after the final site redesign");
  assert.ok(matchFinal > serviceFinal, "service match treatment must load after the shared service QA layers");
});

test("service pages stay compact and mobile safe", () => {
  const css = source("src/app/service-visual-qa-v2.css");
  assert.match(css, /service-onboarding-section/);
  assert.match(css, /service-avoid-section/);
  assert.match(css, /padding-top: 24px !important/);
  assert.match(css, /grid-template-columns: 1fr !important/);
  assert.match(css, /font-size: clamp\(22px, 7vw, 28px\)/);
  assert.match(css, /content-visibility: auto/);
});

test("service shortlist form is integrated with the hero instead of boxed like a dashboard card", () => {
  const form = source("src/components/service-match-form.tsx");
  const css = source("src/app/service-match-form-final.css");

  assert.match(form, /Private shortlist/);
  assert.match(form, /Get a shortlist for this role\./);
  assert.match(form, /Get my shortlist/);
  assert.doesNotMatch(form, /Quick match|Want us to narrow the list\?|About 20 seconds/);

  assert.match(css, /background: transparent !important/);
  assert.match(css, /border-left: 1px solid rgba/);
  assert.match(css, /box-shadow: none !important/);
  assert.match(css, /border-top: 1px solid rgba/);
  assert.match(css, /grid-template-columns: 1fr !important/);
});

test("discovery prompt is compact and never competes with service forms or workspaces", () => {
  const floating = source("src/components/floating-cta.tsx");
  assert.match(floating, /INTERNAL_PATHS/);
  assert.match(floating, /INLINE_MATCH_PATHS/);
  assert.doesNotMatch(floating, /Hiring a Virtual Assistant\?/);
  assert.match(floating, /<span>Discuss your VA needs<\/span>/);
});

test("service template preserves core SEO signals", () => {
  const page = source("src/app/service/[slug]/page.tsx");
  const hero = source("src/components/hiring-hero.tsx");
  assert.match(page, /title: \{ absolute: page\.metaTitle \}/);
  assert.match(page, /description: page\.metaDescription/);
  assert.match(page, /canonicalPath\(`\/service\/\$\{page\.slug\}`\)/);
  assert.match(page, /alternates: \{ canonical \}/);
  assert.match(page, /<HiringHero/);
  assert.equal((hero.match(/<h1\b/g) || []).length, 1);
});
