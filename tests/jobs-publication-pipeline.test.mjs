import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("database prevents duplicate open roles for the same client and normalized title", async () => {
  const migration = await read("supabase/migrations/20260920091000_prevent_duplicate_open_jobs.sql");

  assert.match(migration, /jobs_one_open_normalized_title_per_client_idx/);
  assert.match(migration, /lower\(btrim\(title\)\)/);
  assert.match(migration, /status in \('draft','pending','published'\)/);
  assert.match(migration, /Duplicate role consolidated into/);
  assert.match(migration, /job_shortlist_candidates/);
});

test("client job submit reuses the existing role when the database duplicate guard wins", async () => {
  const jobs = await read("src/app/actions/jobs.ts");

  assert.match(jobs, /error\.code === "23505"/);
  assert.match(jobs, /normalizedTitle = title\.trim\(\)\.toLowerCase\(\)/);
  assert.match(jobs, /savedId = existing\.id/);
  assert.match(jobs, /previousStatus = existing\.status/);
});

test("guest hiring forms use a wider duplicate submission window", async () => {
  const leads = await read("src/app/actions/leads.ts");
  assert.match(leads, /DUPLICATE_SUBMISSION_WINDOW_MINUTES = 30/);
  assert.match(leads, /findRecentDuplicateLead/);
});

test("recruiter role control center exposes publication blocker actions", async () => {
  const role = await read("src/app/workspace/recruiter/roles/[id]/page.tsx");
  const helper = await read("src/lib/job-publication.ts");

  assert.match(role, /Publication status/);
  assert.match(role, /Send client account link/);
  assert.match(role, /Prepare standard terms/);
  assert.match(role, /Follow up with client/);
  assert.match(helper, /Needs client account/);
  assert.match(helper, /Needs role details/);
  assert.match(helper, /Needs terms/);
  assert.match(helper, /Waiting client approval/);
  assert.match(helper, /Published/);
});

test("client claim email points to the secure lead-bound account flow", async () => {
  const email = await read("src/lib/email.ts");
  const actions = await read("src/app/actions/agency-role.ts");

  assert.match(email, /auth\/join\/client\?lead=/);
  assert.match(email, /Claim my hiring request/);
  assert.match(actions, /sendClientAccountClaimAction/);
  assert.match(actions, /sendClaimDraftEmail/);
  assert.match(actions, /client_account_claim_sent/);
});


test("selected clients can self-publish complete curated-placement jobs only", async () => {
  const migration = await read("supabase/migrations/20260920090500_client_job_self_publish_permission.sql");
  const jobs = await read("src/app/actions/jobs.ts");
  const admin = await read("src/app/actions/admin.ts");
  const adminJob = await read("src/app/workspace/admin/jobs/[id]/page.tsx");

  assert.match(migration, /can_self_publish_jobs boolean not null default false/);
  assert.match(jobs, /select\("can_self_publish_jobs"\)/);
  assert.match(jobs, /serviceModel === "curated_placement"/);
  assert.match(jobs, /status: submitMode === "draft" \? "draft" : selfPublish \? "published" : "pending"/);
  assert.match(jobs, /published_at: selfPublish \? new Date\(\)\.toISOString\(\) : null/);
  assert.match(jobs, /Complete the public job before publishing/);
  assert.match(admin, /setClientJobSelfPublishAction/);
  assert.match(adminJob, /Allow direct publishing/);
  assert.match(adminJob, /Managed-service roles still require review/);
});

test("approved client publishing UI explains when a job will go live", async () => {
  const newJob = await read("src/app/workspace/client/jobs/new/page.tsx");
  const wizard = await read("src/components/job-wizard.tsx");
  const clientJobs = await read("src/app/workspace/client/jobs/page.tsx");

  assert.match(newJob, /can_self_publish_jobs/);
  assert.match(newJob, /Post a Virtual Assistant job/);
  assert.match(wizard, /canSelfPublishJobs/);
  assert.match(wizard, /Publish job/);
  assert.match(wizard, /public Virtual Assistant jobs directory immediately/);
  assert.match(clientJobs, /Direct publishing is enabled for your account/);
});


test("all publication write paths use the same required-role validator", async () => {
  const [helper, jobs, admin] = await Promise.all([
    read("src/lib/job-publication.ts"),
    read("src/app/actions/jobs.ts"),
    read("src/app/actions/admin.ts"),
  ]);

  assert.match(helper, /export function publicationMissingDetails/);
  assert.match(helper, /missing\.push\("start timing"\)/);
  assert.match(helper, /missing\.push\("hours"\)/);
  assert.match(helper, /missing\.push\("timezone"\)/);
  assert.match(helper, /missing\.push\("budget"\)/);

  assert.match(jobs, /publicationMissingDetails\(\{/);
  assert.match(jobs, /Complete the public job before publishing/);
  assert.match(jobs, /Complete the role before publishing/);
  assert.match(admin, /publicationMissingDetails\(job\)/);
  assert.match(admin, /Complete the role before sending terms/);
});

test("client commercial acceptance fetches every publication-required job field before publishing", async () => {
  const jobs = await read("src/app/actions/jobs.ts");
  assert.match(jobs, /select\("id,status,client_id,title,summary,responsibilities,required_skills,hours_per_week,timezone,min_hourly_rate,start_timing"\)/);
  const validationIndex = jobs.indexOf("const missing = publicationMissingDetails(job)");
  const publishIndex = jobs.indexOf('update({status:"published",published_at:publishedAt})');
  assert.ok(validationIndex >= 0 && publishIndex > validationIndex, "publication validation must happen before the published update");
});
