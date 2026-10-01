import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

async function loadTimeZoneModule() {
  const source = await readFile(new URL("../src/lib/timezone.ts", import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  }).outputText;
  const encoded = Buffer.from(output).toString("base64");
  return import(`data:text/javascript;base64,${encoded}`);
}

test("client timezone conversion is DST-aware across common lead regions", async () => {
  const { zonedDateTimeToUtc, isValidTimeZone } = await loadTimeZoneModule();

  const cases = [
    ["Australia/Sydney", "2026-01-15T09:00", "2026-01-14T22:00:00.000Z"],
    ["Australia/Sydney", "2026-07-15T09:00", "2026-07-14T23:00:00.000Z"],
    ["Australia/Perth", "2026-07-15T09:00", "2026-07-15T01:00:00.000Z"],
    ["America/New_York", "2026-01-15T09:00", "2026-01-15T14:00:00.000Z"],
    ["America/New_York", "2026-07-15T09:00", "2026-07-15T13:00:00.000Z"],
    ["Europe/London", "2026-01-15T09:00", "2026-01-15T09:00:00.000Z"],
    ["Europe/London", "2026-07-15T09:00", "2026-07-15T08:00:00.000Z"],
    ["Asia/Manila", "2026-07-15T09:00", "2026-07-15T01:00:00.000Z"],
  ];

  for (const [timeZone, wallTime, expected] of cases) {
    assert.equal(isValidTimeZone(timeZone), true, `${timeZone} should be accepted`);
    assert.equal(
      zonedDateTimeToUtc(wallTime, timeZone)?.toISOString(),
      expected,
      `${wallTime} in ${timeZone} should preserve the client's 9 AM wall clock`,
    );
  }
});

test("invalid or DST-skipped local times are rejected instead of guessed", async () => {
  const { zonedDateTimeToUtc, isValidTimeZone } = await loadTimeZoneModule();

  assert.equal(isValidTimeZone("Australia/NotAPlace"), false);
  assert.equal(zonedDateTimeToUtc("2026-03-08T02:30", "America/New_York"), null);
});
