#!/usr/bin/env bash
set -euo pipefail
umask 077

: "${BACKUP_ENCRYPTION_PASSPHRASE:?BACKUP_ENCRYPTION_PASSPHRASE is required}"

encrypted="${1:?Path to encrypted .sql.tar.enc file is required}"
checksum="$encrypted.sha256"
test -f "$encrypted"
test -f "$checksum"
sha256sum --check "$checksum"

stage="$(mktemp -d)"
cleanup() { rm -rf "$stage"; }
trap cleanup EXIT

openssl enc -d -aes-256-cbc -pbkdf2 -iter 250000 \
  -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
  -in "$encrypted" \
  -out "$stage/backup.tar"

# A known three-file manifest protects against unexpected tar entries.
actual="$(tar -tf "$stage/backup.tar" | LC_ALL=C sort)"
expected="$(printf '%s\n' data.sql roles.sql schema.sql)"
if [[ "$actual" != "$expected" ]]; then
  echo "Backup bundle manifest is unexpected." >&2
  exit 1
fi

tar -xf "$stage/backup.tar" -C "$stage"
for name in roles.sql schema.sql data.sql; do
  test -f "$stage/$name"
  test -s "$stage/$name"
done

echo "Encrypted checksum and Supabase SQL bundle verified."
