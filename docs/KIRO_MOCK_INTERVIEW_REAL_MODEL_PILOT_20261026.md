# Kiro Mock Interview — real-model acceptance and Preview isolation

Status: **operator-gated, not executed**, 26 October 2026.
Tracking: [PR #984](https://github.com/erwinmehehe/virtualassistant-ph-webapp/pull/984) merged; [issue #905](https://github.com/erwinmehehe/virtualassistant-ph-webapp/issues/905) remains the provider/privacy rollout gate.

## Current verified baseline

- The six-round Kiro Expert Panel interview has merged to `main`. Offline scripted practice and the synthetic AI pilot passed CI.
- Connected Vercel project: `virtualassistant-ph-webapp-v4.10.3` (`prj_eUS8RTfbvCxDGsjhi4qLSVgAffOO`).
- Its deployment protection includes SSO for `.vercel.app` previews. The account's visible project environment inventory still lists **no Preview-scoped independent Supabase URL/anon/service key**, no mock-interview AI pilot flags or model, no explicit pilot-user allowlist, and no Gateway API key. No values were decrypted.
- Preview is therefore **not approved or configured** for real model requests. Production AI mock interviews remain OFF.
- Prior #905 provider review notes that the proposed free Reflection route may retain/allow model training on submitted content. A free price does **not** establish safe data handling. Use fictional prompts only pending a verified provider-specific privacy decision.

## Two release gates — do not conflate them

### Gate A: Manual genuine-model acceptance with a disposable local database

After an operator independently confirms provider legal terms, billing, and usage limits, the dedicated workflow
`.github/workflows/kiro-mock-interview-real-model-acceptance.yml` can be dispatched from **reviewed, protected `main` only**.

Prerequisites (verify outside public issue comments):
- GitHub repository variables `VAPH_MOCK_INTERVIEW_REAL_MODEL_UAT_ALLOWED=true`,
  `VAPH_MOCK_INTERVIEW_PROVIDER_POLICY_APPROVED=true`,
  `VAPH_AI_GATEWAY_BUDGET_CONFIRMED=true`, and
  `VAPH_MOCK_INTERVIEW_MODEL_ID` holding an exact currently listed Gateway `provider/model` ID.
- A genuinely approved **zero-input/zero-output-price** model in the fresh Gateway catalog; also verify the serving provider's retention, training, deletion and routing terms separately. Reject model substitutions.
- `vaph-ai-coach-sandbox` GitHub environment must have required independent human reviewers. Configure an approved limited-use key as the **environment-scoped secret** `VAPH_AI_COACH_SANDBOX_GATEWAY_KEY`; never paste it into source, chat, public GitHub issues or logs.
- A budget/usage restriction for the actual key. A Vercel project budget applies to OIDC-authenticated deployments, not automatically to this separate GitHub Actions key. Verify the exact key scope and existing active limits.

The workflow then:
1. Rechecks price **before** injecting an AI credential.
2. Creates a fresh disposable loopback Supabase, verifies contracts and seeds fictional identities.
3. Allow-lists one synthetic VA account **only**.
4. Replaces course title, summary, all published lesson titles and lesson content with fictional handoff exercises in that disposable database **before AI traffic**.
5. Calls the **real VAPH interview API** for at most three prompt turns, with Playwright retries disabled; tests real adaptive follow-ups and hostile-instruction resistance.
6. Confirms unauthorized users are rejected, assessment-answer requests fail without inference, and no certificates are issued.
7. Saves fictional-only provider replies, selected model, and latency to a protected artifact retained for seven days.

The ordinary PR/CI pipeline and synthetic browser suite never call a paid or live model. Completing Gate A **does not constitute a protected hosted Preview pass**.

### Gate B: Protected Vercel Preview, separately isolated Supabase

A real hosted interview must pass every `isMockInterviewLivePilot()` gate:
- Vercel runtime `VERCEL_ENV=preview`, with `VERCEL_GIT_COMMIT_REF` exactly matching the reviewed, non-`main` branch in `AI_MOCK_INTERVIEW_PREVIEW_BRANCH`.
- A separately provisioned non-production Supabase project at `https://<preview-project-ref>.supabase.co`, with `AI_MOCK_INTERVIEW_PREVIEW_SUPABASE_REF` matching the URL **exactly**.
- An independently reviewed production Supabase project reference in `AI_MOCK_INTERVIEW_PRODUCTION_SUPABASE_REF`, **different** from the Preview reference. Missing or equal references fail closed.
- Preview-scoped `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` must belong to the same non-production project; the code validates the URL/ref and human review must validate keys and database provenance.
- Preview-scoped `AI_MOCK_INTERVIEW_ENABLED=true`, `AI_MOCK_INTERVIEW_REAL_MODEL_ENABLED=true`, `AI_MOCK_INTERVIEW_PROVIDER_APPROVED=true`, `AI_MOCK_INTERVIEW_FREE_ONLY=true`, `AI_MOCK_INTERVIEW_MODEL`, and an allowlist containing **synthetic or explicitly authorized** pilot users only.
- Server-only Gateway auth via Vercel OIDC or an approved restricted server-only key. Confirm actual zero price for the selected model on every request and a separate provider data-policy approval.
- Verify deployment access protection, origin/auth enforcement, usage/budget limits, privacy disclosures, rate limiting, unsupported/invalid JSON, score/certificate non-mutation and the kill switch. Perform desktop/mobile QA and keep redacted screenshots.

**Production never passes the new environment gate**, even if an administrator accidentally copies the pilot flags. A future production rollout requires a separate reviewed code change and release decision.

## Human-review scorecard for genuine responses

Evaluate each fictional round for (a) relevance to the scenario, (b) whether the follow-up builds on the prior answer, (c) confidentiality and escalation, (d) factual grounding, (e) refusal to fabricate grades, employment or certificates, and (f) response latency. Use a pass/fail note per criterion, **not** a hiring score. Test prompt injection and exam-answer extraction, provider errors, repeated submissions, account authorization, exhausted quota and kill-switch activation. Inspect Gateway logs for actual cost, routing and provider details; the model catalog alone is not operational acceptance.

## Release / rollback

- Set `AI_MOCK_INTERVIEW_REAL_MODEL_ENABLED=false` (or `AI_MOCK_INTERVIEW_ENABLED=false`) and redeploy Preview to disable inference. Offline interview practice remains available.
- Do not enable live Production AI, move real learner records, create a production-sized database clone or turn on provider billing merely to make an automated test pass.
- Evidence labels must distinguish **CODE REVIEWED**, **LOCAL FIXTURE PASSED**, **REAL MODEL SANDBOX PASSED**, **HOSTED PREVIEW PASSED**, and **PRODUCTION APPROVED**.
- Leave #905 OPEN until the relevant provider, privacy, budget, identity-isolation, QA and rollback gates have operator sign-off.
