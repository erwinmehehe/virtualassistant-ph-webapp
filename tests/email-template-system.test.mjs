import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("outbound emails share branded client and talent wrappers", async () => {
  const email = await read("src/lib/email.ts");

  assert.match(email, /function renderBrandedEmail/);
  assert.match(email, /function renderHiringEmail/);
  assert.match(email, /function renderTalentEmail/);
  assert.match(email, /teamLabel: "Hiring team"/);
  assert.match(email, /teamLabel: "Talent team"/);
  assert.match(email, /Account update/);
  assert.match(email, /renderBrandedEmail\(\{/);
});

test("client emails route replies to the configured team mailbox", async () => {
  const email = await read("src/lib/email.ts");

  assert.match(email, /function configuredReplyTo/);
  assert.match(email, /process\.env\.CLIENT_REPLY_TO_EMAIL/);
  assert.match(email, /process\.env\.LEAD_NOTIFICATION_EMAIL/);
  const replyUses = email.match(/replyTo: configuredReplyTo\(\)/g) || [];
  assert.ok(replyUses.length >= 6, `expected client reply routing across major templates, got ${replyUses.length}`);
});

test("recruiter follow-up respects the exact client workspace link", async () => {
  const email = await read("src/lib/email.ts");

  assert.match(email, /const targetUrl = args\.href\?\.trim\(\) \|\| bookingUrl/);
  assert.match(email, /const targetLabel = args\.href\?\.trim\(\) \? "Open hiring workspace" : "Choose a call time"/);
  assert.match(email, /ctaHref: targetUrl/);
  assert.doesNotMatch(email, /ctaHref: bookingUrl,\n\s*ctaLabel: "Choose a call time"/);
});

test("VA lifecycle emails stay private from default team/archive copies", async () => {
  const email = await read("src/lib/email.ts");

  assert.match(email, /"va_applicant_redirect", \{ archive: false, teamCc: false \}/);
  assert.match(email, /"application_status", \{ archive: false, teamCc: false \}/);
  assert.match(email, /"profile_completion_reminder", \{ archive: false, teamCc: false \}/);
  assert.match(email, /"profile_stage_nudge", \{ archive: false, teamCc: false \}/);
});

test("VA match alert uses a branded template, text fallback, and reply routing", async () => {
  const matchEmail = await read("src/lib/match-email.ts");

  assert.match(matchEmail, /replyTo: configuredReplyTo\(\)/);
  assert.match(matchEmail, /text: `Hi there,/);
  assert.match(matchEmail, /Talent team/);
  assert.match(matchEmail, /Review my profile/);
  assert.match(matchEmail, /This is not yet an interview or job offer/);
});
