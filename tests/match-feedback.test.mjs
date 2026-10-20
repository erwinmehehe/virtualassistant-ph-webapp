import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("success screen omits feedback UI while legacy feedback writes remain protected", () => {
  const form = source("src/components/hiring-brief-form.tsx");
  const action = source("src/app/actions/match-feedback.ts");
  const vocabulary = source("src/lib/match-feedback.ts");
  const migration = source("supabase/migrations/20260919160000_lead_match_feedback.sql");
  const crm = source("src/app/workspace/recruiter/leads/page.tsx");

  // The confirmation screen intentionally no longer offers feedback chips.
  assert.match(form, /<TopMatches category=\{category\} \/>/);
  assert.doesNotMatch(form, /MatchFeedback|MATCH_FEEDBACK_OPTIONS|feedbackToken|matchFeedbackToken|submitMatchFeedbackAction/);

  // The screen is public, so the action requires a signed, expiring capability,
  // rate limits submissions, and only writes once.
  assert.match(action, /token: z\.string\(\)\.min\(40\)/);
  assert.match(action, /verifySignedCapability\(parsed\.data\.token, "match_feedback"\)/);
  assert.match(action, /enforceActionRateLimit\("public_match_feedback"/);
  assert.match(action, /\.filter\(isMatchFeedbackValue\)/);
  assert.match(action, /FEEDBACK_WINDOW_DAYS/);
  assert.match(action, /\.gte\("created_at", since\)/);
  assert.match(action, /\.is\("match_feedback_at", null\)/);
  assert.doesNotMatch(action, /formData\.get\("lead"\)/);
  assert.doesNotMatch(action, /formData\.get\("note"\)/);

  // Preserve the action and CRM vocabulary for any already-issued capabilities.
  assert.match(vocabulary, /more_experience/);
  assert.match(crm, /matchFeedbackLabel\(reason\)/);

  // The recruiter cannot see it unless the column exists.
  assert.match(migration, /add column if not exists match_feedback text\[\]/);
  assert.match(migration, /add column if not exists match_feedback_at timestamptz/);
});
