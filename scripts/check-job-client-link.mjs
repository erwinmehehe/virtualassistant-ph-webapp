import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-env.mjs";
loadLocalEnv();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await admin.from("jobs").select("id,title,client_id,status,lead_id").eq("id", "22f484e1-99b0-48d6-b57c-dc4e79069586").single();
if (error) { console.error(error); process.exit(1); }
console.log(data);
