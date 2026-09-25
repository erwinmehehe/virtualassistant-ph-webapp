import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("VA private profile preview is mobile friendly", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/va/profile/preview/page.tsx"),
    read("src/app/workspace/va/va-workspace.css"),
  ]);

  assert.match(page, /va-profile-preview-page/);
  assert.match(page, /va-profile-preview-toolbar/);
  assert.match(page, /va-profile-preview-card/);
  assert.match(page, /Back to profile/);
  assert.match(page, /Edit profile/);
  assert.match(css, /VA mobile pass: private profile preview and fallback states/);
  assert.match(css, /\.va-profile-preview-grid[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /\.va-profile-preview-toolbar \.btn[\s\S]*min-height: 40px/);
});

test("Account Center uses compact mobile tabs and iOS-safe form controls", async () => {
  const css = await read("src/app/workspace/account-center.css");

  assert.match(css, /Account Center mobile completion pass/);
  assert.match(css, /\.account-settings-nav[\s\S]*scroll-snap-type: x proximity/);
  assert.match(css, /\.account-email-change-form input,[\s\S]*font-size: 16px/);
  assert.match(css, /\.account-settings-section[\s\S]*padding: 14px/);
  assert.match(css, /\.account-session-action \.btn,[\s\S]*min-height: 42px/);
});

test("VA loading and error states stay usable on narrow screens", async () => {
  const css = await read("src/app/workspace/va/va-workspace.css");

  assert.match(css, /\.workspace-role-va \.workspace-skeleton[\s\S]*gap: 11px/);
  assert.match(css, /\.workspace-role-va \.workspace-skeleton \.skeleton-grid[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.workspace-role-va \.workspace-error[\s\S]*grid-template-columns: 38px minmax\(0, 1fr\)/);
  assert.match(css, /\.workspace-role-va \.workspace-error \.btn[\s\S]*min-height: 42px/);
});
