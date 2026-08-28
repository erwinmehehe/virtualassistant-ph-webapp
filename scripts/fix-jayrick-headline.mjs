import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-env.mjs";
loadLocalEnv();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const userId = "a576f416-64a8-44e2-af1a-77e3632b78ac";
const newHeadline = "Customer Service & Ecommerce Virtual Assistant";
const { data, error } = await admin.from("va_profiles").update({ headline: newHeadline }).eq("user_id", userId).select("user_id,headline").single();
if (error) { console.error(error); process.exit(1); }
console.log("Updated:", data);
