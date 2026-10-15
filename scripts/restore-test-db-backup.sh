#!/usr/bin/env bash
set -euo pipefail
umask 077

test -n "$BACKUP_ENCRYPTION_PASSPHRASE" || { echo "Backup encryption passphrase is required" >&2; exit 1; }
encrypted="$1"
image="$RESTORE_POSTGRES_IMAGE"
test -f "$encrypted"
test -f "$encrypted.sha256"
(cd "$(dirname "$encrypted")" && sha256sum --check "$(basename "$encrypted.sha256")")

stage="$(mktemp -d)"
container_name="vaph-full-restore-$$-$RANDOM"
cleanup() {
  docker rm -fv "$container_name" >/dev/null 2>&1 || true
  rm -rf "$stage"
}
trap cleanup EXIT

openssl enc -d -aes-256-cbc -pbkdf2 -iter 250000 \
  -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
  -in "$encrypted" -out "$stage/source.dump"

# A disposable Postgres container with the same version as VAPH production.
# The production DB URI is NEVER used or required for this script.
docker run -d --name "$container_name" -e POSTGRES_PASSWORD=postgres \
  -v "$stage:/backup:ro" "$image" >/dev/null

# The image starts its Unix socket before the Supabase admin TCP connection.
# Wait for the connection that the proven restore path actually uses.
ready=0
for _ in $(seq 1 90); do
  if docker exec -e PGPASSWORD=postgres "$container_name" \
    psql -X -h 127.0.0.1 -U supabase_admin -d postgres -Atc "SELECT 1" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done
[[ "$ready" == "1" ]] || { echo "Disposable PostgreSQL admin connection did not become ready." >&2; exit 1; }

# The stock Supabase Postgres image includes partial, older managed schemas.
# In the disposable database only, remove these so the complete raw archive
# can create the matching hosted Auth/Storage objects. Preserve "public":
# Postgres custom dumps expect that default schema to exist. The regex's
# underscore is literal; LIKE 'pg_%' incorrectly excludes pgbouncer.
if ! docker exec -e PGPASSWORD=postgres "$container_name" \
  psql -X -h 127.0.0.1 -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -Atc \
  "SELECT format('DROP SCHEMA IF EXISTS %I CASCADE;', nspname) FROM pg_namespace WHERE nspname !~ '^pg_' AND nspname NOT IN ('information_schema','public');" \
  >"$stage/clean.sql" 2>"$stage/clean-query.log"; then
  echo "Disposable schema reset preparation failed." >&2
  exit 1
fi
if ! docker exec -e PGPASSWORD=postgres "$container_name" \
  psql -X -h 127.0.0.1 -U supabase_admin -d postgres -v ON_ERROR_STOP=1 \
  -f /backup/clean.sql >"$stage/clean.log" 2>&1; then
  echo "Disposable schema reset failed." >&2
  exit 1
fi

# --clean/--if-exists also removes publications and other database-level
# bootstrap objects that don't belong to a schema. Both phases are confined
# to the disposable container, and any SQL error fails the rehearsal.
if ! docker exec -e PGPASSWORD=postgres "$container_name" \
  pg_restore --host=127.0.0.1 --username=supabase_admin --dbname=postgres \
    --no-owner --no-privileges --clean --if-exists \
    --single-transaction --exit-on-error /backup/source.dump \
  >"$stage/restore.log" 2>&1; then
  echo "Isolated full archive restore failed; SQL error details withheld." >&2
  safe_error="$(sed -n '/ERROR:/{s/.*ERROR:[[:space:]]*//;p;q;}' "$stage/restore.log" | sed -E 's/"[^"]*"/[identifier]/g' | cut -c 1-160)"
  if [[ -n "$safe_error" ]]; then echo "Sanitized PostgreSQL error: $safe_error" >&2; fi
  exit 1
fi

# Verify restored application-owned schema, managed Auth/Storage objects, and
# security policies. The pg_restore exit status proves every selected DDL and
# data command completed without being skipped.
result="$(docker exec -e PGPASSWORD=postgres "$container_name" \
  psql -X -h 127.0.0.1 -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -Atc \
  "SELECT (to_regclass('public.lead_intake') IS NOT NULL)::text ||
          '|' || (to_regclass('auth.users') IS NOT NULL)::text ||
          '|' || (to_regclass('auth.sessions') IS NOT NULL)::text ||
          '|' || (to_regclass('storage.objects') IS NOT NULL)::text ||
          '|' || (SELECT count(*) > 0 FROM pg_policies WHERE schemaname='public')::text;")"
[[ "$result" == "true|true|true|true|true" ]] || {
  echo "Recovered application/Auth/Storage/RLS checks did not all pass." >&2
  exit 1
}
echo "Encrypted FULL database archive restored in isolation; application, Auth, Storage and RLS checks passed."
