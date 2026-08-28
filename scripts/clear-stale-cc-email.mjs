import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-env.mjs";
loadLocalEnv();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { error } = await admin.from("admin_settings").update({ application_cc_email: null }).eq("id", 1);
if (error) { console.error(error); process.exit(1); }
console.log("Cleared stale application_cc_email.");
