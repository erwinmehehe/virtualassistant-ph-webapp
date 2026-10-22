import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

async function loadBoundedFetch() {
  const source = await read("src/lib/supabase/bounded-fetch.ts");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = await import("data:text/javascript;charset=utf-8," + encodeURIComponent(output));
  return module.createBoundedSupabaseFetch;
}

test("Supabase fetch wrapper respects caller cancellation and the Request's signal", async () => {
  const create = await loadBoundedFetch();
  const originalFetch = globalThis.fetch;
  const recorded = [];
  globalThis.fetch = async (_input, init) => {
    recorded.push(init.signal);
    return new Response("{}", { status: 200 });
  };
  try {
    const first = new AbortController();
    await create(500)("https://example.invalid", { signal: first.signal });
    assert.equal(recorded[0].aborted, false);
    first.abort();
    assert.equal(recorded[0].aborted, true);

    const second = new AbortController();
    const request = new Request("https://example.invalid", { signal: second.signal });
    await create(500)(request);
    assert.equal(recorded[1].aborted, false);
    second.abort();
    assert.equal(recorded[1].aborted, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Supabase fetch wrapper aborts promptly if the provider stalls", async () => {
  const create = await loadBoundedFetch();
  const originalFetch = globalThis.fetch;
  let outboundSignal = null;
  globalThis.fetch = async (_input, init) => {
    outboundSignal = init.signal;
    return new Response("{}", { status: 200 });
  };
  try {
    await create(20)("https://example.invalid");
    assert.ok(outboundSignal instanceof AbortSignal);
    await new Promise((resolve) => setTimeout(resolve, 65));
    assert.equal(outboundSignal.aborted, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("outage deadlines cover public, admin, session, middleware and fail-closed rate limits", async () => {
  const [pub, admin, server, middleware, limiter, analytics, talent, maintenance] = await Promise.all([
    read("src/lib/supabase/public.ts"),
    read("src/lib/supabase/admin.ts"),
    read("src/lib/supabase/server.ts"),
    read("middleware.ts"),
    read("src/lib/rate-limit.ts"),
    read("src/app/api/analytics/route.ts"),
    read("src/lib/talent-search.ts"),
    read("src/app/api/cron/maintenance/route.ts"),
  ]);

  for (const source of [pub, admin, server, middleware]) {
    assert.match(source, /global: \{ fetch: bounded(?:Public|Admin|Session|Middleware)Fetch \}/);
    assert.match(source, /createBoundedSupabaseFetch\(/);
  }

  assert.match(middleware, /createBoundedSupabaseFetch\(4_000\)/);
  assert.match(middleware, /api\/analytics\|api\/errors/);
  assert.match(middleware, /try \{\s*await supabase\.auth\.getClaims\(\);/);
  assert.match(limiter, /abortSignal\(AbortSignal\.timeout\(logInfrastructureFailure \? 8_000 : 5_000\)\)/);
  assert.match(limiter, /throw new Error\("We could not verify this request safely/);

  assert.match(analytics, /if \(!hasSupabaseSession\) return null/);
  assert.match(analytics, /public_analytics:ip/);
  assert.match(analytics, /public_analytics:session/);

  // Heavy vector maintenance stays in the authenticated daily maintenance job,
  // not inside a public request to /find-talent.
  assert.match(maintenance, /syncPublicTalentEmbeddings\(25\)/);
  assert.doesNotMatch(talent.split("export async function syncPublicTalentEmbeddings")[0], /await syncPublicTalentEmbeddings\(/);
  assert.match(talent, /search_public_va_directory_hybrid/);
});
