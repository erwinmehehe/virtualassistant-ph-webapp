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

test("private resume and lead-document downloads are forced, no-store, and referrer-safe", async () => {
  const [helper, ...routes] = await Promise.all([
    read("src/lib/private-storage-download.ts"),
    read("src/app/api/admin/va-resume/[vaId]/route.ts"),
    read("src/app/api/recruiter/lead-attachment/[leadId]/route.ts"),
    read("src/app/api/resume/[applicationId]/route.ts"),
  ]);

  assert.match(helper, /Content-Disposition/);
  assert.match(helper, /attachment;/);
  assert.match(helper, /Cache-Control": "private, no-store, max-age=0"/);
  assert.match(helper, /Referrer-Policy": "no-referrer"/);
  assert.match(helper, /X-Content-Type-Options": "nosniff"/);

  for (const source of routes) {
    assert.match(source, /privateStorageDownloadResponse/);
    assert.doesNotMatch(source, /createSignedUrl/);
    assert.doesNotMatch(source, /NextResponse\.redirect/);
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


test("Turnstile fails closed on partial configuration and binds tokens to sensitive auth actions", async () => {
  const [turnstile, widget, auth, resend, login, join, forgot] = await Promise.all([
    read("src/lib/turnstile.ts"),
    read("src/components/turnstile-widget.tsx"),
    read("src/app/actions/auth.ts"),
    read("src/app/actions/resend-confirmation.ts"),
    read("src/app/auth/login/page.tsx"),
    read("src/components/join-account-form.tsx"),
    read("src/app/auth/forgot/page.tsx"),
  ]);

  assert.match(turnstile, /if \(!secret && !siteKey\) return true/);
  assert.match(turnstile, /if \(!secret \|\| !siteKey\)[\s\S]*return false/);
  assert.match(turnstile, /token\.length > 2_048/);
  assert.match(turnstile, /remoteip/);
  assert.match(turnstile, /AbortSignal\.timeout\(5_000\)/);
  assert.match(turnstile, /result\.action !== expectedAction/);
  assert.match(widget, /data-action=\{action\}/);

  assert.match(auth, /verifyTurnstile\(formData, "login"\)/);
  assert.match(auth, /verifyTurnstile\(formData, "join"\)/);
  assert.match(auth, /verifyTurnstile\(formData, "password_reset"\)/);
  assert.match(resend, /verifyTurnstile\(formData, "resend_confirmation"\)/);
  assert.match(login, /TurnstileWidget action="login"/);
  assert.match(login, /TurnstileWidget[^>]*action="resend_confirmation"/);
  assert.match(join, /TurnstileWidget action="join"/);
  assert.match(forgot, /TurnstileWidget action="password_reset"/);
});

test("auth routes are no-store and deployment preflight checks independent security secrets", async () => {
  const [nextConfig, runtimeConfig] = await Promise.all([
    read("next.config.ts"),
    read("scripts/check-runtime-config.mjs"),
  ]);

  assert.match(nextConfig, /source: "\/auth\/:path\*"[\s\S]*Cache-Control"[\s\S]*private, no-store, max-age=0[\s\S]*Referrer-Policy"[\s\S]*no-referrer/);
  assert.match(runtimeConfig, /name: "CRON_SECRET"/);
  assert.match(runtimeConfig, /name: "CAPABILITY_SIGNING_SECRET"/);
  assert.match(runtimeConfig, /name: "TURNSTILE"/);
  assert.match(runtimeConfig, /partial configuration is unsafe/);
  assert.match(runtimeConfig, /name: "RESEND_WEBHOOK_SECRET"/);
});


test("lead discovery briefs remain explicitly server-only", async () => {
  const migration = await read("supabase/migrations/20260930130450_harden_lead_discovery_briefs.sql");

  assert.match(migration, /revoke all on table public\.lead_discovery_briefs from anon, authenticated/);
  assert.match(migration, /grant all on table public\.lead_discovery_briefs to service_role/);
  assert.match(migration, /create policy "lead_discovery_briefs_server_only"/);
  assert.match(migration, /as restrictive[\s\S]*to anon, authenticated[\s\S]*using \(false\)[\s\S]*with check \(false\)/);
});


test("all public Turnstile forms bind server validation to a specific action", async () => {
  const [leads, trainingAuth, contact, booking, hiring, trainingJoin] = await Promise.all([
    read("src/app/actions/leads.ts"),
    read("src/app/actions/training-auth.ts"),
    read("src/app/contact/page.tsx"),
    read("src/components/client-booking-form.tsx"),
    read("src/components/hiring-brief-form.tsx"),
    read("src/components/training-join-form.tsx"),
  ]);

  for (const action of ["service_match", "industry_match", "role_brief", "contact", "discovery_booking"]) {
    assert.match(leads, new RegExp(`verifyTurnstile\\(formData, "${action}"\\)`));
  }
  assert.match(trainingAuth, /verifyTurnstile\(formData, "training_join"\)/);
  assert.match(contact, /TurnstileWidget action="contact"/);
  assert.match(booking, /TurnstileWidget action="discovery_booking"/);
  assert.match(hiring, /"service_match"[\s\S]*"industry_match"/);
  assert.match(hiring, /TurnstileWidget action="role_brief"/);
  assert.match(trainingJoin, /TurnstileWidget[^>]*action="training_join"/);
  assert.match(trainingJoin, /TurnstileWidget action="resend_confirmation"/);
});
