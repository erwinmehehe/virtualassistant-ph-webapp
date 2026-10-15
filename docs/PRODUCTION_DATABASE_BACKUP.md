# Production database backup runbook

VAPH uses a Supabase Free plan, so managed point-in-time recovery is not available on this tier. The **Encrypted production database backup** GitHub Actions workflow creates a portable, encrypted database export and tests it against a disposable Supabase-compatible PostgreSQL instance.

## Backup format

As of PR #902, the workflow follows Supabase's documented recovery approach rather than attempting to restore a raw `pg_dump` of Supabase-managed schemas. The current bundle contains:

- `roles.sql` — Supabase CLI role-only export, including non-reserved roles.
- `schema.sql` — application schema objects, including tables, functions, triggers, and RLS policies; Supabase CLI excludes conflicting managed schema DDL.
- `data.sql` — data export, including applicable managed table data (e.g. Auth users), with PostgreSQL COPY format.

The SQL files are bundled into `vaph-production-TIMESTAMP.sql.tar`, then encrypted as `.sql.tar.enc` using AES-256-CBC with PBKDF2 (250,000 iterations). The workflow produces a SHA-256 checksum beside the encrypted file. The plaintext SQL files and tar archive are removed from the runner when the script exits. **Only the encrypted archive and checksum are uploaded**, retained as a GitHub Actions artifact for 30 days.

The workflow pins Supabase CLI 2.121.0 and its setup action to a specific commit. Pin upgrades should go through a tested PR. The production connection secret remains in GitHub Actions and must never be logged, copied into the repository, or sent through chat.

Older artifacts ending in `.dump.enc` (before PR #902) are **raw PostgreSQL custom-format dumps**, not the current portable SQL-tar format. They require the old custom-archive recovery process and must not be treated as compatible with the new SQL bundle restoration script.

## Safety and success criteria

- The workflow is scheduled daily at 06:17 UTC, allows a manual dispatch, and runs on changes to its backup scripts on `main`.
- Both `SUPABASE_DB_URL` and `BACKUP_ENCRYPTION_PASSPHRASE` are mandatory. The encryption passphrase must have 32+ characters; keep a recovery copy outside GitHub.
- A credential-safe preflight checks the Supabase session-pooler URI and runs a read-only query. It does not disclose credentials.
- All three Supabase CLI exports must finish successfully and be nonempty.
- The verified encrypted archive is uploaded **before** the restore rehearsal. If the restore test fails, the job still fails; the encrypted archive remains available for forensic analysis or recovery.
- Verification checks the SHA-256 digest, decryptability, exact three-file manifest, and nonempty SQL files.
- The restore test starts a disposable Supabase PostgreSQL container and imports roles, schema, and data with `psql --single-transaction --set=ON_ERROR_STOP=1`. It tests representative application tables, Auth schema availability, and RLS policies. The disposable database is destroyed afterward.
- **A retained archive alone is not a verified recovery point.** The production backup gate is met only when a default-branch run completes successfully, including the isolated restore and encrypted artifact upload.

These logical exports cover the database; they do **not** capture Storage object binaries, API/JWT encryption roots, OAuth/email provider configuration, deployed Edge Functions, DNS, or external integrations. Protect and separately back up those dependencies. A disposable database restore proves logical recovery, not a complete application disaster-recovery drill.

## Required GitHub Actions secrets

In repository Settings → Secrets and variables → Actions:

- `SUPABASE_DB_URL`: complete database URI for the actual VAPH Supabase project. Use a session-pooler connection and a real database password, not a placeholder.
- `BACKUP_ENCRYPTION_PASSPHRASE`: independent random passphrase of at least 32 characters, backed up in your password manager.

GitHub cannot display existing secret values; never reset the production database password just for a backup job unless a controlled credential-rotation procedure requires it.

## Health monitoring

The **Production backup health alert** workflow tracks completed default-branch backups and opens or updates the **Production database backup needs attention** issue when the most recent verified run failed or no successful, restored backup exists within 36 hours. Green monitoring alone does not prove the backup gate passed.

## Non-production recovery procedure

1. Download the most recent **successful and fully restored** GitHub Actions encrypted artifact and checksum. Check that its name ends with `.sql.tar.enc` (not the older `.dump.enc`).
2. On a secure, access-controlled recovery machine, export `BACKUP_ENCRYPTION_PASSPHRASE` from your password manager. Never place the passphrase in command history, source files, or messages.
3. In the artifact directory, verify and decrypt:

   ```bash
   sha256sum --check vaph-production-TIMESTAMP.sql.tar.enc.sha256
   openssl enc -d -aes-256-cbc -pbkdf2 -iter 250000 \
     -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
     -in vaph-production-TIMESTAMP.sql.tar.enc \
     -out recovery.sql.tar
   mkdir -p recovery
   tar -xf recovery.sql.tar -C recovery
   ```

4. Provision a **new, isolated, non-production Supabase-compatible** target with a compatible PostgreSQL 17 setup and the required extensions. Do not point `RESTORE_DB_URL` to the production project.
5. From the recovery machine, run the restore with credentials for that isolated target:

   ```bash
   psql --single-transaction --set=ON_ERROR_STOP=1 \
     --file=recovery/roles.sql \
     --file=recovery/schema.sql \
     --command='SET session_replication_role = replica' \
     --file=recovery/data.sql \
     --dbname="$RESTORE_DB_URL"
   ```

6. Validate application-owned table counts, RLS policy behavior, Auth user metadata, migrations, and representative application reads on the isolated target. Separately validate how Storage objects, Auth settings, Vault/encryption keys, OAuth, functions, and external services would be recovered.
7. Only after independent review plan any production recovery and downtime. Securely destroy local decrypted dumps and the disposable environment.

See the official [Supabase platform-to-self-hosted recovery guide](https://supabase.com/docs/guides/self-hosting/restore-from-platform) and [CLI backup/restore instructions](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).
