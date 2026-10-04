import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.E2E_PASSWORD || "E2e-Only!Pass12345";

if (!url || !serviceKey) throw new Error("Local Supabase URL and service-role key are required.");

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const accounts = [
  { email: "recruiter.e2e@example.test", role: "recruiter", fullName: "E2E Recruiter" },
  { email: "client.e2e@example.test", role: "client", fullName: "E2E Client" },
  { email: "va.e2e@example.test", role: "va", fullName: "E2E VA" },
];

const { data: existingData, error: existingError } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
if (existingError) throw existingError;

for (const account of accounts) {
  let user = existingData.users.find((candidate) => candidate.email === account.email) || null;
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: account.email,
      password,
      email_confirm: true,
      user_metadata: { role: account.role, full_name: account.fullName },
    });
    if (error || !data.user) throw error || new Error(`Could not create ${account.role} E2E user.`);
    user = data.user;
  } else {
    const { data, error } = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: { ...user.user_metadata, role: account.role, full_name: account.fullName },
    });
    if (error || !data.user) throw error || new Error(`Could not refresh ${account.role} E2E user.`);
    user = data.user;
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: user.id,
    role: account.role,
    full_name: account.fullName,
    account_status: "active",
    email_verified: true,
  }, { onConflict: "id" });
  if (profileError) throw profileError;

  if (account.role === "client") {
    const { error } = await admin.from("client_profiles").upsert({
      user_id: user.id,
      company_name: "E2E Test Company",
      timezone: "Asia/Manila",
    }, { onConflict: "user_id" });
    if (error) throw error;
  }

  if (account.role === "va") {
    const { error } = await admin.from("va_profiles").upsert({
      user_id: user.id,
      headline: "E2E Virtual Assistant",
      primary_category: "Administrative Support",
      categories: ["Administrative Support"],
      skills: ["Calendar Management", "Inbox Management"],
      tools: ["Google Workspace"],
      languages: ["English"],
      years_experience: 3,
      weekly_hours: 40,
      hourly_rate: 8,
      availability_status: "available",
      directory_visible: false,
    }, { onConflict: "user_id" });
    if (error) throw error;
  }

  console.log(`seeded:${account.role}:${user.id}`);
}
