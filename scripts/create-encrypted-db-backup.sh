#!/usr/bin/env bash
set -euo pipefail
umask 077

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is required}"
: "${BACKUP_ENCRYPTION_PASSPHRASE:?BACKUP_ENCRYPTION_PASSPHRASE is required}"

output_dir="${1:-backup}"
mkdir -p "$output_dir"
output_dir="$(cd "$output_dir" && pwd)"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
plain="$output_dir/vaph-production-$stamp.sql.tar"
encrypted="$plain.enc"
stage="$(mktemp -d "$output_dir/.vaph-backup-stage.XXXXXXXX")"

cleanup() {
  rm -rf "$stage"
  rm -f "$plain"
}
trap cleanup EXIT

# Supabase CLI applies its official managed-schema exclusions. The separate
# roles, schema, and data files are needed for an isolated recovery test.
dump_sql() {
  local label="$1"
  shift
  # CLI diagnostics may include credentials. Never echo the raw output.
  if ! supabase db dump --db-url "$SUPABASE_DB_URL" -f "$stage/$label.sql" "$@" >"$stage/$label.log" 2>&1; then
    echo "Supabase $label export failed. No plaintext artifact was uploaded." >&2
    return 1
  fi
  if [[ ! -s "$stage/$label.sql" ]]; then
    echo "Supabase $label export was empty; refusing incomplete backup." >&2
    return 1
  fi
  echo "Supabase $label export completed."
}

dump_sql roles --role-only
dump_sql schema
dump_sql data --use-copy --data-only

tar --format=ustar -C "$stage" -cf "$plain" roles.sql schema.sql data.sql

openssl enc -aes-256-cbc -salt -pbkdf2 -iter 250000 \
  -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
  -in "$plain" \
  -out "$encrypted"

sha256sum "$encrypted" > "$encrypted.sha256"
printf '%s\n' "$encrypted"
