import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const GITHUB_OIDC_ISSUER = "https://token.actions.githubusercontent.com";
const GITHUB_OIDC_AUDIENCE = "virtualassistant-smoke";
const REPOSITORY = "erwinmehehe/virtualassistant-ph-webapp";
const MAIN_REF = "refs/heads/main";
const SMOKE_JOB_ID = "00000000-0000-4000-8000-000000000240";
const SMOKE_TITLE = "[SMOKE QA] Admin Support";
const ALLOWED_WORKFLOWS = new Set([
  `${REPOSITORY}/.github/workflows/dashboard-visual.yml@${MAIN_REF}`,
  `${REPOSITORY}/.github/workflows/authenticated-production-smoke.yml@${MAIN_REF}`,
]);

const SMOKE_USERS = [
  { key: "admin", email: "smoke-admin@virtualassistant.com.ph", role: "admin", fullName: "Smoke Admin" },
  { key: "recruiter", email: "smoke-recruiter@virtualassistant.com.ph", role: "recruiter", fullName: "Smoke Recruiter" },
  { key: "client", email: "smoke-client@virtualassistant.com.ph", role: "client", fullName: "Smoke Client" },
  { key: "va", email: "smoke-va@virtualassistant.com.ph", role: "va", fullName: "Smoke VA One", vaIndex: 1 },
  { key: "va2", email: "smoke-va-2@virtualassistant.com.ph", role: "va", fullName: "Smoke VA Two", vaIndex: 2 },
  { key: "va3", email: "smoke-va-3@virtualassistant.com.ph", role: "va", fullName: "Smoke VA Three", vaIndex: 3 },
] as const;

type GithubOidcPayload = {
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iss?: string;
  repository?: string;
  ref?: string;
  workflow_ref?: string;
  event_name?: string;
};

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store, private",
      pragma: "no-cache",
    },
  });
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(normalized + padding, "base64");
}

function audienceMatches(aud: string | string[] | undefined) {
  return Array.isArray(aud) ? aud.includes(GITHUB_OIDC_AUDIENCE) : aud === GITHUB_OIDC_AUDIENCE;
}

async function verifyGithubOidc(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid GitHub OIDC token.");

  const header = JSON.parse(decodeBase64Url(parts[0]).toString("utf8")) as { kid?: string; alg?: string };
  const payload = JSON.parse(decodeBase64Url(parts[1]).toString("utf8")) as GithubOidcPayload;
  if (!header.kid || header.alg !== "RS256") throw new Error("Unexpected GitHub OIDC signing algorithm.");

  const discovery = await fetch(`${GITHUB_OIDC_ISSUER}/.well-known/openid-configuration`, {
    cache: "no-store",
  });
  if (!discovery.ok) throw new Error("Could not load GitHub OIDC discovery.");
  const discoveryData = (await discovery.json()) as { jwks_uri?: string };
  if (!discoveryData.jwks_uri) throw new Error("GitHub OIDC JWKS URI is unavailable.");

  const jwksResponse = await fetch(discoveryData.jwks_uri, { cache: "no-store" });
  if (!jwksResponse.ok) throw new Error("Could not load GitHub OIDC keys.");
  const jwks = (await jwksResponse.json()) as { keys?: Array<JsonWebKey & { kid?: string }> };
  const jwk = jwks.keys?.find((key) => key.kid === header.kid);
  if (!jwk) throw new Error("GitHub OIDC signing key was not found.");

  const publicKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    publicKey,
    decodeBase64Url(parts[2]),
    Buffer.from(`${parts[0]}.${parts[1]}`),
  );
  if (!valid) throw new Error("GitHub OIDC signature verification failed.");

  const now = Math.floor(Date.now() / 1000);
  if (payload.iss !== GITHUB_OIDC_ISSUER) throw new Error("Unexpected GitHub OIDC issuer.");
  if (!audienceMatches(payload.aud)) throw new Error("Unexpected GitHub OIDC audience.");
  if (!payload.exp || payload.exp < now - 30) throw new Error("GitHub OIDC token has expired.");
  if (payload.nbf && payload.nbf > now + 30) throw new Error("GitHub OIDC token is not active yet.");
  if (payload.repository !== REPOSITORY) throw new Error("Untrusted GitHub repository.");
  if (payload.ref !== MAIN_REF) throw new Error("Smoke bootstrap is main-only.");
  if (!payload.workflow_ref || !ALLOWED_WORKFLOWS.has(payload.workflow_ref)) throw new Error("Untrusted GitHub workflow.");
  if (!["push", "workflow_dispatch"].includes(String(payload.event_name || ""))) throw new Error("Untrusted GitHub event.");
}

