import { createClient } from "@supabase/supabase-js";
import { writeFile } from "node:fs/promises";

/**
 * ONLY for GitHub browser/database contracts on disposable loopback Supabase.
 * Normal all-role/coach smoke seeding stays unchanged. No live employer data,
 * provider payments, outbound email or paid staging are involved here.
 */
const database = process.env.NEXT_PUBLIC_SUPABASE_URL;
const app = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!database || !key) throw new Error("Disposable local E2E credentials required");
for (const target of [database, app]) {
  const url = new URL(target);
  if (url.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]", "::1"].includes(url.hostname)) {
    throw new Error("Hiring acceptance fixtures forbid remote, Preview and Production endpoints");
  }
}
const admin = createClient(database, key, { auth: { autoRefreshToken: false, persistSession: false } });
// The full E2E suite already exercises login with the generic role accounts.
 // Give these *additional* connected hiring and analytics scenarios their own
 // fictional identities: shared accounts otherwise hit the real per-email
 // login rate limit and cause unrelated training tests to fail later.
const { data: identities, error: identityError } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
if (identityError) throw identityError;
const accounts = [
  { key: "recruiter", role: "recruiter", email: "recruiter.hiring-e2e@example.test", fullName: "E2E Hiring Recruiter" },
  { key: "client", role: "client", email: "client.hiring-e2e@example.test", fullName: "E2E Hiring Client" },
  { key: "va", role: "va", email: "va.hiring-e2e@example.test", fullName: "E2E Hiring VA" },
  { key: "training_admin", role: "admin", email: "admin.training-e2e@example.test", fullName: "E2E Training Admin" },
  { key: "training_recruiter", role: "recruiter", email: "recruiter.training-e2e@example.test", fullName: "E2E Training Recruiter" },
  { key: "training_client", role: "client", email: "client.training-e2e@example.test", fullName: "E2E Training Client" },
];
const seededUserIds = {};
for (const account of accounts) {
  let user = identities.users.find(person => person.email === account.email);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: account.email,
      password: process.env.E2E_PASSWORD || "E2e-Only!Pass12345",
      email_confirm: true,
      user_metadata: { role: account.role, full_name: account.fullName },
    });
    if (error || !data?.user) throw new Error("Cannot create isolated " + account.key + ": " + error?.message);
    user = data.user;
  }
  const { error: profileError } = await admin.from("profiles").upsert({
    id: user.id,
    role: account.role,
    full_name: account.fullName,
    account_status: "active",
    email_verified: true,
  }, { onConflict: "id" });
  if (profileError) throw new Error("Cannot seed role " + account.key + ": " + profileError.message);
  if (account.role === "client") {
    const { error: clientError } = await admin.from("client_profiles").upsert({
      user_id: user.id,
      company_name: "E2E Hiring Fixtures Company",
      timezone: "Asia/Manila",
      onboarding_completed_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (clientError) throw new Error("Cannot seed client " + account.key + ": " + clientError.message);
  }
  seededUserIds[account.key] = user.id;
}

// Only the fictional VA for this workflow is approved. Do not change the
// generic role-smoke VA or relax live vetting/availability requirements.
const { error: vaError } = await admin.from("va_profiles").upsert({
  user_id: seededUserIds.va,
  headline: "E2E Administrative Virtual Assistant",
  bio: "I coordinate schedules, inboxes, documentation, appointments and client updates using Google Workspace.",
  primary_category: "Administrative Support",
  categories: ["Administrative Support"],
  skills: ["Administrative support", "Written communication", "Inbox Management", "Calendar Management", "Scheduling"],
  tools: ["Google Workspace", "Google Calendar", "Google Sheets"],
  languages: ["English"],
  years_experience: 3,
  weekly_hours: 40,
  hourly_rate: 8,
  portfolio_url: "https://example.test/isolated-e2e-portfolio",
  availability_status: "available",
  directory_visible: false,
}, { onConflict: "user_id" });
if (vaError) throw new Error("Cannot prepare fictional VA profile: " + vaError.message);
const { error: approvedError } = await admin.from("va_vetting").upsert({
  va_id: seededUserIds.va,
  stage: "approved",
  recruiter_id: seededUserIds.recruiter,
  approved_at: new Date().toISOString(),
}, { onConflict: "va_id" });
if (approvedError) throw new Error("Cannot vet fictional VA: " + approvedError.message);
const { data: available, error: freshError } = await admin.from("va_profiles")
  .update({ availability_confirmed_at: new Date().toISOString() })
  .eq("user_id", seededUserIds.va)
  .select("availability_status,availability_confirmed_at")
  .single();
if (freshError || available?.availability_status !== "available" || !available.availability_confirmed_at) {
  throw new Error("Fictional VA availability confirmation failed: " + (freshError?.message || "not confirmed"));
}

// These fictional employer and proposal fixtures exercise the real browser
// approval / requested-changes actions against the isolated local database.
// Neither scenario triggers an outbound proposal send. No fixture points to
// a real customer or can be created on a non-loopback Supabase target.
const now = new Date();
const fixtures = {};
for (const scenario of ["approved", "changes", "pipeline"]) for (const attempt of [0, 1]) {
  const leadId = crypto.randomUUID();
  const proposalId = crypto.randomUUID();
  const token = crypto.randomUUID();
  const roleTitle = "E2E " + scenario + " " + attempt + " Administrative Virtual Assistant";
  const company = scenario === "approved" ? "E2E Acceptance Company"
    : scenario === "changes" ? "E2E Revision Company"
    : "E2E Hiring Pipeline Company";
  const { error: leadError } = await admin.from("lead_intake").insert({
    id: leadId,
    name: "E2E Client",
    email: "client.hiring-e2e@example.test",
    service: "Administrative Virtual Assistant",
    company,
    hours: "40",
    budget: "40000-50000 PHP",
    timezone: "Asia/Manila",
    message: "Local-only hiring exercise: inbox ownership, scheduling and client follow-up.",
    source_page: "e2e_local_only",
    status: "new",
    crm_stage: "qualified",
    client_id: seededUserIds.client,
    owner_id: seededUserIds.recruiter,
    lead_type: "client_hiring",
    discovery_scheduled_at: new Date(now.getTime() - (60 + ({ approved: 0, changes: 2, pipeline: 4 }[scenario]) * 30 + attempt * 30) * 60 * 1000).toISOString(),
    discovery_completed_at: now.toISOString(),
    discovery_outcome: "qualified",
    acknowledgement_sent_at: now.toISOString(),
  });
  if (leadError) throw new Error(`Cannot seed ${scenario} hiring lead: ${leadError.message}`);

  const { error: proposalError } = await admin.from("lead_proposals").insert({
    id: proposalId,
    lead_id: leadId,
    public_token: token,
    status: "sent",
    // One employer can hire for multiple roles, but cannot create two OPEN
    // roles with the same normalized title (database uniqueness guard).
    role_title: roleTitle,
    summary: "Local-only sample proposal to test recruiter and client workflow handoff.",
    service_model: "curated_placement",
    hours_per_week: 40,
    placement_fee: 1000,
    // The client shortlist release requires the public minimum $6/hr.
    va_rate_min: 6,
    va_rate_max: 8,
    start_timing: "Within two weeks",
    salary_min: 40000,
    salary_max: 50000,
    salary_currency: "PHP",
    responsibilities: ["Inbox ownership", "Scheduling"],
    required_skills: ["Administrative support", "Written communication"],
    required_tools: ["Google Workspace"],
    sent_at: now.toISOString(),
    expires_at: new Date(now.getTime() + 7 * 86400000).toISOString(),
    send_count: 1,
  });
  if (proposalError) throw new Error(`Cannot seed ${scenario} proposal: ${proposalError.message}`);
  fixtures[`${scenario}${attempt}`] = { leadId, proposalId, token, company, roleTitle };
}

// Gitignored local-only fixture UUIDs and proposal tokens: never commit these artifacts.
await writeFile(".e2e-hiring-fixtures.json", JSON.stringify(fixtures), { mode: 0o600 });
console.log("seeded:local-hiring-proposals:6");
