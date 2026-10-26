import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/kiro-mock-interview-server.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function gates(env) {
  const module = { exports: {} };
  runInNewContext(js, {
    module, exports: module.exports,
    require(name) {
      if (name !== "server-only") throw new Error("unexpected import");
      return {};
    },
    URL, process: { env },
  });
  return module.exports;
}

const allowed = {
  AI_MOCK_INTERVIEW_ENABLED: "true",
  AI_MOCK_INTERVIEW_REAL_MODEL_ENABLED: "true",
  AI_MOCK_INTERVIEW_PROVIDER_APPROVED: "true",
  AI_MOCK_INTERVIEW_FREE_ONLY: "true",
  AI_MOCK_INTERVIEW_PILOT_USER_IDS: "fictional-va-id",
};
const preview = {
  ...allowed,
  NODE_ENV: "production",
  VERCEL_ENV: "preview",
  VERCEL_GIT_COMMIT_REF: "feature/approved-kiro-pilot",
  AI_MOCK_INTERVIEW_PREVIEW_BRANCH: "feature/approved-kiro-pilot",
  AI_MOCK_INTERVIEW_PREVIEW_SUPABASE_REF: "abcdefghijklmnopqrst",
  AI_MOCK_INTERVIEW_PRODUCTION_SUPABASE_REF: "zyxwvutsrqponmlkjihg",
  NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
};

test("live mock interview permits only explicitly named, isolated Preview database and branch", () => {
  const gate = gates(preview);
  assert.equal(gate.isMockInterviewVerifiedPreview(), true);
  assert.equal(gate.isMockInterviewLivePilot("fictional-va-id"), true);
  assert.equal(gate.isMockInterviewLivePilot("OTHER-ACCOUNT-ID"), false);
  assert.equal(gate.allowMockInterviewFixture(), false);
});

test("every incomplete, mismatched, and production Preview configuration fails closed", () => {
  const mutations = [
    { VERCEL_ENV: "production" },
    { VERCEL_ENV: "development" },
    { VERCEL_ENV: "" },
    { VERCEL_GIT_COMMIT_REF: "main" },
    { VERCEL_GIT_COMMIT_REF: "feature/other" },
    { AI_MOCK_INTERVIEW_PREVIEW_BRANCH: "main", VERCEL_GIT_COMMIT_REF: "main" },
    { AI_MOCK_INTERVIEW_PREVIEW_BRANCH: "" },
    { AI_MOCK_INTERVIEW_PREVIEW_SUPABASE_REF: "" },
    { AI_MOCK_INTERVIEW_PRODUCTION_SUPABASE_REF: "" },
    { AI_MOCK_INTERVIEW_PREVIEW_SUPABASE_REF: "zyxwvutsrqponmlkjihg" },
    { AI_MOCK_INTERVIEW_PRODUCTION_SUPABASE_REF: "abcdefghijklmnopqrst" },
    { NEXT_PUBLIC_SUPABASE_URL: "https://zyxwvutsrqponmlkjihg.supabase.co" },
    { NEXT_PUBLIC_SUPABASE_URL: "http://abcdefghijklmnopqrst.supabase.co" },
    { NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co.evil.example" },
    { NEXT_PUBLIC_SUPABASE_URL: "https://user:pass@abcdefghijklmnopqrst.supabase.co" },
    { NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co:8443" },
    { AI_MOCK_INTERVIEW_ENABLED: "false" },
    { AI_MOCK_INTERVIEW_REAL_MODEL_ENABLED: "false" },
    { AI_MOCK_INTERVIEW_PROVIDER_APPROVED: "false" },
    { AI_MOCK_INTERVIEW_FREE_ONLY: "false" },
    { AI_MOCK_INTERVIEW_PILOT_USER_IDS: "" },
  ];
  for (const change of mutations) {
    const gate = gates({ ...preview, ...change });
    assert.equal(gate.isMockInterviewLivePilot("fictional-va-id"), false, JSON.stringify(change));
  }
});

test("local genuine-provider UAT requires every operator flag and disposable loopback app and DB", () => {
  const sandbox = {
    ...allowed,
    NODE_ENV: "development",
    VERCEL_ENV: "",
    VAPH_MOCK_INTERVIEW_REAL_MODEL_UAT: "operator-approved",
    AI_MOCK_INTERVIEW_LOCAL_SANDBOX_ONLY: "true",
    E2E_BASE_URL: "http://127.0.0.1:3000",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  };
  assert.equal(gates(sandbox).isMockInterviewOperatorSandbox(), true);
  assert.equal(gates(sandbox).isMockInterviewLivePilot("fictional-va-id"), true);
  const changes = [
    { NODE_ENV: "production" },
    { VAPH_MOCK_INTERVIEW_REAL_MODEL_UAT: "" },
    { AI_MOCK_INTERVIEW_LOCAL_SANDBOX_ONLY: "false" },
    { AI_MOCK_INTERVIEW_E2E_MOCK: "true" },
    { NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co" },
    { E2E_BASE_URL: "https://public-preview.vercel.app" },
    { NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1.evil.example:54321" },
    { E2E_BASE_URL: "" },
  ];
  for (const change of changes) {
    assert.equal(gates({ ...sandbox, ...change }).isMockInterviewLivePilot("fictional-va-id"), false, JSON.stringify(change));
  }
});

test("ordinary synthetic browser fixture still requires development plus loopback", () => {
  const fixture = {
    NODE_ENV: "development",
    AI_MOCK_INTERVIEW_ENABLED: "true",
    AI_MOCK_INTERVIEW_E2E_MOCK: "true",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  };
  assert.equal(gates(fixture).allowMockInterviewFixture(), true);
  assert.equal(gates({ ...fixture, NODE_ENV: "production" }).allowMockInterviewFixture(), false);
  assert.equal(gates({ ...fixture, NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co" }).allowMockInterviewFixture(), false);
  assert.equal(gates(fixture).isMockInterviewLivePilot("fictional-va-id"), false);
});
