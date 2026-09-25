import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

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

function vectorLiteral(values: number[]) {
  return `[${values.join(",")}]`;
}

async function queryEmbedding(query: string) {
  const text = query.trim();
  if (!text) return null;

  const admin = createAdminClient();
  const { data, error } = await admin.functions.invoke("talent-embeddings", {
    body: {
      mode: "query",
      query: text.slice(0, 500),
    },
  });

  if (error) {
    console.error("[talent-search] Supabase Edge embedding request failed", {
      message: error.message,
    });
    return null;
  }

  const embedding = Array.isArray(data?.embedding)
    ? data.embedding.map(Number)
    : [];
  if (
    embedding.length !== EMBEDDING_DIMENSIONS ||
    embedding.some((value: number) => !Number.isFinite(value))
  ) {
    console.error("[talent-search] Supabase Edge returned an invalid embedding");
    return null;
  }

  return vectorLiteral(embedding);
}

export async function searchPublicTalent(params: TalentSearchParams) {
  const pageSize = Math.max(1, Math.min(Number(params.pageSize || 24), 100));
  const page = Math.max(1, Number(params.page || 1));
  const query = String(params.query || "").trim();

  let queryEmbedding: string | null = null;
  if (query) {
    // First-page searches can repair a small stale semantic batch so a newly
    // consented/updated public profile does not wait for the maintenance job.
    if (page === 1) {
      try {
        await syncPublicTalentEmbeddings(12);
      } catch (error) {
        console.error("[talent-search] semantic index refresh failed", {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Semantic retrieval is an enhancement. If Edge inference is unavailable,
    // the database RPC continues with full-text and structured filtering.
    try {
      queryEmbedding = await queryEmbeddingForSearch(query);
    } catch {
      queryEmbedding = null;
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

async function queryEmbeddingForSearch(query: string) {
  return queryEmbedding(query);
}

/**
 * Refreshes semantic embeddings for consented public VA profiles only.
 * Private resumes, contact details, assessment answers, recruiter notes, and
 * non-public candidates never enter Edge inference.
 */
export async function syncPublicTalentEmbeddings(limit = 25) {
  const admin = createAdminClient();
  const { data, error } = await admin.functions.invoke("talent-embeddings", {
    body: {
      mode: "refresh",
      limit: Math.max(1, Math.min(40, Math.floor(Number(limit || 25)))),
    },
  });

  if (error) {
    throw new Error(`Talent embedding refresh failed: ${error.message}`);
  }

  return {
    checked: Number(data?.checked || 0),
    updated: Number(data?.updated || 0),
    failed: Number(data?.failed || 0),
  };
}
