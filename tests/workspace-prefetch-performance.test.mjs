import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const nav = read("src/components/app-nav-links.tsx");
const dashUi = read("src/components/dash-ui.tsx");
const recruiter = read("src/app/workspace/recruiter/today/page.tsx");
const clientSuccess = read("src/app/workspace/client-success/page.tsx");

// Authenticated workspace links are intentionally click-to-load. The production
// regression was caused by eager prefetch multiplying auth and server data work.
test("workspace navigation does not eagerly prefetch every authenticated route", () => {
  assert.match(nav, /<Link[\s\S]*?prefetch=\{false\}[\s\S]*?href=\{href\}/);
});

test("shared dashboard cards and signal links avoid background route prefetch", () => {
  assert.match(dashUi, /href \? <Link prefetch=\{false\} className="dash-stat"/);
  assert.match(dashUi, /<Link prefetch=\{false\} className="dash-signal"/);
});

test("recruiter My Day does not preload dense action destinations", () => {
  assert.match(recruiter, /actionLanes\.map\(\(lane\)=><Link prefetch=\{false\}/);
  assert.match(recruiter, /<Link prefetch=\{false\} className="btn"/);
});

test("Client Success queue does not prefetch every placement detail", () => {
  assert.match(clientSuccess, /<Link prefetch=\{false\} className="card" href=\{`\/workspace\/client-success\/\$\{r\.workroom_id\}`\}/);
});
