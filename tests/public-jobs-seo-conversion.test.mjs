import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("src/app/jobs/page.tsx", "utf8");
const css = readFileSync("src/app/jobs/jobs-marketplace.css", "utf8");
const postJobPage = readFileSync("src/app/workspace/client/jobs/new/page.tsx", "utf8");
const jobSearchGuides = readFileSync("src/lib/blog-job-search-guides.ts", "utf8");
const postJobPublicPage = readFileSync("src/app/post-a-job/page.tsx", "utf8");
const jobWizard = readFileSync("src/components/job-wizard.tsx", "utf8");
const joinForm = readFileSync("src/components/join-account-form.tsx", "utf8");
const jobDraftSuggestions = readFileSync("src/lib/job-draft-suggestions.ts", "utf8");

test("jobs page targets live Philippines VA job intent without keyword stuffing", () => {
  assert.match(page, /Virtual Assistant Jobs Philippines \| Free VA Job Website/);
  assert.match(page, /<h1>Virtual Assistant Jobs Philippines<\/h1>/);
  assert.match(page, /remote VA roles with pay, weekly hours, and timezone expectations shown upfront/i);
  assert.match(page, /\/blog\/free-virtual-assistant-job-websites-philippines/);
  assert.doesNotMatch(page, /keywords:\s*\[/);
});

test("jobs page makes job posting a prominent employer conversion path", () => {
  assert.match(page, /Hiring a Filipino Virtual Assistant\?/);
  assert.match(page, /Post a Virtual Assistant job in the Philippines/);
  assert.match(page, /Post a VA job/);
  assert.match(page, /EMPLOYER_POST_HREF/);
  assert.match(page, /const EMPLOYER_POST_HREF = "\/post-a-job"/);
  assert.match(postJobPage, /Post a Virtual Assistant job/);
  assert.doesNotMatch(postJobPage, /Start a hiring request/);
  assert.match(css, /\.jobs-employer-card/);
  assert.match(css, /\.jobs-bottom-cta/);
});

test("jobs collection exposes crawlable structured data", () => {
  assert.match(page, /"@type": "CollectionPage"/);
  assert.match(page, /"@type": "ItemList"/);
  assert.match(page, /jobPublicHref\(job\)/);
});

test("jobs page states applicant fees precisely", () => {
  assert.match(page, /without a VA-side platform fee/);
  assert.match(page, /Employer recruiting, candidate-access, placement, or managed-service fees are separate/);
});


test("jobs hub and comparison guide reinforce separate search intents", () => {
  assert.match(page, /\/blog\/free-virtual-assistant-job-websites-philippines/);
  assert.match(jobSearchGuides, /"slug": "free-virtual-assistant-job-websites-philippines"/);
  assert.match(jobSearchGuides, /Free Virtual Assistant Job Websites Philippines \| 2026 Guide/);
  assert.match(jobSearchGuides, /"href": "\/jobs"/);
  assert.match(jobSearchGuides, /"href": "\/post-a-job"/);
});


test("employers can draft and preview a job before account creation", () => {
  assert.match(postJobPublicPage, /Create the job first/);
  assert.match(postJobPublicPage, /<JobWizard publicMode/);
  assert.match(jobWizard, /const steps = \["Describe the work", "Schedule & pay", "Preview & post"\]/);
  assert.match(jobWizard, /publicMode \? "Create free account to post"/);
  assert.match(jobWizard, /What should your VA handle\?/);
  assert.match(jobWizard, /job-post-preview/);
  assert.match(jobWizard, /const candidate = step === 0 \? \{ \.\.\.data, \.\.\.starterBriefValues\(data\) \} : data/);
  assert.match(jobWizard, /suggestJobDraft/);
  assert.match(jobWizard, /Write the work in your own words/);
  assert.match(jobWizard, /starterBriefValues/);
  assert.match(jobWizard, /window\.location\.assign\("\/auth\/join\/client\?next=%2Fworkspace%2Fclient%2Fjobs%2Fnew%3Ffrom_post%3D1"\)/);
  assert.doesNotMatch(jobWizard, /Choose your hiring support/);
});

test("client signup and workspace resume the saved public job draft", () => {
  assert.match(joinForm, /Your job draft is saved on this device/);
  assert.match(joinForm, /return to your saved job preview/);
  assert.match(postJobPage, /fromPublicDraft/);
  assert.match(postJobPage, /Review and post your job/);
  assert.match(postJobPage, /initialStep=\{fromPublicDraft\?2/);
});


test("job draft suggestions only emit matcher-supported VAPH categories", () => {
  assert.doesNotMatch(jobDraftSuggestions, /category: "General Virtual Assistance"/);
  assert.doesNotMatch(jobDraftSuggestions, /category: "Customer Support"/);
  for (const category of [
    "Administrative Support",
    "Bookkeeping & Finance",
    "Customer Service",
    "Dental & Healthcare",
    "Ecommerce",
    "Executive Assistance",
    "Lead Generation & Sales",
    "Marketing & Social Media",
    "Phone & Reception",
    "Real Estate",
    "SEO",
    "Video Editing & Creative",
    "Web & WordPress",
  ]) {
    assert.match(jobDraftSuggestions, new RegExp(`category: "${category.replace(/[&]/g, "\\&")}"`));
  }
});
