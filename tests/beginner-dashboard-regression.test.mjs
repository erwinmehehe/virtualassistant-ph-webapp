import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("client and VA get four simple primary tabs and all other tools stay available", async () => {
  const nav = await read("src/components/app-nav-links.tsx");
  const client = nav.slice(nav.indexOf("  client: ["), nav.indexOf("  va: ["));
  const va = nav.slice(nav.indexOf("  va: ["), nav.indexOf("  recruiter: ["));
  for (const label of ["Home", "Hiring", "Messages", "My Team"]) assert.match(client, new RegExp(`\\["${label}",`));
  for (const label of ["Home", "Jobs", "Applications", "Messages"]) assert.match(va, new RegExp(`\\["${label}",`));
  for (const label of ["Payments", "Proposals", "Support"]) assert.match(client, new RegExp(`\\["${label}",`));
  for (const label of ["My Work", "Profile", "Screening", "Payouts"]) assert.match(va, new RegExp(`\\["${label}",`));
  assert.match(nav, /workspace-nav-more/);
  assert.match(nav, /va: \["\/workspace\/va", "\/workspace\/va\/jobs", "\/workspace\/va\/applications", "\/workspace\/va\/messages"\]/);
});

test("homepages use role-scoped actionable decisions instead of stage counts for primary CTA", async () => {
  const [client, va, signals] = await Promise.all([
    read("src/app/workspace/client/page.tsx"),
    read("src/app/workspace/va/page.tsx"),
    read("src/lib/dashboard-attention.ts"),
  ]);
  assert.match(client, /resolveClientHomeAction\(attention\)/);
  assert.match(va, /resolveVaHomeAction\(/);
  assert.match(signals, /\.eq\("client_id", clientId\)/);
  assert.match(signals, /\.eq\("va_id", vaId\)/);
  assert.match(client, /Getting started|Finish getting started/);
  assert.doesNotMatch(client, /Confirm a placement",description/);
  assert.doesNotMatch(va, /Start your first managed placement",description/);
  assert.doesNotMatch(va, /Express interest in a role",description/);
});

test("VA recommendations respect public moderation and expiry, not raw published status", async () => {
  const source = await read("src/components/va-dashboard-matches.tsx");
  const publicView = await read("supabase/migrations/20261003210000_recruiter_managed_public_jobs.sql");
  assert.match(source, /from\("public_jobs"\)/);
  assert.doesNotMatch(source, /from\("jobs"\)/);
  assert.match(source, /MIN_HOURLY_RATE/);
  assert.match(publicView, /j\.moderation_status = 'clear'/);
  assert.match(publicView, /j\.expires_at > now\(\)/);
});

test("the company identity disclosure matches current public job database behavior", async () => {
  const [company, wizard, onboarding, jobPage] = await Promise.all([
    read("src/app/workspace/client/company/page.tsx"),
    read("src/components/job-wizard.tsx"),
    read("src/app/workspace/client/onboarding/page.tsx"),
    read("src/app/workspace/client/jobs/new/page.tsx"),
  ]);
  assert.match(company, /public job listings display your company name/i);
  assert.match(company, /additional company details/i);
  assert.doesNotMatch(company, /public roles use .Confidential Client./i);
  assert.match(wizard, /Published job posts always show the company name/);
  assert.match(onboarding, /company name will appear on the public listing/i);
  assert.match(jobPage, /Public job listings display your company name/);
});

test("browser-only job drafts are isolated by client and never misrepresented as synced", async () => {
  const [wizard, newJob, editJob, publicPost] = await Promise.all([
    read("src/components/job-wizard.tsx"),
    read("src/app/workspace/client/jobs/new/page.tsx"),
    read("src/app/workspace/client/jobs/[id]/edit/page.tsx"),
    read("src/app/post-a-job/page.tsx"),
  ]);
  assert.match(wizard, /va_job_draft_new_\$\{draftScope\}/);
  assert.match(wizard, /importPublicDraft/);
  assert.match(wizard, /removeItem\("va_job_draft_new"\)/);
  assert.match(wizard, /Draft saved on this device/);
  assert.match(newJob, /draftScope=\{user\.id\}/);
  assert.match(newJob, /importPublicDraft=\{fromPublicDraft\}/);
  assert.match(editJob, /Save<\/strong> to update/);
  assert.match(publicPost, /Draft saved on this device/);
});

test("action links have real destinations and accessible core form labels", async () => {
  const [offers, interviews, onboarding, wizard] = await Promise.all([
    read("src/app/workspace/client/offers/page.tsx"),
    read("src/app/workspace/va/interviews/page.tsx"),
    read("src/app/workspace/client/onboarding/page.tsx"),
    read("src/components/job-wizard.tsx"),
  ]);
  assert.match(offers, /id=\{\`offer-\$\{offer\.id\}\`\}/);
  assert.match(interviews, /id=\{\`interview-\$\{row\.id\}\`\}/);
  assert.match(onboarding, /htmlFor="client-onboarding-timezone"/);
  assert.match(wizard, /htmlFor="job-summary"/);
  assert.match(wizard, /htmlFor="job-company"/);
});
