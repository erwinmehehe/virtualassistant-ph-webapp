import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const layout = read("src/app/workspace/layout.tsx");
const css = read("src/app/workspace/workspace-layout-fixes.css");

test("workspace loads layout safeguards after the premium dashboard CSS", () => {
  const premiumIndex = layout.indexOf('import "../dashboard-premium.css"');
  const fixesIndex = layout.indexOf('import "./workspace-layout-fixes.css"');
  assert.ok(premiumIndex >= 0);
  assert.ok(fixesIndex > premiumIndex);
});

test("workspace keeps natural document scrolling instead of trapping the viewport", () => {
  assert.doesNotMatch(css, /overflow:\s*hidden/);
  assert.doesNotMatch(css, /overflow-y:\s*auto/);
  assert.doesNotMatch(css, /(?:^|\n)\s*height:\s*100dvh\s*;/m);
  assert.doesNotMatch(css, /\.dashboard-shell\s*\{[\s\S]*display:\s*block/);
  assert.match(css, /min-height:\s*100dvh/);
});

test("candidate profile layout collapses before the compact dashboard rail can overflow", () => {
  assert.match(css, /grid-template-columns:\s*minmax\(0, 1fr\) minmax\(280px, 330px\)/);
  assert.match(css, /@media \(max-width: 1240px\)/);
  assert.match(css, /\.profile-sidebar\s*\{[\s\S]*position:\s*static/);
  assert.match(css, /\.contact-email-link[\s\S]*overflow-wrap:\s*anywhere/);
});

test("workspace fixes do not override shell or score-card responsive behavior", () => {
  const compactBlock = css.match(/@media \(max-width: 760px\) \{([\s\S]*?)\n\}/)?.[1] || "";
  assert.doesNotMatch(compactBlock, /\.dashboard-shell\s*\{/);
  assert.doesNotMatch(compactBlock, /\.app-main\s*\{/);
  assert.doesNotMatch(compactBlock, /\.score-grid/);
  assert.match(compactBlock, /\.profile-sidebar/);
});
