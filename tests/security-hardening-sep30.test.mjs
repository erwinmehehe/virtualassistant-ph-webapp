import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Data API defaults and intentionally server-only tables are locked down", async () => {
  const [defaults, pg17] = await Promise.all([
    read("supabase/migrations/20260930020201_harden_data_api_defaults_and_server_only_grants.sql"),
    read("supabase/migrations/20260930020252_remove_browser_maintenance_privileges.sql"),
  ]);

  assert.match(defaults, /alter default privileges[\s\S]*revoke select, insert, update, delete, truncate, references, trigger on tables from anon, authenticated/i);
  assert.match(defaults, /revoke execute on functions from public, anon, authenticated/i);
  assert.match(defaults, /revoke all on table[\s\S]*public\.crm_companies[\s\S]*public\.training_lesson_engagement[\s\S]*from anon, authenticated/i);
  assert.match(defaults, /as restrictive for all to anon, authenticated using \(false\) with check \(false\)/i);
  assert.match(pg17, /revoke maintain on tables from anon, authenticated/i);
  assert.match(pg17, /revoke truncate, references, trigger, maintain[\s\S]*from anon, authenticated/i);
});

test("cron secrets use timing-safe comparison", async () => {
  const [helper, maintenance, discovery, training] = await Promise.all([
    read("src/lib/http-security.ts"),
    read("src/app/api/cron/maintenance/route.ts"),
    read("src/app/api/cron/discovery-reminders/route.ts"),
    read("src/app/api/cron/va-training-announcement/route.ts"),
  ]);

  assert.match(helper, /timingSafeEqual/);
  assert.match(helper, /bearerTokenFromRequest/);
  for (const source of [maintenance, discovery, training]) {
    assert.match(source, /timingSafeSecretMatches/);
    assert.match(source, /bearerTokenFromRequest/);
  }
});

test("public event ingestion and payment/email webhooks have request body ceilings", async () => {
  const paths = [
    "src/app/api/analytics/route.ts",
    "src/app/api/errors/route.ts",
    "src/app/api/webhooks/stripe/route.ts",
    "src/app/api/webhooks/paymongo/route.ts",
    "src/app/api/webhooks/resend/route.ts",
  ];

  for (const path of paths) {
    const source = await read(path);
    assert.match(source, /readRequest(?:Json|Text)/, path);
  }

  const stripe = await read("src/app/api/webhooks/stripe/route.ts");
  assert.doesNotMatch(stripe, /Signature verification failed:"\s*\+/);
  assert.match(stripe, /status:\s*413/);
});

test("private resume and lead-document redirects cannot be cached or leak referrers", async () => {
  for (const path of [
    "src/app/api/admin/va-resume/[vaId]/route.ts",
    "src/app/api/recruiter/lead-attachment/[leadId]/route.ts",
    "src/app/api/resume/[applicationId]/route.ts",
  ]) {
    const source = await read(path);
    assert.match(source, /Cache-Control", "private, no-store, max-age=0"/, path);
    assert.match(source, /Referrer-Policy", "no-referrer"/, path);
  }
});

test("global responses include browser isolation headers", async () => {
  const config = await read("next.config.ts");
  assert.match(config, /Cross-Origin-Opener-Policy", value: "same-origin"/);
  assert.match(config, /Origin-Agent-Cluster", value: "\?1"/);
  assert.match(config, /X-DNS-Prefetch-Control", value: "off"/);
  assert.match(config, /X-Permitted-Cross-Domain-Policies", value: "none"/);
  assert.match(config, /source: "\/workspace\/:path\*"[\s\S]*Cache-Control", value: "private, no-store, max-age=0"/);
});


test("public mutation endpoints reject abuse and bound request sizes", async () => {
  const [helper, analytics, errors, proposals, leads] = await Promise.all([
    read("src/lib/http-security.ts"),
    read("src/app/api/analytics/route.ts"),
    read("src/app/api/errors/route.ts"),
    read("src/app/api/proposals/view/route.ts"),
    read("src/app/api/leads/route.ts"),
  ]);

  assert.match(helper, /isExplicitCrossSiteRequest/);
  for (const source of [analytics, errors, proposals]) {
    assert.match(source, /isExplicitCrossSiteRequest/);
  }
  assert.match(proposals, /readRequestJson<any>\(request, 4_096\)/);
  assert.match(proposals, /enforceEmailAndIpRateLimit\("proposal_view"/);
  assert.match(leads, /readRequestJson\(request, 65_536\)/);
  assert.doesNotMatch(leads, /details:\s*parsed\.error\.flatten/);
  assert.doesNotMatch(leads, /error:\s*error\.message/);
});

test("capability fallback is domain-separated and Turnstile verifier stays server-only", async () => {
  const [capability, turnstile] = await Promise.all([
    read("src/lib/public-capability.ts"),
    read("src/lib/turnstile.ts"),
  ]);

  assert.match(capability, /virtualassistant\.com\.ph:public-capability:v1/);
  assert.match(capability, /CAPABILITY_SIGNING_SECRET/);
  assert.match(turnstile, /^import "server-only";/);
});

test("new-device sign-ins create an account security notification", async () => {
  const source = await read("src/lib/account-security.ts");
  assert.match(source, /New sign-in detected/);
  assert.match(source, /Review your active sessions/);
  assert.match(source, /loginHistory\.length > 0/);
});

test("security.txt exposes a responsible disclosure contact", async () => {
  const source = await read("public/.well-known/security.txt");
  assert.match(source, /^Contact: https:\/\/virtualassistant\.com\.ph\/contact/m);
  assert.match(source, /^Canonical: https:\/\/virtualassistant\.com\.ph\/\.well-known\/security\.txt/m);
});
