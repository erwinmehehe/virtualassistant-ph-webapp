import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const seedPath = "supabase/migrations/20260923112000_seed_australian_va_fundamentals.sql";

test("Australian VA Fundamentals is a private draft with substantial course depth", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Australian VA Fundamentals/);
  assert.match(seed, /\'Australia\'/);
  assert.match(seed, /\n  290,\n  \'draft\'/);
  assert.match(seed, /Australian Client Operations Simulation/);
  assert.match(seed, /administrative judgment assessment/i);
  const lessonIds = new Set(seed.match(/22000000-0000-4000-8000-0000000000\d{2}/g) || []);
  assert.equal(lessonIds.size, 11);
  const moduleIds = new Set(seed.match(/21000000-0000-4000-8000-0000000000\d{2}/g) || []);
  assert.equal(moduleIds.size, 6);
});

test("Australia course separates admin awareness from regulated professional advice", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /not tax, legal, privacy, BAS, accounting, or other professional advice/i);
  assert.match(seed, /Whether a business should register for GST/);
  assert.match(seed, /How a BAS should be completed or corrected/);
  assert.match(seed, /Do not independently decide what cross-border disclosure is legally permitted/);
  assert.match(seed, /client, bookkeeper, accountant, or registered adviser/i);
});

test("Australia course covers practical cross-border VA operations", async () => {
  const seed = await readFile(seedPath, "utf8");
  for (const phrase of [
    "Australian Time Zones and Daylight-Saving Changes",
    "ABN, ACN, GST, and BAS",
    "Australian Privacy Principles",
    "Customer Service and Escalation",
    "Suppliers, Appointments, and Operational Follow-up",
    "Harbour Field Services",
  ]) {
    assert.ok(seed.includes(phrase), phrase + " missing");
  }
  assert.match(seed, /"type":"scenario"/);
  assert.match(seed, /time zone/i);
  assert.match(seed, /privacy/i);
  assert.match(seed, /handoff/i);
});

test("Australia lessons remain unpublished until human review", async () => {
  const seed = await readFile(seedPath, "utf8");
  const publishFlags = seed.match(/false, 1, now\(\), now\(\)/g) || [];
  assert.ok(publishFlags.length >= 11);
});
