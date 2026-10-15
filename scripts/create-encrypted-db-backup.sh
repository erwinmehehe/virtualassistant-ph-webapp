#!/usr/bin/env bash
set -euo pipefail
umask 077

test -n "$SUPABASE_DB_URL" || { echo "SUPABASE_DB_URL is required" >&2; exit 1; }
test -n "$BACKUP_ENCRYPTION_PASSPHRASE" || { echo "Backup encryption passphrase is required" >&2; exit 1; }

output_dir="$1"
mkdir -p "$output_dir"
output_dir="$(cd "$output_dir" && pwd)"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
encrypted="$output_dir/vaph-production-$stamp.dump.enc"
stage="$(mktemp -d "$output_dir/.vaph-dump.XXXXXXXX")"
success=0
cleanup() {
  rm -rf "$stage"
  if [[ "$success" != "1" ]]; then rm -f "$encrypted" "$encrypted.sha256"; fi
}
trap cleanup EXIT

# Match the managed database's PostgreSQL major version. The dump contains
# the full database, including Supabase-managed Auth/Storage schema objects.
# Never put the connection URI or plaintext dump into console logs.
if ! docker run --rm --user "$(id -u):$(id -g)" \
  -e SUPABASE_DB_URL \
  -v "$stage:/backup" postgres:17 \
  sh -eu -c 'umask 077; pg_dump "$SUPABASE_DB_URL" --format=custom --no-owner --no-privileges --no-subscriptions --file=/backup/source.dump' \
  >"$stage/dump.log" 2>&1; then
  echo "Production pg_dump failed; raw diagnostic details withheld." >&2
  exit 1
fi
test -s "$stage/source.dump" || { echo "Database dump is empty." >&2; exit 1; }

openssl enc -aes-256-cbc -salt -pbkdf2 -iter 250000 \
  -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
  -in "$stage/source.dump" -out "$encrypted"

digest="$(sha256sum "$encrypted" | cut -d " " -f 1)"
printf '%s  %s\n' "$digest" "$(basename "$encrypted")" > "$encrypted.sha256"
success=1
printf '%s\n' "$encrypted"
