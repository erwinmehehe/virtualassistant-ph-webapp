import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Foundations course overview now matches the practical learner system", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-foundations-course/);
  assert.match(page, /A core VA operating pack/);
  assert.match(page, /Authority \+ client update pack/);
  assert.match(page, /Inbox \+ calendar controls/);
  assert.match(page, /Files \+ spreadsheet QA/);
  assert.match(page, /Research \+ shift handoff/);
});

test("Foundations lessons visibly identify their practical work artifact", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx");
  const css = await read("src/app/workspace/training/training-home.css");

  assert.match(page, /Foundation work artifact included/);
  assert.match(page, /training-foundations-practice-badge/);
  assert.match(css, /Foundations course-work palette/);
  assert.match(css, /\.training-foundations-course/);
  assert.match(css, /\.training-foundations-practice-badge/);
});

test("Foundations practical UI is backed by practical lesson content", async () => {
  const sql = await read("supabase/migrations/20260924094500_foundations_practical_lesson_work.sql");

  for (const slug of [
    "what-a-virtual-assistant-actually-does",
    "clear-written-client-communication",
    "inbox-management",
    "calendar-and-meeting-coordination",
    "drive-docs-and-file-organization",
    "spreadsheets-for-va-admin-work",
    "task-management-and-prioritization",
    "research-and-source-verification",
    "responsible-ai-for-va-work",
    "reading-briefs-sops-and-working-independently",
  ]) {
    assert.ok(sql.includes(slug), "Missing practical Foundations lesson: " + slug);
  }

  assert.match(sql, /'type', 'exercise'/);
  assert.match(sql, /'type', 'template'/);
  assert.match(sql, /'type', 'checklist'/);
});
