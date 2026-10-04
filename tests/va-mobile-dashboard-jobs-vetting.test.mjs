import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("VA dashboard keeps status and pipeline compact on phones", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/va/page.tsx"),
    read("src/app/workspace/va/va-workspace.css"),
  ]);

  assert.match(page, /va-dashboard-head/);
  assert.match(page, /va-dashboard-pipeline/);
  assert.match(css, /VA mobile pass: dashboard, jobs, vetting/);
  assert.match(css, /\.va-overview \.va-status-strip[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.va-overview \.pipeline-summary[\s\S]*grid-template-columns: repeat\(5, minmax\(92px, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 420px\)[\s\S]*\.va-overview \.va-status-strip[\s\S]*grid-template-columns: 1fr/);
});

test("VA jobs use a denser mobile browse layout", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/va/jobs/page.tsx"),
    read("src/app/workspace/va/va-workspace.css"),
  ]);

  assert.match(page, /va-jobs-mobile-head/);
  assert.match(page, /va-job-mobile-card/);
  assert.match(page, /va-job-mobile-actions/);
  assert.match(page, /va-jobs-hero/);
  assert.match(page, /va-jobs-summary/);
  assert.match(page, /va-job-facts/);
  assert.match(css, /VA jobs: opportunity marketplace/);
  assert.match(css, /\.va-job-facts[\s\S]*grid-template-columns: repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.va-job-facts[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /\.va-job-actions \.btn[\s\S]*min-height: 42px/);
});

test("VA vetting has a responsive dedicated screening layout", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/va/vetting/page.tsx"),
    read("src/app/workspace/va/va-workspace.css"),
  ]);

  for (const className of [
    "va-vetting-page",
    "va-vetting-stats",
    "va-vetting-layout",
    "va-vetting-progress-card",
    "va-vetting-skills-card",
    "va-vetting-video-card",
    "va-vetting-sidebar",
  ]) {
    assert.match(page, new RegExp(className));
  }

  assert.match(css, /\.va-vetting-layout[\s\S]*grid-template-columns: minmax\(0, 1fr\) minmax\(220px, 280px\)/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.va-vetting-stats[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.va-vetting-test-form textarea,[\s\S]*font-size: 16px/);
  assert.match(css, /\.va-vetting-video-form[\s\S]*grid-template-columns: 1fr/);
});


test("vetted VAs get a real apply path for published jobs", async () => {
  const [publicJob, vaJobs, applicationsAction] = await Promise.all([
    read("src/app/jobs/[id]/page.tsx"),
    read("src/app/workspace/va/jobs/page.tsx"),
    read("src/app/actions/applications.ts"),
  ]);

  assert.match(publicJob, /applyToJobAction/);
  assert.match(publicJob, /Apply for this job/);
  assert.match(publicJob, /approved and bench-vetted VAs/i);
  assert.doesNotMatch(publicJob, /Send interest to recruiter/);
  assert.match(vaJobs, /const canApply = Boolean\(vetting && \["approved", "bench"\]\.includes\(vetting\.stage\)\)/);
  assert.match(vaJobs, /canApply \? "View and apply" : "View role"/);
  assert.match(applicationsAction, /\["approved","bench"\]\.includes\(vetting\.stage\)/);
  assert.match(applicationsAction, /redirect\("\/workspace\/va\/applications\?applied=already"\)/);
  assert.match(applicationsAction, /sendApplicationEmail/);
});


test("vetted VA applications notify employer and recruiter without making delivery a submission blocker", async () => {
  const applicationsAction = await read("src/app/actions/applications.ts");
  assert.match(applicationsAction, /New VA application:/);
  assert.match(applicationsAction, /workspace\/recruiter\/matching/);
  assert.match(applicationsAction, /New application for/);
  assert.match(applicationsAction, /sendApplicationEmail/);
  assert.match(applicationsAction, /Recruiter application notification failed/);
  assert.match(applicationsAction, /Employer application notification failed/);
  assert.match(applicationsAction, /New application employer notification failed/);
});


test("VA dashboard connects vetting directly to the published job application flow", async () => {
  const page=await read("src/app/workspace/va/page.tsx");
  assert.match(page,/Apply to a published role/);
  assert.match(page,/Your application starts in recruiter review and the job poster is notified/);
  assert.match(page,/Your vetted profile is ready to apply/);
  assert.doesNotMatch(page,/Express interest in a role/);
});
