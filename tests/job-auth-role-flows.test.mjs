import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("public job CTA respects logged-out, VA, and client sessions", async () => {
  const job = await read("src/app/jobs/[id]/page.tsx");

  assert.match(job, /profile\?\.role === "va"/);
  assert.match(job, /Apply for this job/);
  assert.match(job, /Complete vetting to apply/);
  assert.match(job, /profile\?\.role === "client"/);
  assert.match(job, /You’re signed in as a client/);
  assert.match(job, /href="\/workspace\/client\/jobs">Manage my jobs/);
  assert.match(job, /href="\/workspace\/client\/jobs\/new">Post another job/);
  assert.match(job, /Create VA profile to apply/);
  assert.match(job, /Already have an account\? Log in/);
  assert.match(job, /auth\/join\/va\?next=/);
  assert.match(job, /auth\/login\?next=/);
  assert.match(job, /notify the job poster when a client account is attached/);
});

test("post-a-job skips signup for an already signed-in client", async () => {
  const page = await read("src/app/post-a-job/page.tsx");

  assert.match(page, /getSessionProfile/);
  assert.match(page, /profile\?\.role === "client"\) redirect\("\/workspace\/client\/jobs\/new"\)/);
  assert.match(page, /isVa = profile\?\.role === "va"/);
  assert.match(page, /<JobWizard publicMode/);
  assert.match(page, /This is a VA account/);
  assert.match(page, /Browse VA jobs/);
});

test("client dashboard exposes direct job-posting entry points", async () => {
  const [dashboard, jobs] = await Promise.all([
    read("src/app/workspace/client/page.tsx"),
    read("src/app/workspace/client/jobs/page.tsx"),
  ]);

  assert.match(dashboard, /href="\/workspace\/client\/jobs\/new"><Plus size=\{17\}\/> Post a job/);
  assert.match(dashboard, /Post your first VA job/);
  assert.match(dashboard, /label:"Post a job"/);
  assert.match(jobs, /href="\/workspace\/client\/jobs\/new"/);
  assert.match(jobs, />Post a job<\/Link>/);
});

test("client and public composers use the same easy first step", async () => {
  const wizard = await read("src/components/job-wizard.tsx");

  assert.match(wizard, /What should your VA handle\?/);
  assert.match(wizard, /We’ll suggest the title, specialty, skills, and responsibilities/);
  assert.match(wizard, /Company name/);
  assert.match(wizard, /I want to add more details now/);
  assert.match(wizard, /Or start from a common role/);
  assert.doesNotMatch(wizard, /Prepare a starter brief/);
});

test("vetted application still notifies the job poster", async () => {
  const action = await read("src/app/actions/applications.ts");

  assert.match(action, /\["approved","bench"\]\.includes\(vetting\.stage\)/);
  assert.match(action, /sendApplicationEmail/);
  assert.match(action, /New application for \$\{job\.title\}/);
  assert.match(action, /redirect\("\/workspace\/va\/applications\?applied=1"\)/);
});
