import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("public job detail keeps logged-out, VA, and client actions separate", async () => {
  const job = await read("src/app/jobs/[id]/page.tsx");
  assert.match(job, /profile\?\.role === "va"/);
  assert.match(job, /Apply for this job/);
  assert.match(job, /Complete vetting to apply/);
  assert.match(job, /profile\?\.role === "client"/);
  assert.match(job, /You’re signed in as a client/);
  assert.match(job, /Go to client dashboard/);
  assert.match(job, /Post another job/);
  assert.match(job, /Log in to apply/);
  assert.match(job, /Create VA profile/);
});

test("post-a-job sends authenticated clients to the dashboard composer", async () => {
  const page = await read("src/app/post-a-job/page.tsx");
  assert.match(page, /getSessionProfile/);
  assert.match(page, /const isClient = profile\?\.role === "client"/);
  assert.match(page, /Post from client dashboard/);
  assert.match(page, /Post a job from my dashboard/);
  assert.match(page, /<JobWizard publicMode/);
  assert.match(page, /Browse VA jobs/);
});

test("client dashboard exposes direct Post a job actions", async () => {
  const [home, jobs] = await Promise.all([
    read("src/app/workspace/client/page.tsx"),
    read("src/app/workspace/client/jobs/page.tsx"),
  ]);
  assert.match(home, /<Plus size=\{17\}\/> Post a job/);
  assert.match(home, /title:"Post your first VA job"/);
  assert.match(home, /label:"Post a job"/);
  assert.match(home, /href:"\/workspace\/client\/jobs\/new"/);
  assert.match(jobs, /href="\/workspace\/client\/jobs\/new">Post a job/);
  assert.match(jobs, /Post your first job/);
});
