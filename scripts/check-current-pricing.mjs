import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-env.mjs";
loadLocalEnv();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await admin.from("admin_settings").select("*").eq("id",1).single();
console.log(JSON.stringify(data, null, 2));
