import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

// Pull ga4EventName out of the component so its rules can be exercised
// directly; the file itself is a client component and cannot be imported here.
function loadEventNamer() {
  const src = source("src/components/analytics.tsx");
  const start = src.indexOf("function ga4EventName");
  const end = src.indexOf("function forwardToGa4");
  const js = ts.transpileModule(`${src.slice(start, end)}\nmodule.exports = { ga4EventName };`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  const module = { exports: {} };
  new Function("module", "exports", js)(module, module.exports);
  return module.exports.ga4EventName;
}

const ga4EventName = loadEventNamer();

test("event names are coerced into what GA4 accepts", () => {
  assert.equal(ga4EventName("role_brief_submit"), "role_brief_submit");
  assert.equal(ga4EventName("service_seo_match"), "service_seo_match");
  assert.equal(ga4EventName("match-feedback lower rate"), "match_feedback_lower_rate");
  assert.equal(ga4EventName("BOOKING_CLICK"), "booking_click");
  // Must start with a letter.
  assert.match(ga4EventName("2fa_enabled"), /^event_/);
  // Max 40 characters.
  assert.ok(ga4EventName("a".repeat(80)).length <= 40);
});

test("tracked events reach GA4 without double-counting pageviews", () => {
  const analytics = source("src/components/analytics.tsx");

  // Every event already sent to our own store is forwarded from one place.
  assert.match(analytics, /function send\(event: string, metadata\?: Record<string, unknown>\) \{\s*\n\s*forwardToGa4\(event, metadata\);/);

  // GA4 enhanced measurement already records these.
  assert.match(analytics, /GA4_SKIPPED_EVENTS = new Set\(\["page_view", "web_vital"\]\)/);

  // Absent or failed gtag must never break the page.
  assert.match(analytics, /if \(typeof gtag !== "function"\) return;/);
  assert.match(analytics, /catch \{/);

  // GA4 limits: 25 params, 100-character values.
  assert.match(analytics, /Object\.keys\(params\)\.length >= 24/);
  assert.match(analytics, /\.slice\(0, 100\)/);
});
