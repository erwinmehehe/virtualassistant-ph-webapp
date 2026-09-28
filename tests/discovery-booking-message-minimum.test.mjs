import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("discovery call notes are required with a 40-character minimum", async () => {
  const source = await readFile(new URL("../src/components/client-booking-form.tsx", import.meta.url), "utf8");
  assert.match(source, /name="message" required minLength=\{40\}/);
  assert.match(source, /Minimum 40 characters\./);
  assert.doesNotMatch(source, /Anything we should know\? <span>Optional<\/span>/);
});

test("server enforces the same 40-character booking minimum", async () => {
  const source = await readFile(new URL("../src/app/actions/leads.ts", import.meta.url), "utf8");
  assert.match(source, /message: z\.string\(\)\.trim\(\)\.min\(40/);
  assert.match(source, /Please add a little more detail\. Minimum 40 characters\./);
});
