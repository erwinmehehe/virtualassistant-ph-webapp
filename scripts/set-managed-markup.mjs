import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-env.mjs";
loadLocalEnv();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await admin.from("admin_settings").update({ default_managed_markup_percent: 20 }).eq("id", 1).select("default_placement_fee,default_managed_markup_percent").single();
if (error) { console.error(error); process.exit(1); }
console.log("Updated:", data);
