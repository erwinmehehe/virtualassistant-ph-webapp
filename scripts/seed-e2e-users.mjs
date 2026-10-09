import { createClient } from "@supabase/supabase-js";
import { writeFile } from "node:fs/promises";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.E2E_PASSWORD || "E2e-Only!Pass12345";

if (!url || !serviceKey) throw new Error("Local Supabase URL and service-role key are required.");

// This fixture runner writes hiring records and uses a service-role key.
// Never allow a production or remote target, even if someone copies CI
// environment variables into a local shell by mistake.
const target = new URL(url);
if (!["localhost", "127.0.0.1", "::1"].includes(target.hostname)) {
  throw new Error("E2E seed requires a loopback-only Supabase URL. Production seeding is forbidden.");
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const accounts = [
  { email: "recruiter.e2e@example.test", role: "recruiter", fullName: "E2E Recruiter" },
  { email: "client.e2e@example.test", role: "client", fullName: "E2E Client" },
  { email: "va.e2e@example.test", role: "va", fullName: "E2E VA" },
  { email: "admin.e2e@example.test", role: "admin", fullName: "E2E Admin" },
];

const seededUserIds = {};
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
      headline: "E2E Administrative Virtual Assistant",
      bio: "I manage administrative support, inboxes, client follow-ups, documentation, and appointments. I am comfortable using Google Workspace and coordinating schedules across teams.",
      primary_category: "Administrative Support",
      categories: ["Administrative Support"],
      skills: ["Administrative support", "Written communication", "Inbox Management", "Calendar Management", "Scheduling"],
      tools: ["Google Workspace", "Google Calendar", "Google Sheets"],
      languages: ["English"],
      years_experience: 3,
      weekly_hours: 40,
      hourly_rate: 8,
      portfolio_url: "https://example.test/e2e-portfolio",
      availability_status: "available",
      availability_confirmed_at: new Date().toISOString(),
      directory_visible: false,
    }, { onConflict: "user_id" });
    if (error) throw error;
    // Full hiring tests require a genuinely approved, sufficiently complete
    // local-only VA. The database enforces the 80% approval floor.
    const { error: vettingError } = await admin.from("va_vetting").upsert({
      va_id: user.id,
      stage: "approved",
      recruiter_id: seededUserIds.recruiter,
      approved_at: new Date().toISOString(),
    }, { onConflict: "va_id" });
    if (vettingError) throw new Error(`E2E VA approval guard failed: ${vettingError.message}`);

    // A BEFORE UPDATE trigger correctly invalidates availability confirmation
    // if the update changes availability, weekly hours, schedule, or rate.
    // The bootstrap may already have created this profile. Confirm *after*
    // the complete profile upsert so this test VA is genuinely client-ready.
    const { data: confirmedVa, error: confirmError } = await admin
      .from("va_profiles")
      .update({ availability_confirmed_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .select("user_id,availability_status,availability_confirmed_at")
      .single();
    if (confirmError || confirmedVa?.availability_status !== "available" ||
        !confirmedVa.availability_confirmed_at) {
      throw new Error(`Local E2E VA availability confirmation failed: ${confirmError?.message || "missing fresh confirmation"}`);
    }
  }

  seededUserIds[account.role] = user.id;
  console.log(`seeded:${account.role}:${user.id}`);
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
  const company = scenario === "approved" ? "E2E Acceptance Company"
    : scenario === "changes" ? "E2E Revision Company"
    : "E2E Hiring Pipeline Company";
  const { error: leadError } = await admin.from("lead_intake").insert({
    id: leadId,
    name: "E2E Client",
    email: "client.e2e@example.test",
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
    role_title: scenario === "pipeline"
      ? (attempt === 0 ? "E2E Administrative Support Virtual Assistant" : "E2E Administrative Coordinator Virtual Assistant")
      : "E2E Administrative Virtual Assistant",
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
  fixtures[`${scenario}${attempt}`] = { leadId, proposalId, token, company };
}

// Gitignored local-only fixture IDs, not credentials or production data.
await writeFile(".e2e-hiring-fixtures.json", JSON.stringify(fixtures), { mode: 0o600 });
console.log("seeded:local-hiring-proposals:6");
