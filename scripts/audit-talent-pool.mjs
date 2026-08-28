import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-env.mjs";
loadLocalEnv();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: vetting } = await admin.from("va_vetting").select("va_id,stage,recruiter_id,video_submitted_at,approved_at");
const byStage = {};
for (const v of vetting) byStage[v.stage] = (byStage[v.stage] || 0) + 1;
console.log("=== Vetting stage breakdown ===");
console.log(byStage);
console.log(`Total: ${vetting.length}`);

const { data: profiles } = await admin.from("va_profiles").select("user_id,slug,directory_visible,availability_status,primary_category,years_experience,headline");
const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

const { data: scorecards } = await admin.from("vetting_scorecards").select("va_id,total_score,recommendation,created_at").order("created_at", { ascending: false });
const latestScoreByVa = new Map();
for (const s of scorecards) if (!latestScoreByVa.has(s.va_id)) latestScoreByVa.set(s.va_id, s);

const { data: attempts } = await admin.from("va_test_attempts").select("va_id,final_score,test_id").not("final_score", "is", null);
const latestTestByVa = new Map();
for (const a of attempts) latestTestByVa.set(a.va_id, Math.max(a.final_score, latestTestByVa.get(a.va_id) || 0));

console.log("\n=== Not yet public (approved/bench) but has a scorecard ===");
const notPublicWithScore = vetting.filter((v) => !["approved", "bench"].includes(v.stage) && latestScoreByVa.has(v.va_id));
for (const v of notPublicWithScore) {
  const p = profileMap.get(v.va_id);
  const sc = latestScoreByVa.get(v.va_id);
  const testScore = latestTestByVa.get(v.va_id);
  console.log(`- ${v.va_id} stage=${v.stage} scorecard=${sc.total_score}(${sc.recommendation}) test=${testScore ?? "none"} category=${p?.primary_category} exp=${p?.years_experience}yrs slug=${p?.slug}`);
}
console.log(`Count: ${notPublicWithScore.length}`);

console.log("\n=== Approved/bench stage but NOT visible on directory (directory_visible or availability off) ===");
const approvedNotVisible = vetting.filter((v) => ["approved", "bench"].includes(v.stage)).filter((v) => {
  const p = profileMap.get(v.va_id);
  return !p || !p.directory_visible || p.availability_status !== "available";
});
for (const v of approvedNotVisible) {
  const p = profileMap.get(v.va_id);
  console.log(`- ${v.va_id} stage=${v.stage} directory_visible=${p?.directory_visible} availability=${p?.availability_status} slug=${p?.slug}`);
}
console.log(`Count: ${approvedNotVisible.length}`);

console.log("\n=== recruiter_review / finalist stage candidates (closest to ready) ===");
const closeCandidates = vetting.filter((v) => ["recruiter_review", "finalist"].includes(v.stage));
for (const v of closeCandidates) {
  const p = profileMap.get(v.va_id);
  const sc = latestScoreByVa.get(v.va_id);
  const testScore = latestTestByVa.get(v.va_id);
  console.log(`- ${v.va_id} stage=${v.stage} scorecard=${sc ? `${sc.total_score}(${sc.recommendation})` : "none"} test=${testScore ?? "none"} category=${p?.primary_category} exp=${p?.years_experience}yrs slug=${p?.slug}`);
}
console.log(`Count: ${closeCandidates.length}`);
