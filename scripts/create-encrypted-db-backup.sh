#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is required}"
: "${BACKUP_ENCRYPTION_PASSPHRASE:?BACKUP_ENCRYPTION_PASSPHRASE is required}"

output_dir="${1:-backup}"
mkdir -p "$output_dir"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
plain="$output_dir/vaph-production-$stamp.dump"
encrypted="$plain.enc"

cleanup() {
  rm -f "$plain"
}
trap cleanup EXIT

docker run --rm \
  -e SUPABASE_DB_URL \
  -v "$PWD/$output_dir:/backup" \
  postgres:17 \
  sh -eu -c 'pg_dump "$SUPABASE_DB_URL" --format=custom --no-owner --no-privileges --no-subscriptions --file="/backup/'"$(basename "$plain")"'"'

openssl enc -aes-256-cbc -salt -pbkdf2 -iter 250000 \
  -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
  -in "$plain" \
  -out "$encrypted"

sha256sum "$encrypted" > "$encrypted.sha256"
printf '%s\n' "$encrypted"
