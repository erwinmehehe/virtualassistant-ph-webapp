import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("client follow-up email has one personalized greeting without an injected CTA", async () => {
  const email = await read("src/lib/email.ts");
  const start = email.indexOf("export async function sendStaffClientFollowupEmail");
  const end = email.indexOf("export async function sendTransactionalEventEmail", start);
  const followup = email.slice(start, end);

  assert.match(email, /function renderHiringEmail/);
  assert.match(email, /function normalizeClientFollowup/);
  assert.match(email, /\^\(\?:hi\|hello\|hey\)/i);
  assert.match(email, /About your .* request/);
  assert.doesNotMatch(followup, /Choose a call time/);
  assert.doesNotMatch(followup, /Open hiring workspace/);
  assert.doesNotMatch(followup, /ctaHref:/);
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

test("manual client follow-up preserves the recruiter's typed sign-off and suppresses the wrapper signature", async () => {
  const email = await read("src/lib/email.ts");
  const start = email.indexOf("export async function sendStaffClientFollowupEmail");
  const end = email.indexOf("export async function sendTransactionalEventEmail", start);
  const followup = email.slice(start, end);

  assert.match(followup, /preserveSignoff: true/);
  assert.match(followup, /appendSignature: false/);
  assert.match(email, /if \(!options\?\.preserveSignoff\)/);
  assert.match(email, /const signature = args\.appendSignature === false/);
});
