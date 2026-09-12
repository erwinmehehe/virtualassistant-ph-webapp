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
});

test("client booking saves the questionnaire, prevents slot conflicts, and copies both owners", async () => {
  const [action, email, migration] = await Promise.all([
    read("src/app/actions/leads.ts"),
    read("src/lib/email.ts"),
    read("supabase/migrations/20260912160858_prevent_duplicate_discovery_slots.sql"),
  ]);

  for (const field of ["company_url", "service", "hours", "budget", "start_time", "message"]) {
    assert.match(action, new RegExp(field));
  }
  assert.match(action, /crm_stage: "discovery_booked"/);
  assert.match(action, /event_name: "booking_completed"/);
  assert.match(migration, /create unique index/);
  assert.match(migration, /discovery_scheduled_at/);
  assert.match(email, /jrvsaccad@gmail\.com/);
  assert.match(email, /bryanbatarina@gmail\.com/);
  assert.match(email, /Booking questionnaire/);
});
