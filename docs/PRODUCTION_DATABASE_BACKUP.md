# Production database backup runbook

VAPH uses Supabase Free. A separate GitHub Actions workflow creates an encrypted off-provider PostgreSQL archive each day and rehearses recovery inside a disposable Supabase PostgreSQL container. The restore rehearsal never modifies production.

## Backup format

The supported backup is a complete PostgreSQL 17 **custom-format archive**, including application tables and Supabase-managed Auth and Storage database objects and rows. Its encrypted filename ends in **.dump.enc**.

- The production URI is used only for a PostgreSQL pg_dump export. A credential-safe read-only authentication check runs first.
- The dump runs in custom format with no owner, no privileges and no subscriptions, to avoid requiring destination-specific roles. Database-global roles and privileges are a separate recovery requirement.
- The plaintext dump is created with restricted permissions, encrypted using **AES-256-CBC and PBKDF2 (250,000 iterations)** and deleted from the temporary runner by a cleanup trap. Raw client diagnostics and plaintext content are never uploaded.
- A portable SHA-256 checksum uses the encrypted filename's basename so it can be verified after download.
- Only the encrypted archive and SHA-256 checksum are uploaded as GitHub Actions artifacts, retained for **30 days**.

Experimental older **.sql.tar.enc** artifacts came from an unsuccessful restore design. Do not use them as verified recovery points.

## Automated isolated restore

After encrypted archive verification and artifact upload, the job:

1. Starts a disposable database using **supabase/postgres:17.6.1.155**, matching the current production PostgreSQL engine version.
2. Waits for the disposable database's local Supabase administrator connection. It does not accept or use the production database URI for restoring.
3. Clears the preinitialized managed namespaces inside the disposable database, while preserving PostgreSQL's default **public** schema. This correctly handles the stock container's older Auth, Storage and pgbouncer objects.
4. Uses PostgreSQL's **pg_restore --no-owner --no-privileges --clean --if-exists --single-transaction --exit-on-error**. The clean phase also replaces preexisting publications and other database-level objects.
5. Verifies representative application tables, Auth user/session and Storage tables, and presence of public row-level security policies.
6. Destroys the disposable container, temporary plaintext files and anonymous volumes.

The proven isolated recovery approach passed with an existing encrypted production archive in [run #38745821871](https://github.com/erwinmehehe/virtualassistant-ph-webapp/actions/runs/38745821871).

A fresh end-to-end **PR-branch** encrypted production backup also passed all steps—including verification, artifact upload and isolated restore—in [run #38747301951](https://github.com/erwinmehehe/virtualassistant-ph-webapp/actions/runs/38747301951). The saved encrypted artifact is vaph-production-db-backup-38747301951, retained for 30 days. The permanent default-branch recovery gate is still pending merge and its first successful run on main.

**The production backup gate is met only when a default-branch run completes successfully**, including the isolated restore and encrypted artifact upload. An uploaded backup alone does not meet this gate. Failures keep the backup issue open.

## Scheduling and secrets

The workflow runs daily at **06:17 UTC**, supports manual dispatch, and runs after backup-code changes reach main. It requires these two GitHub Actions secrets:

- **SUPABASE_DB_URL** — actual VAPH database URI using session pooling and the real database password, not a placeholder.
- **BACKUP_ENCRYPTION_PASSPHRASE** — a different random passphrase of at least 32 characters, separately retained in a password manager.

Never paste database URLs or passphrases into source code, logs, GitHub issues or chats. No Vercel environment-variable changes are needed.

The **Production backup health alert** workflow checks GitHub Actions metadata and reports backup failures or restored backups older than 36 hours. A successful monitoring job is not proof of a verified backup.

## Manual recovery and limitations

**Never run pg_restore --clean against the current production database.** It destroys objects in its target database. Only use a separately approved, isolated recovery environment.

1. Download the encrypted archive and its SHA-256 sidecar from a successful default-branch backup run.
2. Load the stored recovery passphrase securely, without placing it into shell history.
3. Verify the artifact checksum, then decrypt it on a secure recovery machine:

   ~~~bash
   sha256sum --check vaph-production-TIMESTAMP.dump.enc.sha256
   openssl enc -d -aes-256-cbc -pbkdf2 -iter 250000 \
     -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
     -in vaph-production-TIMESTAMP.dump.enc \
     -out recovery.dump
   ~~~

4. Use **scripts/restore-test-db-backup.sh** and the encrypted archive to rehearse a new disposable restore. Never substitute a production URI as the restore target.
5. For a real recovery, plan PostgreSQL global roles, object ownership, grants, managed service versions and extensions separately. The automated content rehearsal deliberately disables owner/privilege restoration, and **does not prove production grants or role memberships have been rebuilt**.
6. Compare critical record counts, database migrations, Auth user records, and actual RLS behavior under relevant application roles.
7. Separately protect and recover Storage **object binaries** (not included in database SQL exports), Edge Functions, Vault encryption keys, JWT/API secrets, OAuth providers, SMTP, DNS and connected services.
8. Destroy decrypted exports and temporary recovery environments securely.

This test provides evidence of database **content/schema** restoration, not a complete Supabase platform disaster-recovery drill or deployed application UAT.

Official reference: [Supabase platform-to-self-hosted restore guidance](https://supabase.com/docs/guides/self-hosting/restore-from-platform).
