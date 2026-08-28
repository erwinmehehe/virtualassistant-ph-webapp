import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-env.mjs";
loadLocalEnv();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await admin.from("lead_intake").select("*").eq("source_page", "contact").eq("status", "new").single();
if (error) { console.error(error); process.exit(1); }
console.log(JSON.stringify(data, null, 2));
