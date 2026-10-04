#!/usr/bin/env bash
set -euo pipefail

SUPABASE_CLI_VERSION="${SUPABASE_CLI_VERSION:-2.113.0}"
BASELINE_MIGRATION="supabase/migrations/20260806000000_e2e_baseline.sql"

supabase_cli() {
  npx -y "supabase@${SUPABASE_CLI_VERSION}" "$@"
}

cleanup() {
  rm -f "$BASELINE_MIGRATION"
}
trap cleanup EXIT

if [ -e "$BASELINE_MIGRATION" ]; then
  echo "Refusing to overwrite $BASELINE_MIGRATION" >&2
  exit 1
fi

echo "Staging schema.sql as a local-only pre-migration baseline..."
cp supabase/schema.sql "$BASELINE_MIGRATION"

echo "Starting isolated Supabase with the baseline followed by every real migration..."
supabase_cli start -x studio,imgproxy,realtime,storage-api,postgres-meta,edge-runtime,logflare,vector,supavisor

supabase_cli status -o env > .supabase-e2e.env

echo "Local Supabase baseline + migrations are ready."
