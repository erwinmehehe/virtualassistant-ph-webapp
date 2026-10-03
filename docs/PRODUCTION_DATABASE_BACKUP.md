# Production database backup runbook

VAPH currently uses the Supabase Free plan, so managed daily database recovery is not available. Supabase recommends regular CLI/database dumps with an off-site copy for Free projects.

## Safety model

- The workflow never uploads a plaintext database dump.
- The dump is encrypted with AES-256-CBC + PBKDF2 before upload.
- The plaintext dump is deleted by a shell trap even when encryption fails.
- The encrypted artifact is retained for 2 days.
- The workflow is manual until production backup credentials are deliberately configured. This avoids a scheduled workflow appearing healthy while no backup exists.
- Archive verification checks both the encrypted-file checksum and whether PostgreSQL can parse the decrypted custom-format archive.

## Required GitHub Actions secrets

Configure these in the repository Actions secrets:

- `SUPABASE_DB_URL`: a production database connection string suitable for `pg_dump`. Prefer the Supavisor session-mode connection for backup operations.
- `BACKUP_ENCRYPTION_PASSPHRASE`: a unique random passphrase of at least 32 characters. Store a recovery copy outside GitHub.

Never commit either value.

## First backup

1. Open GitHub Actions → **Encrypted production database backup**.
2. Run the workflow manually.
3. Confirm the dump, encryption, checksum verification, archive verification, and artifact upload all pass.
4. Download the encrypted artifact to an authorized recovery location and confirm its checksum again.
5. Record the workflow run and backup timestamp in `AGENCY_RELEASE_READINESS.md`.

## Restore rehearsal

Archive verification is not a full restore rehearsal. Before launch sign-off, restore a decrypted backup into an isolated disposable PostgreSQL/Supabase environment, never over production.

1. Download the encrypted artifact and checksum.
2. Verify the checksum.
3. Decrypt it with `BACKUP_ENCRYPTION_PASSPHRASE`.
4. Restore into an isolated recovery target with PostgreSQL 17-compatible tooling.
5. Verify application-owned schemas, representative row counts, RLS/security-definer expectations, and a read-only application smoke test.
6. Destroy the recovery target and securely remove the decrypted dump.
7. Record the rehearsal date and outcome in release readiness.

Do not claim the backup launch gate is complete until both an off-site encrypted artifact and a successful isolated restore rehearsal are recorded.
