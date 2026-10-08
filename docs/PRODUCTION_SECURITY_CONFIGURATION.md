# Production protection and recovery checklist

Project: VirtualAssistant.com.ph. This runbook describes the checks that require account-owner credentials; never paste private keys, database URLs or passphrases into GitHub issues or chats.

## Backups: required operator configuration

The database is on Supabase Free. The repository already has a daily encrypted backup workflow with an isolated PostgreSQL restore test. It cannot run until **both** GitHub Actions secrets are configured.

1. In [Supabase](https://supabase.com/dashboard/project/ywkgcyilxhezrfxuwius), open **Connect** and obtain a production PostgreSQL connection string suitable for external backup. For GitHub-hosted runners use a supported **session-pooler** connection when direct IPv6 access is unavailable; require TLS.
2. In GitHub, open [Actions secrets and variables](https://github.com/erwinmehehe/virtualassistant-ph-webapp/settings/secrets/actions) and set **SUPABASE_DB_URL** to the complete connection string.
3. Generate a unique random **BACKUP_ENCRYPTION_PASSPHRASE** of at least 32 characters using a password manager. Add it as a second GitHub Actions secret; keep an independent recoverable copy outside the GitHub repository.
4. Manually trigger [Encrypted production database backup](https://github.com/erwinmehehe/virtualassistant-ph-webapp/actions/workflows/database-backup.yml) on main.
5. Confirm **Create encrypted production dump**, **Verify encrypted archive**, **Restore-test encrypted archive** and **Upload encrypted off-provider artifact** all pass. Check that the resulting artifact has only an encrypted dump and checksum, retained for 30 days.
6. Download the encrypted artifact and its checksum for an operator-managed recovery rehearsal as described in [PRODUCTION_DATABASE_BACKUP.md](PRODUCTION_DATABASE_BACKUP.md).

The **Production backup health alert** workflow automatically tracks the newest completed run. On failure or no successful run within 36 hours, it opens/updates a GitHub issue. After a recent backup and isolated restore succeed, it closes the issue. The monitor never needs database credentials and must not be confused with an actual backup.

## Turnstile: required operator configuration

The application already includes widgets and server-side Siteverify checks for relevant public forms, but the production Vercel project has no configured keys as of October 8, 2026.

1. In the [Cloudflare Turnstile dashboard](https://dash.cloudflare.com/?to=/:account/turnstile), create a **production** widget for **virtualassistant.com.ph** and **www.virtualassistant.com.ph** using the managed challenge mode. Keep preview/test widgets separate.
2. In [Vercel environment variables](https://vercel.com/dashboard), choose the linked VirtualAssistant production project. Set **NEXT_PUBLIC_TURNSTILE_SITE_KEY** to the widget's public site key for **Production** and **TURNSTILE_SECRET_KEY** to its private validation secret for **Production**.
3. Deploy a new production build from verified main so both variables are available; the public key is read by the server-rendered widget and the secret stays server-side.
4. Verify the widget renders on **/hire**, **/contact** and **/book-client-call**, and on signup/other protected public flows. Verify that a submission without a valid token is rejected, a real solved token is accepted once, and tokens with an unexpected action or hostname are rejected.
5. Confirm legitimate leads still land in CRM and use Cloudflare Turnstile Analytics to review challenges and Siteverify validation results. Do not switch the production deployment to Cloudflare testing keys.

Turnstile configuration is incomplete until both production keys and a real validation test have been verified. The form honeypot and rate limits are mitigations, not a substitute for an active challenge.

## Supabase password security

The connected Supabase organization is on **Free**. The platform's native leaked-password feature is Pro-only. Do not assume the Auth Security Advisor warning can be resolved by a SQL migration or by changing a UI toggle on Free.

The app also uses a server-side Have I Been Pwned k-anonymity check on account creation and password changes, plus 12+ character requirements. The app now refuses signup/password changes when the breach-check service is unavailable or replies with invalid data, instead of silently treating those passwords as clean. Existing accounts and any direct Supabase Auth flow that bypasses the app are not covered by this substitute.

For native enforcement across Auth entry points, an authorized account owner must upgrade the Supabase plan and enable **Prevent use of leaked passwords** in Auth settings. After any plan or Auth change, retest login, recovery, signup, workspace account password changes and training signup. Re-run the Supabase Security Advisor; do not label this item resolved until the warning clears.

Official references:
- [Supabase password security](https://supabase.com/docs/guides/auth/password-security)
- [Cloudflare Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Cloudflare Turnstile testing](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)
