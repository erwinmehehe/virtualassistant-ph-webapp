import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("client follow-up email has one personalized greeting and a human booking CTA", async () => {
  const email = await read("src/lib/email.ts");

  assert.match(email, /function renderHiringEmail/);
  assert.match(email, /function normalizeClientFollowup/);
  assert.match(email, /\^\(\?:hi\|hello\|hey\)/i);
  assert.match(email, /About your .* request/);
  assert.match(email, /Choose a call time/);
  assert.doesNotMatch(email, /html: `<p>Hi,<\/p><p>\$\{escapeHtml\(message\)/);
  assert.match(email, /VirtualAssistant<span style="color:#4f46e5;">\.com\.ph<\/span>/);
});

test("service-page enquiries are forced into the recruiter hiring pipeline", async () => {
  const migration = await read("supabase/migrations/20260917090000_fix_hiring_lead_routing.sql");

  assert.match(migration, /service_match_request/);
  assert.match(migration, /industry_match_request/);
  assert.match(migration, /new\.lead_type := 'client_hiring'/);
  assert.match(migration, /public\.default_recruiter_id\(\)/);
  assert.match(migration, /l\.lead_type='client_hiring'/);
  assert.match(migration, /\/workspace\/recruiter\/leads\?view=all&q=/);
});
