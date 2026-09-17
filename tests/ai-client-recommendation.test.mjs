import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("selecting a VA triggers a grounded AI client recommendation without releasing the candidate", async () => {
  const generator = await read("src/lib/ai-client-recommendation.ts");
  const action = await read("src/app/actions/ai-client-recommendation.ts");
  const table = await read("src/components/matching-candidate-table.tsx");

  assert.match(generator, /openai\/gpt-5\.6-luna/);
  assert.match(generator, /ai-gateway\.vercel\.sh\/v1\/chat\/completions/);
  assert.match(generator, /Ground every claim in the supplied role and VA evidence/);
  assert.match(generator, /Do not invent/);
  assert.match(generator, /500/);
  assert.match(generator, /generateClientRecommendation/);

  assert.match(action, /export async function generateClientRecommendationAction/);
  assert.match(action, /generateClientRecommendation/);
  assert.match(action, /client_recommendation/);
  assert.match(action, /shortlist_status:\s*status/);
  assert.doesNotMatch(action, /shortlist_status:\s*"released"/);

  assert.match(table, /generateClientRecommendationAction/);
  assert.match(table, /onChange=/);
  assert.match(table, /Generating recommendation/);
  assert.match(table, /Regenerate with AI/);
  assert.match(table, /AI-generated, recruiter editable/);
});

test("AI recommendation generation is optional, editable and never changes the release gate", async () => {
  const generator = await read("src/lib/ai-client-recommendation.ts");
  const action = await read("src/app/actions/ai-client-recommendation.ts");
  const table = await read("src/components/matching-candidate-table.tsx");

  assert.match(generator, /AI_GATEWAY_API_KEY/);
  assert.match(generator, /VERCEL_OIDC_TOKEN/);
  assert.match(generator, /if \(!apiKey\) return null/);
  assert.match(generator, /AbortSignal\.timeout\(10_000\)/);
  assert.match(action, /existing\?\.shortlist_status === "released" \? "released" : "proposed"/);
  assert.match(table, /Save client note/);
  assert.match(table, /textarea/);
});
