import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const path = "supabase/migrations/20260924083500_contextualize_training_lesson_headings.sql";

test("generic repeated lesson headings become lesson-specific", async () => {
  const sql = await readFile(path, "utf8");

  for (const label of [
    "Work product: ",
    "Practice: ",
    "Pitfalls: ",
    "QA risks: ",
    "Ready check: ",
    "Outcome: ",
    "Business impact: ",
    "Takeaway: ",
    "Decision rules: ",
    "Workflow: ",
    "Focus: ",
  ]) {
    assert.ok(sql.includes(label), "Missing contextual heading: " + label);
  }

  assert.match(sql, /t\.lesson_title/);
  assert.match(sql, /jsonb_array_elements\(t\.content\)/);
  assert.match(sql, /with ordinality/);
});

test("heading cleanup covers the known templated labels", async () => {
  const sql = await readFile(path, "utf8");
  for (const heading of [
    "Work product drill",
    "Practice",
    "Common mistakes",
    "Before you move on",
    "What you will learn",
    "What you''ll learn",
    "Why this matters",
    "Key takeaways",
    "Decision rules",
    "Failure modes",
    "Ready-to-work check",
    "Run the workflow",
    "The work outcome",
    "Why clients care",
    "Handoff check",
    "QA traps",
    "What to notice",
    "Where this fails in practice",
    "Work it step by step",
    "Your operating goal",
  ]) {
    assert.ok(sql.includes(heading), "Missing generic heading replacement: " + heading);
  }
});

test("heading cleanup preserves course and learner state", async () => {
  const sql = await readFile(path, "utf8");
  assert.doesNotMatch(sql, /status\s*=/);
  assert.doesNotMatch(sql, /review_requirement/);
  assert.doesNotMatch(sql, /delete\s+from\s+public\.training_/i);
  assert.doesNotMatch(sql, /training_lesson_progress/i);
  assert.doesNotMatch(sql, /training_enrollments/i);
  assert.doesNotMatch(sql, /training_certificates/i);
});
