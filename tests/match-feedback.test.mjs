import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("success screen captures why the sampled profiles missed", () => {
  const form = source("src/components/hiring-brief-form.tsx");
  const action = source("src/app/actions/match-feedback.ts");
  const vocabulary = source("src/lib/match-feedback.ts");
  const migration = source("supabase/migrations/20260919160000_lead_match_feedback.sql");
  const crm = source("src/app/workspace/recruiter/leads/page.tsx");

  // One tap per reason, only when the lead it attaches to is known.
  assert.match(form, /<MatchFeedback leadId=\{leadId\} \/>/);
  assert.match(form, /leadId \? <MatchFeedback/);
  assert.match(form, /type="submit" name="reason" value=\{option\.value\}/);
  assert.match(form, /Got it\. Your recruiter will factor that in\./);

  // The screen is public, so the action stays narrow.
  assert.match(action, /lead: z\.string\(\)\.uuid\(\)/);
  assert.match(action, /\.filter\(isMatchFeedbackValue\)/);
  assert.match(action, /FEEDBACK_WINDOW_DAYS/);
  assert.match(action, /\.gte\("created_at", since\)/);
  assert.doesNotMatch(action, /formData\.get\("note"\)/);

  // One vocabulary for the form, the action, and the CRM.
  assert.match(vocabulary, /more_experience/);
  assert.match(form, /MATCH_FEEDBACK_OPTIONS\.map/);
  assert.match(crm, /matchFeedbackLabel\(reason\)/);

  // The recruiter cannot see it unless the column exists.
  assert.match(migration, /add column if not exists match_feedback text\[\]/);
  assert.match(migration, /add column if not exists match_feedback_at timestamptz/);
});
