import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createHmac } from "node:crypto";
import ts from "typescript";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

function loadPolicy() {
  // Node's source-level unit runner has no Next.js server-only import shim.
  const source = read("src/lib/va-identity-verification.ts").replace('import "server-only";', "");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", js)(createRequire(import.meta.url), mod, mod.exports);
  return mod.exports;
}
const policy = loadPolicy();
const ids = {
  event: "123e4567-e89b-42d3-a456-426614174000",
  session: "123e4567-e89b-42d3-a456-426614174001",
  workflow: "123e4567-e89b-42d3-a456-426614174002",
  va: "123e4567-e89b-42d3-a456-426614174003",
};
const cfg = {
  apiKey: "test-key",
  workflowId: ids.workflow,
  webhookSecret: "test-hook-secret",
  callback: "https://virtualassistant.com.ph/workspace/va/identity",
  environment: "live",
};

function sample(overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  return {
    event_id: ids.event,
    webhook_type: "status.updated",
    timestamp: now,
    created_at: now,
    session_id: ids.session,
    workflow_id: ids.workflow,
    environment: "live",
    vendor_data: ids.va,
    status: "Approved",
    decision: {
      id_verifications: [{ status: "Approved" }],
      liveness_checks: [{ status: "Approved" }],
      face_matches: [{ status: "Approved" }],
    },
    ...overrides,
  };
}
function signed(payload) {
  const raw = Buffer.from(JSON.stringify(payload));
  const signature = createHmac("sha256", cfg.webhookSecret).update(raw).digest("hex");
  return { raw, headers: new Headers({
    "x-timestamp": String(payload.timestamp), "x-signature": signature,
  }) };
}

