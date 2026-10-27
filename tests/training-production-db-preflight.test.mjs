import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { verifyTrainingDatabaseContract } from "../scripts/verify-training-db-contract.mjs";

const env = {
  VERCEL_ENV: "production",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-only-key",
};

test("preview and local builds never access a hosted database", async () => {
  const failIfCalled = () => { throw new Error("Never connect for preview/local builds"); };
  assert.deepEqual(await verifyTrainingDatabaseContract({}, failIfCalled), { skipped: true });
  assert.deepEqual(await verifyTrainingDatabaseContract({ VERCEL_ENV: "preview" }, failIfCalled), { skipped: true });
});

test("production build probes the exact progress RPC with deliberately invalid input", async () => {
  let calls = 0;
  const makeClient = (url, key) => {
    assert.equal(url, env.NEXT_PUBLIC_SUPABASE_URL);
    assert.equal(key, env.SUPABASE_SERVICE_ROLE_KEY);
    return {
      rpc: async (name, input) => {
        calls += 1;
        assert.equal(name, "record_training_engagement_atomic");
        assert.equal(input.p_scroll_percent, -1);
        assert.equal(input.p_user_id, "00000000-0000-4000-8000-000000000000");
        assert.equal(input.p_lesson_id, "00000000-0000-4000-8000-000000000000");
        return { error: { code: "P0001", message: "Invalid scroll percent" } };
      },
    };
  };
  assert.deepEqual(await verifyTrainingDatabaseContract(env, makeClient), { skipped: false, verified: true });
  assert.equal(calls, 1);
  const sql = await readFile("supabase/migrations/20261026235826_atomic_training_engagement.sql", "utf8");
  assert.ok(sql.indexOf("if p_scroll_percent is null") < sql.indexOf("insert into public.training_lesson_engagement"));
});

test("missing production credentials or RPC block production builds", async () => {
  await assert.rejects(verifyTrainingDatabaseContract({ VERCEL_ENV: "production" }), /Deployment blocked/);
  await assert.rejects(verifyTrainingDatabaseContract(env, () => ({
    rpc: async () => ({ error: { code: "PGRST202", message: "Function not found" } }),
  })), /PGRST202/);
  await assert.rejects(verifyTrainingDatabaseContract(env, () => ({
    rpc: async () => ({ data: [], error: null }),
  })), /UNEXPECTED_SUCCESS/);
});
