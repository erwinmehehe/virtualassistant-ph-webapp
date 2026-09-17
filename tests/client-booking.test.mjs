import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("all client call entry points use the qualified booking route", async () => {
  const files = await Promise.all([
    read("src/app/page.tsx"),
    read("src/app/hire/page.tsx"),
    read("src/components/floating-cta.tsx"),
    read("src/components/service-match-form.tsx"),
    read("src/components/industry-match-form.tsx"),
    read("src/app/contact/page.tsx"),
  ]);

  for (const source of files) {
    assert.match(source, /\/book-client-call/);
    assert.doesNotMatch(source, /calendar\.app\.google\/FxedmioyeJhKras87/);
  }
});

test("booking flow blocks VA applicants before showing client slots", async () => {
  const [form, action] = await Promise.all([
    read("src/components/client-booking-form.tsx"),
    read("src/app/actions/leads.ts"),
  ]);

  assert.match(form, /I am hiring/);
  assert.match(form, /I am a Virtual Assistant/);
  assert.match(form, /audience === "va"/);
  assert.match(form, /Apply as a Virtual Assistant/);
  assert.match(action, /audience: z\.literal\("client"\)/);
  assert.match(action, /isAllowedDiscoverySlot/);
  assert.match(form, /useState<string \| null>\(null\)/);
  assert.ok(form.includes("Australia/Sydney"));
  assert.ok(form.includes("Times shown in ${timeZoneLabel"));
});

test("discovery booking is available 24/7 and grouped in the visitor timezone", async () => {
  const [form, booking] = await Promise.all([
    read("src/components/client-booking-form.tsx"),
    read("src/lib/discovery-booking.ts"),
  ]);

  assert.match(booking, /for \(let hour = 0; hour < 24; hour \+= 1\)/);
  assert.doesNotMatch(booking, /START_HOUR|END_HOUR/);
  assert.doesNotMatch(booking, /weekday === 0|weekday === 6/);
  assert.match(form, /24\/7 availability/);
  assert.match(form, /localDateKey/);
  assert.match(form, /localDays\.map/);
});

test("client booking is two steps and does not repeat the hiring questionnaire", async () => {
  const form = await read("src/components/client-booking-form.tsx");

  assert.match(form, /Step 1 of 2/);
  assert.match(form, /Step 2 of 2/);
  assert.doesNotMatch(form, /Step 3 of 3/);
  assert.doesNotMatch(form, /What type of VA do you need\?/);
  assert.doesNotMatch(form, /Hourly VA budget \*/);
  assert.doesNotMatch(form, /What should the VA own, and what is your biggest challenge\?/);
  assert.match(form, /name="name"/);
  assert.match(form, /name="email"/);
  assert.match(form, /name="company"/);
  assert.match(form, /name="service" value="Virtual Assistant hiring"/);
  assert.match(form, /Role details will be confirmed during the conversation/);
});

test("floating call prompt is restricted to high-intent behavior", async () => {
  const cta = await read("src/components/floating-cta.tsx");
  assert.match(cta, /HIGH_INTENT_PATHS/);
  assert.match(cta, /va_discovery_form_started/);
  assert.match(cta, /isHighIntentPath/);
});

test("client booking prevents slot conflicts, records CRM state, and copies both owners", async () => {
  const [action, email, migration] = await Promise.all([
    read("src/app/actions/leads.ts"),
    read("src/lib/email.ts"),
    read("supabase/migrations/20260912162238_prevent_duplicate_discovery_slots.sql"),
  ]);

  assert.match(action, /crm_stage: "discovery_booked"/);
  assert.match(action, /event_name: "booking_completed"/);
  assert.match(migration, /create unique index/);
  assert.match(migration, /discovery_scheduled_at/);
  assert.match(email, /jrvsaccad@gmail\.com/);
  assert.match(email, /bryanbatarina@gmail\.com/);
  assert.match(email, /Jervis or Bryan/);
  assert.match(email, /virtualassistant-discovery-call\.ics/);
  assert.match(email, /Booking details/);
  assert.doesNotMatch(email, /Booking questionnaire/);
});

test("discovery bookings support Zoom, reminders, self-service changes, and recruiter outcomes", async () => {
  const [operations, bookingAction, reminders, recruiter, migration] = await Promise.all([
    read("src/lib/booking-operations.ts"),
    read("src/app/actions/booking.ts"),
    read("src/app/api/cron/discovery-reminders/route.ts"),
    read("src/app/actions/recruiter.ts"),
    read("supabase/migrations/20260913082319_discovery_booking_operations.sql"),
  ]);
  assert.match(operations, /ZOOM_ACCOUNT_ID/);
  assert.match(operations, /createCalendarInvite/);
  assert.match(bookingAction, /hashBookingManageToken/);
  assert.match(bookingAction, /rescheduleDiscoveryBookingAction/);
  assert.match(bookingAction, /cancelDiscoveryBookingAction/);
  assert.match(reminders, /discovery_reminder_24h_sent_at/);
  assert.match(reminders, /discovery_reminder_1h_sent_at/);
  for (const outcome of ["attended", "no_show", "cancelled", "rescheduled", "qualified"]) {
    assert.match(recruiter, new RegExp(outcome));
    assert.match(migration, new RegExp(outcome));
  }
});
