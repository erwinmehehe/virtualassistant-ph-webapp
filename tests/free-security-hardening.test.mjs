import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("public forms and auth are throttled by both email and request IP", async () => {
  const [limiter, leads, auth] = await Promise.all([
    read("src/lib/rate-limit.ts"),
    read("src/app/actions/leads.ts"),
    read("src/app/actions/auth.ts"),
  ]);

  assert.match(limiter, /from "next\/headers"/);
  assert.match(limiter, /x-forwarded-for/);
  assert.match(limiter, /x-real-ip/);
  assert.match(limiter, /export async function enforceEmailAndIpRateLimit/);
  assert.match(limiter, /\`\$\{actionKey\}:email\`/);
  assert.match(limiter, /\`\$\{actionKey\}:ip\`/);

  for (const key of [
    "public_service_match",
    "public_industry_match",
    "public_role_brief",
    "public_contact",
    "public_discovery_booking",
  ]) {
    assert.match(leads, new RegExp(`enforceEmailAndIpRateLimit\\("${key}"`));
  }

  for (const key of ["auth_login", "auth_join", "password_reset"]) {
    assert.match(auth, new RegExp(`limitOrRedirect\\("${key}"`));
  }
  assert.match(auth, /enforceEmailAndIpRateLimit\(actionKey, subject, maxAttempts, maxIpAttempts, windowMinutes\)/);
});

test("new passwords are checked against HIBP using k-anonymity without sending the password", async () => {
  const [helper, auth, account] = await Promise.all([
    read("src/lib/pwned-password.ts"),
    read("src/app/actions/auth.ts"),
    read("src/app/actions/account-security.ts"),
  ]);

  assert.match(helper, /createHash\("sha1"\)/);
  assert.match(helper, /sha1\.slice\(0, 5\)/);
  assert.match(helper, /sha1\.slice\(5\)/);
  assert.match(helper, /https:\/\/api\.pwnedpasswords\.com\/range\/\$\{prefix\}/);
  assert.match(helper, /"Add-Padding": "true"/);
  assert.match(helper, /AbortSignal\.timeout\(2500\)/);
  assert.doesNotMatch(helper, /fetch\([^\n]*password/);

  assert.match(auth, /isKnownCompromisedPassword\(parsed\.data\.password\)/);
  assert.match(auth, /isKnownCompromisedPassword\(password\)/);
  assert.match(account, /isKnownCompromisedPassword\(newPassword\)/);
  assert.match(auth, /known data breaches/);
  assert.match(account, /known%20data%20breaches/);
});

test("expected recruiter guardrails stay user-facing instead of polluting error monitoring", async () => {
  const [matching, detail, list] = await Promise.all([
    read("src/app/actions/matching.ts"),
    read("src/app/workspace/recruiter/roles/[id]/page.tsx"),
    read("src/app/workspace/recruiter/roles/page.tsx"),
  ]);

  const staleStart = matching.indexOf('if (message.includes("VA availability is stale"))');
  assert.notEqual(staleStart, -1);
  const staleBlock = matching.slice(staleStart, staleStart + 500);
  assert.match(staleBlock, /console\.info/);
  assert.doesNotMatch(staleBlock, /console\.error/);

  assert.match(detail, /redirect\(\`\/workspace\/recruiter\/roles\?error=/);
  assert.match(detail, /This role is assigned to another recruiter/);
  assert.match(list, /params\.error \? <div className="alert" role="alert">\{params\.error\}<\/div>/);
});

test("VA application entry points require moderated public jobs and keep private snapshot fields out", async () => {
  const [applications, interest] = await Promise.all([
    read("src/app/actions/applications.ts"),
    read("src/app/actions/va-interest.ts"),
  ]);

  for (const source of [applications, interest]) {
    assert.match(source, /\.eq\("status",\s*"published"\)/);
    assert.match(source, /\.eq\("moderation_status",\s*"clear"\)/);
    assert.match(source, /\.not\("client_id",\s*"is",\s*null\)/);
    assert.doesNotMatch(source, /resume_path:\s*va\.resume_path/);
    assert.doesNotMatch(source, /linkedin_url:\s*va\.linkedin_url/);
    assert.doesNotMatch(source, /portfolio_url:\s*va\.portfolio_url/);
  }
});

test("Turnstile remains optional but production key names are documented", async () => {
  const [env, turnstile] = await Promise.all([
    read(".env.example"),
    read("src/lib/turnstile.ts"),
  ]);

  assert.match(env, /^NEXT_PUBLIC_TURNSTILE_SITE_KEY=$/m);
  assert.match(env, /^TURNSTILE_SECRET_KEY=$/m);
  assert.match(turnstile, /if \(!secret\) return true/);
  assert.match(turnstile, /if \(!siteKey\)/);
});
