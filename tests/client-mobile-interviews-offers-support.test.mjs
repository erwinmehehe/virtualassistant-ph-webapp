import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("client interviews stack scheduling and feedback safely on phones", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/client/interviews/page.tsx"),
    read("src/app/workspace/client/client-mobile.css"),
  ]);

  for (const className of [
    "client-interviews-page",
    "client-interview-card",
    "client-interview-scheduler",
    "client-interview-feedback",
    "client-interview-join",
  ]) {
    assert.match(page, new RegExp(className));
  }

  assert.match(css, /Client mobile pass: interviews, offers, placement support/);
  assert.match(css, /\.client-interview-scheduler > form[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /\.client-interview-scheduler input\[type="datetime-local"\][\s\S]*font-size: 16px/);
  assert.match(css, /\.client-interview-feedback textarea[\s\S]*min-height: 118px/);
});

test("client placement offers keep terms and confirmation readable on mobile", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/client/offers/page.tsx"),
    read("src/app/workspace/client/client-mobile.css"),
  ]);

  assert.match(page, /client-offers-page/);
  assert.match(page, /client-offer-card/);
  assert.match(page, /client-offer-terms/);
  assert.match(page, /client-offer-confirm/);
  assert.match(css, /\.client-offer-terms[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.client-offer-confirm \.btn[\s\S]*min-height: 44px/);
  assert.match(css, /@media \(max-width: 420px\)[\s\S]*\.client-offer-terms[\s\S]*grid-template-columns: 1fr/);
});

test("client placement support uses a compact single-column phone flow", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/client/support/page.tsx"),
    read("src/app/workspace/client/client-mobile.css"),
  ]);

  for (const className of [
    "client-support-page",
    "client-support-guidance",
    "client-support-placement-card",
    "client-support-form",
    "client-support-actions",
    "client-support-update",
  ]) {
    assert.match(page, new RegExp(className));
  }

  assert.match(css, /\.client-support-form \.form-grid[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /\.client-support-form input,[\s\S]*font-size: 16px/);
  assert.match(css, /\.client-support-actions \.btn[\s\S]*min-height: 44px/);
  assert.match(css, /\.client-support-update > \.row\.small[\s\S]*grid-template-columns: 1fr/);
});
