import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-env.mjs";
loadLocalEnv();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: lead, error } = await admin.from("lead_intake").select("*").eq("id", "52c99b62-c049-4916-be9b-6907534649aa").single();
if (error) { console.error(error); process.exit(1); }
console.log("Lead:", JSON.stringify(lead, null, 2));
const { data: job } = await admin.from("jobs").select("*").eq("id", "2958fcfb-41a2-48e3-abcf-651626f889f2").maybeSingle();
console.log("\nJob:", JSON.stringify(job, null, 2));
