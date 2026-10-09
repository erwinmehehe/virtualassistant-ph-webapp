import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("VA private portfolio preview is responsive and offers safe navigation", async () => {
  const [page, component, css] = await Promise.all([
    read("src/app/workspace/va/profile/preview/page.tsx"),
    read("src/components/va-portfolio-preview.tsx"),
    read("src/components/va-portfolio-preview.module.css"),
  ]);

  assert.match(page, /<VaPortfolioPreview/);
  assert.match(page, /requireRole\("va"\)/);
  assert.match(page, /backHref="\/workspace\/va\/profile"/);
  assert.match(component, /Back to my profile/);
  assert.match(component, /Edit my portfolio/);
  assert.match(component, /aria-label="Portfolio sections"/);
  assert.match(css, /@media\(max-width:790px\)/);
  assert.match(css, /@media\(max-width:560px\)/);
  assert.match(css, /\.navigation\{display:flex/);
  assert.match(css, /\.railAction\{display:flex/);
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
