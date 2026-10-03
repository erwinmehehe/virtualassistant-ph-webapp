#!/usr/bin/env bash
set -euo pipefail

: "${BACKUP_ENCRYPTION_PASSPHRASE:?BACKUP_ENCRYPTION_PASSPHRASE is required}"

encrypted="${1:?Path to encrypted .dump.enc file is required}"
checksum="$encrypted.sha256"
test -f "$encrypted"
test -f "$checksum"
sha256sum --check "$checksum"

tmp="$(mktemp --suffix=.dump)"
cleanup() {
  rm -f "$tmp"
}
trap cleanup EXIT

openssl enc -d -aes-256-cbc -pbkdf2 -iter 250000 \
  -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
  -in "$encrypted" \
  -out "$tmp"

docker run --rm \
  -v "$tmp:/backup/vaph.dump:ro" \
  postgres:17 \
  pg_restore --list /backup/vaph.dump >/dev/null

echo "Encrypted backup checksum and PostgreSQL archive structure verified."
