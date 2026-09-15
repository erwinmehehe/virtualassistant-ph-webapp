import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const form = readFileSync(new URL("../src/components/role-brief-form.tsx", import.meta.url), "utf8");

test("public hiring request removes job description and SOP upload", () => {
  assert.doesNotMatch(form, /Job description or SOP/i);
  assert.doesNotMatch(form, /name="attachment"/);
  assert.doesNotMatch(form, /type="file"/);
});

test("contact details are always visible while phone stays optional", () => {
  assert.match(form, /<h3>Contact details<\/h3>/);
  assert.doesNotMatch(form, /hire-optional-details/);
  assert.doesNotMatch(form, /Add contact details/);
  assert.match(form, /name="name" required/);
  assert.match(form, /name="company" required/);
  assert.match(form, /name="email" type="email" required/);
  assert.match(form, /Phone \/ WhatsApp <span className="muted">\(optional\)<\/span>/);
  assert.match(form, /name="phone" type="tel" autoComplete="tel"/);
  assert.doesNotMatch(form, /name="phone" type="tel" required/);
});

test("public hiring budget uses the canonical minimum-rate constant", () => {
  assert.match(form, /MIN_HOURLY_RATE/);
  assert.match(form, /const entryBudget = `USD \$\{MIN_HOURLY_RATE\} to 8\/hour`/);
  assert.doesNotMatch(form, /USD 6 to 8\/hour/);
});
