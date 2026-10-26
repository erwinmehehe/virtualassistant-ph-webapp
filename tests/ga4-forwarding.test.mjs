import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

function allowedCspSources(config, directive) {
  const prefix = String.fromCharCode(96) + directive + " ";
  const sourceLine = config.split("\n").find((line) => line.trimStart().startsWith(prefix));
  assert.ok(sourceLine, "Missing " + directive + " CSP directive");
  // Compare complete whitespace-delimited CSP source expressions instead of URL substrings.
  return new Set(sourceLine.replaceAll(String.fromCharCode(96), "").replace(/[",]/g, "").trim().split(/\s+/));
}


test("GA4 remains installed for public page views and conversions", () => {
  const layout = read("src/app/layout.tsx");
  const config = read("next.config.ts");
  assert.match(layout, /NEXT_PUBLIC_GA_MEASUREMENT_ID/);
  assert.match(layout, /googletagmanager\.com\/gtag\/js\?id=/);
  assert.match(layout, /id="ga4-init"/);
  assert.match(layout, /gtag\('config', '\$\{gaId\}'\)/);
  assert.match(layout, /<AttributionTracker\/><Analytics\/>/);
  const scriptSources = allowedCspSources(config, "script-src");
  const connectSources = allowedCspSources(config, "connect-src");
  assert.ok(scriptSources.has("https://www.googletagmanager.com"));
  assert.ok(connectSources.has("https://www.google-analytics.com"));
  assert.ok(connectSources.has("https://*.google-analytics.com"));
});

test("GA4 events do not trigger Vercel analytics requests or Web Vitals", () => {
  const client = read("src/components/analytics.tsx");
  const route = read("src/app/api/analytics/route.ts");
  assert.match(client, /forwardToGa4/);
  assert.match(client, /function sendMany\(events: AnalyticsEvent\[\]\)/);
  assert.match(client, /for \(const \{ event, metadata \} of events\) forwardToGa4\(event, metadata\)/);
  assert.match(client, /event\.startsWith\("training_"\)/);
  assert.match(client, /GA4_SKIPPED_EVENTS = new Set\(\["page_view"\]\)/);
  assert.match(client, /!isTrainingPath\(pathname\)/);
  for (const event of ["pricing_view", "hire_page_view", "candidate_view", "booking_click"]) {
    assert.ok(client.includes('"' + event + '"'), event + " stays in GA4");
  }
  assert.doesNotMatch(client, /useReportWebVitals|send\("web_vital"|sendBeacon|fetch\(|navigator\.sendBeacon/);
  assert.match(route, /status: 204/);
  assert.doesNotMatch(route, /createAdminClient|analytics_events|enforceActionRateLimit/);
});

test("GA4 event names and training-event exclusion behave correctly", () => {
  const src = read("src/components/analytics.tsx");
  const start = src.indexOf("const GA4_SKIPPED_EVENTS");
  const end = src.indexOf("type AnalyticsEvent =", start);
  assert.ok(start >= 0 && end > start, "Extract GA4 helpers for runtime checks");
  const js = ts.transpileModule(src.slice(start, end) + "\nmodule.exports = { ga4EventName, forwardToGa4 };", {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const calls = [];
  const fakeWindow = {
    location: { pathname: "/hire" },
    gtag: (...args) => calls.push(args),
  };
  const module = { exports: {} };
  new Function("window", "module", "exports", js)(fakeWindow, module, module.exports);
  const { ga4EventName, forwardToGa4 } = module.exports;
  assert.equal(ga4EventName("Booking Click"), "booking_click");
  assert.equal(ga4EventName("2FA enabled"), "event_2fa_enabled");
  forwardToGa4("page_view");
  forwardToGa4("training_checkpoint_attempt");
  assert.equal(calls.length, 0, "Page views are native GA4; training event tracking stays retired");
  forwardToGa4("booking_click", { cta_position: "hero" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "event");
  assert.equal(calls[0][1], "booking_click");
  assert.equal(calls[0][2].page_path, "/hire");
  assert.equal(calls[0][2].cta_position, "hero");
});
