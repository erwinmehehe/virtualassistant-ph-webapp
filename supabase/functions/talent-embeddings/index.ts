import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type RequestBody = {
  mode?: "query" | "refresh";
  query?: string;
  limit?: number;
};

const MAX_QUERY_LENGTH = 500;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function publicProfileSearchText(profile: Record<string, any>) {
  return [
    profile.headline,
    profile.bio,
    profile.primary_category,
    ...(Array.isArray(profile.categories) ? profile.categories : []),
    ...(Array.isArray(profile.skills) ? profile.skills : []),
    ...(Array.isArray(profile.tools) ? profile.tools : []),
    ...(Array.isArray(profile.industries) ? profile.industries : []),
    ...(Array.isArray(profile.languages) ? profile.languages : []),
    profile.schedule,
    profile.preferred_timezone,
  ]
    .filter(Boolean)
    .map(String)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12_000);
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function embed(text: string) {
  const session = new Supabase.ai.Session("gte-small");
  const result = await session.run(text, { mean_pool: true, normalize: true });
  return Array.from(result as Float32Array | number[]);
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const authorization = request.headers.get("authorization") || "";
  if (!serviceRoleKey || !supabaseUrl || authorization !== `Bearer ${serviceRoleKey}`) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const mode = body.mode || "query";
  if (mode === "query") {
    const query = String(body.query || "").trim();
    if (!query || query.length > MAX_QUERY_LENGTH) {
      return json({ error: "Query must be between 1 and 500 characters" }, 400);
    }
    const embedding = await embed(query);
    return json({ embedding, model: "gte-small" });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const limit = Math.max(1, Math.min(40, Math.floor(Number(body.limit || 20))));

  const { data: jobs, error: claimError } = await supabase.rpc(
    "claim_va_search_embedding_jobs",
    { p_limit: limit },
  );
  if (claimError) return json({ error: claimError.message }, 500);

  let indexed = 0;
  let removed = 0;
  const failures: Array<{ va_id: string; error: string }> = [];

  for (const job of jobs || []) {
    const vaId = String(job.va_id);
    try {
      const { data: profile, error: profileError } = await supabase
        .from("public_va_directory")
        .select(
          "user_id,headline,bio,primary_category,categories,skills,tools,industries,languages,schedule,preferred_timezone",
        )
        .eq("user_id", vaId)
        .maybeSingle();
      if (profileError) throw profileError;

      if (!profile) {
        const { error: deleteError } = await supabase.rpc("delete_va_search_embedding", {
          p_va_id: vaId,
        });
        if (deleteError) throw deleteError;
        removed += 1;
      } else {
        const source = publicProfileSearchText(profile);
        const sourceHash = await sha256(source);
        const embedding = await embed(source);
        const { error: upsertError } = await supabase.rpc("upsert_va_search_embedding", {
          p_va_id: vaId,
          p_embedding: JSON.stringify(embedding),
          p_source_hash: sourceHash,
          p_model: "gte-small",
        });
        if (upsertError) throw upsertError;
        indexed += 1;
      }

      const { error: completeError } = await supabase.rpc(
        "complete_va_search_embedding_job",
        {
          p_va_id: vaId,
          p_requested_at: job.requested_at,
        },
      );
      if (completeError) throw completeError;
    } catch (error) {
      failures.push({
        va_id: vaId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return json({
    claimed: (jobs || []).length,
    indexed,
    removed,
    failed: failures.length,
    failures: failures.slice(0, 10),
    model: "gte-small",
  });
});
