import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("src/app/jobs/page.tsx", "utf8");
const css = readFileSync("src/app/jobs/jobs-marketplace.css", "utf8");

test("jobs page targets the Philippines VA jobs keyword cluster", () => {
  assert.match(page, /Virtual Assistant Jobs Philippines \| Free VA Job Website/);
  assert.match(page, /free virtual assistant job websites philippines/);
  assert.match(page, /virtual assistant job philippines/);
  assert.match(page, /philippines virtual assistant jobs/);
  assert.match(page, /<h1>Virtual Assistant Jobs Philippines<\/h1>/);
});

test("jobs page makes job posting a prominent employer conversion path", () => {
  assert.match(page, /Hiring a Filipino Virtual Assistant\?/);
  assert.match(page, /Post a Virtual Assistant job in the Philippines/);
  assert.match(page, /Post a VA job/);
  assert.match(page, /EMPLOYER_POST_HREF/);
  assert.match(css, /\.jobs-employer-card/);
  assert.match(css, /\.jobs-employer-cta/);
});

test("jobs collection exposes crawlable structured data", () => {
  assert.match(page, /"@type": "CollectionPage"/);
  assert.match(page, /"@type": "ItemList"/);
  assert.match(page, /jobPublicHref\(job\)/);
});

test("jobs page states applicant fees precisely", () => {
  assert.match(page, /No VA-side platform fee/);
  assert.match(page, /Employer recruiting, candidate-access, placement, or managed-service fees are separate/);
});
