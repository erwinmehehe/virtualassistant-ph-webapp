const baseUrl = String(process.env.SMOKE_BASE_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
const supabaseUrl = String(process.env.SMOKE_SUPABASE_URL || "").replace(/\/$/, "");
const anonKey = String(process.env.SMOKE_SUPABASE_ANON_KEY || "");

if (!supabaseUrl || !anonKey) {
  throw new Error("Set SMOKE_SUPABASE_URL and SMOKE_SUPABASE_ANON_KEY before running authenticated production smoke tests.");
}

const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
if (!projectRef) throw new Error("Could not derive the Supabase project ref from SMOKE_SUPABASE_URL.");

const roles = [
  {
    role: "client",
    email: process.env.SMOKE_CLIENT_EMAIL,
    password: process.env.SMOKE_CLIENT_PASSWORD,
    path: "/workspace/client",
    marker: "Your hiring progress",
    forbiddenPath: "/workspace/recruiter"
  },
  {
    role: "va",
    email: process.env.SMOKE_VA_EMAIL,
    password: process.env.SMOKE_VA_PASSWORD,
    path: "/workspace/va",
    marker: "What should you do next?",
    forbiddenPath: "/workspace/admin"
  },
  {
    role: "recruiter",
    email: process.env.SMOKE_RECRUITER_EMAIL,
    password: process.env.SMOKE_RECRUITER_PASSWORD,
    path: "/workspace/recruiter",
    marker: "Today’s work",
    forbiddenPath: "/workspace/admin"
  },
  {
    role: "admin",
    email: process.env.SMOKE_ADMIN_EMAIL,
    password: process.env.SMOKE_ADMIN_PASSWORD,
    path: "/workspace/admin",
    marker: "Marketplace admin",
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

async function signIn(email, password) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token || !data.refresh_token) {
    const reason = data?.msg || data?.message || data?.error_description || `HTTP ${response.status}`;
    throw new Error(`Supabase sign-in failed: ${reason}`);
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

async function smokeRole(config) {
  assert(config.email && config.password, `Missing smoke credentials for ${config.role}.`);
  const session = await signIn(config.email, config.password);
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
}

await assertPublicBaseline();
for (const config of roles) await smokeRole(config);
console.log(`✓ authenticated production smoke passed for ${roles.length} roles at ${baseUrl}`);
