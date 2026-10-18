# VAPH authentication reliability gate and operational runbook

## Purpose

Prevent a repeat of the October 18 Turnstile login/password recovery loop without
relaxing Cloudflare Siteverify, Supabase Auth, email confirmation, RLS or rate limits.

**Scope:** Automated accounts and challenge credentials used in browser acceptance
are disposable or Cloudflare's published dummy keys. Never automate real learner
sign-in, force CAPTCHA completion or alter production accounts in unattended tests.

## CI test credentials and merging safeguards

The isolated browser gate uses Cloudflare's **published always-pass test keys**
as the CI workflow's fallback values. These are publicly documented dummy
credentials, not account secrets, and are scoped to the dedicated loopback-only
CI step. No repository variable or secret provisioning is required for this
test gate to execute.

Optional GitHub Actions overrides remain supported:
- Repository variable `VAPH_AUTH_E2E_TURNSTILE_SITE_KEY`
- Repository secret `VAPH_AUTH_E2E_TURNSTILE_SECRET_KEY`

Overrides must be **the same official test-only key pair**. The test rejects
missing/mismatched keys, non-loopback services and `VERCEL_ENV=production`.
Never copy dummy credentials into a production application or use production
credentials in CI. Source:
https://developers.cloudflare.com/turnstile/troubleshooting/testing/

Cloudflare's always-pass test verification does not preserve the widget's real
per-action value (it returns a generic `test` action or no action). The app
accepts this dummy-only response **only** when the dedicated gate is enabled
in Next.js development mode, all app/Supabase/request origins are loopback,
and both keys match the official dummy pair. For any real keys or deployed
Vercel environment, Siteverify action matching remains exact and fail-closed.
The dummy gate proves end-to-end test form navigation and server validation,
not production action binding; retain the manual live-provider acceptance.

The existing **Browser and database contracts** workflow runs:

1. Disposable Supabase bootstrap, RLS verification and seeded test roles.
2. Existing browser suites with Turnstile disabled (unchanged).
3. **New:** Turnstile-enabled browser journeys with a newly created local
   unconfirmed training user, confirmation via a sandbox Supabase-issued link,
   wrong-password retry, successful training login, password recovery, SPA
   navigation and missing-token rejection.

In GitHub **Settings → Rules → Rulesets**, protect main: require successful
**CI**, **Browser and database contracts**, and **CodeQL security scan** checks,
block direct pushes and require review. Repository workflow files alone do
not enforce branch protection; that requires administrator permission.
Do not merge while the required checks are failing.

## Production smoke and real-provider acceptance

The scheduled production browser smoke runs read-only. It loads live auth pages,
checks that challenge widgets and hidden inputs mount, and clicks the in-app
training signup → login link. It does not submit credentials, solve a live
challenge, create users or trigger recovery emails.

Cloudflare test keys **do not prove live production Siteverify acceptance**.
After any authentication, CAPTCHA, Supabase Auth setting or hostname change:

1. Confirm matching real production sitekey and server secret in Vercel, with
   both virtualassistant.com.ph and www.virtualassistant.com.ph allowed.
2. With authorized test identities in an ordinary browser, run training signup,
   email confirmation, login to training, wrong password → correct password,
   password recovery, and confirmation resend.
3. Check Cloudflare Turnstile Analytics for Siteverify success and failures,
   expected action and allowed hostname. Ensure expired and replayed tokens
   fail closed, and a new challenge can be completed.
4. Independently check Supabase Auth Dashboard bot/CAPTCHA protection. If native
   Supabase CAPTCHA is enabled too, it needs a compatible separate token
   strategy. A single-use token cannot be validated by two separate services.
   Do not quietly disable either security gate.
5. Confirm a fresh encrypted production backup and a known-good rollback
   deployment before approving significant auth changes.

## Continuous alerts

src/lib/auth-challenge-health.ts records fixed route/action/failure categories
in analytics_events, always with user_id=null and session_id=null.
No email, token, password, IP, account ID or secret is captured.
Persistence is best-effort with a short deadline; logging failure does not
change authentication decisions.

.github/workflows/auth-security-health-alert.yml runs every **10 minutes**
(GitHub scheduled starts may be delayed). It uses the existing repository
SUPABASE_DB_URL Actions secret for a read-only rolling 15-minute aggregate
query. It creates or reopens one deduplicated GitHub issue if:

- **3+** provider transport/configuration/hostname/action failures; or
- **15+** Siteverify token rejections; or
- **30+** missing or malformed tokens.

Only aggregate counts appear in GitHub. A DB-monitoring failure opens an
issue with the monitor_unavailable signal and fails the job; no security
gate is bypassed. The issue closes when the window returns below thresholds.
Set up GitHub Issue/Actions notifications for responsible operators. This
scheduled job is not a guaranteed real-time paging SLA.

## Incident response

1. Confirm the latest production deployment is READY on the expected main SHA.
2. Inspect the issue's aggregate counts and redacted [turnstile] logs for
   missing_or_malformed_token, siteverify_rejected,
   siteverify_http_failure, siteverify_request_failed,
   action_mismatch, hostname_mismatch, incomplete_configuration.
3. For widespread failures, verify Cloudflare keys, provider hostname settings
   and SPA challenge rendering first.
4. For an isolated user complaint, request a fresh login attempt. Check
   Supabase email-confirmed and suspended status only with authorized support
   access. Never mutate identity or ban metadata based on CAPTCHA alone.
5. Prefer reviewed rollback plus recoverable messaging if a release regresses;
   do not disable server-side verification as a workaround.

## Coverage boundaries

- Playwright tests use dummy keys, not actual production challenges. Real
  provider acceptance needs an authorized manual browser check.
- Email verification uses a sandbox-generated confirmation link; separately
  validate the transactional mail delivery path.
- Alerts cover app-observed, persisted failures only. Cloudflare edge blocks
  and database outages also need provider monitoring.
