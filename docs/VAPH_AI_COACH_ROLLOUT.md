# VAPH AI Coach — Phase 1 rollout and rollback

## Preserved state (2026-10-15)
- Repository: erwinmehehe/virtualassistant-ph-webapp
- Original main commit: e57db9540a381ed3f6e585d71f8800a97518d568
- Backup branch: backup/pre-vaph-ai-coach-2026-10-15
- Development branch: feature/vaph-ai-coach-phase1
- Original production main was not changed when this feature was developed.

## Scope and persistence
- Only the Virtual Assistant Foundations lesson page offers the AI Coach.
- Only a signed-in, course-enrolled learner can access the API.
- Lesson context and learner progress come from VAPH's existing training system, never from client-provided lesson text.
- The client holds the conversation in React memory; chats disappear on navigation/reload and are not saved to training tables.
- Learner messages are transmitted to Vercel AI Gateway and its model provider to produce replies; browser-only chat history does not imply provider-side non-retention. Verify provider data handling before inviting real learners, and never submit client credentials or identifiable client data.
- No new tables, migrations, or RLS changes are required for Phase 1.
- The existing Supabase consume_action_rate_limit RPC enforces 20 requests per learner per 24-hour window.
- AI Coach cannot write grades, certificates, enrollment, progress, or official assessment submissions.

## Configuration and feature flag
Set these server-side Vercel environment variables on a preview deployment only:
- AI_TRAINING_COACH_ENABLED=true (otherwise UI is hidden and API returns HTTP 404)
- AI_GATEWAY_API_KEY (or an existing working server-side VERCEL_OIDC_TOKEN)
- AI_TRAINING_COACH_MODEL (optional; default openai/gpt-5.4)

Keep AI_TRAINING_COACH_ENABLED unset or false in production until the checks below pass. Never add any API key with NEXT_PUBLIC_.

## Preview checks before rollout
1. Run npm ci, npm run typecheck, npm test, and npm run build in a CI environment.
2. Confirm no AI Coach panel is visible and POST /api/training/coach returns 404 with the flag unset.
3. In preview with the flag enabled, sign in as a learner enrolled in published Virtual Assistant Foundations.
4. Confirm Explain, Practice and Review modes answer based on the current lesson, with no invented lesson claims.
5. Verify the same session cannot call the endpoint for an unpublished lesson, another course, a non-existent lesson, or without authentication.
6. Confirm errors are friendly when the gateway key is absent, the model fails, or the 20-request limit is reached.
7. Confirm prompts asking for assessment answer keys do not return official answers.
8. Check narrow mobile screens and keyboard/screen-reader labels.
9. Confirm lesson checkpoints, certificates, assessment completion, and existing marketplace flows still work.

## Immediate kill switch
Set AI_TRAINING_COACH_ENABLED=false in the target Vercel environment and redeploy that target environment. The coach UI is hidden and the API returns 404. This can disable coaching without changing database state.

## Code rollback
If not merged: close the draft PR. Production main is unaffected.
If merged: revert the coach merge commit via a new PR (preferred), or redeploy the last known-good production deployment. The backup branch points to the original pre-coach code. The exact original commit above is the authoritative recovery point even if branch tips later move.

Do not force-reset shared main. Preserve unrelated changes made after the original commit when reverting.

## Database rollback
No schema migration was made for the coach. Existing course records and certificates are unchanged. The existing rate limiter writes its normal request counters; these are short-lived operational state, not training data. A full production database snapshot is not created by this GitHub backup and should be managed separately via the Supabase project's backup procedures before any future schema-changing phase.

## Limitations of the pilot
- Coaching requires a configured, healthy AI Gateway connection.
- Chat history is not persisted; the AI uses only the recent messages supplied by the learner's current browser session.
- The coach provides non-graded feedback, not a certification decision.
- Daily rate limits are enforced by the existing Supabase rate-limiting RPC; failures fail closed.

## Isolated coach API and browser pilot

The GitHub Actions training-coach-pilot workflow runs Chromium against a
fresh local Supabase environment without model credentials or migrations.
It tests anonymous 401, unenrolled 403, invalid 400, authentic learner
enrollment, all three coaching modes, desktop/mobile screenshots,
assessment-answer refusal and the 429 daily request quota.

AI_TRAINING_COACH_E2E_MOCK=true returns explicitly labeled LOCAL TEST COACH
replies, and works only with NODE_ENV=development and loopback Supabase.
The normal broad browser suite skips this dedicated test when unset.
No actual AI responses are evaluated in this workflow.

Before enabling on production, connect the real VAPH Vercel team and create
a preview. Configure server-side AI_GATEWAY_API_KEY and set
AI_TRAINING_COACH_ENABLED=true for preview only. Test real answer quality,
prompt-injection refusals, model costs and error behavior before release.
Keep production disabled and preserve the backup branch
backup/pre-vaph-coach-pilot-e2e-2026-10-15.

## Small-group rollout allowlist

The server-side AI_TRAINING_COACH_PILOT_USER_IDS environment variable is required
for real preview or production access. Set it to comma-separated Supabase auth
user IDs of approved Foundations pilot learners. When it is empty, no real
learner sees the panel or can call the API, even if the ENABLED flag is true.
The isolated development-only browser fixture permits local test accounts with
a loopback Supabase URL and is not available in a production runtime.
Keep this allowlist limited to a small group until real AI answer quality and
operational support are established.

## October 17, 2026 — free-only model pilot preparation

- Vercel Preview has `AI_TRAINING_COACH_MODEL=reflection/beam-free`; it is still **disabled** (`AI_TRAINING_COACH_ENABLED=false`). **Production remains disabled**.
- The operator-gated isolated GitHub real-model acceptance workflow proposes `reflection/beam-free` instead of the paid GPT model. It uses disposable loopback Supabase users only, a secret restricted to the `vaph-ai-coach-sandbox` environment, and four controlled real requests at most.
- `AI_TRAINING_COACH_FREE_ONLY=true` makes the API reject any model other than `reflection/beam-free`; for future hosted trials add this variable in Preview only. There is no paid-model fallback in the request body. If the free offer ends or the model becomes unavailable, return an error instead of substituting a paid model.
- The Vercel Preview environment currently has no distinct sandbox Supabase credentials, so **do not enable Preview** until a separate disposable non-production Supabase project/branch and protected deployment access are confirmed.
- AI Gateway authentication and billing eligibility still require separate verification, even for a model currently advertised at zero token price. Do not assume a zero-priced model removes provider authorization, verification, or other platform charges.
- Preserve `VAPH_COACH_LIVE_MODEL_UAT_ALLOWED` and `VAPH_AI_GATEWAY_BUDGET_CONFIRMED` dispatch gates, require the approved operator key, confirm the live model catalog at runtime, inspect provider logs, and document human acceptance before any production activation.
- Local fixture `LOCAL TEST COACH` passes do not prove live-model operation. No learner traffic or model inference is activated by this preparation.
