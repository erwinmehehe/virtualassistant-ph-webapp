import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("job sitemap reads the sanitized public view and paginates", async () => {
  const sitemap = await read("src/app/sitemap.ts");
  assert.match(sitemap, /from\("public_jobs"\)/);
  assert.match(sitemap, /\.range\(from, from \+ JOB_BATCH - 1\)/);
  assert.doesNotMatch(sitemap, /from\("jobs"\)/);
  assert.doesNotMatch(sitemap, /\.limit\(500\)/);
});

test("resume download resolves the private current VA path after authorization", async () => {
  const route = await read("src/app/api/resume/[applicationId]/route.ts");
  assert.match(route, /from\("applications"\)/);
  assert.match(route, /application\.va_id === user\.id/);
  assert.match(route, /from\("va_profiles"\)/);
  assert.match(route, /select\("resume_path"\)/);
  assert.doesNotMatch(route, /profile_snapshot/);
});

test("resume parsing rejects dangerous archives and bounds extraction", async () => {
  const parser = await read("src/lib/resume-parsing.ts");
  assert.match(parser, /maxDocxCompressionRatio/);
  assert.match(parser, /maxDocxUncompressedBytes/);
  assert.match(parser, /maxExtractedTextChars/);
  assert.match(parser, /extractionTimeoutMs/);
  assert.match(parser, /Password-protected DOCX files cannot be processed/);
  assert.match(parser, /%PDF-/);
});

test("talent search is database paginated with optional private semantic embeddings", async () => {
  const [page, helper, sql, edge] = await Promise.all([
    read("src/app/find-talent/page.tsx"),
    read("src/lib/talent-search.ts"),
    read("supabase/migrations/20260924194000_hybrid_public_talent_search.sql"),
    read("supabase/functions/talent-embeddings/index.ts"),
  ]);

  assert.match(page, /searchPublicTalent/);
  assert.doesNotMatch(page, /limit\(200\)/);
  assert.doesNotMatch(page, /public_va_directory"\)\.select\("\*"\)/);
  assert.match(helper, /search_public_va_directory/);
  assert.match(helper, /talent-embeddings/);
  assert.match(sql, /create extension if not exists vector with schema extensions/i);
  assert.match(sql, /private\.va_search_embeddings/);
  assert.match(sql, /from private\.public_va_directory_rows\(\)/);
  assert.match(sql, /semantic_similarity/);
  assert.match(sql, /grant execute[\s\S]*to anon, authenticated, service_role/i);
  assert.match(edge, /Supabase\.ai\.Session\("gte-small"\)/);
});

test("profiling compliance package records the NPC registration decision and DPIA", async () => {
  const [registration, dpia, notice] = await Promise.all([
    read("docs/compliance/NPC_DPS_MATCHING_REGISTRATION.md"),
    read("docs/compliance/DPIA_TALENT_MATCHING.md"),
    read("src/app/privacy/page.tsx"),
  ]);
  assert.match(registration, /Registration required/);
  assert.match(registration, /profiling/);
  assert.match(dpia, /human recruiter review remains mandatory/i);
  assert.match(notice, /Matching, search, and profiling/);
  assert.match(notice, /do not make the final hiring, rejection, vetting approval, placement, or payout decision on their own/);
});
