#!/usr/bin/env bash
set -euo pipefail
umask 077

test -n "$BACKUP_ENCRYPTION_PASSPHRASE" || { echo "Backup encryption passphrase is required" >&2; exit 1; }
encrypted="$1"
checksum="$encrypted.sha256"
test -f "$encrypted"
test -f "$checksum"
(cd "$(dirname "$encrypted")" && sha256sum --check "$(basename "$checksum")")

stage="$(mktemp -d)"
cleanup() { rm -rf "$stage"; }
trap cleanup EXIT

openssl enc -d -aes-256-cbc -pbkdf2 -iter 250000 \
  -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
  -in "$encrypted" -out "$stage/archive.dump"

# Verify the custom-format PostgreSQL archive without extracting any records
# into the GitHub Actions output.
if ! docker run --rm --user "$(id -u):$(id -g)" -v "$stage:/restore:ro" postgres:17 \
  pg_restore --list /restore/archive.dump >"$stage/verify.log" 2>&1; then
  echo "Encrypted PostgreSQL archive structure verification failed." >&2
  exit 1
fi
echo "Encrypted checksum and PostgreSQL custom archive verified."
