import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const layout = read("src/app/workspace/layout.tsx");
const css = read("src/app/workspace/workspace-layout-fixes.css");

test("workspace loads overflow safeguards after the premium dashboard CSS", () => {
  const premiumIndex = layout.indexOf('import "../dashboard-premium.css"');
  const fixesIndex = layout.indexOf('import "./workspace-layout-fixes.css"');
  assert.ok(premiumIndex >= 0);
  assert.ok(fixesIndex > premiumIndex);
});

test("workspace shell cannot create a document-wide horizontal scrollbar", () => {
  assert.match(css, /max-width:\s*100vw/);
  assert.match(css, /overflow-x:\s*clip/);
  assert.match(css, /overflow-y:\s*visible/);
  assert.match(css, /\.app-main,\s*\n\.dashboard-shell \.app-content/);
});

test("candidate profile layout collapses before the compact dashboard rail can overflow", () => {
  assert.match(css, /grid-template-columns:\s*minmax\(0, 1fr\) minmax\(280px, 330px\)/);
  assert.match(css, /@media \(max-width: 1240px\)/);
  assert.match(css, /\.profile-sidebar\s*\{[\s\S]*position:\s*static/);
  assert.match(css, /\.contact-email-link[\s\S]*overflow-wrap:\s*anywhere/);
});
