# Production database backup runbook

VAPH currently uses the Supabase Free plan, so managed daily recovery points are not available. Supabase recommends regular database dumps with an off-site copy for Free projects.

## Safety model

- The workflow never uploads a plaintext database dump.
- The dump is encrypted with AES-256-CBC + PBKDF2 before upload.
- The plaintext dump is deleted by a shell trap even when encryption fails.
- The workflow runs daily and can also be started manually.
- A push that changes the backup workflow or scripts on `main` triggers an immediate backup, so backup changes are validated in production rather than waiting for the next cron.
- The encrypted artifact is stored outside Supabase in GitHub Actions and retained for 30 days.
- Archive verification checks both the encrypted-file checksum and whether PostgreSQL can parse the decrypted custom-format archive.
- Every backup is then restored into an isolated disposable Supabase Postgres environment. The restore must complete with `--exit-on-error`, and the restored database must contain the public schema and `public.lead_intake`.

## Required GitHub Actions secrets

Configure these in the repository Actions secrets:

- `SUPABASE_DB_URL`: a production database connection string suitable for `pg_dump`. Prefer a supported session-mode connection for backup operations.
- `BACKUP_ENCRYPTION_PASSPHRASE`: a unique random passphrase of at least 32 characters. Store a recovery copy outside GitHub.

Never commit either value. The workflow fails closed if either secret is missing.

## Backup verification

A successful workflow run proves all of the following for that backup:

1. Production can be dumped with PostgreSQL 17-compatible tooling.
2. The plaintext dump is encrypted before persistence.
3. The encrypted artifact checksum is valid.
4. PostgreSQL can parse the decrypted archive.
5. The archive can be restored into an isolated disposable Supabase Postgres environment.
6. The restored database contains representative application-owned objects.
7. The encrypted artifact is retained off-provider for 30 days.

## Recovery procedure

For a real recovery:

1. Download the most recent successful encrypted backup artifact and checksum from GitHub Actions.
2. Verify the checksum.
3. Decrypt with the recovery copy of `BACKUP_ENCRYPTION_PASSPHRASE`.
4. Restore into a non-production recovery target first.
5. Verify representative row counts, RLS/security-definer expectations, and application read paths.
6. Only after verification, choose the production recovery strategy and planned downtime.
7. Securely destroy temporary decrypted dumps and disposable recovery environments.

Do not claim the backup launch gate is complete until the scheduled workflow has produced at least one encrypted off-provider artifact and its automated isolated restore rehearsal has passed.
