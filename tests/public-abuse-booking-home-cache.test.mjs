import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("public match feedback requires a signed, expiring capability and is replay-safe", async () => {
  const [action, form, leads, capability] = await Promise.all([
    read("src/app/actions/match-feedback.ts"),
    read("src/components/hiring-brief-form.tsx"),
    read("src/app/actions/leads.ts"),
    read("src/lib/public-capability.ts"),
  ]);

  assert.match(action, /verifySignedCapability\(parsed\.data\.token, "match_feedback"\)/);
  assert.match(action, /enforceActionRateLimit\("public_match_feedback"/);
  assert.match(action, /\.is\("match_feedback_at", null\)/);
  assert.doesNotMatch(action, /formData\.get\("lead"\)/);
  assert.match(form, /name="token" value=\{token\}/);
  assert.doesNotMatch(form, /name="lead" value=\{leadId\}/);
  assert.match(leads, /scope: "match_feedback"/);
  assert.match(leads, /#feedback=/);
  assert.doesNotMatch(leads, /&feedback=/);
  assert.match(capability, /createHmac\("sha256"/);
  assert.match(capability, /timingSafeEqual/);
  assert.match(capability, /payload\.exp <= Math\.floor\(Date\.now\(\) \/ 1000\)/);
});

test("booking management stores hashes and expiry but never new raw capability values", async () => {
  const [ops, actions, reminders, page, leads, schema, cleanup] = await Promise.all([
    read("src/lib/booking-operations.ts"),
    read("src/app/actions/booking.ts"),
    read("src/app/api/cron/discovery-reminders/route.ts"),
    read("src/app/book-client-call/manage/page.tsx"),
    read("src/app/actions/leads.ts"),
    read("supabase/migrations/20260924231000_public_capability_and_analytics_hardening.sql"),
    read("supabase/migrations/20260924232000_remove_legacy_booking_manage_tokens.sql"),
  ]);

  assert.match(ops, /scope: "booking_manage"/);
  assert.match(ops, /recreateBookingManageToken/);
  assert.match(actions, /discovery_manage_token_expires_at/);
  assert.match(actions, /\.gt\("discovery_manage_token_expires_at"/);
  assert.match(page, /\.gt\("discovery_manage_token_expires_at"/);
  assert.match(reminders, /recreateBookingManageToken/);
  assert.doesNotMatch(reminders, /select\([^\n]*discovery_manage_token,/);
  assert.doesNotMatch(actions, /discovery_manage_token:\s*manage\.token/);
  assert.doesNotMatch(leads, /discovery_manage_token:\s*manage\.token/);
  assert.match(leads, /discovery_manage_token:\s*null/);
  assert.match(schema, /discovery_manage_token_id uuid/);
  assert.match(schema, /discovery_manage_token_expires_at timestamptz/);
  assert.match(cleanup, /set discovery_manage_token = null/);
  assert.match(cleanup, /check \(discovery_manage_token is null\)/);
});

test("public analytics is rate-limited, bot-filtered, and idempotent", async () => {
  const [route, client, migration] = await Promise.all([
    read("src/app/api/analytics/route.ts"),
    read("src/components/analytics.tsx"),
    read("supabase/migrations/20260924231000_public_capability_and_analytics_hardening.sql"),
  ]);

  assert.match(route, /BOT_USER_AGENT/);
  assert.match(route, /public_analytics:ip/);
  assert.match(route, /public_analytics:session/);
  assert.match(route, /event_id/);
  assert.match(route, /ignoreDuplicates: true/);
  assert.match(client, /crypto\?\.randomUUID/);
  assert.match(migration, /analytics_events_event_id_key unique\(event_id\)/);
});

test("recruiter bulk reads authenticate before using the service-role directory", async () => {
  const action = await read("src/app/actions/recruiter-talent.ts");
  const authIndex = action.indexOf('await requireAnyRole(["admin", "recruiter"])');
  const adminIndex = action.indexOf("const admin = createAdminClient()");
  assert.ok(authIndex >= 0, "bulk action must authenticate");
  assert.ok(adminIndex > authIndex, "service-role client must be created after authentication");
});

test("homepage public data no longer depends on request cookies and is cached", async () => {
  const [page, data, publicClient, layout, preview] = await Promise.all([
    read("src/app/page.tsx"),
    read("src/lib/homepage-data.ts"),
    read("src/lib/supabase/public.ts"),
    read("src/app/layout.tsx"),
    read("src/app/api/talent/top-matches/route.ts"),
  ]);

  assert.match(page, /export const revalidate = 300/);
  assert.match(page, /getHomepageFeaturedVas/);
  assert.doesNotMatch(page, /supabase\/server/);
  assert.doesNotMatch(page, /searchParams/);
  assert.match(data, /unstable_cache/);
  assert.match(data, /revalidate: 300/);
  assert.match(publicClient, /createClient/);
  assert.doesNotMatch(publicClient, /next\/headers|cookies\(/);
  assert.match(page, /homepage-reference-polish\.css/);
  assert.doesNotMatch(layout, /homepage-reference-polish\.css/);
  assert.match(preview, /supabase\/public/);
  assert.doesNotMatch(preview, /supabase\/server/);
});
