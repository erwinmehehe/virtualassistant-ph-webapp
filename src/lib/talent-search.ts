import "server-only";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

const AI_GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/embeddings";
const DEFAULT_EMBEDDING_MODEL = "openai/text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 768;

type TalentSearchParams = {
  query?: string;
  category?: string;
  tool?: string;
  minHours?: number;
  minExperience?: number;
  minOverlap?: number;
  timezone?: string;
  portfolioOnly?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
};

type EmbeddingResponse = {
  data?: Array<{ index?: number; embedding?: number[] }>;
};

async function gatewayCredentials() {
  // AI Gateway documents both API-key and OIDC authentication. Prefer the
  // explicit Gateway key when present, then fall back to Vercel OIDC. Keep
  // request-scoped OIDC last because not every request token is authorized for
  // AI Gateway, and a 403 from one credential must not block a valid fallback.
  const credentials = [
    process.env.AI_GATEWAY_API_KEY?.trim(),
    process.env.VERCEL_OIDC_TOKEN?.trim(),
  ].filter((value): value is string => Boolean(value));

  try {
    const requestHeaders = await headers();
    const runtimeOidc = requestHeaders.get("x-vercel-oidc-token")?.trim();
    if (runtimeOidc) credentials.push(runtimeOidc);
  } catch {
    // headers() is unavailable outside a request context, such as cron jobs.
  }

  return [...new Set(credentials)];
}

function vectorLiteral(values: number[]) {
  return `[${values.join(",")}]`;
}

async function embedTexts(values: string[], existingCredentials?: string[]) {
  const credentials = existingCredentials?.length
    ? [...new Set(existingCredentials)]
    : await gatewayCredentials();
  if (!credentials.length || !values.length) return null;

  let lastAuthStatus: number | null = null;
  for (const key of credentials) {
    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_TALENT_EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL,
        input: values,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        lastAuthStatus = response.status;
        continue;
      }
      console.error("[talent-search] AI Gateway embedding request failed", {
        status: response.status,
      });
      return null;
    }

    const payload = await response.json() as EmbeddingResponse;
    const rows = [...(payload.data || [])].sort(
      (a, b) => Number(a.index || 0) - Number(b.index || 0),
    );
    if (rows.length !== values.length) return null;

    const embeddings = rows.map((row) => row.embedding || []);
    if (
      embeddings.some(
        (embedding) =>
          embedding.length !== EMBEDDING_DIMENSIONS ||
          embedding.some((value) => !Number.isFinite(value)),
      )
    ) {
      return null;
    }
    return embeddings;
  }

  console.error("[talent-search] AI Gateway authentication failed", {
    status: lastAuthStatus,
    attemptedCredentials: credentials.length,
  });
  return null;
}

export async function searchPublicTalent(params: TalentSearchParams) {
  const pageSize = Math.max(1, Math.min(Number(params.pageSize || 24), 100));
  const page = Math.max(1, Number(params.page || 1));
  const query = String(params.query || "").trim();

  let queryEmbedding: string | null = null;
  if (query) {
    // The scheduled maintenance job remains the normal indexing path, but a
    // real first-page search can self-heal a small stale batch. This prevents
    // a newly enabled semantic index from sitting empty until the next daily
    // cron, while keeping request work bounded as the directory grows.
    if (page === 1) {
      try {
        await syncPublicTalentEmbeddings(12);
      } catch {
        // Search must keep working when indexing or the embedding provider is
        // unavailable. The hybrid RPC falls back to lexical/structured ranking.
      }
    }

    try {
      const result = await embedTexts([query]);
      if (result?.[0]) queryEmbedding = vectorLiteral(result[0]);
    } catch {
      // Keyword/structured retrieval remains available when the embedding
      // provider is unavailable or the AI budget is intentionally disabled.
    }
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("search_public_va_directory_hybrid", {
    p_query: query || null,
    p_query_embedding: queryEmbedding,
    p_category: params.category || null,
    p_tool: params.tool || null,
    p_min_hours: Math.max(0, Number(params.minHours || 0)),
    p_min_experience: Math.max(2, Number(params.minExperience || 2)),
    p_min_overlap: Math.max(0, Number(params.minOverlap || 0)),
    p_timezone: params.timezone || null,
    p_portfolio_only: Boolean(params.portfolioOnly),
    p_sort: params.sort || "recommended",
    p_offset: (page - 1) * pageSize,
    p_limit: pageSize,
  });

  if (error) throw error;
  const rows = (data || []) as any[];
  return {
    rows,
    total: Number(rows[0]?.total_count || 0),
    semantic: Boolean(queryEmbedding),
  };
}

/**
 * Refreshes semantic embeddings for consented public VA profiles only.
 * Private resumes, contact details, test answers, recruiter notes, and
 * non-public candidates never enter the embedding provider request.
 */
export async function syncPublicTalentEmbeddings(limit = 25) {
  const credentials = await gatewayCredentials();
  if (!credentials.length) {
    return { checked: 0, updated: 0, skipped: "embedding_provider_not_configured" as const };
  }

  const admin = createAdminClient();
  const { data: sources, error } = await admin.rpc("list_public_va_embedding_sources", {
    p_limit: Math.max(1, Math.min(limit, 100)),
  });
  if (error) throw error;

  const rows = (sources || []) as Array<{ va_id: string; search_text: string; source_hash: string }>;
  if (!rows.length) return { checked: 0, updated: 0 };

  const embeddings = await embedTexts(rows.map((row) => row.search_text), credentials);
  if (!embeddings) throw new Error("Talent embedding provider returned an invalid response.");

  const model = process.env.AI_TALENT_EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL;
  let updated = 0;
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const embedding = embeddings[index];
    const { error: upsertError } = await admin.rpc("upsert_public_va_search_embedding", {
      p_va_id: row.va_id,
      p_search_text: row.search_text,
      p_source_hash: row.source_hash,
      p_model: model,
      p_embedding: vectorLiteral(embedding),
    });
    if (upsertError) throw upsertError;
    updated += 1;
  }

  return { checked: rows.length, updated };
}
