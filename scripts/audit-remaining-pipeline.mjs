import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-env.mjs";
loadLocalEnv();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: vetting } = await admin.from("va_vetting").select("va_id,stage").not("stage", "in", "(approved,bench,rejected)");
const ids = vetting.map(v=>v.va_id);
const { data: profiles } = await admin.from("va_profiles").select("user_id,slug,primary_category,years_experience,headline,bio,skills").in("user_id", ids);
const pmap = new Map(profiles.map(p=>[p.user_id,p]));
console.log(`${vetting.length} VAs remaining in the pipeline (not approved/bench/rejected).`);
for (const v of vetting) {
  const p = pmap.get(v.va_id);
  const hasBasics = p?.primary_category && p?.headline;
  console.log(`- ${v.va_id} stage=${v.stage} category=${p?.primary_category||"MISSING"} exp=${p?.years_experience??"MISSING"} headline=${p?.headline?"yes":"MISSING"} skills=${p?.skills?.length||0} slug=${p?.slug} readyish=${hasBasics}`);
}
