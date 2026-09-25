import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("candidate review stacks evidence and next steps on phones", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/client/candidates/[id]/page.tsx"),
    read("src/app/workspace/client/client-mobile.css"),
  ]);

  for (const className of [
    "client-candidate-review-page",
    "client-candidate-review-layout",
    "client-candidate-review-card",
    "client-candidate-video-row",
    "client-candidate-sidebar",
    "client-candidate-next-step",
  ]) assert.match(page, new RegExp(className));

  assert.match(css, /Client mobile pass: candidate review, compare, payments/);
  assert.match(css, /\.client-candidate-review-layout[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /\.client-candidate-video-row \.btn[\s\S]*min-height: 42px/);
  assert.match(css, /\.client-candidate-next-step \.btn[\s\S]*min-height: 42px/);
});

test("candidate access gate is compact and action-first on mobile", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/client/candidates/[id]/page.tsx"),
    read("src/app/workspace/client/client-mobile.css"),
  ]);

  assert.match(page, /client-candidate-access-page/);
  assert.match(css, /\.client-candidate-access-page \.candidate-access-gate[\s\S]*grid-template-columns: 38px minmax\(0, 1fr\)/);
  assert.match(css, /\.client-candidate-access-page \.candidate-access-gate-action \.btn[\s\S]*min-height: 44px/);
  assert.match(css, /@media \(max-width: 420px\)[\s\S]*\.client-candidate-access-page \.candidate-access-gate[\s\S]*grid-template-columns: 1fr/);
});

test("candidate comparison collapses to readable cards on phones", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/client/compare/page.tsx"),
    read("src/app/workspace/client/client-mobile.css"),
  ]);

  for (const className of [
    "client-compare-page",
    "client-compare-grid",
    "client-compare-card",
    "client-compare-facts",
    "client-compare-review",
  ]) assert.match(page, new RegExp(className));

  assert.match(css, /\.client-compare-grid[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /\.client-compare-facts[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.client-compare-review[\s\S]*min-height: 44px/);
  assert.match(css, /@media \(max-width: 420px\)[\s\S]*\.client-compare-facts[\s\S]*grid-template-columns: 1fr/);
});

test("client payments stay readable and tappable without changing payment actions", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/client/payments/page.tsx"),
    read("src/app/workspace/client/client-mobile.css"),
  ]);

  for (const className of [
    "client-payments-page",
    "client-payment-card",
    "client-payment-summary",
    "client-payment-amount",
    "client-payment-dispute-form",
  ]) assert.match(page, new RegExp(className));

  assert.match(page, /action=\{createCheckoutSessionAction\}/);
  assert.match(page, /action=\{fileDisputeAction\}/);
  assert.match(css, /\.client-payment-summary[\s\S]*flex-direction: column/);
  assert.match(css, /\.client-payment-amount \.btn[\s\S]*min-height: 44px/);
  assert.match(css, /\.client-payment-dispute-form textarea[\s\S]*font-size: 16px/);
});
