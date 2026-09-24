import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("public job sitemap uses the hardened public view and paginates", async () => {
  const sitemap = await read("src/app/sitemap.ts");
  assert.match(sitemap, /\.from\("public_jobs"\)/);
  assert.doesNotMatch(sitemap, /\.from\("jobs"\)/);
  assert.match(sitemap, /\.range\(from, from \+ JOB_PAGE_SIZE - 1\)/);
});

test("application resume route resolves the current VA resume after authorization", async () => {
  const route = await read("src/app/api/resume/[applicationId]/route.ts");
  assert.doesNotMatch(route, /select\([^\n]*profile_snapshot/);
  assert.match(route, /\.from\("va_profiles"\)/);
  assert.match(route, /\.select\("resume_path"\)/);
  assert.match(route, /\.eq\("user_id", application\.va_id\)/);
});

test("resume auto-fill bounds untrusted PDF and DOCX processing", async () => {
  const [parser, action] = await Promise.all([
    read("src/lib/resume-parsing.ts"),
    read("src/app/actions/resume-autofill.ts"),
  ]);
  assert.match(parser, /MAX_EXTRACTED_TEXT/);
  assert.match(parser, /MAX_PDF_PAGES/);
  assert.match(parser, /MAX_DOCX_UNCOMPRESSED_BYTES/);
  assert.match(parser, /MAX_DOCX_COMPRESSION_RATIO/);
  assert.match(parser, /%PDF-/);
  assert.match(parser, /0x04034b50/);
  assert.match(action, /Promise\.race/);
  assert.match(action, /8_000/);
});

test("talent directory uses database-side hybrid search without a 200-profile cap", async () => {
  const [page, service, migration] = await Promise.all([
    read("src/app/find-talent/page.tsx"),
    read("src/lib/talent-search.ts"),
    read("supabase/migrations/20260924204500_public_talent_hybrid_search.sql"),
  ]);
  assert.match(page, /searchPublicTalent/);
  assert.doesNotMatch(page, /\.limit\(200\)/);
  assert.match(service, /search_public_va_directory_hybrid/);
  assert.match(service, /syncPublicTalentEmbeddings/);
  assert.match(migration, /create extension if not exists vector/i);
  assert.match(migration, /private\.public_va_directory_rows\(\)/);
  assert.match(migration, /websearch_to_tsquery/);
  assert.match(migration, /vector_cosine_ops/);
});

test("privacy and compliance records explicitly classify candidate matching as profiling", async () => {
  const [privacy, classification] = await Promise.all([
    read("src/app/privacy/page.tsx"),
    read("docs/compliance/npc-dps-profiling-classification.md"),
  ]);
  assert.match(privacy, /Matching, profiling, and AI-assisted search/);
  assert.match(privacy, /not automatic hiring or rejection decisions/);
  assert.match(classification, /classified internally as a Data Processing System involving \*\*profiling\*\*/);
  assert.match(classification, /NPCRS/);
});
