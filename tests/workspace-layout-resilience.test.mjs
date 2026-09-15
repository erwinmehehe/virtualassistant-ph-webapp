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

test("workspace uses the main column as the single vertical scroll owner", () => {
  assert.match(css, /\.dashboard-shell\s*\{[\s\S]*height:\s*100dvh/);
  assert.match(css, /\.dashboard-shell\s*\{[\s\S]*overflow:\s*hidden/);
  assert.match(css, /\.dashboard-shell \.app-main\s*\{[\s\S]*min-height:\s*0/);
  assert.match(css, /\.dashboard-shell \.app-main\s*\{[\s\S]*overflow-x:\s*clip/);
  assert.match(css, /\.dashboard-shell \.app-main\s*\{[\s\S]*overflow-y:\s*auto/);
  assert.match(css, /scrollbar-gutter:\s*stable/);
});

test("candidate profile layout collapses before the compact dashboard rail can overflow", () => {
  assert.match(css, /grid-template-columns:\s*minmax\(0, 1fr\) minmax\(280px, 330px\)/);
  assert.match(css, /@media \(max-width: 1240px\)/);
  assert.match(css, /\.profile-sidebar\s*\{[\s\S]*position:\s*static/);
  assert.match(css, /\.contact-email-link[\s\S]*overflow-wrap:\s*anywhere/);
});

test("mobile workspaces retain their own full-height vertical scroll region", () => {
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /\.dashboard-shell \.app-main\s*\{[\s\S]*height:\s*100dvh[\s\S]*overflow-y:\s*auto/);
  assert.match(css, /-webkit-overflow-scrolling:\s*touch/);
});
