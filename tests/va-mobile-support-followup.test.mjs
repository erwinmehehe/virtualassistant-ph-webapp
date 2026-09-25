import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("mobile More menu closes on route changes, outside taps, and Escape", async () => {
  const nav = await read("src/components/app-nav-links.tsx");

  assert.match(nav, /useEffect, useRef/);
  assert.match(nav, /const moreRef = useRef<HTMLDetailsElement>\(null\)/);
  assert.match(nav, /document\.addEventListener\("pointerdown", handlePointerDown\)/);
  assert.match(nav, /document\.addEventListener\("keydown", handleKeyDown\)/);
  assert.match(nav, /event\.key !== "Escape"/);
  assert.match(nav, /ref=\{moreRef\}/);
  assert.match(nav, /moreRef\.current\?\.removeAttribute\("open"\)/);
});

test("VA support page has a compact mobile-first support surface", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/va/support/page.tsx"),
    read("src/app/workspace/va/va-workspace.css"),
  ]);

  assert.match(page, /className="va-support-page"/);
  assert.match(page, /va-support-guidance/);
  assert.match(page, /va-support-placement-card/);
  assert.match(page, /va-support-form/);
  assert.match(page, /va-support-actions/);
  assert.match(page, /va-support-update/);

  assert.match(css, /VA support mobile cleanup/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.va-support-placement-card \.form-grid[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /\.va-support-actions[\s\S]*flex-direction: column/);
  assert.match(css, /\.va-support-form \.field textarea[\s\S]*font-size: 16px/);
});

test("VA support phone chrome stays compact without changing other workspaces", async () => {
  const css = await read("src/app/workspace/va/va-workspace.css");

  assert.match(css, /workspace-role-va:has\(\.va-support-page\) \.app-topbar/);
  assert.match(css, /workspace-role-va:has\(\.va-support-page\) \.app-content/);
});
