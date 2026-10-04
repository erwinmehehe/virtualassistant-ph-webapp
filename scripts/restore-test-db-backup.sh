#!/usr/bin/env bash
set -euo pipefail

: "${BACKUP_ENCRYPTION_PASSPHRASE:?BACKUP_ENCRYPTION_PASSPHRASE is required}"

encrypted="${1:?Path to encrypted .dump.enc file is required}"
image="${RESTORE_POSTGRES_IMAGE:-supabase/postgres:17.6.1.155}"
container_name="vaph-backup-restore-${GITHUB_RUN_ID:-$$}-${RANDOM}"

test -f "$encrypted"
test -f "$encrypted.sha256"
sha256sum --check "$encrypted.sha256"

tmp="$(mktemp --suffix=.dump)"
cleanup() {
  rm -f "$tmp"
  docker rm -f "$container_name" >/dev/null 2>&1 || true
}
trap cleanup EXIT

openssl enc -d -aes-256-cbc -pbkdf2 -iter 250000 \
  -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
  -in "$encrypted" \
  -out "$tmp"

docker run -d --name "$container_name" \
  -e POSTGRES_PASSWORD=postgres \
  -v "$tmp:/backup/vaph.dump:ro" \
  "$image" >/dev/null

for _ in $(seq 1 90); do
  if docker exec "$container_name" pg_isready -U postgres -d postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

docker exec "$container_name" pg_isready -U postgres -d postgres >/dev/null
docker exec "$container_name" createdb -U postgres vaph_restore_test

docker exec "$container_name" pg_restore \
  --exit-on-error \
  --no-owner \
  --no-privileges \
  --dbname=vaph_restore_test \
  /backup/vaph.dump

docker exec "$container_name" psql -U postgres -d vaph_restore_test -v ON_ERROR_STOP=1 -Atc \
  "select to_regclass('public.lead_intake') is not null;" \
  | grep -qx "t"

docker exec "$container_name" psql -U postgres -d vaph_restore_test -v ON_ERROR_STOP=1 -Atc \
  "select count(*) > 0 from pg_tables where schemaname='public';" \
  | grep -qx "t"

echo "Encrypted backup restored successfully into an isolated Supabase Postgres container."
