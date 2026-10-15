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
