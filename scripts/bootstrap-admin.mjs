import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-env.mjs";

loadLocalEnv();

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes("@")) {
  console.error("Usage: npm run bootstrap:admin -- you@company.com");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in the environment or .env.local.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
let matchedUser = null;

for (let page = 1; page <= 100 && !matchedUser; page += 1) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
  if (error) throw error;
  matchedUser = data.users.find((user) => user.email?.toLowerCase() === email) || null;
  if (data.users.length < 200) break;
}

if (!matchedUser) {
  console.error(`No Supabase Auth user found for ${email}. Create/sign up that account first, then run this command again.`);
  process.exit(1);
}

const fullName = typeof matchedUser.user_metadata?.full_name === "string" ? matchedUser.user_metadata.full_name : null;
const profilePatch = { id: matchedUser.id, role: "admin", ...(fullName ? { full_name: fullName } : {}) };
const { error: profileError } = await supabase.from("profiles").upsert(profilePatch, { onConflict: "id" });
if (profileError) throw profileError;

const { error: authError } = await supabase.auth.admin.updateUserById(matchedUser.id, {
  app_metadata: { ...(matchedUser.app_metadata || {}), role: "admin" }
});
if (authError) throw authError;

console.log(`Promoted ${email} to admin (${matchedUser.id}).`);
console.log("Log out and back in before opening /workspace/admin.");
