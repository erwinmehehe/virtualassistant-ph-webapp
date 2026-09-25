import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("VA notifications are compact and action-friendly on phones", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/va/notifications/page.tsx"),
    read("src/app/workspace/va/va-workspace.css"),
  ]);

  assert.match(page, /va-notifications-page/);
  assert.match(page, /va-notification-card/);
  assert.match(page, /va-notification-actions/);
  assert.match(css, /VA mobile pass: notifications, offers, onboarding/);
  assert.match(css, /\.va-notification-actions[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.va-notification-actions \.btn[\s\S]*min-height: 42px/);
});

test("VA offers expose readable terms and full-width mobile decisions", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/va/offers/page.tsx"),
    read("src/app/workspace/va/va-workspace.css"),
  ]);

  assert.match(page, /va-offers-page/);
  assert.match(page, /va-offer-card/);
  assert.match(page, /va-offer-terms/);
  assert.match(page, /va-offer-actions/);
  assert.match(css, /\.va-offer-terms[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.va-offer-actions \.btn[\s\S]*min-height: 44px/);
});

test("VA quick onboarding is responsive and iOS-friendly", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/va/onboarding/page.tsx"),
    read("src/app/workspace/va/va-workspace.css"),
  ]);

  assert.match(page, /va-quick-setup-page/);
  assert.match(page, /va-onboarding-progress/);
  assert.match(page, /va-onboarding-form/);
  assert.match(css, /\.va-quick-setup-layout[\s\S]*grid-template-columns: minmax\(250px, 310px\) minmax\(0, 1fr\)/);
  assert.match(css, /\.va-quick-setup-metrics[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.va-quick-setup-metrics[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /\.va-onboarding-form input,[\s\S]*font-size: 16px/);
  assert.match(css, /\.va-onboarding-actions \.btn[\s\S]*min-height: 46px/);
});
