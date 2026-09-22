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

  const vaProfileBlock=action.slice(action.indexOf("export async function updateVaProfileAction"),action.indexOf("export async function updateClientProfileAction"));
  const clientProfileBlock=action.slice(action.indexOf("export async function updateClientProfileAction"),action.indexOf("export async function completeClientOnboardingAction"));
  assert.match(vaProfileBlock,/if \(profileError\) throw profileError/);
  assert.match(clientProfileBlock,/if \(companyError\) throw companyError/);
});

test("server-only operational tables have explicit deny policies", async()=>{
  const sql=await read("supabase/migrations/20260922005433_explicit_server_only_rls_followup.sql");
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


test("authenticated dashboard visual QA targets the shipped main commit without privileged database secrets", async()=>{
  const [workflow,visual]=await Promise.all([
    read(".github/workflows/dashboard-visual.yml"),
    read("scripts/authenticated-dashboard-visual.mjs"),
  ]);
  assert.match(workflow,/push:/);
  assert.match(workflow,/branches: \[main\]/);
  assert.match(workflow,/const sha = context\.sha/);
  assert.match(workflow,/Wait for this main commit to reach production/);
  assert.match(workflow,/VISUAL_BASE_URL: \${{ steps\.production\.outputs\.url }}/);
  assert.doesNotMatch(workflow,/SUPABASE_SERVICE_ROLE_KEY|VERCEL_AUTOMATION_BYPASS_SECRET|npm start|Build authenticated dashboard test app/);
  assert.match(visual,/role: "admin"/);
  assert.match(visual,/SMOKE_ADMIN_EMAIL/);
  assert.match(visual,/secure = parsedBaseUrl\.protocol === "https:"/);
});

test("pg_net migration refuses queued work and reinstalls outside public", async()=>{
  const sql=await read("supabase/migrations/20260922005659_move_pg_net_extension_out_of_public.sql");
  assert.match(sql,/http_request_queue/);
  assert.match(sql,/refusing to reinstall/);
  assert.match(sql,/create extension pg_net with schema extensions/);
});