async function existingUsersByEmail(admin: ReturnType<typeof createAdminClient>) {
  const users = new Map<string, any>();
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const user of data.users) {
      const email = String(user.email || "").toLowerCase();
      if (email.startsWith("smoke-") && email.endsWith("@virtualassistant.com.ph")) users.set(email, user);
    }
    if (data.users.length < 1000) break;
  }
  return users;
}

async function provisionSmokeFixture() {
  const admin = createAdminClient();
  const usersByEmail = await existingUsersByEmail(admin);
  const now = new Date().toISOString();
  const ids: Record<string, string> = {};

  for (const spec of SMOKE_USERS) {
    let user = usersByEmail.get(spec.email);
    if (!user) {
      const created = await admin.auth.admin.createUser({
        email: spec.email,
        email_confirm: true,
        user_metadata: { full_name: spec.fullName },
        app_metadata: { role: spec.role, smoke_test: true },
      });
      if (created.error || !created.data.user) throw created.error || new Error(`Could not create ${spec.email}.`);
      user = created.data.user;
    } else {
      const updated = await admin.auth.admin.updateUserById(user.id, {
        email_confirm: true,
        user_metadata: { ...(user.user_metadata || {}), full_name: spec.fullName },
        app_metadata: { ...(user.app_metadata || {}), role: spec.role, smoke_test: true },
      });
      if (updated.error || !updated.data.user) throw updated.error || new Error(`Could not update ${spec.email}.`);
      user = updated.data.user;
    }

    ids[spec.key] = user.id;

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: user.id,
        role: spec.role,
        full_name: spec.fullName,
        email_verified: true,
        account_status: "active",
      },
      { onConflict: "id" },
    );
    if (profileError) throw profileError;

    if (spec.role === "client") {
      const { error } = await admin.from("client_profiles").upsert(
        {
          user_id: user.id,
          company_name: "Smoke Test Company",
          industry: "QA / Testing",
          timezone: "Asia/Manila",
          team_size: "1-10",
          hiring_needs: "Automated production smoke testing only.",
          budget_min: 800,
          budget_max: 1600,
          onboarding_completed_at: now,
          public_company_visible: false,
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
    }

    if (spec.role === "va" && "vaIndex" in spec) {
      const { error: vaError } = await admin.from("va_profiles").upsert(
        {
          user_id: user.id,
          slug: `smoke-va-${spec.vaIndex}`,
          headline: "QA Smoke Test Virtual Assistant",
          bio: "Dedicated non-public automated QA profile. Not a real candidate.",
          primary_category: "Administrative Support",
          categories: ["Administrative Support"],
          skills: ["Data Entry", "Email Management", "Calendar Management"],
          tools: ["Google Workspace", "Slack"],
          industries: ["QA / Testing"],
          languages: ["English"],
          years_experience: 3,
          weekly_hours: 40,
          schedule: "Flexible",
          overlap_hours: 4,
          hourly_rate: 8,
          directory_visible: false,
          availability_status: "available",
          availability_confirmed_at: now,
          availability_last_prompted_at: null,
        },
        { onConflict: "user_id" },
      );
      if (vaError) throw vaError;

      const { error: vettingError } = await admin.from("va_vetting").upsert(
        {
          va_id: user.id,
          stage: "approved",
          recruiter_id: ids.recruiter || null,
          approved_at: now,
          profile_reviewed_at: now,
          resume_reviewed_at: now,
          updated_at: now,
        },
        { onConflict: "va_id" },
      );
      if (vettingError) throw vettingError;
    }
  }

  const smokeVaIds = [ids.va, ids.va2, ids.va3].filter(Boolean);
  const { error: assignmentError } = await admin
    .from("va_vetting")
    .update({ recruiter_id: ids.recruiter, updated_at: now })
    .in("va_id", smokeVaIds);
  if (assignmentError) throw assignmentError;

  const { error: jobError } = await admin.from("jobs").upsert(
    {
      id: SMOKE_JOB_ID,
      client_id: ids.client,
      recruiter_id: ids.recruiter,
      title: SMOKE_TITLE,
      company_name: "Smoke Test Company",
      summary: "Internal automated QA role for validating recruiter and client hiring workflows.",
      description: "Automated QA only. This role must remain blocked from the public marketplace.",
      responsibilities: ["Manage a shared inbox", "Update calendar records", "Maintain QA task records"],
      required_skills: ["Email Management", "Calendar Management"],
      required_tools: ["Google Workspace", "Slack"],
      categories: ["Administrative Support"],
      hours_per_week: 20,
      min_hourly_rate: 8,
      max_hourly_rate: 10,
      timezone: "Asia/Manila",
      overlap_hours: 4,
      schedule_notes: "QA-only schedule.",
      onboarding_plan: "QA-only onboarding.",
      direct_feedback: true,
      engagement_length: "Ongoing",
      start_timing: "Within 2 weeks",
      service_model: "curated_placement",
      status: "published",
      moderation_status: "blocked",
      rejection_note: "Automated QA role. Hidden from public listings.",
      published_at: now,
      closed_at: null,
      experience_level: "Intermediate",
      must_have_skills: ["Email Management", "Calendar Management"],
      nice_to_have_skills: ["Data Entry"],
      must_have_tools: ["Google Workspace"],
      required_industries: [],
      minimum_years_experience: 1,
      communication_requirement: "Clear written English",
      dealbreakers: [],
      hiring_stage: "internal_review",
      hiring_stage_entered_at: now,
    },
    { onConflict: "id" },
  );
  if (jobError) throw jobError;

  const { error: commercialError } = await admin.from("job_commercials").upsert(
    {
      job_id: SMOKE_JOB_ID,
      service_model: "curated_placement",
      placement_fee: 0,
      commercial_status: "accepted",
      notes: "Automated QA only. No billable transaction.",
      updated_at: now,
    },
    { onConflict: "job_id" },
  );
  if (commercialError) throw commercialError;

  const { error: accessError } = await admin.from("job_candidate_access").upsert(
    {
      job_id: SMOKE_JOB_ID,
      access_status: "comped",
      access_fee: 0,
      currency: "USD",
      unlocked_at: now,
      unlocked_by: ids.admin,
      notes: "Automated QA only.",
      updated_at: now,
    },
    { onConflict: "job_id" },
  );
  if (accessError) throw accessError;

  const { error: interviewResetError } = await admin.from("candidate_interviews").delete().eq("job_id", SMOKE_JOB_ID);
  if (interviewResetError) throw interviewResetError;
  const { error: shortlistResetError } = await admin.from("job_shortlist_candidates").delete().eq("job_id", SMOKE_JOB_ID);
  if (shortlistResetError) throw shortlistResetError;
  await admin.from("recruiter_activity").delete().eq("subject_type", "job").eq("subject_id", SMOKE_JOB_ID);

  const tokenHashes: Record<string, string> = {};
  for (const spec of SMOKE_USERS.filter((entry) => ["admin", "recruiter", "client", "va"].includes(entry.key))) {
    const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: spec.email });
    if (error) throw error;
    const tokenHash = data.properties?.hashed_token;
    if (!tokenHash) throw new Error(`No passwordless token was generated for ${spec.key}.`);
    tokenHashes[spec.key] = tokenHash;
  }

  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    tokenHashes,
  };
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") || "";
    if (!authorization.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    await verifyGithubOidc(authorization.slice(7));
    const fixture = await provisionSmokeFixture();
    if (!fixture.supabaseUrl || !fixture.supabaseKey) throw new Error("Public Supabase configuration is unavailable.");

    return json({
      ok: true,
      supabase_url: fixture.supabaseUrl,
      supabase_key: fixture.supabaseKey,
      smoke_job_id: SMOKE_JOB_ID,
      token_hashes: fixture.tokenHashes,
    });
  } catch (error) {
    console.error("[github-smoke-auth]", error instanceof Error ? error.message : error);
    return json({ error: "Smoke bootstrap rejected." }, 403);
  }
}
