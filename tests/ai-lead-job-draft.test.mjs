import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("public hiring briefs schedule AI enrichment only after the original lead action succeeds", async () => {
  const actions = await read("src/app/actions/ai-leads.ts");
  const form = await read("src/components/hiring-brief-form.tsx");

  assert.match(actions, /await submitServiceMatchAction\(previousState, formData\)/);
  assert.match(actions, /await submitIndustryMatchAction\(previousState, formData\)/);
  assert.match(actions, /after\(async \(\) =>/);
  assert.match(actions, /enrichPendingLeadJob/);
  assert.match(actions, /submitRoleBriefAction\(formData\)/);
  assert.match(actions, /throw error/);

  assert.match(form, /submitServiceMatchWithAiAction/);
  assert.match(form, /submitIndustryMatchWithAiAction/);
  assert.match(form, /submitRoleBriefWithAiAction/);
  assert.doesNotMatch(form, /action=\{submitRoleBriefAction\}/);
});

test("general role brief enrichment binds to the exact success redirect instead of guessing by email", async () => {
  const actions = await read("src/app/actions/ai-leads.ts");

  assert.match(actions, /NEXT_REDIRECT;/);
  assert.ok(actions.includes('url.pathname.match(/^\\/workspace\\/client\\/jobs\\/([^/]+)$/)'));
  assert.match(actions, /searchParams\.get\("lead"\)/);
  assert.match(actions, /\.eq\("id", leadId\)/);
  assert.match(actions, /searchParams\.get\("sent"\) !== "1"/);
  assert.doesNotMatch(actions, /\.ilike\("email"/);
  assert.doesNotMatch(actions, /10 \* 60 \* 1000/);
});

test("AI job drafts are grounded and cannot publish or release candidates", async () => {
  const generator = await read("src/lib/ai-job-draft.ts");

  assert.match(generator, /Ground every factual requirement in the supplied lead data/);
  assert.match(generator, /must not invent new mandatory duties, tools, years of experience, credentials, KPIs, benefits, compensation, schedules, company facts, or qualifications/);
  assert.match(generator, /If a detail is unknown, omit it/);
  assert.match(generator, /job\.status !== "pending"/);
  assert.match(generator, /\.eq\("status", "pending"\)/);
  assert.match(generator, /summary: draft\.summary/);
  assert.match(generator, /description: draft\.description/);
  assert.match(generator, /responsibilities: draft\.responsibilities/);
  assert.match(generator, /required_skills: draft\.requiredSkills/);
  assert.match(generator, /required_tools: draft\.requiredTools/);
  assert.doesNotMatch(generator, /status:\s*"published"/);
  assert.doesNotMatch(generator, /shortlist_status/);
});

test("AI generation is optional and preserves the saved fallback draft when unavailable", async () => {
  const generator = await read("src/lib/ai-job-draft.ts");
  const actions = await read("src/app/actions/ai-leads.ts");
  const env = await read(".env.example");

  assert.match(generator, /AI_GATEWAY_API_KEY/);
  assert.match(generator, /VERCEL_OIDC_TOKEN/);
  assert.match(generator, /if \(!apiKey\) return null/);
  assert.match(generator, /openai\/gpt-5\.6-luna/);
  assert.match(generator, /ai-gateway\.vercel\.sh\/v1\/chat\/completions/);
  assert.match(generator, /AbortSignal\.timeout\(10_000\)/);
  assert.match(actions, /AI enrichment is best effort/);
  assert.match(actions, /Preserve the original redirect/);
  assert.match(env, /AI_GATEWAY_API_KEY=/);
  assert.match(env, /AI_JOB_DRAFT_MODEL=/);
});
