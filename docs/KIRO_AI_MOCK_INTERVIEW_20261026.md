# Kiro AI Mock Interview Studio — 26 October 2026

## Scope
The authenticated route `/workspace/training/coach/mock-interview` builds on the merged Kiro Career Studio (#953) and lesson coach (#952) without changing either feature's existing provider or assessment contracts.

- Select from **published VAPH courses in which the signed-in learner is enrolled**. The server repeats enrollment checks on every AI request.
- Six fictional interview rounds with Recruiter → Client → Senior VA Trainer repeated.
- Beginner, intermediate and advanced prompts, VA category focus, local follow-up cues, retry, and a self-review report.
- Five weighted categories (25/20/20/20/15) are an **unscored reference rubric**, not an employability grade or ranking.
- No training marks, certificates, hiring matches, applicant profiles or enrollment records are changed.
- The existing one-question Career Studio exercise is unchanged; a link leads to the new studio.

## Two modes
**Offline guided panel** is available to enrolled learners. It builds questions and transparent keyword-based reflection cues entirely in React memory. It makes no model requests, stores no drafts in localStorage/sessionStorage or VAPH databases, and does not pretend to grade quality. A user can manually copy their practice transcript.

**Adaptive AI panel** is a separate, opt-in, allowlisted pilot only. Each submitted answer, earlier fictional questions/answers, and limited published course title, summary and lesson titles go to the external model. The server does not include official assessment prompts, resource packs, answer keys or learner grades. The UI states this is external processing, and VAPH does not save the chat in the training account. Provider retention is separate and must be reviewed.

The AI server requires all of:
- `AI_MOCK_INTERVIEW_ENABLED=true`
- `AI_MOCK_INTERVIEW_REAL_MODEL_ENABLED=true`
- `AI_MOCK_INTERVIEW_PROVIDER_APPROVED=true` (only after legal/privacy and data-processing review)
- `AI_MOCK_INTERVIEW_FREE_ONLY=true`
- A vetted model identifier in `AI_MOCK_INTERVIEW_MODEL`; its input and output prices must both be **currently and explicitly zero** in AI Gateway's catalog on every request
- Server-only `AI_GATEWAY_API_KEY` or `VERCEL_OIDC_TOKEN`; explicit `AI_MOCK_INTERVIEW_PILOT_USER_IDS` with selected synthetic/approved pilot learners

These flags are **absent/false by default**. No settings, secrets or deployment environments are modified in this PR. Never enable the unapproved Reflection free provider for real learners merely because pricing is zero.

The API at `/api/training/mock-interview` fails closed: feature flag, authenticated non-banned session, pilot allowlist, same-origin JSON, strict six-round transcript parser, authenticated published-course enrollment, graded-answer refusal, atomic per-learner 30-request/24-hour limit, provider approval, zero-cost catalog check, provider authentication and bounded provider response validation. No logging of answer text.

## Local fixture and acceptance
`AI_MOCK_INTERVIEW_E2E_MOCK=true` returns clearly labeled **LOCAL TEST INTERVIEW** messages only when `NODE_ENV=development`, `AI_MOCK_INTERVIEW_ENABLED=true` and the Supabase URL is a loopback HTTP address. It runs **after** actual authentication, course checks and the atomic limiter; it never calls AI Gateway. Local-only synthetic tests must never target a hosted database or live learners.

CI adds:
- `tests/kiro-ai-panel-interview.test.mjs`: round order, rubric sum, prompt constraints, transcript rejection, provider and privacy gates.
- `e2e/kiro-mock-interview.spec.ts`: anonymous redirect, enrolled VA end-to-end offline six-round flow, answer non-egress, mobile overflow and screenshots.
- `e2e/kiro-ai-panel-interview-pilot.spec.ts`: isolated anonymous / unenrolled denial and full synthetic mock AI conversation.
- Existing `training-coach-pilot.yml` runs the new synthetic mode in a **separate Playwright step** with step-local flags, leaving live-model settings unchanged.

## Release criteria
1. Exact PR head passes npm test, typecheck, production build, CodeQL, isolated browser/database journeys, all-role browser smoke and synthetic interview pilot.
2. Independent human reviews security, privacy, copy and mobile screenshots; close any issues before merge.
3. The offline page can be shipped independently. AI mode remains disabled until issue #905's real-model policy and pilot requirements, acceptable provider retention/training terms, clear learner notices, model QA and operational cost controls are approved.
4. Separate restricted preview pilot with real model, a non-production database and fictional answers. Test injection, answer-key extraction, rate limits, permission bypass, provider outage, kill switch, latency, budget, accessibility and rollback.
5. Any production rollout requires a separate go/no-go decision. To disable AI inference, set `AI_MOCK_INTERVIEW_REAL_MODEL_ENABLED=false` (and `AI_MOCK_INTERVIEW_ENABLED=false`), then redeploy; offline scripted practice remains available.
