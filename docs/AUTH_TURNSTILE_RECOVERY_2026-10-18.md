# October 18, 2026: training login security-check recovery

## Report and diagnosis

A newly registered, email-confirmed learner reports a repeating "Please complete the security check" error while signing in and requesting password recovery. Do **not** copy the person's contact details or recovery links into source control.

The error is emitted by the VAPH server actions **before** Supabase password authentication or recovery runs. It therefore does not prove that an Auth user is banned or that their password is invalid.

Three app-level risks were found:

- The shared widget relied on Cloudflare's one-time automatic script scan. Next.js client navigation can mount later forms without rendering a new challenge, so their POST contains no response token.
- Turnstile tokens expire and are single-use. A rejected form action must reset its widget before a subsequent attempt.
- A login rejected by the challenge dropped `next=/workspace/training...`, unnecessarily returning learners to generic login.

## Proposed code behavior

Render each widget explicitly when its React component mounts, including after client navigation. Keep its response in the expected form field; clear it on expiry/error and reset after completed or failed form actions. Provide an accessible retry control. Preserve validated internal `next` and lead parameters on challenge errors. Leave server-side Cloudflare Siteverify, hostname/action checks, rate limiting and other login restrictions intact.

**No account mutations, bypass flags, production setting changes or new paid services are included.**

## Release and incident acceptance

1. Require exact-PR-head typecheck, lint, test, build, CodeQL and isolated browser checks. Existing normal E2E jobs run with Turnstile off; passing them alone does **not** verify real Cloudflare service behavior.
2. On an authorized real widget configured for the intended hostname, browse from `/auth/join/training` to `/auth/login?next=%2Fworkspace%2Ftraining` via in-app navigation. Confirm the challenge appears. Enter a wrong password, then a valid password; ensure the token is refreshed, and the training destination is retained through any challenge errors.
3. Exercise `/auth/forgot` and `/auth/login?confirm=1` confirmation resend, as well as both role signups and contact/hiring forms, with valid and rejected/expired responses. Do not use a real customer's account in synthetic tests.
4. Verify real production Siteverify success and failures via the owner's Cloudflare Turnstile Analytics. Confirm both production widget hostnames and that production Vercel deploy has matching site and secret key variables. Do not place the keys or real tokens in GitHub, and never turn verification off to make tests pass.
5. For persistent rejects, inspect **redacted** Vercel function log categories: `missing_or_malformed_token` indicates absent/invalid form response, `validation failed` includes provider error codes, and `action mismatch` / `hostname mismatch` distinguish configuration errors. Vercel Hobby log retention is short; lack of historical logs is not evidence of success.
6. After successful deployment, ask the affected learner to retry through a new login page session. If it still fails with a valid provider challenge, an authorized support operator should review the Supabase Auth account's confirmation and suspension state separately without changing identity/ban metadata automatically.

Keep the existing public-job auto-publication feature flag disabled and preserve all independent production release gates.
