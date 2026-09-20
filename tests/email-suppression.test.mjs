import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read=(p)=>readFile(new URL(`../${p}`,import.meta.url),"utf8");
test("hard delivery failures suppress future sends",async()=>{
 const [email,hook,migration]=await Promise.all([read("src/lib/email.ts"),read("src/app/api/webhooks/resend/route.ts"),read("supabase/migrations/20260920144500_email_suppressions.sql")]);
 assert.match(email,/from\("email_suppressions"\)/);
 assert.match(email,/safeTo/);
 assert.match(hook,/\["bounced", "complained", "suppressed"\]/);
 assert.match(hook,/upsert\(\{ email, reason: status/);
 assert.match(migration,/create table if not exists public\.email_suppressions/);
});
