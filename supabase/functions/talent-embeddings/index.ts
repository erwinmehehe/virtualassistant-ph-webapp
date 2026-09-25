import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type RequestBody = {
  mode?: "query" | "refresh";
  query?: string;
  limit?: number;
};

const MODEL = "gte-small";
const RAW_DIMENSIONS = 384;
const STORED_DIMENSIONS = 768;
const MAX_QUERY_LENGTH = 500;
const MAX_EMBED_TEXT_LENGTH = 2_500;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function vectorLiteral(values: number[]) {
  return `[${values.join(",")}]`;
}

function padForExistingVectorSchema(raw: number[]) {
  if (
    raw.length !== RAW_DIMENSIONS ||
    raw.some((value) => !Number.isFinite(value))
  ) {
    throw new Error("Embedding model returned an invalid vector.");
  }

  // The existing production search index is vector(768). gte-small emits
  // 384 normalized dimensions. Appending zeroes preserves cosine similarity
  // exactly when both indexed profiles and search queries use the same padding,
  // while avoiding a risky live column/type migration.
  return [
    ...raw,
    ...Array.from({ length: STORED_DIMENSIONS - RAW_DIMENSIONS }, () => 0),
  ];
}

async function embed(text: string) {
  const session = new Supabase.ai.Session(MODEL);
  const result = await session.run(text.slice(0, MAX_EMBED_TEXT_LENGTH), {
    mean_pool: true,
    normalize: true,
  });
  return padForExistingVectorSchema(Array.from(result as Float32Array | number[]));
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const authorization = request.headers.get("authorization") || "";

  // This function is an internal server-to-server primitive. Keeping the
  // service-role check in addition to verify_jwt=true prevents browser callers
  // from using it as a free embedding endpoint.
  if (
    !serviceRoleKey ||
    !supabaseUrl ||
    authorization !== `Bearer ${serviceRoleKey}`
  ) {
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
      return json(
        { error: "Query must be between 1 and 500 characters." },
        400,
      );
    }

    try {
      const embedding = await embed(query);
      return json({
        embedding,
        model: MODEL,
        raw_dimensions: RAW_DIMENSIONS,
        stored_dimensions: STORED_DIMENSIONS,
      });
    } catch (error) {
      console.error("[talent-embeddings] query embedding failed", error);
      return json({ error: "Embedding generation failed." }, 500);
    }
  }

  if (mode !== "refresh") {
    return json({ error: "Unsupported mode" }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const limit = Math.max(1, Math.min(40, Math.floor(Number(body.limit || 20))));

  const { data: sources, error: sourceError } = await supabase.rpc(
    "list_public_va_embedding_sources",
    { p_limit: limit },
  );
  if (sourceError) {
    console.error("[talent-embeddings] source lookup failed", sourceError);
    return json({ error: "Could not load embedding sources." }, 500);
  }

  let updated = 0;
  const failures: Array<{ va_id: string; error: string }> = [];

  for (const source of sources || []) {
    const vaId = String(source.va_id || "");
    try {
      const searchText = String(source.search_text || "").trim();
      if (!vaId || !searchText) {
        throw new Error("Public talent source is incomplete.");
      }

      const embedding = await embed(searchText);
      const { error: upsertError } = await supabase.rpc(
        "upsert_public_va_search_embedding",
        {
          p_va_id: vaId,
          p_search_text: searchText,
          p_source_hash: String(source.source_hash || ""),
          p_model: MODEL,
          p_embedding: vectorLiteral(embedding),
        },
      );
      if (upsertError) throw upsertError;
      updated += 1;
    } catch (error) {
      failures.push({
        va_id: vaId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return json({
    checked: (sources || []).length,
    updated,
    failed: failures.length,
    failures: failures.slice(0, 10),
    model: MODEL,
    raw_dimensions: RAW_DIMENSIONS,
    stored_dimensions: STORED_DIMENSIONS,
  });
});
