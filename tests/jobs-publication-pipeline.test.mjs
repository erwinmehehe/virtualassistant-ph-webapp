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
  assert.match(leads, /DUPLICATE_SUBMISSION_WINDOW_MINUTES = 24 \* 60/);
  assert.match(leads, /findRecentDuplicateLead/);
});

test("recruiter role control center exposes publication blocker actions", async () => {
  const role = await read("src/app/workspace/recruiter/roles/[id]/page.tsx");
  const helper = await read("src/lib/job-publication.ts");

  assert.match(role, /Publication status/);
  assert.match(role, /Open client account link/);
  assert.match(role, /Prepare standard terms/);
  assert.match(role, /Follow up with client/);
  assert.match(helper, /Needs client account/);
  assert.match(helper, /Brief incomplete/);
  assert.match(helper, /Needs terms/);
  assert.match(helper, /Waiting client approval/);
  assert.match(helper, /Published/);
});

test("client claim remains available as a manual account link without pre-shortlist email", async () => {
  const [email, actions, role] = await Promise.all([
    read("src/lib/email.ts"),
    read("src/app/actions/agency-role.ts"),
    read("src/app/workspace/recruiter/roles/[id]/page.tsx"),
  ]);

  assert.match(email, /sendClaimDraftEmail/);
  assert.match(email, /client_email_deferred_until_shortlist/);
  assert.match(actions, /sendClientAccountClaimAction/);
  assert.match(actions, /client_claim_email_disabled=1/);
  assert.doesNotMatch(actions, /sendClaimDraftEmail/);
  assert.match(role, /Open client account link/);
  assert.doesNotMatch(role, /Send client account link/);
});


test("selected clients can self-publish complete curated-placement jobs only", async () => {
  const migration = await read("supabase/migrations/20260920090500_client_job_self_publish_permission.sql");
  const jobs = await read("src/app/actions/jobs.ts");
  const admin = await read("src/app/actions/admin.ts");
  const adminJob = await read("src/app/workspace/admin/jobs/[id]/page.tsx");

  assert.match(migration, /can_self_publish_jobs boolean not null default false/);
  assert.match(jobs, /select\("can_self_publish_jobs,verified_at"\)/);
  assert.match(jobs, /clientProfile\?\.can_self_publish_jobs && clientProfile\?\.verified_at/);
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
  assert.match(helper, /missing\.push\("title"\)/);
  assert.match(helper, /missing\.push\("company name"\)/);
  assert.match(helper, /missing\.push\("summary"\)/);
  assert.match(helper, /missing\.push\("responsibilities"\)/);
  assert.match(helper, /missing\.push\("budget"\)/);
  assert.doesNotMatch(helper, /missing\.push\("start timing"\)/);
  assert.doesNotMatch(helper, /missing\.push\("hours"\)/);
  assert.doesNotMatch(helper, /missing\.push\("timezone"\)/);
  assert.doesNotMatch(helper, /missing\.push\("skills"\)/);

  assert.match(jobs, /publicationMissingDetails\(\{/);
  assert.match(jobs, /Complete the public job before publishing/);
  assert.match(jobs, /This brief is missing required public content/);
  assert.match(admin, /publicationMissingDetails\(job\)/);
  assert.match(admin, /This brief is missing required public content/);
});

test("client commercial acceptance fetches every publication-required job field before publishing", async () => {
  const jobs = await read("src/app/actions/jobs.ts");
  assert.match(jobs, /select\("id,status,client_id,title,company_name,summary,description,responsibilities,required_skills,required_tools,hours_per_week,timezone,min_hourly_rate,start_timing,schedule_notes,onboarding_plan"\)/);
  const validationIndex = jobs.indexOf("const missing = publicationMissingDetails(job)");
  const publishIndex = jobs.indexOf('update({status:"published",published_at:publishedAt})');
  assert.ok(validationIndex >= 0 && publishIndex > validationIndex, "publication validation must happen before the published update");
});


test("public job UI always exposes the submitted company name and never anonymous placeholders", async () => {
  const [wizard, card, detail, jobsAction, autoPublish] = await Promise.all([
    read("src/components/job-wizard.tsx"),
    read("src/components/job-card.tsx"),
    read("src/app/jobs/[id]/page.tsx"),
    read("src/app/actions/jobs.ts"),
    read("src/lib/auto-publish.ts"),
  ]);

  assert.match(wizard, /Published job posts always show the company name/);
  assert.match(wizard, /This company name will be shown publicly on the job post/);
  assert.match(wizard, /isPublishableCompanyName\(candidate\.company_name\)/);
  assert.match(jobsAction, /Enter the real company name that will appear on the public job post/);
  assert.match(card, /if \(!isPublishableCompanyName\(companyName\)\) return null/);
  assert.match(detail, /if \(!isPublishableCompanyName\(companyName\)\) notFound\(\)/);
  assert.doesNotMatch(detail, /Private employer/);
  assert.doesNotMatch(card, /Confidential Client/);
  assert.match(autoPublish, /isPublishableCompanyName\(job\.company_name\)/);
});


test("public jobs always expose the submitted company name while richer profile fields stay opt-in", async () => {
  const migration = await read("supabase/migrations/20261003203000_publish_job_company_names.sql");
  assert.match(migration, /j\.company_name/);
  assert.match(migration, /c\.public_company_visible = true/);
  assert.match(migration, /lower\(btrim\(j\.company_name\)\) not in/);
  assert.match(migration, /'private employer'/);
  assert.match(migration, /'confidential client'/);
  assert.doesNotMatch(migration, /select[\s\S]*?c\.company_name,/);
});
