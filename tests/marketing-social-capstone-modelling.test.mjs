import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const socialPath =
  "supabase/migrations/20260924122500_deepen_social_media_connected_practice.sql";
const workedPath =
  "supabase/migrations/20260924123000_add_marketing_social_worked_examples.sql";
const marketingCapstonePath =
  "supabase/migrations/20260924123500_connect_marketing_capstone.sql";

test("Social Media VA replaces the generic course template with 12 platform-native artifacts", async () => {
  const sql = await readFile(socialPath, "utf8");
  for (const phrase of [
    "Social channel-role matrix",
    "Social content calendar",
    "Social creative QA matrix",
    "Social caption and claim sheet",
    "Social publishing-readiness queue",
    "Social launch readiness board",
    "Community triage and reply log",
    "Social reputation escalation record",
    "Social performance report",
    "Social repurposing and AI verification matrix",
    "Creator and UGC rights tracker",
    "Social launch operations pack",
  ]) assert.ok(sql.includes(phrase), "Missing Social artifact: " + phrase);

  assert.match(sql, /North & Pine Home/);
  assert.match(sql, /Marketing Ops/);
  assert.match(sql, /Support/);
});

test("Social Media capstone uses a connected launch evidence pack and preserves scope", async () => {
  const sql = await readFile(socialPath, "utf8");
  for (const phrase of [
    "Arc launch social calendar",
    "Publishing account and timing notes",
    "Launch-day comments and DMs",
    "Social response and escalation rules",
    "Creator Maya Lane rights note",
    "Arc launch social performance",
    "Approved product source for repurposing",
  ]) assert.ok(sql.includes(phrase), "Missing Social capstone resource: " + phrase);

  assert.match(sql, /Email, CRM segmentation, landing-page operations/);
  assert.match(sql, /route account-level issues to Support/);
});

test("Marketing capstone connects the existing role-specific artifacts into one evidence-based portfolio", async () => {
  const sql = await readFile(marketingCapstonePath, "utf8");
  for (const phrase of [
    "campaign control brief",
    "Claim and approval register",
    "Seven-asset production board",
    "Email send-readiness sheet",
    "CRM segment definition and hygiene exception log",
    "Cross-channel launch control board",
    "Lead-routing matrix",
    "First-week performance report",
    "AI-assisted marketing verification log",
    "Agency/in-house stakeholder handoff",
  ]) assert.ok(sql.toLowerCase().includes(phrase.toLowerCase()), "Missing Marketing capstone deliverable: " + phrase);

  for (const resource of [
    "Arc campaign brief and decision log",
    "Arc campaign production board",
    "Arc CRM segment sample",
    "Launch email readiness notes",
    "First launch enquiries",
    "First-week campaign performance",
    "AI-assisted draft excerpt",
  ]) assert.ok(sql.includes(resource), "Missing Marketing resource: " + resource);
});

test("worked examples model the hardest Marketing and Social judgment without replacing practice", async () => {
  const sql = await readFile(workedPath, "utf8");
  for (const phrase of [
    "old approval is not current proof",
    "segment logic should be reproducible",
    "one blocked channel does not erase the launch plan",
    "a better result does not prove the reason",
    "platform adaptation cannot change the fact",
    "scheduling is a release control",
    "acknowledge publicly, investigate privately",
    "possession is not permission",
  ]) assert.ok(sql.includes(phrase), "Missing worked example: " + phrase);

  assert.match(sql, /b\.ord<ex\.exercise_ord/);
  assert.match(sql, /b\.ord>=ex\.exercise_ord/);
});

test("follow-up curriculum migrations preserve learner identity and progress", async () => {
  for (const path of [socialPath, workedPath, marketingCapstonePath]) {
    const sql = await readFile(path, "utf8");
    assert.doesNotMatch(sql, /delete from public\.training_lessons/i);
    assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
    assert.doesNotMatch(sql, /delete from public\.training_lesson_progress/i);
    assert.doesNotMatch(sql, /insert into public\.training_courses/i);
  }
});
