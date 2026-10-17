# VAPH client chat abuse guard + Auth ban reconciliation

Scope: focused follow-up for [trust-and-safety issue #903](https://github.com/erwinmehehe/virtualassistant-ph-webapp/issues/903). **No change to public posting flags, learner access, ID requirements, fees, providers, or production data.**

## New controls

- Client-to-recruiter messages: atomic, account-wide rate limits using the existing server-only Supabase RPC: **8 sends/minute** and **40 sends/hour**.
- Repeated normalized text of 24+ characters: **maximum two attempts in 15 minutes**, across client threads. Unicode NFKC, case, and whitespace are normalized for the repeated-text fingerprint; text is hashed inside the existing atomic limiter. Short acknowledgements remain subject to general limits, not repeated-text detection.
- Authenticate the client/recruiter, resolve the conversation and verify client/thread consistency **before** charging counters; reject over-4,000-character messages rather than silently truncating.
- The existing SQL moderation trigger still flags off-platform circumvention for human review. This patch **does not auto-ban or auto-flag** repeated text. A message blocked by the limiter is not saved as chat, so neither a recruiter nor the moderation queue sees the blocked attempt. Rate-limit warnings contain only a hashed subject prefix.
- Admin moderation now checks Supabase Auth API errors **and** reads back `banned_until`. If confirmation fails, the profile stays blocked, the audit records `auth_ban_verified: false`, and the action surfaces a reconciliation error.
- Admins can use **Verify / retry Auth ban** on already-banned accounts. This is explicitly restricted to administrators and banned profiles; it cannot ban active profiles or administrators.
- Unban requires verified Auth release before restoring the VAPH profile. Provider failures keep the VAPH profile restricted and record an audit event.
- The existing `getSessionProfile` / `getFastRoleProfile` banned-status checks continue to reject still-authenticated sessions before protected actions.

## Automated regression checks

Run `node --test tests/client-chat-abuse-auth-ban.test.mjs` and normal CI. Tests check the guard order, dedicated atomic limiter permissions, duplicate-text normalization, server-side provider readback, admin-only reconciliation, non-admin targets, and fail-closed unban sequencing.

## Manual non-production acceptance

1. Authenticate as a fictional client using a **disposable local Supabase instance**; confirm eight distinct chat sends in one minute are accepted and the ninth is blocked. Confirm the protected recruiter can still reply.
2. Send the same text of 24+ characters three times; confirm the third is blocked. Change case/whitespace and confirm it is still treated as the same text. Confirm a different client has independent counters.
3. Send short acknowledgements across two roles: they should not hit the repeat-text rule. Validate 4,001 characters are rejected without storing a truncated message.
4. Validate invalid thread ID and mismatched client ID cannot create a message; no external notifications or CRM activity should be generated.
5. Using a local Auth test user, simulate provider API rejection on ban: the VAPH profile remains banned, an audit record notes non-confirmation, and the moderation page offers the reconciliation action.
6. With a provider-confirmed ban, use the admin-only reconciliation action twice; both must be safe and idempotent. Attempt it with a non-admin, an active profile, and an admin target; all must fail.
7. Simulate provider unban failure: the VAPH profile stays banned. With provider-confirmed unban, ensure the profile becomes active and the admin audit trail identifies the transition.
8. Check desktop/mobile moderation UI and that all private chat metadata remains inaccessible to unauthenticated users.

## Limits and rollout

- No claim of complete fraud prevention or government-ID verification. Rate limits can be evaded by changing longer text; moderation is still human-led.
- The in-flight production incident needs **independent operator readback** of the specific suspended account's Auth state using the admin-only workflow. This PR does not access or alter that account.
- Run exact-head CI, CodeQL and isolated browser/database checks; then obtain human approval before merge. Existing Production Cloudflare Turnstile/auto-publication acceptance remains separately blocked under #865.
- Do not add paid services, create synthetic production chat records, change Auth providers, or mark real employer/payment acceptance complete.
