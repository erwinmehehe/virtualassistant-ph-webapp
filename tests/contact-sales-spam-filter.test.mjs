import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("contact spam filter blocks known spam domains and subdomains", async () => {
  const source = await readFile("src/lib/contact-spam.ts", "utf8");
  for (const domain of [
    "blastleadgeneration.com",
    "freeb2bdata.org",
    "instagrow.business",
    "unsub.agency",
  ]) {
    assert.ok(source.includes(domain), "Missing blocked domain: " + domain);
  }
  assert.match(source, /normalized === domain \|\| normalized\.endsWith\(.*domain/);
  assert.match(source, /CONTACT_BLOCKED_DOMAINS/);
});

test("contact spam filter also catches obvious linked outbound sales pitches", async () => {
  const source = await readFile("src/lib/contact-spam.ts", "utf8");
  assert.match(source, /generate\|get\|bring\|capture\|convert/);
  assert.match(source, /lead\[ -\]\?generation/);
  assert.match(source, /live\|free.*demo/);
  assert.match(source, /seo services/);
  assert.match(source, /guest post/);
  assert.match(source, /link insertion/);
  assert.match(source, /return score >= 5/);
});

test("public contact form silently drops spam before Turnstile, storage, and email", async () => {
  const source = await readFile("src/app/actions/leads.ts", "utf8");
  const start = source.indexOf("export async function submitContactAction");
  const end = source.indexOf("const discoveryBookingSchema", start);
  assert.ok(start >= 0 && end > start);
  const action = source.slice(start, end);

  const filterIndex = action.indexOf("shouldSilentlyDropContactSubmission");
  const turnstileIndex = action.indexOf("verifyTurnstile");
  const insertIndex = action.indexOf('.from("lead_intake").insert');
  const notifyIndex = action.indexOf("sendLeadNotificationEmail");
  const acknowledgementIndex = action.indexOf("sendLeadAcknowledgementEmail");

  assert.ok(filterIndex >= 0);
  assert.match(action, /redirect\("\/contact\?sent=1"\)/);
  assert.ok(filterIndex < turnstileIndex);
  assert.ok(filterIndex < insertIndex);
  assert.ok(filterIndex < notifyIndex);
  assert.ok(filterIndex < acknowledgementIndex);
});

test("contact lead API filters contact-source spam before database storage", async () => {
  const source = await readFile("src/app/api/leads/route.ts", "utf8");
  const filterIndex = source.indexOf('parsed.data.source_page === "contact"');
  const insertIndex = source.indexOf('.from("lead_intake").insert');

  assert.ok(filterIndex >= 0);
  assert.ok(filterIndex < insertIndex);
  assert.match(source, /filtered: true/);
  assert.match(source, /status: 202/);
});
