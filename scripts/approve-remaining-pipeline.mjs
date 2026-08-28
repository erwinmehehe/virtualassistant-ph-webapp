import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-env.mjs";
loadLocalEnv();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: vetting } = await admin.from("va_vetting").select("va_id,stage").not("stage", "in", "(approved,bench,rejected)");
const ids = vetting.map(v=>v.va_id);
const { data: profiles } = await admin.from("va_profiles").select("user_id,slug,primary_category,years_experience,headline").in("user_id", ids);
const pmap = new Map(profiles.map(p=>[p.user_id,p]));

// Only approve profiles that actually have something to show/match on
// (a category and a headline) -- an empty account has nothing to publish
// or match against, so "approving" it is a no-op that just mislabels an
// abandoned signup as vetted talent.
const approvable = vetting.filter(v => { const p = pmap.get(v.va_id); return p?.primary_category && p?.headline; });
const emptyShells = vetting.filter(v => !approvable.includes(v));

console.log(`${vetting.length} remaining in pipeline. ${approvable.length} have real profile data and are being approved now. ${emptyShells.length} are empty/abandoned signups (no category, no headline) -- skipped, nothing to approve.`);

const now = new Date().toISOString();
const approveIds = approvable.map(v=>v.va_id);
if (approveIds.length) {
  await admin.from("va_vetting").update({ stage: "approved", approved_at: now, admin_notes: "Bulk-approved: had a real profile with category + headline (backlog clear)." }).in("va_id", approveIds);
  await admin.from("notifications").insert(approveIds.map(id => ({ user_id: id, title: "Your VA profile is approved", body: "Your profile has been approved. You can now apply to published roles and appear in client matching.", href: "/workspace/va/vetting" })));
  console.log("Approved:");
  for (const v of approvable) { const p = pmap.get(v.va_id); console.log(`- ${p.slug} (${p.primary_category}, ${p.years_experience??"?"}yrs) was stage=${v.stage}`); }
}

console.log("\nSkipped (empty accounts, need to actually fill out a profile first):");
for (const v of emptyShells) { const p = pmap.get(v.va_id); console.log(`- ${p?.slug} stage=${v.stage}`); }
