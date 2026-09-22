import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("existing signup emails are handled by Supabase error code", async()=>{
  const auth=await read("src/app/actions/auth.ts");
  assert.match(auth,/errorCode === "email_exists"/);
  assert.match(auth,/An account may already exist for this email/);
});

test("client onboarding validation redirects back to the form", async()=>{
  const [action,page]=await Promise.all([
    read("src/app/actions/profile.ts"),
    read("src/app/workspace/client/onboarding/page.tsx"),
  ]);
  assert.match(action,/workspace\/client\/onboarding\?error=/);
  assert.doesNotMatch(action,/throw new Error\("Enter a valid hiring budget range\."\)/);
  assert.match(page,/role="alert"/);
  assert.match(page,/params\.error/);
});

test("server-only operational tables have explicit deny policies", async()=>{
  const sql=await read("supabase/migrations/20260922085000_explicit_server_only_rls_followup.sql");
  for (const table of [
    "candidate_interviews",
    "email_suppressions",
    "placement_checkins",
    "placement_offers",
    "placement_support_requests",
    "va_public_profile_consent_events",
  ]) assert.match(sql,new RegExp(table));
  assert.match(sql,/as restrictive for all to anon, authenticated using \(false\) with check \(false\)/);
});
