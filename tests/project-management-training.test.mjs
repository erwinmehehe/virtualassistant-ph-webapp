import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const seedPath = "supabase/migrations/20260923120500_write_project_management_va_training.sql";

test("Project Management VA course is fully written but remains draft", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Project Management for Virtual Assistants/);
  assert.match(seed, /estimated_minutes = 300/);
  assert.match(seed, /status = 'draft'/);
  assert.match(seed, /published_at = null/);
  assert.match(seed, /is_published = false/g);

  const lessonIds = new Set(seed.match(/22000013-0000-4000-8000-0000000000\d{2}/g) || []);
  assert.equal(lessonIds.size, 12);
});

test("Project Management course covers the full coordination lifecycle", async () => {
  const seed = await readFile(seedPath, "utf8");
  for (const phrase of [
    "scope",
    "deliverable",
    "dependency",
    "milestone",
    "capacity",
    "project board",
    "meeting",
    "risk",
    "stakeholder",
    "change control",
    "acceptance criteria",
    "handover",
    "retrospective",
    "BrightPath Client Portal Launch",
  ]) {
    assert.ok(seed.toLowerCase().includes(phrase.toLowerCase()), phrase + " missing");
  }
});

test("Project Management course protects approval and change-control boundaries", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Do not become the accidental approver/i);
  assert.match(seed, /Record the requested change/i);
  assert.match(seed, /send the change to the authorised decision-maker/i);
  assert.match(seed, /A task is not complete because the creator finished working on it/i);
});

test("Project Management final assessment tests coordination work, not trivia", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /assessment tests project coordination judgment and work output rather than project-management trivia/i);
  assert.match(seed, /rebuild the plan around dependencies and capacity/i);
  assert.match(seed, /define QA and acceptance/i);
  assert.match(seed, /handover and closeout plan/i);
});
