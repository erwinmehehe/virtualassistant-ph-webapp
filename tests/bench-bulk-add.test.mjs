import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("src/app/workspace/recruiter/bench/page.tsx", "utf8");
const action = fs.readFileSync("src/app/actions/bench.ts", "utf8");
const selectAll = fs.readFileSync("src/components/bench-bulk-select-all.tsx", "utf8");

test("bench waiting table supports bulk selection without removing individual add controls", () => {
  assert.match(page, /id="bench-bulk-add"/);
  assert.match(page, /action=\{bulkAddBenchMembersAction\}/);
  assert.match(page, /form="bench-bulk-add" name="va_id"/);
  assert.match(page, /Add selected/);
  assert.match(page, /BenchBulkSelectAll/);
  assert.match(page, /action=\{addBenchMemberAction\}/);
  assert.match(selectAll, /Select all/);
});

test("bulk add validates the entire selection before activating talent-pool memberships", () => {
  assert.match(action, /requireAnyRole\(\["recruiter", "admin"\]\)/);
  assert.match(action, /getAll\("va_id"\)/);
  assert.match(action, /MAX_BULK_BENCH_ADD/);
  assert.match(action, /VA_CATEGORIES\.includes/);
  assert.match(action, /\["approved", "bench"\]\.includes\(row\.stage\)/);
  assert.match(action, /existingMemberships\?\.length/);
  assert.match(action, /bench_memberships/);
  assert.match(action, /status: "active"/);
  assert.match(action, /stage: "bench"/);
});
