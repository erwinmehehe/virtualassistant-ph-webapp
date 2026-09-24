import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const marketingPath =
  "supabase/migrations/20260924121000_deepen_marketing_va_training.sql";
const socialPath =
  "supabase/migrations/20260924121500_deepen_social_media_va_training.sql";
const workedPath =
  "supabase/migrations/20260924122000_add_marketing_social_worked_examples.sql";

test("Marketing VA deep pass covers all 12 published lessons with role-specific artifacts", async () => {
  const sql = await readFile(marketingPath, "utf8");
  for (const slug of [
    "how-marketing-work-moves-from-brief-to-campaign",
    "brand-claims-approvals-and-source-of-truth",
    "content-calendars-briefs-and-production-tracking",
    "asset-coordination-and-quality-assurance",
    "email-campaign-administration",
    "crm-segments-tags-and-campaign-data-hygiene",
    "campaign-launch-checklists-and-cross-channel-coordination",
    "community-lead-and-response-routing",
    "marketing-reporting-and-basic-performance-interpretation",
    "responsible-ai-in-marketing-operations",
    "agency-and-in-house-handoffs",
    "composite-marketing-va-work-simulation",
  ]) assert.ok(sql.includes("'" + slug + "'"), "Missing Marketing lesson: " + slug);

  for (const phrase of [
    "Campaign control brief",
    "Marketing claim register",
    "Campaign production tracker",
    "Asset release-gate matrix",
    "Email send-readiness sheet",
    "CRM segment and hygiene log",
    "Cross-channel launch control board",
    "Campaign lead-routing matrix",
    "Marketing performance report",
    "AI marketing verification log",
    "Campaign stakeholder handoff",
    "Marketing campaign control pack",
  ]) assert.ok(sql.includes(phrase), "Missing Marketing artifact: " + phrase);
});

test("Social Media VA deep pass covers all 12 published lessons with platform-native artifacts", async () => {
  const sql = await readFile(socialPath, "utf8");
  for (const slug of [
    "channels-audiences-objectives-and-va-boundaries",
    "content-calendars-and-approval-workflows",
    "creative-briefs-canva-workflows-and-asset-qa",
    "caption-drafting-hashtags-links-and-claims",
    "scheduling-and-platform-publishing-checks",
    "campaign-and-launch-coordination",
    "comments-dms-and-routine-community-replies",
    "complaints-sensitive-topics-and-escalation",
    "social-reporting-and-content-performance",
    "content-repurposing-and-responsible-ai",
    "influencer-and-ugc-administration",
    "composite-social-media-va-simulation",
  ]) assert.ok(sql.includes("'" + slug + "'"), "Missing Social lesson: " + slug);

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
});

test("deep pass removes old generic practice prompt pairs and preserves lesson identity", async () => {
  for (const path of [marketingPath, socialPath]) {
    const sql = await readFile(path, "utf8");
    assert.match(sql, /ilike 'Practice:%'/);
    assert.match(sql, /when b\.block->>'type'='exercise'/);
    assert.match(sql, /when b\.block->>'type'='template'/);
    assert.match(sql, /when b\.block->>'type'='checklist'/);
    assert.doesNotMatch(sql, /delete from public\.training_lessons/i);
    assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
    assert.doesNotMatch(sql, /delete from public\.training_lesson_progress/i);
  }
});

test("Marketing and Social capstones use connected North & Pine evidence packs and explicit scope boundaries", async () => {
  const marketing = await readFile(marketingPath, "utf8");
  const social = await readFile(socialPath, "utf8");

  assert.match(marketing, /North & Pine Home Arc Shelving Collection/);
  assert.match(marketing, /CRM segment definition and hygiene exception log/);
  assert.match(marketing, /Email send-readiness sheet/);
  assert.match(marketing, /Social platform publishing, comments\/DMs/);

  assert.match(social, /North & Pine Home Arc Shelving Collection/);
  assert.match(social, /Creator\/UGC rights tracker/);
  assert.match(social, /comments\/DM community triage log/);
  assert.match(social, /Email, CRM segmentation, landing-page operations/);
});

test("worked examples cover high-judgment Marketing and Social tasks and sit before exercises", async () => {
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
  assert.match(sql, /existing->>'title'=t\.example_title/);
});
