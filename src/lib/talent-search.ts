import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type PublicTalentSearchRow = {
  slug: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  primary_category: string | null;
  categories: string[] | null;
  skills: string[] | null;
  tools: string[] | null;
  industries: string[] | null;
  languages: string[] | null;
  years_experience: number | null;
  weekly_hours: number | null;
  schedule: string | null;
  preferred_timezone: string | null;
  overlap_hours: number | null;
  hourly_rate: number | null;
  has_portfolio: boolean | null;
  created_at: string | null;
  lexical_rank: number;
  semantic_similarity: number;
  search_score: number;
  total_count: number | string;
};

export type PublicTalentSearchInput = {
  query?: string;
  category?: string;
  tool?: string;
  minHours?: number;
  minExperience?: number;
  minOverlap?: number;
  timezone?: string;
  portfolioOnly?: boolean;
  sort?: "recommended" | "experience" | "availability" | "newest" | string;
  limit?: number;
  offset?: number;
};

async function queryEmbedding(query: string) {
  const text = query.trim();
  if (!text) return null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.functions.invoke("talent-embeddings", {
      body: { mode: "query", query: text.slice(0, 500) },
    });
    if (error || !Array.isArray(data?.embedding) || data.embedding.length !== 384) return null;
    return data.embedding.map(Number).filter(Number.isFinite);
  } catch {
    // Semantic retrieval is an enhancement. Database full-text search remains
    // available when the Edge embedding worker is unavailable or undeployed.
    return null;
  }
}

export async function searchPublicTalent(input: PublicTalentSearchInput) {
  const query = String(input.query || "").trim().slice(0, 500);
  const embedding = query ? await queryEmbedding(query) : null;
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("search_public_va_directory", {
    p_query: query || null,
    p_query_embedding: embedding?.length === 384 ? JSON.stringify(embedding) : null,
    p_category: String(input.category || "").trim() || null,
    p_tool: String(input.tool || "").trim() || null,
    p_min_hours: Math.max(0, Number(input.minHours || 0)),
    p_min_experience: Math.max(2, Number(input.minExperience || 2)),
    p_min_overlap: Math.max(0, Number(input.minOverlap || 0)),
    p_timezone: String(input.timezone || "").trim() || null,
    p_portfolio_only: Boolean(input.portfolioOnly),
    p_sort: String(input.sort || "recommended"),
    p_limit: Math.max(1, Math.min(50, Number(input.limit || 24))),
    p_offset: Math.max(0, Number(input.offset || 0)),
  });
  if (error) throw error;

  const rows = (data || []) as PublicTalentSearchRow[];
  return {
    rows,
    total: rows.length ? Number(rows[0].total_count || 0) : 0,
    semantic: Boolean(embedding?.length === 384),
  };
}

export async function refreshQueuedTalentEmbeddings(limit = 20) {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.functions.invoke("talent-embeddings", {
      body: { mode: "refresh", limit: Math.max(1, Math.min(40, limit)) },
    });
    if (error) return { error: error.message };
    return data;
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
