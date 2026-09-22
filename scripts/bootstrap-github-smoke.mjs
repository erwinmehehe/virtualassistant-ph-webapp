import fs from "node:fs";

const audience = "virtualassistant-smoke";
const baseUrl = String(process.env.SMOKE_BASE_URL || process.env.VISUAL_BASE_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
const requestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
const requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
const githubEnv = process.env.GITHUB_ENV;

if (!requestUrl || !requestToken || !githubEnv) {
  throw new Error("GitHub OIDC environment is unavailable. Ensure the workflow has id-token: write permission.");
}

const oidcUrl = new URL(requestUrl);
oidcUrl.searchParams.set("audience", audience);
const oidcResponse = await fetch(oidcUrl, {
  headers: { authorization: `Bearer ${requestToken}` },
});
const oidcPayload = await oidcResponse.json().catch(() => ({}));
if (!oidcResponse.ok || !oidcPayload.value) {
  throw new Error(`Could not obtain GitHub OIDC token (HTTP ${oidcResponse.status}).`);
}

const bootstrapResponse = await fetch(`${baseUrl}/api/internal/github-smoke-auth`, {
  method: "POST",
  headers: {
    authorization: `Bearer ${oidcPayload.value}`,
    "content-type": "application/json",
  },
});
const bootstrap = await bootstrapResponse.json().catch(() => ({}));
if (!bootstrapResponse.ok || !bootstrap.ok) {
  throw new Error(`Smoke bootstrap failed (HTTP ${bootstrapResponse.status}): ${bootstrap.error || "unknown error"}`);
}

const values = {
  SMOKE_SUPABASE_URL: bootstrap.supabase_url,
  SMOKE_SUPABASE_ANON_KEY: bootstrap.supabase_key,
  SMOKE_ADMIN_TOKEN_HASH: bootstrap.token_hashes?.admin,
  SMOKE_RECRUITER_TOKEN_HASH: bootstrap.token_hashes?.recruiter,
  SMOKE_CLIENT_TOKEN_HASH: bootstrap.token_hashes?.client,
  SMOKE_VA_TOKEN_HASH: bootstrap.token_hashes?.va,
  SMOKE_JOB_ID: bootstrap.smoke_job_id,
};

for (const [key, value] of Object.entries(values)) {
  if (!value) throw new Error(`Smoke bootstrap did not return ${key}.`);
  if (key.includes("TOKEN_HASH")) process.stdout.write(`::add-mask::${value}\n`);
  fs.appendFileSync(githubEnv, `${key}=${value}\n`);
}

console.log("✓ passwordless smoke identities and protected fixture are ready");
