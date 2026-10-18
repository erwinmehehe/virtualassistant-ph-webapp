import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const marker = "/* VA onboarding layout fixes (2026-10-19) */";

test("VA onboarding primary action stays content-sized on desktop", async () => {
  const [css, dashboardCss, page] = await Promise.all([
    read("src/app/workspace/va/va-workspace.css"),
    read("src/app/dashboard-premium.css"),
    read("src/app/workspace/va/onboarding/page.tsx"),
  ]);

  assert.match(dashboardCss, /\.dashboard-shell \.va-quick-setup-actions \.btn-primary\s*\{\s*flex: 1 1 auto;/);
  assert.ok(css.includes(marker));
  const fix = css.slice(css.indexOf(marker));
  assert.match(
    fix,
    /\.dashboard-shell \.va-quick-setup-actions\.va-onboarding-actions \.btn-primary\s*\{\s*flex: 0 0 auto;\s*width: auto;/
  );
  assert.match(fix, /\.va-onboarding-action-note\s*\{[\s\S]*?font-size: 12px;/);
  assert.match(page, /id="va-onboarding-step-1" action=\{saveVaOnboardingBasicsAction\}/);
  assert.match(page, /Save & continue/);
});

test("VA onboarding stacks before tablet widths crowd the progress sidebar", async () => {
  const css = await read("src/app/workspace/va/va-workspace.css");
  const fix = css.slice(css.indexOf(marker));
  const tablet = fix.split("@media (max-width: 1040px) {")[1]?.split("@media (max-width: 680px) {")[0] || "";
  assert.ok(tablet);
  assert.match(tablet, /\.dashboard-shell \.va-quick-setup-layout\s*\{\s*grid-template-columns: minmax\(0, 1fr\);/);
  assert.match(tablet, /\.dashboard-shell \.va-quick-setup-progress\s*\{\s*position: static;/);
  assert.match(tablet, /\.dashboard-shell \.va-quick-setup-step-list\s*\{\s*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
});

test("VA onboarding keeps mobile buttons full-width and guidance visible", async () => {
  const css = await read("src/app/workspace/va/va-workspace.css");
  const fix = css.slice(css.indexOf(marker));
  const mobile = fix.split("@media (max-width: 680px) {")[1] || "";
  assert.ok(mobile);
  assert.match(mobile, /\.dashboard-shell \.va-quick-setup-actions\.va-onboarding-actions\s*\{\s*display: grid;\s*grid-template-columns: minmax\(0, 1fr\);/);
  assert.match(mobile, /\.dashboard-shell \.va-quick-setup-actions\.va-onboarding-actions \.btn-primary,[\s\S]*?width: 100%;/);
  assert.match(mobile, /\.va-onboarding-action-note\s*\{\s*order: 2;\s*text-align: center;/);
});
