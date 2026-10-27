#!/usr/bin/env node
/**
 * Fail closed before a PRODUCTION build when the training progress database
 * function is unavailable. The probe deliberately uses an invalid scroll
 * percentage, which the RPC rejects before touching any learner records.
 *
 * CI/local/preview builds do not call production Supabase.
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

export async function verifyTrainingDatabaseContract(env = process.env, makeClient = createClient) {
  if (env.VERCEL_ENV !== "production") return { skipped: true };

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Production Supabase URL or service key is not configured. Deployment blocked.");
  }

  const client = makeClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init = {}) =>
        fetch(input, { ...init, signal: AbortSignal.timeout(10_000) }),
    },
  });

  // Invalid input is rejected by the first line of the database function.
  // No user is looked up, no engagement row is inserted or updated.
  const { error } = await client.rpc("record_training_engagement_atomic", {
    p_user_id: "00000000-0000-4000-8000-000000000000",
    p_lesson_id: "00000000-0000-4000-8000-000000000000",
    p_scroll_percent: -1,
  });

  if (error?.code !== "P0001" || !/Invalid scroll percent/i.test(error.message || "")) {
    const safeCode = String(error?.code || "UNEXPECTED_SUCCESS").slice(0, 24);
    throw new Error(
      "Training database contract failed (" + safeCode + "). Apply the " +
      "atomic_training_engagement migration before deploying the website."
    );
  }

  return { skipped: false, verified: true };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const result = await verifyTrainingDatabaseContract();
    console.log(result.skipped
      ? "Training database preflight skipped outside Vercel production."
      : "Production training database dependency verified.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Training database preflight failed.");
    process.exitCode = 1;
  }
}
