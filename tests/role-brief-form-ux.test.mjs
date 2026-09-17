import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// The shared hiring form (HiringBriefForm) replaced the long role brief form.
const form = readFileSync(new URL("../src/components/hiring-brief-form.tsx", import.meta.url), "utf8");

test("public hiring request has no job description or SOP upload", () => {
  assert.doesNotMatch(form, /Job description or SOP/i);
  assert.doesNotMatch(form, /name="attachment"/);
  assert.doesNotMatch(form, /type="file"/);
});

test("hiring brief asks only for contact essentials", () => {
  assert.match(form, /name="name" required/);
  assert.match(form, /name="email" type="email" required/);
  assert.doesNotMatch(form, /name="phone"/);
  assert.doesNotMatch(form, /hire-optional-details/);
});

test("public hiring budget uses the canonical minimum-rate constant", () => {
  assert.match(form, /MIN_HOURLY_RATE/);
  assert.match(form, /`USD \$\{MIN_HOURLY_RATE\} to 8\/hour`/);
  assert.doesNotMatch(form, /"USD 6 to 8\/hour"/);
});
