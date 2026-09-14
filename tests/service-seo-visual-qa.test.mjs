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
  assert.ok(siteFinal >= 0, "site-redesign-final.css must be loaded");
  assert.ok(serviceFinal > siteFinal, "service visual QA must load after the final site redesign");
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

test("discovery prompt is compact and never competes with service forms or workspaces", () => {
  const floating = source("src/components/floating-cta.tsx");
  assert.match(floating, /INTERNAL_PATHS/);
  assert.match(floating, /INLINE_MATCH_PATHS/);
  assert.doesNotMatch(floating, /Hiring a Virtual Assistant\?/);
  assert.match(floating, /<span>Book a call<\/span>/);
});

test("service template preserves core SEO signals", () => {
  const page = source("src/app/service/[slug]/page.tsx");
  assert.match(page, /title: \{ absolute: page\.metaTitle \}/);
  assert.match(page, /description: page\.metaDescription/);
  assert.match(page, /canonicalPath\(`\/service\/\$\{page\.slug\}`\)/);
  assert.match(page, /alternates: \{ canonical \}/);
  assert.equal((page.match(/<h1\b/g) || []).length, 1);
});
