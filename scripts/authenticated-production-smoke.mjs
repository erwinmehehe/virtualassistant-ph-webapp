const baseUrl = String(process.env.SMOKE_BASE_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
const supabaseUrl = String(process.env.SMOKE_SUPABASE_URL || "").replace(/\/$/, "");
const anonKey = String(process.env.SMOKE_SUPABASE_ANON_KEY || "");
const smokeJobId = String(process.env.SMOKE_JOB_ID || "").trim();

if (!supabaseUrl || !anonKey) {
  throw new Error("Set SMOKE_SUPABASE_URL and SMOKE_SUPABASE_ANON_KEY before running authenticated production smoke tests.");
}

const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
if (!projectRef) throw new Error("Could not derive the Supabase project ref from SMOKE_SUPABASE_URL.");

const roles = [
  {
    role: "client",
    tokenHash: process.env.SMOKE_CLIENT_TOKEN_HASH,
    email: process.env.SMOKE_CLIENT_EMAIL,
    password: process.env.SMOKE_CLIENT_PASSWORD,
    path: "/workspace/client",
    marker: "Your hiring progress",
    forbiddenPath: "/workspace/recruiter"
  },
  {
    role: "va",
    tokenHash: process.env.SMOKE_VA_TOKEN_HASH,
    email: process.env.SMOKE_VA_EMAIL,
    password: process.env.SMOKE_VA_PASSWORD,
    path: "/workspace/va",
    marker: "What should you do next?",
    forbiddenPath: "/workspace/admin"
  },
  {
    role: "recruiter",
    tokenHash: process.env.SMOKE_RECRUITER_TOKEN_HASH,
    email: process.env.SMOKE_RECRUITER_EMAIL,
    password: process.env.SMOKE_RECRUITER_PASSWORD,
    path: "/workspace/recruiter",
    marker: "Today’s work",
    forbiddenPath: "/workspace/admin"
  },
  {
    role: "admin",
    tokenHash: process.env.SMOKE_ADMIN_TOKEN_HASH,
    email: process.env.SMOKE_ADMIN_EMAIL,
    password: process.env.SMOKE_ADMIN_PASSWORD,
    path: "/workspace/admin/today",
    marker: "Owner Command Center",
    forbiddenPath: "/workspace/client"
  }
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sessionCookieHeader(session) {
  const normalized = {
    ...session,
    expires_at: session.expires_at || Math.floor(Date.now() / 1000) + Number(session.expires_in || 3600)
  };
  const encoded = `base64-${Buffer.from(JSON.stringify(normalized), "utf8").toString("base64url")}`;
  const key = `sb-${projectRef}-auth-token`;
  const maxChunkSize = 3180;
  if (encoded.length <= maxChunkSize) return `${key}=${encoded}`;
  const chunks = [];
  for (let offset = 0, index = 0; offset < encoded.length; offset += maxChunkSize, index += 1) {
    chunks.push(`${key}.${index}=${encoded.slice(offset, offset + maxChunkSize)}`);
  }
  return chunks.join("; ");
}

async function signIn(config) {
  const usingTokenHash = Boolean(config.tokenHash);
  assert(usingTokenHash || (config.email && config.password), `Missing smoke session for ${config.role}.`);

  const endpoint = usingTokenHash ? `${supabaseUrl}/auth/v1/verify` : `${supabaseUrl}/auth/v1/token?grant_type=password`;
  const body = usingTokenHash
    ? { token_hash: config.tokenHash, type: "email" }
    : { email: config.email, password: config.password };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: anonKey,
      ...(anonKey.startsWith("eyJ") ? { authorization: `Bearer ${anonKey}` } : {}),
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token || !data.refresh_token) {
    const reason = data?.msg || data?.message || data?.error_description || `HTTP ${response.status}`;
    throw new Error(`Supabase ${usingTokenHash ? "passwordless" : "password"} sign-in failed for ${config.role}: ${reason}`);
  }
  return data;
}

async function appRequest(path, cookie) {
  return fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    headers: {
      cookie,
      "cache-control": "no-store",
      "user-agent": "VirtualAssistant-P0-Smoke/1.0"
    }
  });
}

