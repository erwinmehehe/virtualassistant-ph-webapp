import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("src/app/jobs/page.tsx", "utf8");
const css = readFileSync("src/app/jobs/jobs-marketplace.css", "utf8");
const postJobPage = readFileSync("src/app/workspace/client/jobs/new/page.tsx", "utf8");
const jobSearchGuides = readFileSync("src/lib/blog-job-search-guides.ts", "utf8");

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
  assert.match(postJobPage, /<h1>Post a Virtual Assistant job<\/h1>/);
  assert.doesNotMatch(postJobPage, /<h1>Start a hiring request<\/h1>/);
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


test("jobs hub and comparison guide reinforce separate search intents", () => {
  assert.match(page, /\/blog\/free-virtual-assistant-job-websites-philippines/);
  assert.match(jobSearchGuides, /"slug": "free-virtual-assistant-job-websites-philippines"/);
  assert.match(jobSearchGuides, /Free Virtual Assistant Job Websites Philippines \| 2026 Guide/);
  assert.match(jobSearchGuides, /"href": "\/jobs"/);
  assert.match(jobSearchGuides, /"href": "\/auth\/join\/client\?next=%2Fworkspace%2Fclient%2Fjobs%2Fnew"/);
});
