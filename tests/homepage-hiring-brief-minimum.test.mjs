import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("homepage hiring brief requires at least 40 characters", async () => {
  const source = await readFile(new URL("../src/components/hiring-brief-form.tsx", import.meta.url), "utf8");
  assert.match(source, /messageMin={sourcePath === "\/" \? 40 : 15}/);
  assert.match(source, /Minimum 40 characters\./);
});

test("server validates the 40-character homepage minimum", async () => {
  const source = await readFile(new URL("../src/app/actions/leads.ts", import.meta.url), "utf8");
  assert.match(source, /value\.source_path === "\/" && value\.message\.trim\(\)\.length < 40/);
  assert.match(source, /Minimum 40 characters/);
});
