import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("client company profile stacks cleanly with mobile-safe controls", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/client/company/page.tsx"),
    read("src/app/workspace/client/client-mobile.css"),
  ]);
  for (const className of ["client-company-page","client-company-form","client-company-visibility","client-company-visibility-actions"]) assert.match(page, new RegExp(className));
  assert.match(css, /Client mobile pass: company, notifications, hiring role flow/);
  assert.match(css, /\.client-company-form[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /\.client-company-form input,[\s\S]*font-size: 16px/);
  assert.match(css, /\.client-company-visibility-actions \.btn[\s\S]*min-height: 44px/);
});

test("client notifications use compact cards and touch-friendly actions", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/client/notifications/page.tsx"),
    read("src/app/workspace/client/client-mobile.css"),
  ]);
  for (const className of ["client-notifications-page","client-notification-card","client-notification-layout","client-notification-actions"]) assert.match(page, new RegExp(className));
  assert.match(css, /\.client-notification-actions[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.client-notification-actions \.btn[\s\S]*min-height: 42px/);
  assert.match(css, /@media \(max-width: 420px\)[\s\S]*\.client-notification-actions[\s\S]*grid-template-columns: 1fr/);
});

test("client role wizard is mobile first for create and edit", async () => {
  const [newPage, editPage, css] = await Promise.all([
    read("src/app/workspace/client/jobs/new/page.tsx"),
    read("src/app/workspace/client/jobs/[id]/edit/page.tsx"),
    read("src/app/workspace/client/client-mobile.css"),
  ]);
  assert.match(newPage, /client-role-editor client-role-new/);
  assert.match(editPage, /client-role-editor client-role-edit/);
  assert.match(newPage, /client-role-wizard-shell/);
  assert.match(editPage, /client-role-wizard-shell/);
  assert.match(css, /\.client-role-wizard-shell \.wizard[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /\.client-role-wizard-shell input,[\s\S]*font-size: 16px/);
  assert.match(css, /\.client-role-wizard-shell \.wizard-actions[\s\S]*position: sticky/);
  assert.match(css, /\.client-role-wizard-shell \.service-model-grid[\s\S]*grid-template-columns: 1fr/);
});

test("client role detail keeps stage terms readiness and brief readable on phones", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/client/jobs/[id]/page.tsx"),
    read("src/app/workspace/client/client-mobile.css"),
  ]);
  for (const className of ["client-role-detail-page","client-role-detail-actions","client-role-next-action","client-role-commercial","client-role-stats","client-role-handling","client-role-brief-grid"]) assert.match(page, new RegExp(className));
  assert.match(css, /\.client-role-detail-page #role-readiness \.grid-2[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /\.client-role-detail-page #role-readiness input,[\s\S]*font-size: 16px/);
  assert.match(css, /\.client-role-next-action > \.btn[\s\S]*min-height: 44px/);
  assert.match(css, /\.client-role-brief-grid[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});
