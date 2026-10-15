#!/usr/bin/env bash
set -euo pipefail
umask 077

: "${BACKUP_ENCRYPTION_PASSPHRASE:?BACKUP_ENCRYPTION_PASSPHRASE is required}"

encrypted="${1:?Path to encrypted .sql.tar.enc file is required}"
image="${RESTORE_POSTGRES_IMAGE:-supabase/postgres:17.6.1.155}"
container_name="vaph-backup-restore-${GITHUB_RUN_ID:-$$}-$RANDOM"

test -f "$encrypted"
test -f "$encrypted.sha256"
(cd "$(dirname "$encrypted")" && sha256sum --check "$(basename "$encrypted").sha256")

stage="$(mktemp -d)"
cleanup() {
  docker rm -f "$container_name" >/dev/null 2>&1 || true
  rm -rf "$stage"
}
trap cleanup EXIT

openssl enc -d -aes-256-cbc -pbkdf2 -iter 250000 \
  -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
  -in "$encrypted" \
  -out "$stage/backup.tar"

actual="$(tar -tf "$stage/backup.tar" | LC_ALL=C sort)"
expected="$(printf '%s\n' data.sql roles.sql schema.sql)"
[[ "$actual" == "$expected" ]] || { echo "Unexpected backup bundle manifest." >&2; exit 1; }
tar -xf "$stage/backup.tar" -C "$stage"
for name in roles.sql schema.sql data.sql; do
  test -s "$stage/$name"
done

# Restoring happens ONLY inside this disposable Supabase Postgres container.
docker run -d --name "$container_name" \
  -e POSTGRES_PASSWORD=postgres \
  -v "$stage:/backup:ro" \
  "$image" >/dev/null

for _ in $(seq 1 90); do
  if docker exec "$container_name" pg_isready -U postgres -d postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
docker exec "$container_name" pg_isready -U postgres -d postgres >/dev/null

# Supabase's documented sequence: filtered roles/schema, then managed data.
# A single transaction and ON_ERROR_STOP ensure restore failures are fatal.
# Capture logs locally; SQL diagnostics may include sensitive row contents.
if ! docker exec "$container_name" psql \
  --no-psqlrc --username=postgres --dbname=postgres --single-transaction \
  --set=ON_ERROR_STOP=1 --set=VERBOSITY=verbose \
  --file=/backup/roles.sql \
  --file=/backup/schema.sql \
  --command='SET session_replication_role = replica' \
  --file=/backup/data.sql >"$stage/restore.log" 2>&1; then
  echo "Isolated Supabase SQL restore failed; raw SQL errors are withheld to protect data." >&2
  # Output only standardized five-character SQLSTATE codes, never SQL, row values or credentials.
  sqlstates="$(grep -Eo 'ERROR:[[:space:]]*[A-Z0-9]{5}' "$stage/restore.log" | sed -E 's/^ERROR:[[:space:]]*//' | LC_ALL=C sort -u | tr '\\n' ' ' || true)"
  if [[ -n "$sqlstates" ]]; then echo "PostgreSQL restore SQLSTATE codes: $sqlstates" >&2; fi
  # SQLSTATE and file/line are safe operational diagnostics. Do not echo SQL text.
  failure_point="$(sed -nE 's@.*psql:/backup/(roles|schema|data)\.sql:([0-9]+):.*@\1.sql line \2@p' "$stage/restore.log" | head -n 1 || true)"
  if [[ -n "$failure_point" ]]; then echo "First failing SQL location: $failure_point" >&2; fi
  if grep -Eq 'role "[^"]+" does not exist|role [^[:space:]]+ does not exist' "$stage/restore.log"; then
    echo "The recovery container is missing a referenced PostgreSQL role." >&2
    # Known managed Supabase role names are non-secret. Never print arbitrary values.
    for role in anon authenticated authenticator dashboard_user service_role supabase_admin supabase_auth_admin supabase_etl_admin supabase_functions_admin supabase_privileged_role supabase_read_only_user supabase_realtime_admin supabase_replication_admin supabase_storage_admin; do
      if grep -Fq "role \"$role\" does not exist" "$stage/restore.log"; then
        echo "Missing managed role: $role" >&2
        break
      fi
    done
  elif grep -Eqi 'unrecognized configuration parameter|configuration parameter .* does not exist' "$stage/restore.log"; then
    echo "The target Postgres lacks a referenced database configuration parameter." >&2
  elif grep -Eqi 'database .* does not exist' "$stage/restore.log"; then
    echo "The target Postgres lacks a referenced database." >&2
  fi
  # Report only the known backup file and the kind of missing object. Never echo SQL text.
  if grep -q '/backup/roles.sql:' "$stage/restore.log"; then
    echo "Restore stopped in roles.sql." >&2
  elif grep -q '/backup/schema.sql:' "$stage/restore.log"; then
    echo "Restore stopped in schema.sql." >&2
  elif grep -q '/backup/data.sql:' "$stage/restore.log"; then
    echo "Restore stopped in data.sql." >&2
  fi
  if grep -Eq 'role "[^"]+" does not exist|role [^[:space:]]+ does not exist' "$stage/restore.log"; then
    echo "Restore target is missing a referenced PostgreSQL role." >&2
  elif grep -Eq 'extension "[^"]+" does not exist|extension [^[:space:]]+ does not exist' "$stage/restore.log"; then
    echo "Restore target is missing a referenced PostgreSQL extension." >&2
  elif grep -Eq 'type "[^"]+" does not exist|type [^[:space:]]+ does not exist' "$stage/restore.log"; then
    echo "Restore target is missing a referenced PostgreSQL type." >&2
  elif grep -Eq 'function .* does not exist' "$stage/restore.log"; then
    echo "Restore target is missing a referenced PostgreSQL function." >&2
  elif grep -Eq 'schema "[^"]+" does not exist' "$stage/restore.log"; then
    echo "Restore target is missing a referenced PostgreSQL schema." >&2
  fi
  if grep -qi 'does not exist' "$stage/restore.log"; then
    echo "A required object is missing from the disposable target; check target schema initialization." >&2
  elif grep -qi 'already exists' "$stage/restore.log"; then
    echo "A target schema object already exists; confirm filtered CLI schema exports." >&2
  elif grep -qi 'permission denied' "$stage/restore.log"; then
    echo "The isolated target denied an SQL operation." >&2
  fi
  exit 1
fi

docker exec "$container_name" psql -X -U postgres -d postgres -v ON_ERROR_STOP=1 -Atc \
  "select to_regclass('public.lead_intake') is not null;" | grep -qx t

docker exec "$container_name" psql -X -U postgres -d postgres -v ON_ERROR_STOP=1 -Atc \
  "select count(*) >= 1 from pg_tables where schemaname='public';" | grep -qx t

docker exec "$container_name" psql -X -U postgres -d postgres -v ON_ERROR_STOP=1 -Atc \
  "select to_regclass('auth.users') is not null;" | grep -qx t

docker exec "$container_name" psql -X -U postgres -d postgres -v ON_ERROR_STOP=1 -Atc \
  "select count(*) >= 1 from pg_policies where schemaname='public';" | grep -qx t

echo "Supabase SQL backup restored successfully into a disposable database."
