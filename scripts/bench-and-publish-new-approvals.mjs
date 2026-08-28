import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-env.mjs";
loadLocalEnv();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: approved } = await admin.from("va_vetting").select("va_id").eq("stage", "approved");
const ids = approved.map(r=>r.va_id);
const { data: profiles } = await admin.from("va_profiles").select("user_id,primary_category").in("user_id", ids);
const eligible = profiles.filter(p=>p.primary_category);
const rows = eligible.map(p => ({ va_id: p.user_id, category: p.primary_category, status: "active", priority: 3 }));
const { error } = await admin.from("bench_memberships").upsert(rows, { onConflict: "va_id,category" });
if (error) { console.error(error); process.exit(1); }
await admin.from("va_vetting").update({ stage: "bench" }).in("va_id", eligible.map(p=>p.user_id));
await admin.from("va_profiles").update({ directory_visible: true }).in("user_id", ids);
console.log(`Added ${eligible.length} to bench, published directory_visible=true for ${ids.length} approved VAs.`);
