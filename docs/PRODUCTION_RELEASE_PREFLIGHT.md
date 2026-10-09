# Production release preflight

A **read-only, fail-closed** safety check for VirtualAssistantPH. The check
does not merge a PR, alter data, send customer messages, deploy, reveal secrets,
or authorize production traffic. Its output is an audit report, **not** an
automated production approval.

## What is checked

1. The selected PR is open, non-draft, and has a valid exact head commit.
2. CI, CodeQL, and browser/database workflows passed on that same commit.
3. The latest default-branch **encrypted production backup** was successful
   within 48 hours, with a *successful isolated restore* and retained artifact.
   Skipped, failed, missing, or stale steps all block.
4. Both Cloudflare Turnstile variable names exist in the Vercel **Production**
   environment. This is a metadata-only check; it never decrypts values.
5. Even if all checks pass, the result is OPERATOR_REVIEW_REQUIRED and the
   command returns code 2. A human must validate real token rejection, backup
   recoverability, calendar/payments, and rollback before authorizing release.

## Local unit tests

    node --test tests/production-release-preflight.test.mjs

These tests run under the repository's existing npm test/CI workflow. They use
only fictional snapshots and never call production APIs.

## One-time setup for a reviewed main branch

- For the GitHub Actions **Production release preflight (read only)** workflow,
  configure a least-privilege repository Actions secret VERCEL_TOKEN with
  read access to the *correct* Vercel project. The built-in ephemeral
  github.token provides GitHub metadata read permissions.
- The script defaults to Vercel project
  prj_eUS8RTfbvCxDGsjhi4qLSVgAffOO, but confirms only env **names and
  scopes**, not values. For team-owned projects, configure VERCEL_TEAM_ID
  directly in the trusted runner or pass --vercel-team-id.
- To make the existing backup workflow pass, configure SUPABASE_DB_URL and
  BACKUP_ENCRYPTION_PASSPHRASE in the appropriate GitHub Actions secret scope.
  Generate/store these in a separate secure vault. The passphrase must be at
  least 32 characters. Test an actual **isolated restore** and independently
  retained backup; repository artifacts alone are not long-term disaster recovery.
- Create real Cloudflare Turnstile credentials for both authorized production
  domains, then set NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY
  in Vercel **Production**. Verify token rejection (missing, expired, wrong
  hostname or action) server-side before releasing.
- **Never paste API keys, backup URIs, decryption passphrases, or private keys
  into a PR, CI log, report, or chat.**

## Launch the audit

On a reviewed default branch containing this workflow, visit GitHub Actions >
**Production release preflight (read only)** > Run workflow. Specify the
number of the *current open PR* to audit. It records a JSON artifact named
release-preflight-result, retaining only metadata.

**Important first-install limitation:** GitHub only supports manual
workflow_dispatch for workflows already on its default branch. PR #867 is
installing this workflow; it is therefore not dispatchable until a reviewed
merge makes it available on main. During review, the script and its unit tests
still run in CI, while operators should verify external backup and Turnstile
state independently. Do **not** merge #867 solely to activate this gate.

Alternatively, from a reviewed, authorized environment with trusted
read-only tokens:

    node scripts/production-release-preflight.mjs \
      --repo erwinmehehe/virtualassistant-ph-webapp \
      --pr 867 --output release-preflight-result.json

Run with GITHUB_TOKEN and VERCEL_TOKEN in the process environment, **never**
as CLI arguments. An unavailable API or missing token results in BLOCKED.

## Exit codes and meanings

- 1: **BLOCKED**: one or more machine checks failed, or metadata unavailable.
- 2: **OPERATOR_REVIEW_REQUIRED**: machine checks passed, **not** approved.
- No 0/automatic approval path. Any upstream release system must fail closed.

## Limitations

The audit does not prove that the current keys are genuine, that Turnstile
challenges work in browsers, that real payment webhooks are settled, that
Google Calendar invitations arrive, or that backups are retained independently.
It does not replace deployment smoke tests, rollback rehearsal, or an operator
change-approval record.
