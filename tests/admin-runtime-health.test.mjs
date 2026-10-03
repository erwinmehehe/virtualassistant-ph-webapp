import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("runtime health exposes strict launch controls without exposing secret values", async () => {
  const status = await read("src/lib/env-status.ts");

  assert.match(status, /NEXT_PUBLIC_TURNSTILE_SITE_KEY/);
  assert.match(status, /TURNSTILE_SECRET_KEY/);
  assert.match(status, /RESEND_WEBHOOK_SECRET/);
  assert.match(status, /TRIGGER_SECRET_KEY/);
  assert.match(status, /AUTOMATION_CALLBACK_SECRET/);
  assert.match(status, /TRIGGER_AUTOMATIONS_ACTIVE/);
  assert.match(status, /turnstileConfigured/);
  assert.match(status, /resendWebhookSecret\.length >= 16/);
  assert.match(status, /triggerSecret\.length >= 20/);
  assert.match(status, /automationCallbackSecret\.length >= 32/);
  assert.match(status, /triggerAutomationsActive === "1"/);

  assert.doesNotMatch(status, /detail:\s*turnstileSecret/);
  assert.doesNotMatch(status, /detail:\s*resendWebhookSecret/);
  assert.doesNotMatch(status, /detail:\s*triggerSecret/);
  assert.doesNotMatch(status, /detail:\s*automationCallbackSecret/);
});

test("admin release health counts calendar bot webhook and automation configuration as blockers", async () => {
  const page = await read("src/app/workspace/admin/health/page.tsx");

  assert.match(page, /Google Calendar & Meet/);
  assert.match(page, /runtime\.googleCalendar\.configured/);
  assert.match(page, /Turnstile bot protection/);
  assert.match(page, /runtime\.turnstile\.configured/);
  assert.match(page, /Resend webhook verification/);
  assert.match(page, /runtime\.resendWebhook\.configured/);
  assert.match(page, /Trigger\.dev automations/);
  assert.match(page, /runtime\.triggerAutomations\.configured/);
  assert.match(page, /releaseBlockers = runtimeChecks\.filter/);
});

test("release readiness names missing production Turnstile as an explicit blocker", async () => {
  const readiness = await read("AGENCY_RELEASE_READINESS.md");

  assert.match(readiness, /missing Cloudflare Turnstile protection/);
  assert.match(readiness, /no Turnstile widget or Cloudflare challenge script/);
  assert.match(readiness, /Turnstile bot protection: BLOCKED/);
  assert.match(readiness, /Go\/no-go: HOLD/);
});
