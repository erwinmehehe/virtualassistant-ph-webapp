import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-env.mjs";
loadLocalEnv();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await admin.from("public_va_directory").select("user_id,slug,primary_category,years_experience").gte("years_experience", 2);
if (error) { console.error(error); process.exit(1); }
console.log(`${data.length} VAs now actually appear on the public site (find-talent + homepage).`);
for (const d of data) console.log(`- ${d.slug} (${d.primary_category}, ${d.years_experience}yrs)`);