async function assertPublicBaseline() {
  const publicResponse = await fetch(`${baseUrl}/`, { redirect: "manual", headers: { "cache-control": "no-store" } });
  assert(publicResponse.ok, `Public homepage returned ${publicResponse.status}.`);

  const protectedResponse = await fetch(`${baseUrl}/workspace/client`, { redirect: "manual", headers: { "cache-control": "no-store" } });
  assert([302, 303, 307, 308].includes(protectedResponse.status), `Logged-out client workspace should redirect, got ${protectedResponse.status}.`);
  const location = protectedResponse.headers.get("location") || "";
  assert(location.includes("/auth/login"), `Logged-out client workspace redirected somewhere unexpected: ${location || "<missing>"}.`);
  console.log("✓ public baseline and logged-out protection");
}

async function smokeClientHandoff(role, cookie) {
  if (role === "recruiter") {
    if (smokeJobId) {
      const detail = await appRequest(`/workspace/recruiter/roles/${smokeJobId}`, cookie);
      const detailHtml = await detail.text();
      assert(detail.status === 200, `Protected smoke recruiter role returned ${detail.status}.`);
      assert(detailHtml.includes("Role Control Center"), "Smoke recruiter role is missing the Role Control Center.");
      assert(detailHtml.includes("[SMOKE QA] Admin Support"), "SMOKE_JOB_ID does not point to the protected smoke QA role.");
      assert(detailHtml.includes("Preview client view"), "Smoke recruiter role is missing the client preview control.");
      console.log("✓ recruiter: exact protected smoke role + client-preview handoff surface");
    } else {
      const board = await appRequest("/workspace/recruiter/roles", cookie);
      assert(board.status === 200, `Recruiter roles board returned ${board.status}.`);
      console.log("✓ recruiter: roles board (set SMOKE_JOB_ID to enable exact handoff checks)");
    }
  }

  if (role === "client") {
    const path = smokeJobId ? `/workspace/client/candidates?role=${encodeURIComponent(smokeJobId)}` : "/workspace/client/candidates";
    const hiringRoom = await appRequest(path, cookie);
    const hiringRoomHtml = await hiringRoom.text();
    assert(hiringRoom.status === 200, `Client Hiring Room returned ${hiringRoom.status}.`);
    assert(hiringRoomHtml.includes("Hiring Room"), "Client Hiring Room marker is missing.");
    if (smokeJobId) assert(hiringRoomHtml.includes("[SMOKE QA] Admin Support"), "Client Hiring Room did not resolve the protected smoke role.");
    for (const forbidden of ["Open recruiter scorecard", "match-meter", "% confidence"]) {
      assert(!hiringRoomHtml.includes(forbidden), `Client Hiring Room leaked recruiter-only UI: ${forbidden}`);
    }
    console.log("✓ client: Hiring Room hides recruiter-only scoring UI");
  }
}

async function smokeRole(config) {
  assert(config.tokenHash || (config.email && config.password), `Missing smoke session for ${config.role}.`);
  const session = await signIn(config);
  const cookie = sessionCookieHeader(session);

  const workspace = await appRequest(config.path, cookie);
  const html = await workspace.text();
  assert(workspace.status === 200, `${config.role} workspace returned ${workspace.status} instead of 200.`);
  assert(html.includes(config.marker), `${config.role} workspace did not contain the expected marker: ${config.marker}`);
  assert(!html.includes("Welcome back"), `${config.role} workspace rendered the login page instead of the authenticated dashboard.`);

  const forbidden = await appRequest(config.forbiddenPath, cookie);
  assert([302, 303, 307, 308].includes(forbidden.status), `${config.role} cross-role request should redirect, got ${forbidden.status}.`);
  const forbiddenLocation = forbidden.headers.get("location") || "";
  assert(
    forbiddenLocation.includes(config.path),
    `${config.role} cross-role request redirected to ${forbiddenLocation || "<missing>"} instead of its own workspace.`
  );

  console.log(`✓ ${config.role}: authenticated dashboard + cross-role guard`);
  await smokeClientHandoff(config.role, cookie);
}

await assertPublicBaseline();
for (const config of roles) await smokeRole(config);
console.log(`✓ authenticated production smoke passed for ${roles.length} roles at ${baseUrl}`);
