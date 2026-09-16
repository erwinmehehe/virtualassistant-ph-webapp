import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const layout = fs.readFileSync("src/app/layout.tsx", "utf8");
const css = fs.readFileSync("src/app/public-visual-system.css", "utf8");
const vaProfile = fs.readFileSync("src/app/va/[slug]/page.tsx", "utf8");
const homepagePolish = fs.readFileSync("src/app/homepage-reference-polish.css", "utf8");

const targetMarkers = [
  "industries-directory-section",
  "vetting-steps",
  "contact-routing",
  "public-jobs-page",
  "industry-conversion-hero-grid",
  "four-step-process",
  "service-hero-v2",
  "premium-services-directory",
];

test("canonical public visual layer loads after prior public polish", () => {
  assert.match(layout, /import "\.\/homepage-reference-polish\.css";/);
  assert.match(layout, /import "\.\/public-visual-system\.css";/);
  assert.ok(
    layout.indexOf('import "./public-visual-system.css";') >
      layout.indexOf('import "./homepage-reference-polish.css";'),
  );
});

test("canonical public palette uses one indigo violet and green system", () => {
  assert.match(css, /--public-indigo:\s*#4f46e5/i);
  assert.match(css, /--public-violet:\s*#7c3aed/i);
  assert.match(css, /--public-green:\s*#059669/i);
  assert.match(css, /--public-emerald:\s*#10b981/i);
});

test("older public route families are explicitly covered", () => {
  for (const marker of targetMarkers) assert.match(css, new RegExp(marker));
});

test("public visual consolidation does not target authenticated workspaces", () => {
  assert.doesNotMatch(css, /\.workspace(?:\b|-)/);
  assert.doesNotMatch(css, /workspace-shell/);
  assert.doesNotMatch(css, /dashboard-shell/);
});

test("service candidate actions stay disabled while profile URLs remain managed", () => {
  assert.match(homepagePolish, /\.service-talent-actions\s*\{[\s\S]*?display:\s*none\s*!important;/);
  assert.match(vaProfile, /redirect\("\/find-talent"\)/);
});
