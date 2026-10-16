# VAPH P1 acceptance — employer hiring, training, real-model coach
Status: review-only. Date: October 16, 2026.
Tracking: PR #867, issues #904 and #905, follow-up PR #908.

## Evidence versus release

PR #908 uses a disposable loopback Supabase instance and test identities; it does not write production learner, customer, payment or hiring data. The existing employer placement Playwright flow in #867 creates a *synthetic manual paid fixture* and a *simulated Google Calendar event*. Neither proves successful external payment settlement or delivered invitations.

Production backup + isolated restore (#864) and protected main (#895) are complete. Historical documentation suggesting otherwise is out of date. Production Cloudflare Turnstile (#865) and file scanner (#891) remain operator-owned release blockers for affected features.

## 1. Employer journey — PR #867

Existing isolated coverage spans agency proposal acceptance, recruiter shortlist release, client interview request, client Proceed decision, two-sided placement offer acceptance, and exactly one workroom. It rejects a fabricated paid-access flag but then uses a local manual payment record; Calendar/Meet is simulated.

**External payment acceptance must use PayMongo test mode**, not Stripe. The VAPH payment action uses createPaymongoCheckoutSession, reads PayMongo checkout status during reconciliation, and uses its signed webhook handler in src/app/api/webhooks/paymongo/route.ts. Stripe support elsewhere does not substitute for PayMongo checks.

Operator procedure (pending; do not operate on live clients):
1. Provision an access-protected, non-production VAPH Preview connected to a distinct, isolated Supabase database. Verify its project URL and database identity before performing writes. Use fictional profiles and reserved test-only inboxes.
2. Use a PayMongo **test-mode** secret and matching test webhook secret in the isolated environment only. Block outward notification emails; do not use production transaction credentials.
3. Create an invoice with fictional values; go through the application's real checkout. Verify a genuine test settlement by PayMongo's webhook and server reconciliation, associated provider IDs, an accurate paid state and one authorized candidate-access transition. Do not accept the browser success redirect as payment evidence.
4. Replay a signed event and verify no duplicate payment, access grant or notification. Reject invalid signatures, malformed event payloads, mismatched IDs, and duplicate retries. Test cancelled, pending, failed, refund and dispute scenarios against separate fixtures.
5. For Calendar/Meet, use a dedicated test calendar and test OAuth client. Create a fictional interview, verify its event ID, timezone and Meet URL from the real API, then update and cancel it. Set notifyAttendees false or sendUpdates none for synthetic runs and never add real clients as guests. Invite delivery, if separately required, must be explicitly consented and use exclusively owned test inboxes.
6. Verify recruiter, client and VA authorizations block cross-account candidates, payment records, invoices and workrooms. Confirm idempotency prevents a second placement/workroom after retries.
7. Preserve redacted run IDs, provider event IDs and screenshots without secrets or personal data. Only approve release after fresh exact-head CI, CodeQL, isolated browser/DB tests, backup/restore, real Turnstile, a human observer and a rollback plan.

Draft #867 is **98 commits ahead and 191 behind** main at the October 16 comparison, with 40 changed files. Changes already shipped in #889 must be reconciled before a safe rebase and review. **Keep #867 draft** until operator-owned tests are actually completed; do not merge merely to expose its manual release preflight workflow.

## 2. Training transactional UAT — issue #904

New Playwright spec in #908: e2e/training-transactional-uat.spec.ts.
- Seeds an entirely new synthetic learner in local Supabase.
- Clicks actual Start VA Foundations; verifies enrollment persisted and redirect points to first published lesson.
- Checks unfinished lesson button disabled, no false progress, checkpoint interaction, and persisted reading/scroll; checks returning to the enrollment does not create duplicate rows.
- Selects an Australian specialization, verifies saved preference and real course navigation.
- Validates admin-only training/activation access and absence of synthetic learner email in reports, with mobile/desktop screenshot evidence.
- Default Browser and database contracts CI uses disposable Supabase and now retains screenshots in the vaph-training-uat GitHub Actions artifact for 14 days.

**Still pending:** actual completion of lessons after legitimate time, scroll, checkpoint, exercise and prerequisite gates; final practical/scored assessment; grade/review/certificate issuance only after valid completion; verifying the admin aggregates against known fixture SQL totals; explicit fail-closed errors. Never bypass lesson integrity by directly writing production completion or certificates.

An isolated CI pass is necessary but is not full manual acceptance. Verify the exact commit before closing #904.

## 3. Real AI Coach — issue #905

The deployed Foundations AI Coach code (#892) is feature-flagged OFF in Production. Existing 6/6 mocked E2E coverage uses LOCAL TEST COACH replies, not a provider model.

PR #908 adds e2e/training-coach-real-model-uat.spec.ts and a manually dispatched workflow, training-coach-real-model-acceptance.yml. The workflow is **not available for dispatch until reviewed and merged to protected main**, and is further gated by:
- Repository variables VAPH_COACH_LIVE_MODEL_UAT_ALLOWED=true and VAPH_AI_GATEWAY_BUDGET_CONFIRMED=true.
- A GitHub environment named vaph-ai-coach-sandbox with independent required reviewers.
- A budgeted, limited-use Gateway API key stored only in the environment secret VAPH_AI_COACH_SANDBOX_GATEWAY_KEY.
- A disposable loopback Supabase database, synthetic Foundations learner, explicit allowlist and manual opt-in.
- A reviewed model ID from the live AI Gateway catalog before running. Current workflow proposes openai/gpt-5.4-mini; verify availability and current pricing, data processing and budget beforehand.

It makes at most four real model calls through the actual VAPH coach route (Explain, fictional Practice, Review and hostile prompt), and verifies no access for a nonallowlisted role, official answer refusal and no certificate created. No paid calls run on ordinary PR pushes. It retains fictional response/latency data as a protected short-lived artifact for human grading. **This is a local app/provider test, not hosted Vercel Preview acceptance.** The project/key budget is not created by #908.

Still required for #905:
1. Provision a genuine non-production VAPH Supabase branch/project, not an unrelated connected account or the live database.
2. Protect Vercel Preview access. Configure server-only Gateway authentication, Preview-only enable flag and 1–3 synthetic, approved allowlisted learners. Keep Production disabled.
3. Test real grounding, hallucinations, injection and assessment extraction; role and lesson boundaries; 429 quotas; invalid JSON and 502/503 fallback; and the flag-off rollback.
4. Inspect actual provider/Gateway Logs and costs, provider retention terms, mobile UX, screen-reader affordances and privacy disclosure. Verify no grade/certificate/progress mutations.
5. Record protected-preview screenshots and an explicit operator go/no-go. No production pilot until authorized.

## Completion definitions

Use evidence-linked labels: CODE REVIEWED; LOCAL E2E PASSED; PROVIDER SANDBOX PASSED; PROTECTED PREVIEW PASSED; OPERATOR APPROVED.

None of #867, #904, #905 should be closed until their *specific* checklists are satisfied. This document authorizes no live charges, calendar invitations, communications, merge, Vercel deployment, or production feature activation.
