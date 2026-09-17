import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("selecting a VA can trigger a grounded AI client recommendation without releasing the candidate", async () => {
  const generator = await read("src/lib/ai-client-recommendation.ts");
  const actions = await read("src/app/actions/client-shortlist.ts");
  const table = await read("src/components/matching-candidate-table.tsx");
  const matching = await read("src/components/staff-job-matching.tsx");

  assert.match(generator, /openai\/gpt-5\.6-luna/);
  assert.match(generator, /ai-gateway\.vercel\.sh\/v1\/chat\/completions/);
  assert.match(generator, /Ground every claim in the supplied role and VA evidence/);
  assert.match(generator, /Do not invent/);
  assert.match(generator, /500/);
  assert.match(generator, /generateClientRecommendation/);

  assert.match(actions, /export async function generateClientRecommendationAction/);
  assert.match(actions, /generateClientRecommendation/);
  assert.match(actions, /client_recommendation/);
  assert.match(actions, /shortlist_status:\s*status/);
  assert.doesNotMatch(actions, /shortlist_status:\s*"released"/);

  assert.match(table, /generateClientRecommendationAction/);
  assert.match(table, /onChange=/);
  assert.match(table, /Generating recommendation/);
  assert.match(table, /Regenerate with AI/);
  assert.match(matching, /generateClientRecommendationAction/);
});

test("client release backfills missing AI recommendations but preserves recruiter edits", async () => {
  const matchingActions = await read("src/app/actions/matching.ts");

  assert.match(matchingActions, /generateClientRecommendation/);
  assert.match(matchingActions, /client_recommendation/);
  assert.match(matchingActions, /mode === "release"/);
  assert.match(matchingActions, /existingRecommendation/);
  assert.match(matchingActions, /existingRecommendation \|\|/);
});
