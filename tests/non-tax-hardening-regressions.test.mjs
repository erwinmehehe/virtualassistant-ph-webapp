import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("homepage featured talent is cookie-free and explicitly cached", async () => {
  const [page, data, publicClient] = await Promise.all([
    read("src/app/page.tsx"),
    read("src/lib/public-home-data.ts"),
    read("src/lib/supabase/public.ts"),
  ]);
  assert.doesNotMatch(page, /supabase\/server/);
  assert.doesNotMatch(page, /searchParams/);
  assert.match(page, /export const revalidate = 300/);
  assert.match(page, /getFeaturedPublicVas/);
  assert.match(data, /unstable_cache/);
  assert.match(data, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(data, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(data, /return \[\]/);
  assert.match(data, /revalidate: 300/);
  assert.doesNotMatch(data, /user_id/);
  assert.match(publicClient, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(publicClient, /cookies/);
});

test("public analytics ingestion is rate limited and retry-idempotent", async () => {
  const [route, client, rateLimit, migration] = await Promise.all([
    read("src/app/api/analytics/route.ts"),
    read("src/components/analytics.tsx"),
    read("src/lib/rate-limit.ts"),
    read("supabase/migrations/20260924213000_analytics_and_booking_capability_hardening.sql"),
  ]);
  assert.match(route, /enforceActionRateLimit\("public_analytics:session"/);
  assert.match(route, /enforceIpRateLimit\("public_analytics"/);
  assert.match(route, /status: 429/);
  assert.match(route, /BOOKING_VISUAL_FIXTURE === "1"/);
  assert.match(rateLimit, /if \(ip === "unknown"\) return/);
  assert.match(route, /event_id: parsed\.data\.event_id/);
  assert.match(route, /error\.code !== "23505"/);
  assert.match(client, /crypto\.randomUUID/);
  assert.match(client, /event_id: eventId/);
  assert.match(migration, /analytics_events_event_id_unique_idx/);
});

test("booking manage capabilities are signed and raw values are not persisted", async () => {
  const [ops, leads, booking, reminders, managePage, migration] = await Promise.all([
    read("src/lib/booking-operations.ts"),
    read("src/app/actions/leads.ts"),
    read("src/app/actions/booking.ts"),
    read("src/app/api/cron/discovery-reminders/route.ts"),
    read("src/app/book-client-call/manage/page.tsx"),
    read("supabase/migrations/20260924213000_analytics_and_booking_capability_hardening.sql"),
  ]);

  assert.match(ops, /createHmac/);
  assert.match(ops, /timingSafeEqual/);
  assert.match(ops, /BOOKING_MANAGE_TOKEN_TTL_SECONDS = 90 \* 24 \* 60 \* 60/);
  assert.match(ops, /expiresAt < nowSeconds/);
  assert.match(ops, /v2\.\$\{leadId\}/);
  assert.match(ops, /legacyHash/);

  assert.doesNotMatch(leads, /discovery_manage_token:\s*manage/);
  assert.doesNotMatch(booking, /select\([^\n]*discovery_manage_token,/);
  assert.doesNotMatch(reminders, /select\([^\n]*discovery_manage_token/);
  assert.match(reminders, /createBookingManageToken\(lead\.id\)/);
  assert.match(managePage, /bookingManageTokenLookup/);
  assert.match(migration, /set discovery_manage_token = null/);
});

test("filtered recruiter bulk actions authorize before service-role reads", async () => {
  const action = await read("src/app/actions/recruiter-talent.ts");
  const authAt = action.indexOf('await requireAnyRoleFast(["admin", "recruiter"])');
  const adminAt = action.indexOf("const admin = createAdminClient()");
  assert.ok(authAt > 0, "bulk action must have an authorization guard");
  assert.ok(adminAt > authAt, "service-role client must be created after authorization");
});
