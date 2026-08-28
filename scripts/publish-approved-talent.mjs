import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-env.mjs";
loadLocalEnv();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: vetting } = await admin.from("va_vetting").select("va_id,stage").in("stage", ["approved", "bench"]);
const ids = vetting.map((v) => v.va_id);

const { data: candidates } = await admin.from("va_profiles").select("user_id,slug,directory_visible,availability_status,years_experience,primary_category").in("user_id", ids).eq("directory_visible", false);

console.log(`${candidates.length} approved/bench VAs currently hidden from the public directory.`);
const belowMinExperience = candidates.filter((c) => Number(c.years_experience || 0) < 2);
console.log(`(${belowMinExperience.length} of those are under 2 yrs experience -- they'll still be filtered out of public pages by the site's own experience gate, publishing them is harmless.)`);

if (candidates.length) {
  const { error } = await admin.from("va_profiles").update({ directory_visible: true }).in("user_id", candidates.map((c) => c.user_id));
  if (error) { console.error(error); process.exit(1); }
  console.log(`\nPublished ${candidates.length} VAs to the public directory.`);
  for (const c of candidates) console.log(`- ${c.slug} (${c.primary_category}, ${c.years_experience}yrs)`);
}
