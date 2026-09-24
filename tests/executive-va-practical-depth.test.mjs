import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = "supabase/migrations/20260924101000_executive_va_practical_lesson_work.sql";

test("Executive VA practical migration covers every existing lesson", async () => {
  const sql = await readFile(migrationPath, "utf8");
  const lessonSlugs = [
    "the-executive-assistant-operating-model",
    "confidentiality-judgment-and-authority",
    "executive-inbox-triage-and-drafting",
    "complex-calendar-management",
    "meeting-preparation-agendas-and-briefing-notes",
    "minutes-actions-and-stakeholder-follow-up",
    "travel-planning-and-itinerary-administration",
    "changes-disruptions-and-contingency-handoffs",
    "priority-management-and-decision-queues",
    "research-briefs-and-executive-summaries",
    "daily-operating-rhythm-and-end-of-day-handoffs",
    "composite-executive-va-work-simulation",
  ];

  for (const slug of lessonSlugs) {
    assert.ok(sql.includes("'" + slug + "'"), "Missing practical content for " + slug);
  }

  assert.equal(lessonSlugs.length, 12);
});

test("every Executive VA lesson gets an exercise template and QA checklist without overwriting content", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /l\.content \|\| jsonb_build_array/);
  assert.match(sql, /'type', 'exercise'/);
  assert.match(sql, /'type', 'template'/);
  assert.match(sql, /'type', 'checklist'/);
  assert.match(sql, /where block->>'type' = 'exercise'/);

  assert.doesNotMatch(sql, /delete from public\.training_lessons/i);
  assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
  assert.doesNotMatch(sql, /update public\.training_assessments/i);
});

test("Executive VA practical work covers the major role workflows", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const phrase of [
    "Executive operating map",
    "Executive authority matrix",
    "Executive inbox triage log",
    "Executive calendar change log",
    "Executive meeting brief",
    "Decision and action register",
    "Executive travel itinerary",
    "Executive disruption log",
    "Executive decision queue",
    "Executive research brief",
    "Executive daily handoff",
    "Executive VA control desk",
  ]) {
    assert.ok(sql.includes(phrase), "Missing practical template: " + phrase);
  }
});

test("practical tasks retain executive authority and confidentiality boundaries", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /minimum information needed/i);
  assert.match(sql, /independent verification/i);
  assert.match(sql, /do not invent approval, pricing, promises, or executive intent/i);
  assert.match(sql, /Major schedule trade-offs stay with the authorised decision maker/i);
  assert.match(sql, /Confidential personnel information is shared only on a need-to-know basis/i);
});

test("Executive VA course remains published with stable lesson IDs and progress", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /where l\.is_published = true/);
  assert.match(sql, /where slug = 'executive-virtual-assistant'/);
  assert.doesNotMatch(sql, /status = 'draft'/);
  assert.doesNotMatch(sql, /published_at = null/);
  assert.doesNotMatch(sql, /delete from public\.training_lesson_progress/i);
  assert.doesNotMatch(sql, /insert into public\.training_courses/i);
});

test("lesson player already supports the practical block system used by Executive VA", async () => {
  const [training, lesson, practice] = await Promise.all([
    readFile("src/lib/training.ts", "utf8"),
    readFile("src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx", "utf8"),
    readFile("src/components/training-practice-blocks.tsx", "utf8"),
  ]);

  assert.match(training, /type: "exercise"/);
  assert.match(training, /type: "template"/);
  assert.match(training, /type: "checklist"/);
  assert.match(lesson, /Practice task/);
  assert.match(lesson, /TrainingTemplateBlock/);
  assert.match(lesson, /TrainingChecklistBlock/);
  assert.match(practice, /Copy template/);
  assert.match(practice, /QA checklist/);
});