test("feature is disabled unless explicitly opted in with complete server-only credentials", () => {
  const old = Object.fromEntries(
    ["DIDIT_IDV_ENABLED", "DIDIT_API_KEY", "DIDIT_WORKFLOW_ID", "DIDIT_WEBHOOK_SECRET", "DIDIT_RETURN_URL", "DIDIT_ENVIRONMENT"]
      .map(k => [k, process.env[k]]),
  );
  try {
    delete process.env.DIDIT_IDV_ENABLED;
    assert.equal(policy.diditConfiguration(), null);
    process.env.DIDIT_IDV_ENABLED = "true";
    process.env.DIDIT_API_KEY = cfg.apiKey;
    process.env.DIDIT_WORKFLOW_ID = cfg.workflowId;
    process.env.DIDIT_WEBHOOK_SECRET = cfg.webhookSecret;
    process.env.DIDIT_RETURN_URL = cfg.callback;
    process.env.DIDIT_ENVIRONMENT = "live";
    assert.equal(policy.diditConfiguration()?.environment, "live");
    process.env.DIDIT_RETURN_URL = "http://bad.example/workspace/va/identity";
    assert.equal(policy.diditConfiguration(), null);
  } finally {
    for (const [key, value] of Object.entries(old)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("only Didit's fixed HTTPS hosted verification domain can receive the browser redirect", () => {
  assert.equal(policy.isExpectedDiditRedirect("https://verify.didit.me/session/token"), true);
  for (const url of [
    "https://verify.didit.me.evil.example/session/token",
    "http://verify.didit.me/session/token",
    "https://verify.didit.me@evil.example/session/token",
    "javascript:alert(1)",
  ]) assert.equal(policy.isExpectedDiditRedirect(url), false);
});

test("a signed full raw body with all three approved checks is verified", () => {
  const event = sample();
  const { raw, headers } = signed(event);
  const parsed = policy.verifyDiditWebhook(raw, headers, cfg);
  assert.equal(parsed?.session_id, ids.session);
  assert.equal(policy.outcomeFromDidit(parsed), "verified");
});

test("an altered result or forged header is rejected before any database lookup", () => {
  const event = sample();
  const { raw, headers } = signed(event);
  const forged = Buffer.from(raw.toString().replace('"Approved"', '"Declined"'));
  assert.equal(policy.verifyDiditWebhook(forged, headers, cfg), null);
  const wrongTimestamp = new Headers(headers);
  wrongTimestamp.set("x-timestamp", String(event.timestamp - 1200));
  assert.equal(policy.verifyDiditWebhook(raw, wrongTimestamp, cfg), null);
  const wrongWorkflow = signed(sample({ workflow_id: ids.va }));
  assert.equal(policy.verifyDiditWebhook(wrongWorkflow.raw, wrongWorkflow.headers, cfg), null);
  const wrongEnvironment = signed(sample({ environment: "sandbox" }));
  assert.equal(policy.verifyDiditWebhook(wrongEnvironment.raw, wrongEnvironment.headers, cfg), null);
});

test("missing document, liveness or face approval must not grant an ID badge", () => {
  const event = sample();
  assert.equal(policy.outcomeFromDidit({ ...event, decision: {
    ...event.decision,
    face_matches: [{ status: "Declined" }],
  } }), "needs_review");
  assert.equal(policy.outcomeFromDidit({ ...event, decision: {} }), "needs_review");
  assert.equal(policy.outcomeFromDidit({ ...event, status: "Declined" }), "needs_review");
  assert.equal(policy.outcomeFromDidit({ ...event, status: "In Review" }), "needs_review");
  assert.equal(policy.outcomeFromDidit({ ...event, status: "Kyc Expired" }), "expired");
  assert.equal(policy.outcomeFromDidit({ ...event, environment: "sandbox" }), "sandbox_approved");
});

test("only VA-owned explicit consent starts identity verification", () => {
  const action = read("src/app/actions/va-identity-verification.ts");
  const page = read("src/app/workspace/va/identity/page.tsx");
  assert.match(action, /requireRole\("va"\)/);
  assert.match(action, /formData\.get\("identity_consent"\) !== "yes"/);
  assert.match(action, /\.from\("va_identity_checks"\)\.upsert/);
  assert.match(action, /attempts >= 5/);
  assert.match(action, /vendor_data: user\.id/);
  assert.match(action, /https:\/\/verification\.didit\.me\/v3\/session\//);
  assert.doesNotMatch(action, /from\("avatars"\)|from\("resumes"\)/);
  assert.match(page, /requireRole\("va"\)/);
  assert.match(page, /type="checkbox" name="identity_consent" value="yes" required/);
  assert.match(page, /privacy|Privacy Notice/);
});

test("webhook binds the exact signed event to user and session and cannot ban a VA", () => {
  const route = read("src/app/api/identity/didit/route.ts");
  assert.match(route, /verifyDiditWebhook\(raw, request\.headers, config\)/);
  assert.match(route, /check\.user_id !== event\.vendor_data/);
  assert.match(route, /\.eq\("session_id", event\.session_id\)/);
  assert.match(route, /check\.last_event_id === event\.event_id/);
  assert.match(route, /check\.status === "verified"/);
  assert.match(route, /outcome === "verified"/);
  assert.match(route, /\.update\(\{ identity_verified_at: verifiedAt \}\)/);
  assert.doesNotMatch(route, /account_status|stage:\s*["']rejected|\.from\("job_applications"\)/);
});

test("service-only ledger has RLS and no raw identity data fields", () => {
  const sql = read("supabase/migrations/20261024161500_va_hosted_identity_verification.sql");
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all on table public\.va_identity_checks from anon, authenticated/);
  assert.match(sql, /grant select, insert, update, delete on table public\.va_identity_checks to service_role/);
  assert.doesNotMatch(sql, /photo_path\s|face_template\s|document_number\s|ocr_data\s|image_data\s/);
  assert.match(read("src/app/workspace/va/vetting/page.tsx"), /diditConfiguration\(\)/);
  assert.match(read("docs/compliance/DATA_PROCESSING_INVENTORY.md"), /Optional hosted government-ID verification/);
});
