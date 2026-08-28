import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-env.mjs";
loadLocalEnv();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: lead, error } = await admin.from("lead_intake").select("*").eq("id", "4110562d-3364-4ea1-9aa1-06623717cf59").single();
if (error) { console.error(error); process.exit(1); }
console.log("Lead:", JSON.stringify(lead, null, 2));

// Check if an account already exists for this email (maybe they signed up
// separately without the lead ever getting linked).
if (lead.email) {
  const { data: users } = await admin.auth.admin.listUsers();
  const match = users.users.find(u => u.email?.toLowerCase() === lead.email.toLowerCase());
  console.log("\nExisting account with this email?", match ? { id: match.id, email: match.email, created_at: match.created_at } : "No account found.");
}
