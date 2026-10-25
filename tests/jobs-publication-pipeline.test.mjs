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


test("all email-verified employer roles auto-publish without manual approval", async () => {
  const [jobs, publication, adminJob] = await Promise.all([
    read("src/app/actions/jobs.ts"),
    read("src/lib/job-publication.ts"),
    read("src/app/workspace/admin/jobs/[id]/page.tsx"),
  ]);

  assert.match(jobs, /emailVerified: Boolean\(user\.email_confirmed_at\)/);
  assert.match(jobs, /Verify your email address before publishing/);
  assert.match(jobs, /enforceActionRateLimit\(/);
  assert.match(jobs, /"client_job_publish"/);
  assert.match(jobs, /"client_job_draft"/);
  assert.match(jobs, /const needsModeration = submitMode !== "draft" && reviewSignals\.length > 0/);
  assert.match(jobs, /Complete the public job before publishing/);
  assert.match(jobs, /resolveClientJobSubmitStatus/);
  assert.match(jobs, /status: initialStatus/);
  assert.match(jobs, /published_at: selfPublish \? new Date\(\)\.toISOString\(\) : null/);
  assert.doesNotMatch(jobs, /ENABLE_VERIFIED_CLIENT_AUTO_PUBLISH|select\("can_self_publish_jobs,verified_at"\)/);
  assert.match(publication, /return emailVerified/);
  assert.doesNotMatch(adminJob, /Allow direct publishing|setClientJobSelfPublishAction/);
});

test("posting UI explains immediate publication and separate commercial terms", async () => {
  const [newJob, wizard, clientJobs, guest, edit] = await Promise.all([
    read("src/app/workspace/client/jobs/new/page.tsx"),
    read("src/components/job-wizard.tsx"),
    read("src/app/workspace/client/jobs/page.tsx"),
    read("src/app/post-a-job/page.tsx"),
    read("src/app/workspace/client/jobs/[id]/edit/page.tsx"),
  ]);

  assert.match(newJob, /emailVerified: Boolean\(user\.email_confirmed_at\)/);
  assert.match(newJob, /publish your completed job immediately/);
  assert.match(wizard, /Publish job/);
  assert.match(wizard, /public Virtual Assistant jobs directory immediately/);
  assert.doesNotMatch(wizard, /canSelfPublishJobs && data\.service_model === "curated_placement"/);
  assert.match(guest, /publish automatically/i);
  assert.match(clientJobs, /Verified client accounts can publish complete job posts automatically/);
  assert.doesNotMatch(clientJobs, /supabase\.auth\.getUser\(\)|can_self_publish_jobs/);
  assert.match(edit, /canSelfPublishJobs=\{Boolean\(user\.email_confirmed_at\)\}/);
});

test("public job reads are session-free, cached and invalidated after publication or moderation", async () => {
  const [detail, jobs, admin] = await Promise.all([
    read("src/app/jobs/[id]/page.tsx"),
    read("src/app/actions/jobs.ts"),
    read("src/app/actions/admin.ts"),
  ]);
  assert.match(detail, /const readCachedPublishedJob = unstable_cache\(/);
  assert.match(detail, /createPublicClient\(\)/);
  assert.match(detail, /const getPublishedJob = cache\(/);
  assert.match(detail, /revalidate: 60, tags: \["public-job-details"\]/);
  assert.match(detail, /\.from\("public_jobs"\)/);
  assert.match(detail, /\.gte\("min_hourly_rate", MIN_HOURLY_RATE\)/);
  assert.doesNotMatch(detail.slice(0, detail.indexOf("function publicCompanyFromJob")), /await createClient\(\)/);
  assert.match(jobs, /updateTag\("public-job-details"\)/);
  assert.match(admin, /updateTag\("public-job-details"\)/);
  assert.match(admin, /publishAfterSafetyClear/);
  assert.match(admin, /submittedForPublicPosting/);
  assert.match(admin, /getUserById\(job\.client_id\)/);
  assert.match(admin, /email_confirmed_at/);
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
  assert.match(jobs, /select\("id,status,published_at,client_id,title,company_name,summary,description,responsibilities,required_skills,required_tools,hours_per_week,timezone,min_hourly_rate,start_timing,schedule_notes,onboarding_plan,moderation_status"\)/);
  const validationIndex = jobs.indexOf("const missing = publicationMissingDetails(job)");
  const publishIndex = jobs.indexOf('alreadyPublished ? { updated_at: acceptedAt } : {status:"published",published_at:acceptedAt}');
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


test("recent recruiter-managed roles can publish and accept applications before client claim", async () => {
  const [migration, applications, helper, detail] = await Promise.all([
    read("supabase/migrations/20261003210000_recruiter_managed_public_jobs.sql"),
    read("src/app/actions/applications.ts"),
    read("src/lib/job-publication.ts"),
    read("src/app/jobs/[id]/page.tsx"),
  ]);

  assert.match(migration, /recruiter_managed_public boolean not null default false/);
  assert.match(migration, /j\.client_id is not null or j\.recruiter_managed_public = true/);
  assert.match(applications, /recruiterManagedPublic = Boolean\(job\.recruiter_managed_public && job\.lead_id\)/);
  assert.doesNotMatch(applications, /eq\("moderation_status", "clear"\)\.not\("client_id", "is", null\)/);
  assert.match(applications, /if \(job\.client_id\) \{/);
  assert.match(helper, /job\.status === "published" && job\.recruiter_managed_public/);
  assert.match(detail, /VAPH will handle the next employer step/);
});
