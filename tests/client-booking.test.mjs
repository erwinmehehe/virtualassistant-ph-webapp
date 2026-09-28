import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("qualified booking flow stays available and the floating CTA uses the internal booking page", async () => {
  const [home, hire, floating, form, contact] = await Promise.all([
    read("src/app/page.tsx"),
    read("src/app/hire/page.tsx"),
    read("src/components/floating-cta.tsx"),
    read("src/components/hiring-brief-form.tsx"),
    read("src/app/contact/page.tsx"),
  ]);

  for (const source of [home, hire, form, contact]) {
    assert.match(source, /\/book-client-call/);
  }
  assert.match(floating, /calendar\.app\.google\/FxedmioyeJhKras87/);
  assert.doesNotMatch(floating, /DISCOVERY_CALL_URL = "\/book-client-call"/);
});

test("client booking opens directly on the calendar and still routes VA applicants away", async () => {
  const [form, action] = await Promise.all([
    read("src/components/client-booking-form.tsx"),
    read("src/app/actions/leads.ts"),
  ]);

  assert.doesNotMatch(form, /Who are you booking for\?/);
  assert.doesNotMatch(form, /I am hiring/);
  assert.match(form, /Looking for VA work\? Apply here/);
  assert.match(form, /href="\/auth\/join\/va"/);
  assert.match(action, /audience: z\.literal\("client"\)/);
  assert.match(action, /isAllowedDiscoverySlot/);
  assert.match(form, /useState<string \| null>\(null\)/);
  assert.ok(form.includes("Australia/Sydney"));
  assert.ok(form.includes("America/Chicago"));
  assert.ok(form.includes("America/Denver"));
  assert.match(form,/resolvedOptions\(\)\.timeZone/);
  assert.match(form,/id="booking-timezone"/);
  assert.match(form,/setDisplayTimeZone\(event\.target\.value\)/);
  assert.match(form,/Detected:/);
});

test("discovery booking is available 24/7 and grouped in the visitor timezone", async () => {
  const [form, booking] = await Promise.all([
    read("src/components/client-booking-form.tsx"),
    read("src/lib/discovery-booking.ts"),
  ]);

  assert.match(booking, /for \(let hour = 0; hour < 24; hour \+= 1\)/);
  assert.doesNotMatch(booking, /START_HOUR|END_HOUR/);
  assert.doesNotMatch(booking, /weekday === 0|weekday === 6/);
  assert.match(form, /localDateKey/);
  assert.match(form, /localDays\.map/);
  assert.match(form, /activeDay\?\.slots\.map/);
  assert.doesNotMatch(form, /booking-show-times/);
  assert.doesNotMatch(form, /showAllTimes/);
});

