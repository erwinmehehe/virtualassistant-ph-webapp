import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("admin job exceptions include incomplete active roles", async () => {
  const page = await read("src/app/workspace/admin/jobs/page.tsx");
  assert.match(page, /publication\.key==="needs_role_details"/);
  assert.match(page, /const incomplete=/);
  assert.match(page, /Needs role details/);
  assert.match(page, /Complete role/);
  assert.match(page, /Incomplete roles or managed-service decisions/);
  assert.match(page, /Complete standard curated roles stay recruiter-owned/);
});

test("closed and draft roles are excluded from incomplete-role admin exceptions", async () => {
  const page = await read("src/app/workspace/admin/jobs/page.tsx");
  assert.match(page, /job\.status==="closed"\|\|job\.status==="draft"/);
  assert.match(page, /job\.status!=="closed"&&job\.status!=="draft"/);
});

test("recruiter queue flags incomplete roles without removing existing quick actions", async () => {
  const page = await read("src/app/workspace/recruiter/roles/page.tsx");
  assert.match(page, /"needs_details", "Needs role details"/);
  assert.match(page, /view=needs_details&sort=urgent/);
  assert.match(page, /Review incomplete roles →/);
  assert.match(page, /view=ready_offer&sort=urgent/);
  assert.match(page, /view=needs_candidates&sort=urgent/);
});
