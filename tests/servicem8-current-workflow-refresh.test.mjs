import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = "supabase/migrations/20260924002500_refresh_servicem8_current_workflows.sql";

test("ServiceM8 training teaches the four fixed job statuses and proper Queue use", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const status of ["Quote", "Work Order", "Completed", "Unsuccessful"]) {
    assert.match(sql, new RegExp(status));
  }

  assert.match(sql, /four fixed job statuses/i);
  assert.match(sql, /Queues.*waiting on something/i);
  assert.match(sql, /not as a general filing system/i);
  assert.match(sql, /Status is operational truth/);
});

test("ServiceM8 scheduling checks travel capability duration and external calendar context", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Dispatch Board/);
  assert.match(sql, /external-calendar busy time/i);
  assert.match(sql, /SMS booking link/i);
  assert.match(sql, /travel/i);
  assert.match(sql, /Available is not automatically suitable/);
});

test("quote workflow handles online acceptance and automation correctly", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /online acceptance/i);
  assert.match(sql, /move the job from Quote to Work Order/i);
  assert.match(sql, /Quote Follow Up automation/i);
  assert.match(sql, /customer replies/i);
  assert.match(sql, /Acceptance changes the workflow/);
});

test("completion workflow uses checklists Forms photos and return-work evidence", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /checklists can assign required tasks/i);
  assert.match(sql, /Forms can capture structured answers/i);
  assert.match(sql, /job Diary/i);
  assert.match(sql, /return visit/i);
  assert.match(sql, /Checklist complete does not equal every decision complete/);
});

test("billing workflow understands payment follow-up cancellation and accounting exceptions", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Live Statements/);
  assert.match(sql, /Payment Follow Up automation/i);
  assert.match(sql, /cancelled when full payment is received/i);
  assert.match(sql, /Completed before generating the invoice/i);
  assert.match(sql, /finance exception/i);
});

test("automation lesson teaches trigger audience timing and stop conditions", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /trigger, audience, timing, template, and stop condition/i);
  assert.match(sql, /booking reminders/i);
  assert.match(sql, /quote follow-up/i);
  assert.match(sql, /payment follow-up/i);
  assert.match(sql, /scheduled messages in the job Diary/i);
  assert.match(sql, /Automation follows data and rules, not common sense/);
});

test("ServiceM8 final assessment uses operational evidence and an 80 percent pass score", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /ServiceM8 morning queue/);
  assert.match(sql, /Automation rules extract/);
  assert.match(sql, /ServiceM8 VA authority matrix/);
  assert.match(sql, /Job status and Queue accuracy/);
  assert.match(sql, /"hard_fail":true/);
  assert.match(sql, /pass_score = 80/);
  assert.match(sql, /is_published = true/);
});

test("ServiceM8 course remains editorial-only published training", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /review_requirement = 'editorial'/);
  assert.match(sql, /reviewed_by = 'VirtualAssistant\.com\.ph Editorial Team'/);
  assert.match(sql, /status = 'published'/);
  assert.doesNotMatch(sql, /review_requirement = 'specialist'/);
});

test("ServiceM8 hiring page reflects current workflow without creating a duplicate route", async () => {
  const pages = await readFile("src/lib/software-pages.ts", "utf8");

  assert.equal((pages.match(/slug: "servicem8-virtual-assistant"/g) || []).length, 1);
  assert.match(pages, /primaryKeyword: "servicem8 virtual assistant"/);
  assert.match(pages, /job status and Queue administration/);
  assert.match(pages, /checklist and Form follow-up/);
  assert.match(pages, /automation QA/);
  assert.match(pages, /technical diagnosis, scope changes, trade compliance, safety decisions and accounting judgment/);
});

test("ServiceM8 training remains private while the software hiring page stays public", async () => {
  const learner = await readFile("src/app/workspace/training/page.tsx", "utf8");
  const publicTraining = await readFile("src/app/training/page.tsx", "utf8");
  const softwareRoute = await readFile("src/app/software/[slug]/page.tsx", "utf8");

  assert.match(learner, /servicem8-for-virtual-assistants/);
  assert.doesNotMatch(publicTraining, /\/training\/courses\/servicem8-for-virtual-assistants/);
  assert.match(softwareRoute, /software-pages/);
});