test("client booking keeps the minimum brief lightweight", async () => {
  const [form, action] = await Promise.all([
    read("src/components/client-booking-form.tsx"),
    read("src/app/actions/leads.ts"),
  ]);

  assert.match(form, /Date & time/);
  assert.match(form, /Your details/);
  assert.match(form, /Five required fields/);
  assert.match(form, /name="name" required/);
  assert.match(form, /name="email" required/);
  assert.match(form, /name="company" required/);
  assert.match(form, /name="service" required/);
  assert.match(form, /name="message" required minLength=\{40\}/);
  assert.doesNotMatch(form, /name="hours" required/);
  assert.doesNotMatch(form, /name="budget" required/);
  assert.doesNotMatch(form, /name="start_time" required/);
  assert.match(action, /hours: z\.string\(\)\.trim\(\)\.max\(3\)\.optional\(\)\.default\(""\)/);
  assert.match(action, /budget: z\.string\(\)\.trim\(\)\.max\(100\)\.optional\(\)\.default\(""\)/);
  assert.match(action, /start_time: z\.string\(\)\.trim\(\)\.max\(100\)\.optional\(\)\.default\(""\)/);
  assert.match(action, /message: z\.string\(\)\.trim\(\)\.min\(40/);
  assert.match(action, /Tell us the actual role you need to hire/);
  assert.match(action, /mergeBookingIntoRecentClientLead/);
  assert.match(action, /jobId = await ensurePendingRoleForLead/);
  assert.match(action, /title: parsed\.data\.service/);
  assert.match(action, /metadata: \{ lead_id: leadId, job_id: jobId/);
});
test("floating call prompt is restricted to high-intent behavior", async () => {
  const cta = await read("src/components/floating-cta.tsx");
  assert.match(cta, /HIGH_INTENT_PATHS/);
  assert.match(cta, /va_discovery_form_started/);
  assert.match(cta, /isHighIntentPath/);
});

test("client booking prevents slot conflicts, records CRM state, and privately notifies Jervis and Bryan while the dashboard covers all meetings", async () => {
  const [action, email, migration] = await Promise.all([
    read("src/app/actions/leads.ts"),
    read("src/lib/email.ts"),
    read("supabase/migrations/20260912162238_prevent_duplicate_discovery_slots.sql"),
  ]);

  assert.match(action, /crm_stage: "discovery_booked"/);
  assert.match(action, /event_name: "booking_completed"/);
  assert.match(migration, /create unique index/);
  assert.match(migration, /discovery_scheduled_at/);
  assert.match(email, /const BOOKING_TEAM_EMAILS = normalizeEmailList/);
  assert.match(email, /jrvsaccad@gmail\.com/);
  assert.match(email, /bryanbatarina@gmail\.com/);
  const bookingTeamStart = email.indexOf("const BOOKING_TEAM_EMAILS");
  const bookingTeamEnd = email.indexOf("const staffClientFollowupBccRecipients", bookingTeamStart);
  assert.doesNotMatch(email.slice(bookingTeamStart, bookingTeamEnd), /erwinvalles20@gmail\.com/);
  assert.match(email, /"discovery_booking_internal_team"/);
  assert.doesNotMatch(email, /Jervis or Bryan will add the meeting link/);
  assert.match(email, /virtualassistant-discovery-call\.ics/);
  assert.match(email, /What we have on your brief/);
  assert.doesNotMatch(email, /Booking questionnaire/);
});

test("discovery bookings support Google Meet, email-silent reminder sweeps, self-service changes, and recruiter outcomes", async () => {
  const [operations, bookingAction, reminders, recruiter, migration] = await Promise.all([
    read("src/lib/booking-operations.ts"),
    read("src/app/actions/booking.ts"),
    read("src/app/api/cron/discovery-reminders/route.ts"),
    read("src/app/actions/recruiter.ts"),
    read("supabase/migrations/20260913082319_discovery_booking_operations.sql"),
  ]);
  assert.match(operations, /GOOGLE_CALENDAR_CLIENT_ID/);
  assert.match(operations, /conferenceDataVersion=1/);
  assert.match(operations, /hangoutsMeet/);
  assert.match(operations, /createCalendarInvite/);
  assert.match(bookingAction, /hashBookingManageToken/);
  assert.match(bookingAction, /rescheduleDiscoveryBookingAction/);
  assert.match(bookingAction, /cancelDiscoveryBookingAction/);
  assert.match(reminders, /client_email_shortlist_only/);
  assert.match(reminders, /reminder24h: 0/);
  assert.match(reminders, /reminder1h: 0/);
  assert.doesNotMatch(reminders, /sendDiscoveryReminderEmail/);
  for (const outcome of ["attended", "no_show", "cancelled", "rescheduled", "qualified"]) {
    assert.match(recruiter, new RegExp(outcome));
    assert.match(migration, new RegExp(outcome));
  }
});


test("recruiter agenda shows all active discovery bookings, not only the assigned owner", async () => {
  const agenda = await read("src/app/workspace/recruiter/agenda/page.tsx");
  const discoveryQuery = agenda.match(/admin\.from\("lead_intake"\)[\s\S]*?\.order\("discovery_scheduled_at"\)/)?.[0] || "";
  assert.match(discoveryQuery, /discovery_scheduled_at/);
  assert.doesNotMatch(discoveryQuery, /\.eq\("owner_id",userId\)/);
  assert.match(agenda, /All active discovery calls/);
});


test("recruiter home consolidates into My Day while Agenda owns the all-recruiter discovery calendar", async () => {
  const [root,today,agenda] = await Promise.all([
    read("src/app/workspace/recruiter/page.tsx"),
    read("src/app/workspace/recruiter/today/page.tsx"),
    read("src/app/workspace/recruiter/agenda/page.tsx")
  ]);
  assert.match(root,/redirect\("\/workspace\/recruiter\/today"\)/);
  assert.match(today,/recruiter_today_summary/);
  assert.match(agenda,/All active discovery calls/);
  assert.match(agenda,/\.from\("lead_intake"\)/);
  assert.doesNotMatch(agenda.match(/admin\.from\("lead_intake"\)[\s\S]*?\.order\("discovery_scheduled_at"\)/)?.[0] || "", /\.eq\("owner_id"/);
});


test("discovery booking lead merge is atomic and server-only", async () => {
  const migration = await read("supabase/migrations/20260921180500_merge_discovery_booking_duplicates.sql");

  assert.match(migration, /create or replace function public\.merge_discovery_booking_lead/);
  assert.match(migration, /for update/);
  assert.match(migration, /Canonical lead already has a discovery booking/);
  assert.match(migration, /Booking lead has no discovery slot/);
  assert.match(migration, /discovery_scheduled_at = null/);
  assert.match(migration, /discovery_manage_token_hash = null/);
  assert.match(migration, /update public\.jobs[\s\S]*set lead_id = canonical_lead_id/);
  assert.match(migration, /update public\.lead_proposals[\s\S]*set lead_id = canonical_lead_id/);
  assert.match(migration, /delete from public\.lead_intake[\s\S]*booking_lead_id/);
  assert.match(migration, /grant execute on function public\.merge_discovery_booking_lead\(uuid, uuid\) to service_role/);
  assert.match(migration, /revoke all on function public\.merge_discovery_booking_lead\(uuid, uuid\) from public, anon, authenticated/);
});


test("booking page fails open to provisional slots when booked-slot lookup fails", async () => {
  const page = await read("src/app/book-client-call/page.tsx");
  assert.match(page, /Could not load booked discovery slots; showing provisional availability/);
  assert.match(page, /return buildDiscoverySlotDays\(\[\], new Date\(\)\)/);
});
